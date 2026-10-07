import { NextResponse } from "next/server";
import { isPrismaError, jsonError, parseBody, requireAdmin } from "@/lib/api";
import { prisma } from "@/lib/db";
import { categorySchema } from "@/lib/validation";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const denied = await requireAdmin();
  if (denied) return denied;

  const { data, error } = await parseBody(request, categorySchema);
  if (error) return error;

  try {
    const category = await prisma.category.create({ data });
    return NextResponse.json({ category }, { status: 201 });
  } catch (e) {
    if (isPrismaError(e, "P2002")) {
      return jsonError("Cette catégorie existe déjà", 409);
    }
    throw e;
  }
}
