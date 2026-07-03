import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import EngineTelemetryWidget from "../../features/telemetry/components/EngineTelemetryWidget";

describe("EngineTelemetryWidget Component", () => {
  it("deve renderizar a corrente e os indicadores de propulsão corretos", () => {
    render(<EngineTelemetryWidget motorCurrent={150} velocity={0} />);

    expect(screen.getByText(/PROPULSÃO \/ MOTORES/i)).toBeInTheDocument();
    expect(screen.getByTestId("velocity-display")).toBeInTheDocument();
    expect(screen.getByText(/FORÇA \/ RPM NOMINAL:/i)).toBeInTheDocument();
  });
});