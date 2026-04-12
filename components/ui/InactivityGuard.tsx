"use client";

import { useCallback, useEffect, useRef, useState } from "react";

type InactivityGuardProps = {
  /** Minutos sin actividad antes de cerrar sesión (default: 15) */
  timeoutMinutes?: number;
  /** Función que ejecuta el logout */
  onLogout: () => void;
};

const EVENTS = ["mousemove", "mousedown", "keydown", "touchstart", "scroll", "click"] as const;

export default function InactivityGuard({
  timeoutMinutes = 15,
  onLogout,
}: InactivityGuardProps) {
  const timeoutMs  = timeoutMinutes * 60 * 1000;
  const warningMs  = timeoutMs - 2 * 60 * 1000; // aviso 2 min antes

  const [showWarning, setShowWarning]   = useState(false);
  const [countdown, setCountdown]       = useState(120);  // segundos

  const logoutTimer  = useRef<ReturnType<typeof setTimeout> | null>(null);
  const warningTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const warningShown = useRef(false);

  const clearAllTimers = useCallback(() => {
    if (logoutTimer.current)  clearTimeout(logoutTimer.current);
    if (warningTimer.current) clearTimeout(warningTimer.current);
    if (countdownRef.current) clearInterval(countdownRef.current);
  }, []);

  const resetTimers = useCallback(() => {
    clearAllTimers();
    warningShown.current = false;
    setShowWarning(false);
    setCountdown(120);

    warningTimer.current = setTimeout(() => {
      if (warningShown.current) return;
      warningShown.current = true;
      setShowWarning(true);
      setCountdown(120);

      countdownRef.current = setInterval(() => {
        setCountdown(prev => {
          if (prev <= 1) {
            clearInterval(countdownRef.current!);
            return 0;
          }
          return prev - 1;
        });
      }, 1_000);
    }, warningMs);

    logoutTimer.current = setTimeout(() => {
      clearAllTimers();
      setShowWarning(false);
      onLogout();
    }, timeoutMs);
  }, [clearAllTimers, warningMs, timeoutMs, onLogout]);

  /* ── Registrar eventos de actividad ─────────────────────── */
  useEffect(() => {
    resetTimers();
    EVENTS.forEach(e => window.addEventListener(e, resetTimers, { passive: true }));
    return () => {
      clearAllTimers();
      EVENTS.forEach(e => window.removeEventListener(e, resetTimers));
    };
  }, [resetTimers, clearAllTimers]);

  function handleStayActive() {
    resetTimers();
  }

  if (!showWarning) return null;

  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center bg-slate-900/70 p-4 backdrop-blur-sm">
      <div className="w-full max-w-sm overflow-hidden rounded-[28px] bg-white shadow-[0_32px_100px_rgba(15,23,42,0.4)]">
        {/* Header */}
        <div className="flex flex-col items-center gap-3 bg-gradient-to-br from-amber-500 to-orange-500 px-8 py-8 text-center">
          <div
            className="flex h-16 w-16 items-center justify-center rounded-2xl text-3xl"
            style={{ background: "rgba(255,255,255,0.2)", backdropFilter: "blur(8px)" }}
          >
            ⏱️
          </div>
          <div>
            <p className="text-sm font-medium text-white/80">Seguridad</p>
            <p className="text-xl font-bold text-white">Sesión por expirar</p>
          </div>
        </div>

        {/* Body */}
        <div className="px-7 py-6 text-center">
          <p className="text-sm leading-7 text-slate-600">
            Por seguridad, tu sesión se cerrará automáticamente en{" "}
            <span className="font-semibold text-slate-900">
              {countdown > 60
                ? `${Math.floor(countdown / 60)}:${String(countdown % 60).padStart(2, "0")} min`
                : `${countdown} segundos`}
            </span>{" "}
            por inactividad.
          </p>

          {/* Barra de progreso */}
          <div className="mt-4 h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
            <div
              className="h-full rounded-full bg-gradient-to-r from-amber-400 to-orange-500 transition-all duration-1000"
              style={{ width: `${(countdown / 120) * 100}%` }}
            />
          </div>

          <button
            type="button"
            onClick={handleStayActive}
            className="mt-6 w-full rounded-2xl bg-gradient-to-r from-[#1E5A85] to-[#6F98BE] py-3.5 text-sm font-semibold text-white shadow-[0_4px_14px_rgba(30,90,133,0.3)] transition hover:-translate-y-0.5"
          >
            Seguir en el portal
          </button>

          <button
            type="button"
            onClick={onLogout}
            className="mt-3 w-full rounded-2xl border border-slate-200 bg-white py-3 text-sm text-slate-500 transition hover:bg-slate-50 hover:text-slate-700"
          >
            Cerrar sesión ahora
          </button>
        </div>
      </div>
    </div>
  );
}
