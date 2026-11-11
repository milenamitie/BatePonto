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
  observacoes: string;
  horarioCompensacao?: string;
  horas: string;
  anexos: string[];
  status: "Pendente" | "Aprovado" | "Reprovado";
  enviadaEm: string;
};

type Servidor = {
  id: number;
  nome_completo: string;
};

const chaveSolicitacoes = (id: number) => `solicitacoesProfessor_${id}`;

export default function JustificativasProfessor() {
  const [servidorId, setServidorId] = useState<number | null>(null);
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
  const router = useRouter();

  useEffect(() => {
    const idSalvo = localStorage.getItem("servidorId");
    if (!idSalvo || !Number(idSalvo)) {
      router.replace("/");
      return;
    }

    const id = Number(idSalvo);
    setServidorId(id);

    const salvas = localStorage.getItem(chaveSolicitacoes(id));
    if (salvas) {
      try {
        setSolicitacoes(JSON.parse(salvas));
      } catch {
        setSolicitacoes([]);
      }
    }

    fetch("/api/servidores")
      .then((resposta) => resposta.json())
      .then((servidores: Servidor[]) => {
        const atual = servidores.find((servidor) => servidor.id === id);
        if (atual) setNomeProfessor(atual.nome_completo);
      })
      .catch(() => setNomeProfessor("Professor"));
  }, [router]);

  function selecionarArquivos(evento: ChangeEvent<HTMLInputElement>) {
    const selecionados = Array.from(evento.target.files || []);
    setArquivos(selecionados);
  }

  function enviarSolicitacao(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    setMensagem("");

    if (!servidorId) {
      setMensagem("Não foi possível identificar o professor.");
      return;
    }

    if (tipo === "Compensação" && !horas) {
      setMensagem("Informe a quantidade de horas para compensação.");
      return;
    }

    const novaSolicitacao: Solicitacao = {
      id: Date.now(),
      tipo,
      data,
      motivo,
      observacoes,
      horarioCompensacao: tipo === "Compensação" ? horarioCompensacao : "",
      horas: tipo === "Compensação" ? horas : "",
      anexos: arquivos.map((arquivo) => arquivo.name),
      status: "Pendente",
      enviadaEm: new Date().toLocaleDateString("pt-BR"),
    };

    const atualizadas = [novaSolicitacao, ...solicitacoes];
    setSolicitacoes(atualizadas);
    localStorage.setItem(chaveSolicitacoes(servidorId), JSON.stringify(atualizadas));
    setSucesso(true);
    setData("");
    setMotivo("");
    setObservacoes("");
    setHorarioCompensacao("");
    setHoras("");
    setArquivos([]);
    const campoArquivo = document.getElementById("anexosSolicitacao") as HTMLInputElement | null;
    if (campoArquivo) campoArquivo.value = "";
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
                <p>Seu gestor recebeu uma notificação por e-mail e analisará em breve.</p>
                <button type="button" onClick={novaSolicitacao}>NOVA SOLICITAÇÃO</button>
              </div>
            ) : (
              <form className="justFormulario" onSubmit={enviarSolicitacao}>
                <div className="justCampo">
                  <span className="justLabel">TIPO</span>
                  <div className="justTipos">
                    <button type="button" className={tipo === "Justificativa" ? "selecionado" : ""} onClick={() => { setTipo("Justificativa"); setMotivo(""); }}>
                      Justificativa
                    </button>
                    <button type="button" className={tipo === "Compensação" ? "selecionado" : ""} onClick={() => { setTipo("Compensação"); setMotivo(""); }}>
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
                <button className="justEnviar" type="submit">ENVIAR SOLICITAÇÃO</button>
              </form>
            )}
          </section>

          <section className="justPainel justPainelHistorico">
            <div className="justPainelTopo">
              <h2>Solicitações Anteriores</h2>
            </div>

            {solicitacoes.length === 0 ? (
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
                        <p>{solicitacao.data.split("-").reverse().join("/")}</p>
                      </div>
                      <span className={`justStatus justStatus${solicitacao.status}`}>{solicitacao.status}</span>
                    </div>
                    <div className="justItemRodape">
                      <span className={solicitacao.tipo === "Compensação" ? "justTagCompensacao" : "justTagJustificativa"}>{solicitacao.tipo.toUpperCase()}</span>
                      <small>por Gestão de Pessoas</small>
                    </div>
                    {solicitacao.horarioCompensacao && <p className="justItemDetalhe">Horário da compensação: {solicitacao.horarioCompensacao}</p>}
                    {solicitacao.observacoes && <p className="justItemDetalhe">Motivo/observações: {solicitacao.observacoes}</p>}
                    {solicitacao.horas && <p className="justItemDetalhe">Horas solicitadas: {solicitacao.horas}</p>}
                    {solicitacao.anexos.length > 0 && <p className="justItemDetalhe">Anexos: {solicitacao.anexos.join(", ")}</p>}
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
