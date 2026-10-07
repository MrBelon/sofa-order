"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { CategorySection, type MenuCategory } from "@/components/CategorySection";
import { ConfirmOrderModal } from "@/components/ConfirmOrderModal";
import type { MenuDrink } from "@/components/DrinkCard";
import { useUser } from "@/components/UserProvider";
import { categoryEmoji } from "@/lib/format";
import { useCooldown } from "@/lib/use-cooldown";

type Pending = { drink: MenuDrink; categoryName: string };

export function Menu() {
  const router = useRouter();
  const { userId, userName } = useUser();
  const { remaining, start } = useCooldown();

  const [categories, setCategories] = useState<MenuCategory[] | null>(null);
  const [loadError, setLoadError] = useState(false);
  const [pending, setPending] = useState<Pending | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [orderError, setOrderError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const response = await fetch("/api/drinks", { cache: "no-store" });
      if (!response.ok) throw new Error();
      const data = (await response.json()) as { categories: MenuCategory[] };
      setCategories(data.categories);
      setLoadError(false);
    } catch {
      setLoadError(true);
    }
  }, []);

  useEffect(() => {
    load();
    const timer = setInterval(load, 20_000);
    const onVisible = () => {
      if (document.visibilityState === "visible") load();
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      clearInterval(timer);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [load]);

  const askOrder = (drink: MenuDrink) => {
    const category = categories?.find((c) => c.drinks.some((d) => d.id === drink.id));
    setOrderError(null);
    setPending({ drink, categoryName: category?.name ?? "" });
  };

  const confirm = async () => {
    if (!pending) return;
    setSubmitting(true);
    setOrderError(null);
    try {
      const response = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, userName, drinkId: pending.drink.id }),
      });
      const data = (await response.json().catch(() => ({}))) as {
        error?: string;
        drinkName?: string;
        retryAfter?: number;
      };

      if (response.ok) {
        start();
        router.push(`/success?drink=${encodeURIComponent(data.drinkName ?? pending.drink.name)}`);
        return;
      }
      if (response.status === 429 && data.retryAfter) start(data.retryAfter);
      if (response.status === 409 || response.status === 404) load();
      setOrderError(data.error ?? "Impossible de passer la commande.");
    } catch {
      setOrderError("Connexion impossible. Réessaie dans un instant.");
    } finally {
      setSubmitting(false);
    }
  };

  if (!categories) {
    return (
      <p className="py-20 text-center text-violet-200/70">
        {loadError ? "Impossible de charger la carte. 😕" : "Chargement..."}
      </p>
    );
  }

  if (categories.length === 0) {
    return (
      <p className="py-20 text-center text-violet-200/70">
        Aucune boisson pour le moment. 🫗
      </p>
    );
  }

  return (
    <>
      {remaining > 0 && (
        <p className="mb-4 rounded-2xl bg-amber-400/15 px-4 py-3 text-center text-sm text-amber-200">
          Commande envoyée ! Tu pourras recommander dans {remaining} s.
        </p>
      )}
      <div className="flex flex-col gap-8">
        {categories.map((category) => (
          <CategorySection
            key={category.id}
            category={category}
            cooldown={remaining}
            onOrder={askOrder}
          />
        ))}
      </div>
      {pending && (
        <ConfirmOrderModal
          drinkName={pending.drink.name}
          userName={userName}
          emoji={categoryEmoji(pending.categoryName)}
          submitting={submitting}
          error={orderError}
          onCancel={() => setPending(null)}
          onConfirm={confirm}
        />
      )}
    </>
  );
}
