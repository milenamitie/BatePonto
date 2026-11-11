"use client";
import MenuRH from "../../components/MenuRH";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

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

type Formulario = {
  servidor_id: string;
  disciplina: string;
  turma: string;
  sala: string;
  dia_semana: string;
  hora_inicio: string;
  hora_fim: string;
};

const dias = ["Segunda", "Terça", "Quarta", "Quinta", "Sexta"];
const horarios = [
  "08:00",
  "09:00",
  "10:00",
  "11:00",
  "12:00",
  "13:00",
  "14:00",
  "15:00",
  "16:00",
  "17:00",
  "18:00",
  "19:00",
  "20:00",
  "21:00",
  "22:00",
  "23:00",
];

const formularioInicial: Formulario = {
  servidor_id: "",
  disciplina: "",
  turma: "",
  sala: "",
  dia_semana: "Segunda",
  hora_inicio: "07:00",
  hora_fim: "08:00",
};

export default function Grades() {
  const router = useRouter();

  const [grades, setGrades] = useState<Grade[]>([]);
  const [servidores, setServidores] = useState<Servidor[]>([]);
  const [professorFiltro, setProfessorFiltro] = useState("todos");
  const [modal, setModal] = useState<"nova" | "editar" | "excluir" | null>(null);
  const [formulario, setFormulario] = useState<Formulario>(formularioInicial);
  const [gradeSelecionada, setGradeSelecionada] = useState<Grade | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [mensagem, setMensagem] = useState("");

  useEffect(() => {
    const cargo = localStorage.getItem("cargoUsuario");

    if (cargo !== "RH") {
      router.replace("/");
      return;
    }

    carregarDados();
  }, [router]);

  async function carregarDados() {
    try {
      setCarregando(true);

      const [respostaGrades, respostaServidores] = await Promise.all([
        fetch("/api/grades"),
        fetch("/api/servidores"),
      ]);

      const dadosGrades = await respostaGrades.json();
      const dadosServidores = await respostaServidores.json();

      if (respostaGrades.ok) {
        setGrades(dadosGrades);
      }

      if (respostaServidores.ok) {
        setServidores(dadosServidores);
      }
    } catch {
      setMensagem("Erro ao carregar os dados.");
    } finally {
      setCarregando(false);
    }
  }

  function abrirNovaAula() {
    setGradeSelecionada(null);
    setFormulario(formularioInicial);
    setMensagem("");
    setModal("nova");
  }

  function abrirEditar(grade: Grade) {
    setGradeSelecionada(grade);

    setFormulario({
      servidor_id: String(grade.servidor_id),
      disciplina: grade.disciplina,
      turma: grade.turma,
      sala: grade.sala,
      dia_semana: grade.dia_semana,
      hora_inicio: grade.hora_inicio,
      hora_fim: grade.hora_fim,
    });

    setMensagem("");
    setModal("editar");
  }

  function abrirExcluir(grade: Grade) {
    setGradeSelecionada(grade);
    setMensagem("");
    setModal("excluir");
  }

  function fecharModal() {
    if (salvando) return;

    setModal(null);
    setGradeSelecionada(null);
    setFormulario(formularioInicial);
    setMensagem("");
  }

  function alterarCampo(campo: keyof Formulario, valor: string) {
    setFormulario((atual) => ({
      ...atual,
      [campo]: valor,
    }));
  }

  async function salvarGrade() {
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

    if (formulario.hora_inicio >= formulario.hora_fim) {
      setMensagem("O início deve ser anterior ao término.");
      return;
    }

    try {
      setSalvando(true);
      setMensagem("");

      const resposta = await fetch("/api/grades", {
        method: modal === "editar" ? "PUT" : "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...(modal === "editar" && {
            id: gradeSelecionada?.id,
          }),
          servidor_id: Number(formulario.servidor_id),
          disciplina: formulario.disciplina,
          turma: formulario.turma,
          sala: formulario.sala,
          dia_semana: formulario.dia_semana,
          hora_inicio: formulario.hora_inicio,
          hora_fim: formulario.hora_fim,
          status: "Ativo",
        }),
      });

      const resultado = await resposta.json();

      if (!resposta.ok) {
        setMensagem(resultado.erro || "Não foi possível salvar.");
        return;
      }

      fecharModal();
      await carregarDados();
    } catch {
      setMensagem("Erro ao salvar a aula.");
    } finally {
      setSalvando(false);
    }
  }

  async function excluirGrade() {
    if (!gradeSelecionada) return;

    try {
      setSalvando(true);
      setMensagem("");

      const resposta = await fetch(
        `/api/grades?id=${gradeSelecionada.id}`,
        {
          method: "DELETE",
        }
      );

      const resultado = await resposta.json();

      if (!resposta.ok) {
        setMensagem(resultado.erro || "Não foi possível excluir.");
        return;
      }

      fecharModal();
      await carregarDados();
    } catch {
      setMensagem("Erro ao excluir a aula.");
    } finally {
      setSalvando(false);
    }
  }


  const gradesFiltradas = useMemo(() => {
    if (professorFiltro === "todos") {
      return grades;
    }

    return grades.filter(
      (grade) => String(grade.servidor_id) === professorFiltro
    );
  }, [grades, professorFiltro]);

  const professoresComGrade = new Set(
    grades.map((grade) => grade.servidor_id)
  ).size;

  function minutosDoHorario(horario: string) {
    const [horas, minutos] = horario.split(":").map(Number);
    return horas * 60 + minutos;
  }

  // Distribui aulas que se cruzam em faixas lado a lado dentro do mesmo dia.
  function obterFaixas(aulas: Grade[]) {
    const ordenadas = [...aulas].sort(
      (a, b) =>
        minutosDoHorario(a.hora_inicio) - minutosDoHorario(b.hora_inicio) ||
        minutosDoHorario(a.hora_fim) - minutosDoHorario(b.hora_fim)
    );
    const resultado = new Map<number, { faixa: number; total: number }>();
    let grupo: Grade[] = [];
    let fimDoGrupo = -1;

    function distribuirGrupo() {
      if (grupo.length === 0) return;
      const finsDasFaixas: number[] = [];
      const distribuicao: Array<{ id: number; faixa: number }> = [];

      for (const aula of grupo) {
        const inicio = minutosDoHorario(aula.hora_inicio);
        const fim = minutosDoHorario(aula.hora_fim);
        let faixa = finsDasFaixas.findIndex((fimFaixa) => fimFaixa <= inicio);
        if (faixa === -1) faixa = finsDasFaixas.length;
        finsDasFaixas[faixa] = fim;
        distribuicao.push({ id: aula.id, faixa });
      }

      const total = Math.max(1, finsDasFaixas.length);
      distribuicao.forEach(({ id, faixa }) => resultado.set(id, { faixa, total }));
      grupo = [];
      fimDoGrupo = -1;
    }

    for (const aula of ordenadas) {
      const inicio = minutosDoHorario(aula.hora_inicio);
      const fim = minutosDoHorario(aula.hora_fim);
      if (grupo.length > 0 && inicio >= fimDoGrupo) distribuirGrupo();
      grupo.push(aula);
      fimDoGrupo = Math.max(fimDoGrupo, fim);
    }
    distribuirGrupo();
    return resultado;
  }

  function obterPosicao(hora: string) {
    const [horas, minutos] = hora.split(":").map(Number);
    const minutosTotais = horas * 60 + minutos;
    const inicio = 8 * 60;

    return ((minutosTotais - inicio) / 60) * 67;
  }

  function obterAltura(inicio: string, fim: string) {
    const [horaInicio, minutoInicio] = inicio.split(":").map(Number);
    const [horaFim, minutoFim] = fim.split(":").map(Number);

    const inicioMinutos = horaInicio * 60 + minutoInicio;
    const fimMinutos = horaFim * 60 + minutoFim;

    return ((fimMinutos - inicioMinutos) / 60) * 67;
  }

  function classeCor(grade: Grade) {
    const cores = [
      "gradeAzul",
      "gradeVerde",
      "gradeAmarela",
      "gradeRoxa",
      "gradeRosa",
    ];

    return cores[grade.servidor_id % cores.length];
  }

  function formatarHorario(horario: string) {
    return horario.slice(0, 5);
  }

  return (
    <div className="rhPagina">
      <MenuRH />

      <div className="rhConteudo">
        <div className="breadcrumb">
          RH&nbsp; / &nbsp;Gestão de Pessoas&nbsp; / &nbsp;
          <b>Grades</b>
        </div>

        <main className="gradesPagina">
        <div className="gradesTopo">
          <div>
            <h1>Grades de Aula</h1>
            <p>
              {grades.length} aulas cadastradas • {professoresComGrade} professores
            </p>
          </div>

          <div className="gradesAcoes">
            <select
              value={professorFiltro}
              onChange={(e) => setProfessorFiltro(e.target.value)}
            >
              <option value="todos">Todos os professores</option>
              {servidores.map((servidor) => (
                <option key={servidor.id} value={servidor.id}>
                  {servidor.nome_completo}
                </option>
              ))}
            </select>

            <button onClick={abrirNovaAula}>+ NOVA AULA</button>
          </div>
        </div>

        {mensagem && !modal && (
          <div className="gradesMensagem">{mensagem}</div>
        )}

        <section className="gradeCalendario">
          <div className="gradeCabecalho">
            <div className="gradeCelulaHorario">HORÁRIO</div>

            {dias.map((dia) => (
              <div className="gradeDia" key={dia}>
                {dia.toUpperCase()}
              </div>
            ))}
          </div>

          <div className="gradeCorpo">
            <div className="gradeColunaHorarios">
              {horarios.map((horario) => (
                <div className="gradeHorario" key={horario}>
                  {horario}
                </div>
              ))}
            </div>

            {dias.map((dia) => {
              const aulasDoDia = gradesFiltradas.filter(
                (grade) =>
                  grade.dia_semana === dia && grade.status === "Ativo"
              );

              const faixas = obterFaixas(aulasDoDia);

              return (
                <div className="gradeColunaDia" key={dia}>
                  {horarios.map((horario) => (
                    <div className="gradeLinha" key={horario} />
                  ))}

                  {aulasDoDia.map((grade) => (
                    <div
                      className={`gradeAula ${classeCor(grade)}`}
                      key={grade.id}
                      style={{
                        top: `${obterPosicao(grade.hora_inicio)}px`,
                        height: `${obterAltura(
                          grade.hora_inicio,
                          grade.hora_fim
                        )}px`,
                        left: `calc(${(faixas.get(grade.id)?.faixa ?? 0) * 100 / (faixas.get(grade.id)?.total ?? 1)}% + 4px)`,
                        width: `calc(${100 / (faixas.get(grade.id)?.total ?? 1)}% - 8px)`,
                        right: "auto",
                      }}
                    >
                      <strong>{grade.disciplina}</strong>
                      <span>
                        {grade.turma} · {grade.sala}
                      </span>
                      <span>{grade.nome_completo}</span>

                      <div className="gradeLinks">
                        <button onClick={() => abrirEditar(grade)}>
                          Editar
                        </button>
                        <span>·</span>
                        <button onClick={() => abrirExcluir(grade)}>
                          Excluir
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              );
            })}
          </div>
        </section>

        <section className="listaGrades">
          <div className="listaGradesTopo">
            <h2>Lista de aulas</h2>
            <span>{gradesFiltradas.length} registros</span>
          </div>

          {carregando ? (
            <div className="listaGradesVazia">Carregando...</div>
          ) : gradesFiltradas.length === 0 ? (
            <div className="listaGradesVazia">
              Nenhuma aula cadastrada.
            </div>
          ) : (
            <div className="listaGradesTabela">
              <div className="listaGradesCabecalho">
                <span>PROFESSOR</span>
                <span>DISCIPLINA</span>
                <span>TURMA</span>
                <span>SALA</span>
                <span>DIA</span>
                <span>HORÁRIO</span>
                <span></span>
              </div>

              {gradesFiltradas.map((grade) => (
                <div className="listaGradesLinha" key={grade.id}>
                  <strong>{grade.nome_completo}</strong>
                  <span>{grade.disciplina}</span>
                  <span>{grade.turma}</span>
                  <span>{grade.sala}</span>
                  <span>{grade.dia_semana}</span>
                  <span>
                    {formatarHorario(grade.hora_inicio)} -{" "}
                    {formatarHorario(grade.hora_fim)}
                  </span>

                  <div>
                    <button onClick={() => abrirEditar(grade)}>
                      EDITAR
                    </button>
                    <button onClick={() => abrirExcluir(grade)}>
                      EXCLUIR
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
        </main>
      </div>

      {modal && (
        <div className="gradeOverlay" onMouseDown={fecharModal}>
          {modal === "excluir" && gradeSelecionada ? (
            <div
              className="gradeModal gradeModalExcluir"
              onMouseDown={(e) => e.stopPropagation()}
            >
              <span className="gradeModalEtiqueta">CONFIRMAÇÃO</span>
              <h2>Excluir aula?</h2>

              <p>
                <strong>{gradeSelecionada.disciplina}</strong> —{" "}
                {gradeSelecionada.dia_semana} às{" "}
                {formatarHorario(gradeSelecionada.hora_inicio)} -{" "}
                {formatarHorario(gradeSelecionada.hora_fim)} ·{" "}
                {gradeSelecionada.nome_completo}
              </p>

              {mensagem && <div className="gradeModalErro">{mensagem}</div>}

              <div className="gradeModalBotoes">
                <button
                  className="botaoExcluir"
                  onClick={excluirGrade}
                  disabled={salvando}
                >
                  {salvando ? "EXCLUINDO..." : "EXCLUIR"}
                </button>

                <button
                  className="botaoCancelar"
                  onClick={fecharModal}
                  disabled={salvando}
                >
                  CANCELAR
                </button>
              </div>
            </div>
          ) : (
            <div
              className="gradeModal"
              onMouseDown={(e) => e.stopPropagation()}
            >
              <span className="gradeModalEtiqueta">
                {modal === "editar" ? "EDITAR AULA" : "NOVA AULA"}
              </span>

              <h2>
                {modal === "editar" ? "Atualizar aula" : "Adicionar à grade"}
              </h2>

              <div className="gradeFormGrid">
                <label>
                  PROFESSOR
                  <select
                    value={formulario.servidor_id}
                    onChange={(e) =>
                      alterarCampo("servidor_id", e.target.value)
                    }
                  >
                    <option value="">Selecione</option>
                    {servidores.map((servidor) => (
                      <option key={servidor.id} value={servidor.id}>
                        {servidor.nome_completo}
                      </option>
                    ))}
                  </select>
                </label>

                <label>
                  DISCIPLINA / MATÉRIA
                  <input
                    value={formulario.disciplina}
                    onChange={(e) =>
                      alterarCampo("disciplina", e.target.value)
                    }
                  />
                </label>

                <label>
                  TURMA
                  <input
                    value={formulario.turma}
                    onChange={(e) => alterarCampo("turma", e.target.value)}
                  />
                </label>

                <label>
                  SALA
                  <input
                    value={formulario.sala}
                    onChange={(e) => alterarCampo("sala", e.target.value)}
                  />
                </label>

                <label>
                  DIA DA SEMANA
                  <select
                    value={formulario.dia_semana}
                    onChange={(e) =>
                      alterarCampo("dia_semana", e.target.value)
                    }
                  >
                    {dias.map((dia) => (
                      <option key={dia} value={dia}>
                        {dia}
                      </option>
                    ))}
                  </select>
                </label>

                <label>
                  COMEÇO DE AULA
                  <input
                    type="time"
                    value={formulario.hora_inicio}
                    onChange={(e) =>
                      alterarCampo("hora_inicio", e.target.value)
                    }
                  />
                </label>

                <label>
                  TÉRMINO DE AULA
                  <input
                    type="time"
                    value={formulario.hora_fim}
                    onChange={(e) =>
                      alterarCampo("hora_fim", e.target.value)
                    }
                  />
                </label>
              </div>

              {mensagem && <div className="gradeModalErro">{mensagem}</div>}

              <div className="gradeModalBotoes">
                <button
                  className="botaoSalvar"
                  onClick={salvarGrade}
                  disabled={salvando}
                >
                  {salvando
                    ? "SALVANDO..."
                    : modal === "editar"
                      ? "SALVAR"
                      : "ADICIONAR"}
                </button>

                <button
                  className="botaoCancelar"
                  onClick={fecharModal}
                  disabled={salvando}
                >
                  CANCELAR
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}