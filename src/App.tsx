import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { MainLayout } from "./components/MainLayout";
import LoginPage from "./pages/LoginPage";
import DashboardPage from "./pages/DashboardPage";
import ClientesPage from "./pages/ClientesPage";
import OportunidadesPage from "./pages/OportunidadesPage";
import PlaceholderPage from "./pages/PlaceholderPage";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            {/* Public routes */}
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/login" element={<LoginPage />} />

            {/* Protected routes with layout */}
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <MainLayout>
                    <DashboardPage />
                  </MainLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/crm/clientes"
              element={
                <ProtectedRoute>
                  <MainLayout>
                    <ClientesPage />
                  </MainLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/crm/oportunidades"
              element={
                <ProtectedRoute>
                  <MainLayout>
                    <OportunidadesPage />
                  </MainLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/crm"
              element={
                <ProtectedRoute>
                  <MainLayout>
                    <PlaceholderPage 
                      title="CRM" 
                      description="Gestión de Clientes y Oportunidades"
                    />
                  </MainLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/ventas"
              element={
                <ProtectedRoute>
                  <MainLayout>
                    <PlaceholderPage 
                      title="Ventas" 
                      description="Facturación y Cuentas por Cobrar"
                    />
                  </MainLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/compras"
              element={
                <ProtectedRoute>
                  <MainLayout>
                    <PlaceholderPage 
                      title="Compras" 
                      description="Órdenes de Compra y Proveedores"
                    />
                  </MainLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/inventario"
              element={
                <ProtectedRoute>
                  <MainLayout>
                    <PlaceholderPage 
                      title="Inventario" 
                      description="Control y Gestión de Stock"
                    />
                  </MainLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/rrhh"
              element={
                <ProtectedRoute>
                  <MainLayout>
                    <PlaceholderPage 
                      title="RRHH" 
                      description="Gestión de Recursos Humanos"
                    />
                  </MainLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/finanzas"
              element={
                <ProtectedRoute>
                  <MainLayout>
                    <PlaceholderPage 
                      title="Finanzas" 
                      description="Reportes y Análisis Contable"
                    />
                  </MainLayout>
                </ProtectedRoute>
              }
            />

            {/* 404 */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
