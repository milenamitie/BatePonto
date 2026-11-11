"use client";

import { useEffect, useState } from "react";
import type { ChangeEvent, FormEvent } from "react";
import { useRouter } from "next/navigation";
import ProfessorNav from "@/app/components/ProfessorNav";

type Solicitacao = {
  id: number;
  tipo: "Justificativa" | "Compensação";
  data: string;
  motivo: string;
  observacoes: string | null;
  horario_compensacao: string | null;
  horas: string | null;
  anexos: string[] | null;
  status: "Pendente" | "Aprovado" | "Reprovado";
  criada_em: string;
};

type Servidor = {
  id: number;
  nome_completo: string;
};

function formatarData(data: string) {
  if (!data) return "";
  const [ano, mes, dia] = data.slice(0, 10).split("-");
  return `${dia}/${mes}/${ano}`;
}

function formatarDataHora(data: string) {
  if (!data) return "";
  const [dia, hora] = data.split(" ");
  return `${formatarData(dia)} ${hora?.slice(0, 5) || ""}`.trim();
}

export default function JustificativasProfessor() {
  const [nomeProfessor, setNomeProfessor] = useState("Professor");
  const [tipo, setTipo] = useState<"Justificativa" | "Compensação">("Justificativa");
  const [data, setData] = useState("");
  const [motivo, setMotivo] = useState("");
  const [observacoes, setObservacoes] = useState("");
  const [horarioCompensacao, setHorarioCompensacao] = useState("");
  const [horas, setHoras] = useState("");
  const [arquivos, setArquivos] = useState<File[]>([]);
  const [solicitacoes, setSolicitacoes] = useState<Solicitacao[]>([]);
  const [mensagem, setMensagem] = useState("");
  const [sucesso, setSucesso] = useState(false);
  const [carregando, setCarregando] = useState(true);
  const [enviando, setEnviando] = useState(false);
  const router = useRouter();

  async function carregarSolicitacoes() {
    const resposta = await fetch("/api/solicitacoes", { cache: "no-store" });

    if (resposta.status === 401 || resposta.status === 403) {
      router.replace("/");
      return;
    }

    const dados = await resposta.json();

    if (!resposta.ok) {
      throw new Error(dados.mensagem || "Não foi possível carregar as solicitações.");
    }

    setSolicitacoes(
      dados.map((item: Solicitacao) => ({
        ...item,
        anexos: Array.isArray(item.anexos) ? item.anexos : [],
      }))
    );
  }

  useEffect(() => {
    async function iniciar() {
      try {
        const respostaSessao = await fetch("/api/sessao", { cache: "no-store" });

        if (!respostaSessao.ok) {
          router.replace("/");
          return;
        }

        const dadosSessao = await respostaSessao.json();

        if (dadosSessao.usuario?.cargo !== "Professor" || !dadosSessao.usuario?.servidorId) {
          router.replace("/");
          return;
        }

        const respostaServidores = await fetch("/api/servidores", { cache: "no-store" });

        if (respostaServidores.ok) {
          const servidores: Servidor[] = await respostaServidores.json();
          const atual = servidores.find((servidor) => servidor.id === dadosSessao.usuario.servidorId);
          if (atual) setNomeProfessor(atual.nome_completo);
        }

        await carregarSolicitacoes();
      } catch (erro) {
        setMensagem(erro instanceof Error ? erro.message : "Erro ao carregar as solicitações.");
      } finally {
        setCarregando(false);
      }
    }

    iniciar();
  }, [router]);

  function selecionarArquivos(evento: ChangeEvent<HTMLInputElement>) {
    const selecionados = Array.from(evento.target.files || []);
    setArquivos(selecionados);
  }

  async function enviarSolicitacao(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    setMensagem("");

    if (tipo === "Compensação" && (!horas || !horarioCompensacao || !observacoes.trim())) {
      setMensagem("Preencha o horário, a quantidade de horas e o motivo da compensação.");
      return;
    }

    setEnviando(true);

    try {
      const resposta = await fetch("/api/solicitacoes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tipo,
          data,
          motivo,
          observacoes,
          horarioCompensacao: tipo === "Compensação" ? horarioCompensacao : null,
          horas: tipo === "Compensação" ? horas : null,
          anexos: arquivos.map((arquivo) => arquivo.name),
        }),
      });

      const resultado = await resposta.json();

      if (!resposta.ok) {
        throw new Error(resultado.mensagem || "Não foi possível enviar a solicitação.");
      }

      await carregarSolicitacoes();
      setSucesso(true);
      setData("");
      setMotivo("");
      setObservacoes("");
      setHorarioCompensacao("");
      setHoras("");
      setArquivos([]);
      const campoArquivo = document.getElementById("anexosSolicitacao") as HTMLInputElement | null;
      if (campoArquivo) campoArquivo.value = "";
    } catch (erro) {
      setMensagem(erro instanceof Error ? erro.message : "Erro ao enviar a solicitação.");
    } finally {
      setEnviando(false);
    }
  }

  function novaSolicitacao() {
    setSucesso(false);
    setMensagem("");
  }

  return (
    <main className="folhaPagina">
      <ProfessorNav paginaAtiva="justificativas" nomeProfessor={nomeProfessor} />

      <div className="folhaBreadcrumb">
        <span>Sistema</span>
        <span>/</span>
        <span>Dep. Ciências Exatas</span>
        <span>/</span>
        <strong>Justificativas</strong>
      </div>

      <section className="justPagina">
        <div className="justCabecalhoPagina">
          <h1>Justificativas &amp; Compensações</h1>
          <p>Solicite eletronicamente — seu gestor será notificado por e-mail</p>
        </div>

        <div className="justColunas">
          <section className="justPainel justPainelFormulario">
            <div className="justPainelTopo">
              <h2>Nova Solicitação</h2>
              <span className="justDecoracao" />
            </div>

            {sucesso ? (
              <div className="justSucesso">
                <div className="justSucessoIcone">✓</div>
                <h3>Solicitação enviada</h3>
                <p>Seu gestor recebeu sua solicitação e poderá analisá-la em breve.</p>
                <button type="button" onClick={novaSolicitacao}>NOVA SOLICITAÇÃO</button>
              </div>
            ) : (
              <form className="justFormulario" onSubmit={enviarSolicitacao}>
                <div className="justCampo">
                  <span className="justLabel">TIPO</span>
                  <div className="justTipos">
                    <button type="button" className={tipo === "Justificativa" ? "selecionado" : ""} onClick={() => { setTipo("Justificativa"); setMotivo(""); setObservacoes(""); }}>
                      Justificativa
                    </button>
                    <button type="button" className={tipo === "Compensação" ? "selecionado" : ""} onClick={() => { setTipo("Compensação"); setMotivo(""); setObservacoes(""); }}>
                      Compensação
                    </button>
                  </div>
                </div>

                {tipo === "Justificativa" ? (
                  <>
                    <label className="justCampo">
                      <span className="justLabel">DATA DA OCORRÊNCIA</span>
                      <input type="date" value={data} onChange={(evento) => setData(evento.target.value)} required />
                    </label>
                    <label className="justCampo">
                      <span className="justLabel">MOTIVO</span>
                      <input type="text" value={motivo} onChange={(evento) => setMotivo(evento.target.value)} placeholder="Ex: Consulta médica" required />
                    </label>
                    <label className="justCampo">
                      <span className="justLabel">OBSERVAÇÕES</span>
                      <textarea value={observacoes} onChange={(evento) => setObservacoes(evento.target.value)} placeholder="Detalhes adicionais (opcional)..." rows={2} />
                    </label>
                  </>
                ) : (
                  <>
                    <label className="justCampo">
                      <span className="justLabel">TIPO DE SOLICITAÇÃO</span>
                      <select value={motivo} onChange={(evento) => setMotivo(evento.target.value)} required>
                        <option value="">Selecione o tipo</option>
                        <option value="Horas excedentes">Horas excedentes</option>
                        <option value="Reposição de aula">Reposição de aula</option>
                        <option value="Atividade institucional">Atividade institucional</option>
                        <option value="Outro">Outro</option>
                      </select>
                    </label>
                    <label className="justCampo">
                      <span className="justLabel">DATA DE COMPENSAÇÃO</span>
                      <input type="date" value={data} onChange={(evento) => setData(evento.target.value)} required />
                    </label>
                    <label className="justCampo">
                      <span className="justLabel">HORÁRIO DA COMPENSAÇÃO</span>
                      <input type="text" placeholder="Ex: 08:00 — 09:30" value={horarioCompensacao} onChange={(evento) => setHorarioCompensacao(evento.target.value)} required />
                    </label>
                    <label className="justCampo">
                      <span className="justLabel">QUANTIDADE DE HORAS</span>
                      <input type="text" placeholder="Ex: 1h30m" value={horas} onChange={(evento) => setHoras(evento.target.value)} required />
                    </label>
                    <label className="justCampo">
                      <span className="justLabel">MOTIVO</span>
                      <textarea value={observacoes} onChange={(evento) => setObservacoes(evento.target.value)} placeholder="Descreva o motivo da solicitação" rows={3} required />
                    </label>
                  </>
                )}

                <label className="justCampo justAnexos">
                  <span className="justLabel">ANEXAR ARQUIVOS</span>
                  <span className="justUpload">
                    <strong>＋</strong>
                    <b>Clique para selecionar</b>
                    <small>PDF, JPG, PNG, DOC — máx. 10 MB por arquivo</small>
                    <input id="anexosSolicitacao" type="file" multiple accept=".pdf,.png,.jpg,.jpeg,.doc,.docx" onChange={selecionarArquivos} />
                  </span>
                  {arquivos.length > 0 && (
                    <div className="justArquivos">
                      <strong>{arquivos.length} {arquivos.length === 1 ? "arquivo anexado" : "arquivos anexados"}:</strong>
                      {arquivos.map((arquivo, indice) => (
                        <span key={`${arquivo.name}-${indice}`}>✓ {arquivo.name}</span>
                      ))}
                    </div>
                  )}
                </label>

                {tipo === "Compensação" && <p className="justAvisoCompensacao">Compensações debitam do banco de horas ou precisam de acordo com o gestor para reposição futura.</p>}
                {mensagem && <div className="justErro">{mensagem}</div>}
                <button className="justEnviar" type="submit" disabled={enviando}>{enviando ? "ENVIANDO..." : "ENVIAR SOLICITAÇÃO"}</button>
              </form>
            )}
          </section>

          <section className="justPainel justPainelHistorico">
            <div className="justPainelTopo">
              <h2>Solicitações Anteriores</h2>
            </div>

            {carregando ? (
              <div className="justVazio"><strong>Carregando solicitações...</strong></div>
            ) : solicitacoes.length === 0 ? (
              <div className="justVazio">
                <strong>Nenhuma solicitação por enquanto</strong>
                <p>Suas solicitações aparecerão aqui após o envio.</p>
              </div>
            ) : (
              <div className="justLista">
                {solicitacoes.map((solicitacao) => (
                  <article className="justItem" key={solicitacao.id}>
                    <div className="justItemPrincipal">
                      <div>
                        <h3>{solicitacao.motivo}</h3>
                        <p>{formatarData(solicitacao.data)}</p>
                      </div>
                      <span className={`justStatus justStatus${solicitacao.status}`}>{solicitacao.status}</span>
                    </div>
                    <div className="justItemRodape">
                      <span className={solicitacao.tipo === "Compensação" ? "justTagCompensacao" : "justTagJustificativa"}>{solicitacao.tipo.toUpperCase()}</span>
                      <small>Enviada em {formatarDataHora(solicitacao.criada_em)}</small>
                    </div>
                    {solicitacao.horario_compensacao && <p className="justItemDetalhe">Horário da compensação: {solicitacao.horario_compensacao}</p>}
                    {solicitacao.observacoes && <p className="justItemDetalhe">Motivo/observações: {solicitacao.observacoes}</p>}
                    {solicitacao.horas && <p className="justItemDetalhe">Horas solicitadas: {solicitacao.horas}</p>}
                    {!!solicitacao.anexos?.length && <p className="justItemDetalhe">Anexos: {solicitacao.anexos.join(", ")}</p>}
                  </article>
                ))}
              </div>
            )}

            <div className="justHistoricoRodape">
              <span>{solicitacoes.length} solicitações no período</span>
            </div>
          </section>
        </div>
      </section>
    </main>
  );
}
