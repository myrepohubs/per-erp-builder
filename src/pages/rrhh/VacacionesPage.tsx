import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Plus, Calendar, Edit, Trash2 } from "lucide-react";
import type { Tables, TablesInsert, Enums } from "@/integrations/supabase/types";

type Vacacion = Tables<"vacaciones">;

export default function VacacionesPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingVac, setEditingVac] = useState<any>(null);
  const [vacToDelete, setVacToDelete] = useState<any>(null);
  const [formData, setFormData] = useState({
    empleado_id: "",
    fecha_inicio: "",
    fecha_fin: "",
    dias_totales: 0,
    motivo: "",
    estado: "Pendiente" as Enums<"estado_vacacion">,
  });

  const { data: vacaciones = [], isLoading } = useQuery({
    queryKey: ["vacaciones"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("vacaciones")
        .select("*, empleados(nombres, apellidos)")
        .order("fecha_inicio", { ascending: false });
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
    mutationFn: async (data: Omit<TablesInsert<"vacaciones">, "user_id">) => {
      const { data: user } = await supabase.auth.getUser();
      const { error } = await supabase
        .from("vacaciones")
        .insert({ ...data, user_id: user.user!.id });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["vacaciones"] });
      toast({ title: "Solicitud de vacaciones creada" });
      resetForm();
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<Vacacion> }) => {
      const { error } = await supabase
        .from("vacaciones")
        .update(data)
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["vacaciones"] });
      toast({ title: "Solicitud actualizada" });
      resetForm();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("vacaciones").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["vacaciones"] });
      toast({ title: "Solicitud eliminada" });
    },
  });

  const resetForm = () => {
    setIsDialogOpen(false);
    setEditingVac(null);
    setFormData({
      empleado_id: "",
      fecha_inicio: "",
      fecha_fin: "",
      dias_totales: 0,
      motivo: "",
      estado: "Pendiente",
    });
  };

  const calculateDays = (inicio: string, fin: string) => {
    if (!inicio || !fin) return 0;
    const start = new Date(inicio);
    const end = new Date(fin);
    const diff = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
    return diff > 0 ? diff : 0;
  };

  const handleDateChange = (field: "fecha_inicio" | "fecha_fin", value: string) => {
    const newData = { ...formData, [field]: value };
    newData.dias_totales = calculateDays(newData.fecha_inicio, newData.fecha_fin);
    setFormData(newData);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      ...formData,
      motivo: formData.motivo || null,
    };
    
    if (editingVac) {
      updateMutation.mutate({ id: editingVac.id, data: payload });
    } else {
      createMutation.mutate(payload);
    }
  };

  const openEditDialog = (vac: any) => {
    setEditingVac(vac);
    setFormData({
      empleado_id: vac.empleado_id,
      fecha_inicio: vac.fecha_inicio,
      fecha_fin: vac.fecha_fin,
      dias_totales: vac.dias_totales,
      motivo: vac.motivo || "",
      estado: vac.estado,
    });
    setIsDialogOpen(true);
  };

  const getBadgeVariant = (estado: string) => {
    switch (estado) {
      case "Aprobado": return "default";
      case "Pendiente": return "secondary";
      case "Rechazado": return "destructive";
      default: return "outline";
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Vacaciones</h1>
          <p className="text-muted-foreground">Gestión de solicitudes de vacaciones</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={resetForm} className="bg-primary hover:bg-primary-hover">
              <Plus className="mr-2 h-4 w-4" />
              Nueva Solicitud
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingVac ? "Editar Solicitud" : "Nueva Solicitud"}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="empleado_id">Empleado *</Label>
                <Select
                  value={formData.empleado_id}
                  onValueChange={(value) => setFormData({ ...formData, empleado_id: value })}
                  required
                  disabled={!!editingVac}
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
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="fecha_inicio">Fecha Inicio *</Label>
                  <Input
                    id="fecha_inicio"
                    type="date"
                    value={formData.fecha_inicio}
                    onChange={(e) => handleDateChange("fecha_inicio", e.target.value)}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="fecha_fin">Fecha Fin *</Label>
                  <Input
                    id="fecha_fin"
                    type="date"
                    value={formData.fecha_fin}
                    onChange={(e) => handleDateChange("fecha_fin", e.target.value)}
                    required
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="dias_totales">Días Totales</Label>
                <Input
                  id="dias_totales"
                  type="number"
                  value={formData.dias_totales}
                  readOnly
                  className="bg-muted"
                />
              </div>
              <div>
                <Label htmlFor="estado">Estado</Label>
                <Select
                  value={formData.estado}
                  onValueChange={(value: Enums<"estado_vacacion">) => setFormData({ ...formData, estado: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Pendiente">Pendiente</SelectItem>
                    <SelectItem value="Aprobado">Aprobado</SelectItem>
                    <SelectItem value="Rechazado">Rechazado</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="motivo">Motivo</Label>
                <Textarea
                  id="motivo"
                  value={formData.motivo}
                  onChange={(e) => setFormData({ ...formData, motivo: e.target.value })}
                  rows={3}
                />
              </div>
              <div className="flex gap-2">
                <Button type="submit" className="flex-1">
                  {editingVac ? "Actualizar" : "Crear"}
                </Button>
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
              <TableHead>Empleado</TableHead>
              <TableHead>Fecha Inicio</TableHead>
              <TableHead>Fecha Fin</TableHead>
              <TableHead>Días</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center">Cargando...</TableCell>
              </TableRow>
            ) : vacaciones.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                  <Calendar className="mx-auto h-12 w-12 mb-2 opacity-50" />
                  No hay solicitudes de vacaciones
                </TableCell>
              </TableRow>
            ) : (
              vacaciones.map((vac: any) => (
                <TableRow key={vac.id}>
                  <TableCell className="font-medium">
                    {vac.empleados.apellidos}, {vac.empleados.nombres}
                  </TableCell>
                  <TableCell>{new Date(vac.fecha_inicio).toLocaleDateString()}</TableCell>
                  <TableCell>{new Date(vac.fecha_fin).toLocaleDateString()}</TableCell>
                  <TableCell>{vac.dias_totales}</TableCell>
                  <TableCell>
                    <Badge variant={getBadgeVariant(vac.estado)}>
                      {vac.estado}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right space-x-2">
                    <Button size="sm" variant="outline" onClick={() => openEditDialog(vac)}>
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => setVacToDelete(vac)}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>

      <AlertDialog open={!!vacToDelete} onOpenChange={(open) => !open && setVacToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar solicitud de vacaciones?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. Se eliminará permanentemente la solicitud de vacaciones de
              <span className="font-semibold"> {vacToDelete?.empleados?.apellidos}, {vacToDelete?.empleados?.nombres}</span> del {vacToDelete ? new Date(vacToDelete.fecha_inicio).toLocaleDateString() : ""} al {vacToDelete ? new Date(vacToDelete.fecha_fin).toLocaleDateString() : ""}.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (vacToDelete) {
                  deleteMutation.mutate(vacToDelete.id);
                  setVacToDelete(null);
                }
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
