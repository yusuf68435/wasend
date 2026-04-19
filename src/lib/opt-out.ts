const OPT_OUT_KEYWORDS = [
  "stop",
  "dur",
  "iptal",
  "çık",
  "cik",
  "unsubscribe",
  "durdur",
];

export function isOptOutMessage(text: string): boolean {
  if (!text) return false;
  const normalized = text.trim().toLowerCase();
  return OPT_OUT_KEYWORDS.some(
    (kw) => normalized === kw || normalized.startsWith(kw + " "),
  );
}

export const OPT_OUT_CONFIRMATION =
  "Mesaj aboneliğiniz sonlandırıldı. Size bundan sonra mesaj göndermeyeceğiz. Yeniden başlatmak için 'BAŞLAT' yazın.";
