import DefaultLayout from "interface/DefaultLayout";
import useSWR from "swr";
import { Banner, Heading, Stack } from "@primer/react";
import { Card } from "@primer/react/experimental";

async function fetchAPI(key) {
  const response = await fetch(key);
  const responseBody = await response.json();
  return responseBody;
}

const Loading = () => <span>...Carregando</span>;

export default function StatusPage() {
  const { data, isLoading } = useSWR("/api/v1/status", fetchAPI);

  if (isLoading || !data) {
    return <Loading />;
  }

  return (
    <>
      <DefaultLayout
        contentWitdh="medium"
        metadata={{
          title: "Status",
        }}
      >
        <Stack gap="spaciuos">
          <Heading as="h1">Status</Heading>
          <UpdatedAt updatedAt={data.updated_at} />
          <h2>Database</h2>
          <DatabaseStatus database={data.dependencies.database} />
        </Stack>
      </DefaultLayout>
    </>
  );
}

function UpdatedAt({ updatedAt }) {
  const updatedAtText = new Date(updatedAt).toLocaleString();

  return (
    <Banner>
      <Banner.Title layout="compact">
        Última atualização: {updatedAtText}
      </Banner.Title>
    </Banner>
  );
}

const CardInfo = ({ title, description, metadata }) => {
  return (
    <Card>
      <Card.Heading>{title}</Card.Heading>
      <Card.Description>{description}</Card.Description>
      <Card.Metadata>{metadata}</Card.Metadata>
    </Card>
  );
};

function DatabaseStatus({ database }) {
  const { version, open_connections, max_connections } = database;

  return (
    <Stack gap="cozy" direction={{ narow: "vertical", regular: "horizontal" }}>
      {open_connections && (
        <Stack.Item grow>
          <CardInfo
            title="Conexões abertas"
            description={open_connections}
            metadata="Uso nesse instante"
          />
        </Stack.Item>
      )}
      {max_connections && (
        <Stack.Item grow>
          <CardInfo
            title="Conexões Máximas"
            description={max_connections}
            metadata="Coneções disponíveis"
          />
        </Stack.Item>
      )}
      {version && (
        <Stack.Item grow>
          <CardInfo
            title="PostgresSQL"
            description={version}
            metadata="Versão em execução"
          />
        </Stack.Item>
      )}
    </Stack>
  );
}
