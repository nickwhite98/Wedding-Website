import { useState, useEffect } from "react";
import { Box, Typography, Modal, IconButton } from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import { colors } from "../theme";
import { keyframes } from "@mui/system";

// Gentle floating animations
const float1 = keyframes`
  0%, 100% { transform: translateY(0px) rotate(var(--rotation)); }
  50% { transform: translateY(-8px) rotate(var(--rotation)); }
`;

const float2 = keyframes`
  0%, 100% { transform: translateY(0px) rotate(var(--rotation)); }
  50% { transform: translateY(-12px) rotate(var(--rotation)); }
`;

const float3 = keyframes`
  0%, 100% { transform: translateY(-4px) rotate(var(--rotation)); }
  50% { transform: translateY(4px) rotate(var(--rotation)); }
`;

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
  { src: "/venue/000085430017 2.JPEG", alt: "Venue landscape" },
  { src: "/venue/000085430022.JPEG", alt: "Property view" },
  { src: "/venue/000085430030.JPEG", alt: "Outdoor setting" },
  { src: "/venue/IMG_2873.jpg", alt: "Wedding location" },
  { src: "/venue/IMG_7148.jpg", alt: "Natural surroundings" },
  { src: "/venue/IMG_8195.jpg", alt: "Family property" },
];

// Scrapbook image component with organic styling
interface ScrapbookImageProps {
  src: string;
  alt: string;
  rotation?: number;
  size?: "small" | "medium" | "large";
  floatAnimation?: 1 | 2 | 3;
  delay?: number;
  onClick: () => void;
  float?: "left" | "right" | "none";
}

const ScrapbookImage = ({
  src,
  alt,
  rotation = 0,
  size = "medium",
  floatAnimation = 1,
  delay = 0,
  onClick,
  float = "none",
}: ScrapbookImageProps) => {
  const sizeMap = {
    small: { width: "160px", height: "160px" },
    medium: { width: "200px", height: "200px" },
    large: { width: "240px", height: "240px" },
  };

  const animations = { 1: float1, 2: float2, 3: float3 };
  const durations = { 1: "6s", 2: "8s", 3: "7s" };

  const floatStyles = float !== "none" ? {
    float: { xs: "none", md: float },
    margin: float === "left"
      ? { xs: "0 auto 1.5rem", md: "0 2rem 1rem 0" }
      : { xs: "0 auto 1.5rem", md: "0 0 1rem 2rem" },
    display: { xs: "block", md: "inline" },
  } : {};

  return (
    <Box
      onClick={onClick}
      sx={{
        ...sizeMap[size],
        "--rotation": `${rotation}deg`,
        position: "relative",
        cursor: "pointer",
        animation: `${animations[floatAnimation]} ${durations[floatAnimation]} ease-in-out infinite`,
        animationDelay: `${delay}s`,
        transition: "transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1), box-shadow 0.3s ease",
        ...floatStyles,
        "&:hover": {
          transform: `scale(1.05) rotate(${rotation * 0.5}deg)`,
          zIndex: 100,
          "& .image-frame": {
            boxShadow: "0 25px 50px rgba(0,0,0,0.25)",
          },
        },
      }}
    >
      <Box
        className="image-frame"
        sx={{
          width: "100%",
          height: "100%",
          padding: "6px",
          paddingBottom: "24px",
          backgroundColor: "#fefefe",
          boxShadow: "0 8px 32px rgba(0,0,0,0.15), 0 2px 8px rgba(0,0,0,0.1)",
          transform: `rotate(${rotation}deg)`,
          transition: "box-shadow 0.3s ease",
        }}
      >
        <Box
          component="img"
          src={src}
          alt={alt}
          sx={{
            width: "100%",
            height: "100%",
            objectFit: "cover",
          }}
        />
      </Box>
    </Box>
  );
};

// Animated wrapper
const AnimatedSection = ({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), delay * 1000);
    return () => clearTimeout(timer);
  }, [delay]);

  return (
    <Box
      sx={{
        opacity: isVisible ? 1 : 0,
        animation: isVisible ? `${fadeInUp} 0.6s ease-out forwards` : "none",
      }}
    >
      {children}
    </Box>
  );
};

