-- =====================================================================
-- SISTEMA DE CONTROL DE ASISTENCIA
-- Base de datos: control_asistencia_db (MySQL)
-- =====================================================================
-- Este script crea la estructura de una base de datos pensada para
-- registrar la asistencia (entradas, salidas, colaciones) de los
-- usuarios de una empresa/institución, además de manejar roles de
-- usuario y un historial de bajas (desactivaciones) de cuentas.
-- =====================================================================

-- Se crea la base de datos solo si no existe, usando UTF8MB4 para
-- poder guardar cualquier caracter especial (tildes, ñ, emojis, etc.)
CREATE DATABASE IF NOT EXISTS `control_asistencia_db` 
  CHARACTER SET utf8mb4 
  COLLATE utf8mb4_unicode_ci;

-- Se indica que todas las tablas siguientes se crearán dentro de
-- esta base de datos
USE `control_asistencia_db`;

-- =====================================================================
-- TABLA: roles
-- =====================================================================
-- Almacena los distintos tipos de perfil que puede tener un usuario
-- dentro del sistema (por ejemplo: Administrador, Empleado, Supervisor).
-- Sirve para controlar permisos y accesos según el rol asignado.
-- =====================================================================
CREATE TABLE IF NOT EXISTS `roles` (
  `id_rol` INT AUTO_INCREMENT PRIMARY KEY,       -- Identificador único del rol
  `nombre_rol` VARCHAR(30) NOT NULL UNIQUE       -- Nombre del rol (no se puede repetir)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

INSERT INTO `roles` (`id_rol`, `nombre_rol`) VALUES
  (1, 'Administrador'),
  (2, 'Empleado')
ON DUPLICATE KEY UPDATE `nombre_rol` = VALUES(`nombre_rol`);

-- =====================================================================
-- TABLA: usuarios
-- =====================================================================
-- Contiene los datos de las personas que usan el sistema: empleados,
-- administradores, etc. Cada usuario tiene asignado un rol (roles)
-- que define qué puede hacer dentro de la aplicación.
-- =====================================================================
CREATE TABLE IF NOT EXISTS `usuarios` (
  `id_usuario` INT AUTO_INCREMENT PRIMARY KEY,          -- Identificador único del usuario
  `id_rol` INT NOT NULL,                                -- Rol asignado (FK a roles)
  `nombre` VARCHAR(100) NOT NULL,                       -- Nombre completo del usuario
  `email` VARCHAR(120) NOT NULL UNIQUE,                 -- Correo, usado para iniciar sesión (único)
  `password_hash` VARCHAR(255) NOT NULL,                -- Contraseña ya encriptada (nunca en texto plano)
  `activo` BOOLEAN NOT NULL DEFAULT TRUE,               -- Indica si la cuenta está habilitada o dada de baja
  `fecha_creacion` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP, -- Fecha en que se creó el usuario

  -- Relación con la tabla roles: un usuario pertenece a un solo rol.
  -- ON DELETE RESTRICT: no permite borrar un rol si tiene usuarios asociados.
  -- ON UPDATE CASCADE: si cambia el id_rol en la tabla roles, se actualiza aquí también.
  CONSTRAINT `fk_usuarios_roles` 
    FOREIGN KEY (`id_rol`) REFERENCES `roles` (`id_rol`) 
    ON UPDATE CASCADE ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- =====================================================================
-- TABLA: asistencias
-- =====================================================================
-- Registra cada marca de asistencia realizada por un usuario:
-- entrada, salida, inicio de colación (almuerzo/descanso) y fin de
-- colación. Es la tabla principal donde se guarda el historial de
-- marcaciones, y crece constantemente (por eso usa BIGINT como PK).
-- =====================================================================
CREATE TABLE IF NOT EXISTS `asistencias` (
  `id_asistencia` BIGINT AUTO_INCREMENT PRIMARY KEY,   -- Identificador único de la marca (BIGINT por el gran volumen de registros)
  `id_usuario` INT NOT NULL,                           -- Usuario que realizó la marcación (FK a usuarios)
  `tipo_marca` ENUM('ENTRADA', 'SALIDA', 'INICIO_COLACION', 'FIN_COLACION') NOT NULL, -- Tipo de evento registrado
  `fecha_hora` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP, -- Momento exacto en que se realizó la marca
  `hora_marca` TIME GENERATED ALWAYS AS (TIME(`fecha_hora`)) STORED,

  -- Índice compuesto para acelerar las consultas típicas del sistema,
  -- como "traer las marcas de un usuario en un rango de fechas".
  INDEX `idx_usuario_fecha` (`id_usuario`, `fecha_hora`),
  INDEX `idx_tipo_hora` (`tipo_marca`, `hora_marca`, `fecha_hora`),

  -- Relación con usuarios: cada marca de asistencia pertenece a un usuario.
  -- ON DELETE RESTRICT: no se puede eliminar un usuario si tiene marcas registradas
  -- (esto protege el historial de asistencia).
  CONSTRAINT `fk_asistencias_usuarios` 
    FOREIGN KEY (`id_usuario`) REFERENCES `usuarios` (`id_usuario`) 
    ON UPDATE CASCADE ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- =====================================================================
-- TABLA: usuarios_desactivados
-- =====================================================================
-- Funciona como un historial/bitácora de bajas: cada vez que un
-- administrador desactiva a un usuario, queda un registro de quién
-- fue desactivado, qué administrador lo hizo, cuándo y por qué motivo.
-- Esto permite mantener trazabilidad en vez de solo cambiar el campo
-- "activo" de la tabla usuarios sin dejar rastro.
-- =====================================================================
CREATE TABLE IF NOT EXISTS `usuarios_desactivados` (
  `id_baja` INT AUTO_INCREMENT PRIMARY KEY,       -- Identificador único del registro de baja
  `id_usuario` INT NOT NULL,                      -- Usuario que fue desactivado (FK a usuarios)
  `id_administrador` INT NOT NULL,                -- Usuario (admin) que realizó la desactivación (FK a usuarios)
  `fecha_baja` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP, -- Fecha y hora en que se realizó la baja
  `motivo` VARCHAR(255) NULL,                     -- Motivo opcional de la desactivación

  -- Relación con el usuario que fue dado de baja
  CONSTRAINT `fk_baja_usuario` 
    FOREIGN KEY (`id_usuario`) REFERENCES `usuarios` (`id_usuario`) 
    ON UPDATE CASCADE ON DELETE RESTRICT,

  -- Relación con el administrador que ejecutó la baja
  -- (ambas FK apuntan a la misma tabla usuarios, ya que un admin también es un usuario)
  CONSTRAINT `fk_baja_admin` 
    FOREIGN KEY (`id_administrador`) REFERENCES `usuarios` (`id_usuario`) 
    ON UPDATE CASCADE ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
