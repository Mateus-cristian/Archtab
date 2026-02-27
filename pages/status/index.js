import useSWR from "swr";

async function fetchAPI(key) {
  const response = await fetch(key);
  const responseBody = await response.json();
  return responseBody;
}

export default function StatusPage() {
  const { data, isLoading } = useSWR("/api/v1/status", fetchAPI);

  if (isLoading && !data) return "...Carregando";

  return (
    <>
      <h1>Status</h1>
      <UpdatedAt updatedAt={data.updated_at} />
      <DatabaseStatus database={data.dependencies.database} />
    </>
  );
}

function UpdatedAt({ updatedAt }) {
  const updatedAtText = new Date(updatedAt).toLocaleString();

  return <div>Última atualização: {updatedAtText}</div>;
}

function DatabaseStatus({ database }) {
  return (
    <>
      <h2>Database</h2>
      <div style={{ display: "flex", flexDirection: "column" }}>
        <span>Versão: {database.version}</span>
        <span>Conexões abertas: {database.open_connections}</span>
        <span>Conexões máximas: {database.max_connections}</span>
      </div>
    </>
  );
}
