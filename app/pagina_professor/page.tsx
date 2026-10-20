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
  horario_previsto: string | null;
  atraso_minutos: number;
  status: string;
};

export default function PaginaProfessor() {
  const [servidorId, setServidorId] = useState<number | null>(null);
  const [servidor, setServidor] = useState<Servidor | null>(null);
  const [registros, setRegistros] = useState<Registro[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [registrando, setRegistrando] = useState(false);
  const [mensagem, setMensagem] = useState("");
  const router = useRouter();

  const hoje = new Date();
  const dataHoje = hoje.toISOString().split("T")[0];

  const mesAno = hoje.toLocaleDateString("pt-BR", {
    month: "long",
    year: "numeric",
  });

  async function carregarDados(id: number) {
    try {
      const [servidoresResposta, registrosResposta] = await Promise.all([
        fetch("/api/servidores"),
        fetch(`/api/registros_ponto?servidor_id=${id}`),
      ]);

      const servidores = await servidoresResposta.json();
      const registrosDados = await registrosResposta.json();

      const servidorAtual = servidores.find(
        (item: Servidor) => item.id === id
      );

      setServidor(servidorAtual || null);
      setRegistros(registrosDados);
    } catch {
      setMensagem("Erro ao carregar os dados.");
    } finally {
      setCarregando(false);
    }
  }

  useEffect(() => {
    const idSalvo = localStorage.getItem("servidorId");

    if (!idSalvo) {
      router.replace("/");
      return;
    }

    const id = Number(idSalvo);

    if (!id) {
      localStorage.removeItem("servidorId");
      router.replace("/");
      return;
    }

    setServidorId(id);
    carregarDados(id);
  }, [router]);

  const registroHoje = useMemo(() => {
    return registros.find((registro) => registro.data === dataHoje) || null;
  }, [registros, dataHoje]);

  function formatarData(data: string) {
    const partes = data.split("-");
    return `${partes[2]}/${partes[1]}`;
  }

  function diaSemana(data: string) {
    const [ano, mes, dia] = data.split("-").map(Number);
    const dataLocal = new Date(ano, mes - 1, dia);

    return dataLocal
      .toLocaleDateString("pt-BR", { weekday: "short" })
      .replace(".", "");
  }

  function calcularTotal(
    entrada: string | null,
    saida: string | null
  ) {
    if (!entrada || !saida) return "—";

    const [entradaHora, entradaMinuto] = entrada.split(":").map(Number);
    const [saidaHora, saidaMinuto] = saida.split(":").map(Number);

    const inicio = entradaHora * 60 + entradaMinuto;
    const fim = saidaHora * 60 + saidaMinuto;
    const total = fim - inicio;

    if (total <= 0) return "—";

    const horas = Math.floor(total / 60);
    const minutos = total % 60;

    return `${String(horas).padStart(2, "0")}h${String(minutos).padStart(
      2,
      "0"
    )}m`;
  }

  async function registrarPonto(acao: "entrada" | "saida") {
    if (!servidorId) {
      setMensagem("Professor não identificado.");
      return;
    }

    setRegistrando(true);
    setMensagem("");

    try {
      const resposta = await fetch("/api/registros_ponto", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          servidor_id: servidorId,
          acao: acao,
        }),
      });

      const dados = await resposta.json();

      if (!resposta.ok) {
        setMensagem(dados.erro || "Erro ao registrar ponto.");
        return;
      }

      setMensagem(dados.mensagem);

      const registrosResposta = await fetch(
        `/api/registros_ponto?servidor_id=${servidorId}`
      );

      const registrosDados = await registrosResposta.json();

      setRegistros(registrosDados);
    } catch {
      setMensagem("Erro ao registrar ponto.");
    } finally {
      setRegistrando(false);
    }
  }

  function statusRegistro(registro: Registro) {
    if (registro.status === "Atrasado") {
      return "Atrasado";
    }

    if (registro.status === "Sem grade") {
      return "Sem grade";
    }

    if (registro.entrada && registro.saida) {
      return "Regular";
    }

    if (registro.entrada && !registro.saida) {
      return "Hoje";
    }

    return "Ausência";
  }

  if (carregando) {
    return <div className="folhaCarregando">Carregando...</div>;
  }

  return (
    <main className="folhaPagina">
      <header className="folhaHeader">
        <div className="folhaLogoArea">
          <div className="folhaLogo">BP</div>
          <strong>BatePonto</strong>
        </div>

        <nav className="folhaNav">
          <a className="ativo" href="/pagina_professor">
            Folha de Ponto
          </a>
          <a href="/pagina_professor/historico">
            Histórico
          </a>
          <a href="#">Justificativas & Compensações</a>
          <a href="#">Notificações</a>
          <a href="#">Gerar PDF</a>
        </nav>

        <div className="folhaUsuario">
          <div className="folhaAvatar">PF</div>

          <div>
            <strong>{servidor?.nome_completo || "Professor"}</strong>
            <span>Professor</span>
          </div>

          <button
            onClick={() => {
              localStorage.removeItem("servidorId");
              router.push("/");
            }}
          >
            SAIR
          </button>
        </div>
      </header>

      <div className="folhaBreadcrumb">
        <span>Sistema</span>
        <span>/</span>
        <span>Folha de Ponto</span>
        <span>/</span>
        <strong>Registro Mensal</strong>
      </div>

      <section className="folhaConteudo">
        <div className="folhaTituloArea">
          <div>
            <h1>Registro Mensal</h1>

            <p>
              {servidor?.nome_completo || "Professor"} · Mat.{" "}
              {servidor?.matricula || "—"}
            </p>
          </div>

          <div className="folhaAcoes">
            <select defaultValue={mesAno}>
              <option value={mesAno}>{mesAno}</option>
            </select>

            <button>GERAR PDF</button>
          </div>
        </div>

        <section className="folhaPontoDia">
          <div className="folhaPontoInfo">
            <span className="folhaPontoLabel">PONTO DO DIA</span>

            <h2>
              {hoje.toLocaleDateString("pt-BR", {
                day: "2-digit",
                month: "2-digit",
              })}
              {" · "}
              {hoje.toLocaleDateString("pt-BR", {
                weekday: "long",
              })}
            </h2>

            {registroHoje ? (
              <p>
                Entrada: <strong>{registroHoje.entrada || "--:--"}</strong>
                {"   "}
                Saída: <strong>{registroHoje.saida || "--:--"}</strong>
              </p>
            ) : (
              <p>Nenhum ponto registrado hoje</p>
            )}
          </div>

          <div className="folhaPontoBotoes">
            <button
              className={
                registroHoje?.entrada
                  ? "folhaBotaoRegistrado"
                  : "folhaBotaoEntrada"
              }
              disabled={!!registroHoje?.entrada || registrando}
              onClick={() => registrarPonto("entrada")}
            >
              {registroHoje?.entrada
                ? "ENTRADA REGISTRADA"
                : "REGISTRAR ENTRADA"}
            </button>

            <button
              className={
                registroHoje?.saida
                  ? "folhaBotaoRegistrado"
                  : "folhaBotaoSaida"
              }
              disabled={
                !registroHoje?.entrada ||
                !!registroHoje?.saida ||
                registrando
              }
              onClick={() => registrarPonto("saida")}
            >
              {registroHoje?.saida
                ? "SAÍDA REGISTRADA"
                : "REGISTRAR SAÍDA"}
            </button>
          </div>

          {mensagem && (
            <div className="folhaPontoMensagem">
              <strong>✓</strong>

              <div>
                <b>{mensagem}</b>
                <span>📍 Localização não autorizada</span>
              </div>
            </div>
          )}
        </section>

        <section className="servidorResumo">
          <div>
            <span>SERVIDOR</span>
            <strong>{servidor?.nome_completo || "—"}</strong>
          </div>

          <div>
            <span>MATRÍCULA</span>
            <strong>{servidor?.matricula || "—"}</strong>
          </div>

          <div>
            <span>LOTAÇÃO</span>
            <strong>Dep. Ciências Exatas</strong>
          </div>

          <div>
            <span>REGIME</span>
            <strong>{servidor?.regime || "—"} semanais</strong>
          </div>

          <div>
            <span>COMPETÊNCIA</span>
            <strong>{mesAno}</strong>
          </div>
        </section>

        <section className="tabelaPonto">
          <div className="tabelaCabecalho">
            <span>DATA</span>
            <span>PREVISTO</span>
            <span>ENTRADA</span>
            <span>SAÍDA</span>
            <span>TOTAL</span>
            <span>STATUS</span>
          </div>

          {registros.length === 0 ? (
            <div className="tabelaVazia">
              Nenhum registro encontrado.
            </div>
          ) : (
            registros.map((registro) => {
              const status = statusRegistro(registro);
              const ehHoje = registro.data === dataHoje;

              return (
                <div
                  className={`tabelaLinha ${ehHoje ? "linhaHoje" : ""} ${status === "Ausência" ? "linhaAusencia" : ""
                    }`}
                  key={registro.id}
                >
                  <div className="celulaData">
                    <strong>{formatarData(registro.data)}</strong>
                    <span>{diaSemana(registro.data)}</span>
                    {ehHoje && <small>HOJE</small>}
                  </div>

                  <div>{registro.horario_previsto || "—"}</div>

                  <div>
                    {registro.entrada || "—"}
                    {registro.atraso_minutos > 0 && (
                      <small className="atrasoPonto">
                        +{registro.atraso_minutos} min
                      </small>
                    )}
                  </div>

                  <div>{registro.saida || "—"}</div>

                  <div className="totalPonto">
                    {calcularTotal(
                      registro.entrada,
                      registro.saida
                    )}
                  </div>

                  <div>
                    <span
                      className={`statusPonto status${status.replace(
                        " ",
                        ""
                      )}`}
                    >
                      <i></i>
                      {status.toUpperCase()}
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </section>
      </section>
    </main>
  );
}