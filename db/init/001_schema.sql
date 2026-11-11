CREATE TABLE IF NOT EXISTS servidores (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  nome_completo VARCHAR(255) NOT NULL,
  cpf VARCHAR(14) NOT NULL,
  matricula VARCHAR(50) NOT NULL,
  cargo VARCHAR(100) NOT NULL,
  materia VARCHAR(150) NULL,
  regime VARCHAR(100) NOT NULL,
  data_admissao DATE NOT NULL,
  email_institucional VARCHAR(255) NOT NULL,
  status VARCHAR(30) NOT NULL DEFAULT 'Ativo',
  PRIMARY KEY (id),
  UNIQUE KEY uq_servidores_cpf (cpf),
  UNIQUE KEY uq_servidores_matricula (matricula),
  UNIQUE KEY uq_servidores_email (email_institucional)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS usuarios (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  email VARCHAR(255) NOT NULL,
  senha VARCHAR(255) NOT NULL,
  cargo VARCHAR(30) NOT NULL,
  servidor_id INT UNSIGNED NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uq_usuarios_email (email),
  KEY idx_usuarios_servidor_id (servidor_id),
  CONSTRAINT fk_usuarios_servidor
    FOREIGN KEY (servidor_id) REFERENCES servidores (id)
    ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS grades_aulas (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  servidor_id INT UNSIGNED NOT NULL,
  disciplina VARCHAR(150) NOT NULL,
  turma VARCHAR(100) NOT NULL,
  sala VARCHAR(100) NOT NULL,
  dia_semana VARCHAR(20) NOT NULL,
  hora_inicio TIME NOT NULL,
  hora_fim TIME NOT NULL,
  status VARCHAR(30) NOT NULL DEFAULT 'Ativo',
  PRIMARY KEY (id),
  KEY idx_grades_servidor_dia_status (servidor_id, dia_semana, status),
  CONSTRAINT fk_grades_servidor
    FOREIGN KEY (servidor_id) REFERENCES servidores (id)
    ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS registros_ponto (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  servidor_id INT UNSIGNED NOT NULL,
  data DATE NOT NULL,
  entrada TIME NULL,
  saida TIME NULL,
  horario_previsto TIME NULL,
  atraso_minutos INT NOT NULL DEFAULT 0,
  status VARCHAR(30) NOT NULL,
  PRIMARY KEY (id),
  KEY idx_registros_servidor_data (servidor_id, data),
  CONSTRAINT fk_registros_servidor
    FOREIGN KEY (servidor_id) REFERENCES servidores (id)
    ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS solicitacoes (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  servidor_id INT UNSIGNED NOT NULL,
  tipo VARCHAR(30) NOT NULL,
  data DATE NOT NULL,
  motivo TEXT NOT NULL,
  horario_compensacao VARCHAR(100) NULL,
  observacoes TEXT NULL,
  horas VARCHAR(20) NULL,
  anexos JSON NULL,
  status VARCHAR(30) NOT NULL DEFAULT 'Pendente',
  criada_em DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  gestor_usuario_id INT UNSIGNED NULL,
  decisao_observacao TEXT NULL,
  decidida_em DATETIME NULL,
  PRIMARY KEY (id),
  KEY idx_solicitacoes_servidor (servidor_id),
  KEY idx_solicitacoes_status_criada (status, criada_em),
  CONSTRAINT fk_solicitacoes_servidor
    FOREIGN KEY (servidor_id) REFERENCES servidores (id)
    ON DELETE CASCADE,
  CONSTRAINT fk_solicitacoes_gestor
    FOREIGN KEY (gestor_usuario_id) REFERENCES usuarios (id)
    ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS regras_ponto (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  tipo VARCHAR(30) NOT NULL,
  nome VARCHAR(255) NOT NULL,
  valor VARCHAR(100) NOT NULL,
  unidade VARCHAR(50) NOT NULL DEFAULT '',
  editavel BOOLEAN NOT NULL DEFAULT FALSE,
  PRIMARY KEY (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

ALTER TABLE registros_ponto
  MODIFY COLUMN entrada TIME NULL;

ALTER TABLE solicitacoes
  MODIFY COLUMN horario_compensacao VARCHAR(100) NULL;
