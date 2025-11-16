import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Construction } from "lucide-react";

interface PlaceholderPageProps {
  title: string;
  description: string;
}

export default function PlaceholderPage({ title, description }: PlaceholderPageProps) {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">{title}</h1>
        <p className="text-muted-foreground">{description}</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Construction className="h-5 w-5 text-primary" />
            Módulo en Construcción
          </CardTitle>
          <CardDescription>
            Este módulo será implementado en las siguientes fases del tutorial
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            La funcionalidad de <strong>{title}</strong> estará disponible próximamente.
            Estamos construyendo cada módulo paso a paso para crear un sistema ERP completo
            y robusto para tu PYME.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}