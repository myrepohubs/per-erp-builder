import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Pencil, Trash2, Search, Download, ChevronRight, ChevronDown } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { planContablePCGE2020 } from "@/data/planContablePCGE2020";
import type { TablesInsert } from "@/integrations/supabase/types";

export default function CuentasContablesPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingCuenta, setEditingCuenta] = useState<any>(null);
  const [expandedCuentas, setExpandedCuentas] = useState<Set<string>>(new Set());
  const [isLoadingPCGE, setIsLoadingPCGE] = useState(false);
  const [cuentaToDelete, setCuentaToDelete] = useState<any>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [formData, setFormData] = useState({
    codigo: "",
    nombre: "",
    tipo: "Activo" as const,
    descripcion: "",
  });

  const { data: cuentas = [], isLoading } = useQuery({
    queryKey: ["cuentas_contables"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("No user found");

      const { data, error } = await supabase
        .from("cuentas_contables")
        .select("*")
        .eq("user_id", user.id)
        .order("codigo", { ascending: true });

      if (error) throw error;
      return data || [];
    },
  });

  const createMutation = useMutation({
    mutationFn: async (newCuenta: Omit<TablesInsert<"cuentas_contables">, "user_id">) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("No user found");

      const { error } = await supabase
        .from("cuentas_contables")
        .insert({ ...newCuenta, user_id: user.id });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cuentas_contables"] });
      toast({ title: "Cuenta creada exitosamente" });
      setIsDialogOpen(false);
      resetForm();
    },
    onError: (error: any) => {
      toast({ 
        title: "Error al crear cuenta", 
        description: error.message,
        variant: "destructive" 
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, ...updates }: any) => {
      const { error } = await supabase
        .from("cuentas_contables")
        .update(updates)
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cuentas_contables"] });
      toast({ title: "Cuenta actualizada exitosamente" });
      setIsDialogOpen(false);
      setEditingCuenta(null);
      resetForm();
    },
    onError: (error: any) => {
      toast({ 
        title: "Error al actualizar cuenta", 
        description: error.message,
        variant: "destructive" 
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("cuentas_contables")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cuentas_contables"] });
      toast({ title: "Cuenta eliminada exitosamente" });
    },
    onError: (error: any) => {
      toast({ 
        title: "Error al eliminar cuenta", 
        description: error.message,
        variant: "destructive" 
      });
    },
  });

  const loadPCGE2020 = async () => {
    if (!confirm("¿Desea cargar el Plan Contable General Empresarial (PCGE) 2020? Esto agregará todas las cuentas del plan contable peruano.")) {
      return;
    }

    setIsLoadingPCGE(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("No user found");

      // Insertar en lotes de 100 para evitar timeouts
      const batchSize = 100;
      for (let i = 0; i < planContablePCGE2020.length; i += batchSize) {
        const batch = planContablePCGE2020.slice(i, i + batchSize).map(cuenta => ({
          codigo: cuenta.codigo,
          nombre: cuenta.nombre,
          tipo: cuenta.tipo,
          nivel: cuenta.nivel,
          user_id: user.id,
          activa: true,
        }));

        const { error } = await supabase
          .from("cuentas_contables")
          .upsert(batch, { onConflict: 'codigo,user_id', ignoreDuplicates: true });

        if (error) throw error;
      }

      queryClient.invalidateQueries({ queryKey: ["cuentas_contables"] });
      toast({ 
        title: "Plan Contable cargado", 
        description: `Se cargaron ${planContablePCGE2020.length} cuentas del PCGE 2020` 
      });
    } catch (error: any) {
      toast({ 
        title: "Error al cargar PCGE", 
        description: error.message,
        variant: "destructive" 
      });
    } finally {
      setIsLoadingPCGE(false);
    }
  };

  const resetForm = () => {
    setFormData({
      codigo: "",
      nombre: "",
      tipo: "Activo",
      descripcion: "",
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (editingCuenta) {
      updateMutation.mutate({ id: editingCuenta.id, ...formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const handleEdit = (cuenta: any) => {
    setEditingCuenta(cuenta);
    setFormData({
      codigo: cuenta.codigo,
      nombre: cuenta.nombre,
      tipo: cuenta.tipo,
      descripcion: cuenta.descripcion || "",
    });
    setIsDialogOpen(true);
  };

  const confirmDelete = () => {
    if (cuentaToDelete) {
      deleteMutation.mutate(cuentaToDelete.id);
      setCuentaToDelete(null);
    }
  };

  const toggleExpand = (codigo: string) => {
    const newExpanded = new Set(expandedCuentas);
    if (newExpanded.has(codigo)) {
      newExpanded.delete(codigo);
    } else {
      newExpanded.add(codigo);
    }
    setExpandedCuentas(newExpanded);
  };

  const filteredCuentas = cuentas.filter(
    (cuenta) =>
      cuenta.codigo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      cuenta.nombre.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getNivelIndent = (nivel: number) => {
    return `${(nivel - 1) * 20}px`;
  };

  const hasChildren = (codigo: string) => {
    return cuentas.some(c => c.codigo.startsWith(codigo) && c.codigo !== codigo);
  };

  const isVisible = (cuenta: any) => {
    if (searchTerm) return true;
    if (cuenta.nivel === 1) return true;
    
    // Check if any parent is expanded
    for (let i = 2; i <= cuenta.codigo.length; i++) {
      const parentCode = cuenta.codigo.substring(0, i - 1);
      if (cuentas.some(c => c.codigo === parentCode) && !expandedCuentas.has(parentCode)) {
        return false;
      }
    }
    return true;
  };

  const visibleCuentas = searchTerm ? filteredCuentas : filteredCuentas.filter(isVisible);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Plan de Cuentas</h1>
          <p className="text-muted-foreground">Plan Contable General Empresarial (PCGE) 2020</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={loadPCGE2020} disabled={isLoadingPCGE}>
            <Download className="mr-2 h-4 w-4" />
            {isLoadingPCGE ? "Cargando..." : "Cargar PCGE 2020"}
          </Button>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => { setEditingCuenta(null); resetForm(); }}>
                <Plus className="mr-2 h-4 w-4" />
                Nueva Cuenta
              </Button>
            </DialogTrigger>
            <DialogContent>
              <form onSubmit={handleSubmit}>
                <DialogHeader>
                  <DialogTitle>{editingCuenta ? "Editar Cuenta" : "Nueva Cuenta"}</DialogTitle>
                  <DialogDescription>
                    Complete la información de la cuenta contable
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <Label htmlFor="codigo">Código</Label>
                    <Input
                      id="codigo"
                      value={formData.codigo}
                      onChange={(e) => setFormData({ ...formData, codigo: e.target.value })}
                      required
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="nombre">Nombre</Label>
                    <Input
                      id="nombre"
                      value={formData.nombre}
                      onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                      required
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="tipo">Tipo</Label>
                    <Select value={formData.tipo} onValueChange={(value: any) => setFormData({ ...formData, tipo: value })}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Activo">Activo</SelectItem>
                        <SelectItem value="Pasivo">Pasivo</SelectItem>
                        <SelectItem value="Patrimonio">Patrimonio</SelectItem>
                        <SelectItem value="Ingreso">Ingreso</SelectItem>
                        <SelectItem value="Gasto">Gasto</SelectItem>
                        <SelectItem value="Costos">Costos</SelectItem>
                        <SelectItem value="Saldos Intermediarios">Saldos Intermediarios</SelectItem>
                        <SelectItem value="Orden">Orden</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="descripcion">Descripción</Label>
                    <Textarea
                      id="descripcion"
                      value={formData.descripcion}
                      onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button type="submit">
                    {editingCuenta ? "Actualizar" : "Crear"}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Cuentas Contables</CardTitle>
          <CardDescription>
            {cuentas.length > 0 
              ? `${cuentas.length} cuentas registradas en el plan contable`
              : "Cargue el PCGE 2020 para iniciar con el plan contable oficial"}
          </CardDescription>
          <div className="flex items-center gap-2 pt-4">
            <Search className="h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por código o nombre..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="max-w-sm"
            />
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">Cargando cuentas...</div>
          ) : visibleCuentas.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              {cuentas.length === 0 
                ? "No hay cuentas registradas. Use el botón 'Cargar PCGE 2020' para importar el plan contable."
                : "No se encontraron cuentas"}
            </div>
          ) : (
            <div className="max-h-[600px] overflow-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[150px]">Código</TableHead>
                    <TableHead>Nombre</TableHead>
                    <TableHead className="w-[120px]">Tipo</TableHead>
                    <TableHead className="w-[100px]">Estado</TableHead>
                    <TableHead className="text-right w-[100px]">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {visibleCuentas.map((cuenta) => (
                    <TableRow key={cuenta.id} className={cuenta.nivel === 1 ? "bg-muted/50 font-semibold" : ""}>
                      <TableCell className="font-mono">
                        <div className="flex items-center" style={{ paddingLeft: getNivelIndent(cuenta.nivel) }}>
                          {hasChildren(cuenta.codigo) && !searchTerm && (
                            <button
                              onClick={() => toggleExpand(cuenta.codigo)}
                              className="mr-1 p-0.5 hover:bg-muted rounded"
                            >
                              {expandedCuentas.has(cuenta.codigo) 
                                ? <ChevronDown className="h-4 w-4" />
                                : <ChevronRight className="h-4 w-4" />
                              }
                            </button>
                          )}
                          {cuenta.codigo}
                        </div>
                      </TableCell>
                      <TableCell className={cuenta.nivel === 1 ? "uppercase" : ""}>{cuenta.nombre}</TableCell>
                      <TableCell>
                        <span className={`px-2 py-1 rounded text-xs ${
                          cuenta.tipo === 'Activo' ? 'bg-blue-100 text-blue-800' :
                          cuenta.tipo === 'Pasivo' ? 'bg-red-100 text-red-800' :
                          cuenta.tipo === 'Patrimonio' ? 'bg-purple-100 text-purple-800' :
                          cuenta.tipo === 'Ingreso' ? 'bg-green-100 text-green-800' :
                          cuenta.tipo === 'Gasto' ? 'bg-orange-100 text-orange-800' :
                          cuenta.tipo === 'Costos' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {cuenta.tipo}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className={`px-2 py-1 rounded text-xs ${cuenta.activa ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                          {cuenta.activa ? "Activa" : "Inactiva"}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEdit(cuenta)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setCuentaToDelete(cuenta)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <AlertDialog open={!!cuentaToDelete} onOpenChange={(open) => !open && setCuentaToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar cuenta contable?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. Se eliminará permanentemente la cuenta
              <span className="font-semibold"> {cuentaToDelete?.codigo} - {cuentaToDelete?.nombre}</span>.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
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
