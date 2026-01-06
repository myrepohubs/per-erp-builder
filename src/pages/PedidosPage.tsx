import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";
import { Plus, ShoppingCart, Trash2, Edit } from "lucide-react";
import { format } from "date-fns";

interface Cliente {
  id: string;
  razon_social: string;
  ruc: string;
}

interface Producto {
  id: string;
  nombre: string;
  sku: string;
  precio_venta: number | null;
}

interface ItemPedido {
  id?: string;
  producto_id?: string;
  descripcion: string;
  cantidad: number;
  precio_unitario: number;
  subtotal: number;
}

interface Pedido {
  id: string;
  numero_pedido: string;
  cliente_id: string | null;
  fecha_pedido: string;
  fecha_entrega_estimada: string | null;
  estado: string;
  subtotal: number;
  igv: number;
  total: number;
  notas: string | null;
  clientes?: Cliente;
}

export default function PedidosPage() {
  const { user } = useAuth();
  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [productos, setProductos] = useState<Producto[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [items, setItems] = useState<ItemPedido[]>([{ descripcion: "", cantidad: 1, precio_unitario: 0, subtotal: 0 }]);
  const [pedidoToDelete, setPedidoToDelete] = useState<Pedido | null>(null);
  
  const [formData, setFormData] = useState({
    numero_pedido: "",
    cliente_id: "",
    fecha_pedido: format(new Date(), "yyyy-MM-dd"),
    fecha_entrega_estimada: "",
    estado: "Borrador",
    notas: "",
  });

  useEffect(() => {
    if (user) {
      fetchPedidos();
      fetchClientes();
      fetchProductos();
    }
  }, [user]);

  const fetchPedidos = async () => {
    const { data, error } = await supabase
      .from("pedidos")
      .select("*, clientes(id, razon_social, ruc)")
      .order("created_at", { ascending: false });

    if (error) {
      toast.error("Error al cargar pedidos");
      return;
    }

    setPedidos(data || []);
  };

  const fetchClientes = async () => {
    const { data, error } = await supabase
      .from("clientes")
      .select("id, razon_social, ruc")
      .order("razon_social");

    if (error) {
      toast.error("Error al cargar clientes");
      return;
    }

    setClientes(data || []);
  };

  const fetchProductos = async () => {
    const { data, error } = await supabase
      .from("productos")
      .select("id, nombre, sku, precio_venta")
      .eq("activo", true)
      .order("nombre");

    if (error) {
      toast.error("Error al cargar productos");
      return;
    }

    setProductos(data || []);
  };

  const handleProductSelect = (index: number, productoId: string) => {
    const producto = productos.find(p => p.id === productoId);
    if (producto) {
      const newItems = [...items];
      newItems[index] = {
        ...newItems[index],
        producto_id: producto.id,
        descripcion: `${producto.nombre} - ${producto.sku}`,
        precio_unitario: producto.precio_venta || 0,
        subtotal: newItems[index].cantidad * (producto.precio_venta || 0),
      };
      setItems(newItems);
    }
  };

  const calculateTotals = (currentItems: ItemPedido[]) => {
    const subtotal = currentItems.reduce((sum, item) => sum + item.subtotal, 0);
    const igv = subtotal * 0.18;
    const total = subtotal + igv;
    return { subtotal, igv, total };
  };

  const handleItemChange = (index: number, field: keyof ItemPedido, value: string | number) => {
    const newItems = [...items];
    
    if (field === "cantidad" || field === "precio_unitario") {
      const numValue = typeof value === "string" ? parseFloat(value) || 0 : value;
      newItems[index] = { ...newItems[index], [field]: numValue };
      newItems[index].subtotal = newItems[index].cantidad * newItems[index].precio_unitario;
    } else {
      newItems[index] = { ...newItems[index], [field]: value };
    }
    
    setItems(newItems);
  };

  const addItem = () => {
    setItems([...items, { producto_id: "", descripcion: "", cantidad: 1, precio_unitario: 0, subtotal: 0 }]);
  };

  const removeItem = (index: number) => {
    if (items.length > 1) {
      setItems(items.filter((_, i) => i !== index));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.numero_pedido || !formData.cliente_id) {
      toast.error("Por favor complete todos los campos requeridos");
      return;
    }

    if (items.some(item => !item.descripcion || item.cantidad <= 0 || item.precio_unitario <= 0)) {
      toast.error("Por favor complete todos los ítems correctamente");
      return;
    }

    const { subtotal, igv, total } = calculateTotals(items);

    try {
      if (editingId) {
        const { error: pedError } = await supabase
          .from("pedidos")
          .update({
            ...formData,
            estado: formData.estado as "Borrador" | "Enviado" | "Aprobado" | "Rechazado" | "Cancelado",
            subtotal,
            igv,
            total,
          })
          .eq("id", editingId);

        if (pedError) throw pedError;

        await supabase.from("items_pedido").delete().eq("pedido_id", editingId);

        const { error: itemsError } = await supabase.from("items_pedido").insert(
          items.map(item => ({
            pedido_id: editingId,
            descripcion: item.descripcion,
            cantidad: item.cantidad,
            precio_unitario: item.precio_unitario,
            subtotal: item.subtotal,
          }))
        );

        if (itemsError) throw itemsError;

        toast.success("Pedido actualizado exitosamente");
      } else {
        const { data: pedData, error: pedError } = await supabase
          .from("pedidos")
          .insert([{
            user_id: user?.id!,
            numero_pedido: formData.numero_pedido,
            cliente_id: formData.cliente_id,
            fecha_pedido: formData.fecha_pedido,
            fecha_entrega_estimada: formData.fecha_entrega_estimada || null,
            estado: formData.estado as "Borrador" | "Enviado" | "Aprobado" | "Rechazado" | "Cancelado",
            notas: formData.notas || null,
            subtotal,
            igv,
            total,
          }])
          .select()
          .single();

        if (pedError) throw pedError;

        const { error: itemsError } = await supabase.from("items_pedido").insert(
          items.map(item => ({
            pedido_id: pedData.id,
            descripcion: item.descripcion,
            cantidad: item.cantidad,
            precio_unitario: item.precio_unitario,
            subtotal: item.subtotal,
          }))
        );

        if (itemsError) throw itemsError;

        toast.success("Pedido creado exitosamente");
      }

      fetchPedidos();
      resetForm();
      setIsOpen(false);
    } catch (error: any) {
      toast.error(error.message || "Error al guardar el pedido");
    }
  };

  const handleDelete = async () => {
    if (!pedidoToDelete) return;

    const { error } = await supabase.from("pedidos").delete().eq("id", pedidoToDelete.id);

    if (error) {
      toast.error("Error al eliminar el pedido");
      setPedidoToDelete(null);
      return;
    }

    toast.success("Pedido eliminado exitosamente");
    setPedidoToDelete(null);
    fetchPedidos();
  };

  const resetForm = () => {
    setFormData({
      numero_pedido: "",
      cliente_id: "",
      fecha_pedido: format(new Date(), "yyyy-MM-dd"),
      fecha_entrega_estimada: "",
      estado: "Borrador",
      notas: "",
    });
    setItems([{ producto_id: "", descripcion: "", cantidad: 1, precio_unitario: 0, subtotal: 0 }]);
    setEditingId(null);
  };

  const handleEdit = async (pedido: Pedido) => {
    setEditingId(pedido.id);
    setFormData({
      numero_pedido: pedido.numero_pedido,
      cliente_id: pedido.cliente_id || "",
      fecha_pedido: pedido.fecha_pedido,
      fecha_entrega_estimada: pedido.fecha_entrega_estimada || "",
      estado: pedido.estado,
      notas: pedido.notas || "",
    });

    const { data: itemsData } = await supabase
      .from("items_pedido")
      .select("*")
      .eq("pedido_id", pedido.id);

    if (itemsData && itemsData.length > 0) {
      setItems(itemsData.map(item => ({
        id: item.id,
        descripcion: item.descripcion,
        cantidad: typeof item.cantidad === 'string' ? parseFloat(item.cantidad) : item.cantidad,
        precio_unitario: typeof item.precio_unitario === 'string' ? parseFloat(item.precio_unitario) : item.precio_unitario,
        subtotal: typeof item.subtotal === 'string' ? parseFloat(item.subtotal) : item.subtotal,
      })));
    }

    setIsOpen(true);
  };

  const getEstadoBadgeColor = (estado: string) => {
    const colors: Record<string, string> = {
      Borrador: "bg-muted text-muted-foreground",
      Enviado: "bg-primary/20 text-primary",
      Aprobado: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
      Rechazado: "bg-destructive/20 text-destructive",
      Cancelado: "bg-secondary text-secondary-foreground",
    };
    return colors[estado] || "bg-muted text-muted-foreground";
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-foreground">Pedidos</h1>
        <Dialog open={isOpen} onOpenChange={(open) => { setIsOpen(open); if (!open) resetForm(); }}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Nuevo Pedido
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingId ? "Editar" : "Nuevo"} Pedido</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="numero_pedido">Número de Pedido *</Label>
                  <Input
                    id="numero_pedido"
                    value={formData.numero_pedido}
                    onChange={(e) => setFormData({ ...formData, numero_pedido: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="cliente_id">Cliente *</Label>
                  <Select value={formData.cliente_id} onValueChange={(value) => setFormData({ ...formData, cliente_id: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccione un cliente" />
                    </SelectTrigger>
                    <SelectContent>
                      {clientes.map((cliente) => (
                        <SelectItem key={cliente.id} value={cliente.id}>
                          {cliente.razon_social} - {cliente.ruc}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="fecha_pedido">Fecha de Pedido *</Label>
                  <Input
                    id="fecha_pedido"
                    type="date"
                    value={formData.fecha_pedido}
                    onChange={(e) => setFormData({ ...formData, fecha_pedido: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="fecha_entrega_estimada">Fecha de Entrega Estimada</Label>
                  <Input
                    id="fecha_entrega_estimada"
                    type="date"
                    value={formData.fecha_entrega_estimada}
                    onChange={(e) => setFormData({ ...formData, fecha_entrega_estimada: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="estado">Estado</Label>
                  <Select value={formData.estado} onValueChange={(value) => setFormData({ ...formData, estado: value })}>
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

              <div>
                <div className="flex justify-between items-center mb-2">
                  <Label>Ítems del Pedido</Label>
                  <Button type="button" variant="outline" size="sm" onClick={addItem}>
                    <Plus className="h-4 w-4 mr-2" />
                    Agregar Ítem
                  </Button>
                </div>
                <div className="space-y-2">
                  {items.map((item, index) => (
                    <div key={index} className="grid grid-cols-12 gap-2 items-start">
                      <div className="col-span-5">
                        <Select
                          value={item.producto_id || ""}
                          onValueChange={(value) => handleProductSelect(index, value)}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Seleccione un producto" />
                          </SelectTrigger>
                          <SelectContent>
                            {productos.map((producto) => (
                              <SelectItem key={producto.id} value={producto.id}>
                                {producto.nombre} - {producto.sku}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="col-span-2">
                        <Input
                          type="number"
                          placeholder="Cantidad"
                          value={item.cantidad.toString()}
                          onChange={(e) => handleItemChange(index, "cantidad", e.target.value)}
                        />
                      </div>
                      <div className="col-span-2">
                        <Input
                          type="number"
                          step="0.01"
                          placeholder="Precio"
                          value={item.precio_unitario.toString()}
                          onChange={(e) => handleItemChange(index, "precio_unitario", e.target.value)}
                        />
                      </div>
                      <div className="col-span-2">
                        <Input
                          type="number"
                          step="0.01"
                          placeholder="Subtotal"
                          value={item.subtotal.toFixed(2)}
                          readOnly
                        />
                      </div>
                      <div className="col-span-1">
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeItem(index)}
                          disabled={items.length === 1}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-muted p-4 rounded-lg space-y-2">
                <div className="flex justify-between">
                  <span>Subtotal:</span>
                  <span>S/ {calculateTotals(items).subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>IGV (18%):</span>
                  <span>S/ {calculateTotals(items).igv.toFixed(2)}</span>
                </div>
                <div className="flex justify-between font-bold text-lg">
                  <span>Total:</span>
                  <span>S/ {calculateTotals(items).total.toFixed(2)}</span>
                </div>
              </div>

              <div>
                <Label htmlFor="notas">Notas</Label>
                <Textarea
                  id="notas"
                  value={formData.notas}
                  onChange={(e) => setFormData({ ...formData, notas: e.target.value })}
                  rows={3}
                />
              </div>

              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => { setIsOpen(false); resetForm(); }}>
                  Cancelar
                </Button>
                <Button type="submit">
                  {editingId ? "Actualizar" : "Crear"} Pedido
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Lista de Pedidos</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Número</TableHead>
                <TableHead>Cliente</TableHead>
                <TableHead>Fecha Pedido</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead className="text-right">Total</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pedidos.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground">
                    No hay pedidos registrados
                  </TableCell>
                </TableRow>
              ) : (
                pedidos.map((pedido) => (
                  <TableRow key={pedido.id}>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        <ShoppingCart className="h-4 w-4 text-muted-foreground" />
                        {pedido.numero_pedido}
                      </div>
                    </TableCell>
                    <TableCell>{pedido.clientes?.razon_social || "N/A"}</TableCell>
                    <TableCell>{format(new Date(pedido.fecha_pedido), "dd/MM/yyyy")}</TableCell>
                    <TableCell>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getEstadoBadgeColor(pedido.estado)}`}>
                        {pedido.estado}
                      </span>
                    </TableCell>
                    <TableCell className="text-right font-medium">S/ {pedido.total.toFixed(2)}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button variant="ghost" size="sm" onClick={() => handleEdit(pedido)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => setPedidoToDelete(pedido)}>
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Diálogo de confirmación para eliminar */}
      <AlertDialog open={!!pedidoToDelete} onOpenChange={(open) => !open && setPedidoToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar pedido?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. Se eliminará permanentemente el pedido 
              <span className="font-semibold"> {pedidoToDelete?.numero_pedido}</span>.
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