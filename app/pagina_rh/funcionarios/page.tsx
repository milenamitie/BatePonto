"use client";

import { FormEvent, ReactNode, useEffect, useState } from "react";

type Servidor = {
  id: number;
  nome_completo: string;
  cpf: string;
  matricula: string;
  cargo: string;
  materia: string | null;
  regime: string;
  data_admissao: string;
  email_institucional: string;
  status: string;
};

type Formulario = Omit<Servidor, "id" | "status">;

const formularioVazio: Formulario = {
  nome_completo: "",
  cpf: "",
  matricula: "",
  cargo: "",
  materia: "",
  regime: "",
  data_admissao: "",
  email_institucional: "",
};

export default function Funcionarios() {
  const [servidores, setServidores] = useState<Servidor[]>([]);
  const [formulario, setFormulario] =
    useState<Formulario>(formularioVazio);

  const [busca, setBusca] = useState("");
  const [mostrarCadastro, setMostrarCadastro] = useState(false);
  const [detalhes, setDetalhes] = useState<Servidor | null>(null);
  const [editar, setEditar] = useState<Servidor | null>(null);
  const [excluir, setExcluir] = useState<Servidor | null>(null);

  const [erro, setErro] = useState("");
  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);

  async function carregarServidores(texto = "") {
    setCarregando(true);
    setErro("");

    try {
      const resposta = await fetch(
        `/api/servidores?busca=${encodeURIComponent(texto)}`
      );

      const dados = await resposta.json();

      if (!resposta.ok) {
        throw new Error(dados.erro || "Erro ao buscar servidores.");
      }

      setServidores(dados);
    } catch (erro) {
      setErro(
        erro instanceof Error
          ? erro.message
          : "Erro ao carregar servidores."
      );
    } finally {
      setCarregando(false);
    }
  }

  useEffect(() => {
    carregarServidores();
  }, []);

  function mudarCampo(
    campo: keyof Formulario,
    valor: string
  ) {
    setFormulario((atual) => ({
      ...atual,
      [campo]: valor,
    }));
  }

  async function cadastrar(evento: FormEvent) {
    evento.preventDefault();

    setErro("");
    setSalvando(true);

    try {
      const resposta = await fetch("/api/servidores", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formulario),
      });

      const dados = await resposta.json();

      if (!resposta.ok) {
        throw new Error(
          dados.erro || "Erro ao cadastrar servidor."
        );
      }

      setFormulario(formularioVazio);
      setMostrarCadastro(false);

      await carregarServidores(busca);
    } catch (erro) {
      setErro(
        erro instanceof Error
          ? erro.message
          : "Erro ao cadastrar servidor."
      );
    } finally {
      setSalvando(false);
    }
  }

  async function salvarEdicao(evento: FormEvent) {
    evento.preventDefault();

    if (!editar) return;

    setErro("");
    setSalvando(true);

    try {
      const resposta = await fetch("/api/servidores", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(editar),
      });

      const dados = await resposta.json();

      if (!resposta.ok) {
        throw new Error(
          dados.erro || "Erro ao atualizar servidor."
        );
      }

      setEditar(null);

      await carregarServidores(busca);
    } catch (erro) {
      setErro(
        erro instanceof Error
          ? erro.message
          : "Erro ao atualizar servidor."
      );
    } finally {
      setSalvando(false);
    }
  }

  async function confirmarExclusao() {
    if (!excluir) return;

    setErro("");

    try {
      const resposta = await fetch(
        `/api/servidores?id=${excluir.id}`,
        {
          method: "DELETE",
        }
      );

      const dados = await resposta.json();

      if (!resposta.ok) {
        throw new Error(
          dados.erro || "Erro ao excluir servidor."
        );
      }

      setExcluir(null);

      await carregarServidores(busca);
    } catch (erro) {
      setErro(
        erro instanceof Error
          ? erro.message
          : "Erro ao excluir servidor."
      );
    }
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
          <a href="/">SAIR</a>
        </div>
      </header>

      <nav className="rhNav">
        <a href="/pagina_rh">
          Painel
        </a>
        <a href="/pagina_rh/funcionarios">
          Funcionários
        </a>
        <a href="/pagina_rh/grades">
          Grades
        </a>
        <a href="/pagina_rh/regras_ponto">
          Regras de Ponto
        </a>
        <span>Fechamento Mensal</span>
        <span>Relatórios</span>
        <span>Gerar PDF</span>
      </nav>

      <div className="rhConteudo funcionariosTela">

        <div className="breadcrumb">
          RH&nbsp; / &nbsp;Gestão de Pessoas&nbsp; / &nbsp;
          <b>Funcionários</b>
        </div>

        <div className="tituloLinha">

          <div>
            <h1>Funcionários</h1>

            <p>
              {servidores.length}{" "}
              {servidores.length === 1
                ? "servidor cadastrado"
                : "servidores cadastrados"}
            </p>
          </div>

          <button
            onClick={() => {
              setErro("");
              setFormulario(formularioVazio);
              setMostrarCadastro(true);
            }}
          >
            + CADASTRAR SERVIDOR
          </button>

        </div>

        {erro && (
          <div className="erroRh">
            ⚠ {erro}
          </div>
        )}

        {mostrarCadastro && (
          <form
            className="cadastroBox"
            onSubmit={cadastrar}
          >
            <h2>Novo Servidor</h2>

            <div className="formGrid">

              <Campo
                label="NOME COMPLETO"
                value={formulario.nome_completo}
                onChange={(valor) =>
                  mudarCampo("nome_completo", valor)
                }
                placeholder="Ex.: João da Silva"
              />

              <Campo
                label="CPF"
                value={formulario.cpf}
                onChange={(valor) =>
                  mudarCampo("cpf", valor.replace(/\D/g, ""))
                }
                placeholder="Ex.: 12345678910"
                maxLength={11}
              />

              <Campo
                label="MATRÍCULA"
                value={formulario.matricula}
                onChange={(valor) =>
                  mudarCampo("matricula", valor)
                }
                placeholder="Ex.: 123456"
              />

              <Campo
                label="CARGO"
                value={formulario.cargo}
                onChange={(valor) =>
                  mudarCampo("cargo", valor)
                }
                placeholder="Ex.: Professor"
              />

              <Campo
                label="MATÉRIA"
                value={formulario.materia || ""}
                onChange={(valor) =>
                  mudarCampo("materia", valor)
                }
                placeholder="Ex.: Matemática"
              />

              <Campo
                label="REGIME"
                value={formulario.regime}
                onChange={(valor) =>
                  mudarCampo("regime", valor)
                }
                placeholder="Ex.: 20h ou 40h"
              />

              <Campo
                label="DATA DE ADMISSÃO"
                type="date"
                value={formulario.data_admissao}
                onChange={(valor) =>
                  mudarCampo("data_admissao", valor)
                }
              />

              <Campo
                label="E-MAIL INSTITUCIONAL"
                type="email"
                value={formulario.email_institucional}
                onChange={(valor) =>
                  mudarCampo(
                    "email_institucional",
                    valor
                  )
                }
                placeholder="Ex.: joao.silva@institucional.sp..gov.br"
              />

            </div>

            <div className="botoes">

              <button
                className="salvar"
                type="submit"
                disabled={salvando}
              >
                {salvando ? "SALVANDO..." : "SALVAR"}
              </button>

              <button
                type="button"
                onClick={() => {
                  setMostrarCadastro(false);
                  setFormulario(formularioVazio);
                }}
              >
                CANCELAR
              </button>

            </div>
          </form>
        )}

        <div className="busca">

          <input
            value={busca}
            onChange={(evento) => {
              const valor = evento.target.value;

              setBusca(valor);
              carregarServidores(valor);
            }}
            placeholder="Buscar por nome, matrícula ou e-mail..."
          />

        </div>

        <div className="tabelaWrap">

          <table>

            <thead>
              <tr>
                <th>SERVIDOR</th>
                <th>MATRÍCULA</th>
                <th>CARGO</th>
                <th>MATÉRIA</th>
                <th>STATUS</th>
                <th>AÇÕES</th>
              </tr>
            </thead>

            <tbody>

              {carregando ? (
                <tr>
                  <td colSpan={6}>
                    Carregando servidores...
                  </td>
                </tr>
              ) : servidores.length === 0 ? (
                <tr>
                  <td colSpan={6}>
                    Nenhum servidor cadastrado.
                  </td>
                </tr>
              ) : (
                servidores.map((servidor) => (
                  <tr key={servidor.id}>

                    <td>
                      <div className="nomeServidor">

                        <span>
                          {iniciais(
                            servidor.nome_completo
                          )}
                        </span>

                        <strong>
                          {servidor.nome_completo}
                        </strong>

                      </div>
                    </td>

                    <td>
                      {servidor.matricula}
                    </td>

                    <td>
                      {servidor.cargo}
                    </td>

                    <td>
                      {servidor.materia || "—"}
                    </td>

                    <td>
                      <b className="statusAtivo">
                        {servidor.status}
                      </b>
                    </td>

                    <td>

                      <div className="acoes">

                        <button
                          onClick={() =>
                            setDetalhes(servidor)
                          }
                        >
                          DETALHES
                        </button>

                        <button
                          onClick={() =>
                            setEditar({
                              ...servidor,
                            })
                          }
                        >
                          ALTERAR
                        </button>

                        <button
                          onClick={() =>
                            setExcluir(servidor)
                          }
                        >
                          EXCLUIR
                        </button>

                      </div>

                    </td>

                  </tr>
                ))
              )}

            </tbody>

          </table>

        </div>

      </div>

      {detalhes && (
        <Modal>

          <div className="modalTitulo">

            <span className="rotulo">
              CADASTRO COMPLETO
            </span>

            <div className="perfil">

              <span>
                {iniciais(
                  detalhes.nome_completo
                )}
              </span>

              <div>
                <h2>
                  {detalhes.nome_completo}
                </h2>

                <p>
                  {detalhes.cargo}
                </p>
              </div>

            </div>

          </div>

          <div className="detalhesLista">

            <Info
              label="CPF"
              value={formatarCpf(detalhes.cpf)}
            />

            <Info
              label="MATRÍCULA"
              value={detalhes.matricula}
            />

            <Info
              label="CARGO"
              value={detalhes.cargo}
            />

            <Info
              label="MATÉRIA"
              value={detalhes.materia || "—"}
            />

            <Info
              label="REGIME"
              value={detalhes.regime}
            />

            <Info
              label="DATA DE ADMISSÃO"
              value={formatarData(
                detalhes.data_admissao
              )}
            />

            <Info
              label="E-MAIL"
              value={detalhes.email_institucional}
            />

            <Info
              label="STATUS"
              value={detalhes.status}
            />

          </div>

          <button
            className="fecharModal"
            onClick={() => setDetalhes(null)}
          >
            FECHAR
          </button>

        </Modal>
      )}

      {editar && (
        <Modal>

          <span className="rotulo">
            EDIÇÃO DE CADASTRO
          </span>

          <h2>
            Alterar cadastro —{" "}
            {editar.nome_completo.split(" ")[0]}
          </h2>

          <form
            className="formGrid modalForm"
            onSubmit={salvarEdicao}
          >

            <Campo
              label="NOME COMPLETO"
              value={editar.nome_completo}
              onChange={(valor) =>
                setEditar({
                  ...editar,
                  nome_completo: valor,
                })
              }
            />

            <Campo
              label="MATRÍCULA"
              value={editar.matricula}
              onChange={(valor) =>
                setEditar({
                  ...editar,
                  matricula: valor,
                })
              }
            />

            <Campo
              label="CARGO"
              value={editar.cargo}
              onChange={(valor) =>
                setEditar({
                  ...editar,
                  cargo: valor,
                })
              }
            />

            <Campo
              label="MATÉRIA"
              value={editar.materia || ""}
              onChange={(valor) =>
                setEditar({
                  ...editar,
                  materia: valor,
                })
              }
            />

            <Campo
              label="REGIME"
              value={editar.regime}
              onChange={(valor) =>
                setEditar({
                  ...editar,
                  regime: valor,
                })
              }
            />

            <Campo
              label="DATA DE ADMISSÃO"
              type="date"
              value={editar.data_admissao}
              onChange={(valor) =>
                setEditar({
                  ...editar,
                  data_admissao: valor,
                })
              }
            />

            <div className="botoes">

              <button
                className="salvar"
                type="submit"
                disabled={salvando}
              >
                {salvando
                  ? "SALVANDO..."
                  : "SALVAR ALTERAÇÕES"}
              </button>

              <button
                type="button"
                onClick={() => setEditar(null)}
              >
                CANCELAR
              </button>

            </div>

          </form>

        </Modal>
      )}

      {excluir && (
        <Modal>

          <span className="rotulo">
            CONFIRMAÇÃO
          </span>

          <h2>
            Excluir servidor?
          </h2>

          <p>
            Você está prestes a excluir{" "}
            <strong>
              {excluir.nome_completo}
            </strong>{" "}
            (Mat. {excluir.matricula}).
            Esta ação não pode ser desfeita.
          </p>

          <div className="confirmar">

            <button
              onClick={confirmarExclusao}
            >
              CONFIRMAR EXCLUSÃO
            </button>

            <button
              onClick={() => setExcluir(null)}
            >
              CANCELAR
            </button>

          </div>

        </Modal>
      )}

    </main>
  );
}

function Campo({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
  maxLength,
}: {
  label: string;
  value: string;
  onChange: (valor: string) => void;
  placeholder?: string;
  type?: string;
  maxLength?: number;
}) {
  return (
    <label className="campo">

      <span>{label}</span>

      <input
        type={type}
        value={value}
        onChange={(evento) =>
          onChange(evento.target.value)
        }
        placeholder={placeholder}
        maxLength={maxLength}
      />

    </label>
  );
}

function Info({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div>
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function Modal({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <div className="overlay">
      <div className="modal">
        {children}
      </div>
    </div>
  );
}

function iniciais(nome: string) {
  return nome
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((parte) => parte[0])
    .join("")
    .toUpperCase();
}

function formatarData(data: string) {
  if (!data) return "—";

  const [ano, mes, dia] =
    data.slice(0, 10).split("-");

  return `${dia}/${mes}/${ano}`;
}

function formatarCpf(cpf: string) {
  const numeros = cpf.replace(/\D/g, "");

  if (numeros.length !== 11) {
    return cpf;
  }

  return numeros.replace(
    /(\d{3})(\d{3})(\d{3})(\d{2})/,
    "$1.$2.$3-$4"
  );
}