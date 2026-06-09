import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { ConnectWidget } from '../../components/connectWidgets'; // Ajuste o caminho relativo se necessário

describe('ConnectWidget Component', () => {
  const defaultProps = {
    title: 'Broker MQTT',
    subtitle: 'Camada de Mensageria',
    status: 'DISCONNECTED' as const,
  };

  it('deve renderizar os metadados do cabeçalho e taxas padrões de transmissão', () => {
    render(<ConnectWidget {...defaultProps} />);

    expect(screen.getByText('Broker MQTT')).toBeInTheDocument();
    expect(screen.getByText('Camada de Mensageria')).toBeInTheDocument();

    // Valida os rótulos de identificação de fluxo
    expect(screen.getByText(/TX:/i)).toBeInTheDocument();
    expect(screen.getByText(/RX:/i)).toBeInTheDocument();

    const defaultRates = screen.getAllByText('0.0KB/s');
    expect(defaultRates).toHaveLength(2); // Garante que ambos os contadores (TX e RX) renderizaram o valor padrão
  });

  it('deve renderizar o estado de DISCONNECTED com a estilização de erro correspondente', () => {
    render(<ConnectWidget {...defaultProps} status="DISCONNECTED" />);
    
    const badge = screen.getByText('DISCONNECTED');
    expect(badge).toBeInTheDocument();
    expect(badge.className).toContain('border-red-500');
    expect(badge.className).toContain('text-red-400');
  });

  it('deve renderizar o estado de CONNECTING com as cores de alerta', () => {
    render(<ConnectWidget {...defaultProps} status="CONNECTING" />);
    
    const badge = screen.getByText('CONNECTING');
    expect(badge).toBeInTheDocument();
    expect(badge.className).toContain('border-amber-500');
    expect(badge.className).toContain('text-amber-400');
  });

  it('deve renderizar o estado de CONNECTED com animação de pulso e cores de sucesso', () => {
    render(<ConnectWidget {...defaultProps} status="CONNECTED" />);
    
    const badge = screen.getByText('CONNECTED');
    expect(badge).toBeInTheDocument();
    expect(badge.className).toContain('border-emerald-500');
    expect(badge.className).toContain('animate-pulse');
  });

  it('deve exibir a mensagem de fallback de caixa vazia quando não houver logs na propriedade', () => {
    render(<ConnectWidget {...defaultProps} logs={[]} />);
    
    expect(screen.getByText('Sem tráfego de dados ativo')).toBeInTheDocument();
  });

  it('deve listar dinamicamente as linhas de log recebidas com a flag WRITTEN_OK', () => {
    const mockLogs = [
      '[14:20:00] [PASSO #1] MQTT_PUB_OK',
      '[14:20:03] [PASSO #2] MQTT_PUB_OK'
    ];

    render(<ConnectWidget {...defaultProps} logs={mockLogs} txRate="1.2KB/s" rxRate="0.8KB/s" />);

    // Verifica se as mensagens textuais do log aparecem na árvore do DOM
    expect(screen.getByText('[14:20:00] [PASSO #1] MQTT_PUB_OK')).toBeInTheDocument();
    expect(screen.getByText('[14:20:03] [PASSO #2] MQTT_PUB_OK')).toBeInTheDocument();

    // Verifica se a flag de sucesso foi injetada para cada linha do map
    const badgesWritten = screen.getAllByText('WRITTEN_OK');
    expect(badgesWritten).toHaveLength(2);

    // Certifica que as taxas dinâmicas customizadas sobrescreveram os defaults sem conflito
    expect(screen.getByText('1.2KB/s')).toBeInTheDocument();
    expect(screen.getByText('0.8KB/s')).toBeInTheDocument();
    
    // Garante que o contêiner de fallback sumiu com a chegada dos dados
    expect(screen.queryByText('Sem tráfego de dados ativo')).not.toBeInTheDocument();
  });
});