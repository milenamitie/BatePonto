"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type ProfessorNavProps = {
  paginaAtiva: "folha" | "grade" | "historico" | "justificativas" | "notificacoes" | "gerar_pdf";
  notificacoesNaoLidas?: number;
  nomeProfessor?: string;
};

export default function ProfessorNav({ paginaAtiva, nomeProfessor = "Professor", notificacoesNaoLidas = 0 }: ProfessorNavProps) {
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

  function fecharMenu() {
    setMenuAberto(false);
  }

  return (
    <header className="professorHeader">
      <div className="professorTopo">
        <div className="professorMarca">
          <div className="professorLogo">BP</div>
          <strong>BatePonto</strong>
          <span className="professorSeparador">•</span>
          <b>PROFESSOR</b>
        </div>

        <button
          type="button"
          className="professorMenuBotao"
          aria-label={menuAberto ? "Fechar menu" : "Abrir menu"}
          aria-expanded={menuAberto}
          aria-controls="professor-navegacao"
          onClick={() => setMenuAberto(!menuAberto)}
        >
          {menuAberto ? "×" : "☰"}
        </button>

        <div className="professorUsuario">
          <div className="professorAvatar">{iniciais(nomeProfessor)}</div>
          <div className="professorIdentificacao">
            <strong>{nomeProfessor}</strong>
            <span>Professor</span>
          </div>
          <button type="button" aria-label="Sair da conta" onClick={sair}>SAIR</button>
        </div>
      </div>

      <nav
        id="professor-navegacao"
        className={`professorNav ${menuAberto ? "professorNavAberta" : ""}`}
        onClick={fecharMenu}
      >
        <a className={paginaAtiva === "folha" ? "ativo" : ""} href="/pagina_professor">Folha de Ponto</a>
        <a className={paginaAtiva === "grade" ? "ativo" : ""} href="/pagina_professor/grade">Grade de Aulas</a>
        <a className={paginaAtiva === "historico" ? "ativo" : ""} href="/pagina_professor/historico">Histórico</a>
        <a className={paginaAtiva === "justificativas" ? "ativo" : ""} href="/pagina_professor/justificativas">Justificativas &amp; Compensações</a>
        <a className={paginaAtiva === "notificacoes" ? "ativo" : ""} href="/pagina_professor/notificacoes">Notificações{notificacoesNaoLidas > 0 && <span className="professorNavBadge">{notificacoesNaoLidas}</span>}</a>
        <a className={paginaAtiva === "gerar_pdf" ? "ativo" : ""} href="/pagina_professor/gerar_pdf">Gerar PDF</a>
      </nav>
    </header>
  );
}
