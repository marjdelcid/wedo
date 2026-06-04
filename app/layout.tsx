/* =====================================================================
   wedo. — app/layout.tsx
   Brand UI fonts: Instrument Serif (display/logo) + Archivo (UI/body).
   The long font list below is KEPT for the invitation editor's font
   picker (users style THEIR invitation). Do not remove those — they are
   not the brand UI fonts. Brand chrome must use Instrument Serif/Archivo.
   ===================================================================== */
import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "wedo. · Invita, celebra, recibe",
  description:
    "Crea tu evento, envía invitaciones, gestiona RSVP y arma tu lista de regalos en efectivo. El dinero llega directo a tu cuenta en quetzales. Para bodas y toda celebración en Guatemala.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="es">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />

        {/* ----- BRAND UI fonts (wedo. chrome) ----- */}
        <link
          href="https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=Archivo:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />

        {/* ----- INVITATION EDITOR font picker (users style their own invitation) ----- */}
        <link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;1,300;1,400&family=Playfair+Display:ital,wght@0,400;0,500;1,400&family=DM+Serif+Display:ital@0;1&family=Bodoni+Moda:ital,opsz,wght@0,6..96,400;0,6..96,500;1,6..96,400&family=Great+Vibes&family=Cinzel:wght@400;500&family=Lora:ital,wght@0,400;0,500;1,400&family=Gilda+Display&family=Libre+Baskerville:ital,wght@0,400;0,700;1,400&family=Sacramento&family=Abril+Fatface&family=EB+Garamond:ital,wght@0,400;0,500;1,400&family=Josefin+Serif:ital,wght@0,400;0,600;1,400&family=Italiana&family=Marcellus&family=Yeseva+One&family=Cardo:ital,wght@0,400;0,700;1,400&family=Tenor+Sans&family=Crimson+Pro:ital,wght@0,400;0,500;1,400&family=Jost:wght@300;400;500;600&display=swap" rel="stylesheet" />
        <link href="https://fonts.googleapis.com/css2?family=Montserrat:wght@300;400;500;600&family=Raleway:wght@300;400;500;600&family=Josefin+Sans:wght@300;400;600&family=Nunito:wght@300;400;600&family=Outfit:wght@300;400;500&family=DM+Sans:ital,wght@0,300;0,400;0,500;1,400&family=Poppins:wght@300;400;500;600&family=Work+Sans:wght@300;400;500;600&family=Plus+Jakarta+Sans:wght@300;400;500;600&family=Epilogue:wght@300;400;500;600&family=Pinyon+Script&family=Allura&family=Alex+Brush&family=Tangerine:wght@400;700&family=Parisienne&family=Euphoria+Script&family=Clicker+Script&family=Mr+De+Haviland&family=The+Nautigal:wght@400;700&family=Italianno&display=swap" rel="stylesheet" />
      </head>
      <body>{children}</body>
    </html>
  );
}
