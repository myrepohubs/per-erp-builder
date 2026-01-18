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
import { Plus, Pencil, Trash2, FileText } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

export default function AsientosContablesPage() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingAsiento, setEditingAsiento] = useState<any>(null);
  const [asientoToDelete, setAsientoToDelete] = useState<any>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [formData, setFormData] = useState({
    numero_asiento: "",
    fecha: format(new Date(), "yyyy-MM-dd"),
    tipo: "Diario" as const,
    glosa: "",
    referencia: "",
  });

  const [detalles, setDetalles] = useState<Array<{ cuenta_id: string; debe: number; haber: number; glosa: string }>>([
    { cuenta_id: "", debe: 0, haber: 0, glosa: "" }
  ]);

  const { data: asientos = [], isLoading } = useQuery({
    queryKey: ["asientos_contables"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("No user found");

      const { data, error } = await supabase
        .from("asientos_contables")
        .select("*")
        .eq("user_id", user.id)
        .order("fecha", { ascending: false });

      if (error) throw error;
      return data || [];
    },
  });

  const { data: cuentas = [] } = useQuery({
    queryKey: ["cuentas_contables"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("No user found");

      const { data, error } = await supabase
        .from("cuentas_contables")
        .select("*")
        .eq("user_id", user.id)
        .eq("activa", true)
        .order("codigo", { ascending: true });

      if (error) throw error;
      return data || [];
    },
  });

  const createMutation = useMutation({
    mutationFn: async (newAsiento: any) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("No user found");

      const { data: asiento, error: asientoError } = await supabase
        .from("asientos_contables")
        .insert({ ...newAsiento, user_id: user.id })
        .select()
        .single();

      if (asientoError) throw asientoError;

      const detallesConAsiento = detalles.map(detalle => ({
        ...detalle,
        asiento_id: asiento.id
      }));

      const { error: detallesError } = await supabase
        .from("detalles_asiento")
        .insert(detallesConAsiento);

      if (detallesError) throw detallesError;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["asientos_contables"] });
      toast({ title: "Asiento creado exitosamente" });
      setIsDialogOpen(false);
      resetForm();
    },
    onError: (error: any) => {
      toast({ 
        title: "Error al crear asiento", 
        description: error.message,
        variant: "destructive" 
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data: any) => {
      const { error } = await supabase
        .from("asientos_contables")
        .update({
          numero_asiento: data.numero_asiento,
          fecha: data.fecha,
          tipo: data.tipo,
          glosa: data.glosa,
          referencia: data.referencia,
        })
        .eq("id", data.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["asientos_contables"] });
      toast({ title: "Asiento actualizado exitosamente" });
      setIsDialogOpen(false);
      setEditingAsiento(null);
      resetForm();
    },
    onError: (error: any) => {
      toast({ 
        title: "Error al actualizar asiento", 
        description: error.message,
        variant: "destructive" 
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("asientos_contables")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["asientos_contables"] });
      toast({ title: "Asiento eliminado exitosamente" });
    },
    onError: (error: any) => {
      toast({ 
        title: "Error al eliminar asiento", 
        description: error.message,
        variant: "destructive" 
      });
    },
  });

  const resetForm = () => {
    setFormData({
      numero_asiento: "",
      fecha: format(new Date(), "yyyy-MM-dd"),
      tipo: "Diario",
      glosa: "",
      referencia: "",
    });
    setDetalles([{ cuenta_id: "", debe: 0, haber: 0, glosa: "" }]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const totalDebe = detalles.reduce((sum, d) => sum + Number(d.debe), 0);
    const totalHaber = detalles.reduce((sum, d) => sum + Number(d.haber), 0);
    
    if (Math.abs(totalDebe - totalHaber) > 0.01) {
      toast({ 
        title: "Error", 
        description: "El asiento no está balanceado. Debe = Haber",
        variant: "destructive" 
      });
      return;
    }

    // Check for duplicate numero_asiento (exclude current if editing)
    const existingAsiento = asientos.find(a => 
      a.numero_asiento === formData.numero_asiento && 
      (!editingAsiento || a.id !== editingAsiento.id)
    );
    if (existingAsiento) {
      toast({ 
        title: "Error", 
        description: `Ya existe un asiento con el número "${formData.numero_asiento}". Por favor use un número diferente.`,
        variant: "destructive" 
      });
      return;
    }

    if (editingAsiento) {
      updateMutation.mutate({ ...formData, id: editingAsiento.id });
    } else {
      createMutation.mutate(formData);
    }
  };

  const handleEdit = (asiento: any) => {
    setEditingAsiento(asiento);
    setFormData({
      numero_asiento: asiento.numero_asiento,
      fecha: asiento.fecha,
      tipo: asiento.tipo,
      glosa: asiento.glosa,
      referencia: asiento.referencia || "",
    });
    setIsDialogOpen(true);
  };

  const confirmDelete = () => {
    if (asientoToDelete) {
      deleteMutation.mutate(asientoToDelete.id);
      setAsientoToDelete(null);
    }
  };

  const addDetalle = () => {
    setDetalles([...detalles, { cuenta_id: "", debe: 0, haber: 0, glosa: "" }]);
  };

  const removeDetalle = (index: number) => {
    setDetalles(detalles.filter((_, i) => i !== index));
  };

  const updateDetalle = (index: number, field: string, value: any) => {
    const newDetalles = [...detalles];
    newDetalles[index] = { ...newDetalles[index], [field]: value };
    setDetalles(newDetalles);
  };

  const totalDebe = detalles.reduce((sum, d) => sum + Number(d.debe), 0);
  const totalHaber = detalles.reduce((sum, d) => sum + Number(d.haber), 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Asientos Contables</h1>
          <p className="text-muted-foreground">Registro de operaciones contables</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => { setEditingAsiento(null); resetForm(); }}>
              <Plus className="mr-2 h-4 w-4" />
              Nuevo Asiento
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <form onSubmit={handleSubmit}>
              <DialogHeader>
                <DialogTitle>{editingAsiento ? "Editar Asiento Contable" : "Nuevo Asiento Contable"}</DialogTitle>
                <DialogDescription>
                  {editingAsiento ? "Modifique la información del asiento" : "Complete la información del asiento"}
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="numero_asiento">Número</Label>
                    <Input
                      id="numero_asiento"
                      value={formData.numero_asiento}
                      onChange={(e) => setFormData({ ...formData, numero_asiento: e.target.value })}
                      required
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="fecha">Fecha</Label>
                    <Input
                      id="fecha"
                      type="date"
                      value={formData.fecha}
                      onChange={(e) => setFormData({ ...formData, fecha: e.target.value })}
                      required
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="tipo">Tipo</Label>
                    <Select value={formData.tipo} onValueChange={(value: any) => setFormData({ ...formData, tipo: value })}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Apertura">Apertura</SelectItem>
                        <SelectItem value="Diario">Diario</SelectItem>
                        <SelectItem value="Ajuste">Ajuste</SelectItem>
                        <SelectItem value="Cierre">Cierre</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="referencia">Referencia</Label>
                    <Input
                      id="referencia"
                      value={formData.referencia}
                      onChange={(e) => setFormData({ ...formData, referencia: e.target.value })}
                    />
                  </div>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="glosa">Glosa</Label>
                  <Textarea
                    id="glosa"
                    value={formData.glosa}
                    onChange={(e) => setFormData({ ...formData, glosa: e.target.value })}
                    required
                  />
                </div>

                <div className="border-t pt-4">
                  <div className="flex items-center justify-between mb-4">
                    <Label>Detalles del Asiento</Label>
                    <Button type="button" variant="outline" size="sm" onClick={addDetalle}>
                      <Plus className="h-4 w-4 mr-2" />
                      Agregar Línea
                    </Button>
                  </div>
                  
                  {detalles.map((detalle, index) => (
                    <div key={index} className="grid grid-cols-12 gap-2 mb-2 items-end">
                      <div className="col-span-4">
                        <Label className="text-xs">Cuenta</Label>
                        <Select 
                          value={detalle.cuenta_id} 
                          onValueChange={(value) => updateDetalle(index, "cuenta_id", value)}
                        >
                          <SelectTrigger className="h-8">
                            <SelectValue placeholder="Seleccione..." />
                          </SelectTrigger>
                          <SelectContent>
                            {cuentas.map((cuenta) => (
                              <SelectItem key={cuenta.id} value={cuenta.id}>
                                {cuenta.codigo} - {cuenta.nombre}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="col-span-2">
                        <Label className="text-xs">Debe</Label>
                        <Input
                          type="number"
                          step="0.01"
                          value={detalle.debe}
                          onChange={(e) => updateDetalle(index, "debe", e.target.value)}
                          className="h-8"
                        />
                      </div>
                      <div className="col-span-2">
                        <Label className="text-xs">Haber</Label>
                        <Input
                          type="number"
                          step="0.01"
                          value={detalle.haber}
                          onChange={(e) => updateDetalle(index, "haber", e.target.value)}
                          className="h-8"
                        />
                      </div>
                      <div className="col-span-3">
                        <Label className="text-xs">Glosa</Label>
                        <Input
                          value={detalle.glosa}
                          onChange={(e) => updateDetalle(index, "glosa", e.target.value)}
                          className="h-8"
                        />
                      </div>
                      <div className="col-span-1">
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeDetalle(index)}
                          className="h-8"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}

                  <div className="grid grid-cols-12 gap-2 mt-4 font-bold border-t pt-2">
                    <div className="col-span-4 text-right">TOTALES:</div>
                    <div className="col-span-2 text-right">S/. {totalDebe.toFixed(2)}</div>
                    <div className="col-span-2 text-right">S/. {totalHaber.toFixed(2)}</div>
                    <div className="col-span-4 text-right">
                      {Math.abs(totalDebe - totalHaber) < 0.01 ? (
                        <span className="text-green-600">✓ Balanceado</span>
                      ) : (
                        <span className="text-red-600">✗ Desbalanceado</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button type="submit">{editingAsiento ? "Guardar Cambios" : "Crear Asiento"}</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Asientos Contables</CardTitle>
          <CardDescription>Listado de asientos registrados</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">Cargando asientos...</div>
          ) : asientos.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No se encontraron asientos
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Número</TableHead>
                  <TableHead>Fecha</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Glosa</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {asientos.map((asiento) => (
                  <TableRow key={asiento.id}>
                    <TableCell className="font-medium">{asiento.numero_asiento}</TableCell>
                    <TableCell>{format(new Date(asiento.fecha), "dd/MM/yyyy")}</TableCell>
                    <TableCell>{asiento.tipo}</TableCell>
                    <TableCell className="max-w-xs truncate">{asiento.glosa}</TableCell>
                    <TableCell>
                      <span className={`px-2 py-1 rounded text-xs ${
                        asiento.estado === 'Contabilizado' ? 'bg-green-100 text-green-800' :
                        asiento.estado === 'Anulado' ? 'bg-red-100 text-red-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {asiento.estado}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEdit(asiento)}
                        disabled={asiento.estado === 'Contabilizado'}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setAsientoToDelete(asiento)}
                        disabled={asiento.estado === 'Contabilizado'}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <AlertDialog open={!!asientoToDelete} onOpenChange={(open) => !open && setAsientoToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar asiento contable?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. Se eliminará permanentemente el asiento
              <span className="font-semibold"> N° {asientoToDelete?.numero_asiento}</span> con glosa "{asientoToDelete?.glosa}".
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
