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
  description:
    "Pool USDC with friends, automate stock investments, and manage fractional portfolios of US equities — directly inside Telegram.",
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
                  var tg = window.Telegram && window.Telegram.WebApp;
                  if(tg){
                    document.documentElement.setAttribute('data-tma','true');
                    tg.ready && tg.ready();
                    tg.expand && tg.expand();
                    var tp = tg.themeParams || {};
                    var root = document.documentElement;
                    if(tp.bg_color) root.style.setProperty('--tg-theme-bg-color', tp.bg_color);
                    if(tp.text_color) root.style.setProperty('--tg-theme-text-color', tp.text_color);
                    if(tp.hint_color) root.style.setProperty('--tg-theme-hint-color', tp.hint_color);
                  }
                }catch(e){}
              })();
            `,
          }}
        />
      </head>
      <body className="bg-[var(--tg-theme-bg-color,#f5f3ee)] font-sans text-[#101114] antialiased">
        {children}
      </body>
    </html>
  );
}
