import { Bebas_Neue, Work_Sans } from "next/font/google";
import "./globals.css";

const display = Bebas_Neue({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-display",
});

const body = Work_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-body",
});

const SITE_NAME =
  process.env.NEXT_PUBLIC_RESTAURANT_NAME || "Rincón El Sauce";
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
const TITLE = `${SITE_NAME} | Carta`;
const DESCRIPTION = `Carta digital de ${SITE_NAME} Parrilladas`;

export const metadata = {
  metadataBase: new URL(SITE_URL),
  title: TITLE,
  description: DESCRIPTION,
  openGraph: {
    title: TITLE,
    description: DESCRIPTION,
    images: ["/logo.png"],
    locale: "es_CL",
    type: "website",
  },
  twitter: {
    card: "summary",
    title: TITLE,
    description: DESCRIPTION,
    images: ["/logo.png"],
  },
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#0f0d0b",
};

export default function RootLayout({ children }) {
  return (
    <html lang="es">
      <body className={`${display.variable} ${body.variable} font-body`}>
        <div className="smoke-layer" aria-hidden="true">
          <div className="smoke-blob one" />
          <div className="smoke-blob two" />
          <div className="smoke-blob three" />
        </div>
        {children}
      </body>
    </html>
  );
}
