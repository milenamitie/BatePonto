"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function Sistema() {
  const router = useRouter();

  useEffect(() => {
    const cargo = localStorage.getItem("cargoUsuario");

    if (cargo !== "Gestor") {
      router.replace("/");
    }
  }, [router]);

  function sair() {
    localStorage.removeItem("cargoUsuario");
    router.replace("/");
  }

  return (
    <main className="gestorInicio">
      <header className="gestorInicioCabecalho">
        <div>
          <span>BATEPONTO</span>
          <h1>Área do gestor</h1>
          <p>Consulte as folhas de ponto dos funcionários.</p>
        </div>
        <button type="button" onClick={sair}>SAIR</button>
      </header>
      <section className="gestorInicioAcoes">
        <Link href="/pagina_gestao/acompanhamento">
          <span aria-hidden="true">▤</span>
          <strong>Folha de Ponto</strong>
          <small>Consultar, imprimir ou salvar as folhas mensais dos funcionários.</small>
          <b>ABRIR FOLHAS →</b>
        </Link>
      </section>
    </main>
  );
}