"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

type Servidor = {
  id: number;
  nome_completo: string;
  matricula: string;
  status: string;
};

type Grade = {
  id: number;
  nome_completo: string;
  disciplina: string;
  dia_semana: string;
  hora_inicio: string;
  status: string;
};

type Registro = {
  id: number;
  nome_completo: string;
  data: string;
  entrada: string | null;
  saida: string | null;
  atraso_minutos: number;
  status: string;
};

type PainelDados = {
  servidores: Servidor[];
  grades: Grade[];
  registros: Registro[];
};

function dataHoje() {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Sao_Paulo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

function formatarData(data: string) {
  const [ano, mes, dia] = data.slice(0, 10).split("-");
  return `${dia}/${mes}/${ano}`;
}

async function buscarLista<T>(url: string): Promise<T[]> {
  const resposta = await fetch(url, { cache: "no-store" });
  const dados: unknown = await resposta.json();
  if (!resposta.ok) {
    const mensagem =
      typeof dados === "object" && dados !== null && "erro" in dados
        ? String(dados.erro)
        : "Não foi possível carregar os dados do painel.";
    throw new Error(mensagem);
  }
  if (!Array.isArray(dados)) {
    throw new Error("A API retornou um formato inesperado para o painel.");
  }
  return dados as T[];
}

export default function Sistema() {
  const router = useRouter();
  const [dados, setDados] = useState<PainelDados>({
    servidores: [],
    grades: [],
    registros: [],
  });
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");

  useEffect(() => {
    if (localStorage.getItem("cargoUsuario") !== "Gestor") {
      router.replace("/");
      return;
    }

    let ativo = true;

    async function carregarPainel() {
      setCarregando(true);
      setErro("");
      try {
        const [servidores, grades, registros] = await Promise.all([
          buscarLista<Servidor>("/api/servidores"),
          buscarLista<Grade>("/api/grades"),
          buscarLista<Registro>("/api/registros_ponto"),
        ]);
        if (ativo) setDados({ servidores, grades, registros });
      } catch (error) {
        if (ativo) {
          setErro(
            error instanceof Error
              ? error.message
              : "Não foi possível carregar o painel do gestor."
          );
        }
      } finally {
        if (ativo) setCarregando(false);
      }
    }

    carregarPainel();
    return () => {
      ativo = false;
    };
  }, [router]);

  const registrosRecentes = useMemo(
    () => dados.registros.slice(0, 8),
    [dados.registros]
  );
  const registrosHoje = useMemo(
    () => dados.registros.filter((registro) => registro.data.slice(0, 10) === dataHoje()).length,
    [dados.registros]
  );
  const servidoresAtivos = dados.servidores.filter(
    (servidor) => servidor.status.toLowerCase() === "ativo"
  ).length;
  const servidoresInativos = dados.servidores.length - servidoresAtivos;
  const aulasAtivas = dados.grades.filter(
    (grade) => grade.status.toLowerCase() === "ativo"
  ).length;

  function sair() {
    localStorage.removeItem("cargoUsuario");
    localStorage.removeItem("servidorId");
    router.replace("/");
  }

  return (
    <main className="gestorInicio">
      <header className="gestorInicioCabecalho">
        <div>
          <span>BATEPONTO</span>
          <h1>Área do gestor</h1>
          <p>Visão geral da frequência e dos funcionários.</p>
        </div>
        <button type="button" onClick={sair}>SAIR</button>
      </header>

      <div className="gestorPainelConteudo">
        {erro && <div className="gestorPainelErro" role="alert">{erro}</div>}

        <section className="gestorIndicadores" aria-label="Indicadores da instituição">
          <article>
            <span>FUNCIONÁRIOS</span>
            <strong>{carregando ? "..." : dados.servidores.length}</strong>
            <small>Cadastrados na instituição</small>
          </article>
          <article>
            <span>FUNCIONÁRIOS ATIVOS</span>
            <strong>{carregando ? "..." : servidoresAtivos}</strong>
            <small>{servidoresInativos} inativos</small>
          </article>
          <article>
            <span>AULAS NA GRADE</span>
            <strong>{carregando ? "..." : aulasAtivas}</strong>
            <small>Aulas ativas cadastradas</small>
          </article>
          <article>
            <span>PONTOS DE HOJE</span>
            <strong>{carregando ? "..." : registrosHoje}</strong>
            <small>Registros de frequência</small>
          </article>
        </section>

        <section className="gestorPainelGrid">
          <div className="gestorAtividade">
            <div className="gestorAtividadeCabecalho">
              <div>
                <h2>Registros de ponto recentes</h2>
                <p>Últimos registros de frequência cadastrados.</p>
              </div>
              <Link href="/pagina_gestao/acompanhamento">VER FOLHAS →</Link>
            </div>

            {carregando ? (
              <p className="gestorPainelVazio">Carregando registros...</p>
            ) : registrosRecentes.length ? (
              <div className="gestorTabelaRolagem">
                <table className="gestorTabelaAtividade">
                  <thead>
                    <tr>
                      <th>Funcionário</th>
                      <th>Data</th>
                      <th>Entrada</th>
                      <th>Saída</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {registrosRecentes.map((registro) => (
                      <tr key={registro.id}>
                        <td>{registro.nome_completo}</td>
                        <td>{formatarData(registro.data)}</td>
                        <td>{registro.entrada || "—"}</td>
                        <td>{registro.saida || "—"}</td>
                        <td>
                          <span className={`gestorStatusPonto ${registro.status === "Falta" ? "falta" : registro.status === "Atrasado" ? "atrasado" : "regular"}`}>
                            {registro.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="gestorPainelVazio">
                <strong>Nenhum registro de ponto encontrado</strong>
                <span>Os registros aparecerão aqui assim que forem lançados.</span>
              </div>
            )}
          </div>

          <Link className="gestorFolhaAtalho" href="/pagina_gestao/acompanhamento">
            <span aria-hidden="true">▤</span>
            <strong>Folha de Ponto</strong>
            <small>Consulte, filtre, imprima ou salve em PDF as folhas mensais dos funcionários.</small>
            <b>ABRIR FOLHAS →</b>
          </Link>
        </section>
      </div>
    </main>
  );
}
