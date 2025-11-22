-- Crear tabla de cuentas contables (plan de cuentas)
CREATE TABLE public.cuentas_contables (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  codigo VARCHAR NOT NULL,
  nombre TEXT NOT NULL,
  tipo VARCHAR NOT NULL CHECK (tipo IN ('Activo', 'Pasivo', 'Patrimonio', 'Ingreso', 'Gasto')),
  cuenta_padre_id UUID REFERENCES public.cuentas_contables(id) ON DELETE SET NULL,
  nivel INTEGER NOT NULL DEFAULT 1,
  activa BOOLEAN DEFAULT true,
  descripcion TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, codigo)
);

-- Crear tabla de asientos contables
CREATE TABLE public.asientos_contables (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  numero_asiento VARCHAR NOT NULL,
  fecha DATE NOT NULL DEFAULT CURRENT_DATE,
  tipo VARCHAR NOT NULL CHECK (tipo IN ('Apertura', 'Diario', 'Ajuste', 'Cierre')),
  glosa TEXT NOT NULL,
  estado VARCHAR NOT NULL DEFAULT 'Borrador' CHECK (estado IN ('Borrador', 'Contabilizado', 'Anulado')),
  referencia TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, numero_asiento)
);

-- Crear tabla de detalles de asientos contables
CREATE TABLE public.detalles_asiento (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  asiento_id UUID NOT NULL REFERENCES public.asientos_contables(id) ON DELETE CASCADE,
  cuenta_id UUID NOT NULL REFERENCES public.cuentas_contables(id) ON DELETE RESTRICT,
  debe NUMERIC NOT NULL DEFAULT 0 CHECK (debe >= 0),
  haber NUMERIC NOT NULL DEFAULT 0 CHECK (haber >= 0),
  glosa TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CHECK ((debe > 0 AND haber = 0) OR (haber > 0 AND debe = 0))
);

-- Enable Row Level Security
ALTER TABLE public.cuentas_contables ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.asientos_contables ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.detalles_asiento ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para cuentas_contables
CREATE POLICY "Users can view their own cuentas"
ON public.cuentas_contables FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own cuentas"
ON public.cuentas_contables FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own cuentas"
ON public.cuentas_contables FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own cuentas"
ON public.cuentas_contables FOR DELETE
USING (auth.uid() = user_id);

-- Políticas RLS para asientos_contables
CREATE POLICY "Users can view their own asientos"
ON public.asientos_contables FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own asientos"
ON public.asientos_contables FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own asientos"
ON public.asientos_contables FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own asientos"
ON public.asientos_contables FOR DELETE
USING (auth.uid() = user_id);

-- Políticas RLS para detalles_asiento
CREATE POLICY "Users can view detalles of their own asientos"
ON public.detalles_asiento FOR SELECT
USING (EXISTS (
  SELECT 1 FROM public.asientos_contables
  WHERE asientos_contables.id = detalles_asiento.asiento_id
  AND asientos_contables.user_id = auth.uid()
));

CREATE POLICY "Users can create detalles for their own asientos"
ON public.detalles_asiento FOR INSERT
WITH CHECK (EXISTS (
  SELECT 1 FROM public.asientos_contables
  WHERE asientos_contables.id = detalles_asiento.asiento_id
  AND asientos_contables.user_id = auth.uid()
));

CREATE POLICY "Users can update detalles of their own asientos"
ON public.detalles_asiento FOR UPDATE
USING (EXISTS (
  SELECT 1 FROM public.asientos_contables
  WHERE asientos_contables.id = detalles_asiento.asiento_id
  AND asientos_contables.user_id = auth.uid()
));

CREATE POLICY "Users can delete detalles of their own asientos"
ON public.detalles_asiento FOR DELETE
USING (EXISTS (
  SELECT 1 FROM public.asientos_contables
  WHERE asientos_contables.id = detalles_asiento.asiento_id
  AND asientos_contables.user_id = auth.uid()
));

-- Triggers para updated_at
CREATE TRIGGER update_cuentas_contables_updated_at
BEFORE UPDATE ON public.cuentas_contables
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_asientos_contables_updated_at
BEFORE UPDATE ON public.asientos_contables
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Índices para mejorar performance
CREATE INDEX idx_cuentas_user ON public.cuentas_contables(user_id);
CREATE INDEX idx_cuentas_tipo ON public.cuentas_contables(tipo);
CREATE INDEX idx_asientos_user ON public.asientos_contables(user_id);
CREATE INDEX idx_asientos_fecha ON public.asientos_contables(fecha);
CREATE INDEX idx_detalles_asiento ON public.detalles_asiento(asiento_id);
CREATE INDEX idx_detalles_cuenta ON public.detalles_asiento(cuenta_id);