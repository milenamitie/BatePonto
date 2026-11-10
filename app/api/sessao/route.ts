
import { validarTokenSessao } from "@/lib/sessao";

function obterToken(request: Request) {
  const cookies = request.headers.get("cookie") || "";

  const cookieSessao = cookies
    .split(";")
    .map((cookie) => cookie.trim())
    .find((cookie) => cookie.startsWith("bateponto_sessao="));

  return cookieSessao?.substring("bateponto_sessao=".length) || null;
}

export async function GET(request: Request) {
  try {
    const token = obterToken(request);

    if (!token) {
      return Response.json(
        { autenticado: false },
        { status: 401 }
      );
    }

    const sessao = validarTokenSessao(token);

    if (!sessao) {
      return Response.json(
        { autenticado: false },
        { status: 401 }
      );
    }

    return Response.json({
      autenticado: true,
      usuario: {
        usuarioId: sessao.usuarioId,
        cargo: sessao.cargo,
        servidorId: sessao.servidorId
      }
    });
  } catch (error) {
    console.error(error);

    return Response.json(
      { mensagem: "Erro ao verificar sessão." },
      { status: 500 }
    );
  }
}

export async function DELETE() {
  const secure = process.env.NODE_ENV === "production" ? "; Secure" : "";

  return new Response(null, {
    status: 200,
    headers: {
      "Set-Cookie": `bateponto_sessao=; HttpOnly${secure}; SameSite=Lax; Path=/; Max-Age=0`
    }
  });
}
