import { PageLayout, Header, Text } from "@primer/react";
import Head from "next/head";
export default function DefaultLayout({ children, metadata = {} }) {
  return (
    <>
      <Head>
        <title>
          {metadata.title ? `${metadata.title} · Archtab` : "Archtab"}
        </title>

        {metadata.description && (
          <meta name="description" value={metadata.description} />
        )}
      </Head>

      <PageLayout padding="none">
        <PageLayout.Header>
          <Header>
            <Header.Item full>
              <Header.Link href="/">Archtab</Header.Link>
            </Header.Item>
            <Header.Item>
              <Header.Link href="/login">Login</Header.Link>
            </Header.Item>
            <Header.Item>
              <Header.Link href="/cadastro">Cadastrar</Header.Link>
            </Header.Item>
          </Header>
        </PageLayout.Header>

        <PageLayout.Content padding="normal">{children}</PageLayout.Content>
        <PageLayout.Footer divider="line" padding="normal">
          <Text size="small">© {new Date().getFullYear()} Archtab</Text>
        </PageLayout.Footer>
      </PageLayout>
    </>
  );
}
