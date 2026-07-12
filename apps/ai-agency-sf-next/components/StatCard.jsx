export default function StatCard({ number, label, items }) {
  return (
    <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
      <div className="text-4xl font-bold text-orange-500 mb-2">{number}</div>
      <div className="text-sm text-slate-400 mb-3">{label}</div>
      <div className="text-xs text-slate-500 space-y-1">
        {items && items.map((item, i) => <div key={i}>• {item}</div>)}
      </div>
    </div>
  );
}
