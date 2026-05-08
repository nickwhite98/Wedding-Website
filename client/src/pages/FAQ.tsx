import { useState } from "react";
import {
  Box,
  Typography,
  Paper,
  Accordion,
  AccordionSummary,
  AccordionDetails,
} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import { colors } from "../theme";

interface FaqItem {
  id: string;
  question: string;
  answer: React.ReactNode;
}

const faqs: FaqItem[] = [
  {
    id: "plus-ones",
    question: "Can I bring a plus-one?",
    answer: (
      <>
        Plus-ones are offered on an individual basis. If a "Bringing a plus-one"
        option appears next to your name when you RSVP, you're welcome to bring
        one. If it isn't shown, we weren't able to accommodate an additional
        guest for you. Thank you for understanding.
      </>
    ),
  },
  {
    id: "dress-code",
    question: "What's the dress code?",
    answer: (
      <>
        Cocktail to formal. Suits for the guys, cocktail dresses or formal gowns
        for the ladies. We're celebrating outdoors on family property, but we'd
        love for everyone to dress up for the occasion. The ceremony and
        reception take place on grass, so stilettos aren't your friend. Flats,
        wedges, or block heels will keep you comfortable (and upright) all
        night.
      </>
    ),
  },
];

export const FAQ = () => {
  const [expanded, setExpanded] = useState<string | false>(faqs[0].id);

  const handleChange =
    (panel: string) => (_: React.SyntheticEvent, isExpanded: boolean) => {
      setExpanded(isExpanded ? panel : false);
    };

  return (
    <Box sx={{ textAlign: "center" }}>
      <Paper
        elevation={0}
        sx={{
          backgroundColor: colors.cream,
          borderRadius: 0,
          overflow: "hidden",
          p: { xs: 3, md: 4 },
          mt: 2,
        }}
      >
        <Typography
          variant="h4"
          component="h2"
          sx={{
            color: "#2c2c2c",
            mb: 1,
            textAlign: "center",
            fontFamily: "'Kabel', sans-serif",
            fontWeight: 500,
            letterSpacing: "0.02em",
          }}
        >
          FAQ
        </Typography>

        <Typography
          variant="body1"
          sx={{
            color: "#555",
            mb: 4,
            mt: 2,
            maxWidth: 560,
            mx: "auto",
          }}
        >
          A few of the most common questions we've gotten. If yours isn't here,
          reach out to us directly and we'll get you an answer.
        </Typography>

        <Box
          sx={{
            maxWidth: 720,
            mx: "auto",
            textAlign: "left",
          }}
        >
          {faqs.map((faq) => (
            <Accordion
              key={faq.id}
              expanded={expanded === faq.id}
              onChange={handleChange(faq.id)}
              elevation={0}
              disableGutters
              sx={{
                backgroundColor: "white",
                mb: 1.5,
                borderRadius: 1,
                "&:before": { display: "none" },
                boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
              }}
            >
              <AccordionSummary
                expandIcon={<ExpandMoreIcon sx={{ color: colors.heading }} />}
                sx={{
                  px: 2.5,
                  py: 0.5,
                  "& .MuiAccordionSummary-content": {
                    my: 1.5,
                  },
                }}
              >
                <Typography
                  variant="h6"
                  component="h3"
                  sx={{
                    color: colors.heading,
                    fontFamily: "'Kabel', sans-serif",
                    fontWeight: 600,
                    fontSize: "1.1rem",
                    letterSpacing: "0.01em",
                  }}
                >
                  {faq.question}
                </Typography>
              </AccordionSummary>
              <AccordionDetails sx={{ px: 2.5, pb: 2.5, pt: 0 }}>
                <Typography
                  variant="body1"
                  sx={{ color: "#555", lineHeight: 1.7 }}
                >
                  {faq.answer}
                </Typography>
              </AccordionDetails>
            </Accordion>
          ))}
        </Box>
      </Paper>
    </Box>
  );
};
