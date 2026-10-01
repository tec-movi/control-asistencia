# Control de Asistencia

Aplicacion web para gestionar usuarios y registrar asistencias. El proyecto esta dividido en:

- `client`: frontend desarrollado con React y Vite.
- `server`: API desarrollada con Node.js y Express.
- `db_control_asistencias.sql`: estructura y datos iniciales de la base de datos MySQL.

## Requisitos

- Node.js y npm instalados.
- MySQL Server instalado y ejecutandose.
- Un usuario de MySQL con permisos para crear la base de datos.

## Instalacion

Desde la carpeta raiz `control_asistencia`, instala las dependencias:

```bash
npm install
npm install --prefix client
npm install --prefix server
```

## Configuracion de la base de datos

1. Inicia MySQL.
2. Ejecuta `db_control_asistencias.sql` usando MySQL Workbench o la consola de MySQL.
3. Verifica que exista la base de datos `control_asistencia_db`.
4. Copia `server/.env.example` como `server/.env` y ajusta sus valores:

```env
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=tu_contrasena
DB_NAME=control_asistencia_db
PORT=3000
```

El archivo `server/.env` no debe subirse al repositorio.

## Configuracion del cliente

Copia `client/.env.example` como `client/.env` si necesitas cambiar la URL de la API:

```env
VITE_API_URL=http://localhost:3000
```

## Iniciar el proyecto

Desde la carpeta raiz ejecuta:

```bash
npm run dev
```

Esto inicia el frontend en `http://localhost:5173` y el backend en `http://localhost:3000`.

## Otros comandos

```bash
npm run build --prefix client
npm test --prefix server
```
