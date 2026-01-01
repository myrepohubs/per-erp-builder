import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Plus, Edit, Trash2, Building2 } from "lucide-react";
import type { Tables, TablesInsert } from "@/integrations/supabase/types";

type Departamento = Tables<"departamentos">;

export default function DepartamentosPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingDept, setEditingDept] = useState<Departamento | null>(null);
  const [formData, setFormData] = useState({ nombre: "", descripcion: "" });

  const { data: departamentos = [], isLoading } = useQuery({
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
    mutationFn: async (data: Omit<TablesInsert<"departamentos">, "user_id">) => {
      const { data: user } = await supabase.auth.getUser();
      const { error } = await supabase
        .from("departamentos")
        .insert({ ...data, user_id: user.user!.id });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["departamentos"] });
      toast({ title: "Departamento creado exitosamente" });
      setIsDialogOpen(false);
      setFormData({ nombre: "", descripcion: "" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<Departamento> }) => {
      const { error } = await supabase
        .from("departamentos")
        .update(data)
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["departamentos"] });
      toast({ title: "Departamento actualizado exitosamente" });
      setIsDialogOpen(false);
      setEditingDept(null);
      setFormData({ nombre: "", descripcion: "" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("departamentos").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["departamentos"] });
      toast({ title: "Departamento eliminado" });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validar nombre único
    const nombreExists = departamentos.some(
      (d) => d.nombre.toLowerCase() === formData.nombre.toLowerCase() && d.id !== editingDept?.id
    );
    
    if (nombreExists) {
      toast({ title: "Ya existe un departamento con este nombre", variant: "destructive" });
      return;
    }
    
    if (editingDept) {
      updateMutation.mutate({ id: editingDept.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const openEditDialog = (dept: Departamento) => {
    setEditingDept(dept);
    setFormData({ nombre: dept.nombre, descripcion: dept.descripcion || "" });
    setIsDialogOpen(true);
  };

  const openCreateDialog = () => {
    setEditingDept(null);
    setFormData({ nombre: "", descripcion: "" });
    setIsDialogOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Departamentos</h1>
          <p className="text-muted-foreground">Gestiona los departamentos de la empresa</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={openCreateDialog} className="bg-primary hover:bg-primary-hover">
              <Plus className="mr-2 h-4 w-4" />
              Nuevo Departamento
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingDept ? "Editar Departamento" : "Nuevo Departamento"}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="nombre">Nombre</Label>
                <Input
                  id="nombre"
                  value={formData.nombre}
                  onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label htmlFor="descripcion">Descripción</Label>
                <Textarea
                  id="descripcion"
                  value={formData.descripcion}
                  onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
                  rows={3}
                />
              </div>
              <div className="flex gap-2">
                <Button type="submit" className="flex-1">
                  {editingDept ? "Actualizar" : "Crear"}
                </Button>
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
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
              <TableHead>Nombre</TableHead>
              <TableHead>Descripción</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={3} className="text-center">Cargando...</TableCell>
              </TableRow>
            ) : departamentos.length === 0 ? (
              <TableRow>
                <TableCell colSpan={3} className="text-center text-muted-foreground py-8">
                  <Building2 className="mx-auto h-12 w-12 mb-2 opacity-50" />
                  No hay departamentos registrados
                </TableCell>
              </TableRow>
            ) : (
              departamentos.map((dept) => (
                <TableRow key={dept.id}>
                  <TableCell className="font-medium">{dept.nombre}</TableCell>
                  <TableCell className="text-muted-foreground">{dept.descripcion || "-"}</TableCell>
                  <TableCell className="text-right space-x-2">
                    <Button size="sm" variant="outline" onClick={() => openEditDialog(dept)}>
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => deleteMutation.mutate(dept.id)}
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
    </div>
  );
}
