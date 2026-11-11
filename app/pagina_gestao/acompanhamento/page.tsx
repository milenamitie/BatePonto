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
  materia: string | null;
};

type Registro = {
  id: number;
  servidor_id: number;
  nome_completo: string;
  matricula: string;
  data: string;
  entrada: string | null;
  saida: string | null;
  horario_previsto: string | null;
  atraso_minutos: number;
  status: string;
};

type FolhaResposta = {
  servidores: Servidor[];
  registros: Registro[];
};

function mesAtual() {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Sao_Paulo",
    year: "numeric",
    month: "2-digit",
  }).format(new Date());
}

function formatarData(data: string) {
  const [ano, mes, dia] = data.slice(0, 10).split("-");
  return `${dia}/${mes}/${ano}`;
}

function formatarMes(mes: string) {
  const [ano, numeroMes] = mes.split("-").map(Number);
  return new Date(ano, numeroMes - 1, 1).toLocaleDateString("pt-BR", {
    month: "long",
    year: "numeric",
  });
}

function formatarDuracao(minutos: number) {
  const horas = Math.floor(minutos / 60);
  const restantes = minutos % 60;
  return `${horas}h${String(restantes).padStart(2, "0")}m`;
}

function minutosTrabalhados(registro: Registro) {
  if (!registro.entrada || !registro.saida) return 0;
  const [horaEntrada, minutoEntrada] = registro.entrada.split(":").map(Number);
  const [horaSaida, minutoSaida] = registro.saida.split(":").map(Number);

  return Math.max(
    0,
    horaSaida * 60 + minutoSaida - (horaEntrada * 60 + minutoEntrada)
  );
}

function statusRegistro(registro: Registro) {
  if (registro.status === "Falta") return "Falta";
  if (registro.status === "Atrasado") return "Atrasado";
  if (registro.status === "Sem grade") return "Sem grade";
  if (registro.entrada && !registro.saida) return "Em andamento";
  if (registro.entrada && registro.saida) return "Regular";
  return registro.status || "Sem registro";
}

