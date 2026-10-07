import { NextResponse } from "next/server";
import { z } from "zod";
import { isPrismaError, jsonError, parseBody, requireAdmin } from "@/lib/api";
import { prisma } from "@/lib/db";
import { categorySchema } from "@/lib/validation";

export const dynamic = "force-dynamic";

type Context = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, { params }: Context) {
  const denied = await requireAdmin();
  if (denied) return denied;

  const id = z.uuid().safeParse((await params).id);
  if (!id.success) return jsonError("Identifiant invalide", 400);

  const { data, error } = await parseBody(request, categorySchema);
  if (error) return error;

  try {
    const category = await prisma.category.update({
      where: { id: id.data },
      data,
    });
    return NextResponse.json({ category });
  } catch (e) {
    if (isPrismaError(e, "P2025")) return jsonError("Catégorie introuvable", 404);
    if (isPrismaError(e, "P2002")) return jsonError("Cette catégorie existe déjà", 409);
    throw e;
  }
}

export async function DELETE(_request: Request, { params }: Context) {
  const denied = await requireAdmin();
  if (denied) return denied;

  const id = z.uuid().safeParse((await params).id);
  if (!id.success) return jsonError("Identifiant invalide", 400);

  const used = await prisma.drink.count({ where: { categoryId: id.data } });
  if (used > 0) {
    return jsonError("Cette catégorie contient encore des boissons", 409);
  }

  try {
    await prisma.category.delete({ where: { id: id.data } });
    return NextResponse.json({ ok: true });
  } catch (e) {
    if (isPrismaError(e, "P2025")) return jsonError("Catégorie introuvable", 404);
    if (isPrismaError(e, "P2003")) {
      return jsonError("Cette catégorie contient encore des boissons", 409);
    }
    throw e;
  }
}
