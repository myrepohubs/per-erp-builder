import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Pencil, Trash2, Building2 } from "lucide-react";
import { toast } from "sonner";
import { Textarea } from "@/components/ui/textarea";

interface Proveedor {
  id: string;
  ruc: string;
  razon_social: string;
  contacto: string | null;
  telefono: string | null;
  email: string | null;
  direccion: string | null;
}

export default function ProveedoresPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [proveedorToDelete, setProveedorToDelete] = useState<Proveedor | null>(null);
  const [formData, setFormData] = useState({
    ruc: "",
    razon_social: "",
    contacto: "",
    telefono: "",
    email: "",
    direccion: "",
  });

  const { data: proveedores = [], isLoading } = useQuery({
    queryKey: ["proveedores"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("proveedores")
        .select("*")
        .eq("user_id", user?.id || "")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as Proveedor[];
    },
    enabled: !!user,
  });

  const createMutation = useMutation({
    mutationFn: async (newProveedor: typeof formData) => {
      const { error } = await supabase.from("proveedores").insert({
        ...newProveedor,
        user_id: user?.id,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["proveedores"] });
      toast.success("Proveedor creado exitosamente");
      resetForm();
    },
    onError: (error: any) => {
      toast.error(error.message || "Error al crear proveedor");
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: typeof formData }) => {
      const { error } = await supabase
        .from("proveedores")
        .update(data)
        .eq("id", id)
        .eq("user_id", user?.id || "");
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["proveedores"] });
      toast.success("Proveedor actualizado exitosamente");
      resetForm();
    },
    onError: (error: any) => {
      toast.error(error.message || "Error al actualizar proveedor");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("proveedores")
        .delete()
        .eq("id", id)
        .eq("user_id", user?.id || "");
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["proveedores"] });
      toast.success("Proveedor eliminado exitosamente");
    },
    onError: (error: any) => {
      toast.error(error.message || "Error al eliminar proveedor");
    },
  });

  const resetForm = () => {
    setFormData({
      ruc: "",
      razon_social: "",
      contacto: "",
      telefono: "",
      email: "",
      direccion: "",
    });
    setEditingId(null);
    setOpen(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validar RUC único
    const rucExists = proveedores.some(
      (p) => p.ruc === formData.ruc && p.id !== editingId
    );
    
    if (rucExists) {
      toast.error("El RUC ya está registrado para otro proveedor");
      return;
    }
    
    if (editingId) {
      updateMutation.mutate({ id: editingId, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const handleEdit = (proveedor: Proveedor) => {
    setFormData({
      ruc: proveedor.ruc,
      razon_social: proveedor.razon_social,
      contacto: proveedor.contacto || "",
      telefono: proveedor.telefono || "",
      email: proveedor.email || "",
      direccion: proveedor.direccion || "",
    });
    setEditingId(proveedor.id);
    setOpen(true);
  };

  const handleDelete = () => {
    if (!proveedorToDelete) return;
    deleteMutation.mutate(proveedorToDelete.id, {
      onSettled: () => setProveedorToDelete(null),
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Proveedores</h1>
          <p className="text-muted-foreground">Gestiona tu lista de proveedores</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => { resetForm(); setOpen(true); }}>
              <Plus className="mr-2 h-4 w-4" />
              Nuevo Proveedor
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                {editingId ? "Editar Proveedor" : "Nuevo Proveedor"}
              </DialogTitle>
              <DialogDescription>
                Completa la información del proveedor
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit}>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="ruc">RUC *</Label>
                    <Input
                      id="ruc"
                      value={formData.ruc}
                      onChange={(e) => setFormData({ ...formData, ruc: e.target.value })}
                      required
                      maxLength={11}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="razon_social">Razón Social *</Label>
                    <Input
                      id="razon_social"
                      value={formData.razon_social}
                      onChange={(e) => setFormData({ ...formData, razon_social: e.target.value })}
                      required
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="contacto">Nombre de Contacto</Label>
                    <Input
                      id="contacto"
                      value={formData.contacto}
                      onChange={(e) => setFormData({ ...formData, contacto: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="telefono">Teléfono</Label>
                    <Input
                      id="telefono"
                      value={formData.telefono}
                      onChange={(e) => setFormData({ ...formData, telefono: e.target.value })}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="direccion">Dirección</Label>
                  <Textarea
                    id="direccion"
                    value={formData.direccion}
                    onChange={(e) => setFormData({ ...formData, direccion: e.target.value })}
                    rows={2}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={resetForm}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
                  {editingId ? "Actualizar" : "Crear"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5 text-primary" />
            Lista de Proveedores
          </CardTitle>
          <CardDescription>
            {proveedores.length} proveedor(es) registrado(s)
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">Cargando...</div>
          ) : proveedores.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No hay proveedores registrados. Crea tu primer proveedor.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>RUC</TableHead>
                  <TableHead>Razón Social</TableHead>
                  <TableHead>Contacto</TableHead>
                  <TableHead>Teléfono</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {proveedores.map((proveedor) => (
                  <TableRow key={proveedor.id}>
                    <TableCell className="font-medium">{proveedor.ruc}</TableCell>
                    <TableCell>{proveedor.razon_social}</TableCell>
                    <TableCell>{proveedor.contacto || "-"}</TableCell>
                    <TableCell>{proveedor.telefono || "-"}</TableCell>
                    <TableCell>{proveedor.email || "-"}</TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleEdit(proveedor)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setProveedorToDelete(proveedor)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Diálogo de confirmación para eliminar */}
      <AlertDialog open={!!proveedorToDelete} onOpenChange={(open) => !open && setProveedorToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar proveedor?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. Se eliminará permanentemente el proveedor
              <span className="font-semibold"> {proveedorToDelete?.razon_social}</span>.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
