import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  const categories = await prisma.category.findMany({
    orderBy: { createdAt: "asc" },
    select: {
      id: true,
      name: true,
      drinks: {
        orderBy: { name: "asc" },
        select: {
          id: true,
          name: true,
          description: true,
          imageUrl: true,
          alcoholPercentage: true,
          available: true,
        },
      },
    },
  });

  return NextResponse.json(
    { categories: categories.filter((category) => category.drinks.length > 0) },
    { headers: { "Cache-Control": "no-store" } },
  );
}
