import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET() {
  try {
    const [rows] = await db.query(`
      SELECT
        g.id,
        g.servidor_id,
        s.nome_completo,
        g.disciplina,
        g.turma,
        g.sala,
        g.dia_semana,
        TIME_FORMAT(g.hora_inicio, '%H:%i') AS hora_inicio,
        TIME_FORMAT(g.hora_fim, '%H:%i') AS hora_fim,
        g.status
      FROM grades_aulas g
      INNER JOIN servidores s ON s.id = g.servidor_id
      ORDER BY
        FIELD(
          g.dia_semana,
          'Segunda',
          'Terça',
          'Quarta',
          'Quinta',
          'Sexta',
          'Sábado',
          'Domingo'
        ),
        g.hora_inicio
    `);

    return NextResponse.json(rows);
  } catch {
    return NextResponse.json(
      { erro: "Erro ao buscar grades." },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const {
      servidor_id,
      disciplina,
      turma,
      sala,
      dia_semana,
      hora_inicio,
      hora_fim,
      status,
    } = body;

    if (
      !servidor_id ||
      !disciplina ||
      !turma ||
      !sala ||
      !dia_semana ||
      !hora_inicio ||
      !hora_fim
    ) {
      return NextResponse.json(
        { erro: "Preencha todos os campos obrigatórios." },
        { status: 400 }
      );
    }

    if (hora_inicio >= hora_fim) {
      return NextResponse.json(
        { erro: "O horário de início deve ser anterior ao horário de término." },
        { status: 400 }
      );
    }

    const [resultado] = await db.query(
      `
      INSERT INTO grades_aulas
      (
        servidor_id,
        disciplina,
        turma,
        sala,
        dia_semana,
        hora_inicio,
        hora_fim,
        status
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `,
      [
        servidor_id,
        disciplina,
        turma,
        sala,
        dia_semana,
        hora_inicio,
        hora_fim,
        status || "Ativo",
      ]
    );

    return NextResponse.json({
      mensagem: "Grade cadastrada com sucesso.",
      id: (resultado as any).insertId,
    });
  } catch {
    return NextResponse.json(
      { erro: "Erro ao cadastrar grade." },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();

    const {
      id,
      servidor_id,
      disciplina,
      turma,
      sala,
      dia_semana,
      hora_inicio,
      hora_fim,
      status,
    } = body;

    if (
      !id ||
      !servidor_id ||
      !disciplina ||
      !turma ||
      !sala ||
      !dia_semana ||
      !hora_inicio ||
      !hora_fim
    ) {
      return NextResponse.json(
        { erro: "Preencha todos os campos obrigatórios." },
        { status: 400 }
      );
    }

    if (hora_inicio >= hora_fim) {
      return NextResponse.json(
        { erro: "O horário de início deve ser anterior ao horário de término." },
        { status: 400 }
      );
    }

    await db.query(
      `
      UPDATE grades_aulas
      SET
        servidor_id = ?,
        disciplina = ?,
        turma = ?,
        sala = ?,
        dia_semana = ?,
        hora_inicio = ?,
        hora_fim = ?,
        status = ?
      WHERE id = ?
      `,
      [
        servidor_id,
        disciplina,
        turma,
        sala,
        dia_semana,
        hora_inicio,
        hora_fim,
        status || "Ativo",
        id,
      ]
    );

    return NextResponse.json({
      mensagem: "Grade atualizada com sucesso.",
    });
  } catch {
    return NextResponse.json(
      { erro: "Erro ao atualizar grade." },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { erro: "ID da grade é obrigatório." },
        { status: 400 }
      );
    }

    await db.query(
      `
      DELETE FROM grades_aulas
      WHERE id = ?
      `,
      [id]
    );

    return NextResponse.json({
      mensagem: "Grade excluída com sucesso.",
    });
  } catch {
    return NextResponse.json(
      { erro: "Erro ao excluir grade." },
      { status: 500 }
    );
  }
}