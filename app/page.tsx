"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function Home() {
  const router = useRouter();
  const [cargoSelecionado, setCargoSelecionado] = useState<string | null>(null);
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [mostrarErro, setMostrarErro] = useState(false);
  const [verificando, setVerificando] = useState(false);

  const acessarSistema = async () => {
    if (email === "" || senha === "" || cargoSelecionado === null) {
      setMostrarErro(true);
      return;
    }

    setMostrarErro(false);
    setVerificando(true);

    try {
      const resposta = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, senha, cargo: cargoSelecionado })
      });

      const resultado = await resposta.json();

      if (!resposta.ok) {
        setMostrarErro(true);
        setVerificando(false);
        return;
      }

      if (resultado.cargo === "Professor") {
        if (!resultado.servidorId) {
          setMostrarErro(true);
          setVerificando(false);
          return;
        }

        localStorage.setItem("servidorId", String(resultado.servidorId));
        router.push("/pagina_professor");
      }

      if (resultado.cargo === "Gestor") router.push("/pagina_gestao");
      if (resultado.cargo === "RH") router.push("/pagina_rh");
    } catch {
      setMostrarErro(true);
      setVerificando(false);
    }
  };

  return (
    <main className="pagina">

      <header className="cabecalho">
        <div className="logo">
          BP
        </div>

        <div>
          <h1>BatePonto</h1>
          <p>Sistema de Frequência Eletrônica</p>
        </div>
      </header>


      <section className="login">

        <p className="identificacao">
          IDENTIFICAÇÃO
        </p>

        <h2>Entrar</h2>

        <p className="descricao">
          Selecione seu cargo e insira suas credenciais.
        </p>


        <div className="cargos">

          <button
            className={cargoSelecionado === "Professor" ? "cargo selecionado" : "cargo"}
            onClick={() => setCargoSelecionado("Professor")}
          >
            🎓
            <strong>Professor</strong>
            <span>Docente</span>
          </button>

          <button
            className={cargoSelecionado === "Gestor" ? "cargo selecionado" : "cargo"}
            onClick={() => setCargoSelecionado("Gestor")}
          >
            🏛️
            <strong>Gestor</strong>
            <span>Coordenador / Diretor de Unidade</span>
          </button>

          <button
            className={cargoSelecionado === "RH" ? "cargo selecionado" : "cargo"}
            onClick={() => setCargoSelecionado("RH")}
          >
            👥
            <strong>Recursos Humanos</strong>
            <span>Setor de Gestão de Pessoas</span>
          </button>

        </div>


        <label>
          E-MAIL
        </label>

        <input
          type="email"
          placeholder="nome@instituicao.sp.gov.br"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />


        <label>
          SENHA
        </label>

        <input
          type="password"
          placeholder="••••••••"
          value={senha}
          onChange={(e) => setSenha(e.target.value)}
        />

        {mostrarErro && (
          <div className="erro">
            ⚠ Preencha cargo, e-mail e senha.
          </div>
        )}

        <button
          className="acessar"
          disabled={verificando}
          onClick={acessarSistema}
        >
          {verificando ? "VERIFICANDO..." : "ACESSAR SISTEMA"}
        </button>


        <p className="esqueci">
          Esqueceu a senha?
          <a href="/esqueci_senha"> Clique aqui</a>
        </p>

      </section>


      <footer>
        © 2026 • BatePonto • Uso institucional
      </footer>

    </main>
  );
}