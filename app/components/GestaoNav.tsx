
"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";

const links = [
  { href: "/pagina_gestao", label: "Painel" },
  { href: "/pagina_gestao/aprovacoes", label: "Aprovações" },
  { href: "/pagina_gestao/acompanhamento", label: "Folha de Ponto" },
  { href: "/pagina_gestao/alertas", label: "Alertas" },
  { href: "/pagina_gestao/relatorios", label: "Relatórios" },
];

export default function GestaoNav() {
  const [menuAberto, setMenuAberto] = useState(false);
  const pathname = usePathname();
  const router = useRouter();

  async function sair() {
    await fetch("/api/sessao", { method: "DELETE" });
    localStorage.removeItem("cargoUsuario");
    localStorage.removeItem("servidorId");
    router.replace("/");
  }

  return (
    <>
      <header className="gestaoCabecalho">
        <div className="gestaoMarca">
          <div className="gestaoLogo">BP</div>
          <strong>BatePonto</strong>
          <span>•</span>
          <b>GESTOR</b>
        </div>

        <button
          type="button"
          className="gestaoMenuBotao"
          aria-label={menuAberto ? "Fechar menu" : "Abrir menu"}
          aria-expanded={menuAberto}
          onClick={() => setMenuAberto(!menuAberto)}
        >
          {menuAberto ? "×" : "☰"}
        </button>

        <div className="gestaoUsuario">
          <strong>Gestão</strong>
          <small>Diretoria Acadêmica</small>
          <button type="button" onClick={sair}>SAIR</button>
        </div>
      </header>

      <nav className={`gestaoNav ${menuAberto ? "gestaoMenuAberto" : ""}`}>
        {links.map((link) => {
          const ativo = pathname === link.href;

          return (
            <Link
              key={link.href}
              href={link.href}
              className={ativo ? "ativo" : ""}
              aria-current={ativo ? "page" : undefined}
              onClick={() => setMenuAberto(false)}
            >
              {link.label}
            </Link>
          );
        })}
      </nav>
    </>
  );
}
