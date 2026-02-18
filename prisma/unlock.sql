-- Desbloquea todos los locks que Prisma pudo haber dejado activos
SELECT pg_advisory_unlock_all();
