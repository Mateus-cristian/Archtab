import database from "infra/database";
import email from "infra/email";
import { ForbbidenError, NotFoundError } from "infra/errors";
import webserver from "infra/webserver";
import user from "models/user";
import authorization from "./authorization";

const EXPIRATION_IN_MILLISECONDS = 60 * 15 * 1000; // 15 min
const ACTIVATED_USER_FEATURES = [
  "create:session",
  "read:session",
  "update:user",
  "read:status",
];

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

async function findOneValidByToken(activationToken) {
  const activationFound = await runInsertQuery(activationToken);

  return activationFound;

  async function runInsertQuery(activationToken) {
    const results = await database.query({
      text: `
          SELECT
            *
          FROM
            user_activation_tokens
          WHERE
            id = $1
            AND expires_at > NOW()
            AND used_at IS null
          LIMIT
            1
      `,
      values: [activationToken],
    });

    if (results.rowCount === 0) {
      throw new NotFoundError({
        message:
          "O token de ativação utilizado não foi encontrado no sistema ou expirou.",
        action: "Faça um novo cadastro.",
      });
    }

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

async function markTokenAsUsed(activationTokenId) {
  const updatedToken = await runUpdateQuery(activationTokenId);

  return updatedToken;

  async function runUpdateQuery(activationTokenId) {
    const results = await database.query({
      text: `
      UPDATE
        user_activation_tokens
      SET
        used_at = timezone('utc', now()),
        updated_at = timezone('utc', now())
      WHERE
        id = $1
      RETURNING
        *
      `,
      values: [activationTokenId],
    });

    return results.rows[0];
  }
}

async function activateUserByUserId(userId) {
  const userToActivate = await user.findOneById(userId);

  if (!authorization.can(userToActivate, "read:activation_token")) {
    throw new ForbbidenError({
      message: "Você não pode mais utilizar tokens de ativação.",
      action: "Entre em contato com o suporte.",
    });
  }

  const activatedUser = await user.setFeatures(userId, ACTIVATED_USER_FEATURES);

  return activatedUser;
}

async function activateUserAndMarkTokenAsUsed(activationTokenId) {
  let client;
  let transactionStarted = false;

  try {
    client = await database.getNewClient();
    await client.query("BEGIN");
    transactionStarted = true;

    const activationToken = await findOneByTokenAndLock(
      client,
      activationTokenId,
    );

    if (activationToken.used_at) {
      await client.query("COMMIT");
      transactionStarted = false;
      return activationToken;
    }

    if (!activationToken.is_valid) {
      throwActivationTokenNotFoundOrExpired();
    }

    const userToActivate = await findUserByIdAndLock(
      client,
      activationToken.user_id,
    );

    if (!authorization.can(userToActivate, "read:activation_token")) {
      throw new ForbbidenError({
        message: "Você não pode mais utilizar tokens de ativação.",
        action: "Entre em contato com o suporte.",
      });
    }

    await client.query({
      text: `
        UPDATE
          users
        SET
          features = $2,
          updated_at = timezone('utc', now())
        WHERE
          id = $1
      `,
      values: [activationToken.user_id, ACTIVATED_USER_FEATURES],
    });

    const updatedTokenResult = await client.query({
      text: `
        UPDATE
          user_activation_tokens
        SET
          used_at = timezone('utc', now()),
          updated_at = timezone('utc', now())
        WHERE
          id = $1
        RETURNING
          *
      `,
      values: [activationToken.id],
    });

    await client.query("COMMIT");
    transactionStarted = false;

    return updatedTokenResult.rows[0];
  } catch (error) {
    if (client && transactionStarted) {
      try {
        await client.query("ROLLBACK");
      } catch {
        // Preserve the original transaction error.
      }
    }

    throw error;
  } finally {
    await client?.end();
  }

  async function findOneByTokenAndLock(client, activationTokenId) {
    const results = await client.query({
      text: `
        SELECT
          *,
          expires_at > NOW() AS is_valid
        FROM
          user_activation_tokens
        WHERE
          id = $1
        LIMIT
          1
        FOR UPDATE
      `,
      values: [activationTokenId],
    });

    if (results.rowCount === 0) {
      throwActivationTokenNotFoundOrExpired();
    }

    const { is_valid: isValid, ...activationToken } = results.rows[0];

    return { ...activationToken, is_valid: isValid };
  }

  async function findUserByIdAndLock(client, userId) {
    const results = await client.query({
      text: `
        SELECT
          *
        FROM
          users
        WHERE
          id = $1
        LIMIT
          1
        FOR UPDATE
      `,
      values: [userId],
    });

    if (results.rowCount === 0) {
      throw new NotFoundError({
        message: "O id informado não foi encontrado no sistema.",
        action: "Verifique se o id está digitado corretamente.",
      });
    }

    return results.rows[0];
  }
}

function throwActivationTokenNotFoundOrExpired() {
  throw new NotFoundError({
    message:
      "O token de ativação utilizado não foi encontrado no sistema ou expirou.",
    action: "Faça um novo cadastro.",
  });
}

const activation = {
  create,
  markTokenAsUsed,
  sendEmailToUser,
  findOneValidByToken,
  activateUserByUserId,
  activateUserAndMarkTokenAsUsed,
};

export default activation;
