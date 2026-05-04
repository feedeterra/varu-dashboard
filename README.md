# VARU Dashboard

Dashboard interno para Varu Distribuidora — Chivilcoy, Argentina.

## Stack

- Next.js 14 (App Router)
- Tailwind CSS
- Supabase (Auth + Postgres)
- Recharts

## Setup local

1. Instalar dependencias:
   ```bash
   npm install
   ```
2. Copiar variables de entorno:
   ```bash
   cp .env.local.example .env.local
   ```
3. Completar `.env.local` con los valores de tu proyecto Supabase:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`

4. Ejecutar la migración en el SQL Editor de Supabase:
   ```
   envios_migration.sql
   ```

5. Iniciar el servidor:
   ```bash
   npm run dev
   ```

## Deploy en Vercel

1. Subir el proyecto a GitHub.
2. Importar en [vercel.com](https://vercel.com).
3. Agregar las 3 variables de entorno en Vercel → Settings → Environment Variables.
4. Deploy. Cada push a `main` redespliega automáticamente.

## Roles

Los admins se definen por email en `src/app/(dashboard)/layout.tsx` → array `adminEmails`. Los encargados NO ven la tarjeta de ganancia bruta.

## Estructura

```
src/
├── app/
│   ├── (dashboard)/         # Rutas protegidas con sidebar
│   │   ├── layout.tsx
│   │   ├── page.tsx         # Home / resumen
│   │   ├── ventas/
│   │   ├── clientes/
│   │   ├── deudores/
│   │   └── envios/
│   ├── login/
│   ├── layout.tsx
│   └── globals.css
├── components/
│   ├── layout/Sidebar.tsx
│   └── ui/Card.tsx, Badge.tsx
├── lib/supabase/            # client / server / middleware
├── middleware.ts             # Auth guard global
└── types/index.ts
```
