import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import Sidebar from '../../components/Sidebar'; // Ajuste o caminho relativo se necessário

describe('Sidebar Component', () => {
  const defaultProps = {
    currentView: 'dashboard',
    onNavigate: vi.fn(),
  };

  it('deve renderizar a estrutura expandida padrão com os textos dos menus visíveis', () => {
    render(<Sidebar {...defaultProps} />);

    // 1. Verifica se os títulos estruturais e subtextos acadêmicos aparecem
    expect(screen.getByText('PROJETO DE PI1')).toBeInTheDocument();
    expect(screen.getByText('RATOBÔ')).toBeInTheDocument();

    // 2. Verifica se os nomes textuais das abas de navegação estão visíveis no DOM
    expect(screen.getByText('Dashboard')).toBeInTheDocument();
    expect(screen.getByText('Conexão')).toBeInTheDocument();
    expect(screen.getByText('Histórico de sessões')).toBeInTheDocument();

    // 3. Verifica se o botão de ação inferior aparece com o texto completo
    expect(screen.getByText('Criar labirinto')).toBeInTheDocument();
  });

  it('deve alternar os estados visíveis e colapsar os textos ao acionar o botão de toggle', () => {
    render(<Sidebar {...defaultProps} />);

    // Localiza o botão de toggle pelo aria-label estruturado
    const toggleButton = screen.getByRole('button', { name: /toggle sidebar/i });
    expect(screen.getByText('PROJETO DE PI1')).toBeInTheDocument();

    fireEvent.click(toggleButton);

    // Valida que os blocos de texto textuais sumiram da árvore de renderização do DOM
    expect(screen.queryByText('PROJETO DE PI1')).not.toBeInTheDocument();
    expect(screen.queryByText('RATOBÔ')).not.toBeInTheDocument();
    expect(screen.queryByText('Dashboard')).not.toBeInTheDocument();
    expect(screen.queryByText('Criar labirinto')).not.toBeInTheDocument();

    fireEvent.click(toggleButton);
    expect(screen.getByText('PROJETO DE PI1')).toBeInTheDocument();
    expect(screen.getByText('Dashboard')).toBeInTheDocument();
  });

  it('deve disparar a propriedade onNavigate com o ID correto ao clicar nas abas do menu', () => {
    render(<Sidebar {...defaultProps} currentView="dashboard" />);

    // Localiza e clica na aba de gerenciamento de Conexão (Network)
    const conexaoBtn = screen.getByRole('button', { name: /conexão/i });
    fireEvent.click(conexaoBtn);
    expect(defaultProps.onNavigate).toHaveBeenCalledWith('network');

    // Localiza e clica na aba de Histórico de Sessões
    const historicoBtn = screen.getByRole('button', { name: /histórico de sessões/i });
    fireEvent.click(historicoBtn);
    expect(defaultProps.onNavigate).toHaveBeenCalledWith('logs');
  });

  it('deve aplicar as classes estilizadas de item ativo apenas na aba correspondente à view atual', () => {
    render(<Sidebar {...defaultProps} currentView="network" />);

    const dashboardBtn = screen.getByRole('button', { name: /dashboard/i });
    const conexaoBtn = screen.getByRole('button', { name: /conexão/i });

    // A aba 'network' deve conter as classes de destaque da cor primária do Tailwind
    expect(conexaoBtn.className).toContain('text-primary');
    expect(conexaoBtn.className).toContain('border-primary');

    // A aba 'dashboard' deve se manter com as cores neutras de canal inativo
    expect(dashboardBtn.className).toContain('text-on-surface-variant');
    expect(dashboardBtn.className).toContain('border-transparent');
  });

  it('deve injetar a tag HTML title como tooltip nos botões de menu apenas quando a barra estiver colapsada', () => {
    const { rerender } = render(<Sidebar {...defaultProps} />);

    // Em modo expandido, o atributo title/tooltip deve se manter indefinido para não poluir
    const dashboardBtn = screen.getByRole('button', { name: /dashboard/i });
    expect(dashboardBtn.getAttribute('title')).toBeNull();

    // Colapsa a barra para ativar a exibição defensiva de acessibilidade
    const toggleButton = screen.getByRole('button', { name: /toggle sidebar/i });
    fireEvent.click(toggleButton);

    // Agora, mesmo sem o texto interno, o botão precisa fornecer o atributo title correspondente
    rerender(<Sidebar {...defaultProps} />);
    const colapsedBtn = screen.getAllByRole('button')[1]; // Mapeia o item na lista do map
    expect(colapsedBtn.getAttribute('title')).toBe('Dashboard');
  });
});