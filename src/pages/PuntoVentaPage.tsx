import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search, Plus, Minus, Trash2, ShoppingCart, CreditCard, Receipt, Package } from "lucide-react";

interface Producto {
  id: string;
  nombre: string;
  sku: string;
  precio_venta: number;
  stock_actual: number;
  categoria_id: string | null;
}

interface Categoria {
  id: string;
  nombre: string;
}

interface ItemCarrito {
  producto: Producto;
  cantidad: number;
  subtotal: number;
}

interface Cliente {
  id: string;
  razon_social: string;
  ruc: string;
}

const PuntoVentaPage = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [productos, setProductos] = useState<Producto[]>([]);
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [carrito, setCarrito] = useState<ItemCarrito[]>([]);
  const [busqueda, setBusqueda] = useState("");
  const [categoriaFiltro, setCategoriaFiltro] = useState<string>("todas");
  const [loading, setLoading] = useState(true);
  const [procesando, setProcesando] = useState(false);
  const [modalPago, setModalPago] = useState(false);
  const [clienteSeleccionado, setClienteSeleccionado] = useState<string>("");
  const [metodoPago, setMetodoPago] = useState<string>("efectivo");

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [productosRes, categoriasRes, clientesRes] = await Promise.all([
        supabase
          .from("productos")
          .select("id, nombre, sku, precio_venta, stock_actual, categoria_id")
          .eq("activo", true)
          .gt("stock_actual", 0)
          .order("nombre"),
        supabase.from("categorias").select("id, nombre").order("nombre"),
        supabase.from("clientes").select("id, razon_social, ruc").order("razon_social"),
      ]);

      if (productosRes.data) setProductos(productosRes.data);
      if (categoriasRes.data) setCategorias(categoriasRes.data);
      if (clientesRes.data) setClientes(clientesRes.data);
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  const productosFiltrados = productos.filter((p) => {
    const matchBusqueda =
      p.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
      p.sku.toLowerCase().includes(busqueda.toLowerCase());
    const matchCategoria =
      categoriaFiltro === "todas" || p.categoria_id === categoriaFiltro;
    return matchBusqueda && matchCategoria;
  });

  const agregarAlCarrito = (producto: Producto) => {
    const itemExistente = carrito.find((item) => item.producto.id === producto.id);
    
    if (itemExistente) {
      if (itemExistente.cantidad >= producto.stock_actual) {
        toast({
          title: "Stock insuficiente",
          description: `Solo hay ${producto.stock_actual} unidades disponibles`,
          variant: "destructive",
        });
        return;
      }
      setCarrito(
        carrito.map((item) =>
          item.producto.id === producto.id
            ? {
                ...item,
                cantidad: item.cantidad + 1,
                subtotal: (item.cantidad + 1) * item.producto.precio_venta,
              }
            : item
        )
      );
    } else {
      setCarrito([
        ...carrito,
        {
          producto,
          cantidad: 1,
          subtotal: producto.precio_venta,
        },
      ]);
    }
  };

  const actualizarCantidad = (productoId: string, nuevaCantidad: number) => {
    if (nuevaCantidad <= 0) {
      eliminarDelCarrito(productoId);
      return;
    }

    const item = carrito.find((i) => i.producto.id === productoId);
    if (item && nuevaCantidad > item.producto.stock_actual) {
      toast({
        title: "Stock insuficiente",
        description: `Solo hay ${item.producto.stock_actual} unidades disponibles`,
        variant: "destructive",
      });
      return;
    }

    setCarrito(
      carrito.map((item) =>
        item.producto.id === productoId
          ? {
              ...item,
              cantidad: nuevaCantidad,
              subtotal: nuevaCantidad * item.producto.precio_venta,
            }
          : item
      )
    );
  };

  const eliminarDelCarrito = (productoId: string) => {
    setCarrito(carrito.filter((item) => item.producto.id !== productoId));
  };

  const limpiarCarrito = () => {
    setCarrito([]);
  };

  const subtotal = carrito.reduce((sum, item) => sum + item.subtotal, 0);
  const igv = subtotal * 0.18;
  const total = subtotal + igv;

  const procesarVenta = async () => {
    if (carrito.length === 0) {
      toast({
        title: "Carrito vacío",
        description: "Agrega productos al carrito para continuar",
        variant: "destructive",
      });
      return;
    }

    setProcesando(true);
    try {
      // Generate invoice number
      const { data: lastFactura } = await supabase
        .from("facturas")
        .select("numero_factura")
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      const nextNumber = lastFactura
        ? String(parseInt(lastFactura.numero_factura) + 1).padStart(8, "0")
        : "00000001";

      // Create invoice
      const { data: factura, error: facturaError } = await supabase
        .from("facturas")
        .insert({
          user_id: user!.id,
          cliente_id: clienteSeleccionado || null,
          numero_factura: nextNumber,
          serie: "F001",
          fecha_emision: new Date().toISOString().split("T")[0],
          estado: "Pagada",
          subtotal: subtotal,
          igv: igv,
          total: total,
          monto_pagado: total,
          notas: `Venta POS - Método: ${metodoPago}`,
        })
        .select()
        .single();

      if (facturaError) throw facturaError;

      // Create invoice items
      const itemsFactura = carrito.map((item) => ({
        factura_id: factura.id,
        descripcion: item.producto.nombre,
        cantidad: item.cantidad,
        precio_unitario: item.producto.precio_venta,
        subtotal: item.subtotal,
      }));

      const { error: itemsError } = await supabase
        .from("items_factura")
        .insert(itemsFactura);

      if (itemsError) throw itemsError;

      // Update inventory
      for (const item of carrito) {
        const nuevoStock = item.producto.stock_actual - item.cantidad;
        
        await supabase
          .from("productos")
          .update({ stock_actual: nuevoStock })
          .eq("id", item.producto.id);

        await supabase.from("movimientos_inventario").insert({
          user_id: user!.id,
          producto_id: item.producto.id,
          tipo: "Salida",
          cantidad: item.cantidad,
          stock_anterior: item.producto.stock_actual,
          stock_nuevo: nuevoStock,
          referencia: `Venta POS - Factura ${factura.serie}-${factura.numero_factura}`,
          notas: `Venta realizada desde POS`,
        });
      }

      toast({
        title: "Venta procesada",
        description: `Factura ${factura.serie}-${factura.numero_factura} creada exitosamente`,
      });

      setCarrito([]);
      setModalPago(false);
      setClienteSeleccionado("");
      setMetodoPago("efectivo");
      fetchData(); // Refresh products to update stock
    } catch (error: any) {
      console.error("Error processing sale:", error);
      toast({
        title: "Error al procesar venta",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setProcesando(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[80vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-4rem)] flex gap-4 p-4">
      {/* Products Section */}
      <div className="flex-1 flex flex-col gap-4">
        <Card className="flex-none">
          <CardContent className="p-4">
            <div className="flex gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por nombre o SKU..."
                  value={busqueda}
                  onChange={(e) => setBusqueda(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={categoriaFiltro} onValueChange={setCategoriaFiltro}>
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="Categoría" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todas">Todas las categorías</SelectItem>
                  {categorias.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id}>
                      {cat.nombre}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        <ScrollArea className="flex-1">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 pr-4">
            {productosFiltrados.map((producto) => (
              <Card
                key={producto.id}
                className="cursor-pointer hover:border-primary transition-colors"
                onClick={() => agregarAlCarrito(producto)}
              >
                <CardContent className="p-4">
                  <div className="flex flex-col gap-2">
                    <div className="h-12 flex items-center justify-center bg-muted rounded-md">
                      <Package className="h-6 w-6 text-muted-foreground" />
                    </div>
                    <div>
                      <h3 className="font-medium text-sm line-clamp-2">{producto.nombre}</h3>
                      <p className="text-xs text-muted-foreground">{producto.sku}</p>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-primary">
                        S/ {producto.precio_venta.toFixed(2)}
                      </span>
                      <Badge variant={producto.stock_actual <= 5 ? "destructive" : "secondary"}>
                        {producto.stock_actual} uds
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
            {productosFiltrados.length === 0 && (
              <div className="col-span-full text-center py-12 text-muted-foreground">
                No se encontraron productos
              </div>
            )}
          </div>
        </ScrollArea>
      </div>

      {/* Cart Section */}
      <Card className="w-[400px] flex flex-col">
        <CardHeader className="flex-none pb-2">
          <CardTitle className="flex items-center gap-2">
            <ShoppingCart className="h-5 w-5" />
            Carrito de Venta
          </CardTitle>
        </CardHeader>
        <CardContent className="flex-1 flex flex-col p-4 pt-0">
          <ScrollArea className="flex-1 -mx-4 px-4">
            {carrito.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-40 text-muted-foreground">
                <ShoppingCart className="h-12 w-12 mb-2 opacity-50" />
                <p>Carrito vacío</p>
                <p className="text-xs">Haz clic en un producto para agregarlo</p>
              </div>
            ) : (
              <div className="space-y-3">
                {carrito.map((item) => (
                  <div
                    key={item.producto.id}
                    className="flex items-center gap-3 p-2 bg-muted/50 rounded-lg"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">{item.producto.nombre}</p>
                      <p className="text-xs text-muted-foreground">
                        S/ {item.producto.precio_venta.toFixed(2)} c/u
                      </p>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-7 w-7"
                        onClick={() => actualizarCantidad(item.producto.id, item.cantidad - 1)}
                      >
                        <Minus className="h-3 w-3" />
                      </Button>
                      <span className="w-8 text-center text-sm font-medium">{item.cantidad}</span>
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-7 w-7"
                        onClick={() => actualizarCantidad(item.producto.id, item.cantidad + 1)}
                      >
                        <Plus className="h-3 w-3" />
                      </Button>
                    </div>
                    <div className="w-20 text-right">
                      <p className="font-medium text-sm">S/ {item.subtotal.toFixed(2)}</p>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-destructive hover:text-destructive"
                      onClick={() => eliminarDelCarrito(item.producto.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>

          <div className="flex-none pt-4 space-y-3">
            <Separator />
            <div className="space-y-1 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Subtotal</span>
                <span>S/ {subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">IGV (18%)</span>
                <span>S/ {igv.toFixed(2)}</span>
              </div>
              <Separator className="my-2" />
              <div className="flex justify-between text-lg font-bold">
                <span>Total</span>
                <span className="text-primary">S/ {total.toFixed(2)}</span>
              </div>
            </div>

            <div className="flex gap-2">
              <Button
                variant="outline"
                className="flex-1"
                onClick={limpiarCarrito}
                disabled={carrito.length === 0}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Limpiar
              </Button>
              <Button
                className="flex-1"
                onClick={() => setModalPago(true)}
                disabled={carrito.length === 0}
              >
                <CreditCard className="h-4 w-4 mr-2" />
                Pagar
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Payment Modal */}
      <Dialog open={modalPago} onOpenChange={setModalPago}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Receipt className="h-5 w-5" />
              Procesar Pago
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Cliente (opcional)</label>
              <Select value={clienteSeleccionado || "none"} onValueChange={(value) => setClienteSeleccionado(value === "none" ? "" : value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar cliente" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Sin cliente</SelectItem>
                  {clientes.map((cliente) => (
                    <SelectItem key={cliente.id} value={cliente.id}>
                      {cliente.razon_social} - {cliente.ruc}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Método de Pago</label>
              <Select value={metodoPago} onValueChange={setMetodoPago}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="efectivo">Efectivo</SelectItem>
                  <SelectItem value="tarjeta">Tarjeta</SelectItem>
                  <SelectItem value="transferencia">Transferencia</SelectItem>
                  <SelectItem value="yape">Yape/Plin</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Separator />

            <div className="bg-muted p-4 rounded-lg space-y-2">
              <div className="flex justify-between text-sm">
                <span>Productos ({carrito.length})</span>
                <span>S/ {subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>IGV (18%)</span>
                <span>S/ {igv.toFixed(2)}</span>
              </div>
              <Separator />
              <div className="flex justify-between font-bold text-lg">
                <span>Total a Pagar</span>
                <span className="text-primary">S/ {total.toFixed(2)}</span>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setModalPago(false)}>
              Cancelar
            </Button>
            <Button onClick={procesarVenta} disabled={procesando}>
              {procesando ? "Procesando..." : "Confirmar Venta"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PuntoVentaPage;
