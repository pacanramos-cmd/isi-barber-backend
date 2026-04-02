-- ══════════════════════════════════════════════════════════════
--  THE ISI BARBER SHOP — Base de datos MySQL
--  Normalización: Tercera Forma Normal (3FN)
--  Autor: Pacande
-- ══════════════════════════════════════════════════════════════

CREATE DATABASE IF NOT EXISTS isi_barber_db
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE isi_barber_db;

-- ──────────────────────────────────────────────────────────────
-- TABLA 1: servicios
-- ──────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS servicios (
  id          INT           PRIMARY KEY AUTO_INCREMENT,
  nombre      VARCHAR(100)  NOT NULL,
  precio      INT           NOT NULL,
  duracion    INT           NOT NULL COMMENT 'Duración en minutos',
  tiene_tinte TINYINT(1)    NOT NULL DEFAULT 0,
  icono       VARCHAR(10)   NOT NULL DEFAULT '✂️',
  activo      TINYINT(1)    NOT NULL DEFAULT 1,
  created_at  TIMESTAMP     DEFAULT CURRENT_TIMESTAMP
);

-- ──────────────────────────────────────────────────────────────
-- TABLA 2: zonas_domicilio
-- ──────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS zonas_domicilio (
  id              INT           PRIMARY KEY AUTO_INCREMENT,
  nombre          VARCHAR(50)   NOT NULL,
  costo_adicional INT           NOT NULL,
  activo          TINYINT(1)    NOT NULL DEFAULT 1
);

-- ──────────────────────────────────────────────────────────────
-- TABLA 3: clientes
-- ──────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS clientes (
  id         INT          PRIMARY KEY AUTO_INCREMENT,
  nombre     VARCHAR(100) NOT NULL,
  telefono   VARCHAR(20)  NOT NULL,
  created_at TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_telefono (telefono)
);

-- ──────────────────────────────────────────────────────────────
-- TABLA 4: citas
-- ──────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS citas (
  id            INT          PRIMARY KEY AUTO_INCREMENT,
  cliente_id    INT          NOT NULL,
  fecha         DATE         NOT NULL,
  hora          VARCHAR(15)  NOT NULL,
  modalidad     ENUM('presencial','domicilio') NOT NULL DEFAULT 'presencial',
  zona_id       INT          NULL,
  direccion     VARCHAR(200) NULL,
  genero_tinte  ENUM('hombre','mujer') NULL,
  color_tinte   VARCHAR(50)  NULL,
  precio_servs  INT          NOT NULL,
  precio_final  INT          NOT NULL,
  metodo_pago   ENUM('efectivo','nequi','exclusiva') NOT NULL,
  estado        ENUM('pendiente','confirmada','atendida','cancelada') NOT NULL DEFAULT 'pendiente',
  created_at    TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (cliente_id) REFERENCES clientes(id),
  FOREIGN KEY (zona_id)    REFERENCES zonas_domicilio(id),
  UNIQUE KEY uq_fecha_hora (fecha, hora)
);

-- ──────────────────────────────────────────────────────────────
-- TABLA 5: cita_servicios (tabla intermedia)
-- ──────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS cita_servicios (
  id          INT PRIMARY KEY AUTO_INCREMENT,
  cita_id     INT NOT NULL,
  servicio_id INT NOT NULL,
  cantidad    INT NOT NULL DEFAULT 1,
  FOREIGN KEY (cita_id)     REFERENCES citas(id) ON DELETE CASCADE,
  FOREIGN KEY (servicio_id) REFERENCES servicios(id)
);

-- ──────────────────────────────────────────────────────────────
-- TABLA 6: usuarios (login del barbero)
-- ──────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS usuarios (
  id         INT          PRIMARY KEY AUTO_INCREMENT,
  nombre     VARCHAR(100) NOT NULL,
  email      VARCHAR(100) NOT NULL UNIQUE,
  password   VARCHAR(255) NOT NULL,
  rol        ENUM('admin','barbero') NOT NULL DEFAULT 'barbero',
  activo     TINYINT(1)   NOT NULL DEFAULT 1,
  created_at TIMESTAMP    DEFAULT CURRENT_TIMESTAMP
);

-- ══════════════════════════════════════════════════════════════
--  DATOS INICIALES
-- ══════════════════════════════════════════════════════════════
INSERT INTO servicios (nombre, precio, duracion, tiene_tinte, icono) VALUES
  ('Corte Sencillo',                 14000,  30, 0, '✂️'),
  ('Corte Sencillo + Cejas',         15000,  40, 0, '✂️'),
  ('Corte Sencillo + Barba',         18000,  45, 0, '🪒'),
  ('Corte Sencillo + Cejas + Barba', 20000,  55, 0, '🪒'),
  ('Solo Tinte',                     30000, 120, 1, '🎨'),
  ('Corte Completo + Tinte',         35000, 150, 1, '🎨'),
  ('Depilación de Cejas',            12000,  15, 0, '👁️');

INSERT INTO zonas_domicilio (nombre, costo_adicional) VALUES
  ('Sur',       30000),
  ('Norte',     25000),
  ('Occidente', 20000),
  ('Oriente',   10000);

-- ══════════════════════════════════════════════════════════════
--  VISTA: citas completas
-- ══════════════════════════════════════════════════════════════
CREATE OR REPLACE VIEW vista_citas AS
SELECT
  c.id,
  c.fecha,
  c.hora,
  c.modalidad,
  cl.nombre    AS cliente_nombre,
  cl.telefono  AS cliente_telefono,
  GROUP_CONCAT(CONCAT(s.nombre, ' x', cs.cantidad) SEPARATOR ' + ') AS servicios,
  c.color_tinte,
  c.genero_tinte,
  z.nombre     AS zona,
  c.direccion,
  c.precio_servs,
  c.precio_final,
  c.metodo_pago,
  c.estado,
  c.created_at AS fecha_registro
FROM citas c
JOIN clientes cl         ON c.cliente_id = cl.id
JOIN cita_servicios cs   ON c.id = cs.cita_id
JOIN servicios s         ON cs.servicio_id = s.id
LEFT JOIN zonas_domicilio z ON c.zona_id = z.id
GROUP BY c.id
ORDER BY c.fecha DESC, c.hora DESC;
