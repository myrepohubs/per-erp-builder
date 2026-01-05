import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, DollarSign, Calendar, Building2 } from "lucide-react";
import { toast } from "sonner";

type EstadoOportunidad =
  | "Nuevo"
  | "Contactado"
  | "Propuesta Enviada"
  | "Negociación"
  | "Ganado"
  | "Perdido";

interface Oportunidad {
  id: string;
  nombre_contacto: string;
  empresa_potencial: string;
  valor_estimado: number;
  estado: EstadoOportunidad;
  notas: string | null;
  fecha_cierre_estimada: string | null;
}

interface Cliente {
  id: string;
  razon_social: string;
}

const ESTADOS: EstadoOportunidad[] = [
  "Nuevo",
  "Contactado",
  "Propuesta Enviada",
  "Negociación",
  "Ganado",
  "Perdido",
];

const getEstadoColor = (estado: EstadoOportunidad) => {
  const colors = {
    Nuevo: "bg-blue-500/10 text-blue-700 dark:text-blue-400",
    Contactado: "bg-purple-500/10 text-purple-700 dark:text-purple-400",
    "Propuesta Enviada": "bg-orange-500/10 text-orange-700 dark:text-orange-400",
    Negociación: "bg-yellow-500/10 text-yellow-700 dark:text-yellow-400",
    Ganado: "bg-green-500/10 text-green-700 dark:text-green-400",
    Perdido: "bg-red-500/10 text-red-700 dark:text-red-400",
  };
  return colors[estado];
};

