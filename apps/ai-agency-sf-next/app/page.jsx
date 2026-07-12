import StatCard from '../components/StatCard';
import ClientCard from '../components/ClientCard';

export default function Home() {
  const clients = [
    { name: 'Discoolver', tags: ['TRAVEL', 'TECH', 'SaaS', 'B2B', 'SPAIN'], status: 'Activo' },
    { name: 'Salsa Burgers', tags: ['F&B', 'WACKY', 'BURGERS', 'BANGKOK'], status: 'Activo' },
    { name: 'NC Global Assets', tags: ['FINANCE', 'REAL ESTATE', 'THAILAND'], status: 'Activo' },
  ];

  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-950 to-slate-900 text-white">
      {/* Header */}
      <div className="border-b border-slate-800 bg-slate-900/50 backdrop-blur">
        <div className="max-w-7xl mx-auto px-6 py-6 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-orange-500 rounded-lg"></div>
            <h1 className="text-2xl font-bold">AI Agency SF</h1>
            <span className="px-2 py-1 text-xs bg-red-500/20 text-red-400 rounded">INTERNAL</span>
          </div>
          <div className="flex items-center gap-4">
            <button className="text-sm text-slate-400 hover:text-white">Admin</button>
            <div className="w-8 h-8 bg-blue-500 rounded-full"></div>
            <span className="text-sm text-slate-400">Startup Factory</span>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div className="border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-6 flex gap-8">
          <button className="py-4 px-2 text-sm font-medium text-white border-b-2 border-orange-500">
            Clients
          </button>
          <button className="py-4 px-2 text-sm font-medium text-slate-400 hover:text-white">
            Toolkit
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-12">
        {/* Greeting */}
        <div className="mb-12">
          <h2 className="text-4xl font-bold mb-4">Buenos días, equipo 👋</h2>
          <p className="text-slate-400">Selecciona un cliente o genera un nuevo entregable desde el Toolkit.</p>
          <button className="mt-6 px-6 py-3 bg-orange-500 hover:bg-orange-600 text-white font-semibold rounded-lg transition">
            + Generar entregable
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-4 gap-6 mb-12">
          <StatCard 
            number="8" 
            label="CLIENTES ACTIVOS"
            items={['DI · SB · NC · SF · DB · CO · LH · JC']}
          />
          <StatCard 
            number="7" 
            label="HERRAMIENTAS AI"
            items={['Brand Briefing · Action Plan 30/60/90', 'Auditoría SEO · Auditoría Marketing', 'Content Pack · Investor Deck']}
          />
          <StatCard 
            number="25" 
            label="ENTREGABLES GENERADOS"
            items={['Briefings · Audits · Decks · Content']}
          />
          <StatCard 
            number="~3m" 
            label="TIEMPO POR ENTREGABLE"
            items={['Con AI en producción']}
          />
        </div>

        {/* Clients Section */}
        <div>
          <h3 className="text-2xl font-bold mb-8">ESPACIOS ACTIVOS</h3>
          <h4 className="text-sm font-semibold text-slate-400 mb-6">Clientes</h4>
          <div className="grid grid-cols-3 gap-6">
            {clients.map((client, i) => (
              <ClientCard key={i} {...client} />
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}
