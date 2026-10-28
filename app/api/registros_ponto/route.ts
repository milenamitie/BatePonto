import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

function obterDataHoraSaoPaulo() {
  const agora = new Date();

  const partes = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Sao_Paulo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  }).formatToParts(agora);

  const valores: { [chave: string]: string } = {};

  partes.forEach((parte) => {
    if (parte.type !== "literal") {
      valores[parte.type] = parte.value;
    }
  });

  const data = `${valores.year}-${valores.month}-${valores.day}`;
  const horario = `${valores.hour}:${valores.minute}:${valores.second}`;

  const diaFormatado = new Intl.DateTimeFormat("pt-BR", {
    timeZone: "America/Sao_Paulo",
    weekday: "long",
  }).format(agora);

  let diaSemana = diaFormatado;

  if (diaFormatado === "domingo") {
    diaSemana = "Domingo";
  } else if (diaFormatado === "segunda-feira") {
    diaSemana = "Segunda";
  } else if (diaFormatado === "terça-feira") {
    diaSemana = "Terça";
  } else if (diaFormatado === "quarta-feira") {
    diaSemana = "Quarta";
  } else if (diaFormatado === "quinta-feira") {
    diaSemana = "Quinta";
  } else if (diaFormatado === "sexta-feira") {
    diaSemana = "Sexta";
  } else if (diaFormatado === "sábado") {
    diaSemana = "Sábado";
  }

  return {
    data,
    horario,
    diaSemana,
  };
}

function calcularAtraso(horarioReal: string, horarioPrevisto: string) {
  const [horaReal, minutoReal] = horarioReal.split(":").map(Number);
  const [horaPrevista, minutoPrevisto] = horarioPrevisto
    .split(":")
    .map(Number);

  const minutosReal = horaReal * 60 + minutoReal;
  const minutosPrevistos = horaPrevista * 60 + minutoPrevisto;

  return Math.max(0, minutosReal - minutosPrevistos);
}

function diferencaMinutos(horarioA: string, horarioB: string) {
  const [horaA, minutoA] = horarioA.split(":").map(Number);
  const [horaB, minutoB] = horarioB.split(":").map(Number);

  const minutosA = horaA * 60 + minutoA;
  const minutosB = horaB * 60 + minutoB;

  return Math.abs(minutosA - minutosB);
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const servidorId = searchParams.get("servidor_id");
    const data = searchParams.get("data");

    let sql = `
      SELECT
        rp.id,
        rp.servidor_id,
        s.nome_completo,
        DATE_FORMAT(rp.data, '%Y-%m-%d') AS data,
        TIME_FORMAT(rp.entrada, '%H:%i') AS entrada,
        TIME_FORMAT(rp.saida, '%H:%i') AS saida,
        TIME_FORMAT(rp.horario_previsto, '%H:%i') AS horario_previsto,
        rp.atraso_minutos,
        rp.status
      FROM registros_ponto rp
      INNER JOIN servidores s ON s.id = rp.servidor_id
      WHERE 1=1
    `;

    const params: (string | number)[] = [];

    if (servidorId) {
      sql += " AND rp.servidor_id = ?";
      params.push(Number(servidorId));
    }

    if (data) {
      sql += " AND rp.data = ?";
      params.push(data);
    }

    sql += " ORDER BY rp.data DESC, rp.id DESC";

    const [rows] = await db.query(sql, params);

    return NextResponse.json(rows);
  } catch {
    return NextResponse.json(
      { erro: "Erro ao buscar registros de ponto." },
      { status: 500 }
    );
  }
}


export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { servidor_id, acao } = body;

    if (!servidor_id || !["entrada", "saida"].includes(acao)) {
      return NextResponse.json(
        { erro: "Servidor e ação são obrigatórios." },
        { status: 400 }
      );
    }

    const { data, horario, diaSemana } = obterDataHoraSaoPaulo();

    const [abertos] = await db.query(
      `
        SELECT *
        FROM registros_ponto
        WHERE servidor_id = ?
          AND data = ?
          AND saida IS NULL
        ORDER BY id DESC
        LIMIT 1
      `,
      [servidor_id, data]
    );

    const registroAberto = (abertos as any[])[0];

    if (acao === "entrada") {
      if (registroAberto) {
        return NextResponse.json(
          { erro: "Registre a saída antes de iniciar outro período." },
          { status: 400 }
        );
      }

      const [gradeRows] = await db.query(
        `
          SELECT hora_inicio
          FROM grades_aulas
          WHERE servidor_id = ?
            AND dia_semana = ?
            AND status = 'Ativo'
        `,
        [servidor_id, diaSemana]
      );

      const gradesDoDia = gradeRows as any[];

      const grade = gradesDoDia
        .map((item) => ({
          horario: String(item.hora_inicio).substring(0, 8),
        }))
        .sort(
          (a, b) =>
            diferencaMinutos(horario, a.horario) -
            diferencaMinutos(horario, b.horario)
        )[0];

      const horarioPrevisto = grade?.horario || null;

      const atraso = horarioPrevisto
        ? calcularAtraso(horario, horarioPrevisto)
        : 0;

      const status = horarioPrevisto
        ? atraso > 0
          ? "Atrasado"
          : "Regular"
        : "Sem grade";

      const [resultado] = await db.query(
        `
          INSERT INTO registros_ponto
          (
            servidor_id,
            data,
            entrada,
            horario_previsto,
            atraso_minutos,
            status
          )
          VALUES (?, ?, ?, ?, ?, ?)
        `,
        [
          servidor_id,
          data,
          horario,
          horarioPrevisto,
          atraso,
          status,
        ]
      );

      return NextResponse.json({
        mensagem:
          atraso > 0
            ? `Entrada registrada com ${atraso} minuto(s) de atraso.`
            : "Entrada registrada com sucesso.",
        id: (resultado as any).insertId,
        horario_previsto: horarioPrevisto,
        atraso_minutos: atraso,
        status,
      });
    }

    if (acao === "saida") {
      if (!registroAberto) {
        return NextResponse.json(
          { erro: "Registre uma entrada antes de registrar a saída." },
          { status: 400 }
        );
      }

      await db.query(
        `
          UPDATE registros_ponto
          SET saida = ?
          WHERE id = ?
        `,
        [horario, registroAberto.id]
      );

      return NextResponse.json({
        mensagem: "Saída registrada com sucesso.",
      });
    }

    return NextResponse.json(
      { erro: "Ação inválida." },
      { status: 400 }
    );

  } catch (error) {
    console.error("Erro ao registrar ponto:", error);

    return NextResponse.json(
      { erro: "Erro ao registrar ponto." },
      { status: 500 }
    );
  }
}
