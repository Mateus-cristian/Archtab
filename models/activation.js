import database from "infra/database";
import email from "infra/email";
import webserver from "infra/webserver";

const EXPIRATION_IN_MILLISECONDS = 60 * 15 * 1000; // 15 min

async function create(userId) {
  const expiresAt = new Date(Date.now() + EXPIRATION_IN_MILLISECONDS);

  const newToken = await runInsertQuery(userId, expiresAt);
  return newToken;

  async function runInsertQuery(userId, expiresAt) {
    const results = await database.query({
      text: `
          INSERT INTO 
            user_activation_tokens (user_id, expires_at) 
          VALUES
            ($1, $2)
          RETURNING
            *
          ;`,
      values: [userId, expiresAt],
    });

    return results.rows[0];
  }
}

async function findOneByUserId(userId) {
  const newToken = await runInsertQuery(userId);
  return newToken;

  async function runInsertQuery(userId) {
    const results = await database.query({
      text: `
          SELECT 
            *
          FROM
            user_activation_tokens
          WHERE
            user_id = ($1)
          ;`,
      values: [userId],
    });

    return results.rows[0];
  }
}

async function sendEmailToUser(user, activationToken) {
  await email.send({
    from: "Archtab <contato@archtab.com.br>",
    to: user.email,
    subject: "Ative seu cadastro no Archtab!",
    text: `${user.username}, clique no link para ativar seu cadastro:
    
${webserver.origin}/cadastro/ativar/${activationToken.id}...

Atenciosamente,
Equipe Archtab
    `,
  });
}

const activation = {
  create,
  findOneByUserId,
  sendEmailToUser,
};

export default activation;
