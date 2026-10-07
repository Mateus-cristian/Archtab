import { Banner } from "@primer/react";
import DefaultLayout from "interface/DefaultLayout";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";

export default function ActiveRegisterPage() {
  const router = useRouter();
  const activationTokenId = router.query.activationTokenId;
  const [activationStatus, setActivationStatus] = useState("loading");

  useEffect(() => {
    if (!router.isReady || !activationTokenId) {
      return;
    }

    let isActive = true;
    sendActivationRequest();

    async function sendActivationRequest() {
      try {
        const response = await fetch(
          `/api/v1/activations/${activationTokenId}`,
          {
            method: "PATCH",
            signal: AbortSignal.timeout(30000),
          },
        );

        if (!response.ok) {
          throw new Error("Não foi possível ativar o cadastro.");
        }

        if (isActive) {
          setActivationStatus("success");
        }
      } catch {
        if (isActive) {
          setActivationStatus("error");
        }
      }
    }

    return () => {
      isActive = false;
    };
  }, [activationTokenId, router.isReady]);

  const bannerByStatus = {
    loading: {
      variant: "warning",
      title: "Ativando seu cadastro...",
      description: "Aguarde enquanto confirmamos seu email.",
    },
    success: {
      variant: "success",
      title: "Cadastro ativado!",
      description: "Sua conta está pronta. Agora você já pode ",
    },
    error: {
      variant: "critical",
      title: "Não foi possível ativar o cadastro",
      description:
        "houve uma falha de conexão com o servidor. Tente novamente mais tarde.",
    },
  };
  const banner = bannerByStatus[activationStatus];

  return (
    <DefaultLayout
      contentWitdh="small"
      metadata={{
        title: "Ativar cadastro",
        description: "Ativar cadastro.",
      }}
    >
      <Banner variant={banner.variant}>
        <Banner.Title>{banner.title}</Banner.Title>
        <Banner.Description>
          <span>{banner.description}</span>
          {activationStatus === "success" && (
            <a href="/login">realizar o login.</a>
          )}
        </Banner.Description>
      </Banner>
    </DefaultLayout>
  );
}
