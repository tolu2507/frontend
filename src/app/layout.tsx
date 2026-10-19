import type { Metadata } from "next";
import { Bricolage_Grotesque, Figtree } from "next/font/google";
import "./globals.css";
import Providers from "./providers";
import { brand } from "@/config/brand";
import { seo } from "@/config/seo";

const display = Bricolage_Grotesque({
  variable: "--font-bricolage",
  subsets: ["latin"],
  weight: ["600", "700", "800"],
});

const body = Figtree({
  variable: "--font-figtree",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
});

export const metadata: Metadata = {
  metadataBase: new URL(brand.siteUrl),
  title: { default: seo.title, template: `%s | ${brand.name}` },
  description: seo.description,
  applicationName: brand.name,
  category: "education",
  alternates: { canonical: "/" },
  openGraph: { type: "website", siteName: brand.name, locale: seo.locale, url: "/", title: seo.shareTitle, description: seo.description },
  twitter: { card: "summary_large_image", title: seo.shareTitle, description: seo.description },
  robots: { index: true, follow: true, googleBot: { index: true, follow: true, "max-image-preview": "large", "max-snippet": -1 } },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en-NG" className={`${display.variable} ${body.variable}`}>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
