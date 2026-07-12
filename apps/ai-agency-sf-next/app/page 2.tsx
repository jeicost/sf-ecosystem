export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-950 to-slate-900">
      <div className="container mx-auto px-4 py-20">
        <div className="flex flex-col items-center justify-center min-h-screen">
          <h1 className="text-5xl font-bold text-white mb-4">
            AI Agency SF
          </h1>
          <p className="text-xl text-slate-300 mb-8">
            Internal operations portal
          </p>
          <button className="px-8 py-3 bg-orange-500 hover:bg-orange-600 text-white font-semibold rounded-lg transition">
            Acceder →
          </button>
        </div>
      </div>
    </main>
  );
}
