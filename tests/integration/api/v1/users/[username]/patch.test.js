import password from "models/password.js";
import user from "models/user.js";
import orchestrator from "tests/orchestrator";
import { version as uuidVersion } from "uuid";

beforeAll(async () => {
  await orchestrator.waitForAllServices();
  await orchestrator.clearDatabase();
  await orchestrator.runPendingMigrations();
});

describe("PATCH /api/v1/users/[username]", () => {
  describe("Anonymous user", () => {
    test("Without `update:user` feature", async () => {
      const response = await fetch(
        "http://localhost:3000/api/v1/users/UsuarioInexistente",
        {
          method: "PATCH",
        },
      );

      expect(response.status).toBe(403);

      const responseBody = await response.json();

      expect(responseBody).toEqual({
        name: "ForbbidenError",
        message: "Você não possui permissão para executar esta ação.",
        action: "Verifique se o seu usuário possui a feature update:user.",
        status_code: 403,
      });
    });
  });

  describe("Default user", () => {
    (test("With noneexistent 'username'", async () => {
      const activatedUser = await orchestrator.createActivatedUser();

      const sessionObject = await orchestrator.createSession(activatedUser.id);

      const response = await fetch(
        "http://localhost:3000/api/v1/users/UsuarioInexistente",
        {
          method: "PATCH",
          headers: {
            Cookie: `session_id=${sessionObject.token}`,
          },
        },
      );
      expect(response.status).toBe(404);

      const responseBody = await response.json();

      expect(responseBody).toEqual({
        name: "NotFoundError",
        message: "O username informado não foi encontrado no sistema.",
        action: "Verifique se o username está digitado corretamente.",
        status_code: 404,
      });
    }),
      test("With duplicated 'username'", async () => {
        await orchestrator.createUser({
          username: "user1",
        });

        const activatedUser = await orchestrator.createActivatedUser({
          username: "user2",
        });

        const sessionObject = await orchestrator.createSession(
          activatedUser.id,
        );

        const response = await fetch(
          `http://localhost:3000/api/v1/users/${activatedUser.username}`,
          {
            method: "PATCH",
            headers: {
              "Content-Type": "application/json",
              Cookie: `session_id=${sessionObject.token}`,
            },
            body: JSON.stringify({
              username: "user1",
            }),
          },
        );

        expect(response.status).toBe(400);

        const responseBody = await response.json();

        expect(responseBody).toEqual({
          name: "ValidationError",
          message: "O username informado já está sendo utilizado.",
          action: "Utilize outro username para realizar esta operação.",
          status_code: 400,
        });
      }));

    test("With duplicated 'email'", async () => {
      await orchestrator.createUser({
        email: "email1.novo@curso.dev",
      });

      const activatedUser = await orchestrator.createActivatedUser({
        email: "email2.novo2@curso.dev",
      });

      const sessionObject = await orchestrator.createSession(activatedUser.id);

      const response = await fetch(
        `http://localhost:3000/api/v1/users/${activatedUser.username}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Cookie: `session_id=${sessionObject.token}`,
          },
          body: JSON.stringify({
            email: "email1.novo@curso.dev",
          }),
        },
      );

      expect(response.status).toBe(400);

      const responseBody = await response.json();

      expect(responseBody).toEqual({
        name: "ValidationError",
        message: "O email informado já está sendo utilizado.",
        action: "Utilize outro email para realizar esta operação.",
        status_code: 400,
      });
    });

    test("With unique 'username'", async () => {
      const activatedUser = await orchestrator.createActivatedUser({
        username: "uniqueUser1",
      });

      const sessionObject = await orchestrator.createSession(activatedUser.id);

      const response = await fetch(
        `http://localhost:3000/api/v1/users/${activatedUser.username}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Cookie: `session_id=${sessionObject.token}`,
          },
          body: JSON.stringify({
            username: "uniqueUser2",
          }),
        },
      );

      expect(response.status).toBe(200);

      const responseBody = await response.json();

      expect(responseBody).toEqual({
        id: responseBody.id,
        username: "uniqueUser2",
        email: responseBody.email,
        features: ["create:session", "read:session", "update:user"],
        password: responseBody.password,
        created_at: responseBody.created_at,
        updated_at: responseBody.updated_at,
      });

      expect(uuidVersion(responseBody.id)).toBe(4);
      expect(Date.parse(responseBody.created_at)).not.toBeNaN();
      expect(Date.parse(responseBody.updated_at)).not.toBeNaN();
      expect(responseBody.updated_at > responseBody.created_at).toBe(true);
    });

    test("With unique 'email'", async () => {
      const activatedUser = await orchestrator.createActivatedUser({
        email: "uniqueEmail1.novo@curso.dev",
      });

      const sessionObject = await orchestrator.createSession(activatedUser.id);

      const response = await fetch(
        `http://localhost:3000/api/v1/users/${activatedUser.username}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Cookie: `session_id=${sessionObject.token}`,
          },
          body: JSON.stringify({
            email: "uniqueEmail2.novo@curso.dev",
          }),
        },
      );

      expect(response.status).toBe(200);

      const responseBody = await response.json();

      expect(responseBody).toEqual({
        id: responseBody.id,
        username: activatedUser.username,
        email: "uniqueEmail2.novo@curso.dev",
        features: ["create:session", "read:session", "update:user"],
        password: responseBody.password,
        created_at: responseBody.created_at,
        updated_at: responseBody.updated_at,
      });

      expect(uuidVersion(responseBody.id)).toBe(4);
      expect(Date.parse(responseBody.created_at)).not.toBeNaN();
      expect(Date.parse(responseBody.updated_at)).not.toBeNaN();
      expect(responseBody.updated_at > responseBody.created_at).toBe(true);
    });

    test("With new 'password'", async () => {
      const activatedUser = await orchestrator.createActivatedUser({
        password: "newPassword1",
      });

      const sessionObject = await orchestrator.createSession(activatedUser.id);

      const response = await fetch(
        `http://localhost:3000/api/v1/users/${activatedUser.username}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Cookie: `session_id=${sessionObject.token}`,
          },
          body: JSON.stringify({
            password: "newPassword2",
          }),
        },
      );

      expect(response.status).toBe(200);

      const responseBody = await response.json();

      expect(responseBody).toEqual({
        id: responseBody.id,
        username: activatedUser.username,
        email: activatedUser.email,
        features: ["create:session", "read:session", "update:user"],
        password: responseBody.password,
        created_at: responseBody.created_at,
        updated_at: responseBody.updated_at,
      });

      expect(uuidVersion(responseBody.id)).toBe(4);
      expect(Date.parse(responseBody.created_at)).not.toBeNaN();
      expect(Date.parse(responseBody.updated_at)).not.toBeNaN();
      expect(responseBody.updated_at > responseBody.created_at).toBe(true);

      const userInDatabase = await user.findOneByUsername(
        activatedUser.username,
      );

      const correctPasswordMatch = await password.compare(
        "newPassword2",
        userInDatabase.password,
      );

      const incorrectPasswordMatch = await password.compare(
        "newPassword1",
        userInDatabase.password,
      );

      expect(correctPasswordMatch).toBe(true);
      expect(incorrectPasswordMatch).toBe(false);
    });
  });

  describe("Admin user", () => {
    test("With `update:user:others` targeting another user", async () => {
      const targetUser = await orchestrator.createActivatedUser({
        username: "defaultUser",
        email: "default@curso.dev",
      });

      const adminUser = await orchestrator.createActivatedUser({
        username: "adminUser",
      });

      const adminUserWithFeatures = await orchestrator.addFeaturesToUser(
        adminUser,
        ["update:user:others"],
      );

      const sessionObject = await orchestrator.createSession(
        adminUserWithFeatures.id,
      );

      const response = await fetch(
        `http://localhost:3000/api/v1/users/${targetUser.username}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Cookie: `session_id=${sessionObject.token}`,
          },
          body: JSON.stringify({
            email: "updated.default@curso.dev",
          }),
        },
      );

      expect(response.status).toBe(200);

      const responseBody = await response.json();

      expect(responseBody).toEqual({
        id: targetUser.id,
        username: targetUser.username,
        email: "updated.default@curso.dev",
        features: targetUser.features,
        password: targetUser.password,
        created_at: targetUser.created_at.toISOString(),
        updated_at: responseBody.updated_at,
      });
    });
  });
});
