// Homepage — NC Global Assets
// Port from: clients/nc-global-assets/src/App.jsx (Vite SPA)

export const metadata = {
  title: 'NC Global Assets — Bangkok Operating Partner for International Brands',
  description: 'Enter Thailand with infrastructure, local team & operational base. No setup from scratch. Real revenue from day one.',
  openGraph: {
    type: 'website',
    url: 'https://www.ncglobalassets.com',
    images: [{ url: '/og-image.jpg', width: 1200, height: 630 }],
  },
}

export default function HomePage() {
  const CONFIG = {
    calendlyUrl: 'https://calendly.com/ncglobalassets/intro',
  }

  return (
    <main className="min-h-screen bg-white">
      {/* Hero Section */}
      <section className="hero relative overflow-hidden py-24">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage: 'url(/assets/hero-bkk.webp)',
          }}
        />

        <div className="relative container mx-auto px-4">
          <div className="max-w-3xl">
            <p className="text-sm uppercase tracking-wider text-amber-500 mb-6">Bangkok · Local Operating Partner</p>

            <h1 className="text-5xl md:text-6xl font-bold leading-tight mb-8">
              <span className="block">Enter Thailand.</span>
              <span className="block">Skip the <em className="text-amber-500">hard part.</em></span>
              <span className="block italic text-amber-500">Your brand live in weeks.</span>
            </h1>

            <p className="text-lg md:text-xl text-gray-700 max-w-2xl mb-12">
              We give international brands the infrastructure, the local team and the operational base to enter Thailand.
            </p>

            <a
              href={CONFIG.calendlyUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block bg-black text-white px-6 py-3 rounded hover:bg-gray-900"
            >
              Book a Call
            </a>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mt-20">
            {[
              { num: '15+', label: 'Years of founder experience' },
              { num: '7', label: 'Brands in network' },
              { num: '2w', label: 'Time to live' },
              { num: 'SEA', label: 'Gateway region' },
            ].map((stat, i) => (
              <div key={i}>
                <div className="text-3xl font-bold">{stat.num}</div>
                <p className="text-sm text-gray-600 mt-2">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Placeholder for remaining sections */}
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-4 text-center">
          <p className="text-gray-600">UI migration in progress...</p>
          <p className="text-xs text-gray-500 mt-2">See clients/nc-global-assets/src/App.jsx for full component list</p>
        </div>
      </section>
    </main>
  )
}
