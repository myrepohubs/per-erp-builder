export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      asistencias: {
        Row: {
          created_at: string
          empleado_id: string
          fecha: string
          hora_entrada: string | null
          hora_salida: string | null
          id: string
          notas: string | null
          tipo: Database["public"]["Enums"]["tipo_asistencia"]
          user_id: string
        }
        Insert: {
          created_at?: string
          empleado_id: string
          fecha?: string
          hora_entrada?: string | null
          hora_salida?: string | null
          id?: string
          notas?: string | null
          tipo?: Database["public"]["Enums"]["tipo_asistencia"]
          user_id: string
        }
        Update: {
          created_at?: string
          empleado_id?: string
          fecha?: string
          hora_entrada?: string | null
          hora_salida?: string | null
          id?: string
          notas?: string | null
          tipo?: Database["public"]["Enums"]["tipo_asistencia"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "asistencias_empleado_id_fkey"
            columns: ["empleado_id"]
            isOneToOne: false
            referencedRelation: "empleados"
            referencedColumns: ["id"]
          },
        ]
      }
      categorias: {
        Row: {
          created_at: string
          descripcion: string | null
          id: string
          nombre: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          descripcion?: string | null
          id?: string
          nombre: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          descripcion?: string | null
          id?: string
          nombre?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      clientes: {
        Row: {
          created_at: string
          direccion: string | null
          email: string | null
          id: string
          razon_social: string
          ruc: string
          telefono: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          direccion?: string | null
          email?: string | null
          id?: string
          razon_social: string
          ruc: string
          telefono?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          direccion?: string | null
          email?: string | null
          id?: string
          razon_social?: string
          ruc?: string
          telefono?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      cotizaciones: {
        Row: {
          cliente_id: string | null
          created_at: string
          estado: Database["public"]["Enums"]["estado_documento"]
          fecha_emision: string
          fecha_vencimiento: string | null
          id: string
          igv: number
          notas: string | null
          numero_cotizacion: string
          subtotal: number
          total: number
          updated_at: string
          user_id: string
        }
        Insert: {
          cliente_id?: string | null
          created_at?: string
          estado?: Database["public"]["Enums"]["estado_documento"]
          fecha_emision?: string
          fecha_vencimiento?: string | null
          id?: string
          igv?: number
          notas?: string | null
          numero_cotizacion: string
          subtotal?: number
          total?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          cliente_id?: string | null
          created_at?: string
          estado?: Database["public"]["Enums"]["estado_documento"]
          fecha_emision?: string
          fecha_vencimiento?: string | null
          id?: string
          igv?: number
          notas?: string | null
          numero_cotizacion?: string
          subtotal?: number
          total?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "cotizaciones_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "clientes"
            referencedColumns: ["id"]
          },
        ]
      }
      departamentos: {
        Row: {
          created_at: string
          descripcion: string | null
          id: string
          nombre: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          descripcion?: string | null
          id?: string
          nombre: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          descripcion?: string | null
          id?: string
          nombre?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      empleados: {
        Row: {
          activo: boolean | null
          apellidos: string
          cargo: string
          created_at: string
          departamento_id: string | null
          direccion: string | null
          dni: string
          email: string | null
          fecha_ingreso: string
          fecha_nacimiento: string | null
          id: string
          nombres: string
          salario: number | null
          telefono: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          activo?: boolean | null
          apellidos: string
          cargo: string
          created_at?: string
          departamento_id?: string | null
          direccion?: string | null
          dni: string
          email?: string | null
          fecha_ingreso?: string
          fecha_nacimiento?: string | null
          id?: string
          nombres: string
          salario?: number | null
          telefono?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          activo?: boolean | null
          apellidos?: string
          cargo?: string
          created_at?: string
          departamento_id?: string | null
          direccion?: string | null
          dni?: string
          email?: string | null
          fecha_ingreso?: string
          fecha_nacimiento?: string | null
          id?: string
          nombres?: string
          salario?: number | null
          telefono?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "empleados_departamento_id_fkey"
            columns: ["departamento_id"]
            isOneToOne: false
            referencedRelation: "departamentos"
            referencedColumns: ["id"]
          },
        ]
      }
      facturas: {
        Row: {
          cliente_id: string | null
          created_at: string
          estado: Database["public"]["Enums"]["estado_factura"]
          fecha_emision: string
          fecha_vencimiento: string | null
          id: string
          igv: number
          monto_pagado: number
          notas: string | null
          numero_factura: string
          pedido_id: string | null
          serie: string
          subtotal: number
          total: number
          updated_at: string
          user_id: string
        }
        Insert: {
          cliente_id?: string | null
          created_at?: string
          estado?: Database["public"]["Enums"]["estado_factura"]
          fecha_emision?: string
          fecha_vencimiento?: string | null
          id?: string
          igv?: number
          monto_pagado?: number
          notas?: string | null
          numero_factura: string
          pedido_id?: string | null
          serie?: string
          subtotal?: number
          total?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          cliente_id?: string | null
          created_at?: string
          estado?: Database["public"]["Enums"]["estado_factura"]
          fecha_emision?: string
          fecha_vencimiento?: string | null
          id?: string
          igv?: number
          monto_pagado?: number
          notas?: string | null
          numero_factura?: string
          pedido_id?: string | null
          serie?: string
          subtotal?: number
          total?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "facturas_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "clientes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "facturas_pedido_id_fkey"
            columns: ["pedido_id"]
            isOneToOne: false
            referencedRelation: "pedidos"
            referencedColumns: ["id"]
          },
        ]
      }
      items_cotizacion: {
        Row: {
          cantidad: number
          cotizacion_id: string
          created_at: string
          descripcion: string
          id: string
          precio_unitario: number
          subtotal: number
        }
        Insert: {
          cantidad?: number
          cotizacion_id: string
          created_at?: string
          descripcion: string
          id?: string
          precio_unitario?: number
          subtotal?: number
        }
        Update: {
          cantidad?: number
          cotizacion_id?: string
          created_at?: string
          descripcion?: string
          id?: string
          precio_unitario?: number
          subtotal?: number
        }
        Relationships: [
          {
            foreignKeyName: "items_cotizacion_cotizacion_id_fkey"
            columns: ["cotizacion_id"]
            isOneToOne: false
            referencedRelation: "cotizaciones"
            referencedColumns: ["id"]
          },
        ]
      }
      items_factura: {
        Row: {
          cantidad: number
          created_at: string
          descripcion: string
          factura_id: string
          id: string
          precio_unitario: number
          subtotal: number
        }
        Insert: {
          cantidad?: number
          created_at?: string
          descripcion: string
          factura_id: string
          id?: string
          precio_unitario?: number
          subtotal?: number
        }
        Update: {
          cantidad?: number
          created_at?: string
          descripcion?: string
          factura_id?: string
          id?: string
          precio_unitario?: number
          subtotal?: number
        }
        Relationships: [
          {
            foreignKeyName: "items_factura_factura_id_fkey"
            columns: ["factura_id"]
            isOneToOne: false
            referencedRelation: "facturas"
            referencedColumns: ["id"]
          },
        ]
      }
      items_orden_compra: {
        Row: {
          cantidad: number
          created_at: string
          descripcion: string
          id: string
          orden_compra_id: string
          precio_unitario: number
          subtotal: number
        }
        Insert: {
          cantidad?: number
          created_at?: string
          descripcion: string
          id?: string
          orden_compra_id: string
          precio_unitario?: number
          subtotal?: number
        }
        Update: {
          cantidad?: number
          created_at?: string
          descripcion?: string
          id?: string
          orden_compra_id?: string
          precio_unitario?: number
          subtotal?: number
        }
        Relationships: [
          {
            foreignKeyName: "items_orden_compra_orden_compra_id_fkey"
            columns: ["orden_compra_id"]
            isOneToOne: false
            referencedRelation: "ordenes_compra"
            referencedColumns: ["id"]
          },
        ]
      }
      items_pedido: {
        Row: {
          cantidad: number
          created_at: string
          descripcion: string
          id: string
          pedido_id: string
          precio_unitario: number
          subtotal: number
        }
        Insert: {
          cantidad?: number
          created_at?: string
          descripcion: string
          id?: string
          pedido_id: string
          precio_unitario?: number
          subtotal?: number
        }
        Update: {
          cantidad?: number
          created_at?: string
          descripcion?: string
          id?: string
          pedido_id?: string
          precio_unitario?: number
          subtotal?: number
        }
        Relationships: [
          {
            foreignKeyName: "items_pedido_pedido_id_fkey"
            columns: ["pedido_id"]
            isOneToOne: false
            referencedRelation: "pedidos"
            referencedColumns: ["id"]
          },
        ]
      }
      movimientos_inventario: {
        Row: {
          cantidad: number
          created_at: string
          id: string
          notas: string | null
          producto_id: string
          referencia: string | null
          stock_anterior: number
          stock_nuevo: number
          tipo: Database["public"]["Enums"]["tipo_movimiento"]
          user_id: string
        }
        Insert: {
          cantidad: number
          created_at?: string
          id?: string
          notas?: string | null
          producto_id: string
          referencia?: string | null
          stock_anterior: number
          stock_nuevo: number
          tipo: Database["public"]["Enums"]["tipo_movimiento"]
          user_id: string
        }
        Update: {
          cantidad?: number
          created_at?: string
          id?: string
          notas?: string | null
          producto_id?: string
          referencia?: string | null
          stock_anterior?: number
          stock_nuevo?: number
          tipo?: Database["public"]["Enums"]["tipo_movimiento"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "movimientos_inventario_producto_id_fkey"
            columns: ["producto_id"]
            isOneToOne: false
            referencedRelation: "productos"
            referencedColumns: ["id"]
          },
        ]
      }
      oportunidades: {
        Row: {
          cliente_asociado: string | null
          created_at: string
          empresa_potencial: string
          estado: Database["public"]["Enums"]["estado_oportunidad"]
          fecha_cierre_estimada: string | null
          id: string
          nombre_contacto: string
          notas: string | null
          updated_at: string
          user_id: string
          valor_estimado: number | null
        }
        Insert: {
          cliente_asociado?: string | null
          created_at?: string
          empresa_potencial: string
          estado?: Database["public"]["Enums"]["estado_oportunidad"]
          fecha_cierre_estimada?: string | null
          id?: string
          nombre_contacto: string
          notas?: string | null
          updated_at?: string
          user_id: string
          valor_estimado?: number | null
        }
        Update: {
          cliente_asociado?: string | null
          created_at?: string
          empresa_potencial?: string
          estado?: Database["public"]["Enums"]["estado_oportunidad"]
          fecha_cierre_estimada?: string | null
          id?: string
          nombre_contacto?: string
          notas?: string | null
          updated_at?: string
          user_id?: string
          valor_estimado?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "oportunidades_cliente_asociado_fkey"
            columns: ["cliente_asociado"]
            isOneToOne: false
            referencedRelation: "clientes"
            referencedColumns: ["id"]
          },
        ]
      }
      ordenes_compra: {
        Row: {
          created_at: string
          estado: Database["public"]["Enums"]["estado_documento"]
          fecha_entrega_esperada: string | null
          fecha_orden: string
          id: string
          igv: number
          notas: string | null
          numero_orden: string
          proveedor_id: string | null
          subtotal: number
          total: number
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          estado?: Database["public"]["Enums"]["estado_documento"]
          fecha_entrega_esperada?: string | null
          fecha_orden?: string
          id?: string
          igv?: number
          notas?: string | null
          numero_orden: string
          proveedor_id?: string | null
          subtotal?: number
          total?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          estado?: Database["public"]["Enums"]["estado_documento"]
          fecha_entrega_esperada?: string | null
          fecha_orden?: string
          id?: string
          igv?: number
          notas?: string | null
          numero_orden?: string
          proveedor_id?: string | null
          subtotal?: number
          total?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ordenes_compra_proveedor_id_fkey"
            columns: ["proveedor_id"]
            isOneToOne: false
            referencedRelation: "proveedores"
            referencedColumns: ["id"]
          },
        ]
      }
      pedidos: {
        Row: {
          cliente_id: string | null
          cotizacion_id: string | null
          created_at: string
          estado: Database["public"]["Enums"]["estado_documento"]
          fecha_entrega_estimada: string | null
          fecha_pedido: string
          id: string
          igv: number
          notas: string | null
          numero_pedido: string
          subtotal: number
          total: number
          updated_at: string
          user_id: string
        }
        Insert: {
          cliente_id?: string | null
          cotizacion_id?: string | null
          created_at?: string
          estado?: Database["public"]["Enums"]["estado_documento"]
          fecha_entrega_estimada?: string | null
          fecha_pedido?: string
          id?: string
          igv?: number
          notas?: string | null
          numero_pedido: string
          subtotal?: number
          total?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          cliente_id?: string | null
          cotizacion_id?: string | null
          created_at?: string
          estado?: Database["public"]["Enums"]["estado_documento"]
          fecha_entrega_estimada?: string | null
          fecha_pedido?: string
          id?: string
          igv?: number
          notas?: string | null
          numero_pedido?: string
          subtotal?: number
          total?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "pedidos_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "clientes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pedidos_cotizacion_id_fkey"
            columns: ["cotizacion_id"]
            isOneToOne: false
            referencedRelation: "cotizaciones"
            referencedColumns: ["id"]
          },
        ]
      }
      productos: {
        Row: {
          activo: boolean | null
          categoria_id: string | null
          codigo_barras: string | null
          created_at: string
          descripcion: string | null
          id: string
          nombre: string
          precio_compra: number | null
          precio_venta: number | null
          sku: string
          stock_actual: number | null
          stock_maximo: number | null
          stock_minimo: number | null
          unidad_medida: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          activo?: boolean | null
          categoria_id?: string | null
          codigo_barras?: string | null
          created_at?: string
          descripcion?: string | null
          id?: string
          nombre: string
          precio_compra?: number | null
          precio_venta?: number | null
          sku: string
          stock_actual?: number | null
          stock_maximo?: number | null
          stock_minimo?: number | null
          unidad_medida?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          activo?: boolean | null
          categoria_id?: string | null
          codigo_barras?: string | null
          created_at?: string
          descripcion?: string | null
          id?: string
          nombre?: string
          precio_compra?: number | null
          precio_venta?: number | null
          sku?: string
          stock_actual?: number | null
          stock_maximo?: number | null
          stock_minimo?: number | null
          unidad_medida?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "productos_categoria_id_fkey"
            columns: ["categoria_id"]
            isOneToOne: false
            referencedRelation: "categorias"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          apellidos: string
          created_at: string | null
          empresa: string | null
          id: string
          nombres: string
          rol: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          apellidos: string
          created_at?: string | null
          empresa?: string | null
          id?: string
          nombres: string
          rol?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          apellidos?: string
          created_at?: string | null
          empresa?: string | null
          id?: string
          nombres?: string
          rol?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      proveedores: {
        Row: {
          contacto: string | null
          created_at: string
          direccion: string | null
          email: string | null
          id: string
          razon_social: string
          ruc: string
          telefono: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          contacto?: string | null
          created_at?: string
          direccion?: string | null
          email?: string | null
          id?: string
          razon_social: string
          ruc: string
          telefono?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          contacto?: string | null
          created_at?: string
          direccion?: string | null
          email?: string | null
          id?: string
          razon_social?: string
          ruc?: string
          telefono?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      vacaciones: {
        Row: {
          created_at: string
          dias_totales: number
          empleado_id: string
          estado: Database["public"]["Enums"]["estado_vacacion"]
          fecha_fin: string
          fecha_inicio: string
          id: string
          motivo: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          dias_totales: number
          empleado_id: string
          estado?: Database["public"]["Enums"]["estado_vacacion"]
          fecha_fin: string
          fecha_inicio: string
          id?: string
          motivo?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          dias_totales?: number
          empleado_id?: string
          estado?: Database["public"]["Enums"]["estado_vacacion"]
          fecha_fin?: string
          fecha_inicio?: string
          id?: string
          motivo?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "vacaciones_empleado_id_fkey"
            columns: ["empleado_id"]
            isOneToOne: false
            referencedRelation: "empleados"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      estado_documento:
        | "Borrador"
        | "Enviado"
        | "Aprobado"
        | "Rechazado"
        | "Cancelado"
      estado_factura:
        | "Borrador"
        | "Emitida"
        | "Pagada"
        | "Vencida"
        | "Cancelada"
      estado_oportunidad:
        | "Nuevo"
        | "Contactado"
        | "Propuesta Enviada"
        | "Negociación"
        | "Ganado"
        | "Perdido"
      estado_vacacion: "Pendiente" | "Aprobado" | "Rechazado"
      tipo_asistencia: "Presente" | "Ausente" | "Tardanza" | "Permiso"
      tipo_movimiento: "Entrada" | "Salida" | "Ajuste"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      estado_documento: [
        "Borrador",
        "Enviado",
        "Aprobado",
        "Rechazado",
        "Cancelado",
      ],
      estado_factura: ["Borrador", "Emitida", "Pagada", "Vencida", "Cancelada"],
      estado_oportunidad: [
        "Nuevo",
        "Contactado",
        "Propuesta Enviada",
        "Negociación",
        "Ganado",
        "Perdido",
      ],
      estado_vacacion: ["Pendiente", "Aprobado", "Rechazado"],
      tipo_asistencia: ["Presente", "Ausente", "Tardanza", "Permiso"],
      tipo_movimiento: ["Entrada", "Salida", "Ajuste"],
    },
  },
} as const
