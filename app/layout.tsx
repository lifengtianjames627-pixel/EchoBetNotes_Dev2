import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.css";
import { scaffoldCopy } from "./scaffold-copy";

const copy = scaffoldCopy("en");

export const metadata: Metadata = {
  title: copy.title,
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
