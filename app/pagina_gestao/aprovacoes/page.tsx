"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import GestaoNav from "@/app/components/GestaoNav";

type Solicitacao = {
    id: number; servidor_id: number; nome_completo: string; matricula: string;
    tipo: string; data: string; motivo: string; horario_compensacao: string | null;
    observacoes: string | null; horas: string | null; anexos: string[] | string | null;
    status: "Pendente" | "Aprovado" | "Reprovado"; criada_em: string;
    decisao_observacao: string | null; decidida_em: string | null;
};
type Filtro = "Todas" | "Pendente" | "Aprovado" | "Reprovado";

function dataBR(valor?: string | null) {
    if (!valor) return "—";
    const [ano, mes, dia] = valor.slice(0, 10).split("-");
    return ano && mes && dia ? `${dia}/${mes}/${ano}` : valor;
}
function dataHoraBR(valor?: string | null) {
    if (!valor) return "—";
    const [data, hora] = valor.split(" ");
    return `${dataBR(data)}${hora ? ` ${hora.slice(0, 5)}` : ""}`;
}
function iniciais(nome: string) {
    return nome.split(" ").filter(Boolean).slice(0, 2).map((p) => p[0]).join("").toUpperCase();
}
function listaAnexos(valor: Solicitacao["anexos"]): string[] {
    if (Array.isArray(valor)) return valor;
    if (typeof valor === "string") {
        try { const parsed = JSON.parse(valor); return Array.isArray(parsed) ? parsed.filter((item) => typeof item === "string") : []; }
        catch { return []; }
    }
    return [];
}

