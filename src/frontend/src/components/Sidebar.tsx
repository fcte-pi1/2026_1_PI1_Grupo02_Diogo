import { useState, useEffect, useRef } from "react";
import {
  LayoutDashboard,
  ScrollText,
  WifiSync,
  ArrowLeftToLine,
  TestTube2,
  ListRestart,
} from "lucide-react";

interface SidebarProps {
  currentView?: string;
  activeSession?: string;
  onNavigate?: (view: string) => void;
}

export default function Sidebar({
  currentView = "dashboard",
  onNavigate,
}: SidebarProps) {
  const navItems = [
    {
      id: "dashboard",
      label: "Dashboard",
      shortcut: "Ctrl + shift + D",
      icon: LayoutDashboard,
    },
    { id: "network", label: "Conexão", shortcut: "Ctrl + shift +  N", icon: WifiSync },
    { id: "logs", label: "Histórico", shortcut: "Ctrl + shift +  S", icon: ScrollText },
    {
      id: "testes",
      label: "Área de testes",
      shortcut: "Ctrl + shift +  T",
      icon: TestTube2,
    },
  ];

  // Largura dinâmica (Padrão inicial: 256px / Colapsado: 64px)
  const [width, setWidth] = useState(256);
  const isDragging = useRef(false);

  const isCollapsed = width < 110;

  // Lógica de Redimensionamento Lateral por Arrasto
  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    isDragging.current = true;
    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (!isDragging.current) return;
    // Define limites de tamanho seguros para a interface do cockpit (entre 64px e 380px)
    const newWidth = e.clientX;
    if (newWidth >= 64 && newWidth <= 380) {
      setWidth(newWidth);
    }
  };

  const handleMouseUp = () => {
    isDragging.current = false;
    document.removeEventListener("mousemove", handleMouseMove);
    document.removeEventListener("mouseup", handleMouseUp);
  };

  // Botão rápido para alternar estados predefinidos
  const toggleSidebar = () => {
    if (isCollapsed) {
      setWidth(256);
    } else {
      setWidth(64);
    }
  };

  useEffect(() => {
    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, []);

  return (
    <aside
      style={{ width: `${isCollapsed ? 64 : width}px` }}
      className="h-full bg-surface-container-low/60 border-r border-outline-variant/30 backdrop-blur-md flex flex-row justify-between select-none shrink-0 z-30 relative group/sidebar"
    >
      {/* Container Interno do Conteúdo */}
      <div className="flex-1 flex flex-col justify-between p-3 overflow-hidden h-full">
        {/* Bloco Superior: Logo + Navegação */}
        <div className="flex flex-col gap-6">
          {/* Cabeçalho / Identificação do Sistema */}
          <div className="flex flex-col gap-1 border-b border-outline-variant/10 pb-2">
            <div
              className={`flex items-center justify-between ${isCollapsed ? "flex-col gap-2" : "flex-row"}`}
            >
              {!isCollapsed && (
                <h2 className="text-label-caps font-bold text-primary tracking-widest uppercase truncate font-mono text-[14px]">
                  PROJETO DE PI1
                </h2>
              )}

              <button
                onClick={toggleSidebar}
                aria-label="Toggle sidebar"
                className="text-on-surface-variant hover:text-primary transition-all cursor-pointer p-1 bg-surface-container-lowest/40 border border-outline-variant/10"
              >
                <ArrowLeftToLine
                  className={`w-4 h-4 transition-transform duration-300 ${isCollapsed ? "rotate-180" : ""}`}
                />
              </button>
            </div>

            {!isCollapsed && (
              <span className="text-[10px] font-mono text-on-surface-variant/60 tracking-wider">
                RATOBÔ
              </span>
            )}
          </div>

          {/* Links de Navegação */}
          <nav className="flex flex-col gap-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentView === item.id;

              return (
                <button
                  key={item.id}
                  onClick={() => onNavigate?.(item.id)}
                  // Tooltip nativo mostrando o nome e atalho se estiver colapsado
                  title={
                    isCollapsed ? `${item.label} (${item.shortcut})` : undefined
                  }
                  className={`w-full flex items-center transition-all rounded-none border-l-2 cursor-pointer group/item relative ${
                    isCollapsed
                      ? "justify-center py-3 px-0"
                      : "justify-between px-3 py-3"
                  } ${
                    isActive
                      ? "bg-primary/5 border-primary text-primary"
                      : "bg-transparent border-transparent text-on-surface-variant hover:text-on-surface hover:bg-surface-variant/30"
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <Icon
                      className={`w-4 h-4 shrink-0 ${isActive ? "text-primary" : "text-on-surface-variant"}`}
                      strokeWidth={1.5}
                    />

                    {!isCollapsed && (
                      <span className="font-space text-[12px] font-medium tracking-wide uppercase truncate">
                        {item.label}
                      </span>
                    )}
                  </div>

                  {/* 🚀 INDICAÇÃO DE ATALHO (Aparece de forma fluida no hover se expandido) */}
                  {!isCollapsed && (
                    <span className="text-[9px] font-mono text-outline/30 bg-black/20 px-1 border border-outline-variant/10 opacity-0 group-hover/item:opacity-100 transition-opacity whitespace-nowrap ml-2 shrink-0">
                      {item.shortcut}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Bloco Inferior: Ações do Cockpit */}
        <div className="flex flex-col gap-2 border-t border-outline-variant/20 pt-3">
          <button
            title={isCollapsed ? "Reiniciar aplicação (Ctrl + R)" : undefined}
            className="p-2.5 text-xs font-mono bg-error/10 border border-error/20 hover:bg-error/20 text-error font-bold flex items-center justify-center gap-2 transition-colors w-full cursor-pointer"
            onClick={() => window.location.reload()}
          >
            <ListRestart className="w-4 h-4 shrink-0" />
            {!isCollapsed && (
              <span className="uppercase tracking-wider text-[11px]">
                Reiniciar app
              </span>
            )}
          </button>
        </div>
      </div>

      {/* 🚀 BARRA DE ARRASTE VERTICAL EXTERNA */}
      <div
        onMouseDown={handleMouseDown}
        className="absolute top-0 right-0 w-[4px] h-full cursor-ew-resize hover:bg-primary/50 opacity-0 hover:opacity-100 group-hover/sidebar:opacity-20 transition-all z-40"
        title="Arraste para redimensionar a largura"
      />
    </aside>
  );
}
