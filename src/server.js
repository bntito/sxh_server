const dotenv = require("dotenv");
dotenv.config({ path: './src/.env' });

const express = require("express");
const mysql = require("mysql2");
const cors = require("cors");

const app = express();

app.use(cors({
  origin: ['https://simpleyespiritual.netlify.app', 'http://localhost:5173']
}));

app.use(express.json());

const pool = mysql.createPool({
  host: process.env.DB_HOST || "",
  user: process.env.DB_USER || "",
  password: process.env.DB_PASS || "",
  database: process.env.DB_NAME || "",
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

pool.getConnection((err, connection) => {
  if (err) {
    console.error("Error de conexión:", err);
    process.exit(1);
  }

  console.log("📡 Conectado a MySQL");

  const crearParticipantes = `
    CREATE TABLE IF NOT EXISTS participantes (
      id INT AUTO_INCREMENT PRIMARY KEY,
      nombre VARCHAR(255) NOT NULL,
      whatsapp VARCHAR(255),
      numeroRifa VARCHAR(255),
      fecha DATE,
      servidor VARCHAR(255)
    );
  `;

  const crearGanadores = `
    CREATE TABLE IF NOT EXISTS ganadores (
      id INT AUTO_INCREMENT PRIMARY KEY,
      nombre VARCHAR(255) NOT NULL,
      whatsapp VARCHAR(255),
      numeroRifa TEXT NOT NULL,
      fecha DATE,
      servidor VARCHAR(255)
    );
  `;

  connection.query(crearParticipantes, (err) => {
    if (err) {
      console.error("Error al crear tabla participantes:", err);
    } else {
      console.log("✅ Tabla 'participantes' lista");
    }
  });

  connection.query(crearGanadores, (err) => {
    connection.release();
    if (err) {
      console.error("Error al crear tabla ganadores:", err);
    } else {
      console.log("✅ Tabla 'ganadores' lista");
    }
  });
});

// === PARTICIPANTES ===

app.get("/participantes", (req, res) => {
  pool.query("SELECT * FROM participantes", (err, results) => {
    if (err) {
      console.error("Error en consulta participantes:", err);
      return res.status(500).json({ error: "Error al obtener participantes" });
    }
    res.json(results);
  });
});

app.post("/participantes", (req, res) => {
  const { nombre, whatsapp, numeroRifa, fecha, servidor } = req.body;

  if (!nombre || !whatsapp || !Array.isArray(numeroRifa) || !fecha || !servidor) {
    return res.status(400).json({ error: "Todos los campos son requeridos y numeroRifa debe ser un array" });
  }

  const values = numeroRifa.map((num) => [nombre, whatsapp, num, fecha, servidor]);

  pool.query(
    "INSERT INTO participantes (nombre, whatsapp, numeroRifa, fecha, servidor) VALUES ?",
    [values],
    (err) => {
      if (err) return res.status(500).json(err);
      res.json({ message: "Participantes agregados" });
    }
  );
});

app.delete("/participantes/:id", (req, res) => {
  const { id } = req.params;
  pool.query("DELETE FROM participantes WHERE id = ?", [id], (err) => {
    if (err) return res.status(500).json(err);
    res.json({ message: "Participante eliminado" });
  });
});

// === GANADORES ===

app.get("/ganadores", (req, res) => {
  pool.query("SELECT * FROM ganadores ORDER BY id DESC", (err, results) => {
    if (err) {
      console.error("Error al obtener ganadores:", err);
      return res.status(500).json({ error: "Error al obtener ganadores" });
    }
    res.json(results);
  });
});

app.post("/ganadores", (req, res) => {
  const { nombre, whatsapp, numeroRifa, fecha, servidor } = req.body;

  if (!nombre || !numeroRifa || !fecha) {
    return res.status(400).json({ error: "Faltan campos obligatorios" });
  }

  const numeros = Array.isArray(numeroRifa) ? numeroRifa.join(",") : numeroRifa;

  pool.query(
    "INSERT INTO ganadores (nombre, whatsapp, numeroRifa, fecha, servidor) VALUES (?, ?, ?, ?, ?)",
    [nombre, whatsapp, numeros, fecha, servidor],
    (err) => {
      if (err) return res.status(500).json(err);
      res.json({ message: "Ganador guardado" });
    }
  );
});

// === DESCARGA DE DATOS ===

app.get("/api/datos", (req, res) => {
  pool.query("SELECT * FROM participantes", (err, results) => {
    if (err) {
      console.error("Error al consultar participantes:", err);
      return res.status(500).json({ error: "Error al obtener datos" });
    }

    const data = JSON.stringify(results, null, 2);
    res.setHeader("Content-Disposition", "attachment; filename=participantes.json");
    res.setHeader("Content-Type", "application/json");
    res.send(data);
  });
});

// === TEST ===

app.get("/api/test-db", (req, res) => {
  pool.query("SELECT 1", (err) => {
    if (err) return res.status(500).send(err.message);
    res.send("DB ok");
  });
});

app.get('/api/ping', (req, res) => {
  res.status(200).send('pong');
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Servidor en http://localhost:${PORT}`));
