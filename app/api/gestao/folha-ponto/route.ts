import { db } from "@/lib/db";
import { validarTokenSessao } from "@/lib/sessao";
import { RowDataPacket } from "mysql2";

interface Servidor extends RowDataPacket {
  id: number;
  nome_completo: string;
  matricula: string;
  cargo: string;
  regime: string;
  materia: string | null;
}

interface Registro extends RowDataPacket {
  id: number;
  servidor_id: number;
  nome_completo: string;
  matricula: string;
  data: string;
  entrada: string | null;
  saida: string | null;
  horario_previsto: string | null;
  atraso_minutos: number;
  status: string;
}

function obterToken(request: Request) {
  const cookies = request.headers.get("cookie") || "";
  const cookie = cookies
    .split(";")
    .map((item) => item.trim())
    .find((item) => item.startsWith("bateponto_sessao="));

  return cookie?.substring("bateponto_sessao=".length) || null;
}

export async function GET(request: Request) {
  try {
    const token = obterToken(request);
    const sessao = token ? validarTokenSessao(token) : null;

    if (!sessao || sessao.cargo !== "Gestor") {
      return Response.json(
        { mensagem: "Acesso não autorizado." },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const mes = searchParams.get("mes") || "";
    const servidorIdParam = searchParams.get("servidor_id");

    if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(mes)) {
      return Response.json(
        { mensagem: "Informe um mês válido para gerar a folha de ponto." },
        { status: 400 }
      );
    }

    let servidorId: number | null = null;
    if (servidorIdParam) {
      servidorId = Number(servidorIdParam);
      if (!Number.isInteger(servidorId) || servidorId <= 0) {
        return Response.json(
          { mensagem: "Servidor inválido." },
          { status: 400 }
        );
      }
    }

    const [servidores] = await db.execute<Servidor[]>(
      `SELECT id, nome_completo, matricula, cargo, regime, materia
       FROM servidores
       ORDER BY nome_completo`
    );

    let sql = `
      SELECT
        rp.id,
        rp.servidor_id,
        s.nome_completo,
        s.matricula,
        DATE_FORMAT(rp.data, '%Y-%m-%d') AS data,
        CASE
          WHEN rp.status = 'Falta' THEN NULL
          ELSE TIME_FORMAT(rp.entrada, '%H:%i')
        END AS entrada,
        TIME_FORMAT(rp.saida, '%H:%i') AS saida,
        TIME_FORMAT(rp.horario_previsto, '%H:%i') AS horario_previsto,
        rp.atraso_minutos,
        rp.status
      FROM registros_ponto rp
      INNER JOIN servidores s ON s.id = rp.servidor_id
      WHERE rp.data >= ?
        AND rp.data < DATE_ADD(?, INTERVAL 1 MONTH)
    `;
    const parametros: (string | number)[] = [`${mes}-01`, `${mes}-01`];

    if (servidorId !== null) {
      sql += " AND rp.servidor_id = ?";
      parametros.push(servidorId);
    }

    sql += " ORDER BY s.nome_completo, rp.data, rp.id";

    const [registros] = await db.execute<Registro[]>(sql, parametros);

    return Response.json({ servidores, registros });
  } catch (error) {
    console.error("Erro ao gerar folha de ponto:", error);

    return Response.json(
      { mensagem: "Não foi possível gerar a folha de ponto." },
      { status: 500 }
    );
  }
}
