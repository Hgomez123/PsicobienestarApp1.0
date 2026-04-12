"use client";

import { useEffect, useState } from "react";

export type OnboardingStep = {
  icon: string;
  color: string;        // gradient stop, e.g. "#1E5A85"
  colorAlt: string;     // second stop
  title: string;
  description: string;
  tip?: string;         // small callout hint
};

type OnboardingModalProps = {
  steps: OnboardingStep[];
  storageKey: string;          // localStorage key to mark as done
  open: boolean;
  onClose: () => void;
};

export default function OnboardingModal({
  steps,
  storageKey,
  open,
  onClose,
}: OnboardingModalProps) {
  const [step, setStep] = useState(0);
  const [animDir, setAnimDir] = useState<"next" | "prev">("next");
  const [animating, setAnimating] = useState(false);

  // Reset to step 0 when opened
  useEffect(() => {
    if (open) setStep(0);
  }, [open]);

  if (!open) return null;

  const current = steps[step];
  const isLast  = step === steps.length - 1;
  const isFirst = step === 0;

  function goNext() {
    if (isLast) {
      localStorage.setItem(storageKey, "1");
      onClose();
      return;
    }
    setAnimDir("next");
    setAnimating(true);
    setTimeout(() => {
      setStep(s => s + 1);
      setAnimating(false);
    }, 180);
  }

  function goPrev() {
    if (isFirst) return;
    setAnimDir("prev");
    setAnimating(true);
    setTimeout(() => {
      setStep(s => s - 1);
      setAnimating(false);
    }, 180);
  }

  const slideClass = animating
    ? animDir === "next"
      ? "opacity-0 translate-x-4"
      : "opacity-0 -translate-x-4"
    : "opacity-100 translate-x-0";

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm">
      <div
        className="relative w-full max-w-md overflow-hidden rounded-[28px] bg-white shadow-[0_32px_100px_rgba(15,23,42,0.35)]"
        onClick={e => e.stopPropagation()}
      >
        {/* Colored header */}
        <div
          className="relative flex flex-col items-center justify-center px-8 pb-8 pt-10 text-center"
          style={{
            background: `linear-gradient(145deg, ${current.color} 0%, ${current.colorAlt} 100%)`,
          }}
        >
          {/* Step counter badge */}
          <div className="absolute left-5 top-5 rounded-full bg-white/20 px-3 py-1 text-[11px] font-semibold text-white/90">
            {step + 1} / {steps.length}
          </div>

          {/* Icon */}
          <div
            className="flex h-20 w-20 items-center justify-center rounded-2xl text-4xl shadow-[0_8px_32px_rgba(0,0,0,0.18)]"
            style={{ background: "rgba(255,255,255,0.18)", backdropFilter: "blur(8px)" }}
          >
            {current.icon}
          </div>
        </div>

        {/* Body — animated */}
        <div
          className={`px-7 pb-7 pt-6 transition-all duration-180 ${slideClass}`}
          style={{ transition: "opacity 0.18s ease, transform 0.18s ease" }}
        >
          <h2 className="text-[1.3rem] font-bold tracking-tight text-slate-900">
            {current.title}
          </h2>
          <p className="mt-3 text-sm leading-7 text-slate-600">
            {current.description}
          </p>

          {current.tip && (
            <div className="mt-4 flex items-start gap-2.5 rounded-2xl border border-[#D0E5F0] bg-[#EEF4F8] px-4 py-3">
              <span className="mt-0.5 shrink-0 text-base">💡</span>
              <p className="text-[12.5px] leading-5 text-[#1E5A85]">{current.tip}</p>
            </div>
          )}

          {/* Progress dots */}
          <div className="mt-6 flex items-center justify-center gap-1.5">
            {steps.map((_, i) => (
              <span
                key={i}
                className="block rounded-full transition-all duration-300"
                style={{
                  width:  i === step ? 22 : 7,
                  height: 7,
                  background: i === step ? current.color : "#CBD5E1",
                }}
              />
            ))}
          </div>

          {/* Actions */}
          <div className="mt-6 flex items-center gap-3">
            {!isFirst && (
              <button
                type="button"
                onClick={goPrev}
                className="flex h-11 flex-1 items-center justify-center rounded-2xl border border-slate-200 bg-white text-sm font-medium text-slate-600 transition hover:bg-slate-50 hover:text-slate-900"
              >
                ← Anterior
              </button>
            )}
            <button
              type="button"
              onClick={goNext}
              className="flex h-11 flex-1 items-center justify-center rounded-2xl text-sm font-semibold text-white shadow-[0_4px_14px_rgba(0,0,0,0.18)] transition hover:-translate-y-0.5"
              style={{ background: `linear-gradient(135deg, ${current.color}, ${current.colorAlt})` }}
            >
              {isLast ? "¡Entendido, comenzar!" : "Siguiente →"}
            </button>
          </div>

          {/* Skip on first step only */}
          {isFirst && (
            <button
              type="button"
              onClick={() => {
                localStorage.setItem(storageKey, "1");
                onClose();
              }}
              className="mt-3 w-full text-center text-[12px] text-slate-400 transition hover:text-slate-600"
            >
              Omitir guía
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
