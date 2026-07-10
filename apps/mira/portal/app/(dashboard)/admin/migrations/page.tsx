'use client'

import { useState } from 'react'
import { Play, Zap, CheckCircle2 } from 'lucide-react'

export default function MigrationsPage() {
  const [isApplying, setIsApplying] = useState(false)
  const [isExecuting, setIsExecuting] = useState(false)
  const [applyLog, setApplyLog] = useState<string[]>([])
  const [executeLog, setExecuteLog] = useState<string[]>([])
  const [applyStatus, setApplyStatus] = useState<'idle' | 'success' | 'error'>('idle')
  const [executeStatus, setExecuteStatus] = useState<'idle' | 'success' | 'error'>('idle')

  const handleApplyMigrations = async () => {
    setIsApplying(true)
    setApplyLog([])
    setApplyStatus('idle')
    try {
      setApplyLog(prev => [...prev, 'Iniciando aplicación de migraciones...'])
      const res = await fetch('/api/admin/apply-migrations', { method: 'POST' })
      const data = await res.json()
      if (res.ok) {
        setApplyLog(prev => [...prev, ...(Array.isArray(data) ? data : [JSON.stringify(data)])])
        setApplyStatus('success')
      } else {
        setApplyLog(prev => [...prev, `Error: ${data.error || data.message || 'Error desconocido'}`])
        setApplyStatus('error')
      }
    } catch (err) {
      setApplyLog(prev => [...prev, `Error de conexión: ${err instanceof Error ? err.message : 'Error desconocido'}`])
      setApplyStatus('error')
    } finally {
      setIsApplying(false)
    }
  }

  const handleExecuteMigrations = async () => {
    setIsExecuting(true)
    setExecuteLog([])
    setExecuteStatus('idle')
    try {
      setExecuteLog(prev => [...prev, 'Iniciando ejecución de migraciones...'])
      const res = await fetch('/api/admin/execute-migrations', { method: 'POST' })
      const data = await res.json()
      if (res.ok) {
        setExecuteLog(prev => [...prev, ...(Array.isArray(data) ? data : [JSON.stringify(data)])])
        setExecuteStatus('success')
      } else {
        setExecuteLog(prev => [...prev, `Error: ${data.error || data.message || 'Error desconocido'}`])
        setExecuteStatus('error')
      }
    } catch (err) {
      setExecuteLog(prev => [...prev, `Error de conexión: ${err instanceof Error ? err.message : 'Error desconocido'}`])
      setExecuteStatus('error')
    } finally {
      setIsExecuting(false)
    }
  }

  return (
    <div className="px-8 py-8">
      <div className="mb-8">
        <p className="text-[10px] uppercase tracking-widest font-semibold mb-2" style={{ color: 'rgba(34,197,94,0.8)', letterSpacing: '0.12em' }}>
          Admin / Migrations
        </p>
        <h1 className="text-2xl font-semibold text-white tracking-tight">Database Migrations</h1>
        <p className="text-sm mt-1" style={{ color: 'rgba(255,255,255,0.4)' }}>
          Aplica y ejecuta migraciones de base de datos. Siempre verifica cambios antes de ejecutar en producción.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-6">
        {/* Apply Migrations */}
        <div className="card px-6 py-5">
          <div className="mb-4">
            <p className="text-sm font-semibold text-white mb-1">Aplicar Migraciones</p>
            <p className="text-xs" style={{ color: 'rgba(255,255,255,0.5)' }}>
              Prepara y compila las migraciones pendientes
            </p>
          </div>
          <button
            onClick={handleApplyMigrations}
            disabled={isApplying}
            className="w-full inline-flex items-center justify-center gap-2 px-6 py-3 rounded-lg font-semibold transition-all"
            style={{
              background: isApplying ? 'rgba(34,197,94,0.4)' : 'linear-gradient(135deg, #22C55E 0%, #16A34A 100%)',
              color: 'white',
            }}
          >
            <Zap size={16} />
            {isApplying ? 'Aplicando...' : 'Aplicar'}
          </button>

          {applyLog.length > 0 && (
            <div className="mt-4 p-4 rounded-lg" style={{ background: 'rgba(30,41,59,0.5)', border: '1px solid rgba(255,255,255,0.05)' }}>
              <p className="text-xs font-semibold mb-2" style={{ color: applyStatus === 'success' ? '#22C55E' : applyStatus === 'error' ? '#EF4444' : 'rgba(255,255,255,0.5)' }}>
                {applyStatus === 'success' ? '✓ Completado' : applyStatus === 'error' ? '✗ Error' : 'Procesando...'}
              </p>
              <div className="text-[11px] text-white space-y-1 max-h-32 overflow-y-auto font-mono">
                {applyLog.map((log, i) => (
                  <p key={i} style={{ color: log.includes('Error') ? '#FCA5A5' : 'rgba(255,255,255,0.7)' }}>
                    {log}
                  </p>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Execute Migrations */}
        <div className="card px-6 py-5">
          <div className="mb-4">
            <p className="text-sm font-semibold text-white mb-1">Ejecutar Migraciones</p>
            <p className="text-xs" style={{ color: 'rgba(255,255,255,0.5)' }}>
              Ejecuta las migraciones aplicadas en la base de datos
            </p>
          </div>
          <button
            onClick={handleExecuteMigrations}
            disabled={isExecuting}
            className="w-full inline-flex items-center justify-center gap-2 px-6 py-3 rounded-lg font-semibold transition-all"
            style={{
              background: isExecuting ? 'rgba(34,197,94,0.4)' : 'linear-gradient(135deg, #22C55E 0%, #16A34A 100%)',
              color: 'white',
            }}
          >
            <Play size={16} />
            {isExecuting ? 'Ejecutando...' : 'Ejecutar'}
          </button>

          {executeLog.length > 0 && (
            <div className="mt-4 p-4 rounded-lg" style={{ background: 'rgba(30,41,59,0.5)', border: '1px solid rgba(255,255,255,0.05)' }}>
              <p className="text-xs font-semibold mb-2" style={{ color: executeStatus === 'success' ? '#22C55E' : executeStatus === 'error' ? '#EF4444' : 'rgba(255,255,255,0.5)' }}>
                {executeStatus === 'success' ? '✓ Completado' : executeStatus === 'error' ? '✗ Error' : 'Procesando...'}
              </p>
              <div className="text-[11px] text-white space-y-1 max-h-32 overflow-y-auto font-mono">
                {executeLog.map((log, i) => (
                  <p key={i} style={{ color: log.includes('Error') ? '#FCA5A5' : 'rgba(255,255,255,0.7)' }}>
                    {log}
                  </p>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="mt-8 card px-6 py-5">
        <div className="flex items-start gap-4">
          <div className="text-2xl">⚠️</div>
          <div>
            <p className="text-sm font-semibold text-white mb-1">Precaución</p>
            <p className="text-xs" style={{ color: 'rgba(255,255,255,0.5)' }}>
              Las migraciones no se pueden revertir una vez ejecutadas. Asegúrate de que has respaldado tu base de datos y que entiendes cada cambio antes de ejecutar.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
