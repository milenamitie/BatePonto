import express from "express";
import mysql from "mysql2/promise";

const app = express();
const port = Number(process.env.PORT || 3000);
const db = mysql.createPool({
  host: process.env.DB_HOST || "db-bateponto",
  user: process.env.DB_USER || "bateponto",
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME || "bateponto",
  port: Number(process.env.DB_PORT || 3306),
  waitForConnections: true,
  connectionLimit: 10,
});

app.use(express.json());

app.get("/health", async (_request, response) => {
  try {
    await db.query("SELECT 1");
    response.json({ status: "ok" });
  } catch {
    response.status(503).json({ status: "unavailable" });
  }
});

app.post("/api/login", async (request, response) => {
  try {
    const { email, senha, cargo } = request.body;
    const [rows] = await db.execute(
      `SELECT id, email, senha, cargo, servidor_id
       FROM usuarios
       WHERE email = ? AND senha = ? AND cargo = ?
       LIMIT 1`,
      [email, senha, cargo]
    );
    if (rows.length === 0) {
      return response.status(401).json({ mensagem: "Login inválido" });
    }
    return response.json({
      mensagem: "Login autorizado",
      cargo: rows[0].cargo,
      usuarioId: rows[0].id,
      servidorId: rows[0].servidor_id,
    });
  } catch (error) {
    console.error(error);
    return response.status(500).json({ mensagem: "Erro ao conectar ao banco." });
  }
});

app.get("/api/grades", async (_request, response) => {
  try {
    const [rows] = await db.query(`
      SELECT g.id, g.servidor_id, s.nome_completo, g.disciplina, g.turma, g.sala,
             g.dia_semana, TIME_FORMAT(g.hora_inicio, '%H:%i') AS hora_inicio,
             TIME_FORMAT(g.hora_fim, '%H:%i') AS hora_fim, g.status
      FROM grades_aulas g
      INNER JOIN servidores s ON s.id = g.servidor_id
      ORDER BY FIELD(g.dia_semana, 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado', 'Domingo'), g.hora_inicio
    `);
    return response.json(rows);
  } catch {
    return response.status(500).json({ erro: "Erro ao buscar grades." });
  }
});

