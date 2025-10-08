import { useEffect, useMemo, useRef, useState } from "react";
import Layout from "@/app/components/layout";
import { supabase } from "@/app/lib/supabaseClient";
import { Input } from "@/app/components/ui/input";
import { Card } from "@/app/components/ui/card";
import { Button } from "@/app/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/app/components/ui/dialog";
import EditMaterialForm from "@/app/components/editMaterial";
import EditToolForm from "@/app/components/editTool";
import { SquarePen, Eye, Trash2, Package, Wrench, Download } from "lucide-react";
import downloadInventoryCsv from "@/app/components/csvDownload";

// Types
type Inventory = {
  id: number;
  name: string;
  quantity: number;
  unit: string | null;
  min_quantity?: number | null;
  weight?: number | null;
  width?: number | null;
  height?: number | null;
  color?: string | null;
  manufactur?: string | null;
  barcode?: number | null;
  hasQRcode?: boolean | null;
  description?: string | null;
};

type Tool = {
  id: number;
  name: string;
  quantity: number;
  unit: string | null;
  min_quantity?: number | null;
  manufactur?: string | null;
  barcode?: number | null;
  description?: string | null;
  status?: string | null;
};

type SearchItem = (Inventory | Tool) & {
  itemType: 'material' | 'tool';
};

