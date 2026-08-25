import type { Metadata } from "next";
import "./globals.css";
import AppShell from "@/components/AppShell";
import { ThemeProvider } from "@/context/ThemeContext";

export const metadata: Metadata = {
  title: "Anveshan Research AI — University Research Discovery & Synthesis",
  description: "Cross-disciplinary research knowledge graph, AI similarity discovery, and multi-source public document synthesis.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning className="dark">
      <body>
        <ThemeProvider>
          <AppShell>
            {children}
          </AppShell>
        </ThemeProvider>
      </body>
    </html>
  );
}
