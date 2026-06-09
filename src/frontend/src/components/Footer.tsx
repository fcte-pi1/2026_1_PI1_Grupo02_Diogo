import { useState, useEffect } from "react";

export default function Footer() {
  const [apiHealth, setApiHealth] = useState<"STABLE" | "OFFLINE" | "CHECKING">(
    "CHECKING",
  );

  useEffect(() => {
    // Função assíncrona que bate no endpoint do Node.js
    const checkApiHealth = async () => {
      try {
        const response = await fetch("http://localhost:3000/health");

        if (response.ok) {
          const data = await response.json();

          // Se o JSON vier como {"status":"ok"}, a API está estável
          if (data.status === "ok") {
            setApiHealth("STABLE");
          } else {
            setApiHealth("OFFLINE");
          }
        } else {
          setApiHealth("OFFLINE");
        }
      } catch {
        // Se o servidor cair ou der erro de rede (CORS/Network), cai aqui
        setApiHealth("OFFLINE");
      }
    };

    // Dispara a checagem imediatamente ao montar a tela
    checkApiHealth();

    // Configura um intervalo para checar a saúde a cada 5 segundos (5000ms)
    const interval = setInterval(checkApiHealth, 5000);

    // Limpa o temporizador se o usuário deslogar ou mudar de tela para evitar memory leak
    return () => clearInterval(interval);
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
        Projeto Integrador de Engenharia 1 - UnB FGA - 2026
      </div>
    </footer>
  );
}
