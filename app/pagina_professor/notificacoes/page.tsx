"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import ProfessorNav from "@/app/components/ProfessorNav";

type Servidor = {
  id: number;
  nome_completo: string;
  email_institucional: string;
};

type TipoNotificacao = "alerta" | "lembrete" | "aprovacao" | "email";
type Notificacao = {
  id: number;
  tipo: TipoNotificacao;
  titulo: string;
  mensagem: string;
  horario: string;
  etiqueta: string;
  lida: boolean;
};

const notificacoesIniciais: Notificacao[] = [
  { id: 1, tipo: "alerta", titulo: "Registro de ponto pendente", mensagem: "Você não registrou o retorno do almoço em 08/09. Solicite uma justificativa.", horario: "Hoje, 09:14", etiqueta: "ALERTA", lida: false },
  { id: 2, tipo: "lembrete", titulo: "Lembrete: registro de saída", mensagem: "Faltam 15 minutos para o horário de saída (17:00). Não esqueça de registrar o ponto.", horario: "Hoje, 16:45", etiqueta: "LEMBRETE", lida: false },
  { id: 3, tipo: "aprovacao", titulo: "Justificativa aprovada", mensagem: "Sua solicitação de justificativa para 16/08 foi aprovada por Carlos Eduardo Lima.", horario: "Ontem, 14:22", etiqueta: "APROVAÇÃO", lida: false },
  { id: 4, tipo: "email", titulo: "Folha de agosto enviada", mensagem: "Folha de ponto Agosto/2026 gerada e enviada para seu e-mail institucional.", horario: "01/09, 08:00", etiqueta: "E-MAIL", lida: true },
  { id: 5, tipo: "alerta", titulo: "Banco de horas negativo", mensagem: "Em 15/09 você saiu 1h antes sem compensação. Saldo atual: -1h00m.", horario: "15/09, 17:05", etiqueta: "ALERTA", lida: true },
  { id: 6, tipo: "email", titulo: "Fechamento mensal disponível", mensagem: "O fechamento da sua folha de ponto está disponível para consulta.", horario: "30/08, 10:30", etiqueta: "E-MAIL", lida: true },
];

type Preferencias = { alertas: boolean; aprovacoes: boolean; lembretes: boolean };
const preferenciasPadrao: Preferencias = { alertas: true, aprovacoes: true, lembretes: true };