export default function FolhaPontoGestor() {
  const router = useRouter();
  const [servidores, setServidores] = useState<Servidor[]>([]);
  const [registros, setRegistros] = useState<Registro[]>([]);
  const [servidorSelecionado, setServidorSelecionado] = useState("todos");
  const [mes, setMes] = useState(mesAtual);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");

  useEffect(() => {
    if (localStorage.getItem("cargoUsuario") !== "Gestor") {
      router.replace("/");
    }
  }, [router]);

  useEffect(() => {
    const controlador = new AbortController();

    async function carregar() {
      setCarregando(true);
      setErro("");

      try {
        const parametros = new URLSearchParams({ mes });
        if (servidorSelecionado !== "todos") {
          parametros.set("servidor_id", servidorSelecionado);
        }

        const resposta = await fetch(
          `/api/gestao/folha-ponto?${parametros.toString()}`,
          { cache: "no-store", signal: controlador.signal }
        );
        const dados = await resposta.json();
        if (!resposta.ok) {
          throw new Error(
            dados.mensagem || "Não foi possível carregar as folhas de ponto."
          );
        }

        const resultado = dados as FolhaResposta;
        setServidores(resultado.servidores);
        setRegistros(resultado.registros);
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") {
          return;
        }

        setErro(
          error instanceof Error
            ? error.message
            : "Erro ao carregar as folhas de ponto."
        );
      } finally {
        if (!controlador.signal.aborted) setCarregando(false);
      }
    }

    carregar();
    return () => controlador.abort();
  }, [mes, servidorSelecionado]);

  const servidoresExibidos = useMemo(
    () =>
      servidorSelecionado === "todos"
        ? servidores
        : servidores.filter(
            (servidor) => servidor.id === Number(servidorSelecionado)
          ),
    [servidores, servidorSelecionado]
  );

  const registrosPorServidor = useMemo(() => {
    const agrupados = new Map<number, Registro[]>();
    for (const registro of registros) {
      const lista = agrupados.get(registro.servidor_id) || [];
      lista.push(registro);
      agrupados.set(registro.servidor_id, lista);
    }
    return agrupados;
  }, [registros]);

  function sair() {
    localStorage.removeItem("cargoUsuario");
    router.replace("/");
  }

  return (
    <main className="gestorFolhaPagina">
      <div className="gestorFolhaControles">
        <header className="gestorInicioCabecalho">
          <div>
            <Link href="/pagina_gestao">BATEPONTO · GESTOR</Link>
            <h1>Folha de Ponto</h1>
            <p>Consulte e gere a folha mensal dos funcionários.</p>
          </div>
          <button type="button" onClick={sair}>SAIR</button>
        </header>

        <section className="gestorFolhaFiltros" aria-label="Filtros da folha">
          <label>
            Funcionário
            <select
              value={servidorSelecionado}
              onChange={(evento) => setServidorSelecionado(evento.target.value)}
            >
              <option value="todos">Todos os funcionários</option>
              {servidores.map((servidor) => (
                <option key={servidor.id} value={servidor.id}>
                  {servidor.nome_completo} — {servidor.matricula}
                </option>
              ))}
            </select>
          </label>
          <label>
            Mês de referência
            <input
              type="month"
              value={mes}
              onChange={(evento) => setMes(evento.target.value)}
            />
          </label>
          <button
            type="button"
            className="gestorFolhaImprimir"
            onClick={() => window.print()}
            disabled={carregando || registros.length === 0}
          >
            Imprimir / Salvar em PDF
          </button>
        </section>
        {erro && <p className="gestorFolhaErro" role="alert">{erro}</p>}
      </div>

      <section className="gestorFolhaRelatorio">
        {carregando ? (
          <p className="gestorFolhaMensagem">Carregando folhas de ponto...</p>
        ) : servidoresExibidos.length === 0 ? (
          <p className="gestorFolhaMensagem">Nenhum funcionário encontrado.</p>
        ) : (
          servidoresExibidos.map((servidor) => {
            const registrosServidor =
              registrosPorServidor.get(servidor.id) || [];
            const minutos = registrosServidor.reduce(
              (total, registro) => total + minutosTrabalhados(registro),
              0
            );
            const faltas = registrosServidor.filter(
              (registro) => registro.status === "Falta"
            ).length;
            const atrasos = registrosServidor.filter(
              (registro) => registro.atraso_minutos > 0
            ).length;

            return (
              <article className="gestorFolhaServidor" key={servidor.id}>
                <header className="gestorFolhaServidorCabecalho">
                  <div>
                    <span>FOLHA DE PONTO · {formatarMes(mes)}</span>
                    <h2>{servidor.nome_completo}</h2>
                    <p>
                      Matrícula: {servidor.matricula} · {servidor.cargo}
                      {servidor.materia ? ` · ${servidor.materia}` : ""}
                    </p>
                  </div>
                  <div className="gestorFolhaResumo">
                    <span>Horas registradas</span>
                    <strong>{formatarDuracao(minutos)}</strong>
                    <small>
                      {registrosServidor.length} registros · {faltas} faltas ·{" "}
                      {atrasos} atrasos
                    </small>
                  </div>
                </header>

                {registrosServidor.length === 0 ? (
                  <p className="gestorFolhaMensagem">
                    Nenhum registro de ponto neste mês.
                  </p>
                ) : (
                  <div className="gestorFolhaTabelaRolagem">
                    <table className="gestorFolhaTabela">
                      <thead>
                        <tr>
                          <th>Data</th>
                          <th>Entrada prevista</th>
                          <th>Entrada</th>
                          <th>Saída</th>
                          <th>Horas</th>
                          <th>Atraso</th>
                          <th>Situação</th>
                        </tr>
                      </thead>
                      <tbody>
                        {registrosServidor.map((registro) => (
                          <tr key={registro.id}>
                            <td>{formatarData(registro.data)}</td>
                            <td>{registro.horario_previsto || "—"}</td>
                            <td>{registro.entrada || "—"}</td>
                            <td>{registro.saida || "—"}</td>
                            <td>{formatarDuracao(minutosTrabalhados(registro))}</td>
                            <td>
                              {registro.atraso_minutos > 0
                                ? `${registro.atraso_minutos} min`
                                : "—"}
                            </td>
                            <td>{statusRegistro(registro)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </article>
            );
          })
        )}
      </section>
    </main>
  );
}
