import { NextResponse } from "next/server";
import { isPrismaError, jsonError, parseBody, requireAdmin } from "@/lib/api";
import { prisma } from "@/lib/db";
import { drinkPatchSchema } from "@/lib/validation";
import { z } from "zod";

export const dynamic = "force-dynamic";

type Context = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, { params }: Context) {
  const denied = await requireAdmin();
  if (denied) return denied;

  const id = z.uuid().safeParse((await params).id);
  if (!id.success) return jsonError("Identifiant invalide", 400);

  const { data, error } = await parseBody(request, drinkPatchSchema);
  if (error) return error;

  try {
    const drink = await prisma.drink.update({ where: { id: id.data }, data });
    return NextResponse.json({ drink });
  } catch (e) {
    if (isPrismaError(e, "P2025")) return jsonError("Boisson introuvable", 404);
    if (isPrismaError(e, "P2002")) {
      return jsonError("Une boisson avec ce code-barres existe déjà", 409);
    }
    if (isPrismaError(e, "P2003")) return jsonError("Catégorie introuvable", 400);
    throw e;
  }
}

export async function DELETE(_request: Request, { params }: Context) {
  const denied = await requireAdmin();
  if (denied) return denied;

  const id = z.uuid().safeParse((await params).id);
  if (!id.success) return jsonError("Identifiant invalide", 400);

  try {
    await prisma.drink.delete({ where: { id: id.data } });
    return NextResponse.json({ ok: true });
  } catch (e) {
    if (isPrismaError(e, "P2025")) return jsonError("Boisson introuvable", 404);
    throw e;
  }
}
