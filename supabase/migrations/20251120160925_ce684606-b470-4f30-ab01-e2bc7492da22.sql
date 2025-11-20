-- Create departamentos table
CREATE TABLE public.departamentos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  nombre TEXT NOT NULL,
  descripcion TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.departamentos ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for departamentos
CREATE POLICY "Users can view their own departamentos"
ON public.departamentos FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own departamentos"
ON public.departamentos FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own departamentos"
ON public.departamentos FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own departamentos"
ON public.departamentos FOR DELETE
USING (auth.uid() = user_id);

-- Create empleados table
CREATE TABLE public.empleados (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  departamento_id UUID REFERENCES public.departamentos(id) ON DELETE SET NULL,
  nombres TEXT NOT NULL,
  apellidos TEXT NOT NULL,
  dni VARCHAR(20) NOT NULL,
  email TEXT,
  telefono VARCHAR(20),
  direccion TEXT,
  fecha_nacimiento DATE,
  fecha_ingreso DATE NOT NULL DEFAULT CURRENT_DATE,
  cargo TEXT NOT NULL,
  salario NUMERIC(10,2),
  activo BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, dni)
);

-- Enable RLS
ALTER TABLE public.empleados ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for empleados
CREATE POLICY "Users can view their own empleados"
ON public.empleados FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own empleados"
ON public.empleados FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own empleados"
ON public.empleados FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own empleados"
ON public.empleados FOR DELETE
USING (auth.uid() = user_id);

-- Create tipo_asistencia enum
CREATE TYPE public.tipo_asistencia AS ENUM ('Presente', 'Ausente', 'Tardanza', 'Permiso');

-- Create asistencias table
CREATE TABLE public.asistencias (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  empleado_id UUID NOT NULL REFERENCES public.empleados(id) ON DELETE CASCADE,
  fecha DATE NOT NULL DEFAULT CURRENT_DATE,
  tipo public.tipo_asistencia NOT NULL DEFAULT 'Presente',
  hora_entrada TIME,
  hora_salida TIME,
  notas TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(empleado_id, fecha)
);

-- Enable RLS
ALTER TABLE public.asistencias ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for asistencias
CREATE POLICY "Users can view their own asistencias"
ON public.asistencias FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own asistencias"
ON public.asistencias FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own asistencias"
ON public.asistencias FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own asistencias"
ON public.asistencias FOR DELETE
USING (auth.uid() = user_id);

-- Create estado_vacacion enum
CREATE TYPE public.estado_vacacion AS ENUM ('Pendiente', 'Aprobado', 'Rechazado');

-- Create vacaciones table
CREATE TABLE public.vacaciones (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  empleado_id UUID NOT NULL REFERENCES public.empleados(id) ON DELETE CASCADE,
  fecha_inicio DATE NOT NULL,
  fecha_fin DATE NOT NULL,
  dias_totales INTEGER NOT NULL,
  motivo TEXT,
  estado public.estado_vacacion NOT NULL DEFAULT 'Pendiente',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.vacaciones ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for vacaciones
CREATE POLICY "Users can view their own vacaciones"
ON public.vacaciones FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own vacaciones"
ON public.vacaciones FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own vacaciones"
ON public.vacaciones FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own vacaciones"
ON public.vacaciones FOR DELETE
USING (auth.uid() = user_id);

-- Create trigger for departamentos updated_at
CREATE TRIGGER update_departamentos_updated_at
BEFORE UPDATE ON public.departamentos
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create trigger for empleados updated_at
CREATE TRIGGER update_empleados_updated_at
BEFORE UPDATE ON public.empleados
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create trigger for vacaciones updated_at
CREATE TRIGGER update_vacaciones_updated_at
BEFORE UPDATE ON public.vacaciones
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create indexes
CREATE INDEX idx_empleados_departamento ON public.empleados(departamento_id);
CREATE INDEX idx_empleados_activo ON public.empleados(activo);
CREATE INDEX idx_asistencias_empleado ON public.asistencias(empleado_id);
CREATE INDEX idx_asistencias_fecha ON public.asistencias(fecha);
CREATE INDEX idx_vacaciones_empleado ON public.vacaciones(empleado_id);
CREATE INDEX idx_vacaciones_estado ON public.vacaciones(estado);