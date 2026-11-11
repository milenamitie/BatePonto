
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import GestaoNav from "@/app/components/GestaoNav";

type Solicitacao = {
  id: number;
  tipo: string;
  data: string | Date;
  motivo: string;
  status: string;
  nome_completo: string;
};

type Painel = {
  indicadores: {
    totalServidores: number;
    servidoresAtivos: number;
    servidoresInativos: number;
    aprovacoesPendentes: number;
  };
  solicitacoesRecentes: Solicitacao[];
};

export default function PaginaGestao() {
  const router = useRouter();
  const [painel, setPainel] = useState<Painel | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");
  const [menuAberto, setMenuAberto] = useState(false);
  const [saindo, setSaindo] = useState(false);

  useEffect(() => {
    async function carregarPainel() {
      try {
        const sessaoResposta = await fetch("/api/sessao", {
          cache: "no-store"
        });

        if (!sessaoResposta.ok) {
          router.replace("/");
          return;
        }

        const sessao = await sessaoResposta.json();

        if (!sessao.autenticado || sessao.usuario?.cargo !== "Gestor") {
          router.replace("/");
          return;
        }

        const resposta = await fetch("/api/gestao/painel", {
          cache: "no-store"
        });

        const dados = await resposta.json();

        if (!resposta.ok) {
          throw new Error(dados.mensagem || "Não foi possível carregar o painel.");
        }

        setPainel(dados);
      } catch (error) {
        setErro(
          error instanceof Error
            ? error.message
            : "Ocorreu um erro ao carregar o painel."
        );
      } finally {
        setCarregando(false);
      }
    }

    carregarPainel();
  }, [router]);

  async function sair() {
    setSaindo(true);

    try {
      await fetch("/api/sessao", { method: "DELETE" });
    } finally {
      localStorage.removeItem("cargoUsuario");
      localStorage.removeItem("servidorId");
      router.replace("/");
    }
  }

  function formatarData(data: string | Date) {
    const valor = typeof data === "string" ? data.slice(0, 10) : data;
    const partes = String(valor).split("T")[0].split("-");

    if (partes.length !== 3) return String(data);

    return `${partes[2]}/${partes[1]}/${partes[0]}`;
  }

  function iniciais(nome: string) {
    return nome
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((parte) => parte[0])
      .join("")
      .toUpperCase();
  }

  const indicadores = painel?.indicadores;

  return (
    <main className="gestaoPagina">
      <GestaoNav />

      <div className="gestaoBreadcrumb">
        Gestão <span>/</span> Diretoria Acadêmica <span>/</span> <b>Painel</b>
      </div>

      <div className="gestaoConteudo">
        {erro && <div className="gestaoErro">⚠ {erro}</div>}

        <section className="gestaoIndicadores">
          <article>
            <span>SERVIDORES CADASTRADOS</span>
            <strong>{carregando ? "..." : indicadores?.totalServidores ?? 0}</strong>
            <small>Registros na instituição</small>
          </article>

          <article className="gestaoIndicadorAlerta">
            <span>APROVAÇÕES PENDENTES</span>
            <strong>{carregando ? "..." : indicadores?.aprovacoesPendentes ?? 0}</strong>
            <small>Aguardam sua análise</small>
          </article>

          <article>
            <span>SERVIDORES ATIVOS</span>
            <strong>{carregando ? "..." : indicadores?.servidoresAtivos ?? 0}</strong>
            <small>Com vínculo ativo</small>
          </article>

          <article>
            <span>SERVIDORES INATIVOS</span>
            <strong>{carregando ? "..." : indicadores?.servidoresInativos ?? 0}</strong>
            <small>Com outro status</small>
          </article>
        </section>

        <section className="gestaoPainelGrid">
          <div className="gestaoCard gestaoSolicitacoes">
            <div className="gestaoCardCabecalho">
              <h2>Últimas solicitações</h2>
              <Link href="/pagina_gestao/aprovacoes">VER TODAS →</Link>
            </div>

            {carregando ? (
              <p className="gestaoMensagem">Carregando solicitações...</p>
            ) : painel?.solicitacoesRecentes.length ? (
              <div className="gestaoListaSolicitacoes">
                {painel.solicitacoesRecentes.map((solicitacao) => (
                  <div className="gestaoSolicitacao" key={solicitacao.id}>
                    <div className="gestaoIniciais">
                      {iniciais(solicitacao.nome_completo)}
                    </div>
                    <div className="gestaoSolicitacaoInfo">
                      <strong>{solicitacao.nome_completo}</strong>
                      <span>
                        {solicitacao.tipo} · {formatarData(solicitacao.data)}
                      </span>
                    </div>
                    <span className={`gestaoStatus gestaoStatus${solicitacao.status}`}>
                      {solicitacao.status}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="gestaoVazio">
                <strong>Nenhuma solicitação encontrada</strong>
                <span>As novas solicitações dos professores aparecerão aqui.</span>
              </div>
            )}
          </div>

        </section>
      </div>
    </main>
  );
}
