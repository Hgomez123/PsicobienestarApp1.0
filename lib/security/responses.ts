/**
 * Shape estandarizado de respuesta API + helpers de construcción.
 *
 * Toda respuesta JSON del sistema (pipeline o handler) usa estos
 * helpers para garantizar shape consistente: `{ ok: true, data }` en
 * éxito, `{ ok: false, error }` en fallo. El status HTTP viaja en la
 * NextResponse, no duplicado en el body.
 *
 * Si un handler tiene un caso raro (blob, redirect), puede construir
 * NextResponse directo — los helpers no son camisa de fuerza.
 */

import { NextResponse } from "next/server";

export type ApiSuccess<T> = { ok: true; data: T };
export type ApiFailure = { ok: false; error: string };
export type ApiResponse<T> = ApiSuccess<T> | ApiFailure;

export function ok<T>(data: T, init?: ResponseInit): NextResponse {
  return NextResponse.json<ApiSuccess<T>>({ ok: true, data }, init);
}

export function fail(error: string, status: number): NextResponse {
  return NextResponse.json<ApiFailure>({ ok: false, error }, { status });
}
