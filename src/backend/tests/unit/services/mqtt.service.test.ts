jest.mock("mqtt", () => ({
  connect: (...args: unknown[]) => require("../../mocks/mqtt").mqttConnectMock(...args),
}));

jest.mock("../../../src/services/telemetry.service", () =>
  require("../../mocks/telemetry.service")
);

import { env } from "../../../src/config/env";
import { startMqtt } from "../../../src/services/mqtt.service";
import * as telemetryServiceMock from "../../mocks/telemetry.service";
import {
  mqttClientMock,
  mqttConnectMock,
  resetMqttHandlers,
  triggerMqttEvent,
} from "../../mocks/mqtt";

describe("mqtt.service", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    resetMqttHandlers();
  });

  it("connects with client id and optional credentials", () => {
    startMqtt();

    expect(mqttConnectMock).toHaveBeenCalledWith(
      env.mqtt.url,
      expect.objectContaining({
        clientId: env.mqtt.clientId,
      })
    );
  });

  it("subscribes to telemetry topic on connect", () => {
    startMqtt();
    triggerMqttEvent("connect");

    expect(mqttClientMock.subscribe).toHaveBeenCalledWith(
      env.mqtt.telemetryTopic,
      { qos: 0 },
      expect.any(Function)
    );
  });

  it("stores telemetry when message arrives on expected topic", async () => {
    const payload = Buffer.from('{"step":1}', "utf-8");
    telemetryServiceMock.storeTelemetry.mockResolvedValueOnce({ id: "raw-1" });
    jest.spyOn(console, "log").mockImplementation(() => {});

    startMqtt();
    triggerMqttEvent("message", env.mqtt.telemetryTopic, payload);
    await Promise.resolve();

    expect(telemetryServiceMock.storeTelemetry).toHaveBeenCalledWith(
      env.mqtt.telemetryTopic,
      payload
    );
  });

  it("ignores messages from unexpected topics", async () => {
    startMqtt();
    triggerMqttEvent("message", "other/topic", Buffer.from("x"));

    expect(telemetryServiceMock.storeTelemetry).not.toHaveBeenCalled();
  });

  it("logs processing errors without throwing", async () => {
    telemetryServiceMock.storeTelemetry.mockRejectedValueOnce(new Error("fail"));
    jest.spyOn(console, "error").mockImplementation(() => {});

    startMqtt();
    triggerMqttEvent(
      "message",
      env.mqtt.telemetryTopic,
      Buffer.from("{}", "utf-8")
    );
    await Promise.resolve();

    expect(telemetryServiceMock.storeTelemetry).toHaveBeenCalled();
  });

  it("logs reconnect, close and error events", () => {
    const consoleSpy = jest.spyOn(console, "log").mockImplementation(() => {});
    const consoleErrorSpy = jest
      .spyOn(console, "error")
      .mockImplementation(() => {});

    startMqtt();
    triggerMqttEvent("reconnect");
    triggerMqttEvent("close");
    triggerMqttEvent("error", new Error("mqtt fail"));

    expect(consoleSpy).toHaveBeenCalledWith("[MQTT] reconnecting");
    expect(consoleSpy).toHaveBeenCalledWith("[MQTT] connection closed");
    expect(consoleErrorSpy).toHaveBeenCalled();
  });

  it("logs subscribe errors", () => {
    jest.spyOn(console, "log").mockImplementation(() => {});
    const consoleErrorSpy = jest
      .spyOn(console, "error")
      .mockImplementation(() => {});

    startMqtt();
    triggerMqttEvent("connect");
    const subscribeCall = mqttClientMock.subscribe.mock.calls[0];
    subscribeCall[2](new Error("subscribe fail"));

    expect(consoleErrorSpy).toHaveBeenCalledWith(
      "[MQTT] subscribe error",
      expect.any(Error)
    );
  });
});
