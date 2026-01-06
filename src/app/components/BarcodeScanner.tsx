// components/BarcodeScanner.tsx
"use client"

import React from "react";
import { 
  Camera, 
  RefreshCw, 
  CameraOff,
  AlertCircle,
  CheckCircle2,
  Play,
  Zap,
  ZapOff,
  Volume2,
  VolumeX
} from "lucide-react";
import { useBarcodeScanner } from "@/app/hooks/use-barcode-scanner";
import type { ScannerConfig } from "@/app/hooks/use-barcode-scanner";

export default function BarcodeScanner(config: ScannerConfig) {
  // 🔥 Log para verificar que recibe la prop
  console.log('🎬 BarcodeScanner renderizado con config:', {
    hasOnDetected: !!config.onDetected,
    autoStart: config.autoStart,
    scanDelay: config.scanDelay,
  });

  const { videoRef, state, actions, isMobile } = useBarcodeScanner(config);

  // 🔥 Log cuando cambia el estado
  React.useEffect(() => {
    console.log('📊 Estado del scanner:', {
      running: state.running,
      scanning: state.scanning,
      lastCode: state.lastCode,
      scanCount: state.scanCount,
    });
  }, [state.running, state.scanning, state.lastCode, state.scanCount]);

  return (
    <div className="pb-2">
      {/* Error */}
      {state.error && (
        <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-lg mb-4">
          <AlertCircle className="h-4 w-4 text-red-600 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm text-red-700">{state.error}</p>
          </div>
        </div>
      )}

      {/* Video preview */}
      <div className="relative w-full max-w-md mx-auto">
        <div className="relative rounded-lg shadow-2xl overflow-visible">
          <div className="overflow-hidden rounded-lg">
            <video 
              ref={videoRef} 
              className="w-full h-auto min-h-[200px] max-h-[500px] object-cover aspect-video bg-black" 
              playsInline 
              muted 
              autoPlay
            />
          </div>
          
          {/* Barra superior de controles */}
          {state.running && (
            <div className="absolute top-3 left-3 right-3 flex items-center justify-between gap-2 z-20">
              {/* Izquierda */}
              <div className="flex gap-2">
                <button
                  onClick={() => actions.setShowCameraSelect(! state.showCameraSelect)}
                  className="p-2.5 bg-white/95 hover:bg-white rounded-full shadow-lg transition-all hover:scale-105"
                  title="Cambiar cámara"
                >
                  <Camera className="h-4 md:h-6 w-4 md:w-6 text-gray-700" />
                </button>
                
                {state.torchSupported && (
                  <button
                    onClick={actions.toggleTorch}
                    className={`p-2.5 rounded-full shadow-lg transition-all hover:scale-105 ${
                      state.torchOn 
                        ? 'bg-yellow-400 hover:bg-yellow-500' 
                        : 'bg-white/95 hover:bg-white'
                    }`}
                    title={state.torchOn ? 'Apagar linterna' : 'Encender linterna'}
                  >
                    {state.torchOn ? (
                      <Zap className="h-4 md:h-6 w-4 md:w-6 text-yellow-900" />
                    ) : (
                      <ZapOff className="h-4 md:h-6 w-4 md:w-6 text-gray-700" />
                    )}
                  </button>
                )}

                <button
                  onClick={() => actions.setSoundEnabled(!state.soundEnabled)}
                  className="p-2.5 bg-white/95 hover:bg-white rounded-full shadow-lg transition-all hover: scale-105"
                  title={state.soundEnabled ? 'Silenciar' : 'Activar sonido'}
                >
                  {state.soundEnabled ? (
                    <Volume2 className="h-4 md:h-6 w-4 md:w-6 text-gray-700" />
                  ) : (
                    <VolumeX className="h-4 md:h-6 w-4 md:w-6 text-gray-700" />
                  )}
                </button>
              </div>

              {/* Derecha */}
              <div className="flex gap-2">
                <button
                  onClick={actions.refreshDevices}
                  className="p-2.5 bg-white/95 hover:bg-white rounded-full shadow-lg transition-all hover:scale-105"
                  title="Refrescar"
                >
                  <RefreshCw className="h-4 md:h-6 w-4 md:w-6 text-gray-700" />
                </button>
                
                <button
                  onClick={() => {
                    actions.stop();
                    config.onClose?. ();
                  }}
                  className="p-2.5 bg-red-500 hover:bg-red-600 text-white rounded-full shadow-lg transition-all hover:scale-105"
                  title="Cerrar"
                >
                  <CameraOff className="h-4 md:h-6 w-4 md:w-6" />
                </button>
              </div>
            </div>
          )}

          {/* Selector de cámara */}
          {state.showCameraSelect && state.running && state.devices.length > 0 && (
            <div className="absolute top-16 left-3 right-3 bg-white/98 backdrop-blur-sm rounded-xl shadow-2xl p-3 z-20 max-h-[60vh] overflow-y-auto overscroll-contain">
              <p className="text-xs font-semibold text-gray-700 mb-2 px-1">
                📷 Seleccionar cámara ({state.devices.length})
              </p>
              <div className="space-y-1">
                {state.devices.map((d, idx) => (
                  <button
                    key={d.deviceId}
                    onClick={() => {
                      actions.setSelectedDeviceId(d.deviceId);
                      actions.setShowCameraSelect(false);
                    }}
                    className={`w-full text-left px-3 py-2.5 rounded-lg text-sm transition-all ${
                      state.selectedDeviceId === d. deviceId
                        ? 'bg-blue-500 text-white font-medium shadow-md'
                        : 'hover:bg-gray-100 text-gray-700'
                    }`}
                  >
                    {d. label || `Cámara ${idx + 1}`}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Badge estado */}
          {state.running && (
            <div className="absolute top-3 left-1/2 rounded-full -translate-x-1/2 z-10">
              <div className={`px-4 py-3  shadow-lg rounded-full transition-all ${
                state.scanning 
                  ? 'bg-gradient-to-r from-green-500 to-emerald-500'
                  : 'bg-gradient-to-r from-orange-500 to-amber-500'
              }`}>
                <div className="flex items-center gap-2">
                  {state.scanning ?  (
                    <>
                      <div className="h-3 w-3 bg-white rounded-full animate-pulse"></div>
                      <span className="text-xs text-white font-semibold">
                        Activo {state.scanCount > 0 && `(${state.scanCount})`}
                      </span>
                    </>
                  ) : (
                    <>
                      <div className="h-2 w-2 bg-white rounded-full"></div>
                      <span className="text-xs text-white font-semibold">
                        Procesando... 
                      </span>
                    </>
                  )}
                </div>
              </div>
            </div>
          )}
          
          {/* Marco de escaneo */}
          {state.running && state.scanning && (
            <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
              <div className="relative w-4/5 h-[70%]">
                <div className="absolute inset-0 top-8 bottom-0">
                  <div className="absolute -top-1 -left-1 w-8 h-8 border-t-4 border-l-4 border-emerald-400 rounded-tl-2xl"></div>
                  <div className="absolute -top-1 -right-1 w-8 h-8 border-t-4 border-r-4 border-emerald-400 rounded-tr-2xl"></div>
                  <div className="absolute -bottom-1 -left-1 w-8 h-8 border-b-4 border-l-4 border-emerald-400 rounded-bl-2xl"></div>
                  <div className="absolute -bottom-1 -right-1 w-8 h-8 border-b-4 border-r-4 border-emerald-400 rounded-br-2xl"></div>
                  
                  
                </div>
              </div>
            </div>
          )}
          
          {/* Botón iniciar */}
          {!state.running && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-b from-gray-900/90 to-black/80 backdrop-blur-sm">
              <button
                onClick={actions.start}
                className="group relative p-8 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 rounded-full shadow-2xl transition-all transform hover:scale-110 active:scale-95"
              >
                <Play className="h-10 w-10 text-white group-hover:scale-110 transition-transform" fill="white" />
              </button>
              <p className="text-white text-base font-medium mt-6 drop-shadow-lg">
                {isMobile ? 'Toca para iniciar' : 'Click para iniciar'}
              </p>
            </div>
          )}

          {/* Código detectado */}
          {/* {config.showLastCode && state.lastCode && state.running && (
            <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/95 via-black/80 to-transparent">
              <div className="bg-green-500/95 backdrop-blur-sm rounded-xl p-4 shadow-2xl border-2 border-green-400">
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="h-6 w-6 text-white flex-shrink-0 animate-bounce" />
                  <div className="flex-1 min-w-0">
                    <p className="font-mono text-lg font-bold text-white break-all">
                      {state.lastCode}
                    </p>
                    <p className="text-xs text-green-100 mt-1">
                      {state.lastFormat}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )} */}
        </div>
      </div>

      
    </div>
  );
}