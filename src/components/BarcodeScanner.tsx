"use client";

import { useEffect, useRef, useState } from "react";

// Usa a API nativa BarcodeDetector (Chrome/Android/Edge). Onde nao existe,
// exibe um aviso e o usuario digita manualmente.
interface BarcodeDetectorLike {
  detect: (source: CanvasImageSource) => Promise<{ rawValue: string }[]>;
}

export default function BarcodeScanner({
  open,
  onClose,
  onDetected,
}: {
  open: boolean;
  onClose: () => void;
  onDetected: (value: string) => void;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [supported, setSupported] = useState(true);

  useEffect(() => {
    if (!open) return;
    let stream: MediaStream | null = null;
    let raf = 0;
    let stopped = false;

    async function start() {
      const BD = (window as unknown as {
        BarcodeDetector?: new (opts?: { formats?: string[] }) => BarcodeDetectorLike;
      }).BarcodeDetector;

      if (!BD) {
        setSupported(false);
        return;
      }

      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "environment" },
        });
        if (stopped) return;
        const video = videoRef.current;
        if (!video) return;
        video.srcObject = stream;
        await video.play();

        const detector = new BD({
          formats: ["ean_13", "ean_8", "code_128", "code_39", "upc_a", "upc_e", "qr_code"],
        });

        const tick = async () => {
          if (stopped || !videoRef.current) return;
          try {
            const codes = await detector.detect(videoRef.current);
            if (codes.length) {
              onDetected(codes[0].rawValue);
              onClose();
              return;
            }
          } catch {
            // ignora frames que falham
          }
          raf = requestAnimationFrame(tick);
        };
        raf = requestAnimationFrame(tick);
      } catch {
        setError("Não foi possível acessar a câmera. Verifique as permissões.");
      }
    }

    start();

    return () => {
      stopped = true;
      cancelAnimationFrame(raf);
      stream?.getTracks().forEach((t) => t.stop());
    };
  }, [open, onClose, onDetected]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 bg-black/70 grid place-items-center z-50 p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl p-4 w-full max-w-md"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-3">
          <h3 className="font-bold text-lg m-0">Ler código de barras</h3>
          <button
            onClick={onClose}
            className="text-[#758277] font-bold"
            aria-label="Fechar"
          >
            Fechar ✕
          </button>
        </div>
        {!supported ? (
          <div className="text-sm text-danger bg-[#f9ece5] rounded-lg p-3">
            Este navegador não suporta leitura por câmera. Use o Chrome no
            Android ou digite o SKU manualmente.
          </div>
        ) : error ? (
          <div className="text-sm text-danger bg-[#f9ece5] rounded-lg p-3">
            {error}
          </div>
        ) : (
          <>
            <video
              ref={videoRef}
              className="w-full rounded-xl bg-black aspect-[4/3] object-cover"
              muted
              playsInline
            />
            <p className="text-xs text-[#758277] mt-2 text-center">
              Aponte a câmera para o código. A leitura é automática.
            </p>
          </>
        )}
      </div>
    </div>
  );
}
