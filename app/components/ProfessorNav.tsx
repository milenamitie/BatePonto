"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type ProfessorNavProps = {
  paginaAtiva: "folha" | "grade" | "historico";
  nomeProfessor?: string;
};

export default function ProfessorNav({ paginaAtiva, nomeProfessor = "Professor" }: ProfessorNavProps) {
  const [menuAberto, setMenuAberto] = useState(false);
  const router = useRouter();

  function sair() {
    localStorage.removeItem("servidorId");
    router.push("/");
  }

  function iniciais(nome: string) {
    const partes = nome.trim().split(/\s+/);
    if (partes.length === 1) return partes[0].slice(0, 2).toUpperCase();
    return `${partes[0][0]}${partes[partes.length - 1][0]}`.toUpperCase();
  }

  return (
    <header className="folhaHeader">
      <div className="folhaLogoArea">
        <div className="folhaLogo">BP</div>
        <strong>BatePonto</strong>
      </div>

      <button
        type="button"
        className="folhaMenuBotao"
        aria-label={menuAberto ? "Fechar menu" : "Abrir menu"}
        aria-expanded={menuAberto}
        onClick={() => setMenuAberto(!menuAberto)}
      >
        {menuAberto ? "×" : "☰"}
      </button>

      <nav
        className={`folhaNav ${menuAberto ? "menuAberto" : ""}`}
        onClick={() => setMenuAberto(false)}
      >
        <a className={paginaAtiva === "folha" ? "ativo" : ""} href="/pagina_professor">Folha de Ponto</a>
        <a className={paginaAtiva === "grade" ? "ativo" : ""} href="/pagina_professor/grade">Grade de Aulas</a>
        <a className={paginaAtiva === "historico" ? "ativo" : ""} href="/pagina_professor/historico">Histórico</a>
        <a href="#">Justificativas &amp; Compensações</a>
        <a href="#">Notificações</a>
        <a href="#">Gerar PDF</a>
      </nav>

      <div className="folhaUsuario">
        <div className="folhaAvatar">{iniciais(nomeProfessor)}</div>
        <div>
          <strong>{nomeProfessor}</strong>
          <span>Professor</span>
        </div>
        <button type="button" aria-label="Sair da conta" onClick={sair}>SAIR</button>
      </div>
    </header>
  );
}
