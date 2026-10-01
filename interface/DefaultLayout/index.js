import { PageLayout, Header, Text } from "@primer/react";
import Head from "next/head";
import styles from "./index.module.css";

const contentWidthClasses = {
  small: styles.smallContent,
};

export default function DefaultLayout({
  children,
  metadata = {},
  contentWitdh,
}) {
  const extraContentClassName = contentWidthClasses[contentWitdh];

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

        <PageLayout.Content
          className={extraContentClassName}
          padding="normal"
          width={contentWitdh}
        >
          {children}
        </PageLayout.Content>
        <PageLayout.Footer divider="line" padding="normal">
          <Text size="small">© {new Date().getFullYear()} Archtab</Text>
        </PageLayout.Footer>
      </PageLayout>
    </>
  );
}
