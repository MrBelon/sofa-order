import { NextResponse } from "next/server";
import { isPrismaError, jsonError, parseBody, requireAdmin } from "@/lib/api";
import { prisma } from "@/lib/db";
import { drinkSchema } from "@/lib/validation";

export const dynamic = "force-dynamic";

export async function GET() {
  const denied = await requireAdmin();
  if (denied) return denied;

  const [categories, drinks] = await Promise.all([
    prisma.category.findMany({
      orderBy: { createdAt: "asc" },
      include: { _count: { select: { drinks: true } } },
    }),
    prisma.drink.findMany({ orderBy: { name: "asc" } }),
  ]);

  return NextResponse.json({
    categories: categories.map(({ _count, ...category }) => ({
      ...category,
      drinkCount: _count.drinks,
    })),
    drinks,
  });
}

export async function POST(request: Request) {
  const denied = await requireAdmin();
  if (denied) return denied;

  const { data, error } = await parseBody(request, drinkSchema);
  if (error) return error;

  try {
    const drink = await prisma.drink.create({ data });
    return NextResponse.json({ drink }, { status: 201 });
  } catch (e) {
    if (isPrismaError(e, "P2002")) {
      return jsonError("Une boisson avec ce code-barres existe déjà", 409);
    }
    if (isPrismaError(e, "P2003")) {
      return jsonError("Catégorie introuvable", 400);
    }
    throw e;
  }
}
