import webserver from "infra/webserver";
import orchestrator from "tests/orchestrator";

beforeAll(async () => {
  await orchestrator.waitForAllServices();
  await orchestrator.clearDatabase();
});

describe("PUT /api/v1/migrations", () => {
  describe("Anonymous user", () => {
    test("Error method not allowed", async () => {
      const response = await fetch(`${webserver.origin}/api/v1/migrations`, {
        method: "PUT",
      });

      expect(response.status).toBe(405);

      const responseBody = await response.json();

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
