-- Tabla para el módulo de envíos de Varu Distribuidora
-- Ejecutar en Supabase SQL Editor

CREATE TABLE IF NOT EXISTS public.envios (
  id              BIGSERIAL PRIMARY KEY,
  id_cliente      BIGINT NOT NULL REFERENCES public.clientes(id_cliente),
  id_articulo     BIGINT REFERENCES public.articulos(id_articulo),
  comisionista    TEXT NOT NULL,
  direccion       TEXT NOT NULL,
  estado          TEXT NOT NULL DEFAULT 'preparando'
                  CHECK (estado IN ('preparando', 'enviado', 'entregado', 'devuelto')),
  nota            TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Índices para consultas frecuentes
CREATE INDEX IF NOT EXISTS idx_envios_estado ON public.envios(estado);
CREATE INDEX IF NOT EXISTS idx_envios_comisionista ON public.envios(comisionista);
CREATE INDEX IF NOT EXISTS idx_envios_id_cliente ON public.envios(id_cliente);
CREATE INDEX IF NOT EXISTS idx_envios_created_at ON public.envios(created_at DESC);

-- Trigger para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_envios_updated_at
  BEFORE UPDATE ON public.envios
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Row Level Security
ALTER TABLE public.envios ENABLE ROW LEVEL SECURITY;

-- Política: usuarios autenticados pueden leer todos los envíos
CREATE POLICY "Usuarios autenticados pueden leer envíos"
  ON public.envios FOR SELECT
  TO authenticated
  USING (true);

-- Política: usuarios autenticados pueden insertar envíos
CREATE POLICY "Usuarios autenticados pueden insertar envíos"
  ON public.envios FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Política: usuarios autenticados pueden actualizar estado de envíos
CREATE POLICY "Usuarios autenticados pueden actualizar envíos"
  ON public.envios FOR UPDATE
  TO authenticated
  USING (true);
