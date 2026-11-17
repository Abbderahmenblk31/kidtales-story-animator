import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "حكايات متحركة AI | استوديو تحريك قصص ورسومات الأطفال",
  description:
    "منصة سحرية مدعومة بالذكاء الاصطناعي لتحويل الرسومات والمشاهد الثابتة لقصص الأطفال إلى كرتون ناطق ومتحرك بلمسة زر واحدة.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ar" dir="rtl">
      <body className="antialiased selection:bg-purple-200 selection:text-purple-900">
        {children}
      </body>
    </html>
  );
}
