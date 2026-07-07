import { useState, useEffect } from "react";

export default function Footer() {
  const [apiHealth, setApiHealth] = useState<"STABLE" | "OFFLINE" | "CHECKING">(
    "CHECKING",
  );

  useEffect(() => {
    // 🚀 Flag de controle para evitar memory leak e ReferenceError nos testes
    let isMounted = true;

    const checkApiHealth = async () => {
      try {
        const response = await fetch("http://localhost:3000/health");

        if (response.ok) {
          const data = await response.json();

          if (isMounted) {
            if (data.status === "ok") {
              setApiHealth("STABLE");
            } else {
              setApiHealth("OFFLINE");
            }
          }
        } else {
          if (isMounted) setApiHealth("OFFLINE");
        }
      } catch {
        if (isMounted) setApiHealth("OFFLINE");
      }
    };

    checkApiHealth();

    const interval = setInterval(() => {
      void checkApiHealth();
    }, 5000);

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  return (
    <footer className="w-full h-7 bg-surface-container-lowest/90 border-t border-outline-variant/30 backdrop-blur-sm flex justify-between items-center px-container-padding font-mono text-[10px] tracking-widest text-on-surface-variant/50 shrink-0 z-20 select-none">
      {/* Lado Esquerdo do Rodapé Geral com Classes Dinâmicas de Cor */}
      <div className="flex items-center gap-stack-md">
        <span>
          UPLINK_STATUS:{" "}
          {apiHealth === "STABLE" && (
            <span className="text-emerald-400 font-bold animate-pulse">
              STABLE
            </span>
          )}
          {apiHealth === "OFFLINE" && (
            <span className="text-red-500 font-bold">OFFLINE</span>
          )}
          {apiHealth === "CHECKING" && (
            <span className="text-amber-500 font-medium animate-pulse">
              CHECKING
            </span>
          )}
        </span>
        <span className="text-outline/20">|</span>
        <span>
          BATTERY_CELL:{" "}
          <span className="text-primary-fixed font-medium">4.2V</span>
        </span>
      </div>

      {/* Lado Direito do Rodapé Geral (Metadados técnicos do PI1) */}
      <div className="text-right uppercase text-[9px] text-outline/40 font-space">
        Projeto Integrador de Engenharia 1 - UnB FGA - 2026.1
      </div>
    </footer>
  );
}