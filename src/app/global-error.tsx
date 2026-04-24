"use client";

import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Global error:", error);
  }, [error]);

  return (
    <html lang="tr">
      <body style={{ fontFamily: "system-ui, -apple-system, sans-serif", margin: 0, padding: 0 }}>
        <div
          style={{
            minHeight: "100vh",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "16px",
            background: "linear-gradient(180deg, #fef2f2 0%, #fee2e2 100%)",
          }}
        >
          <div
            style={{
              maxWidth: "480px",
              width: "100%",
              background: "white",
              borderRadius: "16px",
              padding: "32px",
              boxShadow: "0 10px 25px rgba(0,0,0,0.1)",
              textAlign: "center",
            }}
          >
            <h1 style={{ fontSize: "24px", margin: "0 0 8px", color: "#991b1b" }}>
              Kritik hata
            </h1>
            <p style={{ color: "#555", fontSize: "14px", margin: "0 0 24px" }}>
              Uygulama beklenmedik bir hatayla karşılaştı. Sayfayı yenilemeyi
              deneyin veya birkaç dakika sonra tekrar deneyin.
            </p>
            {error.digest && (
              <p style={{ fontSize: "12px", color: "#888", fontFamily: "monospace" }}>
                {error.digest}
              </p>
            )}
            <button
              onClick={reset}
              style={{
                background: "#25D366",
                color: "white",
                border: "none",
                padding: "10px 24px",
                borderRadius: "8px",
                fontWeight: 500,
                cursor: "pointer",
                marginTop: "16px",
              }}
            >
              Yeniden dene
            </button>
          </div>
        </div>
      </body>
    </html>
  );
}
