require("dotenv").config();
const express = require("express");
const cors = require("cors");
const { Pool } = require("pg");

const app = express();
app.use(cors());
app.use(express.json());

// conexão com Railway PostgreSQL
const pool = new Pool({
 connectionString: process.env.DATABASE_URL,
 ssl: { rejectUnauthorized: false }
});

// CRIAR TABELA AUTOMATICAMENTE
async function initDB() {
 await pool.query(`
 CREATE TABLE IF NOT EXISTS usuarios (
 id SERIAL PRIMARY KEY,
 nome TEXT,
 email TEXT UNIQUE,
 senha TEXT,
 tipo_usuario TEXT
 )
 `);
}
initDB();

// CADASTRO
app.post("/cadastro", async (req, res) => {
 const { nome, email, senha, tipo_usuario } = req.body;

 try {
 await pool.query(
 "INSERT INTO usuarios (nome, email, senha, tipo_usuario) VALUES ($1,$2,$3,$4)",
 [nome, email, senha, tipo_usuario]
 );
 res.json({ mensagem: "Usuário cadastrado!" });
 } catch (err) {
 res.status(400).json({ erro: "Erro ao cadastrar (email já existe?)" });
 }
});

// LOGIN
app.post("/login", async (req, res) => {
 const { email, senha } = req.body;

 const result = await pool.query(
 "SELECT * FROM usuarios WHERE email=$1 AND senha=$2",
 [email, senha]
 );

 if (result.rows.length === 0) {
 return res.status(401).json({ erro: "Login inválido" });
 }

 res.json({ mensagem: "Login OK", usuario: result.rows[0] });
});

// LISTAR USUÁRIOS
app.get("/usuarios", async (req, res) => {
 const result = await pool.query("SELECT * FROM usuarios");
 res.json(result.rows);
});

app.listen(process.env.PORT || 3000, () => {
 console.log("Servidor rodando");
});