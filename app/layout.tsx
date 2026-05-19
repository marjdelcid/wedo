import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Wedo · Listas de Regalos para Bodas en Guatemala",
  description: "Crea tu lista de regalos de boda y recibe contribuciones en quetzales directamente a tu cuenta bancaria.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;1,300;1,400&family=Playfair+Display:ital,wght@0,400;0,500;1,400&family=DM+Serif+Display:ital@0;1&family=Bodoni+Moda:ital,opsz,wght@0,6..96,400;0,6..96,500;1,6..96,400&family=Great+Vibes&family=Cinzel:wght@400;500&family=Lora:ital,wght@0,400;0,500;1,400&family=Gilda+Display&family=Libre+Baskerville:ital,wght@0,400;0,700;1,400&family=Sacramento&family=Abril+Fatface&family=EB+Garamond:ital,wght@0,400;0,500;1,400&family=Josefin+Serif:ital,wght@0,400;0,600;1,400&family=Italiana&family=Marcellus&family=Yeseva+One&family=Cardo:ital,wght@0,400;0,700;1,400&family=Tenor+Sans&family=Crimson+Pro:ital,wght@0,400;0,500;1,400&family=Montserrat:wght@300;400;500;600&family=Raleway:wght@300;400;500;600&family=Josefin+Sans:wght@300;400;600&family=Nunito:wght@300;400;600&family=Outfit:wght@300;400;500&family=DM+Sans:ital,wght@0,300;0,400;0,500;1,400&family=Poppins:wght@300;400;500;600&family=Work+Sans:wght@300;400;500;600&family=Plus+Jakarta+Sans:wght@300;400;500;600&family=Epilogue:wght@300;400;500;600&family=Pinyon+Script&family=Allura&family=Alex+Brush&family=Tangerine:wght@400;700&family=Parisienne&family=Euphoria+Script&family=Clicker+Script&family=Mr+De+Haviland&family=The+Nautigal:wght@400;700&family=Italianno&family=Jost:wght@300;400;500;600&display=swap" rel="stylesheet" />
      </head>
      <body style={{ margin: 0, padding: 0 }}>
        {children}
      </body>
    </html>
  );
}