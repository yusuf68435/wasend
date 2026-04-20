export default function DashboardLoading() {
  return (
    <div className="space-y-4" aria-busy="true" aria-label="Yükleniyor">
      <div className="h-8 w-48 bg-gray-200 rounded animate-pulse" />
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[0, 1, 2, 3].map((i) => (
          <div
            key={i}
            className="h-28 bg-gray-100 border border-gray-200 rounded-xl animate-pulse"
          />
        ))}
      </div>
      <div className="h-64 bg-gray-100 border border-gray-200 rounded-xl animate-pulse" />
    </div>
  );
}
