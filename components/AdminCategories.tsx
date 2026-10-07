"use client";

import { useState } from "react";
import { adminFetch, type AdminCategory } from "@/lib/admin-client";

type Props = {
  categories: AdminCategory[];
  onChanged: () => void;
  onError: (error: unknown) => void;
};

export function AdminCategories({ categories, onChanged, onError }: Props) {
  const [newName, setNewName] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");

  const run = async (action: () => Promise<unknown>) => {
    try {
      await action();
      onChanged();
    } catch (error) {
      onError(error);
    }
  };

  return (
    <section className="rounded-3xl border border-white/10 bg-white/5 p-4">
      <h2 className="mb-3 text-lg font-bold">🗂️ Catégories</h2>
      <ul className="flex flex-col gap-2">
        {categories.map((category) => (
          <li key={category.id} className="flex items-center gap-2">
            {editingId === category.id ? (
              <form
                className="flex flex-1 gap-2"
                onSubmit={(event) => {
                  event.preventDefault();
                  run(async () => {
                    await adminFetch(`/api/admin/categories/${category.id}`, {
                      method: "PATCH",
                      body: { name: editName },
                    });
                    setEditingId(null);
                  });
                }}
              >
                <input
                  autoFocus
                  value={editName}
                  maxLength={50}
                  onChange={(e) => setEditName(e.target.value)}
                  className="min-w-0 flex-1 rounded-xl border border-white/15 bg-white/10 px-3 py-2 outline-none focus:border-amber-300"
                />
                <button className="rounded-xl bg-amber-400 px-3 py-2 font-bold text-violet-950">
                  OK
                </button>
                <button
                  type="button"
                  onClick={() => setEditingId(null)}
                  className="rounded-xl bg-white/10 px-3 py-2"
                >
                  ✕
                </button>
              </form>
            ) : (
              <>
                <span className="flex-1">
                  {category.name}{" "}
                  <span className="text-xs text-violet-300/70">
                    ({category.drinkCount})
                  </span>
                </span>
                <button
                  onClick={() => {
                    setEditingId(category.id);
                    setEditName(category.name);
                  }}
                  aria-label={`Renommer ${category.name}`}
                  className="rounded-full bg-white/10 px-3 py-2 text-sm"
                >
                  ✏️
                </button>
                <button
                  disabled={category.drinkCount > 0}
                  title={category.drinkCount > 0 ? "Catégorie utilisée" : undefined}
                  onClick={() => {
                    if (confirm(`Supprimer la catégorie « ${category.name} » ?`)) {
                      run(() =>
                        adminFetch(`/api/admin/categories/${category.id}`, {
                          method: "DELETE",
                        }),
                      );
                    }
                  }}
                  aria-label={`Supprimer ${category.name}`}
                  className="rounded-full bg-white/10 px-3 py-2 text-sm disabled:opacity-30"
                >
                  🗑️
                </button>
              </>
            )}
          </li>
        ))}
      </ul>
      <form
        className="mt-3 flex gap-2"
        onSubmit={(event) => {
          event.preventDefault();
          run(async () => {
            await adminFetch("/api/admin/categories", {
              method: "POST",
              body: { name: newName },
            });
            setNewName("");
          });
        }}
      >
        <input
          value={newName}
          maxLength={50}
          onChange={(e) => setNewName(e.target.value)}
          placeholder="Nouvelle catégorie"
          className="min-w-0 flex-1 rounded-xl border border-white/15 bg-white/10 px-3 py-2 outline-none focus:border-amber-300"
        />
        <button
          disabled={!newName.trim()}
          className="rounded-xl bg-amber-400 px-4 py-2 font-bold text-violet-950 disabled:opacity-40"
        >
          Ajouter
        </button>
      </form>
    </section>
  );
}
