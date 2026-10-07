"use client";

import { useEffect, useState } from "react";
import { useUser } from "@/components/UserProvider";
import { categoryEmoji, formatDayLabel, formatTime } from "@/lib/format";

type HistoryOrder = {
  id: string;
  drinkName: string;
  category: string | null;
  createdAt: string;
};

export function OrderHistory() {
  const { userId } = useUser();
  const [orders, setOrders] = useState<HistoryOrder[] | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/orders?userId=${encodeURIComponent(userId)}`, { cache: "no-store" })
      .then((response) => {
        if (!response.ok) throw new Error();
        return response.json() as Promise<{ orders: HistoryOrder[] }>;
      })
      .then((data) => !cancelled && setOrders(data.orders))
      .catch(() => !cancelled && setFailed(true));
    return () => {
      cancelled = true;
    };
  }, [userId]);

  if (failed) {
    return <p className="py-20 text-center text-violet-200/70">Impossible de charger l&apos;historique. 😕</p>;
  }
  if (!orders) {
    return <p className="py-20 text-center text-violet-200/70">Chargement...</p>;
  }
  if (orders.length === 0) {
    return (
      <p className="py-20 text-center text-violet-200/70">
        Tu n&apos;as encore rien commandé. 🍹
      </p>
    );
  }

  const groups = new Map<string, HistoryOrder[]>();
  for (const order of orders) {
    const label = formatDayLabel(order.createdAt);
    groups.set(label, [...(groups.get(label) ?? []), order]);
  }

  return (
    <div className="flex flex-col gap-6">
      {[...groups].map(([label, items]) => (
        <section key={label}>
          <h2 className="mb-2 text-sm font-bold uppercase tracking-wide text-violet-300/80">
            {label}
          </h2>
          <ul className="flex flex-col gap-2">
            {items.map((order) => (
              <li
                key={order.id}
                className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-3"
              >
                <span className="font-mono text-sm text-violet-300/80">
                  {formatTime(order.createdAt)}
                </span>
                <span>{categoryEmoji(order.category)}</span>
                <span className="font-semibold">{order.drinkName}</span>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}
