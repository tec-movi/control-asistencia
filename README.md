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
DB_PORT=3306
DB_CONNECTION_LIMIT=10
PORT=3000
CLIENT_URL=http://localhost:5173
JWT_SECRET=una-clave-larga-y-aleatoria
```

El archivo `server/.env` no debe subirse al repositorio.

`DB_PASSWORD` debe contener la contrasena real del usuario de MySQL. Por
ejemplo, si la contrasena configurada para `root` es `admin123`, usa:

```env
DB_PASSWORD=admin123
```

### Crear el primer usuario administrador

La ruta `POST /api/users` requiere un token de administrador, por lo que el
primer administrador debe insertarse directamente en MySQL. La contrasena no
se guarda en texto plano: primero genera un hash bcrypt desde la carpeta
`server`:

```powershell
cd "C:\ruta\al\proyecto\control_asistencia\server"
npm install
node --input-type=module -e "import bcrypt from 'bcryptjs'; console.log(await bcrypt.hash('Admin123!', 10))"
```

El comando imprime un valor que comienza con `$2b$10$`. Copia el valor
completo y reemplaza `PEGA_AQUI_EL_HASH` en la siguiente consulta:

```sql
USE control_asistencia_db;

INSERT INTO usuarios
  (id_rol, nombre, email, password_hash, activo)
VALUES
  (1, 'Administrador Inicial', 'admin@correo.com', 'PEGA_AQUI_EL_HASH', 1);
```

El rol `1` corresponde a `Administrador` y se crea automáticamente al
ejecutar `db_control_asistencias.sql`. Puedes confirmar la insercion con:

```sql
SELECT id_usuario, id_rol, nombre, email, activo
FROM usuarios
WHERE email = 'admin@correo.com';
```

Si el correo ya existe, no repitas el `INSERT`; utiliza ese usuario o cambia
el correo por uno nuevo. La contrasena utilizada en el ejemplo es
`Admin123!`; cambiala por una contrasena segura en un entorno real.

### Iniciar sesion y obtener el token

Inicia el backend desde la carpeta raiz o desde `server`:

```powershell
npm run dev
```

En Postman crea una solicitud:

```http
POST http://localhost:3000/api/users/login
Content-Type: application/json
```

Con este cuerpo:

```json
{
  "email": "admin@correo.com",
  "password": "Admin123!"
}
```

La respuesta `200 OK` contiene el token:

```json
{
  "token": "eyJ...",
  "user": {
    "id": 1,
    "email": "admin@correo.com",
    "role": "ADMIN",
    "name": "Administrador Inicial"
  }
}
```

Para crear otros usuarios desde Postman, utiliza el valor de `token` en el
header `Authorization`:

```http
Authorization: Bearer TU_TOKEN
```

Y realiza una solicitud `POST` a `http://localhost:3000/api/users` con:

```json
{
  "nombre": "Segundo Usuario",
  "email": "usuario@correo.com",
  "password": "OtraContraseñaSegura123!",
  "role": "USER"
}
```

Para medir el tiempo de las consultas SQL durante una revisión de rendimiento,
activa temporalmente estas opciones en `server/.env`:

```env
DB_QUERY_TIMING=true
DB_SLOW_QUERY_MS=500
```

La primera registra cada consulta y la segunda registra también las consultas
que superen el umbral indicado, aunque el registro detallado esté desactivado.

Si la base de datos ya existía antes de agregar el índice de reportes, ejecuta
el script [migrations/001_add_attendance_time_index.sql](./migrations/001_add_attendance_time_index.sql)
una sola vez antes de iniciar el backend.

### Seguridad de los reportes

Los reportes están protegidos en el backend con autenticación y autorización para
el rol `ADMIN`. La aplicación usa actualmente un token firmado con HMAC propio
para el prototipo; todavía no implementa un proveedor JWT estándar ni rotación
de claves. Para producción se debe reemplazar esta solución por JWT validado
con una clave administrada de forma segura y con expiración del token.

### Reglas de negocio implementadas

- **CA-01:** `POST /api/attendance` registra la marca con la fecha y hora actual
  de la base de datos. El usuario autenticado es el propietario de la marca.
- **RE-01:** `GET /api/attendance/reports/atrasos` incluye entradas posteriores
  a las `09:30:00`.
- **RE-02:** `GET /api/attendance/reports/salidas-anticipadas` incluye salidas
  anteriores a las `17:30:00`.
- **RE-03:** `GET /api/attendance/reports/inasistencias?date=YYYY-MM-DD`
  identifica usuarios activos sin entrada ni salida en la fecha indicada. Los
  fines de semana devuelven un resultado vacío porque no son días laborables.
- **GU-01, GU-02 y GU-03:** las rutas de creación, modificación, baja lógica y
  reactivación de usuarios requieren autenticación con rol `ADMIN`. Los correos
  duplicados responden `409` y no se permite que un administrador desactive su
  propia cuenta.

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
