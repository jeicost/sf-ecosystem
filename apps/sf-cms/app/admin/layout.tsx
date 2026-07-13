import Link from 'next/link'

export const metadata = {
  title: 'Admin — SF-CMS',
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen bg-slate-50">
      {/* Sidebar */}
      <aside className="w-64 bg-slate-900 text-white p-6 shadow-lg">
        <div className="mb-8">
          <h2 className="text-2xl font-bold">SF-CMS</h2>
          <p className="text-sm text-slate-400 mt-1">Content Management System</p>
        </div>

        <nav className="space-y-2">
          <Link
            href="/admin"
            className="block px-4 py-2 rounded-lg hover:bg-slate-800 transition"
          >
            Dashboard
          </Link>
          <Link
            href="/admin/projects"
            className="block px-4 py-2 rounded-lg hover:bg-slate-800 transition"
          >
            Projects
          </Link>
          <Link
            href="/admin/pages"
            className="block px-4 py-2 rounded-lg hover:bg-slate-800 transition"
          >
            Pages
          </Link>
          <Link
            href="/admin/posts"
            className="block px-4 py-2 rounded-lg hover:bg-slate-800 transition"
          >
            Posts
          </Link>
        </nav>

        <div className="mt-auto pt-8 border-t border-slate-700">
          <a
            href="/api/auth/logout"
            className="block text-sm text-slate-300 hover:text-white transition"
          >
            Logout
          </a>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-auto">
        <div className="p-8">{children}</div>
      </main>
    </div>
  )
}
