
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { validarTokenSessao } from "@/lib/sessao";
import { RowDataPacket, ResultSetHeader } from "mysql2";

interface Solicitacao extends RowDataPacket {
  id: number;
  servidor_id: number;
  tipo: "Justificativa" | "Compensação";
  data: string;
  motivo: string;
  horario_compensacao: string | null;
  observacoes: string | null;
  horas: string | null;
  anexos: string[] | null;
  status: "Pendente" | "Aprovado" | "Reprovado";
  criada_em: string;
}

function obterSessao(request: NextRequest) {
  const token = request.cookies.get("bateponto_sessao")?.value;

  return token ? validarTokenSessao(token) : null;
}

export async function GET(request: NextRequest) {
  try {
    const sessao = obterSessao(request);

    if (!sessao || sessao.cargo !== "Professor" || !sessao.servidorId) {
      return NextResponse.json(
        { mensagem: "Acesso não autorizado." },
        { status: 403 }
      );
    }

    const [solicitacoes] = await db.execute<Solicitacao[]>(
      `SELECT
        id,
        servidor_id,
        tipo,
        DATE_FORMAT(data, '%Y-%m-%d') AS data,
        motivo,
        horario_compensacao,
        observacoes,
        horas,
        anexos,
        status,
        DATE_FORMAT(criada_em, '%Y-%m-%d %H:%i:%s') AS criada_em
      FROM solicitacoes
      WHERE servidor_id = ?
      ORDER BY criada_em DESC`,
      [sessao.servidorId]
    );

    return NextResponse.json(solicitacoes);
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      { mensagem: "Não foi possível buscar as solicitações." },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const sessao = obterSessao(request);

    if (!sessao || sessao.cargo !== "Professor" || !sessao.servidorId) {
      return NextResponse.json(
        { mensagem: "Acesso não autorizado." },
        { status: 403 }
      );
    }

    const dados = await request.json();

    const {
      tipo,
      data,
      motivo,
      horarioCompensacao,
      observacoes,
      horas,
      anexos
    } = dados;

    if (
      !["Justificativa", "Compensação"].includes(tipo) ||
      !data ||
      !motivo
    ) {
      return NextResponse.json(
        { mensagem: "Preencha os campos obrigatórios." },
        { status: 400 }
      );
    }

    if (!/^\d{4}-\d{2}-\d{2}$/.test(data)) {
      return NextResponse.json(
        { mensagem: "Data inválida." },
        { status: 400 }
      );
    }

    if (
      tipo === "Compensação" &&
      (!horarioCompensacao || !horas || !observacoes)
    ) {
      return NextResponse.json(
        { mensagem: "Preencha os dados da compensação." },
        { status: 400 }
      );
    }

    const listaAnexos = Array.isArray(anexos)
      ? anexos.filter((nome: unknown) => typeof nome === "string")
      : [];

    const [resultado] = await db.execute<ResultSetHeader>(
      `INSERT INTO solicitacoes (
        servidor_id,
        tipo,
        data,
        motivo,
        horario_compensacao,
        observacoes,
        horas,
        anexos,
        status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'Pendente')`,
      [
        sessao.servidorId,
        tipo,
        data,
        motivo,
        tipo === "Compensação" ? horarioCompensacao : null,
        observacoes || null,
        tipo === "Compensação" ? horas : null,
        JSON.stringify(listaAnexos)
      ]
    );

    return NextResponse.json(
      {
        mensagem: "Solicitação enviada com sucesso.",
        id: resultado.insertId
      },
      { status: 201 }
    );
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      { mensagem: "Não foi possível enviar a solicitação." },
      { status: 500 }
    );
  }
}
