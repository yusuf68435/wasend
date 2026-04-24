/**
 * Reusable skeleton primitives — tutarlı loading UX için.
 * Apple HIG palette: #f5f5f7 (skeleton fill), #d2d2d7 (border), #fbfbfd (bg).
 * rounded-xl (12px) default — sistemin diğer card'larıyla uyumlu.
 *
 * A11y:
 *   - Konteyner'larda aria-busy="true" (screen reader "yükleniyor" diye
 *     duyuruyor).
 *   - motion-safe: animate-pulse — prefers-reduced-motion: reduce kullanan
 *     kullanıcılarda animasyon durur (vestibular sensitivity, epilepsi).
 *   - Dekoratif çubuklar aria-hidden — screen reader boş şerit okumasın.
 */

export function SkeletonLine({
  width = "100%",
  className = "",
}: {
  width?: string;
  className?: string;
}) {
  return (
    <div
      className={`h-4 bg-[#f5f5f7] rounded motion-safe:animate-pulse ${className}`}
      style={{ width }}
      aria-hidden="true"
    />
  );
}

export function SkeletonCard({ className = "" }: { className?: string }) {
  return (
    <div
      className={`bg-white border border-[#d2d2d7] rounded-2xl p-4 ${className}`}
      aria-busy="true"
      aria-label="Yükleniyor"
    >
      <div
        className="h-4 w-24 bg-[#f5f5f7] rounded motion-safe:animate-pulse mb-3"
        aria-hidden="true"
      />
      <div
        className="h-8 w-16 bg-[#f5f5f7] rounded motion-safe:animate-pulse"
        aria-hidden="true"
      />
    </div>
  );
}

export function SkeletonTable({ rows = 5 }: { rows?: number }) {
  return (
    <div
      className="bg-white border border-[#d2d2d7] rounded-2xl overflow-hidden"
      aria-busy="true"
      aria-label="Yükleniyor"
    >
      {Array.from({ length: rows }).map((_, i) => (
        <div
          key={i}
          className="flex items-center gap-4 p-4 border-b border-[#f5f5f7] last:border-0"
          aria-hidden="true"
        >
          <div className="w-10 h-10 bg-[#f5f5f7] rounded-full motion-safe:animate-pulse" />
          <div className="flex-1 space-y-2">
            <div className="h-3 w-1/3 bg-[#f5f5f7] rounded motion-safe:animate-pulse" />
            <div className="h-3 w-1/2 bg-[#f5f5f7] rounded motion-safe:animate-pulse" />
          </div>
          <div className="w-16 h-6 bg-[#f5f5f7] rounded motion-safe:animate-pulse" />
        </div>
      ))}
    </div>
  );
}

export function SkeletonKPIGrid({ count = 4 }: { count?: number }) {
  return (
    <div
      className="grid grid-cols-2 md:grid-cols-4 gap-4"
      aria-busy="true"
      aria-label="Yükleniyor"
    >
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonCard key={i} />
      ))}
    </div>
  );
}
