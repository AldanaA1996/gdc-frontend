
import Layout from "@/app/components/layout";
import AddMaterialForm from "@/app/components/addMaterial-form";
import { useEffect, useState } from "react";
import { supabase } from "@/app/lib/supabaseClient";
import { toast } from "sonner";
import { TriangleAlert } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/app/components/ui/tabs";
import EgressMaterialForm from "@/app/components/egressMaterial";
import IngressMaterialForm from "@/app/components/ingressMaterial-form";
import { Button } from "@/app/components/ui/button";


export function Inventario() {
  const [materials, setMaterials] = useState<any[]>([]);
  const [alerted, setAlerted] = useState<Set<string>>(new Set());

  // Fetch materials on mount
  useEffect(() => {
    const fetchInitial = async () => {
      const { data: mats } = await supabase
        .from("inventory")
        .select("id,name,quantity,manufactur,min_quantity,unit");
      setMaterials((mats as any) || []);
    };
    fetchInitial();
  }, []);

  // Low-stock alerts
  useEffect(() => {
    if (!materials?.length) return;
    setAlerted((prev) => {
      const next = new Set(prev);
      materials.forEach((m) => {
        const min = typeof m.min_quantity === "number" ? m.min_quantity : undefined;
        if (min !== undefined && min >= 0 && typeof m.quantity === "number" && m.quantity <= min) {
          if (!next.has(m.id)) {
            toast.warning(`Stock bajo`, {
              description: `${m.name} ${m.manufactur || ""} — Cantidad: ${m.quantity}${m.unit ? " " + m.unit : ""}. Mínimo: ${min}.`.trim(),
              duration: 3500,
              icon: <TriangleAlert className="h-4 w-4" />,
            });
            next.add(m.id);
          }
        }
      });
      return next;
    });
  }, [materials]);
  return (
    <Layout>
      <div className="flex flex-col h-screen w-[100%] overflow-y-auto max-h-screen self-center gap-4 m-2 ">
        
        <Tabs defaultValue="egreso" className="w-full p-2 md:w-3/4">
          <TabsList className="w-full flex justify-center">
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
        <div className="bg-white px-4 mb-4 ">
          <AddMaterialForm />
        </div>
      </div>
    </Layout>
  );
}
export default Inventario;
