"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

type Servidor = {
  id: number;
  nome_completo: string;
  matricula: string;
  cargo: string;
  regime: string;
  status: string;
};

export default function PaginaGestao() {
  const router = useRouter();
  const [servidores, setServidores] = useState<Servidor[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");

  useEffect(() => {
    if (localStorage.getItem("cargoUsuario") !== "Gestor") {
      router.replace("/");
      return;
    }

    async function carregarServidores() {
      try {
        const resposta = await fetch("/api/servidores");
        const dados = await resposta.json();
        if (!resposta.ok) throw new Error(dados.erro || "Não foi possível carregar os servidores.");
        if (!Array.isArray(dados)) throw new Error("A resposta da API de servidores está em um formato inesperado.");
        setServidores(dados);
      } catch (erro) {
        setErro(erro instanceof Error ? erro.message : "Ocorreu um erro ao carregar o painel.");
      } finally {
        setCarregando(false);
      }
    }

    carregarServidores();
  }, [router]);

  const total = servidores.length;
  const ativos = useMemo(
    () => servidores.filter((servidor) => (servidor.status || "").toLowerCase() === "ativo").length,
    [servidores]
  );
  const inativos = total - ativos;
  const porStatus = useMemo(() => Object.entries(
    servidores.reduce<Record<string, number>>((resultado, servidor) => {
      const status = servidor.status || "Sem status";
      resultado[status] = (resultado[status] || 0) + 1;
      return resultado;
    }, {})
  ).sort((a, b) => b[1] - a[1]), [servidores]);

  return (
    <main className="gestaoPagina">
      <div className="gestaoConteudo">
        <div className="gestaoBreadcrumb">Gestão <span>/</span> <b>Painel</b></div>
        <div className="gestaoTitulo">
          <div>
            <span className="gestaoIdentificacao">VISÃO INSTITUCIONAL</span>
            <h1>Painel de Gestão</h1>
            <p>Acompanhe os indicadores gerais e a situação dos servidores.</p>
          </div>
        </div>

        {erro && <div className="gestaoErro">⚠ {erro}</div>}

        <section className="gestaoIndicadores">
          <article>
            <span>TOTAL DE SERVIDORES</span>
            <strong>{carregando ? "..." : total}</strong>
            <small>Registros cadastrados</small>
          </article>
          <article>
            <span>SERVIDORES ATIVOS</span>
            <strong>{carregando ? "..." : ativos}</strong>
            <small>Com vínculo ativo</small>
          </article>
          <article className="gestaoIndicadorAlerta">
            <span>SERVIDORES INATIVOS</span>
            <strong>{carregando ? "..." : inativos}</strong>
            <small>Com outro status</small>
          </article>
        </section>

        <section className="gestaoPainelGrid">
          <div className="gestaoCard">
            <div className="gestaoCardTitulo">
              <div><span>QUADRO DE PESSOAL</span><h2>Situação dos servidores</h2></div>
              <span className="gestaoCardIcone">▤</span>
            </div>
            {carregando ? <p className="gestaoMensagem">Carregando informações...</p> :
              porStatus.length === 0 ? <p className="gestaoMensagem">Ainda não há servidores cadastrados.</p> :
              porStatus.map(([status, quantidade]) => {
                const percentual = total ? (quantidade / total) * 100 : 0;
                return (
                  <div className="gestaoStatusItem" key={status}>
                    <div><span>{status}</span><strong>{quantidade}</strong></div>
                    <div className="gestaoBarra"><i style={{ width: `${percentual}%` }} /></div>
                  </div>
                );
              })}
          </div>

          <div className="gestaoCard">
            <div className="gestaoCardTitulo">
              <div><span>ACOMPANHAMENTO</span><h2>Controle de frequência</h2></div>
              <span className="gestaoCardIcone">◷</span>
            </div>
            <p className="gestaoMensagem">A área de acompanhamento permitirá consultar as informações de frequência e as folhas de ponto dos servidores.</p>
            <Link className="gestaoLinkCard" href="/pagina_gestao/acompanhamento">Acessar acompanhamento <span>→</span></Link>
          </div>

          <div className="gestaoCard gestaoAcoes">
            <div className="gestaoCardTitulo">
              <div><span>ACESSO RÁPIDO</span><h2>Atalhos de gestão</h2></div>
            </div>
            <Link href="/pagina_gestao/servidores">Consultar servidores <span>→</span></Link>
            <Link href="/pagina_gestao/acompanhamento">Acompanhar registros de ponto <span>→</span></Link>
            <Link href="/pagina_gestao/relatorios">Consultar relatórios <span>→</span></Link>
          </div>
        </section>

        <div className="gestaoAviso">
          <strong>Área de Gestão</strong>
          <p>Este painel apresenta os dados gerais disponíveis no cadastro de servidores. Os módulos de acompanhamento e relatórios serão conectados às respectivas funcionalidades nas próximas etapas.</p>
        </div>
      </div>
    </main>
  );
}
