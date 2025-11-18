import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart3, Users, ShoppingCart, FileText, TrendingUp, Receipt } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from "recharts";
import { Skeleton } from "@/components/ui/skeleton";

export default function DashboardPage() {
  const { user } = useAuth();

  // Fetch clientes
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

  // Fetch oportunidades
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

  // Fetch cotizaciones
  const { data: cotizaciones = [], isLoading: loadingCotizaciones } = useQuery({
    queryKey: ["cotizaciones-dashboard"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("cotizaciones")
        .select("*")
        .eq("user_id", user?.id || "");
      if (error) throw error;
      return data || [];
    },
    enabled: !!user,
  });

  // Fetch facturas
  const { data: facturas = [], isLoading: loadingFacturas } = useQuery({
    queryKey: ["facturas-dashboard"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("facturas")
        .select("*")
        .eq("user_id", user?.id || "");
      if (error) throw error;
      return data || [];
    },
    enabled: !!user,
  });

  // Calculate stats
  const totalVentas = facturas
    .filter((f) => f.estado === "Pagada" || f.estado === "Emitida")
    .reduce((sum, f) => sum + Number(f.total), 0);

  const totalOportunidades = oportunidades.reduce(
    (sum, o) => sum + Number(o.valor_estimado || 0),
    0
  );

  // Oportunidades por estado
  const oportunidadesPorEstado = [
    { name: "Nuevo", value: oportunidades.filter((o) => o.estado === "Nuevo").length },
    { name: "Contactado", value: oportunidades.filter((o) => o.estado === "Contactado").length },
    { name: "Propuesta", value: oportunidades.filter((o) => o.estado === "Propuesta Enviada").length },
    { name: "Negociación", value: oportunidades.filter((o) => o.estado === "Negociación").length },
    { name: "Ganado", value: oportunidades.filter((o) => o.estado === "Ganado").length },
    { name: "Perdido", value: oportunidades.filter((o) => o.estado === "Perdido").length },
  ].filter((item) => item.value > 0);

  // Ventas por mes (últimos 6 meses)
  const ventasPorMes = (() => {
    const meses = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];
    const now = new Date();
    const data = [];

    for (let i = 5; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const mes = meses[date.getMonth()];
      const total = facturas
        .filter((f) => {
          const fDate = new Date(f.fecha_emision);
          return (
            fDate.getMonth() === date.getMonth() &&
            fDate.getFullYear() === date.getFullYear() &&
            (f.estado === "Pagada" || f.estado === "Emitida")
          );
        })
        .reduce((sum, f) => sum + Number(f.total), 0);

      data.push({ mes, total: Number(total.toFixed(2)) });
    }
    return data;
  })();

  const COLORS = ["hsl(var(--primary))", "hsl(var(--accent))", "hsl(var(--secondary))", "#8884d8", "#82ca9d", "#ffc658"];

  const isLoading = loadingClientes || loadingOportunidades || loadingCotizaciones || loadingFacturas;

  const stats = [
    {
      title: "Ventas Totales",
      value: `S/ ${totalVentas.toFixed(2)}`,
      description: `${facturas.filter((f) => f.estado === "Pagada" || f.estado === "Emitida").length} facturas`,
      icon: Receipt,
      color: "text-primary",
    },
    {
      title: "Clientes",
      value: clientes.length.toString(),
      description: "Total de clientes registrados",
      icon: Users,
      color: "text-accent",
    },
    {
      title: "Oportunidades",
      value: `S/ ${totalOportunidades.toFixed(2)}`,
      description: `${oportunidades.length} oportunidades activas`,
      icon: TrendingUp,
      color: "text-primary",
    },
    {
      title: "Cotizaciones",
      value: cotizaciones.length.toString(),
      description: `${cotizaciones.filter((c) => c.estado === "Enviado").length} enviadas`,
      icon: FileText,
      color: "text-accent",
    },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">Dashboard</h1>
        <p className="text-muted-foreground">
          Vista general de tu sistema de gestión empresarial
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.title} className="transition-shadow hover:shadow-md">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {stat.title}
              </CardTitle>
              <stat.icon className={`h-5 w-5 ${stat.color}`} />
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-8 w-24" />
              ) : (
                <>
                  <div className="text-2xl font-bold text-foreground">{stat.value}</div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {stat.description}
                  </p>
                </>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts Grid */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Ventas por Mes */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-primary" />
              Ventas por Mes
            </CardTitle>
            <CardDescription>Últimos 6 meses</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-64 w-full" />
            ) : ventasPorMes.every((v) => v.total === 0) ? (
              <div className="flex h-64 items-center justify-center text-muted-foreground">
                No hay datos de ventas aún
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={ventasPorMes}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="mes" stroke="hsl(var(--muted-foreground))" />
                  <YAxis stroke="hsl(var(--muted-foreground))" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--background))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "6px",
                    }}
                  />
                  <Bar dataKey="total" fill="hsl(var(--primary))" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Oportunidades por Estado */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              Oportunidades por Estado
            </CardTitle>
            <CardDescription>Distribución actual</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-64 w-full" />
            ) : oportunidadesPorEstado.length === 0 ? (
              <div className="flex h-64 items-center justify-center text-muted-foreground">
                No hay oportunidades registradas
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={oportunidadesPorEstado}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {oportunidadesPorEstado.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--background))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "6px",
                    }}
                  />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle>Actividad Reciente</CardTitle>
          <CardDescription>Últimas transacciones y eventos</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
            </div>
          ) : (
            <div className="space-y-4">
              {facturas.length === 0 && cotizaciones.length === 0 && oportunidades.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No hay actividad reciente. Comienza creando clientes, oportunidades o cotizaciones.
                </p>
              ) : (
                <>
                  {facturas.slice(0, 3).map((factura) => (
                    <div key={factura.id} className="flex items-center justify-between border-b border-border pb-3 last:border-0">
                      <div className="flex items-center gap-3">
                        <Receipt className="h-5 w-5 text-primary" />
                        <div>
                          <p className="text-sm font-medium text-foreground">
                            Factura {factura.numero_factura}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(factura.fecha_emision).toLocaleDateString('es-PE')}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-semibold text-foreground">
                          S/ {Number(factura.total).toFixed(2)}
                        </p>
                        <p className="text-xs text-muted-foreground">{factura.estado}</p>
                      </div>
                    </div>
                  ))}
                  {cotizaciones.slice(0, 2).map((cotizacion) => (
                    <div key={cotizacion.id} className="flex items-center justify-between border-b border-border pb-3 last:border-0">
                      <div className="flex items-center gap-3">
                        <FileText className="h-5 w-5 text-accent" />
                        <div>
                          <p className="text-sm font-medium text-foreground">
                            Cotización {cotizacion.numero_cotizacion}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(cotizacion.fecha_emision).toLocaleDateString('es-PE')}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-semibold text-foreground">
                          S/ {Number(cotizacion.total).toFixed(2)}
                        </p>
                        <p className="text-xs text-muted-foreground">{cotizacion.estado}</p>
                      </div>
                    </div>
                  ))}
                </>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}