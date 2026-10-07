"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { AdminCategories } from "@/components/AdminCategories";
import { AdminDrinkCard } from "@/components/AdminDrinkCard";
import { AdminStats } from "@/components/AdminStats";
import { draftFromDrink, DrinkForm } from "@/components/DrinkForm";
import { ScanFlow } from "@/components/ScanFlow";
import {
  adminFetch,
  UnauthorizedError,
  type AdminCategory,
  type AdminDrink,
  type AdminOrder,
  type AdminStats as Stats,
  type DrinkDraft,
  type OffProduct,
} from "@/lib/admin-client";
import { APP_NAME } from "@/lib/constants";
import { categoryEmoji } from "@/lib/format";

type Dialog =
  | { type: "scan" }
  | { type: "form"; draft: DrinkDraft; drinkId?: string }
  | null;

export function AdminDashboard() {
  const router = useRouter();
  const [categories, setCategories] = useState<AdminCategory[]>([]);
  const [drinks, setDrinks] = useState<AdminDrink[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [dialog, setDialog] = useState<Dialog>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleError = useCallback(
    (e: unknown) => {
      if (e instanceof UnauthorizedError) {
        router.refresh();
        return;
      }
      setError(e instanceof Error ? e.message : "Erreur");
    },
    [router],
  );

  const refresh = useCallback(async () => {
    try {
      const [catalog, activity] = await Promise.all([
        adminFetch<{ categories: AdminCategory[]; drinks: AdminDrink[] }>("/api/admin/drinks"),
        adminFetch<{ stats: Stats; orders: AdminOrder[] }>("/api/admin/orders"),
      ]);
      setCategories(catalog.categories);
      setDrinks(catalog.drinks);
      setStats(activity.stats);
      setOrders(activity.orders);
      setLoaded(true);
    } catch (e) {
      handleError(e);
    }
  }, [handleError]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const emptyDraft = (overrides: Partial<DrinkDraft> = {}): DrinkDraft => ({
    name: "",
    description: "",
    imageUrl: "",
    barcode: "",
    alcohol: "",
    categoryId: categories[0]?.id ?? "",
    available: true,
    source: "MANUAL",
    ...overrides,
  });

  const fromScan = (product: OffProduct) => {
    const category = categories.find(
      (c) => c.name.toLowerCase() === product.suggestedCategory?.toLowerCase(),
    );
    setDialog({
      type: "form",
      draft: emptyDraft({
        name: product.name,
        description: product.description ?? "",
        imageUrl: product.imageUrl ?? "",
        barcode: product.barcode,
        alcohol:
          product.alcoholPercentage === null
            ? ""
            : String(product.alcoholPercentage).replace(".", ","),
        categoryId: category?.id ?? categories[0]?.id ?? "",
        source: "OPEN_FOOD_FACTS",
      }),
    });
  };

  const toggle = async (drink: AdminDrink) => {
    setBusyId(drink.id);
    try {
      await adminFetch(`/api/admin/drinks/${drink.id}`, {
        method: "PATCH",
        body: { available: !drink.available },
      });
      await refresh();
    } catch (e) {
      handleError(e);
    }
    setBusyId(null);
  };

  const remove = async (drink: AdminDrink) => {
    if (!confirm(`Supprimer « ${drink.name} » ? L'historique des commandes est conservé.`)) return;
    setBusyId(drink.id);
    try {
      await adminFetch(`/api/admin/drinks/${drink.id}`, { method: "DELETE" });
      await refresh();
    } catch (e) {
      handleError(e);
    }
    setBusyId(null);
  };

  const logout = async () => {
    await fetch("/api/admin/logout", { method: "POST" });
    router.refresh();
  };

  const onChanged = () => {
    setError(null);
    refresh();
  };

  return (
    <main className="mx-auto max-w-5xl px-4 pb-20 pt-6">
      <header className="mb-6 flex items-center justify-between gap-3">
        <h1 className="text-2xl font-extrabold">🥂 {APP_NAME} · Administration</h1>
        <button onClick={logout} className="rounded-full bg-white/10 px-4 py-2 text-sm font-semibold">
          Déconnexion
        </button>
      </header>

      {error && (
        <p
          role="alert"
          className="mb-4 flex items-start justify-between gap-3 rounded-2xl bg-red-500/20 px-4 py-3 text-red-200"
        >
          {error}
          <button onClick={() => setError(null)} aria-label="Fermer">
            ✕
          </button>
        </p>
      )}

      <div className="mb-6 flex flex-wrap gap-3">
        <button
          onClick={() => setDialog({ type: "form", draft: emptyDraft() })}
          disabled={categories.length === 0}
          className="rounded-2xl bg-amber-400 px-5 py-3 font-bold text-violet-950 active:scale-95 disabled:opacity-50"
        >
          + Ajouter une boisson
        </button>
        <button
          onClick={() => setDialog({ type: "scan" })}
          disabled={categories.length === 0}
          className="rounded-2xl bg-white/10 px-5 py-3 font-bold active:scale-95 disabled:opacity-50"
        >
          📷 Scanner un produit
        </button>
      </div>

      {!loaded ? (
        <p className="py-16 text-center text-violet-200/70">Chargement...</p>
      ) : (
        <div className="grid gap-6 lg:grid-cols-[3fr_2fr]">
          <div className="flex flex-col gap-6">
            {categories.map((category) => {
              const items = drinks.filter((d) => d.categoryId === category.id);
              if (items.length === 0) return null;
              return (
                <section key={category.id}>
                  <h2 className="mb-2 text-lg font-bold">
                    {categoryEmoji(category.name)} {category.name}
                  </h2>
                  <ul className="flex flex-col gap-2">
                    {items.map((drink) => (
                      <AdminDrinkCard
                        key={drink.id}
                        drink={drink}
                        categoryName={category.name}
                        busy={busyId === drink.id}
                        onToggle={toggle}
                        onEdit={(d) =>
                          setDialog({ type: "form", draft: draftFromDrink(d), drinkId: d.id })
                        }
                        onDelete={remove}
                      />
                    ))}
                  </ul>
                </section>
              );
            })}
            {drinks.length === 0 && (
              <p className="text-violet-200/70">Aucune boisson. Ajoute-en une !</p>
            )}
          </div>

          <div className="flex flex-col gap-6">
            {stats && <AdminStats stats={stats} orders={orders} />}
            <AdminCategories
              categories={categories}
              onChanged={onChanged}
              onError={handleError}
            />
          </div>
        </div>
      )}

      {dialog?.type === "scan" && (
        <ScanFlow
          onClose={() => setDialog(null)}
          onFound={fromScan}
          onManual={(barcode) =>
            setDialog({ type: "form", draft: emptyDraft({ barcode }) })
          }
        />
      )}

      {dialog?.type === "form" && (
        <DrinkForm
          categories={categories}
          initial={dialog.draft}
          drinkId={dialog.drinkId}
          onClose={() => setDialog(null)}
          onSaved={() => {
            setDialog(null);
            onChanged();
          }}
        />
      )}
    </main>
  );
}
