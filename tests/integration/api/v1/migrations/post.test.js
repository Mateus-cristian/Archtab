import database from "infra/database.js";

beforeAll(cleanDatabase);

async function cleanDatabase() {
  await database.query("DROP schema public CASCADE; CREATE schema public;");
}

test("POST to /api/v1/migrations should return 200", async () => {
  const response = await fetch("http://localhost:3000/api/v1/migrations", {
    method: "POST",
  });

  expect(response.status).toBe(201);

  const responseBody = await response.json();

  const migrationsExecuted = await database.query(
    "SELECT COUNT(*) as value FROM public.pgmigrations",
  );

  const migrationsExecutedValue = parseInt(migrationsExecuted.rows[0].value);

  expect(migrationsExecutedValue).toBe(responseBody.length);
  expect(Array.isArray(responseBody)).toBe(true);
});
