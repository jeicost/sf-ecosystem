export default function ClientCard({ name, tags, status, link }) {
  return (
    <div className="bg-slate-800 rounded-lg p-6 border border-slate-700 hover:border-orange-500 transition">
      <div className="flex items-center gap-3 mb-3">
        <div className="w-12 h-12 bg-gradient-to-br from-orange-400 to-orange-600 rounded-lg"></div>
        <div>
          <h3 className="font-semibold text-white">{name}</h3>
          <p className="text-xs text-slate-400">
            {tags.map(tag => tag).join(' · ')}
          </p>
        </div>
      </div>
      <div className="flex flex-wrap gap-2">
        {tags.map((tag, i) => (
          <span key={i} className="text-xs px-2 py-1 bg-slate-700 text-slate-300 rounded">
            {tag}
          </span>
        ))}
      </div>
      {status && (
        <div className="mt-3 text-xs text-green-400 flex items-center gap-1">
          <span className="w-2 h-2 bg-green-400 rounded-full"></span>
          {status}
        </div>
      )}
    </div>
  );
}
