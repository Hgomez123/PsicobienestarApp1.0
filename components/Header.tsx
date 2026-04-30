"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";

type NavLink = { label: string; href: string };

type HeaderProps = {
  navLinks: NavLink[];
  menuOpen: boolean;
  onOpenMenu: () => void;
};

export default function Header({ navLinks, menuOpen, onOpenMenu }: HeaderProps) {
  const [scrolled, setScrolled] = useState(false);
  const [scrollPct, setScrollPct] = useState(0);
  const [activeHref, setActiveHref] = useState<string>(navLinks[0]?.href ?? "");
  const [hoveredHref, setHoveredHref] = useState<string | null>(null);

  // Container del indicator — usado como referencia para calcular posiciones
  const linksRowRef = useRef<HTMLDivElement | null>(null);
  const indicatorRef = useRef<HTMLSpanElement | null>(null);
  const linkRefs = useRef<Map<string, HTMLAnchorElement>>(new Map());
  const ctaRef = useRef<HTMLAnchorElement | null>(null);

  /* ── Scroll: morph del header + barra de progreso ─────────── */
  useEffect(() => {
    const onScroll = () => {
      const h = document.documentElement;
      setScrolled(h.scrollTop > 40);
      const max = h.scrollHeight - h.clientHeight;
      setScrollPct(max > 0 ? (h.scrollTop / max) * 100 : 0);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  /* ── Scroll-spy: detectar sección visible y activar el link ─ */
  useEffect(() => {
    const ids = navLinks
      .map((l) => l.href.replace(/^#/, ""))
      .filter(Boolean);
    const sections = ids
      .map((id) => document.getElementById(id))
      .filter((el): el is HTMLElement => !!el);
    if (sections.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        // Tomar la sección visible más alta en pantalla
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)[0];
        if (!visible) return;
        const href = `#${visible.target.id}`;
        if (navLinks.some((l) => l.href === href)) {
          setActiveHref(href);
        }
      },
      { rootMargin: "-30% 0px -60% 0px", threshold: 0 }
    );
    sections.forEach((s) => observer.observe(s));
    return () => observer.disconnect();
  }, [navLinks]);

  /* ── Indicator: posicionarlo bajo un link específico ──────── */
  function moveIndicatorTo(href: string) {
    const el = linkRefs.current.get(href);
    const container = linksRowRef.current;
    const ind = indicatorRef.current;
    if (!el || !container || !ind) return;
    const cRect = container.getBoundingClientRect();
    const r = el.getBoundingClientRect();
    const left = r.left - cRect.left;
    ind.style.left = `${left + 8}px`;
    ind.style.width = `${r.width - 16}px`;
    ind.style.opacity = "1";
  }

  // Reposicionar indicator al cambiar el link activo o al hover
  useEffect(() => {
    const target = hoveredHref ?? activeHref;
    moveIndicatorTo(target);
  }, [activeHref, hoveredHref, scrolled]);

  // Reposicionar al resize
  useEffect(() => {
    const onResize = () => moveIndicatorTo(hoveredHref ?? activeHref);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [activeHref, hoveredHref]);

  // Posicionar al montar (cuando los refs ya están listos)
  useEffect(() => {
    const t = setTimeout(() => moveIndicatorTo(activeHref), 60);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ── Magnetic CTA ─────────────────────────────────────────── */
  useEffect(() => {
    const el = ctaRef.current;
    if (!el) return;
    const onMove = (e: MouseEvent) => {
      const r = el.getBoundingClientRect();
      const x = e.clientX - r.left - r.width / 2;
      const y = e.clientY - r.top - r.height / 2;
      el.style.transform = `translate(${x * 0.18}px, ${y * 0.18}px)`;
    };
    const onLeave = () => { el.style.transform = ""; };
    el.addEventListener("mousemove", onMove);
    el.addEventListener("mouseleave", onLeave);
    return () => {
      el.removeEventListener("mousemove", onMove);
      el.removeEventListener("mouseleave", onLeave);
    };
  }, []);

  return (
    <>
      {/* Barra de progreso de scroll */}
      <div
        aria-hidden="true"
        className="fixed inset-x-0 top-0 z-[60] h-[3px]"
        style={{
          width: `${scrollPct}%`,
          background:
            "linear-gradient(90deg, #1E5A85 0%, #2d7aaa 50%, #6F98BE 100%)",
          boxShadow: "0 0 12px rgba(45,122,170,0.45)",
          transition: "width .12s linear",
        }}
      />

      <header
        className={`sticky top-0 z-50 transition-all duration-500 ${
          scrolled ? "px-4 pt-3 pb-2 lg:px-8" : "px-4 pt-5 pb-2 lg:px-6"
        }`}
      >
        <div
          className={`mx-auto flex items-center gap-7 transition-all duration-500 ${
            scrolled
              ? "max-w-5xl rounded-[22px] border border-slate-200/80 bg-white/95 px-7 py-3.5 shadow-[0_14px_44px_rgba(30,90,133,0.14)] backdrop-blur-2xl"
              : "max-w-7xl rounded-3xl border border-slate-200/60 bg-white/90 px-8 py-4 shadow-[0_4px_28px_rgba(30,90,133,0.07)] backdrop-blur-xl"
          }`}
        >
          {/* Logo */}
          <a
            href="#inicio"
            aria-label="Inicio"
            className="group flex shrink-0 items-center gap-3"
            onClick={() => setActiveHref("#inicio")}
          >
            <Image
              src="/logosinfondo.png"
              alt="Psicobienestar"
              width={170}
              height={54}
              className={`w-auto object-contain transition-all duration-300 group-hover:scale-[1.04] ${
                scrolled ? "h-10" : "h-11"
              }`}
              priority
            />
            <span className="hidden border-l border-slate-200 pl-3 text-[12px] font-medium leading-tight text-[#6F98BE] lg:block">
              Psicología Clínica<br />Profesional · Guatemala
            </span>
          </a>

          {/* Nav con indicator animado */}
          <nav
            className="relative ml-2 hidden flex-1 items-center justify-center md:flex"
            aria-label="Navegación principal"
            onMouseLeave={() => setHoveredHref(null)}
          >
            <div
              ref={linksRowRef}
              className="relative flex items-center gap-2"
            >
              {navLinks.map(({ label, href }) => {
                const isActive = activeHref === href;
                return (
                  <a
                    key={href}
                    href={href}
                    ref={(el) => {
                      if (el) linkRefs.current.set(href, el);
                      else linkRefs.current.delete(href);
                    }}
                    onMouseEnter={() => setHoveredHref(href)}
                    onFocus={() => setHoveredHref(href)}
                    onBlur={() => setHoveredHref(null)}
                    onClick={() => setActiveHref(href)}
                    className={`relative rounded-xl px-5 py-2.5 text-[15px] font-medium transition-colors duration-200 ${
                      isActive
                        ? "text-[#1E5A85]"
                        : "text-slate-600 hover:text-[#1E5A85]"
                    }`}
                  >
                    {label}
                  </a>
                );
              })}

              {/* Indicator: barra azul con glow, posicionada bajo el link activo/hover */}
              <span
                ref={indicatorRef}
                aria-hidden="true"
                className="pointer-events-none absolute -bottom-1 h-[3px] rounded-full opacity-0"
                style={{
                  background:
                    "linear-gradient(90deg, #1E5A85 0%, #2d7aaa 100%)",
                  boxShadow: "0 4px 12px rgba(30,90,133,0.45)",
                  transition:
                    "left .35s cubic-bezier(.4,0,.2,1), width .35s cubic-bezier(.4,0,.2,1), opacity .2s",
                }}
              />
            </div>
          </nav>

          {/* Acciones desktop */}
          <div className="hidden shrink-0 items-center gap-3 md:flex">
            <a
              href="/login"
              className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-5 py-2.5 text-[14px] font-medium text-slate-700 transition-all duration-200 hover:border-[#1E5A85] hover:bg-[#EEF4F8] hover:text-[#1E5A85]"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="11" width="18" height="11" rx="2" />
                <path d="M7 11V7a5 5 0 0110 0v4" />
              </svg>
              Portal paciente
            </a>
            <a
              ref={ctaRef}
              href="#contacto"
              className="btn-shimmer inline-flex items-center gap-2 rounded-full px-6 py-3 text-[14px] font-semibold text-white shadow-[0_8px_24px_rgba(30,90,133,0.34)]"
              style={{
                background: "linear-gradient(135deg, #1E5A85 0%, #2d7aaa 100%)",
                transition: "transform .25s cubic-bezier(.2,.9,.3,1.2)",
              }}
            >
              <span
                aria-hidden="true"
                className="pulse-dot h-1.5 w-1.5 rounded-full bg-white"
              />
              Agendar cita
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="5" y1="12" x2="19" y2="12" />
                <polyline points="12 5 19 12 12 19" />
              </svg>
            </a>
          </div>

          {/* Hamburguesa móvil */}
          <div className="ml-auto md:hidden">
            <button
              type="button"
              onClick={onOpenMenu}
              aria-label={menuOpen ? "Cerrar menú" : "Abrir menú"}
              aria-expanded={menuOpen}
              className={`flex h-11 w-11 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-600 transition-all hover:border-[#1E5A85]/40 hover:text-[#1E5A85] ${menuOpen ? "ham-open" : ""}`}
            >
              <span className="flex flex-col gap-[5px]">
                <span className="ham-line ham-line-1" />
                <span className="ham-line ham-line-2" />
                <span className="ham-line ham-line-3" />
              </span>
            </button>
          </div>
        </div>
      </header>
    </>
  );
}
