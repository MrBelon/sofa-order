import { NextResponse } from "next/server";
import { jsonError, parseBody, requireAdmin } from "@/lib/api";
import { prisma } from "@/lib/db";
import { lookupBarcode } from "@/lib/openfoodfacts";
import { openFoodFactsSchema } from "@/lib/validation";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const denied = await requireAdmin();
  if (denied) return denied;

  const { data, error } = await parseBody(request, openFoodFactsSchema);
  if (error) return error;

  const existing = await prisma.drink.findUnique({
    where: { barcode: data.barcode },
    select: { id: true, name: true },
  });
  if (existing) {
    return jsonError(`« ${existing.name} » existe déjà avec ce code-barres`, 409, {
      existingDrinkId: existing.id,
    });
  }

  const result = await lookupBarcode(data.barcode);
  if (result.status === "not_found") {
    return jsonError("Produit introuvable dans Open Food Facts.", 404);
  }
  if (result.status === "error") {
    return jsonError("Open Food Facts est injoignable pour le moment.", 502);
  }

  return NextResponse.json({ product: result.product });
}
