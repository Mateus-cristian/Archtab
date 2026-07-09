import controller from "infra/controller";
import { ForbbidenError } from "infra/errors";
import authorization from "models/authorization";
import user from "models/user";
import { createRouter } from "next-connect";

const router = createRouter();

router.use(controller.injectAnonymousOrUser);
router.get(getHandler);
router.patch(controller.canRequest("update:user"), patchHandler);

export default router.handler(controller.errorHandlers);

async function getHandler(request, response) {
  const username = request.query.username;
  const userFound = await user.findOneByUsername(username);
  response.status(200).json(userFound);
}

async function patchHandler(request, response) {
  const username = request.query.username;
  const userInputValues = request.body;
  const resource = await user.findOneByUsername(username);
  const authenticatedUser = request.context.user;

  if (!authorization.can(authenticatedUser, "update:user", resource)) {
    throw new ForbbidenError({
      message: "Você não possui permissão para fazer update.",
      action: "Contate suporte se você acredita que é um erro.",
    });
  }

  const updatedUser = await user.update(username, userInputValues);
  response.status(200).json(updatedUser);
}
