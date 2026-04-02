const db = require("./db");
const bcrypt = require("bcryptjs");

async function crearUsuario() {
  try {
    const nombre = "Barbero";
    const email = "isibarber4@gmail.com";
    const passwordPlano = "barber_enano";

    const hash = await bcrypt.hash(passwordPlano, 10);

    await db.query(
      "INSERT INTO usuarios (nombre, email, password, rol, activo) VALUES (?, ?, ?, ?, ?)",
      [nombre, email, hash, "barbero", 1]
    );

    console.log("Usuario creado correctamente ✅");
  } catch (err) {
    console.error("Error creando usuario:", err);
  } finally {
    process.exit();
  }
}

crearUsuario();