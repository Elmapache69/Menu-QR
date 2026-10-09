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
const TITLE = `${SITE_NAME} | Carta`;
const DESCRIPTION = `Carta digital de ${SITE_NAME} Parrilladas`;

// Si NEXT_PUBLIC_SITE_URL no está definida o tiene un valor inválido
// (espacios, texto pegado por error, etc.), usamos un valor por
// defecto en vez de dejar que se caiga todo el sitio.
function safeSiteUrl() {
  const raw = (process.env.NEXT_PUBLIC_SITE_URL || "").trim();
  try {
    return new URL(raw);
  } catch {
    return new URL("http://localhost:3000");
  }
}

export const metadata = {
  metadataBase: safeSiteUrl(),
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
  themeColor: "#12100e",
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
