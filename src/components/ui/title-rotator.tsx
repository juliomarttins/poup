"use client";

import { useEffect } from "react";

const TITLES = ["Poupp", "Finanças", "Inteligentes", "Poupp 🚀"];

export function TitleRotator() {
  useEffect(() => {
    let index = 0;
    const interval = setInterval(() => {
      index = (index + 1) % TITLES.length;
      document.title = TITLES[index];
    }, 2000); // Troca a cada 2 segundos

    return () => clearInterval(interval);
  }, []);

  return null; // Componente invisível, apenas lógica
}