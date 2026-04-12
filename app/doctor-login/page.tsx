"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";
import { doctorSignIn, getDoctorSession, getDoctorProfile } from "@/lib/supabase/db";

export default function DoctorLoginPage() {
  const router = useRouter();

  const [email, setEmail]               = useState("");
  const [password, setPassword]         = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError]               = useState("");
  const [loading, setLoading]           = useState(false);
  const [emailTouched, setEmailTouched]       = useState(false);
  const [passwordTouched, setPasswordTouched] = useState(false);

  useEffect(() => {
    getDoctorSession().then(({ data }) => {
      if (!data.session) return;
      getDoctorProfile(data.session.user.id).then(({ data: profile }) => {
        if (profile?.role === "doctor") router.replace("/doctor");
      });
    });
  }, [router]);

  const cleanEmail    = email.trim().toLowerCase();
  const cleanPassword = password.trim();
  const emailIsEmpty   = emailTouched && !cleanEmail;
  const emailIsInvalid = emailTouched && !!cleanEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail);
  const passwordIsEmpty = passwordTouched && !cleanPassword;

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setEmailTouched(true);
    setPasswordTouched(true);
    setError("");
    if (!cleanEmail || !cleanPassword) { setError("Ingresa tu correo y contraseña."); return; }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) { setError("Ingresa un correo válido."); return; }
    setLoading(true);
    const { data, error: authError } = await doctorSignIn(cleanEmail, cleanPassword);
    if (authError || !data.session) {
      setError("Credenciales incorrectas. Verifica tu correo y contraseña.");
      setLoading(false);
      return;
    }
    const { data: profile } = await getDoctorProfile(data.session.user.id);
    if (!profile || profile.role !== "doctor") {
      setError("Esta cuenta no tiene acceso al portal profesional.");
      setLoading(false);
      return;
    }
    router.push("/doctor");
  }

  return (
    <main
      className="relative min-h-screen overflow-hidden"
      style={{
        background:
          "radial-gradient(ellipse at 20% 45%, #BFDBFE 0%, transparent 55%)," +
          "radial-gradient(ellipse at 80% 15%, #BAE6FD 0%, transparent 50%)," +
          "radial-gradient(ellipse at 50% 85%, #C7D2FE 0%, transparent 48%)," +
          "#EFF6FF",
      }}
    >
      {/* Orbs animados — tonos más azules para perfil profesional */}
      <div className="login-orb login-orb-a" aria-hidden />
      <div className="login-orb login-orb-b login-orb-b--doctor" aria-hidden />
      <div className="login-orb login-orb-c login-orb-c--doctor" aria-hidden />

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
            <span className="login-pill login-pill--doctor">
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#1E5A85" strokeWidth="2.5" strokeLinecap="round">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
              </svg>
              Acceso profesional
            </span>
          </div>

          {/* Título */}
          <h1 className="text-center text-[1.65rem] font-bold tracking-tight text-slate-900">
            Panel clínico 🧠
          </h1>
          <p className="mt-1 text-center text-[12px] font-medium text-[#6F98BE]">
            Lic. María Eugenia Castillo García
          </p>
          <p className="mt-1.5 text-center text-[13.5px] leading-5 text-slate-500">
            Ingresa para gestionar tu práctica y pacientes.
          </p>

          {/* Formulario */}
          <form onSubmit={handleSubmit} className="mt-7 space-y-4">

            {/* Email */}
            <div>
              <label className="login-field-label" htmlFor="dl-email">Correo profesional</label>
              <input
                id="dl-email"
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
              <label className="login-field-label" htmlFor="dl-pass">Contraseña</label>
              <div className="relative">
                <input
                  id="dl-pass"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  placeholder="••••••••"
                  value={password}
                  onChange={e => { setPassword(e.target.value); setError(""); }}
                  onBlur={() => setPasswordTouched(true)}
                  className={`login-field-input pr-16${passwordIsEmpty ? " login-field-input--err" : ""}`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(p => !p)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-[11px] font-bold uppercase tracking-wider text-[#1E5A85] transition hover:text-[#6F98BE]"
                >
                  {showPassword ? "Ocultar" : "Ver"}
                </button>
              </div>
              {passwordIsEmpty && <p className="mt-1.5 text-xs text-red-500">La contraseña es obligatoria.</p>}
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
                  Verificando…
                </>
              ) : "Acceder al panel clínico"}
            </button>
          </form>

          {/* Separador */}
          <div className="login-sep my-6">acceso restringido · uso profesional</div>

          {/* Nota + link */}
          <p className="text-center text-[12px] leading-5 text-slate-400">
            Acceso exclusivo para la profesional a cargo del portal{" "}
            <span className="font-semibold text-slate-500">Psicobienestar</span>.
          </p>
          <p className="mt-4 text-center text-[13px] text-slate-500">
            ¿Eres paciente?{" "}
            <Link href="/login" className="font-semibold text-[#1E5A85] transition hover:text-[#6F98BE]">
              Acceder al portal de pacientes
            </Link>
          </p>
        </div>

        {/* Footer */}
        <p className="mt-8 text-center text-[11px] text-slate-400/60">
          Matrícula Profesional 17538 · Col. Psicólogos de Guatemala
        </p>
      </div>
    </main>
  );
}
