require("dotenv").config();
const express = require("express");
const cors = require("cors");
const mysql = require("mysql2/promise");

const app = express();
app.use(cors({
  origin: "https://spontaneous-cactus-973254.netlify.app"
}));
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
  await pool.query(`
    CREATE TABLE IF NOT EXISTS imoveis (
      id INT AUTO_INCREMENT PRIMARY KEY,
      titulo TEXT,
      localizacao TEXT,
      preco DECIMAL(10,2),
      tipo TEXT,
      foto_url TEXT,
      proprietario_id INT,
      FOREIGN KEY (proprietario_id) REFERENCES usuarios(id)
    )
  `);
  await pool.query(`
    CREATE TABLE IF NOT EXISTS reservas (
      id INT AUTO_INCREMENT PRIMARY KEY,
      imovel_id INT,
      cliente_id INT,
      checkin DATE,
      checkout DATE,
      valor_total DECIMAL(10,2),
      FOREIGN KEY (imovel_id) REFERENCES imoveis(id),
      FOREIGN KEY (cliente_id) REFERENCES usuarios(id)
    )
  `);
  console.log("Tabelas verificadas/criadas com sucesso");
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
  const [rows] = await pool.query("SELECT id, nome, email, tipo_usuario FROM usuarios");
  res.json(rows);
});

app.put("/usuarios/:id", async (req, res) => {
  const { nome, email, senha } = req.body;
  try {
    await pool.query(
      "UPDATE usuarios SET nome=?, email=?, senha=? WHERE id=?",
      [nome, email, senha, req.params.id]
    );
    res.json({ mensagem: "Usuário atualizado!" });
  } catch (err) {
    res.status(400).json({ erro: "Erro ao atualizar usuário" });
  }
});

app.delete("/usuarios/:id", async (req, res) => {
  try {
    await pool.query("DELETE FROM usuarios WHERE id=?", [req.params.id]);
    res.json({ mensagem: "Usuário removido!" });
  } catch (err) {
    res.status(400).json({ erro: "Erro ao remover usuário" });
  }
});


app.get("/imoveis", async (req, res) => {
  const [rows] = await pool.query("SELECT * FROM imoveis");
  res.json(rows);
});

app.post("/imoveis", async (req, res) => {
  const { titulo, localizacao, preco, tipo, foto_url, proprietario_id } = req.body;
  try {
    await pool.query(
      "INSERT INTO imoveis (titulo, localizacao, preco, tipo, foto_url, proprietario_id) VALUES (?,?,?,?,?,?)",
      [titulo, localizacao, preco, tipo, foto_url, proprietario_id]
    );
    res.json({ mensagem: "Imóvel cadastrado!" });
  } catch (err) {
    res.status(400).json({ erro: "Erro ao cadastrar imóvel" });
  }
});

app.put("/imoveis/:id", async (req, res) => {
  const { titulo, localizacao, preco, tipo, foto_url } = req.body;
  try {
    await pool.query(
      "UPDATE imoveis SET titulo=?, localizacao=?, preco=?, tipo=?, foto_url=? WHERE id=?",
      [titulo, localizacao, preco, tipo, foto_url, req.params.id]
    );
    res.json({ mensagem: "Imóvel atualizado!" });
  } catch (err) {
    res.status(400).json({ erro: "Erro ao atualizar imóvel" });
  }
});

app.delete("/imoveis/:id", async (req, res) => {
  try {
    await pool.query("DELETE FROM imoveis WHERE id=?", [req.params.id]);
    res.json({ mensagem: "Imóvel removido!" });
  } catch (err) {
    res.status(400).json({ erro: "Erro ao remover imóvel" });
  }
});


app.get("/reservas/:cliente_id", async (req, res) => {
  const [rows] = await pool.query(
    `SELECT r.*, i.titulo, i.localizacao FROM reservas r 
     JOIN imoveis i ON r.imovel_id = i.id 
     WHERE r.cliente_id = ?`,
    [req.params.cliente_id]
  );
  res.json(rows);
});

app.post("/reservas", async (req, res) => {
  const { imovel_id, cliente_id, checkin, checkout } = req.body;
  try {
    const [imovel] = await pool.query("SELECT preco FROM imoveis WHERE id=?", [imovel_id]);
    const dias = Math.ceil((new Date(checkout) - new Date(checkin)) / (1000 * 60 * 60 * 24));
    const valor_total = imovel[0].preco * dias;
    await pool.query(
      "INSERT INTO reservas (imovel_id, cliente_id, checkin, checkout, valor_total) VALUES (?,?,?,?,?)",
      [imovel_id, cliente_id, checkin, checkout, valor_total]
    );
    res.json({ mensagem: "Reserva realizada!", valor_total });
  } catch (err) {
    res.status(400).json({ erro: "Erro ao realizar reserva" });
  }
});

app.delete("/reservas/:id", async (req, res) => {
  try {
    await pool.query("DELETE FROM reservas WHERE id=?", [req.params.id]);
    res.json({ mensagem: "Reserva cancelada!" });
  } catch (err) {
    res.status(400).json({ erro: "Erro ao cancelar reserva" });
  }
});

app.listen(process.env.PORT || 3000, () => {
  console.log("Servidor rodando");
});