export default function NotificacoesProfessor() {
  const router = useRouter();
  const [servidor, setServidor] = useState<Servidor | null>(null);
  const [notificacoes, setNotificacoes] = useState(notificacoesIniciais);
  const [aba, setAba] = useState<"todas" | "naoLidas">("todas");
  const [preferencias, setPreferencias] = useState(preferenciasPadrao);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");
  const [dadosLocaisCarregados, setDadosLocaisCarregados] = useState(false);

  useEffect(() => {
    const idSalvo = localStorage.getItem("servidorId");
    if (!idSalvo || !Number(idSalvo)) {
      router.replace("/");
      return;
    }

    const id = Number(idSalvo);

    async function carregarServidor() {
      try {
        const resposta = await fetch("/api/servidores");
        const dados = await resposta.json();
        if (!resposta.ok) throw new Error(dados.erro || "Não foi possível carregar seus dados.");
        const atual = dados.find((item: Servidor) => item.id === id);
        if (!atual) {
          localStorage.removeItem("servidorId");
          router.replace("/");
          return;
        }
        setServidor(atual);
      } catch (e) {
        setErro(e instanceof Error ? e.message : "Erro ao carregar seus dados.");
      } finally {
        setCarregando(false);
      }
    }

    carregarServidor();

    try {
      const lidas = localStorage.getItem(`bp_notificacoes_lidas_${id}`);
      if (lidas) {
        const ids: number[] = JSON.parse(lidas);
        setNotificacoes((lista) => lista.map((item) => ({ ...item, lida: ids.includes(item.id) })));
      }
      const prefs = localStorage.getItem(`bp_preferencias_notificacoes_${id}`);
      if (prefs) setPreferencias({ ...preferenciasPadrao, ...JSON.parse(prefs) });
    } catch {
      // Se houver dados locais inválidos, a tela usa os valores padrão.
    }
    setDadosLocaisCarregados(true);
  }, [router]);

  useEffect(() => {
    if (!dadosLocaisCarregados || !servidor) return;
    localStorage.setItem(
      `bp_notificacoes_lidas_${servidor.id}`,
      JSON.stringify(notificacoes.filter((item) => item.lida).map((item) => item.id))
    );
    localStorage.setItem(
      `bp_preferencias_notificacoes_${servidor.id}`,
      JSON.stringify(preferencias)
    );
  }, [notificacoes, preferencias, servidor, dadosLocaisCarregados]);

  const naoLidas = useMemo(() => notificacoes.filter((item) => !item.lida).length, [notificacoes]);
  const exibidas = useMemo(
    () => aba === "naoLidas" ? notificacoes.filter((item) => !item.lida) : notificacoes,
    [notificacoes, aba]
  );

  function marcarComoLida(id: number) {
    setNotificacoes((lista) => lista.map((item) => item.id === id ? { ...item, lida: true } : item));
  }

  function marcarTodasComoLidas() {
    setNotificacoes((lista) => lista.map((item) => ({ ...item, lida: true })));
  }

  function alternarPreferencia(campo: keyof Preferencias) {
    setPreferencias((atual) => ({ ...atual, [campo]: !atual[campo] }));
  }

  if (carregando) return <div className="folhaCarregando">Carregando notificações...</div>;

  return (
    <main className="folhaPagina notificacoesPagina">
      <ProfessorNav
        paginaAtiva="notificacoes"
        nomeProfessor={servidor?.nome_completo || "Professor"}
        notificacoesNaoLidas={naoLidas}
      />

      <div className="folhaBreadcrumb">
        <span>Sistema</span><span>/</span><span>Dep. Ciências Exatas</span><span>/</span><strong>Notificações</strong>
      </div>

      <section className="notificacoesConteudo">
        <div className="notificacoesCabecalho">
          <div>
            <h1>Notificações</h1>
            <p><strong>{naoLidas} não lidas</strong><span> · alertas e lembretes do sistema</span></p>
          </div>
          <button className="notificacoesMarcarTodas" type="button" onClick={marcarTodasComoLidas} disabled={naoLidas === 0}>
            MARCAR TODAS LIDAS
          </button>
        </div>

        {erro && <div className="notificacoesErro">{erro}</div>}

        <section className="notificacoesPreferencias">
          <div className="notificacoesEmail">
            <span>E-MAIL DE NOTIFICAÇÕES</span>
            <strong>{servidor?.email_institucional || "E-mail não cadastrado"}</strong>
          </div>
          <label><input type="checkbox" checked={preferencias.alertas} onChange={() => alternarPreferencia("alertas")} /><span>Alertas de ponto</span></label>
          <label><input type="checkbox" checked={preferencias.aprovacoes} onChange={() => alternarPreferencia("aprovacoes")} /><span>Aprovações</span></label>
          <label><input type="checkbox" checked={preferencias.lembretes} onChange={() => alternarPreferencia("lembretes")} /><span>Lembretes diários</span></label>
        </section>

        <div className="notificacoesAbas" role="tablist" aria-label="Filtrar notificações">
          <button type="button" role="tab" aria-selected={aba === "todas"} className={aba === "todas" ? "ativa" : ""} onClick={() => setAba("todas")}>Todas ({notificacoes.length})</button>
          <button type="button" role="tab" aria-selected={aba === "naoLidas"} className={aba === "naoLidas" ? "ativa" : ""} onClick={() => setAba("naoLidas")}>Não lidas ({naoLidas})</button>
        </div>

        <div className="notificacoesLista">
          {exibidas.length === 0 ? (
            <div className="notificacoesVazio"><strong>✓</strong><p>{aba === "naoLidas" ? "Você não tem notificações não lidas." : "Você ainda não tem notificações."}</p></div>
          ) : exibidas.map((item) => (
            <article key={item.id} className={`notificacaoCard notificacao-${item.tipo} ${item.lida ? "notificacaoLida" : "notificacaoNaoLida"}`}>
              <div className="notificacaoIcone" aria-hidden="true">
                {item.tipo === "alerta" && "⚠"}
                {item.tipo === "lembrete" && "♟"}
                {item.tipo === "aprovacao" && "✓"}
                {item.tipo === "email" && "✉"}
              </div>
              <div className="notificacaoCorpo">
                <div className="notificacaoLinhaTitulo"><h2>{item.titulo}</h2><time>{item.horario}</time></div>
                <p>{item.mensagem}</p>
                <div className="notificacaoAcoes">
                  <span className="notificacaoEtiqueta">{item.etiqueta}</span>
                  {!item.lida && <button type="button" onClick={() => marcarComoLida(item.id)}>MARCAR COMO LIDA</button>}
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
