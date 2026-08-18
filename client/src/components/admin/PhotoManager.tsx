import { useCallback, useEffect, useState } from "react";
import {
  Alert,
  Box,
  CircularProgress,
  IconButton,
  Link,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import PlayCircleOutlineIcon from "@mui/icons-material/PlayCircleOutline";
import { colors } from "../../theme";
import { photoApi, type PhotoItem } from "../../services/photo.service";

function formatBytes(bytes: number): string {
  if (bytes >= 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`;
  if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${Math.max(1, Math.round(bytes / 1024))} KB`;
}

export const PhotoManager = () => {
  const [photos, setPhotos] = useState<PhotoItem[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const load = useCallback(async () => {
    try {
      const items = await photoApi.list();
      setPhotos(items);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load photos");
      setPhotos([]);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const handleDelete = async (photo: PhotoItem) => {
    if (!window.confirm("Permanently delete this upload? This also removes the file from storage.")) {
      return;
    }
    try {
      setDeletingId(photo.id);
      await photoApi.adminDelete(photo.id);
      setPhotos((prev) => prev?.filter((p) => p.id !== photo.id) ?? null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete photo");
    } finally {
      setDeletingId(null);
    }
  };

  if (photos === null) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", py: 6 }}>
        <CircularProgress sx={{ color: colors.olive }} />
      </Box>
    );
  }

  const totalBytes = photos.reduce((sum, p) => sum + p.sizeBytes, 0);

  return (
    <Box>
      <Typography variant="h5" sx={{ mb: 1, color: colors.heading }}>
        Photo Management
      </Typography>
      <Typography variant="body2" sx={{ mb: 2, color: colors.body }}>
        {photos.length} upload{photos.length === 1 ? "" : "s"} · {formatBytes(totalBytes)} total
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {photos.length === 0 ? (
        <Typography variant="body1" sx={{ color: colors.body }}>
          No guest uploads yet.
        </Typography>
      ) : (
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Preview</TableCell>
                <TableCell>Type</TableCell>
                <TableCell>Size</TableCell>
                <TableCell>Date</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {photos.map((photo) => (
                <TableRow key={photo.id} hover>
                  <TableCell>
                    <Link href={photo.url} target="_blank" rel="noopener noreferrer">
                      {photo.thumbUrl ? (
                        <Box
                          component="img"
                          src={photo.thumbUrl}
                          alt="preview"
                          loading="lazy"
                          sx={{ width: 64, height: 64, objectFit: "cover", borderRadius: 1 }}
                        />
                      ) : (
                        <Box
                          sx={{
                            width: 64,
                            height: 64,
                            borderRadius: 1,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            backgroundColor: colors.sage,
                          }}
                        >
                          <PlayCircleOutlineIcon sx={{ color: "white" }} />
                        </Box>
                      )}
                    </Link>
                  </TableCell>
                  <TableCell>{photo.contentType}</TableCell>
                  <TableCell>{formatBytes(photo.sizeBytes)}</TableCell>
                  <TableCell>{new Date(photo.createdAt).toLocaleString()}</TableCell>
                  <TableCell align="right">
                    <IconButton
                      size="small"
                      color="error"
                      disabled={deletingId === photo.id}
                      onClick={() => handleDelete(photo)}
                    >
                      {deletingId === photo.id ? (
                        <CircularProgress size={18} />
                      ) : (
                        <DeleteIcon fontSize="small" />
                      )}
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </Box>
  );
};