export default function OportunidadesPage() {
  const { user } = useAuth();
  const [oportunidades, setOportunidades] = useState<Oportunidad[]>([]);
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    nombre_contacto: "",
    empresa_potencial: "",
    valor_estimado: "",
    estado: "Nuevo" as EstadoOportunidad,
    notas: "",
    fecha_cierre_estimada: "",
    cliente_asociado: "",
  });

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user]);

  const fetchData = async () => {
    try {
      const [oportunidadesRes, clientesRes] = await Promise.all([
        supabase
          .from("oportunidades")
          .select("*")
          .order("created_at", { ascending: false }),
        supabase.from("clientes").select("id, razon_social").order("razon_social"),
      ]);

      if (oportunidadesRes.error) throw oportunidadesRes.error;
      if (clientesRes.error) throw clientesRes.error;

      setOportunidades(oportunidadesRes.data || []);
      setClientes(clientesRes.data || []);
    } catch (error: any) {
      toast.error("Error al cargar datos");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const { error } = await supabase.from("oportunidades").insert([
        {
          ...formData,
          valor_estimado: parseFloat(formData.valor_estimado) || 0,
          cliente_asociado: formData.cliente_asociado || null,
          fecha_cierre_estimada: formData.fecha_cierre_estimada || null,
          user_id: user?.id,
        },
      ]);

      if (error) throw error;
      toast.success("Oportunidad creada exitosamente");
      setIsDialogOpen(false);
      resetForm();
      fetchData();
    } catch (error: any) {
      toast.error(error.message || "Error al crear oportunidad");
    }
  };

  const updateEstado = async (id: string, nuevoEstado: EstadoOportunidad) => {
    try {
      const { error } = await supabase
        .from("oportunidades")
        .update({ estado: nuevoEstado })
        .eq("id", id);

      if (error) throw error;
      toast.success("Estado actualizado");
      fetchData();
    } catch (error: any) {
      toast.error("Error al actualizar estado");
    }
  };

  const resetForm = () => {
    setFormData({
      nombre_contacto: "",
      empresa_potencial: "",
      valor_estimado: "",
      estado: "Nuevo",
      notas: "",
      fecha_cierre_estimada: "",
      cliente_asociado: "",
    });
  };

  const getOportunidadesPorEstado = (estado: EstadoOportunidad) => {
    return oportunidades.filter((opp) => opp.estado === estado);
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("es-PE", {
      style: "currency",
      currency: "PEN",
    }).format(value);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-foreground">
            Pipeline de Ventas
          </h1>
          <p className="text-muted-foreground mt-1">
            Gestione sus oportunidades de negocio
          </p>
        </div>
        <Dialog
          open={isDialogOpen}
          onOpenChange={(open) => {
            setIsDialogOpen(open);
            if (!open) resetForm();
          }}
        >
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Nueva Oportunidad
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Nueva Oportunidad</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="nombre_contacto">Nombre del Contacto *</Label>
                  <Input
                    id="nombre_contacto"
                    value={formData.nombre_contacto}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        nombre_contacto: e.target.value,
                      })
                    }
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="empresa_potencial">Empresa *</Label>
                  <Input
                    id="empresa_potencial"
                    value={formData.empresa_potencial}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        empresa_potencial: e.target.value,
                      })
                    }
                    required
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="valor_estimado">Valor Estimado (S/)</Label>
                  <Input
                    id="valor_estimado"
                    type="number"
                    step="0.01"
                    value={formData.valor_estimado}
                    onChange={(e) =>
                      setFormData({ ...formData, valor_estimado: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="fecha_cierre_estimada">
                    Fecha de Cierre Estimada
                  </Label>
                  <Input
                    id="fecha_cierre_estimada"
                    type="date"
                    value={formData.fecha_cierre_estimada}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        fecha_cierre_estimada: e.target.value,
                      })
                    }
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="cliente_asociado">Cliente Asociado (Opcional)</Label>
                <Select
                  value={formData.cliente_asociado}
                  onValueChange={(value) =>
                    setFormData({ ...formData, cliente_asociado: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccione un cliente" />
                  </SelectTrigger>
                  <SelectContent>
                    {clientes.map((cliente) => (
                      <SelectItem key={cliente.id} value={cliente.id}>
                        {cliente.razon_social}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="notas">Notas</Label>
                <Textarea
                  id="notas"
                  value={formData.notas}
                  onChange={(e) =>
                    setFormData({ ...formData, notas: e.target.value })
                  }
                  rows={3}
                />
              </div>
              <div className="flex justify-end gap-2 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsDialogOpen(false)}
                >
                  Cancelar
                </Button>
                <Button type="submit">Crear Oportunidad</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex gap-4 overflow-x-auto pb-4">
        {ESTADOS.map((estado) => {
          const oportunidadesEstado = getOportunidadesPorEstado(estado);
          const totalValor = oportunidadesEstado.reduce(
            (sum, opp) => sum + opp.valor_estimado,
            0
          );

          return (
            <div key={estado} className="min-w-[220px] w-[220px] flex-shrink-0">
              <Card className="h-full">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium">
                    <div className="flex items-center justify-between">
                      <span>{estado}</span>
                      <Badge variant="secondary" className="ml-2">
                        {oportunidadesEstado.length}
                      </Badge>
                    </div>
                  </CardTitle>
                  {totalValor > 0 && (
                    <p className="text-xs text-muted-foreground">
                      {formatCurrency(totalValor)}
                    </p>
                  )}
                </CardHeader>
                <CardContent className="space-y-2">
                  {oportunidadesEstado.length === 0 ? (
                    <p className="text-xs text-muted-foreground text-center py-4">
                      Sin oportunidades
                    </p>
                  ) : (
                    oportunidadesEstado.map((oportunidad) => (
                      <Card
                        key={oportunidad.id}
                        className="p-3 hover:shadow-md transition-shadow cursor-pointer"
                      >
                        <div className="space-y-2">
                          <div className="flex items-start justify-between">
                            <h4 className="font-medium text-sm">
                              {oportunidad.nombre_contacto}
                            </h4>
                            <Badge className={getEstadoColor(oportunidad.estado)}>
                              {oportunidad.estado}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Building2 className="h-3 w-3" />
                            <span>{oportunidad.empresa_potencial}</span>
                          </div>
                          {oportunidad.valor_estimado > 0 && (
                            <div className="flex items-center gap-1 text-xs font-medium text-green-600 dark:text-green-400">
                              <DollarSign className="h-3 w-3" />
                              <span>
                                {formatCurrency(oportunidad.valor_estimado)}
                              </span>
                            </div>
                          )}
                          {oportunidad.fecha_cierre_estimada && (
                            <div className="flex items-center gap-1 text-xs text-muted-foreground">
                              <Calendar className="h-3 w-3" />
                              <span>
                                {new Date(
                                  oportunidad.fecha_cierre_estimada
                                ).toLocaleDateString("es-PE")}
                              </span>
                            </div>
                          )}
                          <Select
                            value={oportunidad.estado}
                            onValueChange={(value) =>
                              updateEstado(oportunidad.id, value as EstadoOportunidad)
                            }
                          >
                            <SelectTrigger className="h-7 text-xs">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {ESTADOS.map((est) => (
                                <SelectItem key={est} value={est}>
                                  {est}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </Card>
                    ))
                  )}
                </CardContent>
              </Card>
            </div>
          );
        })}
      </div>
    </div>
  );
}
