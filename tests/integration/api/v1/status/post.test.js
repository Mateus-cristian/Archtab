import webserver from "infra/webserver";
import orchestrator from "tests/orchestrator";

beforeAll(async () => {
  await orchestrator.waitForAllServices();
  await orchestrator.clearDatabase();
});

describe("POST /api/v1/status", () => {
  describe("Anonymous user", () => {
    test("Retriving current system status", async () => {
      const response = await fetch(`${webserver.origin}/api/v1/status`, {
        method: "POST",
      });

      const responseBody = await response.json();

      expect(response.status).toBe(405);

      expect(responseBody).toEqual({
        name: "MethodNotAllowedError",
        message: "Método não permitido para o endpoint.",
        action:
          "Verifique se o método HTTP enviado é válido para esse endpoint.",
        status_code: 405,
      });
    });
  });
});