// Text paragraph styling
const textStyles = {
  color: colors.body,
  fontSize: { xs: "1rem", md: "1.1rem" },
  lineHeight: 1.9,
  letterSpacing: "0.01em",
  mb: 1.5,
};

export const Venue = () => {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  const handleImageClick = (src: string) => {
    setSelectedImage(src);
  };

  const handleClose = () => {
    setSelectedImage(null);
  };

  return (
    <Box
      sx={{
        py: { xs: 3, md: 5 },
        px: { xs: 2, md: 4 },
        maxWidth: "800px",
        mx: "auto",
      }}
    >
      <AnimatedSection delay={0}>
        {/* First paragraph with images floated left */}
        <Box sx={{ overflow: "hidden", mb: 2 }}>
          <ScrapbookImage
            src={venueImages[0].src}
            alt={venueImages[0].alt}
            rotation={-4}
            size="medium"
            floatAnimation={1}
            delay={0.2}
            onClick={() => handleImageClick(venueImages[0].src)}
            float="left"
          />
          <Typography variant="body1" sx={textStyles}>
            When we first started to get to know each other, we discovered that we both have family ties in Gaylord.
            We both have fond memories growing up, spending summers playing in the woods, winters on the ski slopes,
            and Thanksgivings shared with family.
          </Typography>
        </Box>
      </AnimatedSection>

      <AnimatedSection delay={0.2}>
        {/* Second paragraph with images floated right */}
        <Box sx={{ overflow: "hidden", mb: 2 }}>
          <ScrapbookImage
            src={venueImages[1].src}
            alt={venueImages[1].alt}
            rotation={3}
            size="medium"
            floatAnimation={2}
            delay={0.4}
            onClick={() => handleImageClick(venueImages[1].src)}
            float="right"
          />
          <Typography variant="body1" sx={textStyles}>
            As our relationship grew, we continued to make some of our favorite memories together up north.
            Spending time with family, our annual friend's trips, walking around the woods, swimming and fishing
            are some of our favorite things to do.
          </Typography>
        </Box>
      </AnimatedSection>

      <AnimatedSection delay={0.4}>
        {/* Third paragraph with images floated left */}
        <Box sx={{ overflow: "hidden", mb: 2 }}>
          <ScrapbookImage
            src={venueImages[2].src}
            alt={venueImages[2].alt}
            rotation={-3}
            size="medium"
            floatAnimation={3}
            delay={0.6}
            onClick={() => handleImageClick(venueImages[2].src)}
            float="left"
          />
          <Typography variant="body1" sx={textStyles}>
            When it came time to choose a venue, we quickly realized that the most meaningful place to begin
            this next chapter in our relationship would be the place that initially drew us together.
          </Typography>
        </Box>
      </AnimatedSection>

      <AnimatedSection delay={0.6}>
        {/* Fourth paragraph with image floated right */}
        <Box sx={{ overflow: "hidden", mb: 2 }}>
          <ScrapbookImage
            src={venueImages[3].src}
            alt={venueImages[3].alt}
            rotation={4}
            size="medium"
            floatAnimation={1}
            delay={0.8}
            onClick={() => handleImageClick(venueImages[3].src)}
            float="right"
          />
          <Typography variant="body1" sx={textStyles}>
            We are so grateful to be able to celebrate our wedding on the White Property
            and cannot wait to share this special day with all of you!
          </Typography>
        </Box>
      </AnimatedSection>

      {/* Remaining images in a small gallery at bottom */}
      <AnimatedSection delay={0.8}>
        <Box
          sx={{
            display: "flex",
            flexWrap: "wrap",
            justifyContent: "center",
            gap: 2,
            mt: 4,
          }}
        >
          {venueImages.slice(4).map((image, index) => (
            <ScrapbookImage
              key={index}
              src={image.src}
              alt={image.alt}
              rotation={index % 2 === 0 ? -3 : 4}
              size="small"
              floatAnimation={((index % 3) + 1) as 1 | 2 | 3}
              delay={1 + index * 0.2}
              onClick={() => handleImageClick(image.src)}
            />
          ))}
        </Box>
      </AnimatedSection>

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
