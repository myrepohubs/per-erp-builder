import { 
  Home, 
  Users, 
  ShoppingCart, 
  Package, 
  ClipboardList, 
  UserCircle, 
  BarChart3,
  LogOut,
  Building2,
  TrendingUp,
  FileText,
  Receipt,
  BookOpen,
  DollarSign,
  Store,
  Shield
} from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { useAuth } from "@/contexts/AuthContext";
import { useUserRole } from "@/hooks/useUserRole";
import { Button } from "@/components/ui/button";

const menuItems = [
  { to: "/dashboard", icon: Home, label: "Dashboard" },
  { to: "/pos", icon: Store, label: "Punto de Venta" },
  { to: "/crm/clientes", icon: Users, label: "Clientes", group: "CRM" },
  { to: "/crm/oportunidades", icon: TrendingUp, label: "Oportunidades", group: "CRM" },
  { to: "/ventas/cotizaciones", icon: FileText, label: "Cotizaciones", group: "Ventas" },
  { to: "/ventas/pedidos", icon: ShoppingCart, label: "Pedidos", group: "Ventas" },
  { to: "/ventas/facturas", icon: Receipt, label: "Facturas", group: "Ventas" },
  { to: "/compras/proveedores", icon: Building2, label: "Proveedores", group: "Compras" },
  { to: "/compras/ordenes", icon: ClipboardList, label: "Órdenes de Compra", group: "Compras" },
  { to: "/inventario", icon: Package, label: "Inventario", group: "Inventario" },
  { to: "/rrhh/departamentos", icon: Building2, label: "Departamentos", group: "RRHH" },
  { to: "/rrhh/empleados", icon: Users, label: "Empleados", group: "RRHH" },
  { to: "/rrhh/asistencias", icon: ClipboardList, label: "Asistencias", group: "RRHH" },
  { to: "/rrhh/vacaciones", icon: UserCircle, label: "Vacaciones", group: "RRHH" },
  { to: "/contabilidad/cuentas", icon: DollarSign, label: "Plan de Cuentas", group: "Contabilidad" },
  { to: "/contabilidad/asientos", icon: FileText, label: "Asientos Contables", group: "Contabilidad" },
  { to: "/contabilidad/libro-diario", icon: BookOpen, label: "Libro Diario", group: "Contabilidad" },
  { to: "/contabilidad/libro-mayor", icon: BookOpen, label: "Libro Mayor", group: "Contabilidad" },
  { to: "/finanzas", icon: BarChart3, label: "Reportes Financieros", group: "Contabilidad" },
];

export function Sidebar() {
  const { signOut } = useAuth();
  const { isAdmin } = useUserRole();

  const allMenuItems = [
    ...menuItems,
    ...(isAdmin ? [{ to: "/usuarios", icon: Shield, label: "Gestión de Usuarios", group: "Administración" }] : []),
  ];

  return (
    <aside className="fixed left-0 top-0 z-40 h-screen w-64 bg-sidebar text-sidebar-foreground shadow-lg">
      <div className="flex h-full flex-col">
        {/* Logo */}
        <div className="flex items-center gap-3 border-b border-sidebar-border px-6 py-5">
          <Building2 className="h-8 w-8 text-sidebar-primary" />
          <div>
            <h1 className="text-lg font-bold text-sidebar-foreground">ERP PYME</h1>
            <p className="text-xs text-sidebar-foreground/60">Sistema de Gestión</p>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
          {allMenuItems.map((item, index) => {
            const showGroupHeader = item.group && (!allMenuItems[index - 1] || allMenuItems[index - 1].group !== item.group);
            
            return (
              <div key={item.to}>
                {showGroupHeader && (
                  <div className="px-3 py-2 text-xs font-semibold text-sidebar-foreground/60 uppercase tracking-wider">
                    {item.group}
                  </div>
                )}
                <NavLink
                  to={item.to}
                  className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-sidebar-foreground/80 transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                  activeClassName="bg-sidebar-accent text-sidebar-accent-foreground font-semibold"
                >
                  <item.icon className="h-5 w-5" />
                  <span>{item.label}</span>
                </NavLink>
              </div>
            );
          })}
        </nav>

        {/* User section */}
        <div className="border-t border-sidebar-border p-4">
          <Button
            onClick={signOut}
            variant="ghost"
            className="w-full justify-start gap-3 text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
          >
            <LogOut className="h-5 w-5" />
            <span>Cerrar Sesión</span>
          </Button>
        </div>
      </div>
    </aside>
  );
}