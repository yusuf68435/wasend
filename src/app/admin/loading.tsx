export default function AdminLoading() {
  return (
    <div className="space-y-4" aria-busy="true" aria-label="Yükleniyor">
      <div className="h-8 w-56 bg-slate-200 rounded animate-pulse" />
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[0, 1, 2, 3].map((i) => (
          <div
            key={i}
            className="h-24 bg-white border border-slate-200 rounded-xl animate-pulse"
          />
        ))}
      </div>
      <div className="h-64 bg-white border border-slate-200 rounded-xl animate-pulse" />
    </div>
  );
}
