/* eslint-disable @next/next/no-img-element -- images come from arbitrary external URLs */
"use client";

import { useState } from "react";

type Props = {
  src: string | null;
  alt: string;
  fallback: string;
  className?: string;
};

export function DrinkImage({ src, alt, fallback, className = "" }: Props) {
  const [failedSrc, setFailedSrc] = useState<string | null>(null);
  const showImage = src && failedSrc !== src;

  return (
    <div
      className={`flex items-center justify-center overflow-hidden bg-white/90 ${className}`}
    >
      {showImage ? (
        <img
          src={src}
          alt={alt}
          loading="lazy"
          referrerPolicy="no-referrer"
          onError={() => setFailedSrc(src)}
          className="h-full w-full object-contain p-2"
        />
      ) : (
        <span className="text-5xl" aria-hidden>
          {fallback}
        </span>
      )}
    </div>
  );
}
