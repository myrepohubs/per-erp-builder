import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart3, Users, ShoppingCart, FileText, TrendingUp, Receipt, Package, AlertTriangle, DollarSign, ArrowUpRight, ArrowDownRight } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend, LineChart, Line } from "recharts";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function DashboardPage() {
  const { user } = useAuth();

  // Fetch all data
  const { data: clientes = [], isLoading: loadingClientes } = useQuery({
    queryKey: ["clientes-count"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("clientes")
        .select("*")
        .eq("user_id", user?.id || "");
      if (error) throw error;
      return data || [];
    },
    enabled: !!user,
  });

  const { data: oportunidades = [], isLoading: loadingOportunidades } = useQuery({
    queryKey: ["oportunidades-dashboard"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("oportunidades")
        .select("*")
        .eq("user_id", user?.id || "");
      if (error) throw error;
      return data || [];
    },
    enabled: !!user,
  });

  const { data: cotizaciones = [], isLoading: loadingCotizaciones } = useQuery({
    queryKey: ["cotizaciones-dashboard"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("cotizaciones")
        .select("*, clientes(razon_social)")
        .eq("user_id", user?.id || "")
        .order("created_at", { ascending: false })
        .limit(5);
      if (error) throw error;
      return data || [];
    },
    enabled: !!user,
  });

  const { data: pedidos = [], isLoading: loadingPedidos } = useQuery({
    queryKey: ["pedidos-dashboard"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("pedidos")
        .select("*")
        .eq("user_id", user?.id || "");
      if (error) throw error;
      return data || [];
    },
    enabled: !!user,
  });

  const { data: facturas = [], isLoading: loadingFacturas } = useQuery({
    queryKey: ["facturas-dashboard"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("facturas")
        .select("*, clientes(razon_social)")
        .eq("user_id", user?.id || "")
        .order("created_at", { ascending: false })
        .limit(5);
      if (error) throw error;
      return data || [];
    },
    enabled: !!user,
  });

  const { data: ordenesCompra = [], isLoading: loadingOrdenes } = useQuery({
    queryKey: ["ordenes-compra-dashboard"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("ordenes_compra")
        .select("*")
        .eq("user_id", user?.id || "");
      if (error) throw error;
      return data || [];
    },
    enabled: !!user,
  });

  const { data: productos = [], isLoading: loadingProductos } = useQuery({
    queryKey: ["productos-dashboard"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("productos")
        .select("*")
        .eq("user_id", user?.id || "")
        .eq("activo", true);
      if (error) throw error;
      return data || [];
    },
    enabled: !!user,
  });

  // Calculate comprehensive stats
  const totalVentas = facturas
    .filter((f) => f.estado === "Pagada" || f.estado === "Emitida")
    .reduce((sum, f) => sum + Number(f.total), 0);

  const totalCompras = ordenesCompra
    .filter((o) => o.estado === "Aprobado" || o.estado === "Enviado")
    .reduce((sum, o) => sum + Number(o.total), 0);

  const valorInventario = productos.reduce(
    (sum, p) => sum + Number(p.stock_actual || 0) * Number(p.precio_compra || 0),
    0
  );

  const totalOportunidades = oportunidades.reduce(
    (sum, o) => sum + Number(o.valor_estimado || 0),
    0
  );

  // Conversion metrics
  const oportunidadesGanadas = oportunidades.filter((o) => o.estado === "Ganado").length;
  const tasaConversion = oportunidades.length > 0 
    ? ((oportunidadesGanadas / oportunidades.length) * 100).toFixed(1)
    : 0;

  // Low stock alerts
  const productosStockBajo = productos.filter(
    (p) => Number(p.stock_actual || 0) <= Number(p.stock_minimo || 0)
  );

  // Pending documents
  const cotizacionesPendientes = cotizaciones.filter((c) => c.estado === "Enviado").length;
  const facturasPendientes = facturas.filter((f) => f.estado === "Emitida").length;

  // Sales trend (last 6 months)
  const ventasPorMes = (() => {
    const meses = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];
    const now = new Date();
    const data = [];

    for (let i = 5; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const mes = meses[date.getMonth()];
      const ventas = facturas
        .filter((f) => {
          const fDate = new Date(f.fecha_emision);
          return (
            fDate.getMonth() === date.getMonth() &&
            fDate.getFullYear() === date.getFullYear() &&
            (f.estado === "Pagada" || f.estado === "Emitida")
          );
        })
        .reduce((sum, f) => sum + Number(f.total), 0);

      const compras = ordenesCompra
        .filter((o) => {
          const oDate = new Date(o.fecha_orden);
          return (
            oDate.getMonth() === date.getMonth() &&
            oDate.getFullYear() === date.getFullYear() &&
            (o.estado === "Aprobado" || o.estado === "Enviado")
          );
        })
        .reduce((sum, o) => sum + Number(o.total), 0);

      data.push({ 
        mes, 
        ventas: Number(ventas.toFixed(2)),
        compras: Number(compras.toFixed(2))
      });
    }
    return data;
  })();

  // Opportunity funnel
  const embudoOportunidades = [
    { name: "Nuevo", value: oportunidades.filter((o) => o.estado === "Nuevo").length },
    { name: "Contactado", value: oportunidades.filter((o) => o.estado === "Contactado").length },
    { name: "Propuesta", value: oportunidades.filter((o) => o.estado === "Propuesta Enviada").length },
    { name: "Negociación", value: oportunidades.filter((o) => o.estado === "Negociación").length },
    { name: "Ganado", value: oportunidades.filter((o) => o.estado === "Ganado").length },
  ].filter((item) => item.value > 0);

  // Document status distribution
  const estadoDocumentos = [
    { name: "Cotizaciones", value: cotizaciones.length },
    { name: "Pedidos", value: pedidos.length },
    { name: "Facturas", value: facturas.length },
    { name: "Órdenes Compra", value: ordenesCompra.length },
  ].filter((item) => item.value > 0);

  const COLORS = ["hsl(212, 95%, 45%)", "hsl(165, 75%, 45%)", "hsl(38, 92%, 50%)", "hsl(0, 75%, 55%)", "hsl(270, 70%, 55%)"];

  const isLoading = loadingClientes || loadingOportunidades || loadingCotizaciones || 
    loadingFacturas || loadingPedidos || loadingOrdenes || loadingProductos;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">Dashboard</h1>
        <p className="text-muted-foreground">
          Vista general de tu sistema de gestión empresarial
        </p>
      </div>

      {/* Key Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="transition-shadow hover:shadow-md border-l-4 border-l-primary">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Ventas Totales
            </CardTitle>
            <DollarSign className="h-5 w-5 text-primary" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-32" />
            ) : (
              <>
                <div className="text-2xl font-bold text-foreground">
                  S/ {totalVentas.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>
                <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                  <ArrowUpRight className="h-3 w-3 text-accent" />
                  {facturas.filter((f) => f.estado === "Pagada" || f.estado === "Emitida").length} facturas
                </p>
              </>
            )}
          </CardContent>
        </Card>

        <Card className="transition-shadow hover:shadow-md border-l-4 border-l-destructive">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Compras Totales
            </CardTitle>
            <ShoppingCart className="h-5 w-5 text-destructive" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-32" />
            ) : (
              <>
                <div className="text-2xl font-bold text-foreground">
                  S/ {totalCompras.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>
                <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                  <ArrowDownRight className="h-3 w-3 text-destructive" />
                  {ordenesCompra.filter((o) => o.estado === "Aprobado" || o.estado === "Enviado").length} órdenes
                </p>
              </>
            )}
          </CardContent>
        </Card>

        <Card className="transition-shadow hover:shadow-md border-l-4 border-l-accent">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Valor Inventario
            </CardTitle>
            <Package className="h-5 w-5 text-accent" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-32" />
            ) : (
              <>
                <div className="text-2xl font-bold text-foreground">
                  S/ {valorInventario.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {productos.length} productos activos
                </p>
              </>
            )}
          </CardContent>
        </Card>

        <Card className="transition-shadow hover:shadow-md border-l-4 border-l-[hsl(270,70%,55%)]">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Tasa Conversión
            </CardTitle>
            <TrendingUp className="h-5 w-5" style={{ color: "hsl(270, 70%, 55%)" }} />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-32" />
            ) : (
              <>
                <div className="text-2xl font-bold text-foreground">{tasaConversion}%</div>
                <p className="text-xs text-muted-foreground mt-1">
                  {oportunidadesGanadas} de {oportunidades.length} ganadas
                </p>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Alerts Section */}
      {(productosStockBajo.length > 0 || cotizacionesPendientes > 0 || facturasPendientes > 0) && (
        <Card className="border-l-4 border-l-destructive bg-destructive/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-5 w-5" />
              Alertas y Pendientes
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {productosStockBajo.length > 0 && (
              <div className="flex items-center justify-between">
                <span className="text-sm">Productos con stock bajo</span>
                <Badge variant="destructive">{productosStockBajo.length}</Badge>
              </div>
            )}
            {cotizacionesPendientes > 0 && (
              <div className="flex items-center justify-between">
                <span className="text-sm">Cotizaciones enviadas pendientes</span>
                <Badge variant="secondary">{cotizacionesPendientes}</Badge>
              </div>
            )}
            {facturasPendientes > 0 && (
              <div className="flex items-center justify-between">
                <span className="text-sm">Facturas emitidas pendientes de pago</span>
                <Badge variant="secondary">{facturasPendientes}</Badge>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Charts Section */}
      <Tabs defaultValue="ventas" className="space-y-4">
        <TabsList>
          <TabsTrigger value="ventas">Ventas vs Compras</TabsTrigger>
          <TabsTrigger value="oportunidades">Embudo Oportunidades</TabsTrigger>
          <TabsTrigger value="documentos">Documentos</TabsTrigger>
        </TabsList>

        <TabsContent value="ventas" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-primary" />
                Ventas vs Compras
              </CardTitle>
              <CardDescription>Comparativa últimos 6 meses</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-80 w-full" />
              ) : (
                <ResponsiveContainer width="100%" height={320}>
                  <LineChart data={ventasPorMes}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis 
                      dataKey="mes" 
                      stroke="hsl(var(--muted-foreground))"
                      fontSize={12}
                    />
                    <YAxis 
                      stroke="hsl(var(--muted-foreground))"
                      fontSize={12}
                      tickFormatter={(value) => `S/ ${value.toLocaleString()}`}
                    />
                    <Tooltip 
                      contentStyle={{
                        backgroundColor: "hsl(var(--card))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "var(--radius)",
                      }}
                      formatter={(value: number) => `S/ ${value.toLocaleString('es-PE', { minimumFractionDigits: 2 })}`}
                    />
                    <Legend />
                    <Line 
                      type="monotone" 
                      dataKey="ventas" 
                      stroke="hsl(212, 95%, 45%)" 
                      strokeWidth={2}
                      name="Ventas"
                    />
                    <Line 
                      type="monotone" 
                      dataKey="compras" 
                      stroke="hsl(0, 75%, 55%)" 
                      strokeWidth={2}
                      name="Compras"
                    />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="oportunidades" className="space-y-4">
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-primary" />
                  Embudo de Oportunidades
                </CardTitle>
                <CardDescription>Estado de oportunidades de venta</CardDescription>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <Skeleton className="h-64 w-full" />
                ) : embudoOportunidades.length === 0 ? (
                  <div className="flex h-64 items-center justify-center text-muted-foreground">
                    No hay oportunidades registradas
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height={280}>
                    <BarChart data={embudoOportunidades} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis type="number" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                      <YAxis 
                        type="category" 
                        dataKey="name" 
                        stroke="hsl(var(--muted-foreground))"
                        fontSize={12}
                        width={100}
                      />
                      <Tooltip 
                        contentStyle={{
                          backgroundColor: "hsl(var(--card))",
                          border: "1px solid hsl(var(--border))",
                          borderRadius: "var(--radius)",
                        }}
                      />
                      <Bar dataKey="value" fill="hsl(212, 95%, 45%)" />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Resumen CRM</CardTitle>
                <CardDescription>Métricas principales</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Users className="h-5 w-5 text-primary" />
                    <span className="text-sm font-medium">Total Clientes</span>
                  </div>
                  <span className="text-2xl font-bold">{clientes.length}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <TrendingUp className="h-5 w-5 text-accent" />
                    <span className="text-sm font-medium">Oportunidades</span>
                  </div>
                  <span className="text-2xl font-bold">{oportunidades.length}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <DollarSign className="h-5 w-5 text-primary" />
                    <span className="text-sm font-medium">Valor Potencial</span>
                  </div>
                  <span className="text-lg font-bold">
                    S/ {totalOportunidades.toLocaleString('es-PE', { minimumFractionDigits: 2 })}
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="documentos" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-primary" />
                Distribución de Documentos
              </CardTitle>
              <CardDescription>Total de documentos por tipo</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-80 w-full" />
              ) : estadoDocumentos.length === 0 ? (
                <div className="flex h-80 items-center justify-center text-muted-foreground">
                  No hay documentos registrados
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={320}>
                  <PieChart>
                    <Pie
                      data={estadoDocumentos}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, value }) => `${name}: ${value}`}
                      outerRadius={100}
                      fill="hsl(var(--primary))"
                      dataKey="value"
                    >
                      {estadoDocumentos.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{
                        backgroundColor: "hsl(var(--card))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "var(--radius)",
                      }}
                    />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Recent Activity */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Cotizaciones Recientes</CardTitle>
            <CardDescription>Últimas 5 cotizaciones</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-2">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-16 w-full" />
                ))}
              </div>
            ) : cotizaciones.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                No hay cotizaciones registradas
              </p>
            ) : (
              <div className="space-y-3">
                {cotizaciones.map((cot: any) => (
                  <div key={cot.id} className="flex items-center justify-between border-b border-border pb-3 last:border-0">
                    <div>
                      <p className="font-medium text-sm">{cot.numero_cotizacion}</p>
                      <p className="text-xs text-muted-foreground">
                        {cot.clientes?.razon_social || "Sin cliente"}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-sm">
                        S/ {Number(cot.total).toLocaleString('es-PE', { minimumFractionDigits: 2 })}
                      </p>
                      <Badge variant={cot.estado === "Aprobado" ? "default" : "secondary"} className="text-xs">
                        {cot.estado}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Facturas Recientes</CardTitle>
            <CardDescription>Últimas 5 facturas</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-2">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-16 w-full" />
                ))}
              </div>
            ) : facturas.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                No hay facturas registradas
              </p>
            ) : (
              <div className="space-y-3">
                {facturas.map((fact: any) => (
                  <div key={fact.id} className="flex items-center justify-between border-b border-border pb-3 last:border-0">
                    <div>
                      <p className="font-medium text-sm">{fact.serie}-{fact.numero_factura}</p>
                      <p className="text-xs text-muted-foreground">
                        {fact.clientes?.razon_social || "Sin cliente"}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-sm">
                        S/ {Number(fact.total).toLocaleString('es-PE', { minimumFractionDigits: 2 })}
                      </p>
                      <Badge 
                        variant={fact.estado === "Pagada" ? "default" : fact.estado === "Emitida" ? "secondary" : "outline"}
                        className="text-xs"
                      >
                        {fact.estado}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}