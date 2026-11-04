"use client";
import MenuRH from "../../components/MenuRH";

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
  const [editando, setEditando] = useState<number | null>(null);
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
    carregarRegras();
  }, []);

  function iniciarEdicao(regra: Regra) {
    setEditando(regra.id);
    setValorEditado(regra.valor);
    setMensagem("");
    setErro("");
  }

  function cancelarEdicao() {
    setEditando(null);
    setValorEditado("");
  }

  async function salvarRegra(id: number) {
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
          id,
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
          regra.id === id
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
      <MenuRH />

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

          <div className="regrasCabecalho">
            <span>TIPO</span>
            <span>REGRA</span>
            <span>VALOR ATUAL</span>
            <span>EDITÁVEL</span>
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
                <div className="regraIcone">
                  {icone(regra.tipo)}
                </div>

                <strong>{regra.nome}</strong>

                <div className="valorRegra">
                  {editando === regra.id ? (
                    <input
                      value={valorEditado}
                      onChange={(evento) =>
                        setValorEditado(
                          evento.target.value
                        )
                      }
                      autoFocus
                    />
                  ) : (
                    <span>
                      {formatarValor(regra)}
                    </span>
                  )}
                </div>

                <div className="regraAcao">
                  {regra.editavel ? (
                    <>
                      <span className="editavelSim">
                        Sim
                      </span>

                      {editando === regra.id ? (
                        <div className="botoesRegra">
                          <button
                            className="salvarRegra"
                            onClick={() =>
                              salvarRegra(regra.id)
                            }
                            disabled={salvando}
                          >
                            {salvando
                              ? "Salvando..."
                              : "Salvar"}
                          </button>

                          <button
                            className="cancelarRegra"
                            onClick={cancelarEdicao}
                            disabled={salvando}
                          >
                            Cancelar
                          </button>
                        </div>
                      ) : (
                        <button
                          className="editarRegra"
                          onClick={() =>
                            iniciarEdicao(regra)
                          }
                        >
                          Editar
                        </button>
                      )}
                    </>
                  ) : (
                    <span className="editavelFixo">
                      Fixo
                    </span>
                  )}
                </div>
              </div>
            ))
          )}
        </div>

        <div className="avisoRegras">
          ⚠ Alterações nas regras de ponto têm efeito imediato e
          afetam todos os servidores. Recomenda-se comunicar
          previamente os gestores de cada unidade.
        </div>
      </div>
    </main>
  );
}