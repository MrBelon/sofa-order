import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/api";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  const denied = await requireAdmin();
  if (denied) return denied;

  const [total, users, byDrink, byUser, recent] = await Promise.all([
    prisma.order.count(),
    prisma.order.groupBy({ by: ["userId"] }),
    prisma.order.groupBy({
      by: ["drinkName"],
      _count: { _all: true },
      orderBy: { _count: { drinkName: "desc" } },
      take: 10,
    }),
    prisma.order.groupBy({
      by: ["userId"],
      _count: { _all: true },
      orderBy: { _count: { userId: "desc" } },
      take: 10,
    }),
    prisma.order.findMany({
      orderBy: { createdAt: "desc" },
      take: 100,
      select: {
        id: true,
        userName: true,
        drinkName: true,
        webhookStatus: true,
        createdAt: true,
      },
    }),
  ]);

  // Show each guest under the name used for their most recent order.
  const latestNames = await prisma.order.findMany({
    where: { userId: { in: byUser.map((row) => row.userId) } },
    orderBy: { createdAt: "desc" },
    distinct: ["userId"],
    select: { userId: true, userName: true },
  });
  const nameById = new Map(latestNames.map((row) => [row.userId, row.userName]));

  return NextResponse.json({
    stats: {
      totalOrders: total,
      totalUsers: users.length,
      topDrinks: byDrink.map((row) => ({
        name: row.drinkName,
        count: row._count._all,
      })),
      topUsers: byUser.map((row) => ({
        name: nameById.get(row.userId) ?? "?",
        count: row._count._all,
      })),
    },
    orders: recent,
  });
}
