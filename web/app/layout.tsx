import type { Metadata } from "next";
import { Newsreader, Sora, Inter } from "next/font/google";
import "./globals.css";

const newsreader = Newsreader({
  subsets: ["latin"],
  variable: "--font-newsreader",
  display: "swap",
});

const sora = Sora({
  subsets: ["latin"],
  variable: "--font-sora",
  display: "swap",
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "CIRCLA — Chat-Native Equity Syndicates",
  description: "Pool USDC with friends, automate stock investments, and manage fractional portfolios of US equities — directly inside Telegram.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${newsreader.variable} ${sora.variable} ${inter.variable}`}>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function(){
                try{
                  var isTMA = !!window.Telegram?.WebApp;
                  if(isTMA){
                    document.documentElement.setAttribute('data-tma','true');
                    var tg = window.Telegram.WebApp;
                    tg.ready && tg.ready();
                    tg.expand && tg.expand();
                  }
                  // IP-blocking placeholder: hook into layout wrapper
                  var blocked = false; // TODO: wire to Vercel Edge /api/geo
                  if(blocked) document.documentElement.setAttribute('data-blocked','us');
                }catch(e){}
              })();
            `,
          }}
        />
      </head>
      <body className="font-sans bg-[var(--tg-theme-bg-color,#f5f3ee)] text-[#101114] antialiased">{children}</body>
    </html>
  );
}
