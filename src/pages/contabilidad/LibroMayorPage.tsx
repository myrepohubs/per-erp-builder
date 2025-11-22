import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { format } from "date-fns";
import { es } from "date-fns/locale";

export default function LibroMayorPage() {
  const [fechaInicio, setFechaInicio] = useState(format(new Date(new Date().getFullYear(), 0, 1), "yyyy-MM-dd"));
  const [fechaFin, setFechaFin] = useState(format(new Date(), "yyyy-MM-dd"));
  const [cuentaSeleccionada, setCuentaSeleccionada] = useState<string>("");

  const { data: cuentas = [] } = useQuery({
    queryKey: ["cuentas_contables"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("No user found");

      const { data, error } = await supabase
        .from("cuentas_contables")
        .select("*")
        .eq("user_id", user.id)
        .eq("activa", true)
        .order("codigo", { ascending: true });

      if (error) throw error;
      return data || [];
    },
  });

  const { data: movimientos = [], isLoading } = useQuery({
    queryKey: ["libro_mayor", cuentaSeleccionada, fechaInicio, fechaFin],
    queryFn: async () => {
      if (!cuentaSeleccionada) return [];

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("No user found");

      const { data: detallesData, error: detallesError } = await supabase
        .from("detalles_asiento")
        .select(`
          *,
          asientos_contables!inner(
            numero_asiento,
            fecha,
            glosa,
            tipo,
            user_id
          )
        `)
        .eq("cuenta_id", cuentaSeleccionada)
        .eq("asientos_contables.user_id", user.id)
        .gte("asientos_contables.fecha", fechaInicio)
        .lte("asientos_contables.fecha", fechaFin)
        .order("asientos_contables(fecha)", { ascending: true });

      if (detallesError) throw detallesError;

      return detallesData || [];
    },
    enabled: !!cuentaSeleccionada,
  });

  let saldo = 0;
  const movimientosConSaldo = movimientos.map((mov: any) => {
    const movimiento = Number(mov.debe) - Number(mov.haber);
    saldo += movimiento;
    return {
      ...mov,
      saldo
    };
  });

  const cuentaActual = cuentas.find(c => c.id === cuentaSeleccionada);
  const totalDebe = movimientos.reduce((sum, m: any) => sum + Number(m.debe), 0);
  const totalHaber = movimientos.reduce((sum, m: any) => sum + Number(m.haber), 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Libro Mayor</h1>
        <p className="text-muted-foreground">Movimientos por cuenta contable</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Filtros</CardTitle>
          <div className="grid grid-cols-3 gap-4 pt-4">
            <div className="grid gap-2">
              <Label htmlFor="cuenta">Cuenta</Label>
              <Select value={cuentaSeleccionada} onValueChange={setCuentaSeleccionada}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccione una cuenta..." />
                </SelectTrigger>
                <SelectContent>
                  {cuentas.map((cuenta) => (
                    <SelectItem key={cuenta.id} value={cuenta.id}>
                      {cuenta.codigo} - {cuenta.nombre}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
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

      {cuentaSeleccionada && (
        <Card>
          <CardHeader>
            <CardTitle>
              {cuentaActual?.codigo} - {cuentaActual?.nombre}
            </CardTitle>
            <CardDescription>
              Período: {format(new Date(fechaInicio), "dd 'de' MMMM 'de' yyyy", { locale: es })} - {format(new Date(fechaFin), "dd 'de' MMMM 'de' yyyy", { locale: es })}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-8 text-muted-foreground">Cargando movimientos...</div>
            ) : movimientos.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No hay movimientos en el período seleccionado
              </div>
            ) : (
              <>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Fecha</TableHead>
                      <TableHead>Asiento</TableHead>
                      <TableHead>Glosa</TableHead>
                      <TableHead className="text-right">Debe</TableHead>
                      <TableHead className="text-right">Haber</TableHead>
                      <TableHead className="text-right">Saldo</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {movimientosConSaldo.map((mov: any) => (
                      <TableRow key={mov.id}>
                        <TableCell>
                          {format(new Date(mov.asientos_contables.fecha), "dd/MM/yyyy")}
                        </TableCell>
                        <TableCell className="font-medium">
                          {mov.asientos_contables.numero_asiento}
                        </TableCell>
                        <TableCell className="max-w-xs truncate">
                          {mov.glosa || mov.asientos_contables.glosa}
                        </TableCell>
                        <TableCell className="text-right">
                          {Number(mov.debe) > 0 ? `S/. ${Number(mov.debe).toFixed(2)}` : '-'}
                        </TableCell>
                        <TableCell className="text-right">
                          {Number(mov.haber) > 0 ? `S/. ${Number(mov.haber).toFixed(2)}` : '-'}
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          S/. {mov.saldo.toFixed(2)}
                        </TableCell>
                      </TableRow>
                    ))}
                    <TableRow className="font-bold bg-muted">
                      <TableCell colSpan={3} className="text-right">TOTALES:</TableCell>
                      <TableCell className="text-right">S/. {totalDebe.toFixed(2)}</TableCell>
                      <TableCell className="text-right">S/. {totalHaber.toFixed(2)}</TableCell>
                      <TableCell className="text-right">S/. {saldo.toFixed(2)}</TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
