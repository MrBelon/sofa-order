"use client";

import { useEffect, useRef, useState } from "react";

type Props = {
  onDetect: (barcode: string) => void;
};

export function BarcodeScanner({ onDetect }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const onDetectRef = useRef(onDetect);
  const [error, setError] = useState<string | null>(null);
  const [manual, setManual] = useState("");

  useEffect(() => {
    onDetectRef.current = onDetect;
  }, [onDetect]);

  useEffect(() => {
    let stopped = false;
    let stop: (() => void) | undefined;

    (async () => {
      if (!navigator.mediaDevices?.getUserMedia) {
        setError(
          "La caméra n'est pas disponible (HTTPS requis). Saisis le code manuellement.",
        );
        return;
      }
      try {
        const [{ BrowserMultiFormatReader }, { BarcodeFormat, DecodeHintType }] =
          await Promise.all([import("@zxing/browser"), import("@zxing/library")]);
        if (stopped || !videoRef.current) return;

        const hints = new Map();
        hints.set(DecodeHintType.POSSIBLE_FORMATS, [
          BarcodeFormat.EAN_13,
          BarcodeFormat.EAN_8,
          BarcodeFormat.UPC_A,
          BarcodeFormat.UPC_E,
        ]);
        const reader = new BrowserMultiFormatReader(hints, {
          delayBetweenScanAttempts: 150,
        });
        const controls = await reader.decodeFromConstraints(
          { video: { facingMode: { ideal: "environment" } } },
          videoRef.current,
          (result) => {
            if (result && !stopped) {
              stopped = true;
              stop?.();
              onDetectRef.current(result.getText());
            }
          },
        );
        stop = () => controls.stop();
        if (stopped) stop();
      } catch {
        if (!stopped) {
          setError(
            "Impossible d'accéder à la caméra. Autorise-la ou saisis le code manuellement.",
          );
        }
      }
    })();

    return () => {
      stopped = true;
      stop?.();
    };
  }, []);

  return (
    <div className="flex flex-col gap-4">
      <div className="relative aspect-[4/3] overflow-hidden rounded-2xl bg-black">
        <video
          ref={videoRef}
          className="h-full w-full object-cover"
          muted
          playsInline
        />
        <div className="pointer-events-none absolute inset-x-8 top-1/2 h-0.5 -translate-y-1/2 bg-amber-400/80" />
      </div>
      {error && <p className="text-sm text-red-300">{error}</p>}
      <form
        className="flex gap-2"
        onSubmit={(event) => {
          event.preventDefault();
          if (manual.trim()) onDetect(manual.trim());
        }}
      >
        <input
          value={manual}
          onChange={(event) => setManual(event.target.value)}
          inputMode="numeric"
          placeholder="Saisir le code-barres"
          className="min-w-0 flex-1 rounded-xl border border-white/15 bg-white/10 px-4 py-3 outline-none focus:border-amber-300"
        />
        <button
          type="submit"
          disabled={!manual.trim()}
          className="rounded-xl bg-amber-400 px-4 py-3 font-bold text-violet-950 disabled:opacity-40"
        >
          OK
        </button>
      </form>
    </div>
  );
}
