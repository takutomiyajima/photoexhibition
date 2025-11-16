import "./globals.css";


export const metadata = { title: "冒険 Exhibition" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ja">
      <head></head>
      <body className="bg-[#7db3dc] text-white antialiased">{children}</body>
    </html>
  );
}

