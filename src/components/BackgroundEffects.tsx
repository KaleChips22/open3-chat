"use client";

import React from "react";

export default function BackgroundEffects() {
  return (
    <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
      <div 
        className="absolute rounded-full blur-3xl"
        style={{
          left: "20%",
          top: "20%",
          width: "500px",
          height: "500px",
          backgroundColor: "oklch(0.65 0.15 300 / 0.07)",
          animation: "float 40s ease-in-out infinite",
          transform: "translate(-50%, -50%)"
        }}
      />
      <div 
        className="absolute rounded-full blur-3xl"
        style={{
          left: "70%",
          top: "30%",
          width: "450px",
          height: "450px",
          backgroundColor: "oklch(0.65 0.15 300 / 0.06)",
          animation: "float 50s ease-in-out infinite",
          animationDelay: "2s",
          transform: "translate(-50%, -50%)"
        }}
      />
      <div 
        className="absolute rounded-full blur-3xl"
        style={{
          left: "30%",
          top: "60%",
          width: "600px",
          height: "600px",
          backgroundColor: "oklch(0.65 0.15 300 / 0.08)",
          animation: "float 45s ease-in-out infinite",
          animationDelay: "1s",
          transform: "translate(-50%, -50%)"
        }}
      />
      <div 
        className="absolute rounded-full blur-3xl"
        style={{
          left: "80%",
          top: "70%",
          width: "400px",
          height: "400px",
          backgroundColor: "oklch(0.65 0.15 300 / 0.05)",
          animation: "float 55s ease-in-out infinite",
          animationDelay: "3s",
          transform: "translate(-50%, -50%)"
        }}
      />
      <div 
        className="absolute rounded-full blur-3xl"
        style={{
          left: "50%",
          top: "40%",
          width: "700px",
          height: "700px",
          backgroundColor: "oklch(0.65 0.15 300 / 0.04)",
          animation: "float 60s ease-in-out infinite",
          animationDelay: "0.5s",
          transform: "translate(-50%, -50%)"
        }}
      />
    </div>
  );
} 