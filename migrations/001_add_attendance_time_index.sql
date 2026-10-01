USE `control_asistencia_db`;

ALTER TABLE `asistencias`
  ADD COLUMN `hora_marca` TIME
    GENERATED ALWAYS AS (TIME(`fecha_hora`)) STORED,
  ADD INDEX `idx_tipo_hora` (`tipo_marca`, `hora_marca`, `fecha_hora`);
