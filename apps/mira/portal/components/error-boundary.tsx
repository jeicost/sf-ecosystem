'use client'
import { Component, type ReactNode } from 'react'

interface Props { children: ReactNode; fallback?: ReactNode }
interface State { hasError: boolean; error?: Error }

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  render() {
    if (!this.state.hasError) return this.props.children
    return this.props.fallback ?? (
      <div className="px-8 py-8">
        <div className="rounded-2xl border border-red-500/20 bg-red-500/5 p-8 text-center">
          <p className="text-red-400 font-medium text-sm mb-1">Algo salió mal</p>
          <p className="text-ink-muted text-xs max-w-sm mx-auto">
            {this.state.error?.message ?? 'Error inesperado. Recarga la página para continuar.'}
          </p>
          <button onClick={() => this.setState({ hasError: false })}
            className="mt-4 px-4 py-2 text-xs rounded-lg border border-line-subtle text-ink-tertiary hover:text-ink transition-colors">
            Reintentar
          </button>
        </div>
      </div>
    )
  }
}
