import { createServiceClient } from '@/lib/supabase/server'
import { DeudoresList } from './DeudoresList'

export default async function DeudoresPage() {
  const supabase = await createServiceClient()

  const [{ data: clientes }, { data: movimientos }] = await Promise.all([
    supabase
      .from('clientes')
      .select('id_cliente, razon_social, celular')
      .eq('activo', 1),
    supabase
      .from('movimientos_cc')
      .select('id_cliente, id_tipo_movimiento, importe_unitario, importe_abonado, cantidad, fecha')
      .eq('activo', 1)
      .order('fecha', { ascending: false }),
  ])

  // Calcular saldo por cliente
  const saldoMap = new Map<number, number>()
  const ultimoMovMap = new Map<number, string>()
  const tuvoPagoMap = new Map<number, boolean>()

  for (const m of movimientos ?? []) {
    const cid = m.id_cliente
    const prev = saldoMap.get(cid) ?? 0

    if (m.id_tipo_movimiento === 2) {
      // deuda
      saldoMap.set(cid, prev + (m.importe_unitario ?? 0) * (m.cantidad ?? 1))
    } else if (m.id_tipo_movimiento === 3) {
      // pago
      saldoMap.set(cid, prev - (m.importe_abonado ?? 0))
      tuvoPagoMap.set(cid, true)
    }

    // Último movimiento (ya ordenado desc)
    if (!ultimoMovMap.has(cid)) {
      ultimoMovMap.set(cid, m.fecha?.split('T')[0] ?? '')
    }
  }

  const hoy = new Date()
  const hace30 = new Date(hoy)
  hace30.setDate(hace30.getDate() - 30)

  const deudores = (clientes ?? [])
    .filter(c => (saldoMap.get(c.id_cliente) ?? 0) > 0)
    .map(c => {
      const saldo = saldoMap.get(c.id_cliente) ?? 0
      const ultimoMov = ultimoMovMap.get(c.id_cliente) ?? null
      const tuvoPago = tuvoPagoMap.get(c.id_cliente) ?? false

      let estado: 'nunca_pago' | 'inactivo' | 'activo'
      if (!tuvoPago) {
        estado = 'nunca_pago'
      } else if (ultimoMov && new Date(ultimoMov) < hace30) {
        estado = 'inactivo'
      } else {
        estado = 'activo'
      }

      return {
        id_cliente: c.id_cliente,
        razon_social: c.razon_social,
        celular: c.celular,
        saldo,
        ultimoMovimiento: ultimoMov,
        estado,
      }
    })
    .sort((a, b) => b.saldo - a.saldo)

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">Deudores</h1>
        <p className="text-[#555] text-sm mt-1">{deudores.length} clientes con saldo pendiente</p>
      </div>

      <DeudoresList deudores={deudores} />
    </div>
  )
}