export default function SearchPage() {
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(true);
  const [materials, setMaterials] = useState<Inventory[]>([]);
  const [tools, setTools] = useState<Tool[]>([]);
  const [onlyLow, setOnlyLow] = useState<boolean>(false);
  const [filterType, setFilterType] = useState<'all' | 'materials' | 'tools'>('all');
  
  // Infinite scroll state
  const PAGE_SIZE = 20;
  const [visible, setVisible] = useState(PAGE_SIZE);
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  // View/Edit dialog state
  const [openView, setOpenView] = useState(false);
  const [openEdit, setOpenEdit] = useState(false);
  const [selectedItem, setSelectedItem] = useState<SearchItem | null>(null);

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<
    { type: "material" | "tool"; id: number; name: string } | null
  >(null);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const [matRes, toolRes] = await Promise.all([
          supabase.from("inventory").select("*"),
          supabase.from("tools").select("*"),
        ]);
        
        if (!matRes.error && matRes.data) setMaterials(matRes.data as Inventory[]);
        else if (matRes.error) console.error("Error al cargar materiales:", matRes.error);

        if (!toolRes.error && toolRes.data) setTools(toolRes.data as Tool[]);
        else if (toolRes.error) console.error("Error al cargar herramientas:", toolRes.error);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  // Reset visible count when search term changes
  useEffect(() => {
    setVisible(PAGE_SIZE);
  }, [q, filterType]);

  // IntersectionObserver for infinite reveal
  useEffect(() => {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) {
          setVisible((v) => v + PAGE_SIZE);
        }
      });
    });
    const node = sentinelRef.current;
    if (node) observer.observe(node);
    return () => {
      if (node) observer.unobserve(node);
      observer.disconnect();
    };
  }, [sentinelRef.current, PAGE_SIZE]);

  const handleDeleteMaterial = async (id: number) => {
    const { error } = await supabase.from("inventory").delete().eq("id", id);
    if (error) {
      console.error("Error al eliminar el material:", error);
    } else {
      setMaterials((prev) => prev.filter((m) => m.id !== id));
    }
  };

  const handleDeleteTool = async (id: number) => {
    const { error } = await supabase.from("tools").delete().eq("id", id);
    if (error) {
      console.error("Error al eliminar la herramienta:", error);
    } else {
      setTools((prev) => prev.filter((t) => t.id !== id));
    }
  };

  const requestDelete = (item: SearchItem) => {
    setPendingDelete({ 
      type: item.itemType, 
      id: item.id as number, 
      name: item.name 
    });
    setConfirmOpen(true);
  };

  const confirmDelete = async () => {
    if (!pendingDelete) return;
    try {
      if (pendingDelete.type === "material") {
        await handleDeleteMaterial(pendingDelete.id);
      } else {
        await handleDeleteTool(pendingDelete.id);
      }
    } finally {
      setConfirmOpen(false);
      setPendingDelete(null);
    }
  };

  // Combine materials and tools into one searchable list
  const allItems = useMemo((): SearchItem[] => {
    const matItems: SearchItem[] = materials.map(m => ({ ...m, itemType: 'material' as const }));
    const toolItems: SearchItem[] = tools.map(t => ({ ...t, itemType: 'tool' as const }));
    return [...matItems, ...toolItems];
  }, [materials, tools]);

  // Filter by search query
  const filteredItems = useMemo(() => {
    const s = q.trim().toLowerCase();
    let items = allItems;

    // Filter by type
    if (filterType === 'materials') {
      items = items.filter(item => item.itemType === 'material');
    } else if (filterType === 'tools') {
      items = items.filter(item => item.itemType === 'tool');
    }

    // Filter by search query
    if (s) {
      items = items.filter((item) => {
        const haystack = [
          item.name,
          item.unit ?? "",
          item.manufactur ?? "",
          item.barcode ?? "",
          item.description ?? "",
          (item as any).color ?? "",
        ]
          .join(" ")
          .toLowerCase();
        return haystack.includes(s);
      });
    }

    return items;
  }, [q, allItems, filterType]);

  // Low-stock first sorting
  const sortedForRender = useMemo(() => {
    const isLow = (item: SearchItem) =>
      typeof item.min_quantity === 'number' && 
      item.min_quantity >= 0 && 
      typeof item.quantity === 'number' && 
      item.quantity <= item.min_quantity;
    
    const base = onlyLow ? filteredItems.filter(isLow) : filteredItems;
    
    return [...base].sort((a, b) => {
      const la = isLow(a) ? 1 : 0;
      const lb = isLow(b) ? 1 : 0;
      if (lb !== la) return lb - la; // low stock first
      return a.name.localeCompare(b.name, 'es', { sensitivity: 'base' });
    });
  }, [filteredItems, onlyLow]);

  // Count low stock items
  const lowStockCount = useMemo(() => {
    return allItems.filter(item => 
      typeof item.min_quantity === 'number' && 
      item.min_quantity >= 0 && 
      typeof item.quantity === 'number' && 
      item.quantity <= item.min_quantity
    ).length;
  }, [allItems]);

  // Normalize objects for edit forms
  const normalizeMaterial = (m: Inventory) => ({
    id: m.id,
    name: m.name,
    quantity: m.quantity,
    unit: (m.unit ?? 'Select') as any,
    min_quantity: m.min_quantity ?? undefined,
    weight: m.weight ?? undefined,
    width: m.width ?? undefined,
    height: m.height ?? undefined,
    color: m.color ?? undefined,
    manufactur: m.manufactur ?? undefined,
    barcode: m.barcode ?? undefined,
    hasQrCode: (m as any).hasQrCode ?? (m as any).hasQRcode ?? undefined,
    description: m.description ?? undefined,
  });

  const normalizeTool = (t: Tool) => ({
    id: t.id,
    name: t.name,
    quantity: t.quantity,
    unit: (t.unit ?? 'Select') as any,
    min_quantity: t.min_quantity ?? undefined,
    manufactur: t.manufactur ?? undefined,
    barcode: t.barcode ?? undefined,
    description: t.description ?? undefined,
    status: t.status ?? undefined,
  });

  return (
    <Layout>
      <div className="p-0 md:p-6 max-w-5xl mx-auto w-full">
        <div className="sticky top-0 z-20 bg-white/80 backdrop-blur border-b px-6 py-4 md:px-0 py-4">
          <h1 className="text-xl md:text-2xl font-bold mb-3">Buscar en Inventario</h1>
          
          <div className="flex flex-col gap-3">
            <div className="flex-1">
              <Input
                placeholder="Buscar por nombre, fabricante, código, etc."
                value={q}
                onChange={(e) => setQ(e.target.value)}
              />
            </div>

            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
              {/* Filter buttons */}
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant={filterType === 'all' ? 'default' : 'outline'}
                  onClick={() => setFilterType('all')}
                >
                  Todos ({allItems.length})
                </Button>
                <Button
                  size="sm"
                  variant={filterType === 'materials' ? 'default' : 'outline'}
                  onClick={() => setFilterType('materials')}
                >
                  <Package className="h-4 w-4 mr-1" />
                 ({materials.length})
                </Button>
                <Button
                  size="sm"
                  variant={filterType === 'tools' ? 'default' : 'outline'}
                  onClick={() => setFilterType('tools')}
                >
                  <Wrench className="h-4 w-4 mr-1" />
                  ({tools.length})
                </Button>
             
               <Button variant="outline" size="sm" onClick={downloadInventoryCsv}>
                  <Download className="h-4 w-4 mr-1" />
                  CSV
                </Button>
 </div>
              <div className="flex items-center gap-3">
                <label className="inline-flex items-center gap-2 text-sm select-none">
                  <input 
                    type="checkbox" 
                    checked={onlyLow} 
                    onChange={(e) => setOnlyLow(e.target.checked)} 
                  />
                  <span>Solo bajo stock</span>
                  <span className="text-xs text-gray-500">({lowStockCount})</span>
                </label>
                
               
              </div>
            </div>
          </div>
        </div>

        {loading ? (
          <p className="text-center mt-8">Cargando...</p>
        ) : (
          <div className="w-full px-4 py-4 md:px-0 mt-4 space-y-3">
            {filteredItems.length === 0 ? (
              <p className="text-center text-gray-500">
                No se encontraron {filterType === 'all' ? 'resultados' : filterType === 'materials' ? 'materiales' : 'herramientas'}.
              </p>
            ) : (
              sortedForRender.slice(0, visible).map((item) => {
                const low = typeof item.min_quantity === 'number' && 
                            item.min_quantity >= 0 && 
                            typeof item.quantity === 'number' && 
                            item.quantity <= item.min_quantity;
                
                const isMaterial = item.itemType === 'material';
                
                return (
                  <Card
                    key={`${item.itemType}-${item.id}`}
                    className={`p-4 shadow-sm border ${low ? 'border-red-400 bg-red-50/60' : ''}`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          
                          <h2 className={`text-lg font-semibold ${low ? 'text-red-700' : ''}`}>
                            {item.name}
                          </h2>
                          
                        </div>
                        
                        <p className={`text-sm ${low ? 'text-red-700 font-medium' : 'text-gray-500'}`}>
                          {item.quantity} {item.unit}
                          {low && typeof item.min_quantity === 'number' ? ` · mínimo: ${item.min_quantity}` : ''}
                        </p>
                        
                        {item.manufactur && (
                          <p className="text-sm text-gray-500">Fabricante: {item.manufactur}</p>
                        )}
                        {item.barcode && (
                          <p className="text-sm text-gray-500">Código: {item.barcode}</p>
                        )}
                        {item.description && (
                          <p className="text-sm text-gray-500">{item.description}</p>
                        )}
                      </div>
                      
                      <div className="flex gap-2">
                        <Button 
                          size="sm" 
                          variant="outline" 
                          onClick={() => { 
                            setSelectedItem(item); 
                            setOpenView(true); 
                          }}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button 
                          size="sm" 
                          variant="default" 
                          onClick={() => { 
                            setSelectedItem(item); 
                            setOpenEdit(true); 
                          }}
                        >
                          <SquarePen className="h-4 w-4" />
                        </Button>
                        <Button 
                          size="sm" 
                          variant="destructive" 
                          onClick={() => requestDelete(item)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </Card>
                );
              })
            )}
            
            {/* Sentinel for infinite scroll */}
            {filteredItems.length > visible && <div ref={sentinelRef} />}
          </div>
        )}

        {/* View Dialog */}
        <Dialog open={openView} onOpenChange={setOpenView}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                Detalles - {selectedItem?.itemType === 'material' ? 'Material' : 'Herramienta'}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-2">
              {selectedItem && (
                <div className="text-sm">
                  <p><strong>Nombre:</strong> {selectedItem.name}</p>
                  <p><strong>Cantidad:</strong> {selectedItem.quantity} {selectedItem.unit}</p>
                  {selectedItem.min_quantity && <p><strong>Mínimo:</strong> {selectedItem.min_quantity}</p>}
                  {selectedItem.manufactur && <p><strong>Fabricante:</strong> {selectedItem.manufactur}</p>}
                  {selectedItem.barcode && <p><strong>Código:</strong> {selectedItem.barcode}</p>}
                  {selectedItem.description && <p><strong>Descripción:</strong> {selectedItem.description}</p>}
                  {selectedItem.itemType === 'tool' && (selectedItem as Tool).status && (
                    <p><strong>Estado:</strong> {(selectedItem as Tool).status}</p>
                  )}
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>

        {/* Edit Dialog */}
        <Dialog open={openEdit} onOpenChange={(o) => { 
          setOpenEdit(o); 
          if (!o) setSelectedItem(null); 
        }}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                Editar {selectedItem?.itemType === 'material' ? 'Material' : 'Herramienta'}
              </DialogTitle>
            </DialogHeader>
            <div className="p-1 max-h-[70vh] overflow-y-auto">
              {selectedItem && selectedItem.itemType === 'material' && (
                <EditMaterialForm 
                  material={normalizeMaterial(selectedItem as Inventory)} 
                  onClose={() => { 
                    setOpenEdit(false); 
                    setSelectedItem(null); 
                  }} 
                />
              )}
              {selectedItem && selectedItem.itemType === 'tool' && (
                <EditToolForm 
                  tools={normalizeTool(selectedItem as Tool)} 
                  onClose={() => { 
                    setOpenEdit(false); 
                    setSelectedItem(null); 
                  }} 
                />
              )}
            </div>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Confirmar eliminación</DialogTitle>
            </DialogHeader>
            <div className="space-y-3">
              <p>
                ¿Estás seguro de eliminar {pendingDelete?.type === "material" ? "el material" : "la herramienta"}
                {" "}
                <span className="font-semibold">{pendingDelete?.name}</span>?
                Esta acción no se puede deshacer.
              </p>
              <div className="flex justify-end gap-2 pt-2">
                <Button 
                  variant="outline" 
                  onClick={() => { 
                    setConfirmOpen(false); 
                    setPendingDelete(null); 
                  }}
                >
                  Cancelar
                </Button>
                <Button variant="destructive" onClick={confirmDelete}>
                  Eliminar
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </Layout>
  );
}