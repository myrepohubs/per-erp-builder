import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { format } from "date-fns";
import { es } from "date-fns/locale";

export default function LibroDiarioPage() {
  const [fechaInicio, setFechaInicio] = useState(format(new Date(new Date().getFullYear(), 0, 1), "yyyy-MM-dd"));
  const [fechaFin, setFechaFin] = useState(format(new Date(), "yyyy-MM-dd"));

  const { data: asientos = [], isLoading } = useQuery({
    queryKey: ["libro_diario", fechaInicio, fechaFin],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("No user found");

      const { data: asientosData, error: asientosError } = await supabase
        .from("asientos_contables")
        .select("*")
        .eq("user_id", user.id)
        .gte("fecha", fechaInicio)
        .lte("fecha", fechaFin)
        .order("fecha", { ascending: true })
        .order("numero_asiento", { ascending: true });

      if (asientosError) throw asientosError;

      const asientosConDetalles = await Promise.all(
        (asientosData || []).map(async (asiento) => {
          const { data: detallesData, error: detallesError } = await supabase
            .from("detalles_asiento")
            .select(`
              *,
              cuentas_contables(codigo, nombre)
            `)
            .eq("asiento_id", asiento.id);

          if (detallesError) throw detallesError;

          return {
            ...asiento,
            detalles: detallesData || []
          };
        })
      );

      return asientosConDetalles;
    },
  });

  const totalDebe = asientos.reduce((sum, asiento) => 
    sum + asiento.detalles.reduce((s: number, d: any) => s + Number(d.debe), 0), 0
  );

  const totalHaber = asientos.reduce((sum, asiento) => 
    sum + asiento.detalles.reduce((s: number, d: any) => s + Number(d.haber), 0), 0
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Libro Diario</h1>
        <p className="text-muted-foreground">Registro cronológico de asientos contables</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Filtros</CardTitle>
          <div className="grid grid-cols-2 gap-4 pt-4">
            <div className="grid gap-2">
              <Label htmlFor="fecha_inicio">Fecha Inicio</Label>
              <Input
                id="fecha_inicio"
                type="date"
                value={fechaInicio}
                onChange={(e) => setFechaInicio(e.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="fecha_fin">Fecha Fin</Label>
              <Input
                id="fecha_fin"
                type="date"
                value={fechaFin}
                onChange={(e) => setFechaFin(e.target.value)}
              />
            </div>
          </div>
        </CardHeader>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Libro Diario</CardTitle>
          <CardDescription>
            Período: {format(new Date(fechaInicio), "dd 'de' MMMM 'de' yyyy", { locale: es })} - {format(new Date(fechaFin), "dd 'de' MMMM 'de' yyyy", { locale: es })}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">Cargando libro diario...</div>
          ) : asientos.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No hay asientos en el período seleccionado
            </div>
          ) : (
            <div className="space-y-6">
              {asientos.map((asiento) => (
                <div key={asiento.id} className="border rounded-lg p-4">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="font-semibold text-lg">Asiento N° {asiento.numero_asiento}</h3>
                      <p className="text-sm text-muted-foreground">
                        {format(new Date(asiento.fecha), "dd 'de' MMMM 'de' yyyy", { locale: es })} - {asiento.tipo}
                      </p>
                      <p className="text-sm mt-1">{asiento.glosa}</p>
                    </div>
                    <span className={`px-2 py-1 rounded text-xs ${
                      asiento.estado === 'Contabilizado' ? 'bg-green-100 text-green-800' :
                      asiento.estado === 'Anulado' ? 'bg-red-100 text-red-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {asiento.estado}
                    </span>
                  </div>
                  
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Código</TableHead>
                        <TableHead>Cuenta</TableHead>
                        <TableHead className="text-right">Debe</TableHead>
                        <TableHead className="text-right">Haber</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {asiento.detalles.map((detalle: any) => (
                        <TableRow key={detalle.id}>
                          <TableCell className="font-medium">{detalle.cuentas_contables.codigo}</TableCell>
                          <TableCell>{detalle.cuentas_contables.nombre}</TableCell>
                          <TableCell className="text-right">
                            {Number(detalle.debe) > 0 ? `S/. ${Number(detalle.debe).toFixed(2)}` : '-'}
                          </TableCell>
                          <TableCell className="text-right">
                            {Number(detalle.haber) > 0 ? `S/. ${Number(detalle.haber).toFixed(2)}` : '-'}
                          </TableCell>
                        </TableRow>
                      ))}
                      <TableRow className="font-bold bg-muted">
                        <TableCell colSpan={2} className="text-right">TOTALES:</TableCell>
                        <TableCell className="text-right">
                          S/. {asiento.detalles.reduce((s: number, d: any) => s + Number(d.debe), 0).toFixed(2)}
                        </TableCell>
                        <TableCell className="text-right">
                          S/. {asiento.detalles.reduce((s: number, d: any) => s + Number(d.haber), 0).toFixed(2)}
                        </TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </div>
              ))}

              <div className="border-t-2 pt-4">
                <Table>
                  <TableBody>
                    <TableRow className="font-bold text-lg">
                      <TableCell colSpan={2} className="text-right">TOTALES DEL PERÍODO:</TableCell>
                      <TableCell className="text-right">S/. {totalDebe.toFixed(2)}</TableCell>
                      <TableCell className="text-right">S/. {totalHaber.toFixed(2)}</TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
