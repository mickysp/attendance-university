import type { Metadata } from "next";
import { Prompt, Sarabun, Noto_Sans_Thai } from "next/font/google";
import { AlertProvider } from "@/context/AlertContext";
import { ConfirmProvider } from "@/context/swal";
import "@/styles/global.css";
import "sweetalert2/dist/sweetalert2.min.css";
import "@/styles/swal.css";
import { ThemeProvider } from "next-themes";
import LanguageSync from "@/components/layouts/LanguageSync";

const prompt = Prompt({
  subsets: ["thai", "latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-prompt",
});

const sarabun = Sarabun({
  subsets: ["thai", "latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-sarabun",
});

const notoSansThai = Noto_Sans_Thai({
  subsets: ["thai", "latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-noto",
});

export const metadata: Metadata = {
  title: "Classora | Attendance University Management",
  icons: {
    icon: "/icon.png",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="th"
      suppressHydrationWarning
      className={`${prompt.variable} ${sarabun.variable} ${notoSansThai.variable}`}
    >
      <body className="antialiased">
        <LanguageSync />
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem
          storageKey="attendy-theme"
        >
          <AlertProvider>
            <ConfirmProvider>{children}</ConfirmProvider>
          </AlertProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
