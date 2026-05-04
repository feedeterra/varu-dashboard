export interface Cliente {
  id_cliente: number
  razon_social: string
  celular: string
  localidad: string
  activo: boolean
  fecha_ingreso: string
}

export interface Articulo {
  id_articulo: number
  nombre: string
  precio_costo: number
  porcentaje_ganancia: number
  iva: number
  stock_disponible: number
  stock_minimo: number
  activo: boolean
}

export interface Venta {
  id_movimiento: number
  id_principal: number
  id_cliente: number
  id_articulo: number
  fecha: string
  cantidad: number
  precio_venta: number
  precio_costo: number
  forma_pago: string
  clientes?: { razon_social: string }
  articulos?: { nombre: string }
}

export interface MovimientoCC {
  id_movimiento: number
  id_cliente: number
  fecha: string
  id_tipo_movimiento: number
  importe_unitario: number
  importe_abonado: number
  cantidad: number
  activo: boolean
}

export interface Envio {
  id: number
  id_cliente: number
  id_articulo: number | null
  comisionista: string
  direccion: string
  estado: 'preparando' | 'enviado' | 'entregado' | 'devuelto'
  nota: string | null
  created_at: string
  updated_at: string
  clientes?: { razon_social: string; celular: string }
  articulos?: { nombre: string }
}

export type UserRole = 'admin' | 'encargado'
