
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { validarTokenSessao } from "@/lib/sessao";
import { ResultSetHeader, RowDataPacket } from "mysql2";

interface Solicitacao extends RowDataPacket {
  id: number;
  servidor_id: number;
  nome_completo: string;
  matricula: string;
  tipo: string;
  data: string;
  motivo: string;
  horario_compensacao: string | null;
  observacoes: string | null;
  horas: string | null;
  anexos: unknown;
  status: string;
  criada_em: string;
  gestor_usuario_id: number | null;
  decisao_observacao: string | null;
  decidida_em: string | null;
}

function obterSessao(request: NextRequest) {
  const token = request.cookies.get("bateponto_sessao")?.value;

  return token ? validarTokenSessao(token) : null;
}

export async function GET(request: NextRequest) {
  try {
    const sessao = obterSessao(request);

    if (!sessao || sessao.cargo !== "Gestor") {
      return NextResponse.json(
        { mensagem: "Acesso não autorizado." },
        { status: 403 }
      );
    }

    const [solicitacoes] = await db.execute<Solicitacao[]>(
      `SELECT
        s.id,
        s.servidor_id,
        p.nome_completo,
        p.matricula,
        s.tipo,
        DATE_FORMAT(s.data, '%Y-%m-%d') AS data,
        s.motivo,
        s.horario_compensacao,
        s.observacoes,
        s.horas,
        s.anexos,
        s.status,
        DATE_FORMAT(s.criada_em, '%Y-%m-%d %H:%i:%s') AS criada_em,
        s.gestor_usuario_id,
        s.decisao_observacao,
        DATE_FORMAT(s.decidida_em, '%Y-%m-%d %H:%i:%s') AS decidida_em
      FROM solicitacoes s
      INNER JOIN servidores p ON p.id = s.servidor_id
      ORDER BY
        CASE WHEN s.status = 'Pendente' THEN 0 ELSE 1 END,
        s.criada_em DESC`
    );

    return NextResponse.json(solicitacoes);
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      { mensagem: "Erro ao buscar solicitações." },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const sessao = obterSessao(request);

    if (!sessao || sessao.cargo !== "Gestor") {
      return NextResponse.json(
        { mensagem: "Acesso não autorizado." },
        { status: 403 }
      );
    }

    const dados = await request.json();

    const { id, status, observacao } = dados;

    if (
      !Number.isInteger(id) ||
      id <= 0 ||
      !["Aprovado", "Reprovado"].includes(status)
    ) {
      return NextResponse.json(
        { mensagem: "Dados da decisão inválidos." },
        { status: 400 }
      );
    }

    if (observacao !== undefined && typeof observacao !== "string") {
      return NextResponse.json(
        { mensagem: "Observação inválida." },
        { status: 400 }
      );
    }

    const [resultado] = await db.execute<ResultSetHeader>(
      `UPDATE solicitacoes
       SET
         status = ?,
         gestor_usuario_id = ?,
         decisao_observacao = ?,
         decidida_em = NOW()
       WHERE id = ?
         AND status = 'Pendente'`,
      [
        status,
        sessao.usuarioId,
        observacao?.trim() || null,
        id
      ]
    );

    if (resultado.affectedRows === 0) {
      return NextResponse.json(
        { mensagem: "Solicitação não encontrada ou já decidida." },
        { status: 409 }
      );
    }

    return NextResponse.json({
      mensagem: `Solicitação ${status.toLowerCase()} com sucesso.`
    });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      { mensagem: "Erro ao registrar a decisão." },
      { status: 500 }
    );
  }
}
