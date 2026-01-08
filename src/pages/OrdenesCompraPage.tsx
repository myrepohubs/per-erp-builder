import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Pencil, Trash2, ShoppingCart, X } from "lucide-react";
import { toast } from "sonner";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";

interface OrdenCompra {
  id: string;
  numero_orden: string;
  proveedor_id: string | null;
  fecha_orden: string;
  fecha_entrega_esperada: string | null;
  estado: "Borrador" | "Enviado" | "Aprobado" | "Rechazado" | "Cancelado";
  subtotal: number;
  igv: number;
  total: number;
  notas: string | null;
}

interface ItemOrden {
  id?: string;
  producto_id?: string;
  descripcion: string;
  cantidad: number;
  precio_unitario: number;
  subtotal: number;
}

interface Producto {
  id: string;
  nombre: string;
  precio_compra: number | null;
  precio_venta: number | null;
  stock_actual: number | null;
}

const IGV_RATE = 0.18;

export default function OrdenesCompraPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    numero_orden: "",
    proveedor_id: "",
    fecha_orden: new Date().toISOString().split("T")[0],
    fecha_entrega_esperada: "",
    estado: "Borrador" as OrdenCompra["estado"],
    notas: "",
  });
  const [items, setItems] = useState<ItemOrden[]>([]);
  const [newItem, setNewItem] = useState({
    producto_id: "",
    descripcion: "",
    cantidad: 1,
    precio_unitario: 0,
  });

  const { data: proveedores = [] } = useQuery({
    queryKey: ["proveedores"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("proveedores")
        .select("*")
        .eq("user_id", user?.id || "");
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const { data: productos = [] } = useQuery({
    queryKey: ["productos"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("productos")
        .select("id, nombre, precio_compra, precio_venta, stock_actual")
        .eq("user_id", user?.id || "")
        .eq("activo", true);
      if (error) throw error;
      return data as Producto[];
    },
    enabled: !!user,
  });

  const { data: ordenes = [], isLoading } = useQuery({
    queryKey: ["ordenes_compra"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("ordenes_compra")
        .select("*")
        .eq("user_id", user?.id || "")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as OrdenCompra[];
    },
    enabled: !!user,
  });

  const calculateTotals = (itemsList: ItemOrden[]) => {
    const subtotal = itemsList.reduce((sum, item) => sum + item.subtotal, 0);
    const igv = subtotal * IGV_RATE;
    const total = subtotal + igv;
    return { subtotal, igv, total };
  };

  const handleProductSelect = (productoId: string) => {
    const producto = productos.find((p) => p.id === productoId);
    if (producto) {
      setNewItem({
        producto_id: productoId,
        descripcion: producto.nombre,
        cantidad: 1,
        precio_unitario: producto.precio_compra || 0,
      });
    }
  };

  const addItem = () => {
    if (!newItem.descripcion) {
      toast.error("Selecciona un producto");
      return;
    }
    const subtotal = newItem.cantidad * newItem.precio_unitario;
    setItems([...items, { ...newItem, subtotal }]);
    setNewItem({ producto_id: "", descripcion: "", cantidad: 1, precio_unitario: 0 });
  };

  const removeItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const handleItemChange = (index: number, field: keyof ItemOrden, value: any) => {
    const updatedItems = [...items];
    updatedItems[index] = { ...updatedItems[index], [field]: value };
    if (field === "cantidad" || field === "precio_unitario") {
      const cantidad = field === "cantidad" ? Number(value) : updatedItems[index].cantidad;
      const precio = field === "precio_unitario" ? Number(value) : updatedItems[index].precio_unitario;
      updatedItems[index].subtotal = cantidad * precio;
    }
    setItems(updatedItems);
  };

  const createMutation = useMutation({
    mutationFn: async (newOrden: typeof formData) => {
      const totals = calculateTotals(items);
      const { data: orden, error: ordenError } = await supabase
        .from("ordenes_compra")
        .insert({
          ...newOrden,
          ...totals,
          user_id: user?.id,
        })
        .select()
        .single();

      if (ordenError) throw ordenError;

      if (items.length > 0) {
        const { error: itemsError } = await supabase
          .from("items_orden_compra")
          .insert(items.map((item) => ({
            orden_compra_id: orden.id,
            descripcion: item.descripcion,
            cantidad: item.cantidad,
            precio_unitario: item.precio_unitario,
            subtotal: item.subtotal,
          })));
        if (itemsError) throw itemsError;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ordenes_compra"] });
      toast.success("Orden de compra creada exitosamente");
      resetForm();
    },
    onError: (error: any) => {
      toast.error(error.message || "Error al crear orden de compra");
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: typeof formData }) => {
      const totals = calculateTotals(items);
      const { error: ordenError } = await supabase
        .from("ordenes_compra")
        .update({ ...data, ...totals })
        .eq("id", id)
        .eq("user_id", user?.id || "");

      if (ordenError) throw ordenError;

      await supabase.from("items_orden_compra").delete().eq("orden_compra_id", id);

      if (items.length > 0) {
        const { error: itemsError } = await supabase
          .from("items_orden_compra")
          .insert(items.map((item) => ({
            orden_compra_id: id,
            descripcion: item.descripcion,
            cantidad: item.cantidad,
            precio_unitario: item.precio_unitario,
            subtotal: item.subtotal,
          })));
        if (itemsError) throw itemsError;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ordenes_compra"] });
      toast.success("Orden de compra actualizada exitosamente");
      resetForm();
    },
    onError: (error: any) => {
      toast.error(error.message || "Error al actualizar orden de compra");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("ordenes_compra")
        .delete()
        .eq("id", id)
        .eq("user_id", user?.id || "");
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ordenes_compra"] });
      toast.success("Orden de compra eliminada exitosamente");
    },
    onError: (error: any) => {
      toast.error(error.message || "Error al eliminar orden de compra");
    },
  });

  const resetForm = () => {
    setFormData({
      numero_orden: "",
      proveedor_id: "",
      fecha_orden: new Date().toISOString().split("T")[0],
      fecha_entrega_esperada: "",
      estado: "Borrador",
      notas: "",
    });
    setItems([]);
    setEditingId(null);
    setOpen(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (items.length === 0) {
      toast.error("Debes agregar al menos un item");
      return;
    }
    if (editingId) {
      updateMutation.mutate({ id: editingId, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const handleEdit = async (orden: OrdenCompra) => {
    setFormData({
      numero_orden: orden.numero_orden,
      proveedor_id: orden.proveedor_id || "",
      fecha_orden: orden.fecha_orden,
      fecha_entrega_esperada: orden.fecha_entrega_esperada || "",
      estado: orden.estado as "Borrador" | "Enviado" | "Aprobado" | "Rechazado" | "Cancelado",
      notas: orden.notas || "",
    });

    const { data: itemsData } = await supabase
      .from("items_orden_compra")
      .select("*")
      .eq("orden_compra_id", orden.id);
    
    setItems(itemsData?.map((item) => ({
      id: item.id,
      descripcion: item.descripcion,
      cantidad: Number(item.cantidad),
      precio_unitario: Number(item.precio_unitario),
      subtotal: Number(item.subtotal),
    })) || []);

    setEditingId(orden.id);
    setOpen(true);
  };

  const handleDelete = (id: string) => {
    if (confirm("¿Estás seguro de eliminar esta orden de compra?")) {
      deleteMutation.mutate(id);
    }
  };

  const getEstadoBadge = (estado: OrdenCompra["estado"]) => {
    const variants: Record<OrdenCompra["estado"], "default" | "secondary" | "outline" | "destructive"> = {
      Borrador: "secondary",
      Enviado: "default",
      Aprobado: "default",
      Rechazado: "destructive",
      Cancelado: "outline",
    };
    return <Badge variant={variants[estado]}>{estado}</Badge>;
  };

  const totals = calculateTotals(items);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Órdenes de Compra</h1>
          <p className="text-muted-foreground">Gestiona tus órdenes de compra</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => { resetForm(); setOpen(true); }}>
              <Plus className="mr-2 h-4 w-4" />
              Nueva Orden
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingId ? "Editar Orden de Compra" : "Nueva Orden de Compra"}
              </DialogTitle>
              <DialogDescription>
                Completa la información de la orden
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit}>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="numero_orden">Número de Orden *</Label>
                    <Input
                      id="numero_orden"
                      value={formData.numero_orden}
                      onChange={(e) => setFormData({ ...formData, numero_orden: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="proveedor_id">Proveedor</Label>
                    <Select value={formData.proveedor_id} onValueChange={(value) => setFormData({ ...formData, proveedor_id: value })}>
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar proveedor" />
                      </SelectTrigger>
                      <SelectContent>
                        {proveedores.map((proveedor) => (
                          <SelectItem key={proveedor.id} value={proveedor.id}>
                            {proveedor.razon_social}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="estado">Estado</Label>
                    <Select value={formData.estado} onValueChange={(value) => setFormData({ ...formData, estado: value as OrdenCompra["estado"] })}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Borrador">Borrador</SelectItem>
                        <SelectItem value="Enviado">Enviado</SelectItem>
                        <SelectItem value="Aprobado">Aprobado</SelectItem>
                        <SelectItem value="Rechazado">Rechazado</SelectItem>
                        <SelectItem value="Cancelado">Cancelado</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="fecha_orden">Fecha de Orden *</Label>
                    <Input
                      id="fecha_orden"
                      type="date"
                      value={formData.fecha_orden}
                      onChange={(e) => setFormData({ ...formData, fecha_orden: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="fecha_entrega_esperada">Fecha de Entrega Esperada</Label>
                    <Input
                      id="fecha_entrega_esperada"
                      type="date"
                      value={formData.fecha_entrega_esperada}
                      onChange={(e) => setFormData({ ...formData, fecha_entrega_esperada: e.target.value })}
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <Label>Items de la Orden</Label>
                  <div className="border rounded-lg p-4 space-y-3">
                    <div className="grid grid-cols-12 gap-2">
                      <Select value={newItem.producto_id} onValueChange={handleProductSelect}>
                        <SelectTrigger className="col-span-5">
                          <SelectValue placeholder="Seleccionar producto" />
                        </SelectTrigger>
                        <SelectContent>
                          {productos.map((producto) => (
                            <SelectItem key={producto.id} value={producto.id}>
                              {producto.nombre}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Input
                        type="number"
                        placeholder="Cant."
                        className="col-span-2"
                        value={newItem.cantidad}
                        onChange={(e) => setNewItem({ ...newItem, cantidad: Number(e.target.value) })}
                      />
                      <Input
                        type="number"
                        placeholder="Precio Unit."
                        className="col-span-3"
                        step="0.01"
                        value={newItem.precio_unitario}
                        onChange={(e) => setNewItem({ ...newItem, precio_unitario: Number(e.target.value) })}
                      />
                      <Button type="button" onClick={addItem} className="col-span-2">
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>

                    {items.length > 0 && (
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Descripción</TableHead>
                            <TableHead className="w-24">Cantidad</TableHead>
                            <TableHead className="w-32">Precio Unit.</TableHead>
                            <TableHead className="w-32">Subtotal</TableHead>
                            <TableHead className="w-16"></TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {items.map((item, index) => (
                            <TableRow key={index}>
                              <TableCell>
                                <Input
                                  value={item.descripcion}
                                  onChange={(e) => handleItemChange(index, "descripcion", e.target.value)}
                                />
                              </TableCell>
                              <TableCell>
                                <Input
                                  type="number"
                                  value={item.cantidad}
                                  onChange={(e) => handleItemChange(index, "cantidad", e.target.value)}
                                />
                              </TableCell>
                              <TableCell>
                                <Input
                                  type="number"
                                  step="0.01"
                                  value={item.precio_unitario}
                                  onChange={(e) => handleItemChange(index, "precio_unitario", e.target.value)}
                                />
                              </TableCell>
                              <TableCell>S/ {item.subtotal.toFixed(2)}</TableCell>
                              <TableCell>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => removeItem(index)}
                                >
                                  <X className="h-4 w-4" />
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    )}

                    <div className="flex justify-end space-y-1 border-t pt-3">
                      <div className="text-sm space-y-1 min-w-[200px]">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Subtotal:</span>
                          <span className="font-medium">S/ {totals.subtotal.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">IGV (18%):</span>
                          <span className="font-medium">S/ {totals.igv.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between text-base font-bold border-t pt-1">
                          <span>Total:</span>
                          <span>S/ {totals.total.toFixed(2)}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="notas">Notas</Label>
                  <Textarea
                    id="notas"
                    value={formData.notas}
                    onChange={(e) => setFormData({ ...formData, notas: e.target.value })}
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
            <ShoppingCart className="h-5 w-5 text-primary" />
            Órdenes de Compra
          </CardTitle>
          <CardDescription>
            {ordenes.length} orden(es) registrada(s)
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">Cargando...</div>
          ) : ordenes.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No hay órdenes de compra. Crea tu primera orden.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Número</TableHead>
                  <TableHead>Fecha</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Entrega Esperada</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {ordenes.map((orden) => (
                  <TableRow key={orden.id}>
                    <TableCell className="font-medium">{orden.numero_orden}</TableCell>
                    <TableCell>{new Date(orden.fecha_orden).toLocaleDateString("es-PE")}</TableCell>
                    <TableCell>{getEstadoBadge(orden.estado)}</TableCell>
                    <TableCell>
                      {orden.fecha_entrega_esperada
                        ? new Date(orden.fecha_entrega_esperada).toLocaleDateString("es-PE")
                        : "-"}
                    </TableCell>
                    <TableCell className="text-right font-semibold">
                      S/ {Number(orden.total).toFixed(2)}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleEdit(orden)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(orden.id)}
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
    </div>
  );
}
