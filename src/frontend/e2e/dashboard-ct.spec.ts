/**
 * Suíte E2E mapeada ao Roteiro de Testes Funcionais (CT01–CT07)
 * documentado em docs/relatorio/editaveis/06_projetoconceitual.tex
 */
import { test, expect } from "@playwright/test";
import { buildTelemetryStep } from "./fixtures/telemetry";
import { emitTelemetryStep } from "./helpers/telemetry-api";
import { openDashboard } from "./helpers/dashboard";

test.describe("Roteiro funcional do dashboard (CT01–CT07)", () => {
  test.describe.configure({ mode: "serial" });

  test.beforeEach(async ({ page }) => {
    await openDashboard(page);
  });

  /**
   * CT01 – Exibir tipo do labirinto
   * Pré-condição: micromouse enviando telemetria
   * Procedimento: acessar sistema, iniciar telemetria, observar campo "Tipo do labirinto"
   */
  test.fixme("CT01 – exibe o tipo do labirinto conforme telemetria", async () => {
    // Pendente: campo "Tipo do labirinto" ainda não existe na UI do dashboard.
    // Quando implementado, usar data-testid="maze-type" e validar valor emitido.
  });

  /**
   * CT02 – Exibir trajeto do micromouse
   * Procedimento: acessar sistema, iniciar execução, observar visualização do trajeto
   */
  test("CT02 – exibe coordenadas do trajeto em tempo real", async ({ page, request }) => {
    await emitTelemetryStep(
      request,
      buildTelemetryStep({ stepOrder: 1, posX: 2, posY: 3 })
    );

    await expect(page.getByTestId("maze-coords")).toHaveText("COORDS: X-2, Y-3");

    await emitTelemetryStep(
      request,
      buildTelemetryStep({ id: "step-2", stepOrder: 2, posX: 4, posY: 1 })
    );

    await expect(page.getByTestId("maze-coords")).toHaveText("COORDS: X-4, Y-1");
  });

  /**
   * CT03 – Exibir consumo de bateria
   * Procedimento: acessar sistema, iniciar telemetria, observar campo de bateria
   */
  test("CT03 – exibe consumo de bateria atualizado em tempo real", async ({
    page,
    request,
  }) => {
    await emitTelemetryStep(
      request,
      buildTelemetryStep({ voltage: 11.5, current: 320 })
    );

    await expect(page.getByTestId("battery-voltage")).toHaveText("11.5V");
    await expect(page.getByTestId("battery-percentage")).not.toHaveText("0%");

    await emitTelemetryStep(
      request,
      buildTelemetryStep({ id: "step-2", stepOrder: 2, voltage: 10.1, current: 180 })
    );

    await expect(page.getByTestId("battery-voltage")).toHaveText("10.1V");
  });

  /**
   * CT04 – Exibir velocidade média
   * Procedimento: acessar sistema, iniciar telemetria, observar campo de velocidade
   */
  test.fixme("CT04 – exibe velocidade média conforme telemetria", async () => {
    // Pendente: velocity ainda fixo em 0 no DashboardScreen.
    // Quando exposto no payload, validar data-testid="velocity-display".
  });

  /**
   * CT05 – Exibir tempo de conclusão
   * Pré-condição: execução em andamento
   * Procedimento: executar micromouse, aguardar término, observar tempo
   */
  test("CT05 – exibe cronômetro ativo durante a execução", async ({ page, request }) => {
    await expect(page.getByTestId("race-timer-status")).toHaveText("STANDBY");
    await expect(page.getByTestId("race-timer-value")).toHaveText("00:00.00");

    await emitTelemetryStep(
      request,
      buildTelemetryStep({ stepOrder: 1, posX: 1, posY: 0 })
    );

    await expect(page.getByTestId("race-timer-status")).toHaveText("ACTIVE");
    await expect(page.getByTestId("race-timer-value")).not.toHaveText("00:00.00");
  });

  /**
   * CT06 – Exibir desafio cumprido (S/N)
   * Pré-condição: execução finalizada
   * Procedimento: finalizar percurso, observar campo "Desafio cumprido"
   */
  test.fixme("CT06 – exibe status do desafio cumprido (Sim/Não)", async () => {
    // Pendente: indicador "Desafio cumprido" ainda não existe no dashboard.
    // Quando implementado, usar data-testid="challenge-status".
  });

  /**
   * CT07 – Atualização em tempo real
   * Procedimento: acessar sistema, iniciar envio contínuo, observar campos sem recarregar
   */
  test("CT07 – atualiza widgets automaticamente sem recarregar a página", async ({
    page,
    request,
  }) => {
    await emitTelemetryStep(
      request,
      buildTelemetryStep({ stepOrder: 1, posX: 0, posY: 0, voltage: 12.0 })
    );

    await expect(page.getByTestId("battery-voltage")).toHaveText("12V");
    await expect(page.getByTestId("maze-coords")).toHaveText("COORDS: X-0, Y-0");

    await emitTelemetryStep(
      request,
      buildTelemetryStep({
        id: "step-2",
        stepOrder: 2,
        posX: 3,
        posY: 2,
        voltage: 11.2,
      })
    );

    await expect(page.getByTestId("battery-voltage")).toHaveText("11.2V");
    await expect(page.getByTestId("maze-coords")).toHaveText("COORDS: X-3, Y-2");

    await page.reload();
    await page.getByTestId("dashboard").waitFor({ state: "visible", timeout: 5000 });

    await emitTelemetryStep(
      request,
      buildTelemetryStep({ id: "step-3", stepOrder: 3, posX: 5, posY: 5, voltage: 10.8 })
    );

    await expect(page.getByTestId("maze-coords")).toHaveText("COORDS: X-5, Y-5");
  });
});