app.post("/api/grades", async (request, response) => {
  try {
    const { servidor_id, disciplina, turma, sala, dia_semana, hora_inicio, hora_fim, status } = request.body;
    if (!servidor_id || !disciplina || !turma || !sala || !dia_semana || !hora_inicio || !hora_fim) {
      return response.status(400).json({ erro: "Preencha todos os campos obrigatórios." });
    }
    if (hora_inicio >= hora_fim) {
      return response.status(400).json({ erro: "O horário de início deve ser anterior ao horário de término." });
    }
    const [result] = await db.query(
      `INSERT INTO grades_aulas
        (servidor_id, disciplina, turma, sala, dia_semana, hora_inicio, hora_fim, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [servidor_id, disciplina, turma, sala, dia_semana, hora_inicio, hora_fim, status || "Ativo"]
    );
    return response.json({ mensagem: "Grade cadastrada com sucesso.", id: result.insertId });
  } catch {
    return response.status(500).json({ erro: "Erro ao cadastrar grade." });
  }
});

app.put("/api/grades", async (request, response) => {
  try {
    const { id, servidor_id, disciplina, turma, sala, dia_semana, hora_inicio, hora_fim, status } = request.body;
    if (!id || !servidor_id || !disciplina || !turma || !sala || !dia_semana || !hora_inicio || !hora_fim) {
      return response.status(400).json({ erro: "Preencha todos os campos obrigatórios." });
    }
    if (hora_inicio >= hora_fim) {
      return response.status(400).json({ erro: "O horário de início deve ser anterior ao horário de término." });
    }
    await db.query(
      `UPDATE grades_aulas
       SET servidor_id = ?, disciplina = ?, turma = ?, sala = ?, dia_semana = ?,
           hora_inicio = ?, hora_fim = ?, status = ?
       WHERE id = ?`,
      [servidor_id, disciplina, turma, sala, dia_semana, hora_inicio, hora_fim, status || "Ativo", id]
    );
    return response.json({ mensagem: "Grade atualizada com sucesso." });
  } catch {
    return response.status(500).json({ erro: "Erro ao atualizar grade." });
  }
});

app.delete("/api/grades", async (request, response) => {
  try {
    const id = request.query.id;
    if (!id) {
      return response.status(400).json({ erro: "ID da grade é obrigatório." });
    }
    await db.query("DELETE FROM grades_aulas WHERE id = ?", [id]);
    return response.json({ mensagem: "Grade excluída com sucesso." });
  } catch {
    return response.status(500).json({ erro: "Erro ao excluir grade." });
  }
});

app.get("/api/registros_ponto", async (request, response) => {
  try {
    const { servidor_id: servidorId, data } = request.query;
    let sql = `
      SELECT rp.id, rp.servidor_id, s.nome_completo,
             DATE_FORMAT(rp.data, '%Y-%m-%d') AS data,
             TIME_FORMAT(rp.entrada, '%H:%i') AS entrada,
             TIME_FORMAT(rp.saida, '%H:%i') AS saida,
             TIME_FORMAT(rp.horario_previsto, '%H:%i') AS horario_previsto,
             rp.atraso_minutos, rp.status
      FROM registros_ponto rp
      INNER JOIN servidores s ON s.id = rp.servidor_id
      WHERE 1=1`;
    const params = [];
    if (servidorId) {
      sql += " AND rp.servidor_id = ?";
      params.push(Number(servidorId));
    }
    if (data) {
      sql += " AND rp.data = ?";
      params.push(data);
    }
    sql += " ORDER BY rp.data DESC, rp.id DESC";
    const [rows] = await db.query(sql, params);
    return response.json(rows);
  } catch {
    return response.status(500).json({ erro: "Erro ao buscar registros de ponto." });
  }
});

app.post("/api/registros_ponto", async (request, response) => {
  try {
    const { servidor_id, acao } = request.body;
    if (!servidor_id || !acao) {
      return response.status(400).json({ erro: "Servidor e ação são obrigatórios." });
    }
    const [records] = await db.query(
      `SELECT * FROM registros_ponto
       WHERE servidor_id = ? AND data = CURDATE()
       LIMIT 1`,
      [servidor_id]
    );
    const record = records[0];

    if (acao === "entrada") {
      if (record) {
        return response.status(400).json({ erro: "A entrada de hoje já foi registrada." });
      }
      const weekday = new Intl.DateTimeFormat("en-US", {
        weekday: "long",
        timeZone: "America/Sao_Paulo",
      }).format(new Date());
      const weekdays = {
        Monday: "Segunda",
        Tuesday: "Terça",
        Wednesday: "Quarta",
        Thursday: "Quinta",
        Friday: "Sexta",
        Saturday: "Sábado",
        Sunday: "Domingo",
      };
      const [gradeRows] = await db.query(
        `SELECT hora_inicio FROM grades_aulas
         WHERE servidor_id = ? AND dia_semana = ? AND status = 'Ativo'
         ORDER BY hora_inicio LIMIT 1`,
        [servidor_id, weekdays[weekday]]
      );
      const horarioPrevisto = gradeRows[0]?.hora_inicio
        ? String(gradeRows[0].hora_inicio).substring(0, 8)
        : null;
      const [timeRows] = await db.query("SELECT CURTIME() AS horario_atual");
      const horarioAtual = String(timeRows[0].horario_atual).substring(0, 8);
      const [horaReal, minutoReal] = horarioAtual.split(":").map(Number);
      const [horaPrevista, minutoPrevisto] = (horarioPrevisto || "00:00").split(":").map(Number);
      const atraso = horarioPrevisto
        ? Math.max(0, horaReal * 60 + minutoReal - (horaPrevista * 60 + minutoPrevisto))
        : 0;
      const status = horarioPrevisto ? (atraso > 0 ? "Atrasado" : "Regular") : "Sem grade";
      const [result] = await db.query(
        `INSERT INTO registros_ponto
          (servidor_id, data, entrada, horario_previsto, atraso_minutos, status)
         VALUES (?, CURDATE(), CURTIME(), ?, ?, ?)`,
        [servidor_id, horarioPrevisto, atraso, status]
      );
      return response.json({
        mensagem: atraso > 0
          ? `Entrada registrada com ${atraso} minuto(s) de atraso.`
          : "Entrada registrada com sucesso.",
        id: result.insertId,
        horario_previsto: horarioPrevisto,
        atraso_minutos: atraso,
        status,
      });
    }

    if (acao === "saida") {
      if (!record) {
        return response.status(400).json({ erro: "Nenhuma entrada foi registrada hoje." });
      }
      if (record.saida) {
        return response.status(400).json({ erro: "A saída de hoje já foi registrada." });
      }
      await db.query("UPDATE registros_ponto SET saida = CURTIME() WHERE id = ?", [record.id]);
      return response.json({ mensagem: "Saída registrada com sucesso." });
    }
    return response.status(400).json({ erro: "Ação inválida." });
  } catch {
    return response.status(500).json({ erro: "Erro ao registrar ponto." });
  }
});

app.get("/api/regras_ponto", async (_request, response) => {
  try {
    const [rows] = await db.query(
      "SELECT id, tipo, nome, valor, unidade, editavel FROM regras_ponto ORDER BY id ASC"
    );
    return response.json(rows);
  } catch (error) {
    console.error("Erro ao buscar regras:", error);
    return response.status(500).json({ erro: "Erro ao buscar regras de ponto." });
  }
});

app.put("/api/regras_ponto", async (request, response) => {
  try {
    const { id, valor } = request.body;
    if (!id || valor === undefined || valor === "") {
      return response.status(400).json({ erro: "Informe o ID e o valor da regra." });
    }
    const [result] = await db.query(
      "UPDATE regras_ponto SET valor = ? WHERE id = ? AND editavel = TRUE",
      [valor, id]
    );
    if (result.affectedRows === 0) {
      return response.status(400).json({ erro: "Regra não encontrada ou não editável." });
    }
    return response.json({ mensagem: "Regra atualizada com sucesso." });
  } catch (error) {
    console.error("Erro ao atualizar regra:", error);
    return response.status(500).json({ erro: "Erro ao atualizar regra." });
  }
});

app.get("/api/servidores", async (request, response) => {
  try {
    const busca = request.query.busca || "";
    let sql = `SELECT id, nome_completo, cpf, matricula, cargo, materia, regime,
                      DATE_FORMAT(data_admissao, '%Y-%m-%d') AS data_admissao,
                      email_institucional, status
               FROM servidores`;
    const values = [];
    if (busca) {
      sql += " WHERE nome_completo LIKE ? OR matricula LIKE ? OR email_institucional LIKE ?";
      const term = `%${busca}%`;
      values.push(term, term, term);
    }
    sql += " ORDER BY nome_completo ASC";
    const [rows] = await db.query(sql, values);
    return response.json(rows);
  } catch (error) {
    console.error("Erro ao buscar servidores:", error);
    return response.status(500).json({ erro: "Erro ao buscar servidores." });
  }
});

app.post("/api/servidores", async (request, response) => {
  try {
    const { nome_completo, cpf, matricula, cargo, materia, regime, data_admissao, email_institucional } = request.body;
    if (!nome_completo || !cpf || !matricula || !cargo || !regime || !data_admissao || !email_institucional) {
      return response.status(400).json({ erro: "Preencha todos os campos obrigatórios." });
    }
    const [result] = await db.query(
      `INSERT INTO servidores
        (nome_completo, cpf, matricula, cargo, materia, regime, data_admissao, email_institucional, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'Ativo')`,
      [nome_completo, cpf, matricula, cargo, materia || null, regime, data_admissao, email_institucional]
    );
    return response.status(201).json({ mensagem: "Servidor cadastrado com sucesso.", resultado: result });
  } catch (error) {
    console.error("Erro ao cadastrar servidor:", error);
    if (error.code === "ER_DUP_ENTRY") {
      return response.status(409).json({ erro: "CPF, matrícula ou e-mail institucional já cadastrado." });
    }
    return response.status(500).json({ erro: "Erro ao cadastrar servidor." });
  }
});

app.put("/api/servidores", async (request, response) => {
  try {
    const { id, nome_completo, matricula, cargo, materia, regime, data_admissao } = request.body;
    if (!id) {
      return response.status(400).json({ erro: "ID do servidor não informado." });
    }
    await db.query(
      `UPDATE servidores SET nome_completo = ?, matricula = ?, cargo = ?, materia = ?,
                             regime = ?, data_admissao = ? WHERE id = ?`,
      [nome_completo, matricula, cargo, materia || null, regime, data_admissao, id]
    );
    return response.json({ mensagem: "Servidor atualizado com sucesso." });
  } catch (error) {
    console.error("Erro ao editar servidor:", error);
    if (error.code === "ER_DUP_ENTRY") {
      return response.status(409).json({ erro: "A matrícula informada já está cadastrada." });
    }
    return response.status(500).json({ erro: "Erro ao atualizar servidor." });
  }
});

app.delete("/api/servidores", async (request, response) => {
  try {
    const id = request.query.id;
    if (!id) {
      return response.status(400).json({ erro: "ID do servidor não informado." });
    }
    await db.query("DELETE FROM servidores WHERE id = ?", [id]);
    return response.json({ mensagem: "Servidor excluído com sucesso." });
  } catch (error) {
    console.error(error);
    return response.status(500).json({ erro: "Erro ao excluir servidor." });
  }
});

app.listen(port, "0.0.0.0", () => {
  console.log(`BatePonto API listening on port ${port}`);
});