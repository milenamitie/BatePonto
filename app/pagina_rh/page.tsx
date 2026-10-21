"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type Servidor = {
  id: number;
  nome_completo: string;
  cpf: string;
  matricula: string;
  cargo: string;
  materia: string | null;
  regime: string;
  data_admissao: string;
  email_institucional: string;
  status: string;
};

export default function SistemaRH() {
  const router = useRouter();
  const [servidores, setServidores] = useState<Servidor[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");

  useEffect(() => {
    const cargoUsuario = localStorage.getItem("cargoUsuario");

    if (cargoUsuario !== "RH") {
      router.replace("/");
      return;
    }

    async function carregar() {
      try {
        const resposta = await fetch("/api/servidores");
        const dados = await resposta.json();

        if (!resposta.ok) {
          throw new Error(dados.erro || "Erro ao carregar painel.");
        }

        setServidores(dados);
      } catch (erro) {
        setErro(
          erro instanceof Error
            ? erro.message
            : "Erro ao carregar painel."
        );
      } finally {
        setCarregando(false);
      }
    }

    carregar();
  }, [router]);

  const sair = () => {
    localStorage.removeItem("cargoUsuario");
    router.replace("/");
  };

  const total = servidores.length;

  const ativos = servidores.filter(
    (servidor) => servidor.status.toLowerCase() === "ativo"
  ).length;

  const inativos = total - ativos;

  const statusContagem = servidores.reduce<Record<string, number>>(
    (resultado, servidor) => {
      const status = servidor.status || "Sem status";

      resultado[status] = (resultado[status] || 0) + 1;

      return resultado;
    },
    {}
  );

  const statusLista = Object.entries(statusContagem).sort(
    ([, quantidadeA], [, quantidadeB]) => quantidadeB - quantidadeA
  );

  return (
    <main className="rhPagina">
      <header className="rhCabecalho">
        <div className="rhMarca">
          <div className="rhLogo">BP</div>
          <strong>BatePonto</strong>
          <span>•</span>
          <b>RECURSOS HUMANOS</b>
        </div>

        <div className="rhUsuario">
          <strong>Recursos Humanos</strong>
          <small>Gestão de Pessoas</small>
          <button onClick={sair}>SAIR</button>
        </div>
      </header>

      <nav className="rhNav">
        <Link href="/pagina_rh">
          Painel
        </Link>
        <Link href="/pagina_rh/funcionarios">
          Funcionários
        </Link>
        <Link href="/pagina_rh/grades">
          Grades
        </Link>
        <Link href="/pagina_rh/regras_ponto">
          Regras de Ponto
        </Link>
        <span>Fechamento Mensal</span>
        <span>Relatórios</span>
        <span>Gerar PDF</span>
      </nav>

      <div className="rhConteudo">
        <div className="breadcrumb">
          RH &nbsp;/&nbsp; Gestão de Pessoas &nbsp;/&nbsp; <b>Painel</b>
        </div>

        <h1>Painel</h1>

        {erro && <div className="erroRh">⚠ {erro}</div>}

        <section className="cardsRh">
          <div>
            <span>TOTAL DE SERVIDORES</span>
            <strong>
              {carregando ? "..." : total}
            </strong>
          </div>

          <div>
            <span>SERVIDORES ATIVOS</span>
            <strong>
              {carregando ? "..." : ativos}
            </strong>
          </div>

          <div className="alerta">
            <span>SERVIDORES INATIVOS</span>
            <strong>
              {carregando ? "..." : inativos}
            </strong>
          </div>

          <div>
            <span>CADASTROS NO SISTEMA</span>
            <strong>
              {carregando ? "..." : total}
            </strong>
          </div>
        </section>

        <section className="rhPainelGrid">
          <div className="rhBox">
            <h2>Status dos servidores</h2>

            {carregando ? (
              <p>Carregando...</p>
            ) : statusLista.length === 0 ? (
              <p>Nenhum servidor cadastrado.</p>
            ) : (
              statusLista.map(([status, quantidade]) => {
                const percentual =
                  total > 0 ? (quantidade / total) * 100 : 0;

                return (
                  <div className="statusItem" key={status}>
                    <p>
                      <span>{status}</span>
                      <b>{quantidade}</b>
                    </p>

                    <div className="barra">
                      <i
                        style={{
                          width: `${percentual}%`
                        }}
                      />
                    </div>
                  </div>
                );
              })
            )}
          </div>

          <div className="rhBox">
            <h2>Fechamento mensal</h2>

            <div className="painelVazio">
              <strong>Fechamento mensal</strong>
              <p>
                Os dados de fechamento aparecerão aqui quando
                o módulo de fechamento for configurado.
              </p>
            </div>
          </div>

          <div className="rhBox">
            <h2>Ações rápidas</h2>

            <Link href="/pagina_rh/funcionarios">
              ＋ &nbsp; Cadastrar servidor
              <span>→</span>
            </Link>

            <a href="#">
              ⚙ &nbsp; Configurar regras de ponto
              <span>→</span>
            </a>

            <a href="#">
              🔒 &nbsp; Fechar folhas pendentes
              <span>→</span>
            </a>

            <a href="#">
              📊 &nbsp; Gerar relatório diretoria
              <span>→</span>
            </a>
          </div>
        </section>
      </div>
    </main>
  );
}