export default function Footer() {
    return (
        <footer className="w-full h-7 bg-surface-container-lowest/90 border-t border-outline-variant/30 backdrop-blur-sm flex justify-between items-center px-container-padding font-mono text-[10px] tracking-widest text-on-surface-variant/50 shrink-0 z-20 select-none">
      
      {/* Lado Esquerdo do Rodapé Geral */}
      <div className="flex items-center gap-stack-md">
        <span>UPLINK_STATUS: <span className="text-secondary-fixed font-bold animate-pulse">STABLE</span></span>
        <span className="text-outline/20">|</span>
        <span>BATTERY_CELL: <span className="text-primary-fixed font-medium">4.2V</span></span>
      </div>

      {/* Lado Direito do Rodapé Geral (Metadados técnicos do PI1) */}
      <div className="text-right uppercase text-[9px] text-outline/40 font-space">
        Mission Control System // UnB - Gama - 2026
      </div>

    </footer>
    )
}