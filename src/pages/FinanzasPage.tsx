import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { TrendingUp, TrendingDown, DollarSign, ShoppingCart, Receipt, Wallet } from "lucide-react";
import { format, startOfMonth, endOfMonth, startOfYear, endOfYear, subMonths } from "date-fns";
import { es } from "date-fns/locale";

const COLORS = ["hsl(var(--chart-1))", "hsl(var(--chart-2))", "hsl(var(--chart-3))", "hsl(var(--chart-4))"];

export default function FinanzasPage() {
  const [period, setPeriod] = useState<"month" | "year">("month");
  const [selectedMonth, setSelectedMonth] = useState<number>(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());

  const getDateRange = () => {
    if (period === "month") {
      const date = new Date(selectedYear, selectedMonth);
      return {
        start: format(startOfMonth(date), "yyyy-MM-dd"),
        end: format(endOfMonth(date), "yyyy-MM-dd"),
      };
    } else {
      const date = new Date(selectedYear, 0);
      return {
        start: format(startOfYear(date), "yyyy-MM-dd"),
        end: format(endOfYear(date), "yyyy-MM-dd"),
      };
    }
  };

  // Always fetch full year data for charts
  const yearStart = format(startOfYear(new Date(selectedYear, 0)), "yyyy-MM-dd");
  const yearEnd = format(endOfYear(new Date(selectedYear, 0)), "yyyy-MM-dd");

  const { data: allFacturas = [] } = useQuery({
    queryKey: ["facturas", selectedYear],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("No user found");

      const { data, error } = await supabase
        .from("facturas")
        .select("*, clientes(razon_social)")
        .eq("user_id", user.id)
        .gte("fecha_emision", yearStart)
        .lte("fecha_emision", yearEnd)
        .order("fecha_emision", { ascending: true });

      if (error) throw error;
      return data || [];
    },
  });

  const { data: allOrdenesCompra = [] } = useQuery({
    queryKey: ["ordenes_compra", selectedYear],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("No user found");

      const { data, error } = await supabase
        .from("ordenes_compra")
        .select("*, proveedores(razon_social)")
        .eq("user_id", user.id)
        .gte("fecha_orden", yearStart)
        .lte("fecha_orden", yearEnd)
        .order("fecha_orden", { ascending: true });

      if (error) throw error;
      return data || [];
    },
  });

  // Filter for KPIs based on selected period
  const { start: kpiStart, end: kpiEnd } = getDateRange();
  const facturas = allFacturas.filter((f) =>
    f.fecha_emision >= kpiStart && f.fecha_emision <= kpiEnd
  );
  const ordenesCompra = allOrdenesCompra.filter((o) =>
    o.fecha_orden >= kpiStart && o.fecha_orden <= kpiEnd
  );

  // Cálculos financieros
  const ingresosTotales = facturas
    .filter((f) => f.estado === "Pagada")
    .reduce((sum, f) => sum + Number(f.total), 0);

  const ingresosPendientes = facturas
    .filter((f) => f.estado !== "Pagada" && f.estado !== "Cancelada")
    .reduce((sum, f) => sum + Number(f.total), 0);

  const gastosTotales = ordenesCompra
    .filter((o) => o.estado === "Aprobado")
    .reduce((sum, o) => sum + Number(o.total), 0);

  const gastosPendientes = ordenesCompra
    .filter((o) => o.estado !== "Aprobado" && o.estado !== "Cancelado")
    .reduce((sum, o) => sum + Number(o.total), 0);

  const utilidadNeta = ingresosTotales - gastosTotales;
  const margenUtilidad = ingresosTotales > 0 ? ((utilidadNeta / ingresosTotales) * 100).toFixed(2) : "0.00";

  // Datos para gráficos (siempre usa datos del año completo)
  const monthlyData = Array.from({ length: 12 }, (_, i) => {
    const monthDate = new Date(selectedYear, i);
    const monthStart = format(startOfMonth(monthDate), "yyyy-MM-dd");
    const monthEnd = format(endOfMonth(monthDate), "yyyy-MM-dd");

    const ingresos = allFacturas
      .filter((f) => f.fecha_emision >= monthStart && f.fecha_emision <= monthEnd && f.estado === "Pagada")
      .reduce((sum, f) => sum + Number(f.total), 0);

    const gastos = allOrdenesCompra
      .filter((o) => o.fecha_orden >= monthStart && o.fecha_orden <= monthEnd && o.estado === "Aprobado")
      .reduce((sum, o) => sum + Number(o.total), 0);

    return {
      mes: format(monthDate, "MMM", { locale: es }),
      ingresos: Number(ingresos.toFixed(2)),
      gastos: Number(gastos.toFixed(2)),
      utilidad: Number((ingresos - gastos).toFixed(2)),
    };
  });

  const estadoFacturas = [
    { name: "Pagadas", value: facturas.filter((f) => f.estado === "Pagada").length },
    { name: "Emitidas", value: facturas.filter((f) => f.estado === "Emitida").length },
    { name: "Vencidas", value: facturas.filter((f) => f.estado === "Vencida").length },
    { name: "Canceladas", value: facturas.filter((f) => f.estado === "Cancelada").length },
    { name: "Borrador", value: facturas.filter((f) => f.estado === "Borrador").length },
  ].filter((item) => item.value > 0);

  const topClientes = Object.entries(
    facturas
      .filter((f) => f.estado === "Pagada")
      .reduce((acc: Record<string, number>, f) => {
        const cliente = f.clientes?.razon_social || "Sin cliente";
        acc[cliente] = (acc[cliente] || 0) + Number(f.total);
        return acc;
      }, {})
  )
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5)
    .map(([nombre, total]) => ({ nombre, total: Number(total.toFixed(2)) }));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Finanzas</h1>
          <p className="text-muted-foreground">Reportes y análisis contable</p>
        </div>
        <div className="flex gap-2">
          <Select value={period} onValueChange={(v) => setPeriod(v as "month" | "year")}>
            <SelectTrigger className="w-[150px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="month">Mensual</SelectItem>
              <SelectItem value="year">Anual</SelectItem>
            </SelectContent>
          </Select>
          {period === "month" && (
            <Select value={selectedMonth.toString()} onValueChange={(v) => setSelectedMonth(parseInt(v))}>
              <SelectTrigger className="w-[150px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Array.from({ length: 12 }, (_, i) => (
                  <SelectItem key={i} value={i.toString()}>
                    {format(new Date(2024, i), "MMMM", { locale: es })}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
          <Select value={selectedYear.toString()} onValueChange={(v) => setSelectedYear(parseInt(v))}>
            <SelectTrigger className="w-[120px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i).map((year) => (
                <SelectItem key={year} value={year.toString()}>
                  {year}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ingresos Totales</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" style={{ color: '#df2020' }}>S/. {ingresosTotales.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">
              +S/. {ingresosPendientes.toFixed(2)} pendientes
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Gastos Totales</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" style={{ color: '#df2020' }}>S/. {gastosTotales.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">
              +S/. {gastosPendientes.toFixed(2)} pendientes
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Utilidad Neta</CardTitle>
            {utilidadNeta >= 0 ? (
              <TrendingUp className="h-4 w-4 text-green-500" />
            ) : (
              <TrendingDown className="h-4 w-4 text-red-500" />
            )}
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${utilidadNeta >= 0 ? "text-green-600" : "text-red-600"}`}>
              S/. {utilidadNeta.toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground">
              Ingresos - Gastos
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Margen de Utilidad</CardTitle>
            <Wallet className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{margenUtilidad}%</div>
            <p className="text-xs text-muted-foreground">
              {facturas.length} facturas emitidas
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Gráficos */}
      <Tabs defaultValue="trends" className="space-y-4">
        <TabsList>
          <TabsTrigger value="trends">Tendencias</TabsTrigger>
          <TabsTrigger value="comparison">Comparación</TabsTrigger>
          <TabsTrigger value="distribution">Distribución</TabsTrigger>
          <TabsTrigger value="clients">Top Clientes</TabsTrigger>
        </TabsList>

        <TabsContent value="trends" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Tendencia de Ingresos y Gastos</CardTitle>
              <CardDescription>
                Evolución mensual de ingresos, gastos y utilidad
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={350}>
                <LineChart data={monthlyData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="mes" stroke="hsl(var(--muted-foreground))" />
                  <YAxis stroke="hsl(var(--muted-foreground))" />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: "hsl(var(--card))", 
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "var(--radius)"
                    }} 
                  />
                  <Legend />
                  <Line type="monotone" dataKey="ingresos" stroke="hsl(var(--chart-1))" strokeWidth={2} name="Ingresos" />
                  <Line type="monotone" dataKey="gastos" stroke="hsl(var(--chart-2))" strokeWidth={2} name="Gastos" />
                  <Line type="monotone" dataKey="utilidad" stroke="hsl(var(--chart-3))" strokeWidth={2} name="Utilidad" />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="comparison" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Comparación Mensual</CardTitle>
              <CardDescription>
                Ingresos vs Gastos por mes
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={350}>
                <BarChart data={monthlyData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="mes" stroke="hsl(var(--muted-foreground))" />
                  <YAxis stroke="hsl(var(--muted-foreground))" />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: "hsl(var(--card))", 
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "var(--radius)"
                    }} 
                  />
                  <Legend />
                  <Bar dataKey="ingresos" fill="hsl(var(--chart-1))" name="Ingresos" />
                  <Bar dataKey="gastos" fill="hsl(var(--chart-2))" name="Gastos" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="distribution" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Estado de Facturas</CardTitle>
              <CardDescription>
                Distribución de facturas por estado
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={350}>
                <PieChart>
                  <Pie
                    data={estadoFacturas}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={120}
                    fill="hsl(var(--chart-1))"
                    dataKey="value"
                  >
                    {estadoFacturas.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: "hsl(var(--card))", 
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "var(--radius)"
                    }} 
                  />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="clients" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Top 5 Clientes</CardTitle>
              <CardDescription>
                Clientes con mayor volumen de ingresos
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={350}>
                <BarChart data={topClientes} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis type="number" stroke="hsl(var(--muted-foreground))" />
                  <YAxis dataKey="nombre" type="category" stroke="hsl(var(--muted-foreground))" width={150} />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: "hsl(var(--card))", 
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "var(--radius)"
                    }} 
                  />
                  <Bar dataKey="total" fill="hsl(var(--chart-1))" name="Total (S/.)" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
