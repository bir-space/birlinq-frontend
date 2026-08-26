import type { ReactNode } from "react";
import "./globals.css";

// Root layout — the [locale] layout renders <html>/<body>.
export default function RootLayout({ children }: { children: ReactNode }) {
  return children;
}
