"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

type Servidor = {
  id: number;
  nome_completo: string;
  matricula: string;
  cargo: string;
  regime: string;
  email_institucional: string;
};

type Registro = {
  id: number;
  servidor_id: number;
  nome_completo: string;
  data: string;
  entrada: string | null;
  saida: string | null;
  status: string;
  horario_previsto?: string | null;
  atraso_minutos?: number;
};

type MesHistorico = {
  chave: string;
  nome: string;
  ano: number;
  mes: number;
  registros: Registro[];
  dias: number;
  minutos: number;
  pendencias: number;
};

const nomesMeses = [
  "Janeiro",
  "Fevereiro",
  "Março",
  "Abril",
  "Maio",
  "Junho",
  "Julho",
  "Agosto",
  "Setembro",
  "Outubro",
  "Novembro",
  "Dezembro",
];

export default function HistoricoProfessor() {
  const router = useRouter();

  const [servidorId, setServidorId] = useState<number | null>(null);
  const [servidor, setServidor] = useState<Servidor | null>(null);
  const [registros, setRegistros] = useState<Registro[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [busca, setBusca] = useState("");
  const [mesesAbertos, setMesesAbertos] = useState<string[]>([]);

  useEffect(() => {
    const idSalvo = localStorage.getItem("servidorId");

    if (!idSalvo) {
      router.push("/");
      return;
    }

    const id = Number(idSalvo);

    if (!id) {
      router.push("/");
      return;
    }

    setServidorId(id);
  }, [router]);

  useEffect(() => {
    if (!servidorId) return;

    async function carregarDados() {
      try {
        const [servidoresResposta, registrosResposta] = await Promise.all([
          fetch("/api/servidores"),
          fetch(`/api/registros_ponto?servidor_id=${servidorId}`),
        ]);

        const servidores = await servidoresResposta.json();
        const registrosDados = await registrosResposta.json();

        const servidorAtual = servidores.find(
          (item: Servidor) => item.id === servidorId
        );

        setServidor(servidorAtual || null);
        setRegistros(Array.isArray(registrosDados) ? registrosDados : []);
      } catch {
        setServidor(null);
        setRegistros([]);
      } finally {
        setCarregando(false);
      }
    }

    carregarDados();
  }, [servidorId]);

  const meses = useMemo(() => {
    const grupos = new Map<string, Registro[]>();

    registros.forEach((registro) => {
      const chave = registro.data.slice(0, 7);

      if (!grupos.has(chave)) {
        grupos.set(chave, []);
      }

      grupos.get(chave)!.push(registro);
    });

    const resultado: MesHistorico[] = Array.from(grupos.entries())
      .map(([chave, registrosDoMes]) => {
        const [ano, mes] = chave.split("-").map(Number);

        const minutos = registrosDoMes.reduce((total, registro) => {
          return total + calcularMinutos(registro.entrada, registro.saida);
        }, 0);

        const pendencias = registrosDoMes.filter(
          (registro) =>
            registro.status === "Atrasado" ||
            registro.status === "Sem grade" ||
            !registro.entrada ||
            !registro.saida
        ).length;

        return {
          chave,
          nome: nomesMeses[mes - 1],
          ano,
          mes,
          registros: registrosDoMes.sort((a, b) =>
            b.data.localeCompare(a.data)
          ),
          dias: registrosDoMes.length,
          minutos,
          pendencias,
        };
      })
      .sort((a, b) => b.chave.localeCompare(a.chave));

    return resultado;
  }, [registros]);

  const mesesFiltrados = useMemo(() => {
    const termo = busca.trim().toLowerCase();

    if (!termo) return meses;

    return meses.filter((mes) => {
      const texto = `${mes.nome} ${mes.ano}`.toLowerCase();
      return texto.includes(termo);
    });
  }, [meses, busca]);

function alternarMes(chave: string) {
  setMesesAbertos((atuais) =>
    atuais.includes(chave)
      ? atuais.filter((item) => item !== chave)
      : [...atuais, chave]
  );
}

function fecharTodos() {
  setMesesAbertos([]);
}

  function calcularMinutos(
    entrada: string | null,
    saida: string | null
  ) {
    if (!entrada || !saida) return 0;

    const [horaEntrada, minutoEntrada] = entrada
      .split(":")
      .map(Number);

    const [horaSaida, minutoSaida] = saida
      .split(":")
      .map(Number);

    const inicio = horaEntrada * 60 + minutoEntrada;
    const fim = horaSaida * 60 + minutoSaida;

    if (fim <= inicio) return 0;

    return fim - inicio;
  }

  function formatarHoras(minutos: number) {
    const horas = Math.floor(minutos / 60);
    const restante = minutos % 60;

    return `${String(horas).padStart(2, "0")}h${String(restante).padStart(
      2,
      "0"
    )}m`;
  }

  function formatarData(data: string) {
    const [ano, mes, dia] = data.split("-");
    return `${dia}/${mes}`;
  }

  function diaSemana(data: string) {
    const [ano, mes, dia] = data.split("-").map(Number);
    const dataLocal = new Date(ano, mes - 1, dia);

    return dataLocal
      .toLocaleDateString("pt-BR", {
        weekday: "short",
      })
      .replace(".", "");
  }

  function statusRegistro(registro: Registro) {
    if (registro.status === "Atrasado") {
      return "Divergente";
    }

    if (registro.status === "Sem grade") {
      return "Sem grade";
    }

    if (!registro.entrada || !registro.saida) {
      return "Pendente";
    }

    return "Regular";
  }

  function iniciais(nome: string) {
    const partes = nome.trim().split(/\s+/);

    if (partes.length === 1) {
      return partes[0].slice(0, 2).toUpperCase();
    }

    return `${partes[0][0]}${
      partes[partes.length - 1][0]
    }`.toUpperCase();
  }

  function sair() {
    localStorage.removeItem("servidorId");
    router.push("/");
  }

  function exportarHistorico() {
    if (registros.length === 0) return;

    const linhas = [
      [
        "Data",
        "Entrada",
        "Saída",
        "Total",
        "Status",
      ],
      ...registros
        .slice()
        .sort((a, b) => a.data.localeCompare(b.data))
        .map((registro) => [
          registro.data,
          registro.entrada || "",
          registro.saida || "",
          formatarHoras(
            calcularMinutos(registro.entrada, registro.saida)
          ),
          statusRegistro(registro),
        ]),
    ];

    const csv = linhas
      .map((linha) =>
        linha
          .map((valor) => `"${String(valor).replace(/"/g, '""')}"`)
          .join(";")
      )
      .join("\n");

    const blob = new Blob(["\ufeff" + csv], {
      type: "text/csv;charset=utf-8;",
    });

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = "historico-ponto.csv";
    link.click();

    URL.revokeObjectURL(url);
  }

  if (carregando) {
    return <div className="historicoCarregando">Carregando...</div>;
  }

  return (
    <main className="historicoPagina">
      <header className="folhaHeader">
        <div className="folhaLogoArea">
          <div className="folhaLogo">BP</div>
          <strong>BatePonto</strong>
        </div>

        <nav className="folhaNav">
          <a href="/pagina_professor">
            Folha de Ponto
          </a>

          <a className="ativo" href="/pagina_professor/historico">
            Histórico
          </a>

          <a href="#">
            Justificativas
          </a>

          <a href="#">
            Notificações
          </a>

          <a href="#">
            Gerar PDF
          </a>
        </nav>

        <div className="folhaUsuario">
          <div className="folhaAvatar">
            {iniciais(servidor?.nome_completo || "Professor")}
          </div>

          <div>
            <strong>
              {servidor?.nome_completo || "Professor"}
            </strong>
            <span>Professor</span>
          </div>

          <button onClick={sair}>SAIR</button>
        </div>
      </header>

      <div className="folhaBreadcrumb">
        <span>Sistema</span>
        <span>/</span>
        <span>Dep. Ciências Exatas</span>
        <span>/</span>
        <strong>Histórico</strong>
      </div>

      <section className="historicoConteudo">
        <div className="historicoTitulo">
          <div>
            <h1>Histórico de Frequência</h1>
            <p>Consulta de competências anteriores</p>
          </div>

          <button
            className="botaoExportarHistorico"
            onClick={exportarHistorico}
            disabled={registros.length === 0}
          >
            EXPORTAR HISTÓRICO
          </button>
        </div>

        <div className="historicoBusca">
          <input
            type="text"
            placeholder="Buscar por mês..."
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
          />
        </div>

        <div className="historicoAno">
          {mesesFiltrados.length > 0
            ? Array.from(
                new Set(mesesFiltrados.map((mes) => mes.ano))
              ).join(" • ")
            : new Date().getFullYear()}
        </div>

        <div className="historicoLista">
          {mesesFiltrados.length === 0 ? (
            <div className="historicoVazio">
              Nenhum histórico encontrado.
            </div>
          ) : (
            mesesFiltrados.map((mes) => {
              const aberto = mesesAbertos.includes(mes.chave);
              const registrosExibidos = mes.registros.slice(0, 5);

              return (
                <article
                  className={`historicoMes ${
                    aberto ? "historicoMesAberto" : ""
                  }`}
                  key={mes.chave}
                >
                  <button
                    className="historicoMesCabecalho"
                    onClick={() => alternarMes(mes.chave)}
                  >
                    <div className="historicoMesNome">
                      <strong>
                        {mes.nome} {mes.ano}
                      </strong>
                      <span>
                        {String(mes.mes).padStart(2, "0")}/{mes.ano}
                      </span>
                    </div>

                    <div className="historicoMesNumero">
                      <span>DIAS</span>
                      <strong>{mes.dias}</strong>
                    </div>

                    <div className="historicoMesNumero">
                      <span>HORAS</span>
                      <strong>{formatarHoras(mes.minutos)}</strong>
                    </div>

                    <div className="historicoMesStatus">
                      {mes.pendencias > 0 ? (
                        <span className="historicoPendencia">
                          {mes.pendencias}{" "}
                          {mes.pendencias === 1
                            ? "pendência"
                            : "pendências"}
                        </span>
                      ) : (
                        <span className="historicoRegular">
                          Regular
                        </span>
                      )}
                    </div>

                    <span className="historicoFechado">
                      FECHADO
                    </span>

                    <span
                      className={`historicoSeta ${
                        aberto ? "aberta" : ""
                      }`}
                    >
                      ▼
                    </span>
                  </button>

                  {aberto && (
                    <div className="historicoDetalhes">
                      <div className="historicoDetalhesTitulo">
                        REGISTROS DO PERÍODO
                      </div>

                      <div className="historicoTabelaCabecalho">
                        <span>DATA</span>
                        <span>ENTRADA</span>
                        <span>SAÍDA</span>
                        <span>TOTAL</span>
                        <span>STATUS</span>
                      </div>

                      {registrosExibidos.map((registro) => {
                        const status = statusRegistro(registro);

                        return (
                          <div
                            className="historicoTabelaLinha"
                            key={registro.id}
                          >
                            <div className="historicoData">
                              <strong>
                                {formatarData(registro.data)}
                              </strong>
                              <span>
                                {diaSemana(registro.data)}
                              </span>
                            </div>

                            <div>
                              {registro.entrada || "—"}
                            </div>

                            <div>
                              {registro.saida || "—"}
                            </div>

                            <strong className="historicoTotal">
                              {formatarHoras(
                                calcularMinutos(
                                  registro.entrada,
                                  registro.saida
                                )
                              )}
                            </strong>

                            <span
                              className={`historicoStatus historicoStatus${status.replace(
                                " ",
                                ""
                              )}`}
                            >
                              {status}
                            </span>
                          </div>
                        );
                      })}

                      <div className="historicoRodape">
                        <span>
                          Exibindo {registrosExibidos.length} de{" "}
                          {mes.registros.length} registros
                        </span>

                        {mes.registros.length > 5 && (
                          <button
                            onClick={() =>
                              alternarMes(mes.chave)
                            }
                          >
                            VER FOLHA COMPLETA →
                          </button>
                        )}
                      </div>
                    </div>
                  )}
                </article>
              );
            })
          )}
        </div>
      </section>
    </main>
  );
}