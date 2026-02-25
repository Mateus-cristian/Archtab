/* eslint-env node, es2021 */
const { spawn } = require("node:child_process");

const npmCommand = process.platform === "win32" ? "npm.cmd" : "npm";
let nextProcess = null;
let shuttingDown = false;

async function runNpm(args) {
  return new Promise((resolve, reject) => {
    const childProcess = spawn(npmCommand, args, { stdio: "inherit" });

    childProcess.on("error", reject);
    childProcess.on("exit", (code, signal) => {
      if (code === 0) {
        resolve();
        return;
      }

      reject(
        new Error(
          `Falha ao executar "${npmCommand} ${args.join(" ")}" (code=${code}, signal=${signal})`,
        ),
      );
    });
  });
}

async function stopServices() {
  try {
    await runNpm(["run", "services:stop"]);
  } catch (error) {
    console.error("[dev] Erro ao parar serviços:", error.message);
  }
}

async function ensureServicesStopped() {
  try {
    await runNpm(["run", "services:stop"]);
  } catch (error) {
    console.error("[dev] Erro ao limpar serviços no inicio:", error.message);
  }
}

async function shutdown(reason, exitCode = 0) {
  if (shuttingDown) {
    return;
  }

  shuttingDown = true;
  console.log(`\n[dev] Encerrando (${reason})...`);

  if (nextProcess && nextProcess.exitCode === null) {
    nextProcess.kill("SIGINT");

    await new Promise((resolve) => {
      const timeout = setTimeout(resolve, 3000);
      nextProcess.once("exit", () => {
        clearTimeout(timeout);
        resolve();
      });
    });
  }

  await stopServices();
  process.exit(exitCode);
}

function startNextDev() {
  nextProcess = spawn(npmCommand, ["run", "dev:next"], { stdio: "inherit" });
  nextProcess.on("error", async (error) => {
    console.error("[dev] Erro ao iniciar next dev:", error.message);
    await shutdown("erro no processo next dev", 1);
  });

  nextProcess.on("exit", async (code, signal) => {
    const reason = signal ? `sinal ${signal}` : "next dev finalizado";
    await shutdown(reason, code || 0);
  });
}

async function main() {
  process.on("SIGINT", () => shutdown("SIGINT (Ctrl+C)", 130));
  process.on("SIGTERM", () => shutdown("SIGTERM", 143));
  process.on("uncaughtException", async (error) => {
    console.error("[dev] Excecao nao tratada:", error);
    await shutdown("uncaughtException", 1);
  });
  process.on("unhandledRejection", async (reason) => {
    console.error("[dev] Promise rejeitada sem tratamento:", reason);
    await shutdown("unhandledRejection", 1);
  });

  try {
    await ensureServicesStopped();
    await runNpm(["run", "services:up"]);
    await runNpm(["run", "services:wait:database"]);
    await runNpm(["run", "migrations:up"]);
    startNextDev();
  } catch (error) {
    console.error("[dev] Falha durante inicializacao:", error.message);
    await stopServices();
    process.exit(1);
  }
}

main();
