import Layout from "@/app/components/layout";
import { useEffect, useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/app/components/ui/tabs";

import { supabase } from "@/app/lib/supabaseClient";
import { toast } from "sonner";
import { useAuthenticationStore } from "@/app/store/authentication";
import { TriangleAlert } from "lucide-react";

import EgressMaterialForm from "@/app/components/egressMaterial";
import IngressMaterialForm from "@/app/components/ingressMaterial-form";

import EgressTool from "../egressTool";
import ReturnTool from "../ingressTool";

export default function Pañol() {
  const [materials, setMaterials] = useState<any[]>([]);
  const [alerted, setAlerted] = useState<Set<string>>(new Set());
  const [toolsInUseCount, setToolsInUseCount] = useState<number>(0);

  // FETCH MATERIALS
  useEffect(() => {
    const fetchInitial = async () => {
      const { data: mats } = await supabase
        .from("inventory")
        .select("id,name,quantity,manufactur,min_quantity");
      setMaterials((mats as any) || []);
    };
    fetchInitial();
  }, []);

  const refreshMaterials = async () => {
    const { data } = await supabase
      .from("inventory")
      .select("id,name,quantity,manufactur,min_quantity");
    setMaterials((data as any) || []);
  };

  // LOW-STOCK ALERTS
  useEffect(() => {
    if (!materials?.length) return;
    setAlerted((prev) => {
      const next = new Set(prev);
      materials.forEach((m) => {
        const min = typeof m.min_quantity === 'number' ? m.min_quantity : undefined;
        if (min !== undefined && min >= 0 && typeof m.quantity === 'number' && m.quantity <= min) {
          if (!next.has(m.id)) {
            toast.warning(`Stock bajo: ${m.name} ${m.manufactur}`, {
              description: `Cantidad actual: ${m.quantity}${m.unit ? ' ' + m.unit : ''}. Mínimo definido: ${min}.`,
              duration: 3000,
              icon: <TriangleAlert />
            });
            next.add(m.id);
          }
        }
      });
      return next;
    });
  }, [materials]);

  // FETCH TOOLS IN USE COUNT
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

  // Esta función se puede pasar a EgressTool y ReturnTool para refrescar el contador después de prestar/devolver
  const handleToolsUpdate = () => fetchToolsInUse();

  return (
    <Layout>
      <div className="flex flex-col w-full p-6">
        <h1 className="text-xl font-semibold mb-4">Movimientos diarios de ingresos y egresos</h1>

        {/* CONTADOR DE HERRAMIENTAS EN USO */}
        <div className="mb-4 p-2 bg-yellow-50 border border-yellow-200 rounded text-sm font-medium">
          {toolsInUseCount} herramienta{toolsInUseCount !== 1 ? "s" : ""} actualmente en uso
        </div>

        <h2>Herramientas</h2>
        <Tabs defaultValue="egress" className="w-full md:w-3/4 py-4 px-2">
          <TabsList className="w-full flex justify-center mb-2">
            <TabsTrigger value="egress">Egreso</TabsTrigger>
            <TabsTrigger value="ingress">Ingreso</TabsTrigger>
          </TabsList>

          <TabsContent value="egress">
            <EgressTool onToolUpdate={handleToolsUpdate} />
          </TabsContent>
          <TabsContent value="ingress">
            <ReturnTool onToolUpdate={handleToolsUpdate} />
          </TabsContent>
        </Tabs>

        <h2>Materiales</h2>
        <Tabs defaultValue="egreso" className="w-full md:w-3/4 py-4 px-2">
          <TabsList className="w-full flex justify-center mb-2">
            <TabsTrigger value="egreso">Egreso</TabsTrigger>
            <TabsTrigger value="ingreso">Ingreso</TabsTrigger>
          </TabsList>

          <TabsContent value="ingreso">
            <IngressMaterialForm />
          </TabsContent>

          <TabsContent value="egreso">
            <EgressMaterialForm />
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
}
