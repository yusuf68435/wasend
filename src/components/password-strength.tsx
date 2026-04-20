"use client";

/**
 * Hafif şifre gücü meter — zxcvbn yerine basit entropy kuralı.
 * 5 seviye: zayıf, orta, iyi, güçlü, mükemmel.
 */
export function getPasswordStrength(pw: string): {
  score: 0 | 1 | 2 | 3 | 4;
  label: string;
  suggestions: string[];
} {
  if (!pw) return { score: 0, label: "", suggestions: [] };

  let score = 0;
  const suggestions: string[] = [];

  if (pw.length >= 8) score++;
  else suggestions.push("En az 8 karakter");

  if (pw.length >= 12) score++;
  else if (pw.length >= 8) suggestions.push("12+ karakter daha güvenli");

  if (/[A-Z]/.test(pw) && /[a-z]/.test(pw)) score++;
  else suggestions.push("Büyük ve küçük harf birleşimi");

  if (/\d/.test(pw)) score++;
  else suggestions.push("Rakam ekleyin");

  if (/[^A-Za-z0-9]/.test(pw)) score++;
  else suggestions.push("Özel karakter (!@#$...) ekleyin");

  const clamped = Math.min(4, score) as 0 | 1 | 2 | 3 | 4;

  const labels = ["Çok zayıf", "Zayıf", "Orta", "İyi", "Güçlü"];
  return { score: clamped, label: labels[clamped], suggestions: suggestions.slice(0, 2) };
}

const COLORS = [
  "bg-red-500",
  "bg-orange-500",
  "bg-yellow-500",
  "bg-green-500",
  "bg-green-600",
];

export function PasswordStrengthMeter({ password }: { password: string }) {
  const { score, label, suggestions } = getPasswordStrength(password);

  if (!password) return null;

  return (
    <div className="mt-2" aria-live="polite">
      <div className="flex gap-1 mb-1">
        {[0, 1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className={`h-1 flex-1 rounded-full transition-colors ${
              i <= score ? COLORS[score] : "bg-gray-200"
            }`}
          />
        ))}
      </div>
      <p className="text-xs flex items-center justify-between">
        <span
          className={
            score <= 1
              ? "text-red-600"
              : score === 2
                ? "text-yellow-700"
                : "text-green-700"
          }
        >
          {label}
        </span>
        {suggestions.length > 0 && (
          <span className="text-gray-400 text-right">{suggestions[0]}</span>
        )}
      </p>
    </div>
  );
}
