"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";

const links = [
  { href: "/pagina_rh", label: "Painel" },
  { href: "/pagina_rh/funcionarios", label: "Funcionários" },
  { href: "/pagina_rh/grades", label: "Grades" },
  { href: "/pagina_rh/regras_ponto", label: "Regras de Ponto" },
  { href: "/pagina_rh/gerar_pdf", label: "Gerar PDF" },
];

export default function MenuRH() {
  const [menuAberto, setMenuAberto] = useState(false);
  const pathname = usePathname();
  const router = useRouter();

  function sair() {
    localStorage.removeItem("cargoUsuario");
    router.replace("/");
  }

  return (
    <>
      <header className="rhCabecalho">
        <div className="rhMarca">
          <div className="rhLogo">BP</div>
          <strong>BatePonto</strong>
          <span>•</span>
          <b>RECURSOS HUMANOS</b>
        </div>

        <button
          type="button"
          className="rhMenuBotao"
          aria-label={menuAberto ? "Fechar menu" : "Abrir menu"}
          aria-expanded={menuAberto}
          onClick={() => setMenuAberto((aberto) => !aberto)}
        >
          {menuAberto ? "×" : "☰"}
        </button>

        <div className="rhUsuario">
          <strong>Recursos Humanos</strong>
          <small>Gestão de Pessoas</small>
          <button type="button" onClick={sair}>SAIR</button>
        </div>
      </header>

      <nav className={`rhNav ${menuAberto ? "rhMenuAberto" : ""}`}>
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
        <span>Fechamento Mensal</span>
        <span>Relatórios</span>
      </nav>
    </>
  );
}
