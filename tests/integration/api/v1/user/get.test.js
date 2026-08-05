import webserver from "infra/webserver";
import session from "models/session";
import setCookieParser from "set-cookie-parser";
import orchestrator from "tests/orchestrator";
import { version as uuidVersion } from "uuid";

beforeAll(async () => {
  await orchestrator.waitForAllServices();
  await orchestrator.clearDatabase();
  await orchestrator.runPendingMigrations();
});

describe("GET /api/v1/user", () => {
  (describe("Anonymous user", () => {
    test("Retriving the endpoint", async () => {
      const response = await fetch(`${webserver.origin}/api/v1/user`);

      expect(response.status).toBe(403);

      const responseBody = await response.json();

      expect(responseBody).toEqual({
        name: "ForbbidenError",
        message: "Você não possui permissão para executar esta ação.",
        action: "Verifique se o seu usuário possui a feature read:session.",
        status_code: 403,
      });
    });
  }),
    describe("Default user", () => {
      test("With valid session", async () => {
        const createdUser = await orchestrator.createUser({
          username: "UserWithValidSession",
        });

        const activatedUser = await orchestrator.activateUser(createdUser.id);
        const sessionObject = await orchestrator.createSession(createdUser.id);

        const response = await fetch(`${webserver.origin}/api/v1/user`, {
          headers: {
            Cookie: `session_id=${sessionObject.token}`,
          },
        });

        expect(response.status).toBe(200);

        const responseBody = await response.json();

        const cacheControl = response.headers.get("Cache-Control");

        expect(cacheControl).toBe(
          "no-store, no-cache, max-age=0, must-revalidate",
        );

        expect(responseBody).toEqual({
          id: createdUser.id,
          username: "UserWithValidSession",
          email: createdUser.email,
          features: [
            "create:session",
            "read:session",
            "update:user",
            "read:status",
          ],
          created_at: createdUser.created_at.toISOString(),
          updated_at: activatedUser.updated_at.toISOString(),
        });

        expect(uuidVersion(responseBody.id)).toBe(4);
        expect(Date.parse(responseBody.created_at)).not.toBeNaN();
        expect(Date.parse(responseBody.updated_at)).not.toBeNaN();

        // session renewed assertions
        const renewedSessionObject = await session.findOneValidByToken(
          sessionObject.token,
        );

        expect(
          renewedSessionObject.expires_at > sessionObject.expires_at,
        ).toEqual(true);
        expect(
          renewedSessionObject.updated_at > sessionObject.updated_at,
        ).toEqual(true);

        // Set-cookie assertions]
        const parsedSetCookie = setCookieParser(response, {
          map: true,
        });

        expect(parsedSetCookie.session_id).toEqual({
          name: "session_id",
          value: sessionObject.token,
          maxAge: session.EXPIRATION_IN_MILLISECONDS / 1000,
          path: "/",
          httpOnly: true,
          sameSite: "Lax",
        });
      });

      test("With noneexistent session", async () => {
        const nonexistentToken =
          "636a6ac5ee119582607d08fbbccb1bf61374fccc6d52ff6a07baa28ebc9d895e46d65eaf8f9f01ebc2f70269db54033c";

        const response = await fetch(`${webserver.origin}/api/v1/user`, {
          headers: {
            Cookie: `session_id=${nonexistentToken}`,
          },
        });

        expect(response.status).toBe(401);

        const responseBody = await response.json();

        expect(responseBody).toEqual({
          name: "UnauthorizedError",
          message: "Usuário não possui sessão ativa.",
          action: "Verifique se este usuário está logado e tente novamente.",
          status_code: 401,
        });
      });

      test("With expired session", async () => {
        jest.useFakeTimers({
          now: new Date(Date.now() - session.EXPIRATION_IN_MILLISECONDS),
        });

        const createdUser = await orchestrator.createUser({
          username: "UserWithExpiredSession",
        });

        const sessionObject = await orchestrator.createSession(createdUser.id);

        jest.useRealTimers();

        const response = await fetch(`${webserver.origin}/api/v1/user`, {
          headers: {
            Cookie: `session_id=${sessionObject.token}`,
          },
        });

        expect(response.status).toBe(401);

        const responseBody = await response.json();

        expect(responseBody).toEqual({
          name: "UnauthorizedError",
          message: "Usuário não possui sessão ativa.",
          action: "Verifique se este usuário está logado e tente novamente.",
          status_code: 401,
        });
      });

      test("With halfway-expired session", async () => {
        jest.useFakeTimers({
          now: new Date(Date.now() - session.EXPIRATION_IN_MILLISECONDS / 2),
        });
        const createdUser = await orchestrator.createUser({
          username: "UserWithHafWaySession",
        });

        const activatedUser = await orchestrator.activateUser(createdUser.id);
        const sessionObject = await orchestrator.createSession(createdUser.id);

        jest.useRealTimers();

        const response = await fetch(`${webserver.origin}/api/v1/user`, {
          headers: {
            Cookie: `session_id=${sessionObject.token}`,
          },
        });

        expect(response.status).toBe(200);

        const responseBody = await response.json();

        expect(responseBody).toEqual({
          id: createdUser.id,
          username: "UserWithHafWaySession",
          email: createdUser.email,
          features: [
            "create:session",
            "read:session",
            "update:user",
            "read:status",
          ],
          created_at: createdUser.created_at.toISOString(),
          updated_at: activatedUser.updated_at.toISOString(),
        });

        expect(uuidVersion(responseBody.id)).toBe(4);
        expect(Date.parse(responseBody.created_at)).not.toBeNaN();
        expect(Date.parse(responseBody.updated_at)).not.toBeNaN();

        // session renewed assertions
        const renewedSessionObject = await session.findOneValidByToken(
          sessionObject.token,
        );

        expect(
          renewedSessionObject.expires_at > sessionObject.expires_at,
        ).toEqual(true);
        expect(
          renewedSessionObject.updated_at > sessionObject.updated_at,
        ).toEqual(true);

        // Set-cookie assertions]
        const parsedSetCookie = setCookieParser(response, {
          map: true,
        });

        expect(parsedSetCookie.session_id).toEqual({
          name: "session_id",
          value: sessionObject.token,
          maxAge: session.EXPIRATION_IN_MILLISECONDS / 1000,
          path: "/",
          httpOnly: true,
          sameSite: "Lax",
        });
      });
    }));
});
