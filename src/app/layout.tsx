import type { Metadata } from "next";
import "./globals.css";
import { AppProvider } from "@/context/AppContext";
import { ClerkProvider } from '@clerk/nextjs';
import GlobalErrorSuppressor from '@/components/ui/GlobalErrorSuppressor';

export const metadata: Metadata = {
  title: "NovaX — AI Voice Platform",
  description: "Nền tảng AI Text-to-Speech và Voice Cloning chuyên nghiệp. Tạo giọng nói AI đa ngôn ngữ, nhân bản giọng nói, và sản xuất nội dung video ngắn.",
  keywords: "NovaX, AI voice, text to speech, voice cloning, TikTok, YouTube Shorts, giọng nói AI",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider>
      <html lang="vi">
        <body>
          <AppProvider>
            {/* Suppresses benign third-party async errors (Clerk onboarding) */}
            <GlobalErrorSuppressor />
            {children}
          </AppProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}
