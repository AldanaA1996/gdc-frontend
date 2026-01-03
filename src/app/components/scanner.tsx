"use client"

import React, { useCallback, useEffect, useRef, useState } from "react";
import { Button } from "@/app/components/ui/button";
import { 
  Camera, 
  ScanLine, 
  RefreshCw, 
  X,
  AlertCircle,
  CheckCircle2,
  Play
} from "lucide-react";

type Props = {
  onDetected?:  (code: { rawValue: string; format?:  string }) => void;
  autoStart?: boolean;
  onClose?: () => void;
};

declare global {
  interface Window {
    BarcodeDetector?:  any;
  }
}

const SUPPORTED_FORMATS = [
  "qr_code",
  "ean_13",
  "ean_8",
  "code_128",
  "code_39",
  "upc_a",
  "upc_e",
  "itf",
];

export default function BarcodeScanner({ onDetected, autoStart = false, onClose }: Props) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [running, setRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
  const [deviceId, setDeviceId] = useState<string>("");
  const [lastCode, setLastCode] = useState<string>("");
  const [usingZxing, setUsingZxing] = useState(false);
  const [showCameraSelect, setShowCameraSelect] = useState(false);
  const zxingReaderRef = useRef<any | null>(null);

  const refreshDevices = useCallback(async () => {
    try {
      const mediaDevices = await navigator.mediaDevices.enumerateDevices();
      const cams = mediaDevices. filter((d) => d.kind === "videoinput");
      setDevices(cams);
    } catch {}
  }, []);

  const stop = useCallback(() => {
    setRunning(false);
    try {
      if (zxingReaderRef.current) {
        zxingReaderRef.current.reset?. ();
        zxingReaderRef.current = null;
      }
    } catch {}
    if (stream) {
      stream.getTracks().forEach((t) => t.stop());
    }
    setStream(null);
    setUsingZxing(false);
    onClose?.();
  }, [stream, onClose]);

  const start = useCallback(async () => {
    setError(null);
    setRunning(true);
    setShowCameraSelect(false);
    try {
      await refreshDevices();
      const cams = devices. length ? devices : [];
      const useId = deviceId || cams[cams.length - 1]?.deviceId;
      
      if (! window.BarcodeDetector) {
        await startZxing(useId);
        await refreshDevices();
      } else {
        const ms = await navigator.mediaDevices. getUserMedia({
          video: useId ?  { deviceId: { exact: useId } } : { facingMode: "environment" },
          audio: false,
        });
        setStream(ms);
        if (videoRef.current) {
          videoRef.current.srcObject = ms;
          await videoRef.current.play();
        }
        loopDetect();
        await refreshDevices();
      }
    } catch (e:  any) {
      setError(e?. message || "No se pudo acceder a la cámara");
      setRunning(false);
    }
  }, [deviceId, devices. length, refreshDevices]);

  const loopDetect = useCallback(async () => {
    if (!window.BarcodeDetector) return;
    const detector = new window.BarcodeDetector({ formats: SUPPORTED_FORMATS });

    const tick = async () => {
      if (!running) return;
      try {
        const video = videoRef.current;
        const canvas = canvasRef.current;
        if (video && canvas) {
          const w = video.videoWidth || 640;
          const h = video. videoHeight || 480;
          canvas.width = w;
          canvas.height = h;
          const ctx = canvas.getContext("2d");
          if (ctx) {
            ctx.drawImage(video, 0, 0, w, h);
            const bitmap = await createImageBitmap(canvas);
            const codes = await detector.detect(bitmap);
            if (codes && codes.length) {
              const c = codes[0];
              const value:  string = c.rawValue ?? c.raw ??  "";
              if (value && value !== lastCode) {
                setLastCode(value);
                onDetected?.({ rawValue: value, format: c.format });
              }
            }
          }
        }
      } catch (e) {
        // swallow and continue
      } finally {
        if (running) requestAnimationFrame(tick);
      }
    };
    requestAnimationFrame(tick);
  }, [onDetected, running, lastCode]);

  const startZxing = useCallback(async (useId?:  string) => {
    try {
      setUsingZxing(true);
      setError(null);
      const mod:  any = await import("@zxing/browser");
      const BrowserMultiFormatReader = mod. BrowserMultiFormatReader as any;
      const reader:  any = new BrowserMultiFormatReader();
      zxingReaderRef.current = reader;

      await reader.decodeFromVideoDevice(
        useId || undefined,
        videoRef.current!,
        (result:  any, err: any, controls: any) => {
          if (! running) {
            controls?.stop();
            return;
          }
          if (result) {
            const text = result.getText?. () ?? String(result);
            if (text && text !== lastCode) {
              setLastCode(text);
              onDetected?.({ rawValue: text });
            }
          }
        }
      );
    } catch (e: any) {
      setError("No se pudo iniciar el lector ZXing.");
      setUsingZxing(false);
    }
  }, [onDetected, running, lastCode]);

  useEffect(() => {
    if (autoStart) start();
    return () => stop();
  }, [autoStart, start, stop]);

  useEffect(() => {
    if (!running) return;
    (async () => {
      stop();
      await new Promise((r) => setTimeout(r, 50));
      start();
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [deviceId]);

  return (
    <div className="pb-2">
      {/* Header */}
      {/* <div className="mb-4">
        <div className="flex items-center gap-2 mb-1">
          <ScanLine className="h-5 w-5 text-blue-600" />
          <h2 className="text-xl font-bold text-gray-800">Escáner de Códigos</h2>
        </div>
        <p className="text-xs text-gray-600">
          Escanea códigos de barras o QR con la cámara
        </p>
      </div> */}

      {/* Error */}
      {error && (
        <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-lg mb-4">
          <AlertCircle className="h-4 w-4 text-red-600 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {/* Video preview con controles */}
      <div className="relative w-full max-w-md mx-auto">
        <div className="relative overflow-hidden rounded-lg ">
          <video 
            ref={videoRef} 
            className="w-full h-auto min-h-[100px] max-h-[200px] object-cover aspect-video" 
            playsInline 
            muted 
          />
          <canvas ref={canvasRef} className="hidden" />
          
          {/* BARRA DE ICONOS SUPERIOR */}
          {running && (
            <div className="absolute top-3 left-3 right-3 flex items-center justify-between gap-2 z-20">
              {/* Izquierda: Selector de cámara */}
              <div className="flex gap-2">
                <button
                  onClick={() => setShowCameraSelect(! showCameraSelect)}
                  className="p-2 bg-white/95 hover:bg-white rounded-full shadow-lg transition-all"
                  title="Cambiar cámara"
                >
                  <Camera className="h-5 w-5 text-gray-700" />
                </button>
                <button
                  onClick={refreshDevices}
                  className="p-2 bg-white/95 hover:bg-white rounded-full shadow-lg transition-all"
                  title="Refrescar cámaras"
                >
                  <RefreshCw className="h-5 w-5 text-gray-700" />
                </button>
              </div>

              {/* Derecha:  Botón cerrar */}
              <button
                onClick={stop}
                className="p-2 bg-red-500 hover:bg-red-600 text-white rounded-full shadow-lg transition-all"
                title="Detener"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          )}

          {/* Selector de cámara desplegable */}
          {showCameraSelect && running && (
            <div className="absolute top-16 left-3 right-3 bg-white/95 backdrop-blur rounded-lg shadow-xl p-3 z-20">
              <p className="text-xs font-semibold text-gray-700 mb-2">Seleccionar cámara: </p>
              <div className="space-y-1">
                {devices.map((d) => (
                  <button
                    key={d.deviceId}
                    onClick={() => {
                      setDeviceId(d.deviceId);
                      setShowCameraSelect(false);
                    }}
                    className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors ${
                      deviceId === d.deviceId
                        ? 'bg-blue-100 text-blue-700 font-medium'
                        : 'hover:bg-gray-100 text-gray-700'
                    }`}
                  >
                    {d.label || `Cámara ${d.deviceId. slice(0, 8)}`}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Estado escaneando - badge pequeño */}
          {running && (
            <div className="absolute top-16 left-1/2 -translate-x-1/2 px-3 py-1 bg-green-500/90 backdrop-blur rounded-full shadow-lg z-10">
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 bg-white rounded-full animate-pulse"></div>
                <span className="text-xs text-white font-medium">Escaneando</span>
              </div>
            </div>
          )}
          
          {/* Marco de escaneo */}
          {running && (
            <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
              <div className="relative w-2/3 h-2/3">
                <div className="absolute inset-0 border-2 border-emerald-400 rounded-lg">
                  {/* Esquinas */}
                  <div className="absolute top-0 left-0 w-6 h-6 border-t-4 border-l-4 border-emerald-400 -mt-0. 5 -ml-0.5"></div>
                  <div className="absolute top-0 right-0 w-6 h-6 border-t-4 border-r-4 border-emerald-400 -mt-0.5 -mr-0.5"></div>
                  <div className="absolute bottom-0 left-0 w-6 h-6 border-b-4 border-l-4 border-emerald-400 -mb-0.5 -ml-0.5"></div>
                  <div className="absolute bottom-0 right-0 w-6 h-6 border-b-4 border-r-4 border-emerald-400 -mb-0.5 -mr-0.5"></div>
                  {/* Línea de escaneo */}
                  <div className="absolute top-0 left-0 right-0 h-0.5 bg-emerald-400 shadow-glow animate-scan"></div>
                </div>
              </div>
            </div>
          )}
          
          {/* Botón iniciar centrado */}
          {! running && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-900/80 backdrop-blur-sm">
              <button
                onClick={start}
                className="p-6 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 rounded-full shadow-2xl transition-all transform hover:scale-105"
              >
                <Play className="h-12 w-12 text-white" fill="white" />
              </button>
              <p className="text-gray-300 text-sm mt-4">Toca para iniciar</p>
            </div>
          )}

          {/* Código detectado dentro */}
          {lastCode && running && (
            <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/90 to-transparent">
              <div className="bg-white/95 backdrop-blur rounded-lg p-3 shadow-lg">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-600 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="font-mono text-sm text-gray-900 break-all">
                      {lastCode}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Último código (cuando está detenido) */}
      {lastCode && !running && (
        <div className="p-4 bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 rounded-lg">
          <div className="flex items-start gap-3">
            <CheckCircle2 className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-gray-700 mb-1">Último código:</p>
              <p className="font-mono text-sm text-gray-900 break-all bg-white rounded px-3 py-2 border border-blue-200">
                {lastCode}
              </p>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}