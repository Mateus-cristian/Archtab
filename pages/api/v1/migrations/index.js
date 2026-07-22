import controller from "infra/controller";
import authorization from "models/authorization";
import migrator from "models/migrator";
import { createRouter } from "next-connect";

export default createRouter()
  .use(controller.injectAnonymousOrUser)
  .get(controller.canRequest("read:migration"), getHandler)
  .post(controller.canRequest("create:migration"), postHandler)
  .handler(controller.errorHandlers);

async function getHandler(request, response) {
  const userTryingToGet = request.context.user;
  const pendingMigrations = await migrator.listPendingMigrations();
  const securityOutputValues = authorization.filterOutput(
    userTryingToGet,
    "read:migration",
    pendingMigrations,
  );

  return response.status(200).json(securityOutputValues);
}

async function postHandler(request, response) {
  const userTryingToPost = request.context.user;
  const migratedMigrations = await migrator.runPendingMigrations();
  const statusCode = migratedMigrations.length > 0 ? 201 : 200;
  const securityOutputValues = authorization.filterOutput(
    userTryingToPost,
    "create:migration",
    migratedMigrations,
  );

  return response.status(statusCode).json(securityOutputValues);
}
