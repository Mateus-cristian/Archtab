import controller from "infra/controller";
import activation from "models/activation";
import authorization from "models/authorization";
import { createRouter } from "next-connect";

export default createRouter()
  .use(controller.injectAnonymousOrUser)
  .patch(controller.canRequest("read:activation_token"), patchHandler)
  .handler(controller.errorHandlers);

async function patchHandler(request, response) {
  const activationTokenId = request.query.token_id;
  const userTryingToPatch = request.context.user;

  const validActivationToken =
    await activation.findOneValidByToken(activationTokenId);

  await activation.activateUserByUserId(validActivationToken.user_id);

  const usedActivationToken = await activation.markTokenAsUsed(
    validActivationToken.id,
  );

  const securityOutputValues = authorization.filterOutput(
    userTryingToPatch,
    "read:activation_token",
    usedActivationToken,
  );

  return response.status(200).json(securityOutputValues);
}
