"use client";
/* =====================================================================
   wedo. — app/components/DisenoIAPreview.tsx
   Tarjeta de preview de un diseño generado con IA: imagen hero, los 4
   swatches, la tipografía renderizada y la frase de portada. Los botones
   de acción (Usar/Regenerar/Aplicar) los pone el host como children.
   Se usa en el onboarding y en el editor.
   ===================================================================== */
import type { DisenoIA } from "../lib/disenoIA";

export default function DisenoIAPreview({ diseno, children }: { diseno: DisenoIA; children?: React.ReactNode }) {
  return (
    <div style={{ background: "#FFFDF8", border: "1px solid rgba(35,23,18,.12)", borderRadius: 14, padding: 14, marginTop: 12 }}>
      {diseno.foto_hero && (
        <img src={diseno.foto_hero} alt="Portada generada" style={{ width: "100%", height: 180, objectFit: "cover", borderRadius: 10, marginBottom: 12 }} />
      )}
      <div style={{ display: "flex", gap: 8, marginBottom: 10 }}>
        {(diseno.colores || []).map((c, i) => (
          <span key={i} title={c} style={{ width: 26, height: 26, borderRadius: "50%", background: c, border: "2px solid #fff", boxShadow: "0 1px 4px rgba(35,23,18,.2)", flex: "none" }} />
        ))}
      </div>
      <div style={{ fontFamily: `'${diseno.tipografia}', Georgia, serif`, fontSize: 24, color: "#231712", lineHeight: 1.15 }}>
        {diseno.frase_portada}
      </div>
      <div style={{ fontFamily: "'Archivo', sans-serif", fontSize: 11.5, color: "rgba(35,23,18,.55)", marginTop: 4 }}>
        {diseno.tipografia}
        {diseno.tipografia_titulos && diseno.tipografia_titulos !== diseno.tipografia ? ` · Títulos: ${diseno.tipografia_titulos}` : ""}
      </div>
      {children && <div style={{ display: "flex", gap: 8, marginTop: 12, flexWrap: "wrap", alignItems: "center" }}>{children}</div>}
    </div>
  );
}
