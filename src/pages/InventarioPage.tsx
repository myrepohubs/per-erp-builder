import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Package, AlertTriangle, TrendingUp, TrendingDown, Edit, Trash2, Tag } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";

interface Categoria {
  id: string;
  nombre: string;
  descripcion: string | null;
}

interface Producto {
  id: string;
  sku: string;
  codigo_barras: string | null;
  nombre: string;
  descripcion: string | null;
  unidad_medida: string;
  precio_compra: number;
  precio_venta: number;
  stock_actual: number;
  stock_minimo: number;
  stock_maximo: number;
  activo: boolean;
  categoria_id: string | null;
  categorias: Categoria | null;
}

interface MovimientoInventario {
  id: string;
  tipo: "Entrada" | "Salida" | "Ajuste";
  cantidad: number;
  stock_anterior: number;
  stock_nuevo: number;
  referencia: string | null;
  notas: string | null;
  created_at: string;
  productos: { nombre: string; sku: string };
}

export default function InventarioPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [isProductoDialogOpen, setIsProductoDialogOpen] = useState(false);
  const [isCategoriaDialogOpen, setIsCategoriaDialogOpen] = useState(false);
  const [isMovimientoDialogOpen, setIsMovimientoDialogOpen] = useState(false);
  const [editingProducto, setEditingProducto] = useState<Producto | null>(null);
  const [selectedProducto, setSelectedProducto] = useState<Producto | null>(null);

  // Producto form state
  const [productoForm, setProductoForm] = useState({
    sku: "",
    codigo_barras: "",
    nombre: "",
    descripcion: "",
    unidad_medida: "UND",
    precio_compra: "",
    precio_venta: "",
    stock_actual: "",
    stock_minimo: "",
    stock_maximo: "",
    categoria_id: "",
    activo: true,
  });

  // Categoria form state
  const [categoriaForm, setCategoriaForm] = useState({
    nombre: "",
    descripcion: "",
  });

  // Movimiento form state
  const [movimientoForm, setMovimientoForm] = useState({
    tipo: "Entrada" as "Entrada" | "Salida" | "Ajuste",
    cantidad: "",
    referencia: "",
    notas: "",
  });

  // Fetch categorias
  const { data: categorias = [] } = useQuery({
    queryKey: ["categorias"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("categorias")
        .select("*")
        .order("nombre");
      if (error) throw error;
      return data as Categoria[];
    },
  });

  // Fetch productos
  const { data: productos = [] } = useQuery({
    queryKey: ["productos"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("productos")
        .select(`
          *,
          categorias (
            id,
            nombre,
            descripcion
          )
        `)
        .order("nombre");
      if (error) throw error;
      return data as Producto[];
    },
  });

  // Fetch movimientos
  const { data: movimientos = [] } = useQuery({
    queryKey: ["movimientos_inventario"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("movimientos_inventario")
        .select(`
          *,
          productos (
            nombre,
            sku
          )
        `)
        .order("created_at", { ascending: false })
        .limit(50);
      if (error) throw error;
      return data as MovimientoInventario[];
    },
  });

  // Producto mutations
  const createProductoMutation = useMutation({
    mutationFn: async (newProducto: any) => {
      const { error } = await supabase.from("productos").insert([{
        ...newProducto,
        user_id: user?.id,
      }]);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["productos"] });
      toast.success("Producto creado exitosamente");
      setIsProductoDialogOpen(false);
      resetProductoForm();
    },
    onError: (error: any) => {
      if (error.message?.includes("productos_user_id_sku_key") || error.code === "23505") {
        toast.error("Ya existe un producto con este SKU. Por favor, usa un código diferente.");
      } else {
        toast.error(error.message || "Error al crear producto");
      }
    },
  });

  const updateProductoMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: any }) => {
      const { error } = await supabase
        .from("productos")
        .update(updates)
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["productos"] });
      toast.success("Producto actualizado exitosamente");
      setIsProductoDialogOpen(false);
      setEditingProducto(null);
      resetProductoForm();
    },
    onError: (error: any) => {
      if (error.message?.includes("productos_user_id_sku_key") || error.code === "23505") {
        toast.error("Ya existe un producto con este SKU. Por favor, usa un código diferente.");
      } else {
        toast.error(error.message || "Error al actualizar producto");
      }
    },
  });

  const deleteProductoMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("productos").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["productos"] });
      toast.success("Producto eliminado exitosamente");
    },
    onError: (error: any) => {
      toast.error(error.message || "Error al eliminar producto");
    },
  });

  // Categoria mutations
  const createCategoriaMutation = useMutation({
    mutationFn: async (newCategoria: any) => {
      const { error } = await supabase.from("categorias").insert([{
        ...newCategoria,
        user_id: user?.id,
      }]);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["categorias"] });
      toast.success("Categoría creada exitosamente");
      setIsCategoriaDialogOpen(false);
      resetCategoriaForm();
    },
    onError: (error: any) => {
      toast.error(error.message || "Error al crear categoría");
    },
  });

  // Movimiento mutation
  const createMovimientoMutation = useMutation({
    mutationFn: async (newMovimiento: any) => {
      if (!selectedProducto) throw new Error("No hay producto seleccionado");
      
      const cantidad = parseFloat(newMovimiento.cantidad);
      let stockNuevo = selectedProducto.stock_actual;
      
      if (newMovimiento.tipo === "Entrada") {
        stockNuevo += cantidad;
      } else if (newMovimiento.tipo === "Salida") {
        stockNuevo -= cantidad;
      } else {
        stockNuevo = cantidad;
      }

      // Insert movement
      const { error: movError } = await supabase.from("movimientos_inventario").insert([{
        user_id: user?.id,
        producto_id: selectedProducto.id,
        tipo: newMovimiento.tipo,
        cantidad: cantidad,
        stock_anterior: selectedProducto.stock_actual,
        stock_nuevo: stockNuevo,
        referencia: newMovimiento.referencia || null,
        notas: newMovimiento.notas || null,
      }]);
      if (movError) throw movError;

      // Update product stock
      const { error: prodError } = await supabase
        .from("productos")
        .update({ stock_actual: stockNuevo })
        .eq("id", selectedProducto.id);
      if (prodError) throw prodError;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["productos"] });
      queryClient.invalidateQueries({ queryKey: ["movimientos_inventario"] });
      toast.success("Movimiento registrado exitosamente");
      setIsMovimientoDialogOpen(false);
      setSelectedProducto(null);
      resetMovimientoForm();
    },
    onError: (error: any) => {
      toast.error(error.message || "Error al registrar movimiento");
    },
  });

  const resetProductoForm = () => {
    setProductoForm({
      sku: "",
      codigo_barras: "",
      nombre: "",
      descripcion: "",
      unidad_medida: "UND",
      precio_compra: "",
      precio_venta: "",
      stock_actual: "",
      stock_minimo: "",
      stock_maximo: "",
      categoria_id: "",
      activo: true,
    });
  };

  const resetCategoriaForm = () => {
    setCategoriaForm({
      nombre: "",
      descripcion: "",
    });
  };

  const resetMovimientoForm = () => {
    setMovimientoForm({
      tipo: "Entrada",
      cantidad: "",
      referencia: "",
      notas: "",
    });
  };

  const handleSaveProducto = () => {
    if (!productoForm.sku || !productoForm.nombre) {
      toast.error("SKU y Nombre son obligatorios");
      return;
    }

    const productoData = {
      sku: productoForm.sku,
      codigo_barras: productoForm.codigo_barras || null,
      nombre: productoForm.nombre,
      descripcion: productoForm.descripcion || null,
      unidad_medida: productoForm.unidad_medida,
      precio_compra: parseFloat(productoForm.precio_compra) || 0,
      precio_venta: parseFloat(productoForm.precio_venta) || 0,
      stock_actual: parseFloat(productoForm.stock_actual) || 0,
      stock_minimo: parseFloat(productoForm.stock_minimo) || 0,
      stock_maximo: parseFloat(productoForm.stock_maximo) || 0,
      categoria_id: productoForm.categoria_id || null,
      activo: productoForm.activo,
    };

    if (editingProducto) {
      updateProductoMutation.mutate({ id: editingProducto.id, updates: productoData });
    } else {
      createProductoMutation.mutate(productoData);
    }
  };

  const handleEditProducto = (producto: Producto) => {
    setEditingProducto(producto);
    setProductoForm({
      sku: producto.sku,
      codigo_barras: producto.codigo_barras || "",
      nombre: producto.nombre,
      descripcion: producto.descripcion || "",
      unidad_medida: producto.unidad_medida,
      precio_compra: producto.precio_compra.toString(),
      precio_venta: producto.precio_venta.toString(),
      stock_actual: producto.stock_actual.toString(),
      stock_minimo: producto.stock_minimo.toString(),
      stock_maximo: producto.stock_maximo.toString(),
      categoria_id: producto.categoria_id || "",
      activo: producto.activo,
    });
    setIsProductoDialogOpen(true);
  };

  const handleSaveCategoria = () => {
    if (!categoriaForm.nombre) {
      toast.error("El nombre es obligatorio");
      return;
    }
    createCategoriaMutation.mutate(categoriaForm);
  };

  const handleSaveMovimiento = () => {
    if (!movimientoForm.cantidad || parseFloat(movimientoForm.cantidad) <= 0) {
      toast.error("La cantidad debe ser mayor a 0");
      return;
    }
    createMovimientoMutation.mutate(movimientoForm);
  };

  const productosConBajoStock = productos.filter(p => p.stock_actual <= p.stock_minimo && p.activo);
  const valorTotalInventario = productos.reduce((sum, p) => sum + (p.stock_actual * p.precio_compra), 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Inventario</h1>
          <p className="text-muted-foreground">Gestión de productos y stock</p>
        </div>
        <div className="flex gap-2">
          <Dialog open={isCategoriaDialogOpen} onOpenChange={setIsCategoriaDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" onClick={resetCategoriaForm}>
                <Tag className="mr-2 h-4 w-4" />
                Nueva Categoría
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Nueva Categoría</DialogTitle>
                <DialogDescription>Crea una nueva categoría de productos</DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="cat-nombre">Nombre *</Label>
                  <Input
                    id="cat-nombre"
                    value={categoriaForm.nombre}
                    onChange={(e) => setCategoriaForm({ ...categoriaForm, nombre: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="cat-descripcion">Descripción</Label>
                  <Textarea
                    id="cat-descripcion"
                    value={categoriaForm.descripcion}
                    onChange={(e) => setCategoriaForm({ ...categoriaForm, descripcion: e.target.value })}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsCategoriaDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button onClick={handleSaveCategoria}>Crear</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
          
          <Dialog open={isProductoDialogOpen} onOpenChange={(open) => {
            setIsProductoDialogOpen(open);
            if (!open) {
              setEditingProducto(null);
              resetProductoForm();
            }
          }}>
            <DialogTrigger asChild>
              <Button onClick={resetProductoForm}>
                <Plus className="mr-2 h-4 w-4" />
                Nuevo Producto
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{editingProducto ? "Editar" : "Nuevo"} Producto</DialogTitle>
              </DialogHeader>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="sku">SKU *</Label>
                  <Input
                    id="sku"
                    value={productoForm.sku}
                    onChange={(e) => setProductoForm({ ...productoForm, sku: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="codigo_barras">Código de Barras</Label>
                  <Input
                    id="codigo_barras"
                    value={productoForm.codigo_barras}
                    onChange={(e) => setProductoForm({ ...productoForm, codigo_barras: e.target.value })}
                  />
                </div>
                <div className="col-span-2">
                  <Label htmlFor="nombre">Nombre *</Label>
                  <Input
                    id="nombre"
                    value={productoForm.nombre}
                    onChange={(e) => setProductoForm({ ...productoForm, nombre: e.target.value })}
                  />
                </div>
                <div className="col-span-2">
                  <Label htmlFor="descripcion">Descripción</Label>
                  <Textarea
                    id="descripcion"
                    value={productoForm.descripcion}
                    onChange={(e) => setProductoForm({ ...productoForm, descripcion: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="categoria">Categoría</Label>
                  <Select value={productoForm.categoria_id} onValueChange={(val) => setProductoForm({ ...productoForm, categoria_id: val })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar" />
                    </SelectTrigger>
                    <SelectContent>
                      {categorias.map((cat) => (
                        <SelectItem key={cat.id} value={cat.id}>{cat.nombre}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="unidad">Unidad de Medida</Label>
                  <Input
                    id="unidad"
                    value={productoForm.unidad_medida}
                    onChange={(e) => setProductoForm({ ...productoForm, unidad_medida: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="precio_compra">Precio Compra</Label>
                  <Input
                    id="precio_compra"
                    type="number"
                    step="0.01"
                    value={productoForm.precio_compra}
                    onChange={(e) => setProductoForm({ ...productoForm, precio_compra: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="precio_venta">Precio Venta</Label>
                  <Input
                    id="precio_venta"
                    type="number"
                    step="0.01"
                    value={productoForm.precio_venta}
                    onChange={(e) => setProductoForm({ ...productoForm, precio_venta: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="stock_actual">Stock Actual</Label>
                  <Input
                    id="stock_actual"
                    type="number"
                    step="0.01"
                    value={productoForm.stock_actual}
                    onChange={(e) => setProductoForm({ ...productoForm, stock_actual: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="stock_minimo">Stock Mínimo</Label>
                  <Input
                    id="stock_minimo"
                    type="number"
                    step="0.01"
                    value={productoForm.stock_minimo}
                    onChange={(e) => setProductoForm({ ...productoForm, stock_minimo: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="stock_maximo">Stock Máximo</Label>
                  <Input
                    id="stock_maximo"
                    type="number"
                    step="0.01"
                    value={productoForm.stock_maximo}
                    onChange={(e) => setProductoForm({ ...productoForm, stock_maximo: e.target.value })}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => {
                  setIsProductoDialogOpen(false);
                  setEditingProducto(null);
                  resetProductoForm();
                }}>
                  Cancelar
                </Button>
                <Button onClick={handleSaveProducto}>
                  {editingProducto ? "Actualizar" : "Crear"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Productos</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{productos.length}</div>
            <p className="text-xs text-muted-foreground">
              {productos.filter(p => p.activo).length} activos
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Valor Inventario</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">S/ {valorTotalInventario.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">
              Valor total al costo
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Alertas Stock</CardTitle>
            <AlertTriangle className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">{productosConBajoStock.length}</div>
            <p className="text-xs text-muted-foreground">
              Productos bajo stock mínimo
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="productos" className="space-y-4">
        <TabsList>
          <TabsTrigger value="productos">Productos</TabsTrigger>
          <TabsTrigger value="movimientos">Movimientos</TabsTrigger>
          <TabsTrigger value="categorias">Categorías</TabsTrigger>
        </TabsList>

        <TabsContent value="productos" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Lista de Productos</CardTitle>
              <CardDescription>Gestiona tu catálogo de productos</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>SKU</TableHead>
                    <TableHead>Nombre</TableHead>
                    <TableHead>Categoría</TableHead>
                    <TableHead className="text-right">Stock</TableHead>
                    <TableHead className="text-right">P. Compra</TableHead>
                    <TableHead className="text-right">P. Venta</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {productos.map((producto) => (
                    <TableRow key={producto.id}>
                      <TableCell className="font-medium">{producto.sku}</TableCell>
                      <TableCell>{producto.nombre}</TableCell>
                      <TableCell>{producto.categorias?.nombre || "-"}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          {producto.stock_actual <= producto.stock_minimo && (
                            <AlertTriangle className="h-4 w-4 text-destructive" />
                          )}
                          {producto.stock_actual.toFixed(2)} {producto.unidad_medida}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">S/ {producto.precio_compra.toFixed(2)}</TableCell>
                      <TableCell className="text-right">S/ {producto.precio_venta.toFixed(2)}</TableCell>
                      <TableCell>
                        <Badge variant={producto.activo ? "default" : "secondary"}>
                          {producto.activo ? "Activo" : "Inactivo"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setSelectedProducto(producto);
                              setIsMovimientoDialogOpen(true);
                            }}
                          >
                            <TrendingUp className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEditProducto(producto)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              if (confirm("¿Eliminar este producto?")) {
                                deleteProductoMutation.mutate(producto.id);
                              }
                            }}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="movimientos" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Movimientos de Inventario</CardTitle>
              <CardDescription>Historial de entradas, salidas y ajustes</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Fecha</TableHead>
                    <TableHead>Producto</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead className="text-right">Cantidad</TableHead>
                    <TableHead className="text-right">Stock Ant.</TableHead>
                    <TableHead className="text-right">Stock Nuevo</TableHead>
                    <TableHead>Referencia</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {movimientos.map((mov) => (
                    <TableRow key={mov.id}>
                      <TableCell>{new Date(mov.created_at).toLocaleDateString()}</TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{mov.productos.nombre}</div>
                          <div className="text-sm text-muted-foreground">{mov.productos.sku}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            mov.tipo === "Entrada" ? "default" :
                            mov.tipo === "Salida" ? "destructive" :
                            "secondary"
                          }
                        >
                          {mov.tipo === "Entrada" && <TrendingUp className="mr-1 h-3 w-3" />}
                          {mov.tipo === "Salida" && <TrendingDown className="mr-1 h-3 w-3" />}
                          {mov.tipo}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">{mov.cantidad.toFixed(2)}</TableCell>
                      <TableCell className="text-right">{mov.stock_anterior.toFixed(2)}</TableCell>
                      <TableCell className="text-right">{mov.stock_nuevo.toFixed(2)}</TableCell>
                      <TableCell>{mov.referencia || "-"}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="categorias" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Categorías</CardTitle>
              <CardDescription>Organiza tus productos por categorías</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nombre</TableHead>
                    <TableHead>Descripción</TableHead>
                    <TableHead className="text-right">Productos</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {categorias.map((cat) => {
                    const productosCount = productos.filter(p => p.categoria_id === cat.id).length;
                    return (
                      <TableRow key={cat.id}>
                        <TableCell className="font-medium">{cat.nombre}</TableCell>
                        <TableCell>{cat.descripcion || "-"}</TableCell>
                        <TableCell className="text-right">{productosCount}</TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Movimiento Dialog */}
      <Dialog open={isMovimientoDialogOpen} onOpenChange={(open) => {
        setIsMovimientoDialogOpen(open);
        if (!open) {
          setSelectedProducto(null);
          resetMovimientoForm();
        }
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Registrar Movimiento</DialogTitle>
            <DialogDescription>
              {selectedProducto && (
                <div className="mt-2 space-y-1">
                  <div className="font-medium">{selectedProducto.nombre}</div>
                  <div className="text-sm">Stock actual: {selectedProducto.stock_actual} {selectedProducto.unidad_medida}</div>
                </div>
              )}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="mov-tipo">Tipo de Movimiento *</Label>
              <Select value={movimientoForm.tipo} onValueChange={(val: any) => setMovimientoForm({ ...movimientoForm, tipo: val })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Entrada">Entrada</SelectItem>
                  <SelectItem value="Salida">Salida</SelectItem>
                  <SelectItem value="Ajuste">Ajuste</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="mov-cantidad">
                Cantidad * {movimientoForm.tipo === "Ajuste" && "(nuevo stock total)"}
              </Label>
              <Input
                id="mov-cantidad"
                type="number"
                step="0.01"
                value={movimientoForm.cantidad}
                onChange={(e) => setMovimientoForm({ ...movimientoForm, cantidad: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="mov-referencia">Referencia</Label>
              <Input
                id="mov-referencia"
                value={movimientoForm.referencia}
                onChange={(e) => setMovimientoForm({ ...movimientoForm, referencia: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="mov-notas">Notas</Label>
              <Textarea
                id="mov-notas"
                value={movimientoForm.notas}
                onChange={(e) => setMovimientoForm({ ...movimientoForm, notas: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setIsMovimientoDialogOpen(false);
              setSelectedProducto(null);
              resetMovimientoForm();
            }}>
              Cancelar
            </Button>
            <Button onClick={handleSaveMovimiento}>Registrar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
