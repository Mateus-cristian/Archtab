import controller from "infra/controller";
import { ForbbidenError } from "infra/errors";
import authorization from "models/authorization";
import user from "models/user";
import { createRouter } from "next-connect";

export default createRouter()
  .use(controller.injectAnonymousOrUser)
  .get(getHandler)
  .patch(controller.canRequest("update:user"), patchHandler)
  .handler(controller.errorHandlers);

async function getHandler(request, response) {
  const userTryingToGet = request.context.user;
  const username = request.query.username;
  const userFound = await user.findOneByUsername(username);

  const securityOutputValues = authorization.filterOutput(
    userTryingToGet,
    "read:user",
    userFound,
  );

  return response.status(200).json(securityOutputValues);
}

async function patchHandler(request, response) {
  const username = request.query.username;
  const userInputValues = request.body;
  const resource = await user.findOneByUsername(username);
  const userTryingToPatch = request.context.user;

  if (!authorization.can(userTryingToPatch, "update:user", resource)) {
    throw new ForbbidenError({
      message: "Você não possui permissão para fazer update.",
      action: "Contate suporte se você acredita que é um erro.",
    });
  }

  const updatedUser = await user.update(username, userInputValues);
  const securityOutputValues = authorization.filterOutput(
    userTryingToPatch,
    "read:user",
    updatedUser,
  );

  return response.status(200).json(securityOutputValues);
}
