"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

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
    <div>
      <h1>Bem-vindo ao sistema, gestor!</h1>
      <button onClick={sair}>SAIR</button>
    </div>
  );
}