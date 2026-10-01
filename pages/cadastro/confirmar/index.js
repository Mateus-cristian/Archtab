import { Banner } from "@primer/react";
import DefaultLayout from "interface/DefaultLayout";

export default function ConfirmRegisterPage() {
  return (
    <DefaultLayout
      contentWitdh="small"
      metadata={{
        description: "Confirme seu email.",
      }}
    >
      <Banner
        variant="warning"
        title="Falta só uma etapa!"
        description="Abra o email enviado pelo Archtab e clique no link"
      ></Banner>
    </DefaultLayout>
  );
}
