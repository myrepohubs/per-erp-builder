-- Create categorias table for product categories
CREATE TABLE public.categorias (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  nombre TEXT NOT NULL,
  descripcion TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS for categorias
ALTER TABLE public.categorias ENABLE ROW LEVEL SECURITY;

-- Create policies for categorias
CREATE POLICY "Users can view their own categorias" 
ON public.categorias 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own categorias" 
ON public.categorias 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own categorias" 
ON public.categorias 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own categorias" 
ON public.categorias 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create productos table
CREATE TABLE public.productos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  categoria_id UUID REFERENCES public.categorias(id) ON DELETE SET NULL,
  sku VARCHAR(50) NOT NULL,
  codigo_barras VARCHAR(50),
  nombre TEXT NOT NULL,
  descripcion TEXT,
  unidad_medida VARCHAR(20) DEFAULT 'UND',
  precio_compra NUMERIC DEFAULT 0,
  precio_venta NUMERIC DEFAULT 0,
  stock_actual NUMERIC DEFAULT 0,
  stock_minimo NUMERIC DEFAULT 0,
  stock_maximo NUMERIC DEFAULT 0,
  activo BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, sku)
);

-- Enable RLS for productos
ALTER TABLE public.productos ENABLE ROW LEVEL SECURITY;

-- Create policies for productos
CREATE POLICY "Users can view their own productos" 
ON public.productos 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own productos" 
ON public.productos 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own productos" 
ON public.productos 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own productos" 
ON public.productos 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create enum for tipo_movimiento
CREATE TYPE tipo_movimiento AS ENUM ('Entrada', 'Salida', 'Ajuste');

-- Create movimientos_inventario table
CREATE TABLE public.movimientos_inventario (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  producto_id UUID NOT NULL REFERENCES public.productos(id) ON DELETE CASCADE,
  tipo tipo_movimiento NOT NULL,
  cantidad NUMERIC NOT NULL,
  stock_anterior NUMERIC NOT NULL,
  stock_nuevo NUMERIC NOT NULL,
  referencia TEXT,
  notas TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS for movimientos_inventario
ALTER TABLE public.movimientos_inventario ENABLE ROW LEVEL SECURITY;

-- Create policies for movimientos_inventario
CREATE POLICY "Users can view their own movimientos" 
ON public.movimientos_inventario 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own movimientos" 
ON public.movimientos_inventario 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Add triggers for updated_at
CREATE TRIGGER update_categorias_updated_at
BEFORE UPDATE ON public.categorias
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_productos_updated_at
BEFORE UPDATE ON public.productos
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create indexes for better performance
CREATE INDEX idx_productos_sku ON public.productos(user_id, sku);
CREATE INDEX idx_productos_categoria ON public.productos(categoria_id);
CREATE INDEX idx_movimientos_producto ON public.movimientos_inventario(producto_id);
CREATE INDEX idx_movimientos_fecha ON public.movimientos_inventario(created_at DESC);