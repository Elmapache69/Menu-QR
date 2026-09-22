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

export const metadata = {
  title: "Rincón El Sauce | Carta",
  description: "Carta digital de Rincón El Sauce Parrilladas",
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
        {children}
      </body>
    </html>
  );
}
