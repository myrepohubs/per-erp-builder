import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Plus, Edit, Trash2, Users } from "lucide-react";
import type { Tables, TablesInsert } from "@/integrations/supabase/types";

type Empleado = Tables<"empleados">;
type Departamento = Tables<"departamentos">;

export default function EmpleadosPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingEmp, setEditingEmp] = useState<Empleado | null>(null);
  const [empToDelete, setEmpToDelete] = useState<Empleado | null>(null);
  const [formData, setFormData] = useState({
    nombres: "",
    apellidos: "",
    dni: "",
    email: "",
    telefono: "",
    direccion: "",
    fecha_nacimiento: "",
    fecha_ingreso: new Date().toISOString().split("T")[0],
    cargo: "",
    salario: "",
    departamento_id: "",
    activo: true,
  });

  const { data: empleados = [], isLoading } = useQuery({
    queryKey: ["empleados"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("empleados")
        .select("*, departamentos(nombre)")
        .order("apellidos");
      if (error) throw error;
      return data;
    },
  });

  const { data: departamentos = [] } = useQuery({
    queryKey: ["departamentos"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("departamentos")
        .select("*")
        .order("nombre");
      if (error) throw error;
      return data as Departamento[];
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: Omit<TablesInsert<"empleados">, "user_id">) => {
      const { data: user } = await supabase.auth.getUser();
      const { error } = await supabase
        .from("empleados")
        .insert({ ...data, user_id: user.user!.id });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["empleados"] });
      toast({ title: "Empleado creado exitosamente" });
      resetForm();
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<Empleado> }) => {
      const { error } = await supabase
        .from("empleados")
        .update(data)
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["empleados"] });
      toast({ title: "Empleado actualizado exitosamente" });
      resetForm();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("empleados").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["empleados"] });
      toast({ title: "Empleado eliminado" });
    },
  });

  const resetForm = () => {
    setIsDialogOpen(false);
    setEditingEmp(null);
    setFormData({
      nombres: "",
      apellidos: "",
      dni: "",
      email: "",
      telefono: "",
      direccion: "",
      fecha_nacimiento: "",
      fecha_ingreso: new Date().toISOString().split("T")[0],
      cargo: "",
      salario: "",
      departamento_id: "",
      activo: true,
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      ...formData,
      salario: formData.salario ? parseFloat(formData.salario) : null,
      departamento_id: formData.departamento_id || null,
    };
    
    if (editingEmp) {
      updateMutation.mutate({ id: editingEmp.id, data: payload });
    } else {
      createMutation.mutate(payload);
    }
  };

  const openEditDialog = (emp: any) => {
    setEditingEmp(emp);
    setFormData({
      nombres: emp.nombres,
      apellidos: emp.apellidos,
      dni: emp.dni,
      email: emp.email || "",
      telefono: emp.telefono || "",
      direccion: emp.direccion || "",
      fecha_nacimiento: emp.fecha_nacimiento || "",
      fecha_ingreso: emp.fecha_ingreso,
      cargo: emp.cargo,
      salario: emp.salario?.toString() || "",
      departamento_id: emp.departamento_id || "",
      activo: emp.activo ?? true,
    });
    setIsDialogOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Empleados</h1>
          <p className="text-muted-foreground">Gestiona el personal de la empresa</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={resetForm} className="bg-primary hover:bg-primary-hover">
              <Plus className="mr-2 h-4 w-4" />
              Nuevo Empleado
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingEmp ? "Editar Empleado" : "Nuevo Empleado"}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="nombres">Nombres *</Label>
                  <Input
                    id="nombres"
                    value={formData.nombres}
                    onChange={(e) => setFormData({ ...formData, nombres: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="apellidos">Apellidos *</Label>
                  <Input
                    id="apellidos"
                    value={formData.apellidos}
                    onChange={(e) => setFormData({ ...formData, apellidos: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="dni">DNI *</Label>
                  <Input
                    id="dni"
                    value={formData.dni}
                    onChange={(e) => setFormData({ ...formData, dni: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="cargo">Cargo *</Label>
                  <Input
                    id="cargo"
                    value={formData.cargo}
                    onChange={(e) => setFormData({ ...formData, cargo: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="departamento_id">Departamento</Label>
                  <Select
                    value={formData.departamento_id}
                    onValueChange={(value) => setFormData({ ...formData, departamento_id: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar" />
                    </SelectTrigger>
                    <SelectContent>
                      {departamentos.map((dept) => (
                        <SelectItem key={dept.id} value={dept.id}>
                          {dept.nombre}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="salario">Salario</Label>
                  <Input
                    id="salario"
                    type="number"
                    step="0.01"
                    value={formData.salario}
                    onChange={(e) => setFormData({ ...formData, salario: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="telefono">Teléfono</Label>
                  <Input
                    id="telefono"
                    value={formData.telefono}
                    onChange={(e) => setFormData({ ...formData, telefono: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="fecha_nacimiento">Fecha Nacimiento</Label>
                  <Input
                    id="fecha_nacimiento"
                    type="date"
                    value={formData.fecha_nacimiento}
                    onChange={(e) => setFormData({ ...formData, fecha_nacimiento: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="fecha_ingreso">Fecha Ingreso *</Label>
                  <Input
                    id="fecha_ingreso"
                    type="date"
                    value={formData.fecha_ingreso}
                    onChange={(e) => setFormData({ ...formData, fecha_ingreso: e.target.value })}
                    required
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="direccion">Dirección</Label>
                <Input
                  id="direccion"
                  value={formData.direccion}
                  onChange={(e) => setFormData({ ...formData, direccion: e.target.value })}
                />
              </div>
              <div className="flex gap-2">
                <Button type="submit" className="flex-1">
                  {editingEmp ? "Actualizar" : "Crear"}
                </Button>
                <Button type="button" variant="outline" onClick={resetForm}>
                  Cancelar
                </Button>
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
              <TableHead>DNI</TableHead>
              <TableHead>Cargo</TableHead>
              <TableHead>Departamento</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center">Cargando...</TableCell>
              </TableRow>
            ) : empleados.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                  <Users className="mx-auto h-12 w-12 mb-2 opacity-50" />
                  No hay empleados registrados
                </TableCell>
              </TableRow>
            ) : (
              empleados.map((emp: any) => (
                <TableRow key={emp.id}>
                  <TableCell className="font-medium">
                    {emp.nombres} {emp.apellidos}
                  </TableCell>
                  <TableCell>{emp.dni}</TableCell>
                  <TableCell>{emp.cargo}</TableCell>
                  <TableCell>{emp.departamentos?.nombre || "-"}</TableCell>
                  <TableCell>
                    <Badge variant={emp.activo ? "default" : "secondary"}>
                      {emp.activo ? "Activo" : "Inactivo"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right space-x-2">
                    <Button size="sm" variant="outline" onClick={() => openEditDialog(emp)}>
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setEmpToDelete(emp)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>

      {/* AlertDialog para confirmar eliminación */}
      <AlertDialog open={!!empToDelete} onOpenChange={(open) => !open && setEmpToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar empleado?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. Se eliminará permanentemente el empleado
              <span className="font-semibold"> {empToDelete?.nombres} {empToDelete?.apellidos}</span> (DNI: {empToDelete?.dni}).
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (empToDelete) {
                  deleteMutation.mutate(empToDelete.id);
                  setEmpToDelete(null);
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
