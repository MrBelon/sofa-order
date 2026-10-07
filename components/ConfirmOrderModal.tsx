"use client";

import { Modal } from "@/components/Modal";

type Props = {
  drinkName: string;
  userName: string;
  emoji: string;
  submitting: boolean;
  error: string | null;
  onCancel: () => void;
  onConfirm: () => void;
};

export function ConfirmOrderModal({
  drinkName,
  userName,
  emoji,
  submitting,
  error,
  onCancel,
  onConfirm,
}: Props) {
  return (
    <Modal onClose={submitting ? () => {} : onCancel}>
      <div className="flex flex-col items-center gap-4 text-center">
        <p className="text-violet-100">Tu veux vraiment commander :</p>
        <p className="text-2xl font-extrabold">
          {emoji} {drinkName}
        </p>
        <p className="text-violet-100">
          pour <strong>{userName}</strong> ?
        </p>
        {error && (
          <p className="w-full rounded-xl bg-red-500/20 px-3 py-2 text-sm text-red-200">
            {error}
          </p>
        )}
        <div className="flex w-full gap-3">
          <button
            onClick={onCancel}
            disabled={submitting}
            className="flex-1 rounded-2xl bg-white/10 px-4 py-4 font-semibold active:scale-95 disabled:opacity-50"
          >
            Annuler
          </button>
          <button
            onClick={onConfirm}
            disabled={submitting}
            className="flex-1 rounded-2xl bg-amber-400 px-4 py-4 font-bold text-violet-950 active:scale-95 disabled:opacity-60"
          >
            {submitting ? "Envoi..." : "Oui, commander"}
          </button>
        </div>
      </div>
    </Modal>
  );
}
