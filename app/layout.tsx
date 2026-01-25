import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "@/components/providers";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXTAUTH_URL || "http://localhost:3000"),
  title: "FitZone | Gimnasios en Bogotá",
  description: "La cadena de gimnasios líder en Bogotá. 3 sedes con equipamiento premium, entrenadores certificados y programas personalizados.",
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
  openGraph: {
    title: "FitZone | Gimnasios en Bogotá",
    description: "La cadena de gimnasios líder en Bogotá. 3 sedes con equipamiento premium.",
    images: ["/og-image.png"],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es" suppressHydrationWarning>
      <head>
        <script src="https://apps.abacus.ai/chatllm/appllm-lib.js"></script>
      </head>
      <body className="bg-[#0A0A0A] text-white antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
