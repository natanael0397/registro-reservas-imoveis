require("dotenv").config();
const express = require("express");
const cors = require("cors");
const mysql = require("mysql2/promise");

const app = express();
app.use(cors());
app.use(express.json());

const pool = mysql.createPool({
  host: process.env.MYSQL_HOST,
  port: process.env.MYSQL_PORT,
  user: process.env.MYSQL_USER,
  password: process.env.MYSQL_PASSWORD,
  database: process.env.MYSQL_DATABASE,
  ssl: { rejectUnauthorized: false }
});

async function initDB() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS usuarios (
      id INT AUTO_INCREMENT PRIMARY KEY,
      nome TEXT,
      email VARCHAR(255) UNIQUE,
      senha TEXT,
      tipo_usuario TEXT
    )
  `);
  console.log("Tabela verificada/criada com sucesso");
}
initDB();

app.post("/cadastro", async (req, res) => {
  const { nome, email, senha, tipo_usuario } = req.body;
  try {
    await pool.query(
      "INSERT INTO usuarios (nome, email, senha, tipo_usuario) VALUES (?, ?, ?, ?)",
      [nome, email, senha, tipo_usuario]
    );
    res.json({ mensagem: "Usuário cadastrado!" });
  } catch (err) {
    res.status(400).json({ erro: "Erro ao cadastrar (email já existe?)" });
  }
});

app.post("/login", async (req, res) => {
  const { email, senha } = req.body;
  const [rows] = await pool.query(
    "SELECT * FROM usuarios WHERE email = ? AND senha = ?",
    [email, senha]
  );
  if (rows.length === 0) {
    return res.status(401).json({ erro: "Login inválido" });
  }
  res.json({ mensagem: "Login OK", usuario: rows[0] });
});

app.get("/usuarios", async (req, res) => {
  const [rows] = await pool.query("SELECT * FROM usuarios");
  res.json(rows);
});

app.listen(process.env.PORT || 3000, () => {
  console.log("Servidor rodando");
});