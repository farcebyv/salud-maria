# Salud María

Aplicación web personal para registrar la glucosa de María de los Ángeles Anchia Arias. Está diseñada para usarse cómodamente desde un teléfono, pero también funciona en computadora.

## Incluye

- Tres mediciones diarias: al comenzar el día (en ayunas), tarde y noche.
- Hora opcional de cada medición y un historial de los últimos 90 registros.
- PostgreSQL, una base de datos SQL real, lista para desarrollo local o despliegue.

## Ejecutar localmente

1. Instale Node.js 20 o superior y Docker Desktop.
2. En una terminal, inicie la base de datos:

   ```bash
   docker compose up -d
   ```

3. Cree el archivo de configuración a partir de `.env.example` y ejecute el esquema:

   ```bash
   Copy-Item .env.example .env
   Get-Content db/schema.sql | docker compose exec -T database psql -U maria -d salud_maria
   ```

4. Instale dependencias e inicie la app:

   ```bash
   npm install
   npm run dev
   ```

5. Abra `http://localhost:3000`.

## Compartir por Git

No se incluyen secretos: `.env` está ignorado. Para subir el proyecto, crea un repositorio privado en GitHub o GitLab y ejecuta:

```bash
git init
git add .
git commit -m "Aplicación inicial Salud María"
```

Antes de publicarla en Internet, añade autenticación y usa una contraseña segura para PostgreSQL. Los datos médicos son personales y el repositorio debería mantenerse privado.
