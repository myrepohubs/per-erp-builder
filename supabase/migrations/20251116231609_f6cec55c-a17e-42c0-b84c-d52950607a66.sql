-- Crear tabla de clientes
CREATE TABLE public.clientes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  ruc VARCHAR(11) NOT NULL,
  razon_social TEXT NOT NULL,
  direccion TEXT,
  email TEXT,
  telefono VARCHAR(20),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT clientes_ruc_check CHECK (char_length(ruc) = 11)
);

-- Crear índice para búsquedas rápidas
CREATE INDEX idx_clientes_user_id ON public.clientes(user_id);
CREATE INDEX idx_clientes_ruc ON public.clientes(ruc);

-- Habilitar RLS en clientes
ALTER TABLE public.clientes ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para clientes
CREATE POLICY "Los usuarios pueden ver sus propios clientes"
  ON public.clientes FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Los usuarios pueden crear sus propios clientes"
  ON public.clientes FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Los usuarios pueden actualizar sus propios clientes"
  ON public.clientes FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Los usuarios pueden eliminar sus propios clientes"
  ON public.clientes FOR DELETE
  USING (auth.uid() = user_id);

-- Crear enum para estados de oportunidades
CREATE TYPE public.estado_oportunidad AS ENUM (
  'Nuevo',
  'Contactado',
  'Propuesta Enviada',
  'Negociación',
  'Ganado',
  'Perdido'
);

-- Crear tabla de oportunidades
CREATE TABLE public.oportunidades (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  nombre_contacto TEXT NOT NULL,
  empresa_potencial TEXT NOT NULL,
  valor_estimado NUMERIC(12, 2) DEFAULT 0,
  estado public.estado_oportunidad NOT NULL DEFAULT 'Nuevo',
  cliente_asociado UUID REFERENCES public.clientes(id) ON DELETE SET NULL,
  notas TEXT,
  fecha_cierre_estimada DATE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Crear índices para oportunidades
CREATE INDEX idx_oportunidades_user_id ON public.oportunidades(user_id);
CREATE INDEX idx_oportunidades_estado ON public.oportunidades(estado);
CREATE INDEX idx_oportunidades_cliente ON public.oportunidades(cliente_asociado);

-- Habilitar RLS en oportunidades
ALTER TABLE public.oportunidades ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para oportunidades
CREATE POLICY "Los usuarios pueden ver sus propias oportunidades"
  ON public.oportunidades FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Los usuarios pueden crear sus propias oportunidades"
  ON public.oportunidades FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Los usuarios pueden actualizar sus propias oportunidades"
  ON public.oportunidades FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Los usuarios pueden eliminar sus propias oportunidades"
  ON public.oportunidades FOR DELETE
  USING (auth.uid() = user_id);

-- Trigger para actualizar updated_at en clientes
CREATE TRIGGER update_clientes_updated_at
  BEFORE UPDATE ON public.clientes
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Trigger para actualizar updated_at en oportunidades
CREATE TRIGGER update_oportunidades_updated_at
  BEFORE UPDATE ON public.oportunidades
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();