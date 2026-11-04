 "use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import ProfessorNav from "@/app/components/ProfessorNav";

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

export default function GradeProfessor() {
  const router = useRouter();

  const [servidorId, setServidorId] = useState<number | null>(null);
  const [grades, setGrades] = useState<Grade[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [mensagem, setMensagem] = useState("");

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
    carregarGrade(id);
  }, [router]);

  async function carregarGrade(id: number) {
    try {
      setCarregando(true);
      setMensagem("");

      const resposta = await fetch("/api/grades");
      const dados = await resposta.json();

      if (!resposta.ok) {
        setMensagem(dados.erro || "Erro ao carregar a grade.");
        return;
      }

      const minhasGrades = dados.filter(
        (grade: Grade) =>
          grade.servidor_id === id && grade.status === "Ativo"
      );

      setGrades(minhasGrades);
    } catch {
      setMensagem("Erro ao carregar a grade de aulas.");
    } finally {
      setCarregando(false);
    }
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
      "profGradeAzul",
      "profGradeVerde",
      "profGradeAmarela",
      "profGradeRoxa",
      "profGradeRosa",
    ];

    return cores[grade.id % cores.length];
  }

  function formatarHorario(horario: string) {
    return horario.slice(0, 5);
  }

  const gradesPorDia = useMemo(() => {
    return dias.map((dia) => ({
      dia,
      aulas: grades.filter((grade) => grade.dia_semana === dia),
    }));
  }, [grades]);

  const quantidadeDisciplinas = new Set(
    grades.map((grade) => grade.disciplina)
  ).size;

  const quantidadeTurmas = new Set(
    grades.map((grade) => grade.turma)
  ).size;

  const nomeProfessor = grades[0]?.nome_completo || "Professor";

  if (carregando) {
    return <div className="folhaCarregando">Carregando...</div>;
  }

  return (
    <main className="folhaPagina">
      <ProfessorNav paginaAtiva="grade" nomeProfessor={nomeProfessor} />

      <div className="folhaBreadcrumb">
        <span>Sistema</span>
        <span>/</span>
        <span>Grade de Aulas</span>
        <span>/</span>
        <strong>Minha Grade</strong>
      </div>

      <section className="profGradeConteudo">
        <div className="profGradeTopo">
          <div>
            <h1>Grade de Aula</h1>
            <p>{nomeProfessor} · Professor</p>
          </div>

          <select className="profGradeSemestre" defaultValue="2">
            <option value="2">2º Semestre 2026</option>
            <option value="1">1º Semestre 2026</option>
          </select>
        </div>

        {mensagem && <div className="profGradeMensagem">{mensagem}</div>}

        <div className="profGradeCards">
          <div className="profGradeCard">
            <span>TOTAL DE AULAS/SEMANA</span>
            <strong>{grades.length}</strong>
          </div>

          <div className="profGradeCard">
            <span>DISCIPLINAS</span>
            <strong>{quantidadeDisciplinas}</strong>
          </div>

          <div className="profGradeCard">
            <span>TURMAS ATENDIDAS</span>
            <strong>{quantidadeTurmas}</strong>
          </div>
        </div>

        {grades.length === 0 ? (
          <div className="profGradeVazia">
            Nenhuma aula cadastrada para você.
          </div>
        ) : (
          <section className="profGradeCalendario">
            <div className="profGradeCabecalho">
              <div className="profGradeHorarioTitulo">HORÁRIO</div>

              {dias.map((dia) => (
                <div className="profGradeDia" key={dia}>
                  {dia.toUpperCase()}
                </div>
              ))}
            </div>

            <div className="profGradeCorpo">
              <div className="profGradeColunaHorarios">
                {horarios.map((horario) => (
                  <div className="profGradeHorario" key={horario}>
                    {horario}
                  </div>
                ))}
              </div>

              {gradesPorDia.map(({ dia, aulas }) => (
                <div className="profGradeColunaDia" key={dia}>
                  {horarios.map((horario) => (
                    <div className="profGradeLinha" key={horario} />
                  ))}

                  {aulas.map((grade) => (
                    <div
                      className={`profGradeAula ${classeCor(grade)}`}
                      key={grade.id}
                      style={{
                        top: `${obterPosicao(grade.hora_inicio)}px`,
                        height: `${obterAltura(
                          grade.hora_inicio,
                          grade.hora_fim
                        )}px`,
                      }}
                    >
                      <strong>{grade.disciplina}</strong>
                      <span>
                        {grade.turma} · {grade.sala}
                      </span>
                      <small>
                        {formatarHorario(grade.hora_inicio)} -{" "}
                        {formatarHorario(grade.hora_fim)}
                      </small>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </section>
        )}
      </section>
    </main>
  );
}
