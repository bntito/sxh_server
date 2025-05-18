const dotenv = require("dotenv");
dotenv.config({ path: './src/.env' }); // Ruta explícita al archivo .env en la carpeta src

const express = require("express");
const mysql = require("mysql2");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json());

const db = mysql.createConnection({
  host: process.env.DB_HOST || "",
  user: process.env.DB_USER || "",
  password: process.env.DB_PASS || "",
  database: process.env.DB_NAME || "",
});

db.connect((err) => {
  if (err) {
    console.error("Error de conexión:", err);
  } else {
    console.log("📡 Conectado a MySQL");

    // Crear la tabla si no existe
    const createTableQuery = `
      CREATE TABLE IF NOT EXISTS participantes (
        id INT AUTO_INCREMENT PRIMARY KEY,
        nombre VARCHAR(255) NOT NULL,
        whatsapp VARCHAR(255),
        numeroRifa VARCHAR(255),
        fecha DATE
      );
    `;
    
    db.query(createTableQuery, (err, results) => {
      if (err) {
        console.error("Error al crear la tabla de participantes:", err);
      } else {
        console.log("✅ Tabla 'participantes' verificada o creada");
      }
    });
  }
});

// Rutas para los participantes
app.get("/participantes", (req, res) => {
  db.query("SELECT * FROM participantes", (err, results) => {
    if (err) return res.status(500).json(err);
    res.json(results);
  });
});

app.post("/participantes", (req, res) => {
  const { nombre, whatsapp, numeroRifa, fecha } = req.body;
  if (!nombre || !whatsapp || !numeroRifa || !fecha) {
    return res.status(400).json({ error: "Todos los campos son requeridos" });
  }

  db.query(
    "INSERT INTO participantes (nombre, whatsapp, numeroRifa, fecha) VALUES (?, ?, ?, ?)",
    [nombre, whatsapp, numeroRifa, fecha],
    (err) => {
      if (err) return res.status(500).json(err);
      res.json({ message: "Participante agregado" });
    }
  );
});

app.delete("/participantes/:id", (req, res) => {
  const { id } = req.params;
  db.query("DELETE FROM participantes WHERE id = ?", [id], (err) => {
    if (err) return res.status(500).json(err);
    res.json({ message: "Participante eliminado" });
  });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Servidor en http://localhost:${PORT}`));
