CREATE DATABASE IF NOT EXISTS bateponto;
USE bateponto;

CREATE TABLE IF NOT EXISTS servidores (
	id INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
	nome_completo VARCHAR(150) NOT NULL,
	cpf VARCHAR(14) NOT NULL UNIQUE,
	matricula VARCHAR(40) NOT NULL UNIQUE,
	cargo VARCHAR(100) NOT NULL,
	materia VARCHAR(100),
	regime VARCHAR(60) NOT NULL,
	data_admissao DATE NOT NULL,
	email_institucional VARCHAR(254) NOT NULL UNIQUE,
	status VARCHAR(20) NOT NULL DEFAULT 'Ativo'
);

CREATE TABLE IF NOT EXISTS usuarios (
	id INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
	email VARCHAR(254) NOT NULL UNIQUE,
	senha VARCHAR(255) NOT NULL,
	cargo VARCHAR(100) NOT NULL,
	servidor_id INT UNSIGNED
);

CREATE TABLE IF NOT EXISTS grades_aulas (
	id INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
	servidor_id INT UNSIGNED NOT NULL,
	disciplina VARCHAR(100) NOT NULL,
	turma VARCHAR(80) NOT NULL,
	sala VARCHAR(40) NOT NULL,
	dia_semana VARCHAR(20) NOT NULL,
	hora_inicio TIME NOT NULL,
	hora_fim TIME NOT NULL,
	status VARCHAR(20) NOT NULL DEFAULT 'Ativo',
	INDEX idx_grades_servidor_dia (servidor_id, dia_semana, status)
);

CREATE TABLE IF NOT EXISTS registros_ponto (
	id INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
	servidor_id INT UNSIGNED NOT NULL,
	data DATE NOT NULL,
	entrada TIME NOT NULL,
	saida TIME,
	horario_previsto TIME,
	atraso_minutos INT UNSIGNED NOT NULL DEFAULT 0,
	status VARCHAR(30) NOT NULL,
	UNIQUE KEY uq_registro_servidor_data (servidor_id, data),
	INDEX idx_registros_data (data)
);

CREATE TABLE IF NOT EXISTS regras_ponto (
	id INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
	tipo VARCHAR(30) NOT NULL,
	nome VARCHAR(120) NOT NULL,
	valor VARCHAR(50) NOT NULL,
	unidade VARCHAR(30) NOT NULL DEFAULT '',
	editavel BOOLEAN NOT NULL DEFAULT TRUE
);

INSERT IGNORE INTO usuarios (email, senha, cargo)
VALUES ('rh@instituicao.sp.gov.br', '987654', 'RH');
