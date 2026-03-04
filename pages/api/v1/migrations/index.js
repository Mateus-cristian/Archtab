import controller from "infra/controller";
import database from "infra/database.js";
import { createRouter } from "next-connect";
import migrationRunner from "node-pg-migrate";
import { resolve } from "node:path";

const router = createRouter();

router.get(getHandler);
router.post(postHandler);

export default router.handler(controller.errorHandlers);

async function getHandler(request, response) {
  const pendingMigrations = await runMigrations({ dryRun: true });
  response.status(200).json(pendingMigrations);
}

async function postHandler(request, response) {
  const migratedMigrations = await runMigrations({ dryRun: false });
  const statusCode = migratedMigrations.length > 0 ? 201 : 200;
  response.status(statusCode).json(migratedMigrations);
}

async function runMigrations({ dryRun }) {
  return withDatabaseClient(async (dbClient) => {
    const migrationOptions = {
      databaseUrl: dbClient,
      dryRun,
      dir: resolve("infra", "migrations"),
      direction: "up",
      migrationsTable: "pgmigrations",
      verbose: process.env.NODE_ENV !== "production",
    };

    return migrationRunner(migrationOptions);
  });
}

async function withDatabaseClient(work) {
  const dbClient = await database.getNewClient();

  try {
    return await work(dbClient);
  } finally {
    await dbClient.end();
  }
}
