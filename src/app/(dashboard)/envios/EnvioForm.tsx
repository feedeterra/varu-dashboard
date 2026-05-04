/* eslint-disable @typescript-eslint/no-explicit-any */
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Cliente, Articulo } from '@/types'

interface Props {
  clientes: Cliente[]
  articulos: Articulo[]
}

const ESTADOS = ['preparando', 'enviado', 'entregado', 'devuelto'] as const

export function EnvioForm({ clientes, articulos }: Props) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const [form, setForm] = useState({
    id_cliente: '',
    id_articulo: '',
    comisionista: '',
    direccion: '',
    estado: 'preparando' as typeof ESTADOS[number],
    nota: '',
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    const supabase = createClient()
    const { error: dbError } = await supabase.from('envios').insert({
      id_cliente: Number(form.id_cliente),
      id_articulo: form.id_articulo ? Number(form.id_articulo) : null,
      comisionista: form.comisionista,
      direccion: form.direccion,
      estado: form.estado,
      nota: form.nota || null,
    })

    if (dbError) {
      setError(dbError.message)
      setLoading(false)
      return
    }

    setForm({ id_cliente: '', id_articulo: '', comisionista: '', direccion: '', estado: 'preparando', nota: '' })
    setOpen(false)
    setLoading(false)
    router.refresh()
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold px-4 py-2.5 rounded-lg transition-colors"
      >
        + Nuevo envío
      </button>
    )
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70">
      <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="px-6 py-5 border-b border-[#222] flex items-center justify-between">
          <h2 className="text-lg font-bold text-white">Nuevo envío</h2>
          <button onClick={() => setOpen(false)} className="text-[#555] hover:text-white text-xl">×</button>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
          <div>
            <label className="block text-xs text-[#555] uppercase tracking-wider mb-1.5">Cliente *</label>
            <select
              value={form.id_cliente}
              onChange={e => setForm(f => ({ ...f, id_cliente: e.target.value }))}
              required
              className="w-full bg-[#111] border border-[#2a2a2a] rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:border-blue-600"
            >
              <option value="">Seleccionar cliente...</option>
              {clientes.map(c => (
                <option key={c.id_cliente} value={c.id_cliente}>{c.razon_social}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs text-[#555] uppercase tracking-wider mb-1.5">Producto</label>
            <select
              value={form.id_articulo}
              onChange={e => setForm(f => ({ ...f, id_articulo: e.target.value }))}
              className="w-full bg-[#111] border border-[#2a2a2a] rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:border-blue-600"
            >
              <option value="">Sin especificar</option>
              {articulos.map(a => (
                <option key={a.id_articulo} value={a.id_articulo}>{a.nombre}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs text-[#555] uppercase tracking-wider mb-1.5">Comisionista *</label>
            <input
              type="text"
              value={form.comisionista}
              onChange={e => setForm(f => ({ ...f, comisionista: e.target.value }))}
              required
              className="w-full bg-[#111] border border-[#2a2a2a] rounded-lg px-3 py-2.5 text-white text-sm placeholder-[#444] focus:outline-none focus:border-blue-600"
              placeholder="Nombre del comisionista"
            />
          </div>

          <div>
            <label className="block text-xs text-[#555] uppercase tracking-wider mb-1.5">Dirección *</label>
            <input
              type="text"
              value={form.direccion}
              onChange={e => setForm(f => ({ ...f, direccion: e.target.value }))}
              required
              className="w-full bg-[#111] border border-[#2a2a2a] rounded-lg px-3 py-2.5 text-white text-sm placeholder-[#444] focus:outline-none focus:border-blue-600"
              placeholder="Dirección de entrega"
            />
          </div>

          <div>
            <label className="block text-xs text-[#555] uppercase tracking-wider mb-1.5">Estado</label>
            <select
              value={form.estado}
              onChange={e => setForm(f => ({ ...f, estado: e.target.value as any }))}
              className="w-full bg-[#111] border border-[#2a2a2a] rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:border-blue-600"
            >
              {ESTADOS.map(e => (
                <option key={e} value={e}>{e.charAt(0).toUpperCase() + e.slice(1)}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs text-[#555] uppercase tracking-wider mb-1.5">Nota</label>
            <textarea
              value={form.nota}
              onChange={e => setForm(f => ({ ...f, nota: e.target.value }))}
              rows={2}
              className="w-full bg-[#111] border border-[#2a2a2a] rounded-lg px-3 py-2.5 text-white text-sm placeholder-[#444] focus:outline-none focus:border-blue-600 resize-none"
              placeholder="Observaciones..."
            />
          </div>

          {error && <p className="text-red-400 text-xs">{error}</p>}

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="flex-1 bg-[#222] hover:bg-[#2a2a2a] text-[#aaa] text-sm font-medium py-2.5 rounded-lg transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-blue-600 hover:bg-blue-500 disabled:bg-blue-800 text-white text-sm font-semibold py-2.5 rounded-lg transition-colors"
            >
              {loading ? 'Guardando...' : 'Guardar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
