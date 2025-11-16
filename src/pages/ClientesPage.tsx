import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Pencil, Trash2, Search } from "lucide-react";
import { toast } from "sonner";

interface Cliente {
  id: string;
  ruc: string;
  razon_social: string;
  direccion: string | null;
  email: string | null;
  telefono: string | null;
}

export default function ClientesPage() {
  const { user } = useAuth();
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingCliente, setEditingCliente] = useState<Cliente | null>(null);
  const [formData, setFormData] = useState({
    ruc: "",
    razon_social: "",
    direccion: "",
    email: "",
    telefono: "",
  });

  useEffect(() => {
    if (user) {
      fetchClientes();
    }
  }, [user]);

  const fetchClientes = async () => {
    try {
      const { data, error } = await supabase
        .from("clientes")
        .select("*")
        .order("razon_social");

      if (error) throw error;
      setClientes(data || []);
    } catch (error: any) {
      toast.error("Error al cargar clientes");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (formData.ruc.length !== 11) {
      toast.error("El RUC debe tener exactamente 11 dígitos");
      return;
    }

    try {
      if (editingCliente) {
        const { error } = await supabase
          .from("clientes")
          .update(formData)
          .eq("id", editingCliente.id);

        if (error) throw error;
        toast.success("Cliente actualizado exitosamente");
      } else {
        const { error } = await supabase
          .from("clientes")
          .insert([{ ...formData, user_id: user?.id }]);

        if (error) throw error;
        toast.success("Cliente creado exitosamente");
      }

      setIsDialogOpen(false);
      resetForm();
      fetchClientes();
    } catch (error: any) {
      toast.error(error.message || "Error al guardar cliente");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("¿Está seguro de eliminar este cliente?")) return;

    try {
      const { error } = await supabase.from("clientes").delete().eq("id", id);

      if (error) throw error;
      toast.success("Cliente eliminado exitosamente");
      fetchClientes();
    } catch (error: any) {
      toast.error("Error al eliminar cliente");
    }
  };

  const openEditDialog = (cliente: Cliente) => {
    setEditingCliente(cliente);
    setFormData({
      ruc: cliente.ruc,
      razon_social: cliente.razon_social,
      direccion: cliente.direccion || "",
      email: cliente.email || "",
      telefono: cliente.telefono || "",
    });
    setIsDialogOpen(true);
  };

  const resetForm = () => {
    setFormData({
      ruc: "",
      razon_social: "",
      direccion: "",
      email: "",
      telefono: "",
    });
    setEditingCliente(null);
  };

  const filteredClientes = clientes.filter(
    (cliente) =>
      cliente.razon_social.toLowerCase().includes(searchTerm.toLowerCase()) ||
      cliente.ruc.includes(searchTerm)
  );

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
            Gestión de Clientes
          </h1>
          <p className="text-muted-foreground mt-1">
            Administre su cartera de clientes y sus datos de contacto
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
              Nuevo Cliente
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                {editingCliente ? "Editar Cliente" : "Nuevo Cliente"}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="ruc">RUC *</Label>
                  <Input
                    id="ruc"
                    value={formData.ruc}
                    onChange={(e) =>
                      setFormData({ ...formData, ruc: e.target.value })
                    }
                    placeholder="12345678901"
                    maxLength={11}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="razon_social">Razón Social *</Label>
                  <Input
                    id="razon_social"
                    value={formData.razon_social}
                    onChange={(e) =>
                      setFormData({ ...formData, razon_social: e.target.value })
                    }
                    required
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="direccion">Dirección</Label>
                <Input
                  id="direccion"
                  value={formData.direccion}
                  onChange={(e) =>
                    setFormData({ ...formData, direccion: e.target.value })
                  }
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) =>
                      setFormData({ ...formData, email: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="telefono">Teléfono</Label>
                  <Input
                    id="telefono"
                    value={formData.telefono}
                    onChange={(e) =>
                      setFormData({ ...formData, telefono: e.target.value })
                    }
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsDialogOpen(false)}
                >
                  Cancelar
                </Button>
                <Button type="submit">
                  {editingCliente ? "Actualizar" : "Crear"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por razón social o RUC..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {filteredClientes.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">
                {searchTerm
                  ? "No se encontraron clientes"
                  : "No hay clientes registrados. Cree su primer cliente."}
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>RUC</TableHead>
                  <TableHead>Razón Social</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Teléfono</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredClientes.map((cliente) => (
                  <TableRow key={cliente.id}>
                    <TableCell className="font-mono">{cliente.ruc}</TableCell>
                    <TableCell className="font-medium">
                      {cliente.razon_social}
                    </TableCell>
                    <TableCell>{cliente.email || "-"}</TableCell>
                    <TableCell>{cliente.telefono || "-"}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openEditDialog(cliente)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDelete(cliente.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
