/**
 * apiRoute — pipeline unificado para rutas API.
 *
 * Orquesta extracción de token, verificación de rol, rate limit,
 * parseo de body/query con Zod, y verificación de ownership antes
 * de ejecutar la lógica del handler.
 *
 * El handler final solo escribe lógica de negocio. Todos los pasos
 * previos están centralizados acá para garantizar que ningún
 * endpoint olvide auth, rate limit, validación o ownership.
 *
 * Diseño documentado en `lib/security/apiHelper.DESIGN.md`.
 */

import { NextRequest, NextResponse } from "next/server";
import type { ZodTypeAny, infer as ZodInfer } from "zod";

import { extractToken, verifyDoctor, verifyPatient } from "./verifyAuth";
import { checkRateLimit, getClientIp } from "./rateLimit";
import { ERRORS } from "./errors";
import { fail } from "./responses";
import { logError } from "./logError";
import { getUserClient } from "../supabase/server";
import type { SupabaseClient } from "@supabase/supabase-js";

type AuthRole = "doctor" | "patient";
type RateLimitProfile = "strict" | "lenient";

type Inferred<S> = S extends ZodTypeAny ? ZodInfer<S> : undefined;

type OwnershipCheck<TBody, TQuery> =
  | "none"
  | ((ctx: HandlerContext<TBody, TQuery>) => Promise<boolean>);

export interface HandlerContext<TBody, TQuery> {
  /** Id del usuario autenticado (doctor.profile.id o patient.user.id, según `auth`). */
  user: string;
  body: TBody;
  query: TQuery;
  supabase: SupabaseClient;
  req: NextRequest;
}

export interface ApiRouteOptions<
  BodySchema extends ZodTypeAny | undefined,
  QuerySchema extends ZodTypeAny | undefined
> {
  auth: AuthRole;
  rateLimit: RateLimitProfile;
  body?: BodySchema;
  query?: QuerySchema;
  ownership: OwnershipCheck<Inferred<BodySchema>, Inferred<QuerySchema>>;
  handler: (
    ctx: HandlerContext<Inferred<BodySchema>, Inferred<QuerySchema>>
  ) => Promise<NextResponse>;
}

export async function apiRoute<
  BodySchema extends ZodTypeAny | undefined = undefined,
  QuerySchema extends ZodTypeAny | undefined = undefined
>(
  req: NextRequest,
  opts: ApiRouteOptions<BodySchema, QuerySchema>
): Promise<NextResponse> {
  // 1. Token
  const token = extractToken(req);
  if (!token) {
    return fail(ERRORS.UNAUTHORIZED, 401);
  }

  // 2. Auth (rol)
  const verifier = opts.auth === "doctor" ? verifyDoctor : verifyPatient;
  const userId = await verifier(token);
  if (!userId) {
    return fail(ERRORS.UNAUTHORIZED, 401);
  }

  // 3. Rate limit (key: ip + rol + userId para no mezclar tráfico)
  const ip = getClientIp(req);
  const rateKey = `${ip}:${opts.auth}:${userId}`;
  const rl = checkRateLimit(rateKey, opts.rateLimit);
  if (!rl.allowed) {
    const retryAfter = rl.retryAfterSec ?? 60;
    return NextResponse.json(
      { ok: false, error: ERRORS.RATE_LIMITED },
      { status: 429, headers: { "Retry-After": String(retryAfter) } }
    );
  }

  // 4. Body (si hay schema)
  let body: unknown = undefined;
  if (opts.body) {
    let raw: unknown;
    try {
      raw = await req.json();
    } catch {
      return fail(ERRORS.INVALID_REQUEST, 400);
    }
    const parsed = opts.body.safeParse(raw);
    if (!parsed.success) {
      logError("apiRoute:parseBody", parsed.error, {
        path: req.nextUrl.pathname,
        issues: parsed.error.issues,
      });
      return fail(ERRORS.INVALID_REQUEST, 400);
    }
    body = parsed.data;
  }

  // 5. Query (si hay schema)
  let query: unknown = undefined;
  if (opts.query) {
    const queryObj = Object.fromEntries(req.nextUrl.searchParams.entries());
    const parsed = opts.query.safeParse(queryObj);
    if (!parsed.success) {
      logError("apiRoute:parseQuery", parsed.error, {
        path: req.nextUrl.pathname,
        issues: parsed.error.issues,
      });
      return fail(ERRORS.INVALID_REQUEST, 400);
    }
    query = parsed.data;
  }

  // 6. Construcción del contexto
  const supabase = getUserClient(token);
  const ctx = {
    user: userId,
    body: body as never,
    query: query as never,
    supabase,
    req,
  } as HandlerContext<Inferred<BodySchema>, Inferred<QuerySchema>>;

  // 7. Ownership (obligatorio; "none" = explícitamente sin chequeo)
  if (opts.ownership !== "none") {
    let owned = false;
    try {
      owned = await opts.ownership(ctx);
    } catch (err) {
      logError(`apiRoute:ownership:${req.nextUrl.pathname}`, err);
      return fail(ERRORS.SERVER_ERROR, 500);
    }
    if (!owned) {
      return fail(ERRORS.UNAUTHORIZED, 403);
    }
  }

  // 8. Handler
  try {
    return await opts.handler(ctx);
  } catch (err) {
    logError(`apiRoute:handler:${req.nextUrl.pathname}`, err);
    return fail(ERRORS.SERVER_ERROR, 500);
  }
}
