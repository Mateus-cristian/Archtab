import webserver from "infra/webserver";
import orchestrator from "tests/orchestrator";

beforeAll(async () => {
  await orchestrator.waitForAllServices();
});

beforeEach(async () => {
  await orchestrator.clearDatabase();
});

describe("GET /api/v1/migrations", () => {
  describe("Anonymous user", () => {
    test("Without `read:migration` feature", async () => {
      const response = await fetch(`${webserver.origin}/api/v1/migrations`);

      expect(response.status).toBe(403);

      const responseBody = await response.json();

      expect(responseBody).toEqual({
        name: "ForbbidenError",
        message: "Você não possui permissão para executar esta ação.",
        action: "Verifique se o seu usuário possui a feature read:migration.",
        status_code: 403,
      });
    });
  });

  describe("Default user", () => {
    test("Without `read:migration` feature", async () => {
      await orchestrator.runPendingMigrations();
      const defaultUser = await orchestrator.createActivatedUser();
      const sessionObject = await orchestrator.createSession(defaultUser.id);

      const response = await fetch(`${webserver.origin}/api/v1/migrations`, {
        headers: {
          Cookie: `session_id=${sessionObject.token}`,
        },
      });

      expect(response.status).toBe(403);

      const responseBody = await response.json();

      expect(responseBody).toEqual({
        name: "ForbbidenError",
        message: "Você não possui permissão para executar esta ação.",
        action: "Verifique se o seu usuário possui a feature read:migration.",
        status_code: 403,
      });
    });
  });

  describe("Admin user", () => {
    test("With `read:migration` feature", async () => {
      await orchestrator.runPendingMigrations();
      const adminUser = await orchestrator.createActivatedUser();
      const adminUserWithFeatures = await orchestrator.addFeaturesToUser(
        adminUser,
        ["read:migration"],
      );
      const sessionObject = await orchestrator.createSession(
        adminUserWithFeatures.id,
      );

      const response = await fetch(`${webserver.origin}/api/v1/migrations`, {
        headers: {
          Cookie: `session_id=${sessionObject.token}`,
        },
      });

      expect(response.status).toBe(200);

      const responseBody = await response.json();

      expect(responseBody).toEqual([]);
    });
  });
});
