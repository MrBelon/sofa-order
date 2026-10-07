import { NextResponse } from "next/server";
import { jsonError, parseBody } from "@/lib/api";
import { ORDER_COOLDOWN_SECONDS } from "@/lib/constants";
import { prisma } from "@/lib/db";
import { orderSchema, userIdQuerySchema } from "@/lib/validation";
import { notifyHomeAssistant } from "@/lib/webhook";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const userId = userIdQuerySchema.safeParse(
    new URL(request.url).searchParams.get("userId"),
  );
  if (!userId.success) return jsonError("userId invalide", 400);

  const orders = await prisma.order.findMany({
    where: { userId: userId.data },
    orderBy: { createdAt: "desc" },
    take: 200,
    select: {
      id: true,
      drinkName: true,
      createdAt: true,
      drink: { select: { category: { select: { name: true } } } },
    },
  });

  return NextResponse.json(
    {
      orders: orders.map(({ drink, ...order }) => ({
        ...order,
        category: drink?.category.name ?? null,
      })),
    },
    { headers: { "Cache-Control": "no-store" } },
  );
}

type CreateResult =
  | { kind: "ok"; orderId: string; drinkName: string; userName: string }
  | { kind: "not_found" }
  | { kind: "unavailable" }
  | { kind: "cooldown"; retryAfter: number };

export async function POST(request: Request) {
  const { data, error } = await parseBody(request, orderSchema);
  if (error) return error;

  // The advisory lock serialises concurrent orders of the same user so the
  // cooldown check and the insert are atomic.
  const result = await prisma.$transaction(async (tx): Promise<CreateResult> => {
    await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${data.userId}))`;

    const drink = await tx.drink.findUnique({
      where: { id: data.drinkId },
      select: { id: true, name: true, available: true },
    });
    if (!drink) return { kind: "not_found" };
    if (!drink.available) return { kind: "unavailable" };

    const now = new Date();
    const lastOrder = await tx.order.findFirst({
      where: {
        userId: data.userId,
        createdAt: { gt: new Date(now.getTime() - ORDER_COOLDOWN_SECONDS * 1000) },
      },
      orderBy: { createdAt: "desc" },
      select: { createdAt: true },
    });
    if (lastOrder) {
      const elapsed = (now.getTime() - lastOrder.createdAt.getTime()) / 1000;
      return {
        kind: "cooldown",
        retryAfter: Math.max(1, Math.ceil(ORDER_COOLDOWN_SECONDS - elapsed)),
      };
    }

    const order = await tx.order.create({
      data: {
        userId: data.userId,
        userName: data.userName,
        drinkId: drink.id,
        drinkName: drink.name,
        webhookStatus: "PENDING",
        createdAt: now,
      },
      select: { id: true },
    });
    return {
      kind: "ok",
      orderId: order.id,
      drinkName: drink.name,
      userName: data.userName,
    };
  });

  switch (result.kind) {
    case "not_found":
      return jsonError("Boisson introuvable", 404);
    case "unavailable":
      return jsonError("Cette boisson est en rupture", 409);
    case "cooldown":
      return NextResponse.json(
        {
          error: `Doucement ! Réessaie dans ${result.retryAfter} s.`,
          retryAfter: result.retryAfter,
        },
        {
          status: 429,
          headers: { "Retry-After": String(result.retryAfter) },
        },
      );
  }

  const delivered = await notifyHomeAssistant(result.userName, result.drinkName);
  try {
    await prisma.order.update({
      where: { id: result.orderId },
      data: { webhookStatus: delivered ? "SUCCESS" : "FAILED" },
    });
  } catch (updateError) {
    console.error("Unable to update webhook status", updateError);
  }

  return NextResponse.json(
    { orderId: result.orderId, drinkName: result.drinkName },
    { status: 201 },
  );
}
