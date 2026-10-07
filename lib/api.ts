import { NextResponse } from "next/server";
import { z } from "zod";
import { isAdmin } from "@/lib/admin-auth";

export function jsonError(message: string, status: number, extra?: object) {
  return NextResponse.json({ error: message, ...extra }, { status });
}

export async function requireAdmin(): Promise<NextResponse | null> {
  return (await isAdmin()) ? null : jsonError("Non autorisé", 401);
}

type ParseResult<T> =
  | { data: T; error?: undefined }
  | { data?: undefined; error: NextResponse };

export async function parseBody<T extends z.ZodType>(
  request: Request,
  schema: T,
): Promise<ParseResult<z.output<T>>> {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return { error: jsonError("Corps de requête invalide", 400) };
  }
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return {
      error: jsonError(
        parsed.error.issues[0]?.message ?? "Données invalides",
        400,
      ),
    };
  }
  return { data: parsed.data };
}

export function isPrismaError(error: unknown, code: string): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    (error as { code: unknown }).code === code
  );
}
