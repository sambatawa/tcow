"use client";

import { useState } from "react";
import Image from "next/image";

export function TCowLogo({
  className = "w-full h-full",
  title = "T-Cow",
}: {
  className?: string;
  title?: string;
}) {
  const [hasError, setHasError] = useState(false);

  return (
    <span
      className={`${className} inline-flex items-center justify-center overflow-hidden rounded-full bg-white shadow-sm ring-1 ring-brand-forest/15`}
      role="img"
      aria-label={title}
      title={title}
    >
      <span className="flex h-full w-full items-center justify-center rounded-full bg-linear-to-br from-brand-cream via-white to-brand-accent/25 p-[14%]">
        {hasError ? (
          <span className="font-extrabold leading-none text-brand-forest" aria-hidden>
            T
          </span>
        ) : (
          <Image
            src="/image/T.png"
            alt=""
            width={96}
            height={96}
            className="h-full w-full object-contain"
            onError={() => setHasError(true)}
            unoptimized
          />
        )}
      </span>
    </span>
  );
}
