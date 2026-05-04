/* eslint-disable @typescript-eslint/no-explicit-any */
import { createClient } from '@/lib/supabase/server'
import { EnvioForm } from './EnvioForm'
import { EnviosList } from './EnviosList'

export default async function EnviosPage() {
  const supabase = await createClient()

  const [{ data: clientes }, { data: articulos }, { data: envios }] = await Promise.all([
    supabase
      .from('clientes')
      .select('id_cliente, razon_social, celular, localidad, activo, fecha_ingreso')
      .eq('activo', true)
      .order('razon_social'),
    supabase
      .from('articulos')
      .select('id_articulo, nombre, precio_costo, porcentaje_ganancia, iva, stock_disponible, stock_minimo, activo')
      .eq('activo', true)
      .order('nombre'),
    supabase
      .from('envios')
      .select('*, clientes(razon_social, celular), articulos(nombre)')
      .order('created_at', { ascending: false })
      .limit(200),
  ])

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Envíos</h1>
          <p className="text-[#555] text-sm mt-1">{envios?.length ?? 0} envíos registrados</p>
        </div>
        <EnvioForm clientes={clientes ?? []} articulos={articulos ?? []} />
      </div>

      <EnviosList envios={(envios ?? []) as any} />
    </div>
  )
}
