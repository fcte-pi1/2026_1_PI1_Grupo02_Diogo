import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi } from "vitest";
import Sidebar from "../../components/Sidebar";

describe("Sidebar", () => {
  it("renderiza itens de navegação e destaca a view ativa", () => {
    const onNavigate = vi.fn();

    render(<Sidebar currentView="dashboard" onNavigate={onNavigate} />);

    expect(screen.getByText("PROJETO DE PI1")).toBeInTheDocument();
    expect(screen.getByText("Dashboard")).toBeInTheDocument();
    expect(screen.getByText("Conexão")).toBeInTheDocument();
  });

  it("dispara onNavigate ao clicar em um item", async () => {
    const user = userEvent.setup();
    const onNavigate = vi.fn();

    render(<Sidebar currentView="dashboard" onNavigate={onNavigate} />);

    await user.click(screen.getByText("Conexão"));

    expect(onNavigate).toHaveBeenCalledWith("network");
  });

  it("colapsa e expande a barra lateral", async () => {
    const user = userEvent.setup();

    render(<Sidebar currentView="dashboard" />);

    expect(screen.getByText("RATOBÔ")).toBeInTheDocument();

    await user.click(screen.getByLabelText("Toggle sidebar"));

    expect(screen.queryByText("RATOBÔ")).not.toBeInTheDocument();
    expect(screen.getByTitle("Dashboard")).toBeInTheDocument();
  });

  it("recarrega a aplicação ao clicar em reiniciar", async () => {
    const user = userEvent.setup();
    const reloadMock = vi.fn();
    Object.defineProperty(window, "location", {
      configurable: true,
      value: { reload: reloadMock },
    });

    render(<Sidebar currentView="dashboard" />);

    await user.click(screen.getByText("Reiniciar app"));

    expect(reloadMock).toHaveBeenCalled();
  });
});
