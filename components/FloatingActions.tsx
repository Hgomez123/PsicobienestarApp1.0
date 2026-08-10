"use client";

import { useEffect, useState } from "react";

const WA = "https://wa.me/50243123394";
const MAIL = "mailto:gt.psicobienestar@gmail.com";
const MAPA =
  "https://www.google.com/maps/search/?api=1&query=Edificio+Renovati+Centro+M%C3%A9dico+Empresarial+Zona+10+Guatemala";

const ICONO_WA = (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z" />
  </svg>
);

const ICONO_CORREO = (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
    <polyline points="22,6 12,13 2,6" />
  </svg>
);

const ICONO_MAPA = (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" />
    <circle cx="12" cy="10" r="3" />
  </svg>
);

/**
 * Acciones flotantes: WhatsApp, correo y ubicación, más el "volver arriba".
 *
 * En desktop las tres acciones están siempre visibles. En móvil arrancan
 * colapsadas detrás de un solo botón (WhatsApp, el canal principal de la
 * consulta): tres botones apilados son ~160px pegados al borde derecho,
 * justo encima del formulario de contacto.
 *
 * El "volver arriba" vive acá y no suelto en la página para que ambos
 * compartan una única columna y no se solapen.
 */
export default function FloatingActions() {
  const [scrolled, setScrolled] = useState(false);
  const [abierto, setAbierto] = useState(false);

  useEffect(() => {
    let frame = 0;
    const apply = () => {
      frame = 0;
      // Booleano: solo re-renderiza al cruzar el umbral, no en cada scroll.
      setScrolled(window.scrollY > 400);
    };
    const onScroll = () => {
      if (frame) return;
      frame = requestAnimationFrame(apply);
    };
    apply();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      if (frame) cancelAnimationFrame(frame);
    };
  }, []);

  // Escape cierra el grupo expandido en móvil.
  useEffect(() => {
    if (!abierto) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setAbierto(false);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [abierto]);

  const acciones = [
    { href: WA, label: "Escribir por WhatsApp", icono: ICONO_WA, clase: "fab--wa", externo: true },
    { href: MAIL, label: "Enviar un correo", icono: ICONO_CORREO, clase: "", externo: false },
    { href: MAPA, label: "Ver ubicación en el mapa", icono: ICONO_MAPA, clase: "", externo: true },
  ];

  return (
    <div className="fab-col">
      <div className="fab-acciones" data-abierto={abierto ? "true" : "false"}>
        {acciones.map(({ href, label, icono, clase, externo }, i) => (
          <a
            key={label}
            href={href}
            {...(externo ? { target: "_blank", rel: "noopener noreferrer" } : {})}
            aria-label={label}
            style={{ "--fab-i": i } as React.CSSProperties}
            className={`fab ${clase}`}
          >
            {icono}
          </a>
        ))}
      </div>

      {/* Disparador: solo móvil, el CSS lo oculta desde md. */}
      <button
        type="button"
        onClick={() => setAbierto((v) => !v)}
        aria-expanded={abierto}
        aria-label={abierto ? "Cerrar opciones de contacto" : "Abrir opciones de contacto"}
        className="fab fab--wa fab-toggle"
      >
        {abierto ? (
          <svg width="18" height="18" viewBox="0 0 16 16" fill="none" aria-hidden="true">
            <path d="M2 2l12 12M14 2L2 14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
        ) : (
          ICONO_WA
        )}
      </button>

      {scrolled && (
        <button
          type="button"
          onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          aria-label="Volver al inicio"
          className="fab fab--subir"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <polyline points="18 15 12 9 6 15" />
          </svg>
        </button>
      )}
    </div>
  );
}
