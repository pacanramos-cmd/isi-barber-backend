# 💈 The Isi Barber Shop — Backend + MySQL
## Guía completa de instalación paso a paso

---

## 🗂️ ESTRUCTURA DEL PROYECTO

```
isi-barber-backend/
├── server.js        ← Servidor Express con todas las rutas API
├── db.js            ← Conexión a MySQL
├── database.sql     ← Esquema de la base de datos (ejecutar una vez)
├── Panel.jsx        ← Panel del barbero (copiar a src/ del frontend)
├── package.json     ← Dependencias del backend
├── .env.example     ← Variables de entorno (copiar como .env)
└── README.md        ← Esta guía
```

---

## 📦 PASO 1 — Instalar MySQL

### En Windows:
1. Ve a: **https://dev.mysql.com/downloads/installer/**
2. Descarga **MySQL Installer** (el más pequeño está bien)
3. Ejecuta el instalador
4. Elige **"Developer Default"** o **"Server Only"**
5. Cuando te pida contraseña de root, ponla y **guárdala** — la vas a necesitar
6. Termina la instalación

### Verificar que está instalado:
Abre CMD y escribe:
```bash
mysql --version
```
Si muestra una versión, está instalado.

---

## 🗄️ PASO 2 — Crear la base de datos

1. Abre CMD y conéctate a MySQL:
```bash
mysql -u root -p
```
Escribe tu contraseña cuando la pida.

2. Ejecuta el archivo SQL:
```bash
source C:/ruta/al/archivo/database.sql
```
O copia y pega todo el contenido del archivo `database.sql` en la terminal de MySQL.

3. Verifica que se creó:
```sql
USE isi_barber_db;
SHOW TABLES;
```
Debe mostrar: clientes, citas, cita_servicios, servicios, usuarios, zonas_domicilio

---

## ⚙️ PASO 3 — Configurar el backend

1. Entra a la carpeta del backend:
```bash
cd isi-barber-backend
```

2. Instala las dependencias:
```bash
npm install
```

3. Copia el archivo de variables de entorno:
```bash
copy .env.example .env
```

4. Abre `.env` y edita con tus datos:
```
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=TU_CONTRASEÑA_DE_MYSQL
DB_NAME=isi_barber_db
JWT_SECRET=cualquier_frase_larga_y_secreta_aqui
PORT=4000
FRONTEND_URL=http://localhost:5173
```

---

## 👤 PASO 4 — Crear el usuario del barbero

Con el servidor corriendo, ejecuta este comando en una terminal nueva:

```bash
curl -X POST http://localhost:4000/api/auth/crear-usuario \
  -H "Content-Type: application/json" \
  -d "{\"nombre\":\"Isi Barber\",\"email\":\"isibarber4@gmail.com\",\"password\":\"tu_password\",\"rol\":\"barbero\"}"
```

O si no tienes curl, en PowerShell:
```powershell
Invoke-WebRequest -Uri "http://localhost:4000/api/auth/crear-usuario" `
  -Method POST `
  -ContentType "application/json" `
  -Body '{"nombre":"Isi Barber","email":"isibarber4@gmail.com","password":"tu_password","rol":"barbero"}'
```

---

## 🚀 PASO 5 — Arrancar el servidor

```bash
npm run dev
```

Debes ver:
```
💈 The Isi Barber Shop Backend
✅ Servidor corriendo en http://localhost:4000
```

---

## 🔗 PASO 6 — Conectar el frontend

En el `App.jsx` del frontend agrega esta URL al CONFIG:
```javascript
const CONFIG = {
  whatsapp: "573158571723",
  nequi:    "3168060907",
  nombre:   "The Isi Barber Shop",
  sheetURL: "https://...",
  apiURL:   "http://localhost:4000/api",  // ← AGREGA ESTO
};
```

---

## 🎛️ PASO 7 — Panel del barbero

Copia el archivo `Panel.jsx` a la carpeta `src/` de tu proyecto React.

Luego en `main.jsx` o crea una ruta nueva para que el barbero acceda al panel en:
`http://localhost:5173/panel`

---

## 📋 RUTAS DE LA API

| Método | Ruta | Auth | Descripción |
|--------|------|------|-------------|
| POST | /api/auth/login | ❌ | Login del barbero |
| GET | /api/horarios/ocupados?fecha=YYYY-MM-DD | ❌ | Horas ya reservadas |
| POST | /api/citas | ❌ | Crear nueva cita |
| GET | /api/citas | ✅ | Ver todas las citas |
| PATCH | /api/citas/:id/estado | ✅ | Cambiar estado de cita |

---

## 🛢️ ESQUEMA DE LA BASE DE DATOS (3FN)

```
clientes (id, nombre, telefono)
    ↓ 1:N
citas (id, cliente_id, fecha, hora, modalidad, zona_id, ...)
    ↓ N:M
cita_servicios (id, cita_id, servicio_id, cantidad)
    ↓
servicios (id, nombre, precio, duracion, tiene_tinte)

zonas_domicilio (id, nombre, costo_adicional)
usuarios (id, nombre, email, password, rol)
```

---

## 🌐 PARA PRODUCCIÓN (cuando quieras subir el backend)

Opciones gratuitas para hospedar el backend:
- **Railway** → railway.app (muy fácil, conecta con GitHub)
- **Render** → render.com (plan gratuito disponible)
- **PlanetScale** → para la base de datos MySQL en la nube (gratis)

---

¿Preguntas? Todo está explicado aquí. ¡Éxito! 💈✂️
