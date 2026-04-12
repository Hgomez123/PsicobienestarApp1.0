"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";
import { signIn, getSession, getProfile } from "@/lib/supabase/db";

export default function LoginPage() {
  const router = useRouter();

  const [email, setEmail]               = useState("");
  const [password, setPassword]         = useState("");
  const [remember, setRemember]         = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError]               = useState("");
  const [loading, setLoading]           = useState(false);
  const [emailTouched, setEmailTouched]       = useState(false);
  const [passwordTouched, setPasswordTouched] = useState(false);

  useEffect(() => {
    getSession().then(({ data }) => {
      if (!data.session) return;
      getProfile(data.session.user.id).then(({ data: profile }) => {
        if (profile?.role === "patient") router.replace("/portal");
      });
    });
    const remembered = localStorage.getItem("psicobienestar_remembered_email");
    if (remembered) { setEmail(remembered); setRemember(true); }
  }, [router]);

  const cleanEmail    = email.trim().toLowerCase();
  const cleanPassword = password.trim();
  const emailIsEmpty   = emailTouched && !cleanEmail;
  const emailIsInvalid = emailTouched && !!cleanEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail);
  const passwordIsEmpty = passwordTouched && !cleanPassword;
  const passwordIsShort = passwordTouched && !!cleanPassword && cleanPassword.length < 6;

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setEmailTouched(true);
    setPasswordTouched(true);
    setError("");
    if (!cleanEmail || !cleanPassword) { setError("Ingresa tu correo y contraseña."); return; }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) { setError("Ingresa un correo válido."); return; }
    if (cleanPassword.length < 6) { setError("La contraseña debe tener al menos 6 caracteres."); return; }
    setLoading(true);
    const { data, error: authError } = await signIn(cleanEmail, cleanPassword);
    if (authError || !data.session) {
      setError("Credenciales incorrectas. Verifica tu correo y contraseña.");
      setLoading(false);
      return;
    }
    const { data: profile } = await getProfile(data.session.user.id);
    if (!profile || profile.role !== "patient") {
      setError("Esta cuenta no tiene acceso al portal de pacientes.");
      setLoading(false);
      return;
    }
    if (remember) {
      localStorage.setItem("psicobienestar_remembered_email", cleanEmail);
    } else {
      localStorage.removeItem("psicobienestar_remembered_email");
    }
    router.push("/portal");
  }

  return (
    <main
      className="relative min-h-screen overflow-hidden"
      style={{
        background:
          "radial-gradient(ellipse at 15% 45%, #BFDBFE 0%, transparent 55%)," +
          "radial-gradient(ellipse at 85% 15%, #DDD6FE 0%, transparent 50%)," +
          "radial-gradient(ellipse at 55% 88%, #BAE6FD 0%, transparent 48%)," +
          "#EFF6FF",
      }}
    >
      {/* Orbs animados */}
      <div className="login-orb login-orb-a" aria-hidden />
      <div className="login-orb login-orb-b" aria-hidden />
      <div className="login-orb login-orb-c" aria-hidden />

      {/* Contenido centrado */}
      <div className="relative z-10 flex min-h-screen flex-col items-center justify-center px-4 py-10">

        {/* Volver */}
        <div className="mb-5 w-full max-w-[430px]">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-[13px] font-medium text-slate-500 transition hover:text-[#1E5A85]"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M19 12H5M12 5l-7 7 7 7"/>
            </svg>
            Volver al sitio
          </Link>
        </div>

        {/* Card */}
        <div className="login-card">

          {/* Logo */}
          <div className="mb-5 flex justify-center">
            <Image
              src="/logosinfondo.png"
              alt="Psicobienestar"
              width={130}
              height={40}
              className="h-9 w-auto object-contain"
            />
          </div>

          {/* Badge */}
          <div className="mb-5 flex justify-center">
            <span className="login-pill">
              <span
                style={{
                  display: "inline-block",
                  width: 6,
                  height: 6,
                  borderRadius: "50%",
                  background: "#4ade80",
                  animation: "quoteLivePulse 2.2s ease-in-out infinite",
                }}
              />
              Portal del paciente
            </span>
          </div>

          {/* Título */}
          <h1 className="text-center text-[1.65rem] font-bold tracking-tight text-slate-900">
            Bienvenida/o de vuelta 👋
          </h1>
          <p className="mt-1.5 text-center text-[13.5px] leading-5 text-slate-500">
            Ingresa para acceder a tu espacio personal de bienestar.
          </p>

          {/* Formulario */}
          <form onSubmit={handleSubmit} className="mt-7 space-y-4">

            {/* Email */}
            <div>
              <label className="login-field-label" htmlFor="lp-email">Correo electrónico</label>
              <input
                id="lp-email"
                type="email"
                autoComplete="email"
                placeholder="tu@correo.com"
                value={email}
                onChange={e => { setEmail(e.target.value); setError(""); }}
                onBlur={() => setEmailTouched(true)}
                className={`login-field-input${emailIsEmpty || emailIsInvalid ? " login-field-input--err" : ""}`}
              />
              {emailIsEmpty   && <p className="mt-1.5 text-xs text-red-500">El correo es obligatorio.</p>}
              {emailIsInvalid && <p className="mt-1.5 text-xs text-red-500">Ingresa un correo válido.</p>}
            </div>

            {/* Contraseña */}
            <div>
              <label className="login-field-label" htmlFor="lp-pass">Contraseña</label>
              <div className="relative">
                <input
                  id="lp-pass"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  placeholder="••••••••"
                  value={password}
                  onChange={e => { setPassword(e.target.value); setError(""); }}
                  onBlur={() => setPasswordTouched(true)}
                  className={`login-field-input pr-16${passwordIsEmpty || passwordIsShort ? " login-field-input--err" : ""}`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(p => !p)}
                  aria-label={showPassword ? "Ocultar contraseña" : "Ver contraseña"}
                  className="absolute right-3 top-1/2 -translate-y-1/2 flex min-h-[44px] min-w-[44px] items-center justify-center rounded-lg text-[#1E5A85] transition hover:text-[#6F98BE] active:opacity-70"
                >
                  {showPassword ? (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/>
                      <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/>
                      <line x1="1" y1="1" x2="23" y2="23"/>
                    </svg>
                  ) : (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                      <circle cx="12" cy="12" r="3"/>
                    </svg>
                  )}
                </button>
              </div>
              {passwordIsEmpty && <p className="mt-1.5 text-xs text-red-500">La contraseña es obligatoria.</p>}
              {passwordIsShort && <p className="mt-1.5 text-xs text-red-500">Mínimo 6 caracteres.</p>}
            </div>

            {/* Recordar + ¿Olvidaste? */}
            <div className="flex items-center justify-between gap-2 pt-0.5 text-[13px]">
              <label className="flex cursor-pointer select-none items-center gap-2 text-slate-600">
                <input
                  type="checkbox"
                  checked={remember}
                  onChange={e => setRemember(e.target.checked)}
                  className="h-4 w-4 rounded border-slate-300 accent-[#1E5A85]"
                />
                Recordar correo
              </label>
              <a href="#" className="font-medium text-[#1E5A85] transition hover:text-[#6F98BE]">
                ¿Olvidaste tu contraseña?
              </a>
            </div>

            {/* Error */}
            {error && (
              <div className="flex items-start gap-2.5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-[13px] text-red-600">
                <span className="mt-px shrink-0 font-bold">⚠</span>
                {error}
              </div>
            )}

            {/* Botón */}
            <button type="submit" disabled={loading} className="login-submit">
              {loading ? (
                <>
                  <svg className="animate-spin" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <path d="M21 12a9 9 0 11-6.219-8.56" strokeLinecap="round"/>
                  </svg>
                  Ingresando…
                </>
              ) : "Ingresar al portal"}
            </button>
          </form>

          {/* Separador */}
          <div className="login-sep my-6">acceso seguro y confidencial</div>

          {/* Nota + link */}
          <p className="text-center text-[12px] leading-5 text-slate-400">
            Acceso exclusivo para pacientes habilitados por{" "}
            <span className="font-semibold text-slate-500">Psicobienestar</span>.
          </p>
          <p className="mt-4 text-center text-[13px] text-slate-500">
            ¿Aún no tienes acceso?{" "}
            <Link href="/" className="font-semibold text-[#1E5A85] transition hover:text-[#6F98BE]">
              Volver al sitio principal
            </Link>
          </p>
        </div>

        {/* Footer */}
        <p className="mt-8 text-center text-[11px] text-slate-400/60">
          Lic. María Eugenia Castillo García · Matrícula 17538
        </p>
      </div>
    </main>
  );
}
