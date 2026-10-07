"use client";

import { useEffect, useState } from "react";

type Servidor = {
  id: number;
  nome_completo: string;
};

type Grade = {
  id: number;
  servidor_id: number;
  nome_completo: string;
  disciplina: string;
  turma: string;
  sala: string;
  dia_semana: string;
  hora_inicio: string;
  hora_fim: string;
  status: string;
};

const diasSemana = [
  "Segunda",
  "Terça",
  "Quarta",
  "Quinta",
  "Sexta",
  "Sábado",
];

export default function GradesPage() {
  const [grades, setGrades] = useState<Grade[]>([]);
  const [servidores, setServidores] = useState<Servidor[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [modalAberto, setModalAberto] = useState(false);
  const [modalExcluir, setModalExcluir] = useState(false);
  const [gradeSelecionada, setGradeSelecionada] = useState<Grade | null>(null);
  const [mensagem, setMensagem] = useState("");

  const [formulario, setFormulario] = useState({
    servidor_id: "",
    disciplina: "",
    turma: "",
    sala: "",
    dia_semana: "Segunda",
    hora_inicio: "",
    hora_fim: "",
    status: "Ativo",
  });

  async function carregarDados() {
    try {
      const [gradesResposta, servidoresResposta] = await Promise.all([
        fetch("/api/grades"),
        fetch("/api/servidores"),
      ]);

      const gradesDados = await gradesResposta.json();
      const servidoresDados = await servidoresResposta.json();

      setGrades(gradesDados);
      setServidores(servidoresDados);
    } catch {
      setMensagem("Erro ao carregar os dados.");
    } finally {
      setCarregando(false);
    }
  }

  useEffect(() => {
    carregarDados();
  }, []);

  function abrirCadastro() {
    setGradeSelecionada(null);

    setFormulario({
      servidor_id: "",
      disciplina: "",
      turma: "",
      sala: "",
      dia_semana: "Segunda",
      hora_inicio: "",
      hora_fim: "",
      status: "Ativo",
    });

    setModalAberto(true);
  }

  function abrirEdicao(grade: Grade) {
    setGradeSelecionada(grade);

    setFormulario({
      servidor_id: String(grade.servidor_id),
      disciplina: grade.disciplina,
      turma: grade.turma,
      sala: grade.sala,
      dia_semana: grade.dia_semana,
      hora_inicio: grade.hora_inicio,
      hora_fim: grade.hora_fim,
      status: grade.status,
    });

    setModalAberto(true);
  }

  async function salvarGrade() {
    setMensagem("");

    if (
      !formulario.servidor_id ||
      !formulario.disciplina ||
      !formulario.turma ||
      !formulario.sala ||
      !formulario.dia_semana ||
      !formulario.hora_inicio ||
      !formulario.hora_fim
    ) {
      setMensagem("Preencha todos os campos.");
      return;
    }

    try {
      const resposta = await fetch("/api/grades", {
        method: gradeSelecionada ? "PUT" : "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(
          gradeSelecionada
            ? {
                id: gradeSelecionada.id,
                ...formulario,
              }
            : formulario
        ),
      });

      const dados = await resposta.json();

      if (!resposta.ok) {
        setMensagem(dados.erro || "Erro ao salvar grade.");
        return;
      }

      setModalAberto(false);
      await carregarDados();
    } catch {
      setMensagem("Erro ao salvar grade.");
    }
  }

  async function excluirGrade() {
    if (!gradeSelecionada) return;

    try {
      const resposta = await fetch(
        `/api/grades?id=${gradeSelecionada.id}`,
        {
          method: "DELETE",
        }
      );

      const dados = await resposta.json();

      if (!resposta.ok) {
        setMensagem(dados.erro || "Erro ao excluir grade.");
        return;
      }

      setModalExcluir(false);
      setGradeSelecionada(null);
      await carregarDados();
    } catch {
      setMensagem("Erro ao excluir grade.");
    }
  }

  if (carregando) {
    return <div className="rhCarregando">Carregando...</div>;
  }

  return (
    <main className="rhPagina">
      <header className="rhHeader">
        <div className="rhLogoArea">
          <div className="rhLogo">BP</div>
          <strong>BatePonto</strong>
        </div>

        <div className="rhTituloHeader">RECURSOS HUMANOS</div>

        <div className="rhUsuario">
          <div className="rhAvatar">RH</div>

          <div>
            <strong>Recursos Humanos</strong>
            <span>Administrador</span>
          </div>

          <button>SAIR</button>
        </div>
      </header>

      <nav className="rhNav">
        <a href="/pagina_rh">Painel</a>

        <a href="/pagina_rh/funcionarios">Funcionários</a>

        <a className="ativo" href="/pagina_rh/grades">
          Grades
        </a>

        <a href="/pagina_rh/regras_ponto">Regras de Ponto</a>

        <span>Fechamento Mensal</span>
        <span>Relatórios</span>
        <span>Gerar PDF</span>
      </nav>

      <section className="rhConteudo">
        <div className="rhTituloPagina">
          <div>
            <h1>Grade de Aulas</h1>
            <p>Gerencie os horários de aulas dos servidores.</p>
          </div>

          <button className="rhBotaoPrimario" onClick={abrirCadastro}>
            + NOVA GRADE
          </button>
        </div>

        {mensagem && (
          <div className="rhMensagem">
            {mensagem}
          </div>
        )}

        <section className="gradeResumo">
          <div>
            <span>TOTAL DE GRADES</span>
            <strong>{grades.length}</strong>
          </div>

          <div>
            <span>ATIVAS</span>
            <strong>
              {grades.filter((grade) => grade.status === "Ativo").length}
            </strong>
          </div>

          <div>
            <span>SERVIDORES</span>
            <strong>{new Set(grades.map((grade) => grade.servidor_id)).size}</strong>
          </div>
        </section>

        <section className="gradeTabela">
          <div className="gradeCabecalho">
            <span>PROFESSOR</span>
            <span>DISCIPLINA</span>
            <span>TURMA</span>
            <span>SALA</span>
            <span>DIA</span>
            <span>HORÁRIO</span>
            <span>STATUS</span>
            <span>AÇÕES</span>
          </div>

          {grades.length === 0 ? (
            <div className="gradeVazia">
              Nenhuma grade cadastrada.
            </div>
          ) : (
            grades.map((grade) => (
              <div className="gradeLinha" key={grade.id}>
                <div>
                  <strong>{grade.nome_completo}</strong>
                </div>

                <div>{grade.disciplina}</div>

                <div>{grade.turma}</div>

                <div>{grade.sala}</div>

                <div>{grade.dia_semana}</div>

                <div>
                  {grade.hora_inicio} — {grade.hora_fim}
                </div>

                <div>
                  <span
                    className={
                      grade.status === "Ativo"
                        ? "gradeStatusAtivo"
                        : "gradeStatusInativo"
                    }
                  >
                    {grade.status}
                  </span>
                </div>

                <div className="gradeAcoes">
                  <button onClick={() => abrirEdicao(grade)}>
                    ALTERAR
                  </button>

                  <button
                    onClick={() => {
                      setGradeSelecionada(grade);
                      setModalExcluir(true);
                    }}
                  >
                    EXCLUIR
                  </button>
                </div>
              </div>
            ))
          )}
        </section>
      </section>

      {modalAberto && (
        <div className="rhModalFundo">
          <div className="rhModal">
            <div className="rhModalCabecalho">
              <div>
                <h2>
                  {gradeSelecionada ? "Alterar Grade" : "Nova Grade"}
                </h2>

                <p>
                  Informe os dados do horário de aula.
                </p>
              </div>

              <button onClick={() => setModalAberto(false)}>
                ×
              </button>
            </div>

            <div className="rhModalCorpo">
              <label>
                Professor
                <select
                  value={formulario.servidor_id}
                  onChange={(e) =>
                    setFormulario({
                      ...formulario,
                      servidor_id: e.target.value,
                    })
                  }
                >
                  <option value="">Selecione um professor</option>

                  {servidores.map((servidor) => (
                    <option key={servidor.id} value={servidor.id}>
                      {servidor.nome_completo}
                    </option>
                  ))}
                </select>
              </label>

              <div className="gradeFormGrid">
                <label>
                  Disciplina
                  <input
                    value={formulario.disciplina}
                    onChange={(e) =>
                      setFormulario({
                        ...formulario,
                        disciplina: e.target.value,
                      })
                    }
                  />
                </label>

                <label>
                  Turma
                  <input
                    value={formulario.turma}
                    onChange={(e) =>
                      setFormulario({
                        ...formulario,
                        turma: e.target.value,
                      })
                    }
                  />
                </label>

                <label>
                  Sala
                  <input
                    value={formulario.sala}
                    onChange={(e) =>
                      setFormulario({
                        ...formulario,
                        sala: e.target.value,
                      })
                    }
                  />
                </label>

                <label>
                  Dia da semana
                  <select
                    value={formulario.dia_semana}
                    onChange={(e) =>
                      setFormulario({
                        ...formulario,
                        dia_semana: e.target.value,
                      })
                    }
                  >
                    {diasSemana.map((dia) => (
                      <option key={dia} value={dia}>
                        {dia}
                      </option>
                    ))}
                  </select>
                </label>

                <label>
                  Hora de início
                  <input
                    type="time"
                    value={formulario.hora_inicio}
                    onChange={(e) =>
                      setFormulario({
                        ...formulario,
                        hora_inicio: e.target.value,
                      })
                    }
                  />
                </label>

                <label>
                  Hora de término
                  <input
                    type="time"
                    value={formulario.hora_fim}
                    onChange={(e) =>
                      setFormulario({
                        ...formulario,
                        hora_fim: e.target.value,
                      })
                    }
                  />
                </label>
              </div>

              <label>
                Status
                <select
                  value={formulario.status}
                  onChange={(e) =>
                    setFormulario({
                      ...formulario,
                      status: e.target.value,
                    })
                  }
                >
                  <option value="Ativo">Ativo</option>
                  <option value="Inativo">Inativo</option>
                </select>
              </label>
            </div>

            <div className="rhModalRodape">
              <button
                className="rhBotaoSecundario"
                onClick={() => setModalAberto(false)}
              >
                CANCELAR
              </button>

              <button
                className="rhBotaoPrimario"
                onClick={salvarGrade}
              >
                {gradeSelecionada ? "SALVAR ALTERAÇÕES" : "CADASTRAR GRADE"}
              </button>
            </div>
          </div>
        </div>
      )}

      {modalExcluir && gradeSelecionada && (
        <div className="rhModalFundo">
          <div className="rhModal rhModalExcluir">
            <div className="rhModalCabecalho">
              <div>
                <h2>Excluir grade?</h2>

                <p>
                  Essa ação não poderá ser desfeita.
                </p>
              </div>

              <button onClick={() => setModalExcluir(false)}>
                ×
              </button>
            </div>

            <div className="rhModalCorpo">
              <p>
                Você está excluindo a grade de{" "}
                <strong>{gradeSelecionada.nome_completo}</strong>.
              </p>

              <p>
                {gradeSelecionada.disciplina} ·{" "}
                {gradeSelecionada.dia_semana} ·{" "}
                {gradeSelecionada.hora_inicio} —{" "}
                {gradeSelecionada.hora_fim}
              </p>
            </div>

            <div className="rhModalRodape">
              <button
                className="rhBotaoSecundario"
                onClick={() => setModalExcluir(false)}
              >
                CANCELAR
              </button>

              <button
                className="rhBotaoExcluir"
                onClick={excluirGrade}
              >
                EXCLUIR GRADE
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}