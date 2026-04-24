import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#fbfbfd] text-[#1d1d1f] px-4">
      <div className="max-w-[420px] w-full text-center">
        <p className="text-[88px] font-semibold tracking-tight leading-none text-[#1d1d1f]">
          404
        </p>
        <h1 className="display-md mt-4 text-[#1d1d1f]">Sayfa bulunamadı.</h1>
        <p className="text-[15px] text-[#6e6e73] mt-3 tracking-tight">
          Aradığın sayfa mevcut değil ya da taşındı.
        </p>
        <div className="flex gap-3 justify-center mt-8">
          <Link
            href="/"
            className="bg-[#1d1d1f] text-white px-5 py-2.5 rounded-full text-[13px] font-medium tracking-tight hover:bg-black transition"
          >
            Ana sayfa
          </Link>
          <Link
            href="/dashboard"
            className="border border-[#d2d2d7] text-[#1d1d1f] px-5 py-2.5 rounded-full text-[13px] font-medium tracking-tight hover:bg-[#f5f5f7] transition"
          >
            Panel
          </Link>
        </div>
      </div>
    </div>
  );
}
