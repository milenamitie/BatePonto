"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import MenuRH from "@/app/components/MenuRH";

type Servidor = {
  id: number;
  nome_completo: string;
  matricula: string;
  cargo: string;
  regime: string;
  materia?: string | null;
  email_institucional?: string;
};

type Registro = {
  id: number;
  servidor_id: number;
  nome_completo: string;
  data: string;
  entrada: string | null;
  saida: string | null;
  horario_previsto: string | null;
  atraso_minutos: number;
  status: string;
};

const TIME_ZONE = "America/Sao_Paulo";

function chaveMes(data: string) {
  return data.slice(0, 7);
}

function nomeMes(chave: string) {
  const [ano, mes] = chave.split("-").map(Number);
  return new Date(ano, mes - 1, 1).toLocaleDateString("pt-BR", {
    month: "long",
    year: "numeric",
  });
}

function dataAtualSaoPaulo() {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: TIME_ZONE,
    year: "numeric",
    month: "2-digit",
  }).format(new Date());
}

function formatarData(data: string) {
  const [ano, mes, dia] = data.split("-");
  return `${dia}/${mes}/${ano}`;
}

function diaSemana(data: string) {
  const [ano, mes, dia] = data.split("-").map(Number);
  return new Date(ano, mes - 1, dia).toLocaleDateString("pt-BR", {
    weekday: "short",
  }).replace(".", "");
}

function minutosTrabalhados(entrada: string | null, saida: string | null) {
  if (!entrada || !saida) return 0;
  const [h1, m1] = entrada.split(":").map(Number);
  const [h2, m2] = saida.split(":").map(Number);
  const total = h2 * 60 + m2 - (h1 * 60 + m1);
  return Math.max(0, total);
}

function formatarDuracao(minutos: number) {
  const horas = Math.floor(minutos / 60);
  const resto = minutos % 60;
  return `${horas}h${String(resto).padStart(2, "0")}m`;
}

function statusRegistro(registro: Registro) {
  if (registro.status === "Falta") return "Falta";
  if (registro.status === "Atrasado") return "Atrasado";
  if (registro.status === "Sem grade") return "Sem grade";
  if (registro.entrada && !registro.saida) return "Em andamento";
  if (registro.entrada && registro.saida) return "Regular";
  return registro.status || "Sem registro";
}

