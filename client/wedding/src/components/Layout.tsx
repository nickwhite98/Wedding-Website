import type { ReactNode } from "react";
import { Box } from "@mui/material";

interface LayoutProps {
  children: ReactNode;
}

export const Layout = ({ children }: LayoutProps) => {
  return <Box sx={{ px: 0, width: "100%" }}>{children}</Box>;
};
