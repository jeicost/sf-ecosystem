import Link from 'next/link'

export const metadata = {
  title: 'Dashboard — SF-CMS',
}

export default function AdminDashboard() {
  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-slate-900">Dashboard</h1>
        <p className="text-slate-600 mt-2">Welcome to SF-CMS administration</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
        <Link
          href="/admin/projects"
          className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition border-l-4 border-slate-900"
        >
          <h3 className="text-xl font-bold text-slate-900">Projects</h3>
          <p className="text-slate-600 text-sm mt-2">Manage client projects and settings</p>
        </Link>

        <Link
          href="/admin/pages"
          className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition border-l-4 border-slate-900"
        >
          <h3 className="text-xl font-bold text-slate-900">Pages</h3>
          <p className="text-slate-600 text-sm mt-2">Edit website pages and sections</p>
        </Link>

        <Link
          href="/admin/posts"
          className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition border-l-4 border-slate-900"
        >
          <h3 className="text-xl font-bold text-slate-900">Posts</h3>
          <p className="text-slate-600 text-sm mt-2">Manage blog posts and content</p>
        </Link>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-2xl font-bold text-slate-900 mb-4">Quick Start</h2>
        <div className="space-y-2 text-slate-600">
          <p>• Create a new project to get started</p>
          <p>• Add pages and organize your content</p>
          <p>• Publish posts to your blog</p>
          <p>• View analytics and manage media assets</p>
        </div>
      </div>
    </div>
  )
}
