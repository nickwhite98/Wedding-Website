import { useState, useEffect, useCallback, useRef } from "react";
import { Box, Typography, Modal, IconButton, useMediaQuery, useTheme } from "@mui/material";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import { colors } from "../theme";
import { keyframes } from "@mui/system";

const fadeInUp = keyframes`
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
`;

// Background images that cycle behind the text
const backgroundImages = [
  { src: "/venue/backgrounds/000085420001.JPEG", alt: "Venue scenery" },
  { src: "/venue/backgrounds/000085430017-2.JPEG", alt: "Venue landscape" },
  { src: "/venue/backgrounds/000085430022.JPEG", alt: "Property view" },
  { src: "/venue/backgrounds/000085430030.JPEG", alt: "Outdoor setting" },
  { src: "/venue/backgrounds/IMG_2873.jpg", alt: "Wedding location" },
  { src: "/venue/backgrounds/IMG_7148.jpg", alt: "Natural surroundings" },
];

// All venue images for the carousel/gallery (backgrounds + others)
const allVenueImages = [
  ...backgroundImages,
  { src: "/venue/IMG_8195.jpg", alt: "Venue photo" },
];

const SLIDE_GAP = 40; // Gap between images

export const Venue = () => {
  const [selectedImageIndex, setSelectedImageIndex] = useState<number | null>(null);
  const [currentBgIndex, setCurrentBgIndex] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [dragOffset, setDragOffset] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const [skipTransition, setSkipTransition] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));

  // Get the actual container width for animations
  const getContainerWidth = () => containerRef.current?.offsetWidth || window.innerWidth * 0.9;

  // Slow crossfade between background images
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentBgIndex((prev) => (prev + 1) % backgroundImages.length);
    }, 15000);
    return () => clearInterval(interval);
  }, []);

  // Fade in content on mount
  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), 100);
    return () => clearTimeout(timer);
  }, []);

  const handleImageClick = (index: number) => {
    setSelectedImageIndex(index);
  };

  const handleClose = () => {
    setSelectedImageIndex(null);
  };

  const handlePrevImage = useCallback((animate = false) => {
    if (animate && !isAnimating) {
      const slideDistance = getContainerWidth() + SLIDE_GAP;
      setIsAnimating(true);
      setDragOffset(slideDistance);
      setTimeout(() => {
        setSkipTransition(true);
        setSelectedImageIndex((prev) =>
          prev !== null ? (prev - 1 + allVenueImages.length) % allVenueImages.length : null
        );
        setDragOffset(0);
        setIsAnimating(false);
        // Re-enable transitions after the offset reset
        requestAnimationFrame(() => setSkipTransition(false));
      }, 300);
    } else if (!animate) {
      setSelectedImageIndex((prev) =>
        prev !== null ? (prev - 1 + allVenueImages.length) % allVenueImages.length : null
      );
    }
  }, [isAnimating]);

  const handleNextImage = useCallback((animate = false) => {
    if (animate && !isAnimating) {
      const slideDistance = getContainerWidth() + SLIDE_GAP;
      setIsAnimating(true);
      setDragOffset(-slideDistance);
      setTimeout(() => {
        setSkipTransition(true);
        setSelectedImageIndex((prev) =>
          prev !== null ? (prev + 1) % allVenueImages.length : null
        );
        setDragOffset(0);
        setIsAnimating(false);
        // Re-enable transitions after the offset reset
        requestAnimationFrame(() => setSkipTransition(false));
      }, 300);
    } else if (!animate) {
      setSelectedImageIndex((prev) =>
        prev !== null ? (prev + 1) % allVenueImages.length : null
      );
    }
  }, [isAnimating]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (selectedImageIndex === null) return;
      if (e.key === "ArrowLeft") handlePrevImage();
      if (e.key === "ArrowRight") handleNextImage();
      if (e.key === "Escape") handleClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selectedImageIndex, handlePrevImage, handleNextImage]);

  // Swipe handling with drag-to-follow
  const minSwipeDistance = 50;

  const onTouchStart = (e: React.TouchEvent) => {
    setTouchStart(e.targetTouches[0].clientX);
    setDragOffset(0);
    setIsDragging(true);
  };

  const onTouchMove = (e: React.TouchEvent) => {
    if (touchStart === null) return;
    const currentX = e.targetTouches[0].clientX;
    const offset = currentX - touchStart;
    setDragOffset(offset);
  };

  const onTouchEnd = () => {
    const isLeftSwipe = dragOffset < -minSwipeDistance;
    const isRightSwipe = dragOffset > minSwipeDistance;

    setIsDragging(false);

    if (isLeftSwipe) {
      // Animate to the left (show next image)
      const slideDistance = getContainerWidth() + SLIDE_GAP;
      setIsAnimating(true);
      setDragOffset(-slideDistance);
      setTimeout(() => {
        setSkipTransition(true);
        handleNextImage();
        setDragOffset(0);
        setIsAnimating(false);
        requestAnimationFrame(() => setSkipTransition(false));
      }, 300);
    } else if (isRightSwipe) {
      // Animate to the right (show previous image)
      const slideDistance = getContainerWidth() + SLIDE_GAP;
      setIsAnimating(true);
      setDragOffset(slideDistance);
      setTimeout(() => {
        setSkipTransition(true);
        handlePrevImage();
        setDragOffset(0);
        setIsAnimating(false);
        requestAnimationFrame(() => setSkipTransition(false));
      }, 300);
    } else {
      // Snap back to center
      setDragOffset(0);
    }

    setTouchStart(null);
  };

  return (
    <Box
      sx={{
        position: "relative",
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* Background images with crossfade */}
      {backgroundImages.map((image, index) => (
        <Box
          key={image.src}
          sx={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundImage: `url(${image.src})`,
            backgroundSize: "cover",
            backgroundPosition: "center",
            opacity: index === currentBgIndex ? 1 : 0,
            transition: "opacity 2s ease-in-out",
            zIndex: 0,
          }}
        />
      ))}

      {/* Dark overlay for text readability */}
      <Box
        sx={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background:
            "linear-gradient(to bottom, rgba(0,0,0,0.55) 0%, rgba(0,0,0,0.65) 50%, rgba(0,0,0,0.75) 100%)",
          zIndex: 1,
        }}
      />

      {/* Content */}
      <Box
        sx={{
          position: "relative",
          zIndex: 2,
          flex: 1,
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          py: { xs: 4, md: 6 },
          px: { xs: 3, md: 4 },
        }}
      >
        <Box
          sx={{
            maxWidth: "700px",
            mx: "auto",
            opacity: isVisible ? 1 : 0,
            animation: isVisible
              ? `${fadeInUp} 0.8s ease-out forwards`
              : "none",
          }}
        >
          <Typography
            variant="h1"
            sx={{
              fontFamily: "Brightwall, serif",
              fontSize: { xs: "3rem", md: "4rem" },
              color: colors.lightText.primary,
              textAlign: "center",
              mb: { xs: 3, md: 4 },
              textShadow: "0 2px 8px rgba(0,0,0,0.4)",
            }}
          >
            Our Venue
          </Typography>

          <Typography
            variant="body1"
            sx={{
              color: colors.lightText.primary,
              fontSize: { xs: "1.05rem", md: "1.15rem" },
              lineHeight: 1.9,
              letterSpacing: "0.01em",
              mb: 3,
              textShadow: "0 2px 4px rgba(0,0,0,0.3)",
              textIndent: "2em",
            }}
          >
            When we first started talking to one another at Michigan State, we
            quickly discovered that we both have connections to Gaylord. It was
            a pleasant surprise to learn that we shared similar memories of
            carefree summers playing in the woods, cozy winters on the slopes,
            and family celebrations up north.
          </Typography>

          <Typography
            variant="body1"
            sx={{
              color: colors.lightText.primary,
              fontSize: { xs: "1.05rem", md: "1.15rem" },
              lineHeight: 1.9,
              letterSpacing: "0.01em",
              mb: 3,
              textShadow: "0 2px 4px rgba(0,0,0,0.3)",
              textIndent: "2em",
            }}
          >
            Throughout our relationship, we created many memories of our own
            here. Over the years, we went from being the “new person” at each
            other’s family gatherings, to becoming a fully-accepted member of
            the family. We created new traditions ourselves - gathering our
            friends together each winter for a ski trip, or each summer to camp
            in the woods. Spending time up north continues to be one of our
            favorite things to do.
          </Typography>

          <Typography
            variant="body1"
            sx={{
              color: colors.lightText.primary,
              fontSize: { xs: "1.05rem", md: "1.15rem" },
              lineHeight: 1.9,
              letterSpacing: "0.01em",
              mb: 3,
              textShadow: "0 2px 4px rgba(0,0,0,0.3)",
              textIndent: "2em",
            }}
          >
            When it came time to choose a venue for our wedding, it was an easy
            decision to host it here. It was the natural choice for us to begin
            the next chapter of our relationship in the same place that helped
            draw us together.
          </Typography>

          <Typography
            variant="body1"
            sx={{
              color: colors.lightText.primary,
              fontSize: { xs: "1.05rem", md: "1.15rem" },
              lineHeight: 1.9,
              letterSpacing: "0.01em",
              textShadow: "0 2px 4px rgba(0,0,0,0.3)",
              textIndent: "2em",
            }}
          >
            We are so grateful and excited to celebrate our wedding on the White
            Family Property, and we cannot wait to share this special day with
            all of you!
          </Typography>
        </Box>

        {/* Thumbnail gallery */}
        <Box
          sx={{
            mt: { xs: 4, md: 5 },
            display: "flex",
            justifyContent: { xs: "flex-start", md: "center" },
            flexWrap: { xs: "nowrap", md: "wrap" },
            gap: { xs: 1, md: 1.5 },
            opacity: isVisible ? 1 : 0,
            animation: isVisible
              ? `${fadeInUp} 0.8s ease-out 0.3s forwards`
              : "none",
            animationFillMode: "backwards",
            overflowX: { xs: "auto", md: "visible" },
            mx: { xs: -3, md: 0 },
            px: { xs: 3, md: 0 },
            pb: { xs: 1, md: 0 },
            "&::-webkit-scrollbar": {
              display: "none",
            },
            scrollbarWidth: "none",
          }}
        >
          {allVenueImages.map((image, index) => (
            <Box
              key={index}
              onClick={() => handleImageClick(index)}
              sx={{
                width: { xs: 60, md: 80 },
                height: { xs: 60, md: 80 },
                minWidth: { xs: 60, md: 80 },
                borderRadius: 1,
                overflow: "hidden",
                cursor: "pointer",
                border: "2px solid rgba(255,255,255,0.4)",
                transition: "all 0.3s ease",
                opacity: index < backgroundImages.length && index === currentBgIndex ? 1 : 0.7,
                transform: index < backgroundImages.length && index === currentBgIndex ? "scale(1.1)" : "scale(1)",
                "&:hover": {
                  opacity: 1,
                  transform: "scale(1.1)",
                  borderColor: "rgba(255,255,255,0.8)",
                },
              }}
            >
              <Box
                component="img"
                src={image.src}
                alt={image.alt}
                sx={{
                  width: "100%",
                  height: "100%",
                  objectFit: "cover",
                }}
              />
            </Box>
          ))}
        </Box>
      </Box>

      {/* Image Modal */}
      <Modal
        open={selectedImageIndex !== null}
        onClose={handleClose}
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          p: 2,
          backdropFilter: "blur(8px)",
        }}
      >
        <>
          {/* Left arrow - desktop only */}
          {!isMobile && (
            <IconButton
              onClick={() => handlePrevImage(true)}
              sx={{
                position: "fixed",
                left: { md: 40 },
                top: "50%",
                transform: "translateY(-50%)",
                color: "white",
                backgroundColor: "rgba(0, 0, 0, 0.5)",
                "&:hover": {
                  backgroundColor: "rgba(0, 0, 0, 0.7)",
                },
              }}
            >
              <ChevronLeftIcon fontSize="large" />
            </IconButton>
          )}

          {/* Right arrow - desktop only */}
          {!isMobile && (
            <IconButton
              onClick={() => handleNextImage(true)}
              sx={{
                position: "fixed",
                right: { md: 40 },
                top: "50%",
                transform: "translateY(-50%)",
                color: "white",
                backgroundColor: "rgba(0, 0, 0, 0.5)",
                "&:hover": {
                  backgroundColor: "rgba(0, 0, 0, 0.7)",
                },
              }}
            >
              <ChevronRightIcon fontSize="large" />
            </IconButton>
          )}

          <Box
            ref={containerRef}
            onClick={(e) => {
              // Close modal when clicking on the container background (not the image)
              if (e.target === e.currentTarget || (e.target as HTMLElement).tagName !== "IMG") {
                handleClose();
              }
            }}
            sx={{
              position: "relative",
              width: "90vw",
              height: "85vh",
              outline: "none",
              overflow: "visible",
              cursor: "pointer",
            }}
            onTouchStart={onTouchStart}
            onTouchMove={onTouchMove}
            onTouchEnd={onTouchEnd}
          >
            {selectedImageIndex !== null && (
              <Box
                sx={{
                  position: "relative",
                  width: "100%",
                  height: "100%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                {/* Previous image */}
                <Box
                  sx={{
                    position: "absolute",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    width: "100%",
                    height: "100%",
                    transform: `translateX(calc(-100% - ${SLIDE_GAP}px + ${dragOffset}px))`,
                    transition: isDragging || skipTransition ? "none" : "transform 0.3s ease-out",
                    opacity: isDragging || isAnimating ? 1 : 0,
                  }}
                >
                  <Box
                    component="img"
                    src={allVenueImages[(selectedImageIndex - 1 + allVenueImages.length) % allVenueImages.length].src}
                    alt="Previous"
                    sx={{
                      maxWidth: "100%",
                      maxHeight: "100%",
                      objectFit: "contain",
                      borderRadius: 1,
                      boxShadow: "0 25px 80px rgba(0,0,0,0.4)",
                      userSelect: "none",
                      pointerEvents: "none",
                    }}
                  />
                </Box>

                {/* Current image */}
                <Box
                  sx={{
                    position: "absolute",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    width: "100%",
                    height: "100%",
                    transform: `translateX(${dragOffset}px)`,
                    transition: isDragging || skipTransition ? "none" : "transform 0.3s ease-out",
                  }}
                >
                  <Box
                    component="img"
                    src={allVenueImages[selectedImageIndex].src}
                    alt={allVenueImages[selectedImageIndex].alt}
                    onClick={(e) => e.stopPropagation()}
                    sx={{
                      maxWidth: "100%",
                      maxHeight: "100%",
                      objectFit: "contain",
                      borderRadius: 1,
                      boxShadow: "0 25px 80px rgba(0,0,0,0.4)",
                      userSelect: "none",
                      cursor: "default",
                    }}
                  />
                </Box>

                {/* Next image */}
                <Box
                  sx={{
                    position: "absolute",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    width: "100%",
                    height: "100%",
                    transform: `translateX(calc(100% + ${SLIDE_GAP}px + ${dragOffset}px))`,
                    transition: isDragging || skipTransition ? "none" : "transform 0.3s ease-out",
                    opacity: isDragging || isAnimating ? 1 : 0,
                  }}
                >
                  <Box
                    component="img"
                    src={allVenueImages[(selectedImageIndex + 1) % allVenueImages.length].src}
                    alt="Next"
                    sx={{
                      maxWidth: "100%",
                      maxHeight: "100%",
                      objectFit: "contain",
                      borderRadius: 1,
                      boxShadow: "0 25px 80px rgba(0,0,0,0.4)",
                      userSelect: "none",
                      pointerEvents: "none",
                    }}
                  />
                </Box>
              </Box>
            )}
          </Box>
        </>
      </Modal>
    </Box>
  );
};
