"use client";

import React from "react";
import Image from "next/image";

interface BackgroundEffectsProps {
  variant?: "default" | "dark";
}

export default function BackgroundEffects({ variant = "default" }: BackgroundEffectsProps) {
  const backgroundImage = variant === "dark" 
    ? "/images/background-dark.svg" 
    : "/images/background.svg";

  return (
    <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
      <div className="absolute inset-0 w-full h-full">
        <Image
          src={backgroundImage}
          alt=""
          fill
          priority
          sizes="100vw"
          style={{
            objectFit: "cover",
            objectPosition: "center",
          }}
        />
      </div>
    </div>
  );
} 