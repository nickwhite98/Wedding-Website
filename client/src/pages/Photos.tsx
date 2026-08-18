import { useCallback, useEffect, useRef, useState } from "react";
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Dialog,
  IconButton,
  LinearProgress,
  Paper,
  Typography,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import AddPhotoAlternateIcon from "@mui/icons-material/AddPhotoAlternate";
import PlayCircleOutlineIcon from "@mui/icons-material/PlayCircleOutline";
import CloseIcon from "@mui/icons-material/Close";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import { colors } from "../theme";
import {
  photoApi,
  uploadToUrl,
  createThumbnail,
  type PhotoItem,
} from "../services/photo.service";

const MAX_FILE_BYTES = 1024 * 1024 * 1024;
const UPLOAD_CONCURRENCY = 3;
const SWIPE_NAVIGATE_THRESHOLD = 60;
const SWIPE_DISMISS_THRESHOLD = 100;

interface UploadTask {
  id: number;
  fileName: string;
  progress: number; // 0..1
  status: "uploading" | "done" | "error";
  error?: string;
}

const isVideo = (contentType: string) => contentType.startsWith("video/");

export const Photos = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const [photos, setPhotos] = useState<PhotoItem[] | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [tasks, setTasks] = useState<UploadTask[]>([]);
  const [viewingIndex, setViewingIndex] = useState<number | null>(null);
  // Live drag offset while a touch gesture is in progress (x = navigate, y = dismiss).
  const [drag, setDrag] = useState<{ dx: number; dy: number } | null>(null);
  const touchRef = useRef<{ startX: number; startY: number; axis: "x" | "y" | null } | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const taskIdRef = useRef(0);

  const loadPhotos = useCallback(async () => {
    try {
      const items = await photoApi.list();
      setPhotos(items);
      setLoadError(null);
    } catch (err) {
      setLoadError(
        err instanceof Error ? err.message : "Failed to load photos",
      );
      setPhotos([]);
    }
  }, []);

  useEffect(() => {
    // False positive: loadPhotos only sets state after its fetch resolves.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadPhotos();
  }, [loadPhotos]);

  const updateTask = (id: number, patch: Partial<UploadTask>) => {
    setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, ...patch } : t)));
  };

  const uploadOne = async (file: File, taskId: number) => {
    if (file.size > MAX_FILE_BYTES) {
      updateTask(taskId, {
        status: "error",
        error: "Larger than the 1GB limit",
      });
      return;
    }
    try {
      const thumb = await createThumbnail(file);
      const presigned = await photoApi.presign(file, thumb !== null);
      await uploadToUrl(
        presigned.uploadUrl,
        file,
        file.type || "application/octet-stream",
        (fraction) => updateTask(taskId, { progress: fraction }),
      );
      if (thumb && presigned.thumbUploadUrl) {
        await uploadToUrl(presigned.thumbUploadUrl, thumb, "image/jpeg");
      }
      await photoApi.confirm(
        presigned.objectKey,
        thumb ? presigned.thumbKey : null,
      );
      updateTask(taskId, { status: "done", progress: 1 });
    } catch (err) {
      updateTask(taskId, {
        status: "error",
        error: err instanceof Error ? err.message : "Upload failed",
      });
    }
  };

  const handleFiles = async (fileList: FileList | null) => {
    if (!fileList || fileList.length === 0) return;
    const files = Array.from(fileList);
    if (inputRef.current) inputRef.current.value = "";

    const newTasks = files.map((file) => ({
      id: ++taskIdRef.current,
      fileName: file.name,
      progress: 0,
      status: "uploading" as const,
    }));
    setTasks((prev) => [...prev.filter((t) => t.status !== "done"), ...newTasks]);

    // Upload a few at a time so one giant video doesn't block everything.
    const queue = files.map((file, i) => ({ file, taskId: newTasks[i].id }));
    const workers = Array.from(
      { length: Math.min(UPLOAD_CONCURRENCY, queue.length) },
      async () => {
        let next: { file: File; taskId: number } | undefined;
        while ((next = queue.shift())) {
          await uploadOne(next.file, next.taskId);
        }
      },
    );
    await Promise.all(workers);
    await loadPhotos();
  };

  const uploading = tasks.some((t) => t.status === "uploading");

  const viewing =
    viewingIndex !== null && photos ? (photos[viewingIndex] ?? null) : null;
  const hasPrev = viewingIndex !== null && viewingIndex > 0;
  const hasNext =
    viewingIndex !== null && photos !== null && viewingIndex < photos.length - 1;

  const closeViewer = () => {
    setViewingIndex(null);
    setDrag(null);
    touchRef.current = null;
  };
  const goPrev = () => {
    setDrag(null);
    setViewingIndex((i) => (i !== null && i > 0 ? i - 1 : i));
  };
  const goNext = () => {
    setDrag(null);
    setViewingIndex((i) =>
      i !== null && photos && i < photos.length - 1 ? i + 1 : i,
    );
  };

  const onTouchStart = (e: React.TouchEvent) => {
    const t = e.touches[0];
    touchRef.current = { startX: t.clientX, startY: t.clientY, axis: null };
  };
  const onTouchMove = (e: React.TouchEvent) => {
    const info = touchRef.current;
    if (!info) return;
    const t = e.touches[0];
    const dx = t.clientX - info.startX;
    const dy = t.clientY - info.startY;
    // Lock onto the dominant axis once the finger has clearly moved.
    if (!info.axis) {
      if (Math.abs(dx) < 10 && Math.abs(dy) < 10) return;
      info.axis = Math.abs(dx) >= Math.abs(dy) ? "x" : "y";
    }
    if (info.axis === "x") {
      setDrag({ dx, dy: 0 });
    } else {
      setDrag({ dx: 0, dy: Math.max(0, dy) }); // only drag downward to dismiss
    }
  };
  const onTouchEnd = () => {
    const info = touchRef.current;
    touchRef.current = null;
    if (!info || !drag) {
      setDrag(null);
      return;
    }
    if (info.axis === "x") {
      if (drag.dx < -SWIPE_NAVIGATE_THRESHOLD && hasNext) goNext();
      else if (drag.dx > SWIPE_NAVIGATE_THRESHOLD && hasPrev) goPrev();
      else setDrag(null);
    } else if (drag.dy > SWIPE_DISMISS_THRESHOLD) {
      closeViewer();
    } else {
      setDrag(null);
    }
  };

  return (
    <Box sx={{ textAlign: "center" }}>
      <Paper
        elevation={0}
        sx={{
          backgroundColor: colors.cream,
          borderRadius: 0,
          p: { xs: 3, md: 4 },
          mt: 2,
        }}
      >
        <Typography
          variant="body1"
          sx={{ color: colors.body, mb: 4, maxWidth: 520, mx: "auto" }}
        >
          Help us capture the weekend! Share your photos and videos here, and
          browse everyone else's favorite moments.
        </Typography>

        <Box sx={{ mb: 2 }}>
          <Button
            variant="contained"
            size="large"
            startIcon={
              uploading ? (
                <CircularProgress size={18} sx={{ color: "white" }} />
              ) : (
                <AddPhotoAlternateIcon />
              )
            }
            disabled={uploading}
            onClick={() => inputRef.current?.click()}
          >
            {uploading ? "Uploading..." : "Add Photos & Videos"}
          </Button>
          <input
            ref={inputRef}
            type="file"
            accept="image/*,video/*"
            multiple
            hidden
            onChange={(e) => handleFiles(e.target.files)}
          />
        </Box>

        {tasks.length > 0 && (
          <Box sx={{ maxWidth: 560, mx: "auto", mb: 4, textAlign: "left" }}>
            {tasks.map((task) => (
              <Box key={task.id} sx={{ mb: 1 }}>
                <Typography
                  variant="caption"
                  sx={{
                    color: task.status === "error" ? "error.main" : colors.body,
                    display: "block",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {task.fileName}
                  {task.status === "done" && " — uploaded ✓"}
                  {task.status === "error" && ` — ${task.error}`}
                </Typography>
                {task.status === "uploading" && (
                  <LinearProgress
                    variant="determinate"
                    value={task.progress * 100}
                    sx={{ borderRadius: 1 }}
                  />
                )}
              </Box>
            ))}
          </Box>
        )}

        {loadError && (
          <Alert severity="error" sx={{ maxWidth: 560, mx: "auto", mb: 3 }}>
            {loadError}
          </Alert>
        )}

        {photos === null ? (
          <CircularProgress sx={{ color: colors.olive, my: 6 }} />
        ) : photos.length === 0 && !loadError ? (
          <Typography variant="body1" sx={{ color: colors.body, my: 6 }}>
            No photos yet — be the first to share!
          </Typography>
        ) : (
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: {
                xs: "repeat(2, 1fr)",
                sm: "repeat(3, 1fr)",
                md: "repeat(4, 1fr)",
              },
              gap: 1.5,
              maxWidth: 1000,
              mx: "auto",
            }}
          >
            {photos.map((photo, index) => (
              <Box
                key={photo.id}
                onClick={() => setViewingIndex(index)}
                sx={{
                  position: "relative",
                  aspectRatio: "1",
                  borderRadius: 2,
                  overflow: "hidden",
                  cursor: "pointer",
                  backgroundColor: colors.warmIvory,
                  "&:hover img": { transform: "scale(1.05)" },
                }}
              >
                {photo.thumbUrl ? (
                  <Box
                    component="img"
                    src={photo.thumbUrl}
                    alt="Wedding photo"
                    loading="lazy"
                    sx={{
                      width: "100%",
                      height: "100%",
                      objectFit: "cover",
                      transition: "transform 0.2s ease",
                    }}
                  />
                ) : !isVideo(photo.contentType) ? (
                  <Box
                    component="img"
                    src={photo.url}
                    alt="Wedding photo"
                    loading="lazy"
                    sx={{
                      width: "100%",
                      height: "100%",
                      objectFit: "cover",
                      transition: "transform 0.2s ease",
                    }}
                  />
                ) : (
                  <Box
                    sx={{
                      width: "100%",
                      height: "100%",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      backgroundColor: colors.sage,
                    }}
                  >
                    <PlayCircleOutlineIcon sx={{ fontSize: 48, color: "white" }} />
                  </Box>
                )}
                {isVideo(photo.contentType) && photo.thumbUrl && (
                  <PlayCircleOutlineIcon
                    sx={{
                      position: "absolute",
                      top: "50%",
                      left: "50%",
                      transform: "translate(-50%, -50%)",
                      fontSize: 48,
                      color: "white",
                      filter: "drop-shadow(0 1px 3px rgba(0,0,0,0.5))",
                      pointerEvents: "none",
                    }}
                  />
                )}
              </Box>
            ))}
          </Box>
        )}
      </Paper>

      <Dialog
        open={viewing !== null}
        onClose={closeViewer}
        fullScreen={isMobile}
        maxWidth="lg"
        onKeyDown={(e) => {
          if (e.key === "ArrowRight") goNext();
          if (e.key === "ArrowLeft") goPrev();
        }}
        slotProps={{
          paper: {
            sx: {
              backgroundColor: "black",
              position: "relative",
              m: isMobile ? 0 : 4,
            },
          },
        }}
      >
        <IconButton
          onClick={closeViewer}
          aria-label="Close"
          sx={{
            position: "absolute",
            top: "max(8px, env(safe-area-inset-top))",
            right: 8,
            zIndex: 2,
            color: "white",
            backgroundColor: "rgba(0,0,0,0.4)",
            "&:hover": { backgroundColor: "rgba(0,0,0,0.6)" },
          }}
        >
          <CloseIcon />
        </IconButton>

        {viewingIndex !== null && photos && (
          <Typography
            variant="caption"
            sx={{
              position: "absolute",
              top: "max(16px, env(safe-area-inset-top))",
              left: 16,
              zIndex: 2,
              color: "rgba(255,255,255,0.8)",
            }}
          >
            {viewingIndex + 1} / {photos.length}
          </Typography>
        )}

        {hasPrev && !isMobile && (
          <IconButton
            onClick={goPrev}
            aria-label="Previous"
            sx={{
              position: "absolute",
              left: 8,
              top: "50%",
              transform: "translateY(-50%)",
              zIndex: 2,
              color: "white",
              backgroundColor: "rgba(0,0,0,0.4)",
              "&:hover": { backgroundColor: "rgba(0,0,0,0.6)" },
            }}
          >
            <ChevronLeftIcon />
          </IconButton>
        )}
        {hasNext && !isMobile && (
          <IconButton
            onClick={goNext}
            aria-label="Next"
            sx={{
              position: "absolute",
              right: 8,
              top: "50%",
              transform: "translateY(-50%)",
              zIndex: 2,
              color: "white",
              backgroundColor: "rgba(0,0,0,0.4)",
              "&:hover": { backgroundColor: "rgba(0,0,0,0.6)" },
            }}
          >
            <ChevronRightIcon />
          </IconButton>
        )}

        {viewing && (
          <Box
            onTouchStart={onTouchStart}
            onTouchMove={onTouchMove}
            onTouchEnd={onTouchEnd}
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: isMobile ? "100vw" : "auto",
              height: isMobile ? "100%" : "auto",
              overflow: "hidden",
              touchAction: "none",
            }}
          >
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                width: "100%",
                height: "100%",
                transform: drag
                  ? `translate(${drag.dx}px, ${drag.dy}px)`
                  : "translate(0, 0)",
                opacity: drag && drag.dy > 0 ? Math.max(0.4, 1 - drag.dy / 400) : 1,
                transition: drag ? "none" : "transform 0.2s ease, opacity 0.2s ease",
              }}
            >
              {isVideo(viewing.contentType) ? (
                <Box
                  component="video"
                  key={viewing.id}
                  src={viewing.url}
                  controls
                  autoPlay
                  playsInline
                  sx={{
                    maxWidth: isMobile ? "100vw" : "90vw",
                    maxHeight: isMobile ? "100%" : "85vh",
                  }}
                />
              ) : (
                <Box
                  component="img"
                  key={viewing.id}
                  src={viewing.url}
                  alt="Wedding photo"
                  sx={{
                    maxWidth: isMobile ? "100vw" : "90vw",
                    maxHeight: isMobile ? "100%" : "85vh",
                    objectFit: "contain",
                  }}
                />
              )}
            </Box>
          </Box>
        )}

        {/* Preload neighboring images so swipes feel instant. */}
        {viewingIndex !== null &&
          photos &&
          [viewingIndex - 1, viewingIndex + 1]
            .filter((i) => i >= 0 && i < photos.length)
            .map((i) => photos[i])
            .filter((p) => !isVideo(p.contentType))
            .map((p) => (
              <Box
                key={`preload-${p.id}`}
                component="img"
                src={p.url}
                alt=""
                sx={{ display: "none" }}
              />
            ))}
      </Dialog>
    </Box>
  );
};
