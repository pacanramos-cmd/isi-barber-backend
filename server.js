// server.js — Servidor principal The Isi Barber Shop
require("dotenv").config();
const express  = require("express");
const cors     = require("cors");
const bcrypt   = require("bcryptjs");
const jwt      = require("jsonwebtoken");
const db       = require("./db");

const app  = express();
const PORT = process.env.PORT || 4000;

// ── Middlewares ───────────────────────────────────────────────
app.use(cors({
  origin: '*',
  credentials: false,
}));
app.use(express.json());

// ── Middleware de autenticacion ───────────────────────────────
const auth = (req, res, next) => {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) return res.status(401).json({ error: "Token requerido" });
  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET);
    next();
  } catch {
    res.status(401).json({ error: "Token invalido" });
  }
};

// ══════════════════════════════════════════════════════════════
//  AUTH
// ══════════════════════════════════════════════════════════════
app.post("/api/auth/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    const [rows] = await db.query(
      "SELECT * FROM usuarios WHERE email = ? AND activo = 1", [email]
    );
    if (rows.length === 0)
      return res.status(401).json({ error: "Credenciales incorrectas" });

    const usuario = rows[0];
    const valido = await bcrypt.compare(password, usuario.password);
    if (!valido)
      return res.status(401).json({ error: "Credenciales incorrectas" });

    const token = jwt.sign(
      { id: usuario.id, rol: usuario.rol },
      process.env.JWT_SECRET || "secreto123",
      { expiresIn: "8h" }
    );
    res.json({ token, nombre: usuario.nombre });
  } catch (err) {
    console.error("Error login:", err);
    res.status(500).json({ error: "Error del servidor" });
  }
});

// POST /api/auth/cambiar-password
app.post("/api/auth/cambiar-password", auth, async (req, res) => {
  try {
    const { passwordActual, passwordNueva } = req.body;
    const [rows] = await db.query("SELECT * FROM usuarios WHERE id = ?", [req.user.id]);
    if (rows.length === 0) return res.status(404).json({ error: "Usuario no encontrado" });

    const valido = await bcrypt.compare(passwordActual, rows[0].password);
    if (!valido) return res.status(401).json({ error: "Contrasena actual incorrecta" });

    const hash = await bcrypt.hash(passwordNueva, 10);
    await db.query("UPDATE usuarios SET password = ? WHERE id = ?", [hash, req.user.id]);
    res.json({ mensaje: "Contrasena actualizada" });
  } catch (err) {
    console.error("Error cambiando contrasena:", err);
    res.status(500).json({ error: "Error del servidor" });
  }
});

// ══════════════════════════════════════════════════════════════
//  HORARIOS
// ══════════════════════════════════════════════════════════════
app.get("/api/horarios/ocupados", async (req, res) => {
  const { fecha } = req.query;
  if (!fecha) return res.status(400).json({ error: "Fecha requerida" });
  const [rows] = await db.query(
    "SELECT hora FROM citas WHERE fecha = ? AND estado != 'cancelada'", [fecha]
  );
  res.json({ ocupadas: rows.map(r => r.hora) });
});

// ══════════════════════════════════════════════════════════════
//  CITAS
// ══════════════════════════════════════════════════════════════

