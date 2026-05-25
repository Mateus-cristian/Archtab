import email from "infra/email.js";
import orchestrator from "tests/orchestrator.js";

beforeAll(async () => {
  await orchestrator.waitForAllServices();
  await orchestrator.deleteAllEmails();
});

describe("infra/email.js", () => {
  test("send()", async () => {
    await email.send({
      from: "Archtab <contato@archtab.com.br>",
      to: "contato@cristian.com",
      subject: "Teste de assunto",
      text: "Teste de corpo.",
    });

    await email.send({
      from: "Ultimo <ultimoemail@archtab.com.br>",
      to: "ultimoemailto@cristian.com",
      subject: "Ultimo Email de assunto",
      text: "Ultimo Email de corpo.",
    });

    const lastEmail = await orchestrator.getLastEmail();

    expect(lastEmail.sender).toBe("<ultimoemail@archtab.com.br>");
    expect(lastEmail.recipients[0]).toBe("<ultimoemailto@cristian.com>");
    expect(lastEmail.subject).toBe("Ultimo Email de assunto");
    expect(lastEmail.text).toBe("Ultimo Email de corpo.\n");
  });
});
