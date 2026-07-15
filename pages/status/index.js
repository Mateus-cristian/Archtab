import useSWR from "swr";

async function fetchAPI(key) {
  const response = await fetch(key);
  const responseBody = await response.json();
  return responseBody;
}

const Loading = () => <span>...Carregando</span>;

export default function StatusPage() {
  const { data, isLoading } = useSWR("/api/v1/status", fetchAPI);

  return (
    <>
      <h1>Status</h1>
      {isLoading ? <Loading /> : <UpdatedAt updatedAt={data.updated_at} />}
      <h2>Database</h2>
      {isLoading ? (
        <Loading />
      ) : (
        <DatabaseStatus database={data.dependencies.database} />
      )}
    </>
  );
}

function UpdatedAt({ updatedAt }) {
  const updatedAtText = new Date(updatedAt).toLocaleString();

  return <div>Última atualização: {updatedAtText}</div>;
}

function DatabaseStatus({ database }) {
  return (
    <div style={{ display: "flex", flexDirection: "column" }}>
      {database.version && <span>Versão: {database.version}</span>}
      <span>Conexões abertas: {database.open_connections}</span>
      <span>Conexões máximas: {database.max_connections}</span>
    </div>
  );
}