// POST /api/citas — Crear nueva cita (publico)
app.post("/api/citas", async (req, res) => {
  const {
    nombre, telefono, fecha, hora, modalidad,
    zona_nombre, direccion, genero_tinte, color_tinte,
    servicios, precio_servs, precio_final, metodo_pago,
  } = req.body;

  if (!nombre || !telefono || !fecha || !hora || !modalidad || !metodo_pago)
    return res.status(400).json({ error: "Faltan campos requeridos" });

  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();

    const [ocupadas] = await conn.query(
      "SELECT id FROM citas WHERE fecha = ? AND hora = ? AND estado != 'cancelada'",
      [fecha, hora]
    );
    if (ocupadas.length > 0) {
      await conn.rollback();
      return res.status(409).json({ error: "Esta hora ya fue reservada. Por favor elige otra hora." });
    }

    let clienteId;
    const [clientes] = await conn.query("SELECT id FROM clientes WHERE telefono = ?", [telefono]);
    if (clientes.length > 0) {
      clienteId = clientes[0].id;
      await conn.query("UPDATE clientes SET nombre = ? WHERE id = ?", [nombre, clienteId]);
    } else {
      const [result] = await conn.query(
        "INSERT INTO clientes (nombre, telefono) VALUES (?, ?)", [nombre, telefono]
      );
      clienteId = result.insertId;
    }

    let zonaId = null;
    if (modalidad === "domicilio" && zona_nombre) {
      const [zonas] = await conn.query("SELECT id FROM zonas_domicilio WHERE nombre = ?", [zona_nombre]);
      zonaId = zonas[0]?.id || null;
    }

    const [citaResult] = await conn.query(
      `INSERT INTO citas
       (cliente_id, fecha, hora, modalidad, zona_id, direccion, genero_tinte, color_tinte, precio_servs, precio_final, metodo_pago)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [clienteId, fecha, hora, modalidad, zonaId, direccion || null,
       genero_tinte || null, color_tinte || null,
       precio_servs, precio_final, metodo_pago]
    );
    const citaId = citaResult.insertId;

    for (const [servicioId, cantidad] of Object.entries(servicios)) {
      if (cantidad > 0) {
        await conn.query(
          "INSERT INTO cita_servicios (cita_id, servicio_id, cantidad) VALUES (?, ?, ?)",
          [citaId, Number(servicioId), cantidad]
        );
      }
    }

    await conn.commit();
    res.status(201).json({ mensaje: "Cita creada exitosamente", citaId });
  } catch (err) {
    await conn.rollback();
    console.error("Error creando cita:", err);
    res.status(500).json({ error: "Error interno del servidor" });
  } finally {
    conn.release();
  }
});

// GET /api/citas — Listar citas (solo barbero)
app.get("/api/citas", auth, async (req, res) => {
  const { fecha, estado } = req.query;
  let query = "SELECT * FROM vista_citas WHERE 1=1";
  const params = [];
  if (fecha)  { query += " AND fecha = ?";  params.push(fecha); }
  if (estado) { query += " AND estado = ?"; params.push(estado); }
  query += " ORDER BY fecha ASC, hora ASC";
  const [rows] = await db.query(query, params);
  res.json(rows);
});

// PATCH /api/citas/:id/estado — Cambiar estado (solo barbero)
app.patch("/api/citas/:id/estado", auth, async (req, res) => {
  const { estado } = req.body;
  const estados = ["pendiente", "confirmada", "atendida", "cancelada"];
  if (!estados.includes(estado))
    return res.status(400).json({ error: "Estado invalido" });
  await db.query("UPDATE citas SET estado = ? WHERE id = ?", [estado, req.params.id]);
  res.json({ mensaje: "Estado actualizado" });
});

// DELETE /api/citas/:id — Eliminar cita (solo barbero)
app.delete("/api/citas/:id", auth, async (req, res) => {
  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();
    // Eliminar servicios relacionados primero
    await conn.query("DELETE FROM cita_servicios WHERE cita_id = ?", [req.params.id]);
    // Eliminar la cita
    await conn.query("DELETE FROM citas WHERE id = ?", [req.params.id]);
    await conn.commit();
    res.json({ mensaje: "Cita eliminada" });
  } catch (err) {
    await conn.rollback();
    console.error("Error eliminando cita:", err);
    res.status(500).json({ error: "Error al eliminar la cita" });
  } finally {
    conn.release();
  }
});

// ══════════════════════════════════════════════════════════════
//  SERVICIOS
// ══════════════════════════════════════════════════════════════
app.get("/api/servicios", async (req, res) => {
  const [rows] = await db.query("SELECT * FROM servicios WHERE activo = 1");
  res.json(rows);
});

// ══════════════════════════════════════════════════════════════
//  HEALTH CHECK
// ══════════════════════════════════════════════════════════════
app.get("/api/health", (req, res) => {
  res.json({ status: "OK", mensaje: "The Isi Barber Shop API funcionando" });
});

// ══════════════════════════════════════════════════════════════
//  SETUP DB (solo ejecutar una vez)
// ══════════════════════════════════════════════════════════════
app.get("/api/setup", async (req, res) => {
  try {

    await db.query(`
      CREATE TABLE IF NOT EXISTS servicios (
        id INT PRIMARY KEY AUTO_INCREMENT,
        nombre VARCHAR(100) NOT NULL,
        precio INT NOT NULL,
        duracion INT NOT NULL,
        tiene_tinte TINYINT(1) NOT NULL DEFAULT 0,
        icono VARCHAR(10) NOT NULL DEFAULT '✂️',
        activo TINYINT(1) NOT NULL DEFAULT 1,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await db.query(`
      CREATE TABLE IF NOT EXISTS zonas_domicilio (
        id INT PRIMARY KEY AUTO_INCREMENT,
        nombre VARCHAR(50) NOT NULL,
        costo_adicional INT NOT NULL,
        activo TINYINT(1) NOT NULL DEFAULT 1
      );
    `);

    await db.query(`
      CREATE TABLE IF NOT EXISTS clientes (
        id INT PRIMARY KEY AUTO_INCREMENT,
        nombre VARCHAR(100) NOT NULL,
        telefono VARCHAR(20) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE KEY uq_telefono (telefono)
      );
    `);

    await db.query(`
      CREATE TABLE IF NOT EXISTS citas (
        id INT PRIMARY KEY AUTO_INCREMENT,
        cliente_id INT NOT NULL,
        fecha DATE NOT NULL,
        hora VARCHAR(15) NOT NULL,
        modalidad ENUM('presencial','domicilio') NOT NULL DEFAULT 'presencial',
        zona_id INT NULL,
        direccion VARCHAR(200) NULL,
        genero_tinte ENUM('hombre','mujer') NULL,
        color_tinte VARCHAR(50) NULL,
        precio_servs INT NOT NULL,
        precio_final INT NOT NULL,
        metodo_pago ENUM('efectivo','nequi','exclusiva') NOT NULL,
        estado ENUM('pendiente','confirmada','atendida','cancelada') NOT NULL DEFAULT 'pendiente',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await db.query(`
      CREATE TABLE IF NOT EXISTS cita_servicios (
        id INT PRIMARY KEY AUTO_INCREMENT,
        cita_id INT NOT NULL,
        servicio_id INT NOT NULL,
        cantidad INT NOT NULL DEFAULT 1
      );
    `);

    await db.query(`
      CREATE TABLE IF NOT EXISTS usuarios (
        id INT PRIMARY KEY AUTO_INCREMENT,
        nombre VARCHAR(100) NOT NULL,
        email VARCHAR(100) NOT NULL UNIQUE,
        password VARCHAR(255) NOT NULL,
        rol ENUM('admin','barbero') NOT NULL DEFAULT 'barbero',
        activo TINYINT(1) NOT NULL DEFAULT 1,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // DATOS INICIALES
    await db.query(`
      INSERT INTO servicios (nombre, precio, duracion, tiene_tinte, icono) VALUES
      ('Corte Sencillo',14000,30,0,'✂️'),
      ('Corte Sencillo + Cejas',15000,40,0,'✂️'),
      ('Corte Sencillo + Barba',18000,45,0,'🪒'),
      ('Corte Sencillo + Cejas + Barba',20000,55,0,'🪒'),
      ('Solo Tinte',30000,120,1,'🎨'),
      ('Corte Completo + Tinte',35000,150,1,'🎨'),
      ('Depilación de Cejas',12000,15,0,'👁️');
    `);

    await db.query(`
      INSERT INTO zonas_domicilio (nombre, costo_adicional) VALUES
      ('Sur',30000),('Norte',25000),('Occidente',20000),('Oriente',10000);
    `);

    res.json({ mensaje: "🔥 Base de datos lista en Railway" });

  } catch (error) {
    console.error("SETUP ERROR:", error);
    res.status(500).json({ error: "Error en setup" });
  }
});

// ── Iniciar servidor ──────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`\n The Isi Barber Shop Backend`);
  console.log(`- Servidor corriendo en http://localhost:${PORT}`);
  console.log(`- Rutas:`);
  console.log(`  POST   /api/auth/login`);
  console.log(`  POST   /api/auth/cambiar-password`);
  console.log(`  GET    /api/horarios/ocupados`);
  console.log(`  POST   /api/citas`);
  console.log(`  GET    /api/citas`);
  console.log(`  PATCH  /api/citas/:id/estado`);
  console.log(`  DELETE /api/citas/:id\n`);
});