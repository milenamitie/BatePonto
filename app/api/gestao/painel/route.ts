
import { db } from "@/lib/db";
import { validarTokenSessao } from "@/lib/sessao";
import { RowDataPacket } from "mysql2";

interface Contagem extends RowDataPacket {
  total: number;
}

interface Solicitacao extends RowDataPacket {
  id: number;
  tipo: string;
  data: string | Date;
  motivo: string;
  status: string;
  nome_completo: string;
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

    const [totalRows] = await db.execute<Contagem[]>(
      "SELECT COUNT(*) AS total FROM servidores"
    );

    const [ativosRows] = await db.execute<Contagem[]>(
      "SELECT COUNT(*) AS total FROM servidores WHERE status = 'Ativo'"
    );

    const [pendentesRows] = await db.execute<Contagem[]>(
      "SELECT COUNT(*) AS total FROM solicitacoes WHERE status = 'Pendente'"
    );

    const [recentes] = await db.execute<Solicitacao[]>(
      `SELECT
        s.id,
        s.tipo,
        s.data,
        s.motivo,
        s.status,
        sv.nome_completo
      FROM solicitacoes s
      INNER JOIN servidores sv ON sv.id = s.servidor_id
      ORDER BY s.criada_em DESC
      LIMIT 5`
    );

    const total = Number(totalRows[0]?.total || 0);
    const ativos = Number(ativosRows[0]?.total || 0);
    const pendentes = Number(pendentesRows[0]?.total || 0);

    return Response.json({
      indicadores: {
        totalServidores: total,
        servidoresAtivos: ativos,
        servidoresInativos: total - ativos,
        aprovacoesPendentes: pendentes
      },
      solicitacoesRecentes: recentes
    });
  } catch (error) {
    console.error(error);

    return Response.json(
      { mensagem: "Não foi possível carregar o painel de gestão." },
      { status: 500 }
    );
  }
}
