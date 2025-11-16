import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart3, Users, ShoppingCart, Package, TrendingUp } from "lucide-react";

export default function DashboardPage() {
  const stats = [
    {
      title: "Ventas del Mes",
      value: "S/ 0.00",
      description: "Sin transacciones aún",
      icon: ShoppingCart,
      trend: "+0%",
      color: "text-primary",
    },
    {
      title: "Clientes Activos",
      value: "0",
      description: "Total de clientes",
      icon: Users,
      trend: "+0%",
      color: "text-accent",
    },
    {
      title: "Productos en Stock",
      value: "0",
      description: "Productos disponibles",
      icon: Package,
      trend: "0%",
      color: "text-muted-foreground",
    },
    {
      title: "Margen de Beneficio",
      value: "0%",
      description: "Promedio mensual",
      icon: TrendingUp,
      trend: "+0%",
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
              <div className="text-2xl font-bold text-foreground">{stat.value}</div>
              <p className="text-xs text-muted-foreground">
                {stat.description}
              </p>
              <div className="mt-2 flex items-center text-xs">
                <span className="text-accent font-medium">{stat.trend}</span>
                <span className="ml-1 text-muted-foreground">desde el mes pasado</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Welcome Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-primary" />
            Bienvenido a tu ERP
          </CardTitle>
          <CardDescription>
            Sistema de Gestión Empresarial para PYMES Peruanas
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Este es tu centro de control. Desde aquí podrás gestionar todos los aspectos
            de tu negocio:
          </p>
          <ul className="space-y-2 text-sm">
            <li className="flex items-center gap-2">
              <div className="h-1.5 w-1.5 rounded-full bg-primary" />
              <span className="text-foreground"><strong>CRM:</strong> Gestiona tus clientes y oportunidades de venta</span>
            </li>
            <li className="flex items-center gap-2">
              <div className="h-1.5 w-1.5 rounded-full bg-primary" />
              <span className="text-foreground"><strong>Ventas:</strong> Emite facturas y boletas según normativa peruana</span>
            </li>
            <li className="flex items-center gap-2">
              <div className="h-1.5 w-1.5 rounded-full bg-primary" />
              <span className="text-foreground"><strong>Inventario:</strong> Controla tu stock en tiempo real</span>
            </li>
            <li className="flex items-center gap-2">
              <div className="h-1.5 w-1.5 rounded-full bg-primary" />
              <span className="text-foreground"><strong>Compras:</strong> Gestiona proveedores y órdenes de compra</span>
            </li>
            <li className="flex items-center gap-2">
              <div className="h-1.5 w-1.5 rounded-full bg-primary" />
              <span className="text-foreground"><strong>RRHH:</strong> Administra tu equipo</span>
            </li>
            <li className="flex items-center gap-2">
              <div className="h-1.5 w-1.5 rounded-full bg-primary" />
              <span className="text-foreground"><strong>Finanzas:</strong> Reportes y análisis contable</span>
            </li>
          </ul>
          <p className="text-sm text-muted-foreground pt-4">
            Comienza navegando por los módulos usando el menú lateral.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}