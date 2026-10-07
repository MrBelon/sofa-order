"use client";

import type { AdminOrder, AdminStats as Stats } from "@/lib/admin-client";

const MEDALS = ["🥇", "🥈", "🥉"];

export function AdminStats({ stats, orders }: { stats: Stats; orders: AdminOrder[] }) {
  return (
    <section className="rounded-3xl border border-white/10 bg-white/5 p-4">
      <h2 className="mb-3 text-lg font-bold">🍻 Statistiques</h2>
      <p className="text-2xl font-extrabold">
        {stats.totalOrders} <span className="text-base font-semibold text-violet-200">commandes</span>
      </p>
      <p className="mb-4 text-2xl font-extrabold">
        {stats.totalUsers} <span className="text-base font-semibold text-violet-200">convives</span>
      </p>

      <div className="grid gap-6 sm:grid-cols-2">
        <div>
          <h3 className="mb-2 font-bold text-violet-200">Top convives</h3>
          <ol className="flex flex-col gap-1">
            {stats.topUsers.map((user, index) => (
              <li key={`${user.name}-${index}`} className="flex justify-between gap-2">
                <span>
                  {MEDALS[index] ?? "\u2003"} {user.name}
                </span>
                <span className="font-mono">{user.count}</span>
              </li>
            ))}
            {stats.topUsers.length === 0 && <li className="text-violet-300/60">—</li>}
          </ol>
        </div>
        <div>
          <h3 className="mb-2 font-bold text-violet-200">Boissons les plus commandées</h3>
          <ol className="flex flex-col gap-1">
            {stats.topDrinks.map((drink, index) => (
              <li key={`${drink.name}-${index}`} className="flex justify-between gap-2">
                <span className="truncate">
                  {index + 1}. {drink.name}
                </span>
                <span className="font-mono">{drink.count}</span>
              </li>
            ))}
            {stats.topDrinks.length === 0 && <li className="text-violet-300/60">—</li>}
          </ol>
        </div>
      </div>

      <h3 className="mb-2 mt-6 font-bold text-violet-200">Dernières commandes</h3>
      <ul className="flex max-h-96 flex-col gap-1 overflow-y-auto">
        {orders.map((order) => (
          <li key={order.id} className="flex items-center gap-3 text-sm">
            <span className="w-32 shrink-0 font-mono text-violet-300/70">
              {new Date(order.createdAt).toLocaleString("fr-FR", {
                day: "2-digit",
                month: "2-digit",
                hour: "2-digit",
                minute: "2-digit",
              })}
            </span>
            <span className="min-w-0 flex-1 truncate">
              <strong>{order.userName}</strong> → {order.drinkName}
            </span>
            <span
              title={`Webhook : ${order.webhookStatus}`}
              className={
                order.webhookStatus === "SUCCESS"
                  ? "text-emerald-400"
                  : order.webhookStatus === "FAILED"
                    ? "text-red-400"
                    : "text-amber-300"
              }
            >
              {order.webhookStatus === "SUCCESS" ? "●" : order.webhookStatus === "FAILED" ? "✕" : "…"}
            </span>
          </li>
        ))}
        {orders.length === 0 && <li className="text-violet-300/60">Aucune commande.</li>}
      </ul>
    </section>
  );
}

