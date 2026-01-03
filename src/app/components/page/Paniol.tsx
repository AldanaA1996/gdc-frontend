"use client";

import { useState } from "react";
import BarcodeScanner from "../scanner";
import EgressTool from "../egressTool";
import ReturnTool from "../ingressTool";
import { useToolByBarcode } from "../../hooks/use-toolByBarcode";
import { toast } from "sonner";
import { X } from "lucide-react";
import { supabase } from "@/app/lib/supabaseClient";
import { useEffect } from "react";
import Layout from "../layout";

export default function ToolManagementPage() {
  const [showScanner, setShowScanner] = useState(true);
  const [activeTab, setActiveTab] = useState<"egress" | "return">("egress");
  const [scannedTool, setScannedTool] = useState<any | null>(null);
  const { findToolByBarcode } = useToolByBarcode();
  const [toolsInUseCount, setToolsInUseCount] = useState(0);

  // Manejar código detectado por el escáner
  const handleBarcodeDetected = async (code: { rawValue: string }) => {
  console.log('Código detectado:', code.rawValue);
  
  const tool = await findToolByBarcode(code.rawValue);
  
  if (tool) {
    console.log('Herramienta encontrada:', tool);
    
    // Validar según la pestaña activa
    if (activeTab === "egress") {
      if (tool.inUse) {
        toast.error(`La herramienta "${tool.name}" ya está en uso`);
        return;
      }
     
    } else {
      if (! tool.inUse) {
        toast.error(`La herramienta "${tool.name}" no está en uso`);
        return;
      }
      
    }
    
    // Pasar la herramienta al formulario
    setScannedTool(tool);
    console.log('Herramienta pasada al formulario:', tool);
  } else {
    // ✅ Solo toast para herramientas no encontradas
    toast.error(`No se encontró herramienta con código: ${code.rawValue}`);
  }
};
const fetchToolsInUse = async () => {
    const { data, error } = await supabase
      .from("tools")
      .select("id")
      .eq("inUse", true);
    if (!error) setToolsInUseCount(data?.length || 0);
  };

  useEffect(() => {
    fetchToolsInUse();
    // Opcional: refrescar cada cierto tiempo para mantener en tiempo real
    const interval = setInterval(fetchToolsInUse, 10000); // cada 10s
    return () => clearInterval(interval);
  }, []);

 

  return (
    <Layout>
    <div className="px-4 pt-2 pb-24 md:pb-6">
      {/* Escáner superior (siempre visible o con opción de cerrar) */}
      {showScanner && (
        <div className="mb-4 relative">
          <button
            onClick={() => setShowScanner(false)}
            className="absolute top-3 right-3 z-50 p-2 bg-red-500 hover:bg-red-600 text-white rounded-full shadow-lg transition-all"
            title="Cerrar escáner"
          >
            <X className="h-5 w-5" />
          </button>
          <BarcodeScanner
            onDetected={handleBarcodeDetected}
            autoStart={false}
          />
        </div>
      )}

      {/* Botón para mostrar escáner si está oculto */}
      {! showScanner && (
        <button
          onClick={() => setShowScanner(true)}
          className="mb-4 w-full p-3 bg-blue-100 hover:bg-blue-200 text-blue-700 rounded-lg transition-all flex items-center justify-center gap-2"
        >
          <span>📸</span>
          <span className="font-medium">Mostrar Escáner</span>
        </button>
      )}

      {/* Información sobre herramientas en uso */}
      <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
        <p className="text-sm text-blue-700 font-medium">
          📊 {toolsInUseCount} herramientas actualmente en uso
        </p>
      </div>

      {/* Tabs para Egreso/Ingreso */}
      <div className="flex gap-2 mb-4">
        <button
          onClick={() => {
            setActiveTab("egress");
            setScannedTool(null);
          }}
          className={`flex-1 py-2 px-4 rounded-lg font-medium transition-all ${
            activeTab === "egress"
              ? "bg-blue-600 text-white shadow-md"
              : "bg-gray-100 text-gray-700 hover:bg-gray-200"
          }`}
        >
          Egreso
        </button>
        <button
          onClick={() => {
            setActiveTab("return");
            setScannedTool(null);
          }}
          className={`flex-1 py-2 px-4 rounded-lg font-medium transition-all ${
            activeTab === "return"
              ? "bg-blue-600 text-white shadow-md"
              : "bg-gray-100 text-gray-700 hover:bg-gray-200"
          }`}
        >
          Ingreso
        </button>
      </div>

      {/* Formularios */}
      {activeTab === "egress" ?  (
        <EgressTool 
          scannedTool={scannedTool} 
          onToolProcessed={() => setScannedTool(null)}
        />
      ) : (
        <ReturnTool 
          scannedTool={scannedTool}
          onToolProcessed={() => setScannedTool(null)}
        />
      )}
    </div>
    </Layout>
  );
}