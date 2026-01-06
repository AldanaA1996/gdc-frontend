// hooks/use-barcode-scanner.ts
import { useState, useRef, useCallback, useEffect } from 'react';

export interface ScanResult {
  rawValue: string;
  format?:  string;
}

export interface ScannerConfig {
  autoStart?: boolean;
  scanDelay?: number;
  showLastCode?: boolean;
  autoResetAfterScan?: boolean;
  resetTrigger?: number;
  onDetected?: (code: ScanResult) => void;
  onClose?:  () => void;
}

export interface ScannerState {
  running: boolean;
  scanning: boolean;
  error: string | null;
  lastCode: string;
  lastFormat: string;
  scanCount: number;
  devices: MediaDeviceInfo[];
  selectedDeviceId: string;
  showCameraSelect: boolean;
  torchOn: boolean;
  torchSupported: boolean;
  soundEnabled: boolean;
}

export function useBarcodeScanner(config: ScannerConfig = {}) {
  const {
    autoStart = false,
    scanDelay = 1500,
    showLastCode = true,
    autoResetAfterScan = true,
    resetTrigger = 0,
    onDetected,
    onClose,
  } = config;

  // Refs
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const zxingReaderRef = useRef<any | null>(null);
  const zxingControlsRef = useRef<any | null>(null);
  const pauseTimeoutRef = useRef<NodeJS. Timeout | null>(null);
  const lastCodeRef = useRef<string>("");
  const lastScanTimeRef = useRef<number>(0);
  const audioContextRef = useRef<AudioContext | null>(null);
  const runningRef = useRef<boolean>(false); // 🔥
  const scanningRef = useRef<boolean>(true); // 🔥

  // State
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [running, setRunning] = useState(false);
  const [scanning, setScanning] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState<string>("");
  const [lastCode, setLastCode] = useState<string>("");
  const [lastFormat, setLastFormat] = useState<string>("");
  const [showCameraSelect, setShowCameraSelect] = useState(false);
  const [torchOn, setTorchOn] = useState(false);
  const [torchSupported, setTorchSupported] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [scanCount, setScanCount] = useState(0);

  // Detectar si es móvil
  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
    typeof navigator !== 'undefined' ? navigator. userAgent : ''
  );

  // 🔥 Sincronizar state con refs
  useEffect(() => {
    runningRef.current = running;
  }, [running]);

  useEffect(() => {
    scanningRef.current = scanning;
  }, [scanning]);

  // 🔊 Inicializar audio context
  useEffect(() => {
    if (typeof window !== 'undefined' && soundEnabled) {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    return () => {
      audioContextRef.current?.close();
    };
  }, [soundEnabled]);

  // 🔊 Reproducir beep
  const playSuccessBeep = useCallback(() => {
    if (!soundEnabled || !audioContextRef.current) return;
    
    try {
      const ctx = audioContextRef.current;
      const oscillator = ctx.createOscillator();
      const gainNode = ctx.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(ctx.destination);

      oscillator.frequency.value = 800;
      oscillator.type = 'sine';
      gainNode.gain.setValueAtTime(0.3, ctx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.15);

      oscillator.start(ctx.currentTime);
      oscillator.stop(ctx.currentTime + 0.15);
    } catch (error) {
      console.warn('Error playing beep:', error);
    }
  }, [soundEnabled]);

  // 📳 Vibración
  const vibrate = useCallback(() => {
    if (typeof navigator !== 'undefined' && navigator. vibrate) {
      navigator.vibrate(100);
    }
  }, []);

  // 📷 Refrescar dispositivos
  const refreshDevices = useCallback(async () => {
    try {
      const mediaDevices = await navigator.mediaDevices.enumerateDevices();
      const cams = mediaDevices.filter((d) => d.kind === "videoinput");
      setDevices(cams);
      
      if (cams.length > 0 && ! selectedDeviceId) {
        const backCam = cams. find((d) => /back|rear|environment/i.test(d.label));
        if (backCam) {
          setSelectedDeviceId(backCam.deviceId);
        }
      }
    } catch (err) {
      console.error('Error enumerating devices:', err);
    }
  }, [selectedDeviceId]);

  // 🧹 Limpiar stream
 // hooks/use-barcode-scanner. ts
// Reemplaza la función cleanupStream: 

const cleanupStream = useCallback(() => {
  console.log('🧹 Cleanup stream llamado');
  
  if (pauseTimeoutRef.current) {
    clearTimeout(pauseTimeoutRef. current);
    pauseTimeoutRef.current = null;
  }

  // 🔥 NO detener controles ni stream aquí si está corriendo
  if (runningRef.current) {
    console.log('⚠️ Scanner corriendo, NO limpiando stream');
    return;
  }

  if (zxingControlsRef.current) {
    try {
      zxingControlsRef.current. stop?. ();
    } catch {}
    zxingControlsRef.current = null;
  }

  if (zxingReaderRef.current) {
    try {
      zxingReaderRef.current.reset?.();
    } catch {}
  }
  
  if (stream) {
    stream.getTracks().forEach((t) => t.stop());
  }
  
  if (videoRef.current) {
    videoRef.current.srcObject = null;
  }
}, [stream]);

  // 🛑 Detener scanner
 const stop = useCallback(() => {
  console.log('🛑 Deteniendo scanner...');
  
  setRunning(false);
  setScanning(false);
  runningRef.current = false;
  scanningRef.current = false;

  // Detener controles de ZXing PRIMERO
  if (zxingControlsRef.current) {
    try {
      console.log('🛑 Deteniendo controles ZXing');
      zxingControlsRef.current.stop?. ();
    } catch (e) {
      console.warn('Error deteniendo controles:', e);
    }
    zxingControlsRef.current = null;
  }

  // Resetear reader
  if (zxingReaderRef.current) {
    try {
      console.log('🛑 Reseteando reader');
      zxingReaderRef.current.reset?.();
    } catch (e) {
      console.warn('Error reseteando reader:', e);
    }
    zxingReaderRef.current = null;
  }

  // Detener stream
  if (stream) {
    console.log('🛑 Deteniendo stream');
    stream.getTracks().forEach((t) => {
      console.log('Deteniendo track:', t.label);
      t.stop();
    });
  }
  
  // Limpiar video element
  if (videoRef.current) {
    videoRef.current.srcObject = null;
  }

  cleanupStream();
  setStream(null);
  setTorchOn(false);
  
  console.log('✅ Scanner detenido');
}, [stream, cleanupStream]);
  // ⏸️ Pausar temporalmente
  const pauseScanning = useCallback((duration: number) => {
    setScanning(false);
    scanningRef.current = false;
    
    if (pauseTimeoutRef. current) {
      clearTimeout(pauseTimeoutRef.current);
    }

    pauseTimeoutRef.current = setTimeout(() => {
      setScanning(true);
      scanningRef.current = true;
      lastCodeRef.current = "";
      if (showLastCode) {
        setLastCode("");
        setLastFormat("");
      }
    }, duration);
  }, [showLastCode]);

  // 🎯 Manejar detección
  const handleDetection = useCallback((code:  string, format?:  string) => {

    if (!scanningRef.current) {
      return;
    }

    const now = Date.now();
    
    if (code === lastCodeRef.current && (now - lastScanTimeRef.current) < 300) {
     
      return;
    }

    if (! code || code. length < 3) {
      console.log('❌ Código inválido o muy corto');
      return;
    }

    console. log('✅ Código válido, procesando.. .');

    lastScanTimeRef.current = now;
    lastCodeRef.current = code;
    
    if (showLastCode) {
      setLastCode(code);
      setLastFormat(format || 'UNKNOWN');
    }
    
    setScanCount(prev => prev + 1);

    playSuccessBeep();
    vibrate();

    console.log('📞 Llamando onDetected callback.. .');
    onDetected?.({ rawValue: code, format });
    console.log('✅ onDetected callback ejecutado');

    if (autoResetAfterScan) {
      console.log('⏰ Pausando scanner por', scanDelay, 'ms');
      pauseScanning(scanDelay);
    }
  }, [onDetected, playSuccessBeep, vibrate, autoResetAfterScan, scanDelay, pauseScanning, showLastCode]);

  // 🎥 Iniciar ZXing
 // hooks/use-barcode-scanner. ts
// Reemplaza la función startZxing completa: 

const startZxing = useCallback(async (useId?:  string) => {
  console.log('🎥 ========== INICIANDO ZXING ==========');
  console.log('📹 Device ID:', useId);
  
  try {
    setError(null);
    setRunning(true);
    setScanning(true);
    runningRef.current = true;
    scanningRef.current = true;
    
    console.log('📦 Importando ZXing...');
    const mod:  any = await import("@zxing/browser");
    const { BrowserMultiFormatReader, BarcodeFormat } = mod;
    console.log('✅ ZXing importado');
    
    // Crear reader SIN hints para mejor compatibilidad
    console.log('🔧 Creando reader');
    const reader: any = new BrowserMultiFormatReader();
    
    zxingReaderRef.current = reader;

    if (! videoRef.current) {
      throw new Error('Video element no disponible');
    }

    console.log('🎬 Iniciando decodeFromVideoDevice.. .');
    console.log('📺 Video element:', videoRef.current);

    // 🔥 CRÍTICO: NO usar await aquí, la función es continua
    reader.decodeFromVideoDevice(
      useId || undefined,
      videoRef.current,
      (result: any, err: any, controls: any) => {
        // Guardar controles en la primera llamada
        if (controls && ! zxingControlsRef.current) {
          console.log('💾 Guardando controles');
          zxingControlsRef.current = controls;
        }

        // Log cada vez que se ejecuta (incluso sin resultado)
        if (result) {
          console.log('🔔 ========== CÓDIGO DETECTADO ==========');
          console.log('📊 runningRef.current:', runningRef.current);
          console.log('📊 scanningRef. current:', scanningRef.current);
          console.log('📦 result:', result);
          
          if (! runningRef.current || !scanningRef.current) {
            console.log('⏸️ Scanner no activo, ignorando');
            return;
          }
          
          const text = result.getText?.() ?? String(result);
          console. log('✅ Texto detectado:', text);
          
          if (text) {
            const format = result.getBarcodeFormat?. ()?.toString();
            console.log('📞 Llamando handleDetection');
            handleDetection(text, format);
          }
        }
      }
    );

    console.log('⏰ Esperando inicialización del stream...');

    // Esperar a que el stream esté disponible
    let attempts = 0;
    const maxAttempts = 20;
    
    const waitForStream = async (): Promise<MediaStream | null> => {
      return new Promise((resolve) => {
        const checkStream = () => {
          attempts++;
          const ms = videoRef.current?.srcObject as MediaStream;
          
          if (ms && ms.active) {
            console.log('✅ Stream obtenido en intento', attempts);
            resolve(ms);
          } else if (attempts >= maxAttempts) {
            console. warn('⚠️ No se pudo obtener stream después de', maxAttempts, 'intentos');
            resolve(null);
          } else {
            setTimeout(checkStream, 100);
          }
        };
        checkStream();
      });
    };

    const ms = await waitForStream();
    
    if (ms) {
      setStream(ms);
      console.log('📹 Stream configurado');
      console.log('🎥 Video tracks:', ms.getVideoTracks().length);
      console.log('🎬 Stream activo:', ms.active);

      // Configurar track
      try {
        const track = ms.getVideoTracks()[0];
        if (track) {
          console.log('🎬 Track:', track.label);
          console. log('📊 Track state:', track.readyState);
          console.log('📊 Track enabled:', track.enabled);

          const capabilities: any = (track as any).getCapabilities?.();
          if (capabilities) {
            console.log('🎛️ Capabilities:', Object.keys(capabilities));
            const canTorch = !!capabilities. torch;
            setTorchSupported(canTorch);
            console.log('💡 Torch soportado:', canTorch);
          }
        }
      } catch (err) {
        console.warn('⚠️ Error obteniendo capabilities:', err);
      }
    } else {
      console.error('❌ No se pudo obtener el stream');
      throw new Error('No se pudo obtener acceso a la cámara');
    }

    console.log('🎉 ========== ZXING INICIADO EXITOSAMENTE ==========');

  } catch (e: any) {
    console.error('❌ ========== ERROR EN ZXING ==========');
    console.error('Error completo:', e);
    setError(e.message || "No se pudo iniciar el lector de códigos.");
    setRunning(false);
    setScanning(false);
    runningRef.current = false;
    scanningRef.current = false;
  }
}, [handleDetection]);

  // ▶️ Iniciar scanner
  const start = useCallback(async () => {
    setError(null);
    setShowCameraSelect(false);
    
    try {
      await refreshDevices();
      const cams = devices.length ?  devices : [];
      const backCam = cams.find((d) => /back|rear|environment/i.test(d. label));
      const chosenId = selectedDeviceId || backCam?. deviceId || cams[cams.length - 1]?.deviceId;
      
      await startZxing(chosenId);
      await refreshDevices();
    } catch (e:  any) {
      console.error('Scanner start error:', e);
      const errorMessage = e?. message || e?.name || "No se pudo acceder a la cámara";
      
      if (errorMessage.includes('denied') || errorMessage.includes('Permission')) {
        setError('⚠️ Permisos de cámara denegados.');
      } else if (errorMessage.includes('NotFoundError')) {
        setError('📷 No se encontró ninguna cámara.');
      } else if (errorMessage.includes('NotReadableError')) {
        setError('🔒 La cámara está siendo usada por otra aplicación.');
      } else {
        setError(errorMessage);
      }
      
      setRunning(false);
      setScanning(false);
      runningRef.current = false;
      scanningRef.current = false;
    }
  }, [selectedDeviceId, devices, refreshDevices, startZxing]);

  // 🔦 Toggle linterna
  const toggleTorch = useCallback(async () => {
    try {
      const ms = videoRef.current?.srcObject as MediaStream | null;
      const track:  any = ms?.getVideoTracks?.()?.[0];
      
      if (track) {
        await track.applyConstraints({ 
          advanced: [{ torch:  !torchOn }] 
        });
        setTorchOn(!torchOn);
      }
    } catch (error) {
      console.error('Error toggling torch:', error);
    }
  }, [torchOn]);

  // 🔄 Reset manual
  const resetScanner = useCallback(() => {
    lastCodeRef.current = "";
    setLastCode("");
    setLastFormat("");
    setScanning(true);
    scanningRef.current = true;
    
    if (pauseTimeoutRef.current) {
      clearTimeout(pauseTimeoutRef.current);
      pauseTimeoutRef.current = null;
    }
  }, []);

  // Auto-start
  useEffect(() => {
    if (autoStart) start();
    return () => stop();
  }, [autoStart]);

  // Escuchar resetTrigger
  useEffect(() => {
    if (resetTrigger > 0 && running) {
      resetScanner();
    }
  }, [resetTrigger, running, resetScanner]);

  // Cambio de cámara
  useEffect(() => {
    if (! running || !selectedDeviceId) return;
    
    const switchCamera = async () => {
      if (zxingControlsRef.current) {
        try {
          zxingControlsRef.current. stop?.();
        } catch {}
      }

      if (stream) {
        stream.getTracks().forEach((t) => t.stop());
      }

      await new Promise((r) => setTimeout(r, 100));
      await startZxing(selectedDeviceId);
    };

    switchCamera();
  }, [selectedDeviceId]);

  // Cleanup
  useEffect(() => {
    return () => {
      cleanupStream();
    };
  }, [cleanupStream]);

  // Estado público
  const state:  ScannerState = {
    running,
    scanning,
    error,
    lastCode,
    lastFormat,
    scanCount,
    devices,
    selectedDeviceId,
    showCameraSelect,
    torchOn,
    torchSupported,
    soundEnabled,
  };

  // Acciones públicas
  const actions = {
    start,
    stop,
    resetScanner,
    toggleTorch,
    setSoundEnabled,
    setShowCameraSelect,
    setSelectedDeviceId,
    refreshDevices,
  };

  return {
    videoRef,
    state,
    actions,
    isMobile,
  };
}