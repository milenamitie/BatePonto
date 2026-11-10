
import { createHmac, timingSafeEqual } from "crypto";

export interface DadosSessao {
  usuarioId: number;
  cargo: "Professor" | "Gestor" | "RH";
  servidorId: number | null;
  expiraEm: number;
}

export function criarTokenSessao(
  usuarioId: number,
  cargo: DadosSessao["cargo"],
  servidorId: number | null
) {
  const segredo = process.env.SESSION_SECRET;

  if (!segredo) {
    throw new Error("SESSION_SECRET não configurada.");
  }

  const dados: DadosSessao = {
    usuarioId,
    cargo,
    servidorId,
    expiraEm: Date.now() + 8 * 60 * 60 * 1000
  };

  const payload = Buffer.from(JSON.stringify(dados)).toString("base64url");
  const assinatura = createHmac("sha256", segredo)
    .update(payload)
    .digest("base64url");

  return `${payload}.${assinatura}`;
}

export function validarTokenSessao(token: string): DadosSessao | null {
  const segredo = process.env.SESSION_SECRET;

  if (!segredo) {
    throw new Error("SESSION_SECRET não configurada.");
  }

  const partes = token.split(".");

  if (partes.length !== 2) {
    return null;
  }

  const [payload, assinatura] = partes;

  const assinaturaEsperada = createHmac("sha256", segredo)
    .update(payload)
    .digest();

  const assinaturaRecebida = Buffer.from(assinatura, "base64url");

  if (
    assinaturaEsperada.length !== assinaturaRecebida.length ||
    !timingSafeEqual(assinaturaEsperada, assinaturaRecebida)
  ) {
    return null;
  }

  try {
    const dados = JSON.parse(
      Buffer.from(payload, "base64url").toString("utf8")
    ) as DadosSessao;

    if (
      typeof dados.usuarioId !== "number" ||
      !["Professor", "Gestor", "RH"].includes(dados.cargo) ||
      !(dados.servidorId === null || typeof dados.servidorId === "number") ||
      typeof dados.expiraEm !== "number" ||
      dados.expiraEm <= Date.now()
    ) {
      return null;
    }

    return dados;
  } catch {
    return null;
  }
}
