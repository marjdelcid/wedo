"use client";
import { usePathname } from "next/navigation";
import Link from "next/link";

export default function Nav() {
  const path = usePathname();

  const links = [
    { href: "/", label: "Regalos" },
    { href: "/editor", label: "Editor" },
    { href: "/dashboard", label: "Dashboard" },
  ];

  return (
    <nav style={{ position: "fixed", bottom: 20, left: "50%", transform: "translateX(-50%)", zIndex: 999, display: "flex", gap: 4, background: "rgba(26,23,20,0.9)", backdropFilter: "blur(16px)", padding: "6px 8px", borderRadius: 50, boxShadow: "0 8px 32px rgba(0,0,0,0.2)" }}>
      {links.map(l => (
        <Link key={l.href} href={l.href} style={{ padding: "8px 20px", borderRadius: 50, fontSize: 11, fontWeight: 600, letterSpacing: 1, textTransform: "uppercase", textDecoration: "none", fontFamily: "'Jost', sans-serif", transition: "all 0.2s", background: path === l.href ? "#8C6D4F" : "transparent", color: path === l.href ? "#fff" : "rgba(255,255,255,0.55)" }}>
          {l.label}
        </Link>
      ))}
    </nav>
  );
}