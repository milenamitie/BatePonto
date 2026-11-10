
import { db } from "@/lib/db";
import { criarTokenSessao } from "@/lib/sessao";
import { RowDataPacket } from "mysql2";

interface Usuario extends RowDataPacket {
  id: number;
  email: string;
  senha: string;
  cargo: string;
  servidor_id: number | null;
}

export async function POST(request: Request) {
  try {
    const dados = await request.json();

    if (!dados.email || !dados.senha || !dados.cargo) {
      return Response.json(
        { mensagem: "Preencha todos os campos." },
        { status: 400 }
      );
    }

    const [rows] = await db.execute<Usuario[]>(
      `SELECT id, email, senha, cargo, servidor_id
       FROM usuarios
       WHERE email = ? AND senha = ? AND cargo = ?
       LIMIT 1`,
      [dados.email, dados.senha, dados.cargo]
    );

    if (rows.length === 0) {
      return Response.json(
        { mensagem: "Login inválido" },
        { status: 401 }
      );
    }

    const usuario = rows[0];

    if (!["Professor", "Gestor", "RH"].includes(usuario.cargo)) {
      return Response.json(
        { mensagem: "Cargo inválido." },
        { status: 403 }
      );
    }

    if (usuario.cargo === "Professor" && !usuario.servidor_id) {
      return Response.json(
        { mensagem: "Professor sem servidor vinculado." },
        { status: 403 }
      );
    }

    const token = criarTokenSessao(
      usuario.id,
      usuario.cargo as "Professor" | "Gestor" | "RH",
      usuario.servidor_id
    );

    const secure = process.env.NODE_ENV === "production" ? "; Secure" : "";

    const resposta = Response.json({
      mensagem: "Login autorizado",
      cargo: usuario.cargo,
      usuarioId: usuario.id,
      servidorId: usuario.servidor_id
    });

    resposta.headers.set(
      "Set-Cookie",
      `bateponto_sessao=${token}; HttpOnly${secure}; SameSite=Lax; Path=/; Max-Age=28800`
    );

    return resposta;
  } catch (error) {
    console.error(error);

    return Response.json(
      { mensagem: "Erro ao conectar ao banco." },
      { status: 500 }
    );
  }
}
