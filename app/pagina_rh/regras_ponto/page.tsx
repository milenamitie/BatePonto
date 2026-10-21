"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type Regra = {
  id: number;
  tipo: string;
  nome: string;
  valor: string;
  unidade: string;
  editavel: boolean;
};

export default function RegrasDePonto() {
  const [regras, setRegras] = useState<Regra[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [editando, setEditando] = useState<Regra | null>(null);
  const [valorEditado, setValorEditado] = useState("");
  const [salvando, setSalvando] = useState(false);
  const [mensagem, setMensagem] = useState("");
  const [erro, setErro] = useState("");

  async function carregarRegras() {
    try {
      setCarregando(true);
      setErro("");

      const resposta = await fetch("/api/regras_ponto");
      const dados = await resposta.json();

      if (!resposta.ok) {
        throw new Error(
          dados.erro || "Erro ao carregar regras."
        );
      }

      setRegras(dados);
    } catch (erro) {
      setErro(
        erro instanceof Error
          ? erro.message
          : "Erro ao carregar regras."
      );
    } finally {
      setCarregando(false);
    }
  }

  useEffect(() => {
    void Promise.resolve().then(carregarRegras);
  }, []);

  function iniciarEdicao(regra: Regra) {
    setEditando(regra);
    setValorEditado(regra.valor);
    setMensagem("");
    setErro("");
  }

  function cancelarEdicao() {
    setEditando(null);
    setValorEditado("");
    setErro("");
  }

  async function salvarRegra() {
    if (!editando) return;

    try {
      setSalvando(true);
      setErro("");
      setMensagem("");

      const resposta = await fetch("/api/regras_ponto", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id: editando.id,
          valor: valorEditado,
        }),
      });

      const dados = await resposta.json();

      if (!resposta.ok) {
        throw new Error(
          dados.erro || "Erro ao atualizar regra."
        );
      }

      setRegras((atuais) =>
        atuais.map((regra) =>
          regra.id === editando.id
            ? {
                ...regra,
                valor: valorEditado,
              }
            : regra
        )
      );

      setEditando(null);
      setValorEditado("");
      setMensagem("✓ Regra atualizada");
    } catch (erro) {
      setErro(
        erro instanceof Error
          ? erro.message
          : "Erro ao atualizar regra."
      );
    } finally {
      setSalvando(false);
    }
  }

  function icone(tipo: string) {
    if (tipo === "tempo") return "⏱";
    if (tipo === "carga") return "▤";
    if (tipo === "limite") return "🔒";
    if (tipo === "prazo") return "📅";
    return "✓";
  }

  function formatarValor(regra: Regra) {
    if (regra.unidade) {
      return `${regra.valor} ${regra.unidade}`;
    }

    return regra.valor;
  }

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
          <Link href="/">SAIR</Link>
        </div>
      </header>

      <nav className="rhNav">
        <Link href="/pagina_rh">Painel</Link>

        <Link href="/pagina_rh/funcionarios">
          Funcionários
        </Link>

        <Link
          className="ativo"
          href="/pagina_rh/regras_ponto"
        >
          Regras de Ponto
        </Link>

        <span>Fechamento Mensal</span>
        <span>Relatórios</span>
        <span>Gerar PDF</span>
      </nav>

      <div className="rhConteudo regrasTela">
        <div className="breadcrumb">
          RH &nbsp;/&nbsp; Gestão de Pessoas &nbsp;/&nbsp;
          <b>Regras de Ponto</b>
        </div>

        <div className="regrasTitulo">
          <div>
            <h1>Regras de Ponto</h1>
            <p>Configurações globais do sistema de frequência</p>
          </div>

          {mensagem && (
            <div className="sucessoRegra">
              {mensagem}
            </div>
          )}
        </div>

        {erro && (
          <div className="erroRh">
            ⚠ {erro}
          </div>
        )}

        <div className="regrasBox">
          <div className="filtrosRegras">
            <span>⏱ Tempo</span>
            <span>▤ Carga</span>
            <span>🔒 Limite</span>
            <span>📅 Prazo</span>
            <span>✓ Booleano</span>
          </div>

          <div className="regrasTabelaScroll">
            <div className="regrasCabecalho">
              <span>TIPO</span>
              <span>REGRA</span>
              <span>VALOR ATUAL</span>
              <span>EDITÁVEL</span>
              <span>AÇÕES</span>
            </div>

            {carregando ? (
              <div className="regraCarregando">
                Carregando regras...
              </div>
            ) : regras.length === 0 ? (
              <div className="regraCarregando">
                Nenhuma regra cadastrada.
              </div>
            ) : (
              regras.map((regra) => (
                <div className="regraLinha" key={regra.id}>
                  <div
                    className="regraIcone"
                    title={regra.tipo}
                    aria-label={regra.tipo}
                  >
                    {icone(regra.tipo)}
                  </div>

                  <strong>{regra.nome}</strong>

                  <div className="valorRegra">
                    <span>{formatarValor(regra)}</span>
                  </div>

                  <div className="regraEditabilidade">
                    {regra.editavel ? (
                      <span className="editavelSim">Sim</span>
                    ) : (
                      <span className="editavelFixo">Fixo</span>
                    )}
                  </div>

                  <div className="regraAcoes">
                    {regra.editavel && (
                      <button
                        className="editarRegra"
                        type="button"
                        onClick={() => iniciarEdicao(regra)}
                      >
                        Editar
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="avisoRegras">
          Atenção: Alterações nas regras de ponto têm efeito imediato e
          afetam todos os servidores. Recomenda-se comunicar previamente
          os gestores de cada unidade.
        </div>
      </div>

      {editando && (
        <div
          className="modalRegraFundo"
          onMouseDown={(evento) => {
            if (evento.target === evento.currentTarget && !salvando) {
              cancelarEdicao();
            }
          }}
        >
          <form
            className="modalRegra"
            role="dialog"
            aria-modal="true"
            aria-labelledby="titulo-modal-regra"
            onSubmit={(evento) => {
              evento.preventDefault();
              void salvarRegra();
            }}
            onKeyDown={(evento) => {
              if (evento.key === "Escape" && !salvando) {
                cancelarEdicao();
              }
            }}
          >
            <div className="modalRegraCabecalho">
              <div>
                <h2 id="titulo-modal-regra">Editar regra</h2>
                <p>{editando.nome}</p>
              </div>
              <button
                className="modalRegraFechar"
                type="button"
                onClick={cancelarEdicao}
                disabled={salvando}
                aria-label="Fechar"
              >
                ×
              </button>
            </div>

            <label htmlFor="valor-regra">Valor atual</label>
            <div className="modalRegraCampo">
              <input
                id="valor-regra"
                value={valorEditado}
                onChange={(evento) => setValorEditado(evento.target.value)}
                autoFocus
                disabled={salvando}
              />
              {editando.unidade && <span>{editando.unidade}</span>}
            </div>

            {erro && <div className="erroRh">⚠ {erro}</div>}

            <div className="modalRegraAcoes">
              <button
                className="cancelarRegra"
                type="button"
                onClick={cancelarEdicao}
                disabled={salvando}
              >
                Cancelar
              </button>
              <button
                className="salvarRegra"
                type="submit"
                disabled={salvando || !valorEditado.trim()}
              >
                {salvando ? "Salvando..." : "Salvar alterações"}
              </button>
            </div>
          </form>
        </div>
      )}
    </main>
  );
}