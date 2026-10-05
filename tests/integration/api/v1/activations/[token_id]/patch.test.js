import webserver from "infra/webserver";
import activation from "models/activation";
import user from "models/user";
import orchestrator from "tests/orchestrator";
import { v4 as uuidV4, version as uuidVersion } from "uuid";

beforeAll(async () => {
  await orchestrator.waitForAllServices();
  await orchestrator.clearDatabase();
  await orchestrator.runPendingMigrations();
});

describe("PATCH /api/v1/activations/[token_id]", () => {
  describe("Anonymous user", () => {
    test("With nonexistent activation token", async () => {
      const nonexistentActivationToken = uuidV4();

      const response = await fetch(
        `${webserver.origin}/api/v1/activations/${nonexistentActivationToken}`,
        {
          method: "PATCH",
        },
      );

      expect(response.status).toBe(404);

      const responseBody = await response.json();

      expect(responseBody).toEqual({
        name: "NotFoundError",
        message:
          "O token de ativação utilizado não foi encontrado no sistema ou expirou.",
        action: "Faça um novo cadastro.",
        status_code: 404,
      });
    });

    test("With expired activation token", async () => {
      const createdUser = await orchestrator.createUser();
      let expiredActivationToken;

      jest.useFakeTimers({
        now: new Date(Date.now() - 16 * 60 * 1000),
      });

      try {
        expiredActivationToken = await activation.create(createdUser.id);
      } finally {
        jest.useRealTimers();
      }

      const response = await fetch(
        `${webserver.origin}/api/v1/activations/${expiredActivationToken.id}`,
        {
          method: "PATCH",
        },
      );

      expect(response.status).toBe(404);

      const responseBody = await response.json();

      expect(responseBody).toEqual({
        name: "NotFoundError",
        message:
          "O token de ativação utilizado não foi encontrado no sistema ou expirou.",
        action: "Faça um novo cadastro.",
        status_code: 404,
      });

      const userInDatabase = await user.findOneById(createdUser.id);
      expect(userInDatabase.features).toEqual(["read:activation_token"]);
    });

    test("With an activation token used by a previous request", async () => {
      const createdUser = await orchestrator.createUser({
        username: "IdempotentActivation",
      });
      const activationToken = await activation.create(createdUser.id);

      const firstResponse = await fetch(
        `${webserver.origin}/api/v1/activations/${activationToken.id}`,
        {
          method: "PATCH",
        },
      );
      const firstResponseBody = await firstResponse.json();
      const userAfterFirstRequest = await user.findOneById(createdUser.id);

      const repeatedResponse = await fetch(
        `${webserver.origin}/api/v1/activations/${activationToken.id}`,
        {
          method: "PATCH",
        },
      );
      const repeatedResponseBody = await repeatedResponse.json();

      expect(firstResponse.status).toBe(200);
      expect(repeatedResponse.status).toBe(200);
      expect(repeatedResponseBody).toEqual(firstResponseBody);

      const userInDatabase = await user.findOneById(createdUser.id);
      expect(userInDatabase.features).toEqual([
        "create:session",
        "read:session",
        "update:user",
        "read:status",
      ]);
      expect(userInDatabase.updated_at).toEqual(
        userAfterFirstRequest.updated_at,
      );
    });

    test("With simultaneous requests using the same activation token", async () => {
      const createdUser = await orchestrator.createUser({
        username: "SimultaneousActivation",
      });
      const activationToken = await activation.create(createdUser.id);
      const activationUrl = `${webserver.origin}/api/v1/activations/${activationToken.id}`;

      const responses = await Promise.all([
        fetch(activationUrl, { method: "PATCH" }),
        fetch(activationUrl, { method: "PATCH" }),
      ]);
      const responseBodies = await Promise.all(
        responses.map((response) => response.json()),
      );

      expect(responses.map((response) => response.status)).toEqual([200, 200]);
      expect(responseBodies[1]).toEqual(responseBodies[0]);

      const userInDatabase = await user.findOneById(createdUser.id);
      expect(userInDatabase.features).toEqual([
        "create:session",
        "read:session",
        "update:user",
        "read:status",
      ]);
    });

    test("With valid activation token", async () => {
      const createdUser = await orchestrator.createUser({
        username: "ValidActivationToken",
      });
      const activationToken = await activation.create(createdUser.id);

      const response = await fetch(
        `${webserver.origin}/api/v1/activations/${activationToken.id}`,
        {
          method: "PATCH",
        },
      );

      expect(response.status).toBe(200);

      const responseBody = await response.json();

      expect(responseBody).toEqual({
        id: activationToken.id,
        user_id: createdUser.id,
        used_at: responseBody.used_at,
        expires_at: activationToken.expires_at.toISOString(),
        created_at: activationToken.created_at.toISOString(),
        updated_at: responseBody.updated_at,
      });

      expect(uuidVersion(responseBody.id)).toBe(4);
      expect(Date.parse(responseBody.used_at)).not.toBeNaN();
      expect(Date.parse(responseBody.expires_at)).not.toBeNaN();
      expect(Date.parse(responseBody.created_at)).not.toBeNaN();
      expect(Date.parse(responseBody.updated_at)).not.toBeNaN();
      expect(
        responseBody.used_at > activationToken.created_at.toISOString(),
      ).toBe(true);
      expect(
        responseBody.updated_at > activationToken.updated_at.toISOString(),
      ).toBe(true);

      const activatedUser = await user.findOneById(createdUser.id);
      expect(activatedUser.features).toEqual([
        "create:session",
        "read:session",
        "update:user",
        "read:status",
      ]);
      expect(activatedUser.updated_at > createdUser.updated_at).toBe(true);

      await expect(
        activation.findOneValidByToken(activationToken.id),
      ).rejects.toMatchObject({
        name: "NotFoundError",
        message:
          "O token de ativação utilizado não foi encontrado no sistema ou expirou.",
        action: "Faça um novo cadastro.",
        statusCode: 404,
      });
    });

    test("With valid activation token from already active user", async () => {
      const createdUser = await orchestrator.createUser();
      const activationToken = await activation.create(createdUser.id);
      const activatedUser = await orchestrator.activateUser(createdUser.id);

      const response = await fetch(
        `${webserver.origin}/api/v1/activations/${activationToken.id}`,
        {
          method: "PATCH",
        },
      );

      expect(response.status).toBe(403);

      const responseBody = await response.json();

      expect(responseBody).toEqual({
        name: "ForbbidenError",
        message: "Você não pode mais utilizar tokens de ativação.",
        action: "Entre em contato com o suporte.",
        status_code: 403,
      });

      const userInDatabase = await user.findOneById(createdUser.id);
      expect(userInDatabase.features).toEqual(activatedUser.features);

      const activationTokenInDatabase = await activation.findOneValidByToken(
        activationToken.id,
      );
      expect(activationTokenInDatabase.used_at).toBe(null);
    });
  });

  describe("Default user", () => {
    test("With valid session but without read activation token permission", async () => {
      const activeUser = await orchestrator.createUser();
      await orchestrator.activateUser(activeUser.id);
      const activeUserSession = await orchestrator.createSession(activeUser.id);

      const activationTokenUser = await orchestrator.createUser();
      const activationToken = await activation.create(activationTokenUser.id);

      const response = await fetch(
        `${webserver.origin}/api/v1/activations/${activationToken.id}`,
        {
          method: "PATCH",
          headers: {
            Cookie: `session_id=${activeUserSession.token}`,
          },
        },
      );

      expect(response.status).toBe(403);

      const responseBody = await response.json();

      expect(responseBody).toEqual({
        name: "ForbbidenError",
        message: "Você não possui permissão para executar esta ação.",
        action:
          "Verifique se o seu usuário possui a feature read:activation_token.",
        status_code: 403,
      });

      const userInDatabase = await user.findOneById(activationTokenUser.id);
      expect(userInDatabase.features).toEqual(["read:activation_token"]);

      const activationTokenInDatabase = await activation.findOneValidByToken(
        activationToken.id,
      );
      expect(activationTokenInDatabase.used_at).toBe(null);
    });
  });
});