export default function AprovacoesGestor() {
    const router = useRouter();
    const [solicitacoes, setSolicitacoes] = useState<Solicitacao[]>([]);
    const [filtro, setFiltro] = useState<Filtro>("Todas");
    const [aberta, setAberta] = useState<number | null>(null);
    const [observacoes, setObservacoes] = useState<Record<number, string>>({});
    const [carregando, setCarregando] = useState(true);
    const [decidindo, setDecidindo] = useState<number | null>(null);
    const [erro, setErro] = useState("");
    const [mensagem, setMensagem] = useState("");

    const carregar = useCallback(async () => {
        const resposta = await fetch("/api/gestao/solicitacoes", { cache: "no-store" });
        if (resposta.status === 401 || resposta.status === 403) { router.replace("/"); return; }
        const dados = await resposta.json();
        if (!resposta.ok) throw new Error(dados.mensagem || "Não foi possível carregar as solicitações.");
        setSolicitacoes(dados.map((item: Solicitacao) => ({ ...item, anexos: listaAnexos(item.anexos) })));
    }, [router]);

    useEffect(() => {
        carregar().catch((e) => setErro(e instanceof Error ? e.message : "Erro ao carregar solicitações."))
            .finally(() => setCarregando(false));
    }, [carregar]);

    const filtradas = useMemo(() => filtro === "Todas" ? solicitacoes : solicitacoes.filter((s) => s.status === filtro), [filtro, solicitacoes]);
    const contagem = (status: Filtro) => status === "Todas" ? solicitacoes.length : solicitacoes.filter((s) => s.status === status).length;

    async function decidir(item: Solicitacao, status: "Aprovado" | "Reprovado") {
        setErro(""); setMensagem(""); setDecidindo(item.id);
        try {
            const resposta = await fetch("/api/gestao/solicitacoes", {
                method: "PATCH", headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ id: item.id, status, observacao: observacoes[item.id] || "" })
            });
            const dados = await resposta.json();
            if (!resposta.ok) throw new Error(dados.mensagem || "Não foi possível registrar a decisão.");
            setMensagem(`Solicitação de ${item.nome_completo} ${status.toLowerCase()} com sucesso.`);
            await carregar();
        } catch (e) { setErro(e instanceof Error ? e.message : "Erro ao registrar decisão."); }
        finally { setDecidindo(null); }
    }

    return (
        <main className="gestaoPagina">
            <GestaoNav />
            <div className="gestaoBreadcrumb">Gestão <span>/</span> Diretoria Acadêmica <span>/</span> <b>Aprovações</b></div>
            <div className="gestaoConteudo aprovacoesConteudo">
                <div className="aprovacoesCabecalho">
                    <div><h1>Aprovações</h1><p>Analise as solicitações dos servidores sob sua supervisão</p></div>
                    <div className="aprovacoesFiltros" role="group" aria-label="Filtrar solicitações">
                        {(["Todas", "Pendente", "Aprovado", "Reprovado"] as Filtro[]).map((item) => (
                            <button key={item} className={filtro === item ? "ativo" : ""} onClick={() => setFiltro(item)}>
                                {item === "Todas" ? "TODOS" : item === "Pendente" ? "PENDENTE" : item === "Aprovado" ? "APROVADO" : "REPROVADO"}<span>{contagem(item)}</span>
                            </button>
                        ))}
                    </div>
                </div>
                {erro && <div className="gestaoErro" role="alert">⚠ {erro}</div>}
                {mensagem && <div className="aprovacoesSucesso" role="status">✓ {mensagem}</div>}
                {carregando ? <div className="gestaoMensagem">Carregando solicitações...</div> : filtradas.length === 0 ? (
                    <div className="aprovacoesVazio"><strong>Nenhuma solicitação encontrada</strong><span>Não há solicitações nesta categoria no momento.</span></div>
                ) : (
                    <div className="aprovacoesLista">
                        {filtradas.map((item) => {
                            const detalhes = aberta === item.id;
                            const anexos = listaAnexos(item.anexos);
                            return (
                                <article className={`aprovacaoCard ${item.status === "Pendente" ? "aprovacaoPendente" : ""}`} key={item.id}>
                                    <div className="aprovacaoPrincipal">
                                        <div className="aprovacaoIdentidade"><div className="aprovacaoAvatar">{iniciais(item.nome_completo)}</div>
                                            <div className="aprovacaoInfo">
                                                <div className="aprovacaoNomeLinha"><strong>{item.nome_completo}</strong><code>Mat. {item.matricula}</code><span className={`aprovacaoStatus status${item.status}`}>{item.status}</span></div>
                                                <div className="aprovacaoMetadados"><span>Tipo: <b>{item.tipo}</b></span><span>Data: {dataBR(item.data)}</span><span>Enviado: {dataHoraBR(item.criada_em)}</span></div>
                                                <div className="aprovacaoMotivo"><b>Motivo:</b> {item.motivo}</div>
                                            </div>
                                        </div>
                                        <div className="aprovacaoBotoes"><button className="botaoDetalhes" onClick={() => setAberta(detalhes ? null : item.id)}>{detalhes ? "FECHAR" : "DETALHES"}</button>
                                            {item.status === "Pendente" && <><button className="botaoAprovar" disabled={decidindo !== null} onClick={() => decidir(item, "Aprovado")}>✓ APROVAR</button><button className="botaoReprovar" disabled={decidindo !== null} onClick={() => decidir(item, "Reprovado")}>× REPROVAR</button></>}
                                        </div>
                                    </div>
                                    {detalhes && <div className="aprovacaoDetalhes">
                                        <div className="aprovacaoDetalhesTopo"><h2>Detalhes da solicitação</h2><span>SOL-{String(item.id).padStart(6, "0")}</span></div>
                                        <div className="aprovacaoCampos">
                                            <div><label>Servidor</label><strong>{item.nome_completo}</strong></div><div><label>Matrícula</label><strong>{item.matricula}</strong></div><div><label>Enviado em</label><strong>{dataHoraBR(item.criada_em)}</strong></div>
                                            <div><label>Data da ocorrência</label><strong>{dataBR(item.data)}</strong></div>
                                            {item.horario_compensacao && <div><label>Horário de compensação</label><strong>{item.horario_compensacao}</strong></div>}
                                            {item.horas && <div><label>Horas</label><strong>{item.horas}</strong></div>}
                                            <div className="aprovacaoCampoLargo"><label>Motivo</label><strong>{item.motivo}</strong></div>
                                            {item.observacoes && <div className="aprovacaoCampoLargo"><label>Observações do servidor</label><p>{item.observacoes}</p></div>}
                                            <div className="aprovacaoCampoLargo"><label>Anexos</label>{anexos.length ? <ul className="aprovacaoAnexos">{anexos.map((arquivo, i) => <li key={`${arquivo}-${i}`}>📎 {arquivo}</li>)}</ul> : <p>Nenhum anexo enviado.</p>}</div>
                                            {item.status !== "Pendente" && <div className="aprovacaoCampoLargo"><label>Decisão registrada</label><strong>{item.status}{item.decidida_em ? ` em ${dataHoraBR(item.decidida_em)}` : ""}</strong>{item.decisao_observacao && <p>{item.decisao_observacao}</p>}</div>}
                                        </div>
                                    </div>}
                                    <div className="aprovacaoObservacao">{item.status === "Pendente" ? <input aria-label={`Observação da decisão para ${item.nome_completo}`} value={observacoes[item.id] || ""} onChange={(e) => setObservacoes((atual) => ({ ...atual, [item.id]: e.target.value }))} placeholder="Observação (opcional)..." /> : <span>{item.decisao_observacao ? `Observação da decisão: ${item.decisao_observacao}` : "Decisão concluída."}</span>}</div>
                                </article>
                            );
                        })}
                    </div>
                )}
            </div>
        </main>
    );
}
