"use client";

import { useState, useEffect, useCallback } from "react";
import BarcodeScanner from "../BarcodeScanner";
import EgressTool from "../egressTool";
import ReturnTool from "../ingressTool";
import { useToolByBarcode } from "../../hooks/use-toolByBarcode";
import { toast } from "sonner";
import { X, ScanLine } from "lucide-react";
import { supabase } from "@/app/lib/supabaseClient";
import Layout from "../layout";

export default function ToolManagementPage() {
  const [showScanner, setShowScanner] = useState(true);
  const [activeTab, setActiveTab] = useState<"egress" | "return">("egress");
  const [scannedTool, setScannedTool] = useState<any | null>(null);
  const [resetTrigger, setResetTrigger] = useState(0);
  const [toolsInUseCount, setToolsInUseCount] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  
  const { findToolByBarcode, loading:  searchingTool } = useToolByBarcode();

  const fetchToolsInUse = useCallback(async () => {
    const { data, error } = await supabase
      .from("tools")
      .select("id")
      .eq("inUse", true);
    
    if (! error) {
      setToolsInUseCount(data?. length || 0);
    }
  }, []);

  useEffect(() => {
    fetchToolsInUse();
    const interval = setInterval(fetchToolsInUse, 10000);
    return () => clearInterval(interval);
  }, [fetchToolsInUse]);

  // 🔥 Manejar código detectado con MUCHOS logs
  const handleBarcodeDetected = useCallback(async (code: { rawValue: string; format?:  string }) => {
   

    if (isProcessing) {
      console.log('⏸️ Ya procesando, saliendo.. .');
      return;
    }

    setIsProcessing(true); 
    try {
     
      const tool = await findToolByBarcode(code.rawValue);
      
    
      
      if (!tool) {
        console.warn('❌ No se encontró herramienta');
        toast.error('Herramienta no encontrada', {
          description: `Código: ${code.rawValue}`,
        });
        setIsProcessing(false);
        return;
      }

      console.log('✅ Herramienta encontrada:', {
        id: tool.id,
        name: tool.name,
        inUse: tool.inUse
      });
      
      // Toast informativo sin bloquear
      if (activeTab === "egress") {
        if (tool.inUse) {
         
          toast.warning('⚠️ Herramienta ya en uso', {
            description:  `"${tool.name}" está prestada.  ¿Querías devolverla?  Cambia a Ingreso. `,
            duration: 4000,
          });
        } else {
          
          toast.success('✅ Herramienta disponible', {
            description: `${tool.name} - Lista para prestar`,
          });
        }
      } else {
        if (! tool.inUse) {
         
          toast.warning('⚠️ Herramienta disponible', {
            description: `"${tool.name}" no está en uso. ¿Querías prestarla? Cambia a Egreso.`,
            duration: 4000,
          });
        } else {
         
          toast.success('✅ Herramienta en uso', {
            description: `${tool.name} - Lista para devolver`,
          });
        }
      }
      
      // SIEMPRE pasar la herramienta
     
      setScannedTool(tool);
      
      
    } catch (error: any) {
      console.error('❌ ERROR en handleBarcodeDetected:', error);
      toast.error('Error al buscar herramienta', {
        description: error.message || 'Intenta nuevamente',
      });
    } finally {
      console.log('🏁 Finalizando procesamiento');
      setIsProcessing(false);
    }
  }, [activeTab, findToolByBarcode, isProcessing]);

  // 🔥 Log cuando cambia scannedTool
  useEffect(() => {
  
  }, [scannedTool]);

  const handleToolProcessed = useCallback(() => {
    console.log('✅ ========== TOOL PROCESSED ==========');
    setScannedTool(null);
    setResetTrigger(prev => prev + 1);
    fetchToolsInUse();
    setIsProcessing(false);
  }, [fetchToolsInUse]);

  const handleTabChange = useCallback((tab: "egress" | "return") => {
    console.log('🔄 ========== CAMBIO DE TAB ==========');
    console.log('De:', activeTab, '-> A:', tab);
    setActiveTab(tab);
    setScannedTool(null);
    setResetTrigger(prev => prev + 1);
  }, [activeTab]);

  return (
    <Layout>
      <div className="px-2 md:px-4 mx-auto pt-2 pb-24 md:pb-6">
        {/* Escáner superior */}
        {showScanner && (
          <div className="mb-4 relative bg-white rounded-lg shadow-lg p-4 border-2 border-gray-200">
            <button
              onClick={() => setShowScanner(false)}
              className="absolute top-3 right-3 z-50 p-2 bg-red-500 hover:bg-red-600 text-white rounded-full shadow-lg transition-all hover:scale-105"
              title="Cerrar escáner"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="mb-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ScanLine className="h-5 w-5 text-blue-600" />
                <h3 className="font-semibold text-gray-800">
                  Escáner de Códigos
                </h3>
              </div>
              {searchingTool && (
                <span className="text-xs px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full flex items-center gap-1">
                  <span className="animate-spin">⏳</span>
                  Buscando...
                </span>
              )}
            </div>

            <BarcodeScanner
              onDetected={handleBarcodeDetected}
              autoStart={true}
              scanDelay={1500}
              showLastCode={true}
              autoResetAfterScan={true}
              resetTrigger={resetTrigger}
            />
          </div>
        )}

        {! showScanner && (
          <button
            onClick={() => setShowScanner(true)}
            className="mb-4 w-full p-4 bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 text-white rounded-lg transition-all flex items-center justify-center gap-2 shadow-lg hover:shadow-xl transform hover:scale-[1.02]"
          >
            <ScanLine className="h-5 w-5" />
            <span className="font-semibold">Abrir Escáner de Códigos</span>
          </button>
        )}

       
        {/* Tabs */}
        <div className="flex gap-2 mb-4">
          <button
            onClick={() => handleTabChange("egress")}
            className={`flex-1 py-3 px-4 rounded-lg font-semibold transition-all transform ${
              activeTab === "egress"
                ? "bg-linear-to-r from-blue-600 to-indigo-600 text-white shadow-lg"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            <div className="flex items-center justify-center gap-2">
              <span>📤</span>
              <span>Egreso</span>
            </div>
          </button>
          <button
            onClick={() => handleTabChange("return")}
            className={`flex-1 py-3 px-4 rounded-lg font-semibold transition-all transform ${
              activeTab === "return"
                ? "bg-linear-to-r from-green-600 to-emerald-600 text-white shadow-lg"
                : "bg-gray-100 text-gray-700 hover: bg-gray-200 "
            }`}
          >
            <div className="flex items-center justify-center gap-2">
              <span>📥</span>
              <span>Ingreso</span>
            </div>
          </button>
        </div>

        {/* Indicador de herramienta escaneada */}
        {/* {scannedTool && (
          <div className="mb-4 p-4 bg-green-50 border-2 border-green-300 rounded-lg shadow-md animate-in fade-in slide-in-from-top-2 duration-300">
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xl">✅</span>
                  <p className="font-semibold text-green-800">
                    Herramienta detectada
                  </p>
                </div>
                <p className="text-lg font-bold text-gray-900 mb-1">
                  {scannedTool.name}
                </p>
                {scannedTool.barcode && (
                  <p className="text-sm text-gray-700 font-mono">
                    Código: {scannedTool.barcode}
                  </p>
                )}
                <p className="text-xs text-gray-600 mt-2">
                  Estado: {scannedTool. inUse ? "En uso" : "Disponible"}
                </p>
              </div>
              <button
                onClick={() => {
                  setScannedTool(null);
                  setResetTrigger(prev => prev + 1);
                }}
                className="p-2 bg-green-200 hover:bg-green-300 text-green-800 rounded-full transition-all"
                title="Cancelar"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
        )} */}

        {/* Formularios */}
        <div className="bg-white rounded-lg shadow-lg p-4 border border-gray-200">
          {activeTab === "egress" ?  (
            <EgressTool 
              scannedTool={scannedTool} 
              onToolProcessed={handleToolProcessed}
              onToolUpdate={fetchToolsInUse}
            />
          ) : (
            <ReturnTool 
              scannedTool={scannedTool}
              onToolProcessed={handleToolProcessed}
              onToolUpdate={fetchToolsInUse}
            />
          )}
        </div>
         <div className="mb-4 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-lg shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-blue-600 font-medium mb-1">
                Estado del inventario
              </p>
              <p className="text-2xl font-bold text-blue-700">
                {toolsInUseCount} {toolsInUseCount === 1 ? 'herramienta' : 'herramientas'}
              </p>
              <p className="text-xs text-blue-600">
                actualmente en uso
              </p>
            </div>
            <div className="text-5xl">
              📊
            </div>
          </div>
        </div>

      </div>
    </Layout>
  );
}