export default function GerarPdfPage() {
  const router = useRouter();
  const [servidores, setServidores] = useState<Servidor[]>([]);
  const [servidorId, setServidorId] = useState<number | null>(null);
  const [servidor, setServidor] = useState<Servidor | null>(null);
  const [registros, setRegistros] = useState<Registro[]>([]);
  const [mesSelecionado, setMesSelecionado] = useState(dataAtualSaoPaulo());
  const [mostrarPrevia, setMostrarPrevia] = useState(true);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");
  const [baixando, setBaixando] = useState(false);

  useEffect(() => {
    const cargoUsuario = localStorage.getItem("cargoUsuario");
    if (cargoUsuario !== "RH") {
      router.replace("/");
      return;
    }

    async function carregar() {
      try {
        const [servidoresResposta, registrosResposta] = await Promise.all([
          fetch("/api/servidores"),
          fetch("/api/registros_ponto"),
        ]);

        if (!servidoresResposta.ok || !registrosResposta.ok) {
          throw new Error("Não foi possível consultar os dados dos professores.");
        }

        const servidoresDados: Servidor[] = await servidoresResposta.json();
        const registrosDados: Registro[] = await registrosResposta.json();
        const professores = servidoresDados.filter((item) =>
          (item.cargo || "").toLocaleLowerCase("pt-BR").includes("professor") || Boolean(item.materia)
        );
        setServidores(professores);
        setServidorId(professores[0]?.id ?? null);
        setRegistros(registrosDados);
      } catch (e) {
        setErro(e instanceof Error ? e.message : "Erro ao carregar os dados.");
      } finally {
        setCarregando(false);
      }
    }

    carregar();
  }, [router]);

  useEffect(() => {
    setServidor(servidores.find((item) => item.id === servidorId) || null);
  }, [servidores, servidorId]);

  const registrosDoServidor = useMemo(
    () => registros.filter((registro) => registro.servidor_id === servidorId),
    [registros, servidorId]
  );

  const mesesDisponiveis = useMemo(() => {
    const meses = new Set(registrosDoServidor.map((registro) => chaveMes(registro.data)));
    meses.add(dataAtualSaoPaulo());
    return Array.from(meses).sort((a, b) => b.localeCompare(a));
  }, [registrosDoServidor]);

  const registrosDoMes = useMemo(() => registrosDoServidor
    .filter((registro) => chaveMes(registro.data) === mesSelecionado)
    .sort((a, b) => a.data.localeCompare(b.data) || a.id - b.id),
  [registrosDoServidor, mesSelecionado]);

  const resumo = useMemo(() => ({
    totalMinutos: registrosDoMes.reduce(
      (soma, registro) => soma + minutosTrabalhados(registro.entrada, registro.saida), 0
    ),
    diasRegistrados: new Set(registrosDoMes.map((registro) => registro.data)).size,
    atrasos: registrosDoMes.filter((registro) => registro.atraso_minutos > 0).length,
    minutosAtraso: registrosDoMes.reduce((soma, registro) => soma + (registro.atraso_minutos || 0), 0),
  }), [registrosDoMes]);

  function baixarPdf() {
    if (!servidor || baixando) return;
    const servidorAtual = servidor;
    setBaixando(true);

    try {
      const largura = 595.28;
      const altura = 841.89;
      const margem = 40;
      const colW = (largura - margem * 2) / 3;
      const vermelho = "0.78 0.02 0.02";
      const cinza = "0.42 0.42 0.42";
      const preto = "0.08 0.08 0.08";
      const paginas: string[] = [];
      let comandos = "";
      let y = 0;

      const pdfString = (valor: string) => {
        const mapa: Record<number, number> = {
          0x20ac: 128, 0x201a: 130, 0x0192: 131, 0x201e: 132, 0x2026: 133,
          0x2020: 134, 0x2021: 135, 0x02c6: 136, 0x2030: 137, 0x0160: 138,
          0x2039: 139, 0x0152: 140, 0x017d: 142, 0x2018: 145, 0x2019: 146,
          0x201c: 147, 0x201d: 148, 0x2022: 149, 0x2013: 150, 0x2014: 151,
          0x02dc: 152, 0x2122: 153, 0x0161: 154, 0x203a: 155, 0x0153: 156,
          0x017e: 158, 0x0178: 159,
        };
        let resultado = "";
        for (const caractere of valor) {
          const codigo = caractere.codePointAt(0) || 63;
          const byte = mapa[codigo] ?? (codigo <= 255 ? codigo : 63);
          if (byte === 40 || byte === 41 || byte === 92) resultado += `\\${String.fromCharCode(byte)}`;
          else if (byte < 32 || byte > 126) resultado += `\\${byte.toString(8).padStart(3, "0")}`;
          else resultado += String.fromCharCode(byte);
        }
        return `(${resultado})`;
      };

      const texto = (x: number, topo: number, tamanho: number, valor: string, negrito = false, cor = preto) => {
        comandos += `${cor} rg BT /${negrito ? "F2" : "F1"} ${tamanho} Tf 1 0 0 1 ${x.toFixed(2)} ${(altura - topo).toFixed(2)} Tm ${pdfString(valor)} Tj ET\n`;
      };
      const retangulo = (x: number, topo: number, w: number, h: number, cor: string) => {
        comandos += `${cor} rg ${x} ${(altura - topo - h).toFixed(2)} ${w} ${h} re f\n`;
      };
      const linha = (x1: number, topo: number, x2: number, cor = "0.86 0.86 0.86") => {
        comandos += `${cor} RG 0.6 w ${x1} ${(altura - topo).toFixed(2)} m ${x2} ${(altura - topo).toFixed(2)} l S\n`;
      };
      const iniciarPagina = () => {
        comandos = "";
        retangulo(0, 0, largura, 7, vermelho);
        retangulo(margem, 25, 34, 34, vermelho);
        texto(margem + 8, 47, 14, "BP", true, "1 1 1");
        texto(margem + 45, 39, 17, "BATEPONTO", true);
        texto(margem + 45, 54, 8, "SISTEMA DE FREQUENCIA ELETRONICA", true, cinza);
        texto(largura - margem - 150, 37, 10, "RELATORIO DE FREQUENCIA", true, vermelho);
        texto(largura - margem - 150, 52, 8, `Competencia: ${nomeMes(mesSelecionado)}`, false, cinza);
        texto(largura - margem - 150, 64, 8, `Emissao: ${new Date().toLocaleDateString("pt-BR", { timeZone: TIME_ZONE })}`, false, cinza);
        retangulo(margem, 78, largura - margem * 2, 2, vermelho);
        texto(margem, 101, 9, "DADOS DO SERVIDOR", true, vermelho);
        const dados = [
          ["NOME COMPLETO", servidorAtual.nome_completo || "—"],
          ["MATRICULA", servidorAtual.matricula || "—"],
          ["CARGO", servidorAtual.cargo || "—"],
          ["REGIME", servidorAtual.regime ? `${servidorAtual.regime} semanais` : "—"],
          ["AREA / DISCIPLINA", servidorAtual.materia || "Nao informada"],
          ["COMPETENCIA", nomeMes(mesSelecionado)],
        ];
        dados.forEach(([rotulo, valor], i) => {
          const col = i % 3;
          const row = Math.floor(i / 3);
          const dx = margem + col * colW;
          const dy = 119 + row * 37;
          texto(dx, dy, 7, rotulo, true, cinza);
          texto(dx, dy + 13, 9, valor.slice(0, 39), true);
        });
        linha(margem, 194, largura - margem);
        texto(margem, 214, 9, "RESUMO DA COMPETENCIA", true, vermelho);
        const resumoItens = [
          ["TEMPO REGISTRADO", formatarDuracao(resumo.totalMinutos)],
          ["DIAS COM REGISTRO", String(resumo.diasRegistrados)],
          ["DIAS COM ATRASO", String(resumo.atrasos)],
          ["TOTAL DE ATRASO", formatarDuracao(resumo.minutosAtraso)],
        ];
        const resumoW = (largura - margem * 2) / 4;
        resumoItens.forEach(([rotulo, valor], i) => {
          const dx = margem + i * resumoW;
          texto(dx, 234, 7, rotulo, true, cinza);
          texto(dx, 250, 12, valor, true);
        });
        texto(margem, 279, 9, "REGISTRO DE FREQUENCIA", true, vermelho);
        y = 294;
        desenharCabecalhoTabela();
      };
      const colunas = [
        { nome: "DATA", x: margem, w: 55 },
        { nome: "DIA", x: margem + 55, w: 43 },
        { nome: "PREVISTO", x: margem + 98, w: 76 },
        { nome: "ENTRADA", x: margem + 174, w: 76 },
        { nome: "SAIDA", x: margem + 250, w: 76 },
        { nome: "TOTAL", x: margem + 326, w: 72 },
        { nome: "SITUACAO", x: margem + 398, w: 117 },
      ];
      const desenharCabecalhoTabela = () => {
        retangulo(margem, y, largura - margem * 2, 19, "0.04 0.04 0.04");
        colunas.forEach((col) => texto(col.x + 5, y + 13, 7, col.nome, true, "1 1 1"));
        y += 19;
      };

      iniciarPagina();
      registrosDoMes.forEach((registro, indice) => {
        if (y > altura - 58) {
          texto(margem, altura - 25, 7, "Documento gerado pelo sistema BatePonto.", false, cinza);
          paginas.push(comandos);
          iniciarPagina();
        }
        const status = statusRegistro(registro);
        const valores = [
          formatarData(registro.data), diaSemana(registro.data), registro.horario_previsto || "—",
          registro.entrada || "—", registro.saida || "—",
          registro.entrada && registro.saida ? formatarDuracao(minutosTrabalhados(registro.entrada, registro.saida)) : "—",
          status,
        ];
        if (indice % 2 === 1) retangulo(margem, y, largura - margem * 2, 20, "0.96 0.96 0.96");
        valores.forEach((valor, i) => {
          const cor = i === 6 ? (status === "Regular" ? "0.00 0.48 0.31" : status === "Atrasado" ? "0.82 0.35 0.00" : status === "Falta" ? "0.82 0.00 0.00" : "0.35 0.35 0.35") : (i === 0 || i === 5 ? preto : cinza);
          texto(colunas[i].x + 5, y + 13, 8, valor.slice(0, 22), i === 0 || i === 5 || i === 6, cor);
        });
        linha(margem, y + 20, largura - margem);
        y += 20;
      });
      if (registrosDoMes.length === 0) {
        texto(margem + 8, y + 17, 9, "Nenhum registro de ponto encontrado nesta competencia.", false, cinza);
        y += 28;
      }
      texto(margem, altura - 25, 7, "Os horarios apresentados correspondem aos registros disponiveis no sistema.", false, cinza);
      paginas.push(comandos);

      const objetos: string[] = [];
      objetos.push("<< /Type /Catalog /Pages 2 0 R >>");
      objetos.push("");
      objetos.push("<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>");
      objetos.push("<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>");
      const referenciasPaginas: number[] = [];
      paginas.forEach((conteudo) => {
        const paginaId = objetos.length + 1;
        const streamId = paginaId + 1;
        referenciasPaginas.push(paginaId);
        objetos.push(`<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${largura} ${altura}] /Resources << /Font << /F1 3 0 R /F2 4 0 R >> >> /Contents ${streamId} 0 R >>`);
        objetos.push(`<< /Length ${conteudo.length} >>\nstream\n${conteudo}endstream`);
      });
      objetos[1] = `<< /Type /Pages /Kids [${referenciasPaginas.map((id) => `${id} 0 R`).join(" ")}] /Count ${paginas.length} >>`;
      let pdf = "%PDF-1.4\n% BatePonto\n";
      const offsets = [0];
      objetos.forEach((objeto, i) => {
        offsets.push(pdf.length);
        pdf += `${i + 1} 0 obj\n${objeto}\nendobj\n`;
      });
      const inicioXref = pdf.length;
      pdf += `xref\n0 ${objetos.length + 1}\n0000000000 65535 f \n`;
      offsets.slice(1).forEach((offset) => { pdf += `${String(offset).padStart(10, "0")} 00000 n \n`; });
      pdf += `trailer\n<< /Size ${objetos.length + 1} /Root 1 0 R >>\nstartxref\n${inicioXref}\n%%EOF`;

      const blob = new Blob([pdf], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `BatePonto-${(servidorAtual.nome_completo || "Professor").replace(/[^a-zA-Z0-9À-ÿ]+/g, "-")}-${mesSelecionado}.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch (e) {
      setErro(e instanceof Error ? e.message : "Não foi possível gerar o PDF.");
    } finally {
      setBaixando(false);
    }
  }

  if (carregando) return <div className="pdfCarregando">Carregando informações...</div>;

  return (
    <main className="pdfPagina">
      <div className="pdfNaoImprimir">
        <MenuRH />
        <div className="pdfBreadcrumb">
          <span>Sistema</span><span>/</span><span>Recursos Humanos</span><span>/</span><strong>Gerar PDF</strong>
        </div>
        <section className="pdfCabecalhoPagina">
          <div>
            <h1>Gerar PDF do RH</h1>
            <p>Escolha um professor para visualizar e exportar o relatório individual de frequência.</p>
          </div>
          <div className="pdfAcoes">
            <label className="pdfSeletorMes">
              <span className="pdfSomenteLeitor">Professor</span>
              <select value={servidorId ?? ""} onChange={(e) => setServidorId(Number(e.target.value) || null)}>
                {servidores.map((item) => <option key={item.id} value={item.id}>{item.nome_completo}</option>)}
              </select>
            </label>
            <label className="pdfSeletorMes">
              <span className="pdfSomenteLeitor">Mês de referência</span>
              <select value={mesSelecionado} onChange={(e) => setMesSelecionado(e.target.value)}>
                {mesesDisponiveis.map((mes) => <option key={mes} value={mes}>{nomeMes(mes)}</option>)}
              </select>
            </label>
            <button className="pdfBotaoSecundario" onClick={() => setMostrarPrevia((atual) => !atual)}>
              {mostrarPrevia ? "OCULTAR" : "MOSTRAR"}
            </button>
            <button className="pdfBotaoPrimario" onClick={baixarPdf} disabled={baixando || !servidor}>{baixando ? "GERANDO PDF..." : "↓ BAIXAR PDF"}</button>
          </div>
        </section>
        {erro && <p className="pdfErro">{erro}</p>}
        {!erro && servidores.length === 0 && <p className="pdfErro">Nenhum professor foi encontrado no cadastro.</p>}
      </div>

      {mostrarPrevia && !erro && servidor && (
        <section className="pdfAreaPrevia">
          <article className="pdfDocumento">
            <header className="pdfDocumentoTopo">
              <div className="pdfMarcaDocumento">
                <div className="pdfLogo">BP</div>
                <div><strong>BATEPONTO</strong><span>SISTEMA DE FREQUÊNCIA ELETRÔNICA</span></div>
              </div>
              <div className="pdfReferencia"><strong>BATEPONTO</strong><span>Competência: {nomeMes(mesSelecionado)}</span><span>Emissão: {new Date().toLocaleDateString("pt-BR", { timeZone: TIME_ZONE })}</span></div>
            </header>

            <section className="pdfDadosServidor">
              <h2>DADOS DO SERVIDOR</h2>
              <div className="pdfDadosGrid">
                <div><span>NOME COMPLETO</span><strong>{servidor?.nome_completo || "—"}</strong></div>
                <div><span>MATRÍCULA</span><strong>{servidor?.matricula || "—"}</strong></div>
                <div><span>CARGO</span><strong>{servidor?.cargo || "—"}</strong></div>
                <div><span>REGIME</span><strong>{servidor?.regime ? `${servidor.regime} semanais` : "—"}</strong></div>
                <div><span>ÁREA / DISCIPLINA</span><strong>{servidor?.materia || "Não informada"}</strong></div>
                <div><span>COMPETÊNCIA</span><strong>{nomeMes(mesSelecionado)}</strong></div>
              </div>
            </section>

            <section className="pdfResumo">
              <div><span>TEMPO REGISTRADO</span><strong>{formatarDuracao(resumo.totalMinutos)}</strong></div>
              <div><span>DIAS COM REGISTRO</span><strong>{resumo.diasRegistrados}</strong></div>
              <div><span>DIAS COM ATRASO</span><strong>{resumo.atrasos}</strong></div>
              <div><span>TOTAL DE ATRASO</span><strong>{formatarDuracao(resumo.minutosAtraso)}</strong></div>
            </section>

            <section className="pdfTabelaSecao">
              <h2>REGISTRO DE FREQUÊNCIA</h2>
              <div className="pdfTabelaRolagem">
                <table className="pdfTabela">
                  <thead><tr><th>DATA</th><th>DIA</th><th>PREVISTO</th><th>ENTRADA</th><th>SAÍDA</th><th>TOTAL</th><th>SITUAÇÃO</th></tr></thead>
                  <tbody>
                    {registrosDoMes.length === 0 ? (
                      <tr><td colSpan={7} className="pdfTabelaVazia">Nenhum registro de ponto encontrado nesta competência.</td></tr>
                    ) : registrosDoMes.map((registro) => {
                      const status = statusRegistro(registro);
                      return <tr key={registro.id}>
                        <td><strong>{formatarData(registro.data)}</strong></td>
                        <td>{diaSemana(registro.data)}</td>
                        <td>{registro.horario_previsto || "—"}</td>
                        <td>{registro.entrada || "—"}{registro.atraso_minutos > 0 && <small className="pdfAtraso">+{registro.atraso_minutos} min</small>}</td>
                        <td>{registro.saida || "—"}</td>
                        <td className="pdfTotal">{registro.entrada && registro.saida ? formatarDuracao(minutosTrabalhados(registro.entrada, registro.saida)) : "—"}</td>
                        <td><span className={`pdfStatus ${status === "Regular" ? "regular" : status === "Atrasado" ? "atrasado" : status === "Falta" ? "falta" : status === "Sem grade" ? "semGrade" : "pendente"}`}>{status}</span></td>
                      </tr>;
                    })}
                  </tbody>
                </table>
              </div>
            </section>

            <footer className="pdfRodapeDocumento">
              <span>Documento gerado pelo sistema BatePonto.</span>
              <span>Os horários apresentados correspondem aos registros disponíveis no sistema.</span>
            </footer>
          </article>
        </section>
      )}
    </main>
  );
}
