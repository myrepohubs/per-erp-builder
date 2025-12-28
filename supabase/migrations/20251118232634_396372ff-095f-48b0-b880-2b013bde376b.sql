-- Crear tabla de proveedores
CREATE TABLE public.proveedores (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  ruc VARCHAR NOT NULL,
  razon_social TEXT NOT NULL,
  contacto TEXT,
  telefono VARCHAR,
  email TEXT,
  direccion TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Habilitar RLS en proveedores
ALTER TABLE public.proveedores ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para proveedores
CREATE POLICY "Los usuarios pueden ver sus propios proveedores"
ON public.proveedores FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Los usuarios pueden crear sus propios proveedores"
ON public.proveedores FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Los usuarios pueden actualizar sus propios proveedores"
ON public.proveedores FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Los usuarios pueden eliminar sus propios proveedores"
ON public.proveedores FOR DELETE
USING (auth.uid() = user_id);

-- Crear enum para estados de documentos
CREATE TYPE public.estado_documento AS ENUM (
  'Borrador',
  'Aprobado',
  'Enviado',
  'Recibido',
  'Cancelado'
);

-- Crear tabla de órdenes de compra
CREATE TABLE public.ordenes_compra (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  proveedor_id UUID REFERENCES public.proveedores(id),
  numero_orden VARCHAR NOT NULL,
  fecha_orden DATE NOT NULL DEFAULT CURRENT_DATE,
  fecha_entrega_esperada DATE,
  estado public.estado_documento NOT NULL DEFAULT 'Borrador',
  subtotal NUMERIC NOT NULL DEFAULT 0,
  igv NUMERIC NOT NULL DEFAULT 0,
  total NUMERIC NOT NULL DEFAULT 0,
  notas TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Habilitar RLS en ordenes_compra
ALTER TABLE public.ordenes_compra ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para ordenes_compra
CREATE POLICY "Users can view their own ordenes_compra"
ON public.ordenes_compra FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own ordenes_compra"
ON public.ordenes_compra FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own ordenes_compra"
ON public.ordenes_compra FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own ordenes_compra"
ON public.ordenes_compra FOR DELETE
USING (auth.uid() = user_id);

-- Crear tabla de items de orden de compra
CREATE TABLE public.items_orden_compra (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  orden_compra_id UUID NOT NULL REFERENCES public.ordenes_compra(id) ON DELETE CASCADE,
  descripcion TEXT NOT NULL,
  cantidad NUMERIC NOT NULL DEFAULT 1,
  precio_unitario NUMERIC NOT NULL DEFAULT 0,
  subtotal NUMERIC NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Habilitar RLS en items_orden_compra
ALTER TABLE public.items_orden_compra ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para items_orden_compra
CREATE POLICY "Users can view items of their own ordenes_compra"
ON public.items_orden_compra FOR SELECT
USING (EXISTS (
  SELECT 1 FROM public.ordenes_compra
  WHERE ordenes_compra.id = items_orden_compra.orden_compra_id
  AND ordenes_compra.user_id = auth.uid()
));

CREATE POLICY "Users can create items for their own ordenes_compra"
ON public.items_orden_compra FOR INSERT
WITH CHECK (EXISTS (
  SELECT 1 FROM public.ordenes_compra
  WHERE ordenes_compra.id = items_orden_compra.orden_compra_id
  AND ordenes_compra.user_id = auth.uid()
));

CREATE POLICY "Users can update items of their own ordenes_compra"
ON public.items_orden_compra FOR UPDATE
USING (EXISTS (
  SELECT 1 FROM public.ordenes_compra
  WHERE ordenes_compra.id = items_orden_compra.orden_compra_id
  AND ordenes_compra.user_id = auth.uid()
));

CREATE POLICY "Users can delete items of their own ordenes_compra"
ON public.items_orden_compra FOR DELETE
USING (EXISTS (
  SELECT 1 FROM public.ordenes_compra
  WHERE ordenes_compra.id = items_orden_compra.orden_compra_id
  AND ordenes_compra.user_id = auth.uid()
));

-- Trigger para actualizar updated_at en proveedores
CREATE TRIGGER update_proveedores_updated_at
BEFORE UPDATE ON public.proveedores
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Trigger para actualizar updated_at en ordenes_compra
CREATE TRIGGER update_ordenes_compra_updated_at
BEFORE UPDATE ON public.ordenes_compra
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();