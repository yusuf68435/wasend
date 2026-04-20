import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-emerald-100 px-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-lg p-8 text-center">
        <h1 className="text-6xl font-bold text-green-600 mb-2">404</h1>
        <p className="text-gray-700 font-medium mb-2">Sayfa bulunamadı</p>
        <p className="text-sm text-gray-500 mb-6">
          Aradığınız sayfa mevcut değil ya da taşındı.
        </p>
        <div className="flex gap-2 justify-center">
          <Link
            href="/"
            className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-green-700"
          >
            Ana sayfa
          </Link>
          <Link
            href="/dashboard"
            className="border border-gray-300 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-50"
          >
            Panel
          </Link>
        </div>
      </div>
    </div>
  );
}
