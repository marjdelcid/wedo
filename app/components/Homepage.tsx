"use client";
import { useEffect } from "react";
import Link from "next/link";
import "../home.css";

export default function Homepage() {
  // Confetti burst on the CTAs + pointer parallax on the hero layers.
  useEffect(() => {
    const reduce =
      window.matchMedia &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const COLORS = ["#E84B8A", "#87A6E8", "#B3C24A", "#EE5A28", "#F3C9C2"];
    const cleanups: Array<() => void> = [];

    function burst(x: number, y: number) {
      if (reduce) return;
      const n = 18;
      for (let i = 0; i < n; i++) {
        const c = document.createElement("div");
        c.className = "confetti";
        const col = COLORS[i % COLORS.length];
        c.style.background = col;
        if (i % 3 === 0) {
          c.style.borderRadius = "50%";
          c.style.width = "9px";
          c.style.height = "9px";
        }
        c.style.left = x + "px";
        c.style.top = y + "px";
        document.body.appendChild(c);
        const ang = Math.PI * (0.15 + Math.random() * 0.7) * -1; // upward arc
        const spread = (Math.random() - 0.5) * 2.2;
        const dist = 90 + Math.random() * 150;
        const dx = Math.cos(ang) * dist * spread * 1.2;
        const dy = Math.sin(ang) * dist - (40 + Math.random() * 60);
        const rot = Math.random() * 720 - 360;
        const dur = 700 + Math.random() * 600;
        c.animate(
          [
            { transform: "translate(0,0) rotate(0deg)", opacity: 1 },
            {
              transform:
                "translate(" + dx * 0.6 + "px," + dy + "px) rotate(" + rot * 0.6 + "deg)",
              opacity: 1,
              offset: 0.5,
            },
            {
              transform:
                "translate(" + dx + "px," + (dy + 220) + "px) rotate(" + rot + "deg)",
              opacity: 0,
            },
          ],
          { duration: dur, easing: "cubic-bezier(.18,.7,.4,1)", fill: "forwards" }
        );
        setTimeout(
          (function (el: HTMLDivElement) {
            return function () {
              el.remove();
            };
          })(c),
          dur + 60
        );
      }
    }

    function fire(el: Element) {
      const r = el.getBoundingClientRect();
      burst(r.left + r.width / 2, r.top + r.height / 2);
    }

    ["cta-main", "cta-close"].forEach(function (id) {
      const el = document.getElementById(id);
      if (!el) return;
      const onClick = (e: Event) => {
        e.preventDefault();
        fire(el);
      };
      let last = 0;
      const onEnter = () => {
        const t = Date.now();
        if (t - last > 900) {
          last = t;
          fire(el);
        }
      };
      el.addEventListener("click", onClick);
      el.addEventListener("mouseenter", onEnter);
      cleanups.push(() => {
        el.removeEventListener("click", onClick);
        el.removeEventListener("mouseenter", onEnter);
      });
    });

    /* pointer parallax — composes with CSS translate/rotate via the transform property */
    const hero = document.querySelector<HTMLElement>(".hero");
    const layers = Array.prototype.slice.call(
      document.querySelectorAll<HTMLElement>(".hero [data-depth]")
    ) as HTMLElement[];
    if (
      hero &&
      layers.length &&
      !reduce &&
      window.matchMedia("(pointer:fine)").matches
    ) {
      let tx = 0,
        ty = 0,
        cx = 0,
        cy = 0,
        raf: number | null = null;
      function loop() {
        cx += (tx - cx) * 0.08;
        cy += (ty - cy) * 0.08;
        layers.forEach(function (el) {
          const d = parseFloat(el.getAttribute("data-depth") || "0") || 0;
          el.style.transform =
            "translate3d(" +
            ((cx * d) / 60).toFixed(2) +
            "px," +
            ((cy * d) / 60).toFixed(2) +
            "px,0)";
        });
        if (Math.abs(tx - cx) > 0.1 || Math.abs(ty - cy) > 0.1) {
          raf = requestAnimationFrame(loop);
        } else {
          raf = null;
        }
      }
      const onMove = (e: PointerEvent) => {
        const r = hero.getBoundingClientRect();
        tx = (e.clientX - (r.left + r.width / 2)) / (r.width / 2);
        ty = (e.clientY - (r.top + r.height / 2)) / (r.height / 2);
        if (!raf) raf = requestAnimationFrame(loop);
      };
      const onLeave = () => {
        tx = 0;
        ty = 0;
        if (!raf) raf = requestAnimationFrame(loop);
      };
      hero.addEventListener("pointermove", onMove as EventListener);
      hero.addEventListener("pointerleave", onLeave);
      cleanups.push(() => {
        hero.removeEventListener("pointermove", onMove as EventListener);
        hero.removeEventListener("pointerleave", onLeave);
        if (raf) cancelAnimationFrame(raf);
      });
    }

    return () => cleanups.forEach((fn) => fn());
  }, []);

  return (
    <div className="wedo-home" id="top">
      {/* NAV */}
      <header className="nav">
        <div className="wrap nav-in">
          <a className="logo brandmark" href="#top">
            wedo<span className="dot">.</span>
          </a>
          <nav className="nav-r">
            <a className="link-u hide-sm" href="#funciones">
              Cómo funciona
            </a>
            <Link className="link-u" href="/login">
              Iniciar sesión
            </Link>
            <Link
              className="btn btn-ink"
              href="/registro"
              style={{ padding: "10px 18px", fontSize: 14 }}
            >
              Crea tu evento
            </Link>
          </nav>
        </div>
      </header>

      <main>
        {/* HERO */}
        <section className="hero">
          <div className="stage">
            {/* depth: organic color blobs */}
            <span className="blob b-peri" data-depth="22" aria-hidden="true" />
            <span className="blob b-lima" data-depth="34" aria-hidden="true" />
            <span className="blob b-durazno" data-depth="46" aria-hidden="true" />
            <span className="blob b-coral" data-depth="58" aria-hidden="true" />

            {/* depth: floating product elements (invite is behind the text) */}
            <div className="float fl-invite" data-depth="28">
              <div className="k">Nuestra boda</div>
              <div className="n">
                María <span className="it">&amp;</span> José
              </div>
              <div className="d">15 · febrero · 2026</div>
              <div className="lg">
                wedo<span className="dot">.</span>
              </div>
            </div>
            <div className="float chip chip-money" data-depth="64">
              <span className="ck">
                <span className="d" style={{ background: "var(--lime)" }} />
                Recibido
              </span>
              <span className="cv">Q 12,400</span>
            </div>
            <div className="float chip chip-rsvp" data-depth="76">
              <span className="ck">
                <span className="d" style={{ background: "var(--peri)" }} />
                RSVP
              </span>
              <span className="cv">
                86{" "}
                <span className="it" style={{ fontSize: 15, opacity: 0.55 }}>
                  confirmados
                </span>
              </span>
            </div>

            {/* content layer */}
            <div className="stage-inner wrap">
              <span className="eyebrow hero-eyebrow anim d1">
                <span className="d" />
                Para bodas y toda celebración · Guatemala
              </span>

              <h1 className="lema">
                <span className="word w-invita">Invita,</span>{" "}
                <span className="word w-celebra">celebra,</span>{" "}
                <span className="word w-recibe">recibe</span>
              </h1>

              <div className="hero-foot">
                <div className="hero-cta anim d6">
                  <Link className="btn btn-pink" id="cta-main" href="/registro">
                    Crea tu evento
                    <span className="dotmini" />
                  </Link>
                  <a className="link-u" href="#funciones">
                    Ver cómo funciona
                  </a>
                </div>
                <div className="hero-desc anim d7">
                  <p className="sign">
                    Que empiece con un sí<span className="dot">.</span>
                  </p>
                  <p className="sub">
                    Invita, gestiona el RSVP y recibe los regalos en efectivo —en
                    quetzales, directo a tu cuenta. Tú decides cómo usarlo.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* FUNCTIONS */}
        <section className="funcs" id="funciones">
          <div className="wrap">
            <div className="funcs-head">
              <h2>
                Todo en un solo lugar
                <span style={{ color: "var(--pink)", fontStyle: "normal" }}>.</span>
              </h2>
              <span className="eyebrow anim d1">
                <span className="d" />
                Tres pasos, una página
              </span>
            </div>
            <div className="fgrid">
              <article className="fcard c1 anim d2">
                <span className="fnum">i</span>
                <div className="ft">
                  <span className="fdot" />
                  <h3>Invita</h3>
                </div>
                <p>
                  Invitaciones digitales con estilo, listas para compartir por
                  WhatsApp o link. Tu evento, con tu cara.
                </p>
              </article>
              <article className="fcard c2 anim d3">
                <span className="fnum">ii</span>
                <div className="ft">
                  <span className="fdot" />
                  <h3>Confirma</h3>
                </div>
                <p>
                  Gestiona el RSVP sin enredos. Mira quién viene en tiempo real,
                  desde tu teléfono.
                </p>
              </article>
              <article className="fcard c3 anim d4">
                <span className="fnum">iii</span>
                <div className="ft">
                  <span className="fdot" />
                  <h3>Recibe</h3>
                </div>
                <p>
                  Una lista de regalos en efectivo, en quetzales, directo a tu
                  cuenta. Tú eliges en qué gastarlo.
                </p>
              </article>
            </div>
          </div>
        </section>

        {/* EVENT TYPES */}
        <section className="events">
          <div className="wrap events-in">
            <span className="lbl">Para celebrar</span>
            <span className="ev serif">
              Bodas<span className="d" />
            </span>
            <span className="ev serif">
              Baby showers<span className="d" />
            </span>
            <span className="ev serif">
              Cumpleaños<span className="d" />
            </span>
            <span className="ev serif">
              Despedidas<span className="d" />
            </span>
            <span className="ev serif">
              y más<span className="d" />
            </span>
          </div>
        </section>

        {/* CLOSING CTA */}
        <section className="close">
          <div className="wrap">
            <p className="sign-lg">
              Que empiece
              <br />
              con un sí<span className="dot">.</span>
            </p>
            <p>
              Tu próxima celebración empieza aquí. Crea tu evento gratis en un
              minuto.
            </p>
            <Link className="btn btn-pink" id="cta-close" href="/registro">
              Crea tu evento
              <span className="dotmini" />
            </Link>

            <div className="foot">
              <div className="logo">
                wedo<span className="dot">.</span>
              </div>
              <span>© 2026 wedo. · Guatemala</span>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
