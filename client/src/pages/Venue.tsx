import { useState, useEffect } from "react";
import { Box, Typography, Modal, IconButton } from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
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

const venueImages = [
  { src: "/venue/000085420001.JPEG", alt: "Venue scenery" },
  { src: "/venue/000085430017-2.JPEG", alt: "Venue landscape" },
  { src: "/venue/000085430022.JPEG", alt: "Property view" },
  { src: "/venue/000085430030.JPEG", alt: "Outdoor setting" },
  { src: "/venue/IMG_2873.jpg", alt: "Wedding location" },
  { src: "/venue/IMG_7148.jpg", alt: "Natural surroundings" },
];

export const Venue = () => {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [currentBgIndex, setCurrentBgIndex] = useState(0);
  const [isVisible, setIsVisible] = useState(false);

  // Slow crossfade between background images
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentBgIndex((prev) => (prev + 1) % venueImages.length);
    }, 8000);
    return () => clearInterval(interval);
  }, []);

  // Fade in content on mount
  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), 100);
    return () => clearTimeout(timer);
  }, []);

  const handleImageClick = (src: string) => {
    setSelectedImage(src);
  };

  const handleClose = () => {
    setSelectedImage(null);
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
      {venueImages.map((image, index) => (
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
            "linear-gradient(to bottom, rgba(0,0,0,0.5) 0%, rgba(0,0,0,0.6) 50%, rgba(0,0,0,0.7) 100%)",
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
            justifyContent: "center",
            flexWrap: "wrap",
            gap: { xs: 1, md: 1.5 },
            opacity: isVisible ? 1 : 0,
            animation: isVisible
              ? `${fadeInUp} 0.8s ease-out 0.3s forwards`
              : "none",
            animationFillMode: "backwards",
          }}
        >
          {venueImages.map((image, index) => (
            <Box
              key={index}
              onClick={() => handleImageClick(image.src)}
              sx={{
                width: { xs: 60, md: 80 },
                height: { xs: 60, md: 80 },
                borderRadius: 1,
                overflow: "hidden",
                cursor: "pointer",
                border: "2px solid rgba(255,255,255,0.4)",
                transition: "all 0.3s ease",
                opacity: index === currentBgIndex ? 1 : 0.7,
                transform: index === currentBgIndex ? "scale(1.1)" : "scale(1)",
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
        open={!!selectedImage}
        onClose={handleClose}
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          p: 2,
          backdropFilter: "blur(8px)",
        }}
      >
        <Box
          sx={{
            position: "relative",
            maxWidth: "90vw",
            maxHeight: "90vh",
            outline: "none",
            animation: `${fadeInUp} 0.3s ease-out`,
          }}
        >
          <IconButton
            onClick={handleClose}
            sx={{
              position: "absolute",
              top: -50,
              right: 0,
              color: "white",
              backgroundColor: "rgba(0, 0, 0, 0.5)",
              "&:hover": {
                backgroundColor: "rgba(0, 0, 0, 0.7)",
              },
            }}
          >
            <CloseIcon />
          </IconButton>
          {selectedImage && (
            <Box
              component="img"
              src={selectedImage}
              alt="Enlarged venue photo"
              sx={{
                maxWidth: "100%",
                maxHeight: "85vh",
                objectFit: "contain",
                borderRadius: 1,
                boxShadow: "0 25px 80px rgba(0,0,0,0.4)",
              }}
            />
          )}
        </Box>
      </Modal>
    </Box>
  );
};
