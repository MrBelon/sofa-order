"use client";

import { useState } from "react";
import { DrinkImage } from "@/components/DrinkImage";
import { Modal } from "@/components/Modal";
import {
  adminFetch,
  type AdminCategory,
  type AdminDrink,
  type DrinkDraft,
} from "@/lib/admin-client";

type Props = {
  categories: AdminCategory[];
  initial: DrinkDraft;
  drinkId?: string;
  onClose: () => void;
  onSaved: () => void;
};

export function draftFromDrink(drink: AdminDrink): DrinkDraft {
  return {
    name: drink.name,
    description: drink.description ?? "",
    imageUrl: drink.imageUrl ?? "",
    barcode: drink.barcode ?? "",
    alcohol:
      drink.alcoholPercentage === null
        ? ""
        : String(drink.alcoholPercentage).replace(".", ","),
    categoryId: drink.categoryId,
    available: drink.available,
    source: drink.source,
  };
}

const inputClass =
  "w-full rounded-xl border border-white/15 bg-white/10 px-4 py-3 outline-none focus:border-amber-300";

export function DrinkForm({ categories, initial, drinkId, onClose, onSaved }: Props) {
  const [draft, setDraft] = useState(initial);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const update = <K extends keyof DrinkDraft>(key: K, value: DrinkDraft[K]) =>
    setDraft((current) => ({ ...current, [key]: value }));

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);

    const alcoholText = draft.alcohol.trim().replace(",", ".");
    const alcohol = alcoholText === "" ? null : Number(alcoholText);
    if (alcohol !== null && (!Number.isFinite(alcohol) || alcohol < 0 || alcohol > 100)) {
      setError("Pourcentage d'alcool invalide");
      return;
    }

    setSaving(true);
    try {
      await adminFetch(drinkId ? `/api/admin/drinks/${drinkId}` : "/api/admin/drinks", {
        method: drinkId ? "PATCH" : "POST",
        body: {
          name: draft.name,
          description: draft.description,
          imageUrl: draft.imageUrl,
          barcode: draft.barcode,
          alcoholPercentage: alcohol,
          categoryId: draft.categoryId,
          available: draft.available,
          source: draft.source,
        },
      });
      onSaved();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur");
      setSaving(false);
    }
  };

  return (
    <Modal onClose={onClose} wide>
      <form className="flex flex-col gap-4" onSubmit={submit}>
        <h2 className="text-xl font-bold">
          {drinkId ? "Modifier la boisson" : "Ajouter une boisson"}
        </h2>

        <label className="flex flex-col gap-1 text-sm text-violet-200">
          📷 Code-barres (facultatif)
          <input
            value={draft.barcode}
            onChange={(e) => update("barcode", e.target.value)}
            inputMode="numeric"
            placeholder="3760123456789"
            className={inputClass}
          />
        </label>

        {draft.imageUrl && (
          <DrinkImage
            src={draft.imageUrl}
            alt=""
            fallback="🍹"
            className="mx-auto h-32 w-32 rounded-2xl"
          />
        )}

        <label className="flex flex-col gap-1 text-sm text-violet-200">
          Nom
          <input
            required
            maxLength={100}
            value={draft.name}
            onChange={(e) => update("name", e.target.value)}
            className={inputClass}
          />
        </label>

        <label className="flex flex-col gap-1 text-sm text-violet-200">
          Description
          <textarea
            maxLength={500}
            rows={2}
            value={draft.description}
            onChange={(e) => update("description", e.target.value)}
            className={inputClass}
          />
        </label>

        <div className="grid grid-cols-2 gap-3">
          <label className="flex flex-col gap-1 text-sm text-violet-200">
            Catégorie
            <select
              required
              value={draft.categoryId}
              onChange={(e) => update("categoryId", e.target.value)}
              className={inputClass}
            >
              <option value="" disabled>
                Choisir...
              </option>
              {categories.map((category) => (
                <option key={category.id} value={category.id} className="text-black">
                  {category.name}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1 text-sm text-violet-200">
            Alcool (%)
            <input
              value={draft.alcohol}
              onChange={(e) => update("alcohol", e.target.value)}
              inputMode="decimal"
              placeholder="vide = non renseigné"
              className={inputClass}
            />
          </label>
        </div>

        <label className="flex flex-col gap-1 text-sm text-violet-200">
          Image (URL)
          <input
            type="url"
            maxLength={2000}
            value={draft.imageUrl}
            onChange={(e) => update("imageUrl", e.target.value)}
            placeholder="https://..."
            className={inputClass}
          />
        </label>

        <label className="flex items-center gap-3 py-1">
          <input
            type="checkbox"
            checked={draft.available}
            onChange={(e) => update("available", e.target.checked)}
            className="h-5 w-5 accent-amber-400"
          />
          <span>{draft.available ? "● Disponible" : "○ En rupture"}</span>
        </label>

        {error && (
          <p className="rounded-xl bg-red-500/20 px-3 py-2 text-sm text-red-200">{error}</p>
        )}

        <div className="flex gap-3">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 rounded-2xl bg-white/10 px-4 py-3 font-semibold"
          >
            Annuler
          </button>
          <button
            type="submit"
            disabled={saving}
            className="flex-1 rounded-2xl bg-amber-400 px-4 py-3 font-bold text-violet-950 disabled:opacity-60"
          >
            {saving ? "..." : drinkId ? "Enregistrer" : "Ajouter"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
