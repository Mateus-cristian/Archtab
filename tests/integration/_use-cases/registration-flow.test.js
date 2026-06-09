import webserver from "infra/webserver";
import activation from "models/activation";
import user from "models/user";
import orchestrator from "tests/orchestrator";

beforeAll(async () => {
  await orchestrator.waitForAllServices();
  await orchestrator.clearDatabase();
  await orchestrator.runPendingMigrations();
  await orchestrator.deleteAllEmails();
});

describe("Use case: Registration Flow (all successful)", () => {
  let createUserResponseBody;
  let activationTokenId;
  test("Create user account", async () => {
    const response = await fetch("http://localhost:3000/api/v1/users", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        username: "mateuscristian",
        email: "mateus.cris@curso.dev",
        password: "senha123",
      }),
    });

    expect(response.status).toBe(201);

    createUserResponseBody = await response.json();

    expect(createUserResponseBody).toEqual({
      id: createUserResponseBody.id,
      username: "mateuscristian",
      email: "mateus.cris@curso.dev",
      features: ["read:activation_token"],
      password: createUserResponseBody.password,
      created_at: createUserResponseBody.created_at,
      updated_at: createUserResponseBody.updated_at,
    });
  });

  test("Receive activation email", async () => {
    const lastEmail = await orchestrator.getLastEmail();

    expect(lastEmail.sender).toBe("<contato@archtab.com.br>");
    expect(lastEmail.recipients[0]).toBe("<mateus.cris@curso.dev>");
    expect(lastEmail.subject).toBe("Ative seu cadastro no Archtab!");
    expect(lastEmail.text).toContain("mateuscristian");

    activationTokenId = await orchestrator.extractUUID(lastEmail.text);

    expect(lastEmail.text).toContain(
      `${webserver.origin}/cadastro/ativar/${activationTokenId}`,
    );

    const activationTokenObject =
      await activation.findOneValidByToken(activationTokenId);

    expect(activationTokenObject.user_id).toBe(createUserResponseBody.id);
    expect(activationTokenObject.used_at).toBe(null);
  });

  test("Activate account", async () => {
    const response = await fetch(
      `http://localhost:3000/api/v1/activations/${activationTokenId}`,
      {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
      },
    );

    expect(response.status).toBe(200);

    const responseActivationBody = await response.json();
    expect(Date.parse(responseActivationBody.used_at)).not.toBeNaN();

    const activedUser = await user.findOneById(responseActivationBody.user_id);
    expect(activedUser.features).toEqual(["create:session"]);
  });

  test.todo("Login");

  test.todo("Get user information");
});
