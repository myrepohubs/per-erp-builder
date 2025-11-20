import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Plus, Clock } from "lucide-react";
import type { Tables, TablesInsert, Enums } from "@/integrations/supabase/types";

type Asistencia = Tables<"asistencias">;

export default function AsistenciasPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    empleado_id: "",
    fecha: new Date().toISOString().split("T")[0],
    tipo: "Presente" as Enums<"tipo_asistencia">,
    hora_entrada: "",
    hora_salida: "",
    notas: "",
  });

  const { data: asistencias = [], isLoading } = useQuery({
    queryKey: ["asistencias"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("asistencias")
        .select("*, empleados(nombres, apellidos)")
        .order("fecha", { ascending: false })
        .limit(50);
      if (error) throw error;
      return data;
    },
  });

  const { data: empleados = [] } = useQuery({
    queryKey: ["empleados"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("empleados")
        .select("id, nombres, apellidos")
        .eq("activo", true)
        .order("apellidos");
      if (error) throw error;
      return data;
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: Omit<TablesInsert<"asistencias">, "user_id">) => {
      const { data: user } = await supabase.auth.getUser();
      const { error } = await supabase
        .from("asistencias")
        .insert({ ...data, user_id: user.user!.id });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["asistencias"] });
      toast({ title: "Asistencia registrada exitosamente" });
      resetForm();
    },
  });

  const resetForm = () => {
    setIsDialogOpen(false);
    setFormData({
      empleado_id: "",
      fecha: new Date().toISOString().split("T")[0],
      tipo: "Presente",
      hora_entrada: "",
      hora_salida: "",
      notas: "",
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      ...formData,
      hora_entrada: formData.hora_entrada || null,
      hora_salida: formData.hora_salida || null,
      notas: formData.notas || null,
    };
    createMutation.mutate(payload);
  };

  const getBadgeVariant = (tipo: string) => {
    switch (tipo) {
      case "Presente": return "default";
      case "Tardanza": return "secondary";
      case "Ausente": return "destructive";
      case "Permiso": return "outline";
      default: return "default";
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Asistencias</h1>
          <p className="text-muted-foreground">Control de asistencia del personal</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={resetForm} className="bg-primary hover:bg-primary-hover">
              <Plus className="mr-2 h-4 w-4" />
              Registrar Asistencia
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Registrar Asistencia</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="empleado_id">Empleado *</Label>
                <Select
                  value={formData.empleado_id}
                  onValueChange={(value) => setFormData({ ...formData, empleado_id: value })}
                  required
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar empleado" />
                  </SelectTrigger>
                  <SelectContent>
                    {empleados.map((emp) => (
                      <SelectItem key={emp.id} value={emp.id}>
                        {emp.apellidos}, {emp.nombres}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="fecha">Fecha *</Label>
                <Input
                  id="fecha"
                  type="date"
                  value={formData.fecha}
                  onChange={(e) => setFormData({ ...formData, fecha: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label htmlFor="tipo">Tipo *</Label>
                <Select
                  value={formData.tipo}
                  onValueChange={(value: Enums<"tipo_asistencia">) => setFormData({ ...formData, tipo: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Presente">Presente</SelectItem>
                    <SelectItem value="Tardanza">Tardanza</SelectItem>
                    <SelectItem value="Ausente">Ausente</SelectItem>
                    <SelectItem value="Permiso">Permiso</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="hora_entrada">Hora Entrada</Label>
                  <Input
                    id="hora_entrada"
                    type="time"
                    value={formData.hora_entrada}
                    onChange={(e) => setFormData({ ...formData, hora_entrada: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="hora_salida">Hora Salida</Label>
                  <Input
                    id="hora_salida"
                    type="time"
                    value={formData.hora_salida}
                    onChange={(e) => setFormData({ ...formData, hora_salida: e.target.value })}
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="notas">Notas</Label>
                <Textarea
                  id="notas"
                  value={formData.notas}
                  onChange={(e) => setFormData({ ...formData, notas: e.target.value })}
                  rows={2}
                />
              </div>
              <div className="flex gap-2">
                <Button type="submit" className="flex-1">Registrar</Button>
                <Button type="button" variant="outline" onClick={resetForm}>Cancelar</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Fecha</TableHead>
              <TableHead>Empleado</TableHead>
              <TableHead>Tipo</TableHead>
              <TableHead>Entrada</TableHead>
              <TableHead>Salida</TableHead>
              <TableHead>Notas</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center">Cargando...</TableCell>
              </TableRow>
            ) : asistencias.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                  <Clock className="mx-auto h-12 w-12 mb-2 opacity-50" />
                  No hay asistencias registradas
                </TableCell>
              </TableRow>
            ) : (
              asistencias.map((asist: any) => (
                <TableRow key={asist.id}>
                  <TableCell>{new Date(asist.fecha).toLocaleDateString()}</TableCell>
                  <TableCell className="font-medium">
                    {asist.empleados.apellidos}, {asist.empleados.nombres}
                  </TableCell>
                  <TableCell>
                    <Badge variant={getBadgeVariant(asist.tipo)}>
                      {asist.tipo}
                    </Badge>
                  </TableCell>
                  <TableCell>{asist.hora_entrada || "-"}</TableCell>
                  <TableCell>{asist.hora_salida || "-"}</TableCell>
                  <TableCell className="text-muted-foreground">{asist.notas || "-"}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}
