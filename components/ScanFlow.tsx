"use client";

import { useState } from "react";
import { BarcodeScanner } from "@/components/BarcodeScanner";
import { Modal } from "@/components/Modal";
import { adminFetch, type OffProduct } from "@/lib/admin-client";

type Props = {
  onClose: () => void;
  onFound: (product: OffProduct) => void;
  onManual: (barcode: string) => void;
};

type State =
  | { kind: "scanning" }
  | { kind: "loading"; barcode: string }
  | { kind: "not_found"; barcode: string; message: string }
  | { kind: "error"; message: string };

export function ScanFlow({ onClose, onFound, onManual }: Props) {
  const [state, setState] = useState<State>({ kind: "scanning" });

  const lookup = async (barcode: string) => {
    setState({ kind: "loading", barcode });
    try {
      const { product } = await adminFetch<{ product: OffProduct }>(
        "/api/admin/openfoodfacts",
        { method: "POST", body: { barcode } },
      );
      onFound(product);
    } catch (error) {
      const status = (error as { status?: number }).status;
      const message = error instanceof Error ? error.message : "Erreur";
      setState(
        status === 404
          ? { kind: "not_found", barcode, message }
          : { kind: "error", message },
      );
    }
  };

  return (
    <Modal onClose={onClose} wide>
      <div className="flex flex-col gap-4">
        <h2 className="text-xl font-bold">📷 Scanner un produit</h2>

        {state.kind === "scanning" && <BarcodeScanner onDetect={lookup} />}

        {state.kind === "loading" && (
          <p className="py-10 text-center text-violet-200">
            Recherche de {state.barcode}...
          </p>
        )}

        {state.kind === "not_found" && (
          <div className="flex flex-col gap-3">
            <p className="rounded-xl bg-amber-400/15 px-4 py-3 text-amber-200">
              {state.message}
            </p>
            <button
              onClick={() => onManual(state.barcode)}
              className="rounded-2xl bg-amber-400 px-4 py-3 font-bold text-violet-950"
            >
              Ajouter manuellement
            </button>
            <button
              onClick={() => setState({ kind: "scanning" })}
              className="rounded-2xl bg-white/10 px-4 py-3 font-semibold"
            >
              Scanner un autre produit
            </button>
          </div>
        )}

        {state.kind === "error" && (
          <div className="flex flex-col gap-3">
            <p className="rounded-xl bg-red-500/20 px-4 py-3 text-red-200">
              {state.message}
            </p>
            <button
              onClick={() => setState({ kind: "scanning" })}
              className="rounded-2xl bg-white/10 px-4 py-3 font-semibold"
            >
              Réessayer
            </button>
          </div>
        )}

        <button
          onClick={onClose}
          className="rounded-2xl bg-white/10 px-4 py-3 font-semibold"
        >
          Fermer
        </button>
      </div>
    </Modal>
  );
}
