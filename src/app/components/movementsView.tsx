import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/app/lib/supabaseClient";
import { Card } from "@/app/components/ui/card";
import { Input } from "@/app/components/ui/input";
import { Button } from "@/app/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/app/components/ui/dialog";
import { Trash2 } from "lucide-react";

type MovementRecord = Record<string, any> & {
  id?: number | string;
  created_at?: string;   // hora
  created_date?: string; // fecha
  activity_type?: string;
  material?: number | string;
  tool?: number | string;
  quantity?: number;
  department_id?: number;
  user_id?: string;
};

interface MovementsViewProps {
  tableName?: string;
}

export default function MovementsView({ tableName = "activity" }: MovementsViewProps) {
  const [data, setData] = useState<MovementRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [inventoryById, setInventoryById] = useState<Record<string, { name?: string }>>({});
  const [toolById, setToolById] = useState<Record<string, { name?: string }>>({});
  // Filters
  const [fromDate, setFromDate] = useState<string>("");
  const [toDate, setToDate] = useState<string>("");
  const [typeFilter, setTypeFilter] = useState<string>("");
  // Delete mode
  const [deleteMode, setDeleteMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmIds, setConfirmIds] = useState<string[]>([]);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const query = supabase
          .from(tableName)
          .select("id, material, tool, activity_type, created_at, created_date, quantity, user:user_creator (id,name, email)")
          .order("created_date", { ascending: false })
          .order("created_at", { ascending: false });
        const { data, error } = await query;
        if (error) throw error;
        const rows = (data as MovementRecord[]) || [];
        setData(rows);

        const toolIdSet = new Set<number>();
        const invIdSet = new Set<number>();

        for (const r of rows) {
          const toolId = (r as any).tool as number | undefined;
          if (typeof toolId === "number") toolIdSet.add(toolId);
          const invId = (r as any).material as number | undefined;
          if (typeof invId === "number") invIdSet.add(invId);
        }

        const userIdSet = new Set<string>();
        for (const r of rows) {
          const userId = (r as any).user_creator as string | undefined;
          if (userId) userIdSet.add(userId);
        }

        if (toolIdSet.size) {
          const { data: toolData } = await supabase
            .from("tools")
            .select("id, name")
            .in("id", Array.from(toolIdSet));
          const mapTool: Record<string, { name?: string }> = {};
          (toolData || []).forEach((t: any) => {
            mapTool[String(t.id)] = { name: t.name };
          });
          setToolById(mapTool);
        } else {
          setToolById({});
        }

        if (invIdSet.size) {
          const { data: invData } = await supabase
            .from("inventory")
            .select("id, name")
            .in("id", Array.from(invIdSet));
          const mapInv: Record<string, { name?: string }> = {};
          (invData || []).forEach((i: any) => {
            mapInv[String(i.id)] = { name: i.name };
          });
          setInventoryById(mapInv);
        } else {
          setInventoryById({});
        }
      } catch (err: any) {
        console.error("Error loading movements:", err);
        setError(err?.message || "Error al cargar los movimientos");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [tableName]);

  // Derive movement types
  const movementTypes = useMemo(() => {
    const set = new Set<string>();
    data.forEach((m) => {
      const mt = (m as any).activity_type;
      if (mt) set.add(String(mt));
    });
    return Array.from(set).sort();
  }, [data]);

  // Filtrado por fecha y tipo
  const filtered = useMemo(() => {
    const from = fromDate ? new Date(fromDate + "T00:00:00") : null;
    const to = toDate ? new Date(toDate + "T23:59:59.999") : null;

    const getWhen = (m: MovementRecord): Date | null => {
      const cd = m.created_date;
      if (cd) {
        const dateStr = String(cd).replace('T', ' ').replace('Z', '').trim();
        const parts = dateStr.match(/(\d{4})-(\d{2})-(\d{2})[T\s](\d{2}):(\d{2}):(\d{2})/);
        if (parts) {
          const [, year, month, day, hour, min, sec] = parts;
          const d = new Date(Number(year), Number(month) - 1, Number(day), Number(hour), Number(min), Number(sec));
          if (!isNaN(d.getTime())) return d;
        }
      }
      return null;
    };

    return data.filter((a) => {
      const when = getWhen(a);
      if (from && when && when < from) return false;
      if (to && when && when > to) return false;
      const at = (a as any).activity_type ?? a.type;
      if (typeFilter && String(at) !== typeFilter) return false;
      return true;
    });
  }, [data, fromDate, toDate, typeFilter]);

  const toggleSelect = (id?: number | string) => {
    if (id == null) return;
    const key = String(id);
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const clearSelection = () => setSelectedIds(new Set());

  const requestDeleteSelected = () => {
    if (!selectedIds.size) return;
    setConfirmIds(Array.from(selectedIds));
    setConfirmOpen(true);
  };

  const requestDeleteSingle = (id?: number | string) => {
    if (id == null) return;
    setConfirmIds([String(id)]);
    setConfirmOpen(true);
  };

  const confirmDelete = async () => {
    if (!confirmIds.length) return;
    try {
      const idsForDb = confirmIds.map((x) => (isNaN(Number(x)) ? x : Number(x)));
      const { error } = await supabase.from(tableName).delete().in("id", idsForDb as any[]);
      if (error) throw error;
      const setIds = new Set(confirmIds);
      setData((prev) => prev.filter((r) => !setIds.has(String(r.id))));
      clearSelection();
      setDeleteMode(false);
    } catch (err) {
      console.error("Error al eliminar movimientos:", err);
    } finally {
      setConfirmOpen(false);
      setConfirmIds([]);
    }
  };

  if (loading) return <p className="p-4 text-center">Cargando movimientos...</p>;
  if (error) return <p className="p-4 text-center text-red-500">{error}</p>;

  if (!data.length) {
    return <p className="p-4 text-center text-gray-500">No hay movimientos registrados.</p>;
  }

  return (
    <div className="flex flex-col space-y-3 p-2 w-[95%] self-center h-full">
      {/* Barra de filtros */}
      <div className="sticky top-0 z-10 bg-white/70 backdrop-blur border rounded-md p-3 flex flex-wrap items-end gap-3">
        <div>
          <select className="border rounded h-9 px-2" value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}>
            <option value="">Todos</option>
            {movementTypes.map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
        </div>
        <div className="ml-auto flex items-end gap-2">
          {!deleteMode ? (
            <button
              type="button"
              className="text-xs border rounded px-3 h-9 hover:bg-gray-50"
              onClick={() => setDeleteMode(true)}
            >
              Modo eliminar
            </button>
          ) : (
            <>
              <button
                type="button"
                className="text-xs border rounded px-3 h-9 hover:bg-gray-50"
                onClick={clearSelection}
              >
                Limpiar selección
              </button>
              <button
                type="button"
                className="text-xs border rounded px-3 h-9 bg-red-600 text-white hover:bg-red-500 disabled:opacity-50"
                disabled={!selectedIds.size}
                onClick={requestDeleteSelected}
              >
                Eliminar seleccionados ({selectedIds.size})
              </button>
              <button
                type="button"
                className="text-xs border rounded px-3 h-9 hover:bg-gray-50"
                onClick={() => { setDeleteMode(false); clearSelection(); }}
              >
                Salir
              </button>
            </>
          )}
        </div>
      </div>

      {filtered.map((m) => {
        const id = String(m.id ?? cryptoRandomId());
        const movementType = (m as any).activity_type ?? (m as any).movementType ?? m.type;

        const when = (() => {
          const cd = m.created_date;
          const ca = m.created_at;
          
          if (cd) {
            const dateStr = String(cd).replace('Z', '').trim();
            const parts = dateStr.match(/(\d{4})-(\d{2})-(\d{2})[T\s](\d{2}):(\d{2}):(\d{2})/);
            if (parts) {
              const [, year, month, day, hour, min, sec] = parts;
              const d = new Date(Number(year), Number(month) - 1, Number(day), Number(hour), Number(min), Number(sec));
              if (!isNaN(d.getTime())) {
                return formatDateTimeLocal(d);
              }
            }
            
            const match2 = dateStr.match(/(\d{4})-(\d{2})-(\d{2})[T\s]?(\d{2}):(\d{2}):?(\d{2})?/);
            if (match2) {
              const [, year, month, day, hour, min, sec] = match2;
              const d = new Date(Number(year), Number(month) - 1, Number(day), Number(hour), Number(min), Number(sec || 0));
              if (!isNaN(d.getTime())) {
                return formatDateTimeLocal(d);
              }
            }
            
            return cd + (ca ? ` (${ca})` : "");
          }
          
          return ca ? `${ca}` : "";
        })();

      
        const materialName = (() => {
          const invId = (m as any).material as number | string | undefined;
          if (invId == null) return undefined;
          const rec = inventoryById[String(invId)];
          return rec?.name;
        })();

        const toolName = (() => {
          const toolId = (m as any).tool as number | string | undefined;
          if (toolId == null) return undefined;
          const rec = toolById[String(toolId)];
          return rec?.name;
        })();

        
        const itemName = materialName || toolName || "Movimiento";
        

       
        const activityTypeDisplay = (() => {
          const mt = String(movementType || "").toLowerCase();
          
          const types: Record<string, { label: string; color: string }> = {
            'borrow': { label: 'Préstamo', color: 'bg-orange-100 text-orange-700' },
            'return': { label: 'Devolución', color: 'bg-green-100 text-green-700' },
            'entry': { label: 'Entrada', color: 'bg-blue-100 text-blue-700' },
            'exit': { label: 'Salida', color: 'bg-red-100 text-red-700' },
            'new': { label: 'Nuevo', color: 'bg-purple-100 text-purple-700' },
            'inuse': { label: 'En uso', color: 'bg-yellow-100 text-yellow-700' },
          };
          
          return types[mt] || { label: movementType, color: 'bg-gray-100 text-gray-700' };
        })();

        const user = (m as any).user?.name as string | undefined;

        const canSelect = m.id != null;
        const realId = m.id as string | number | undefined;
        const checked = realId != null ? selectedIds.has(String(realId)) : false;

        const qtyVal = m.quantity;
        
        // 🔧 CORREGIDO: Los chips de cantidad funcionan igual para materials y tools
        const qtyChip = (() => {
          if (qtyVal == null) return null;
          const mt = String(movementType || "").toLowerCase();
        
          const isBorrow = mt === "borrow";
          const isReturn = mt === "return";
          const isNew = mt === "new";
          const isEntry = mt === "entry";
          const isExit = mt === "exit";
          const isInUse = mt === "inuse";
        
          // Determinar signo
          let sign = "";
          if (isBorrow || isExit || isInUse) sign = "-";
          else if (isReturn || isEntry) sign = "+";
          else if (isNew) sign = "+";
        
          // Determinar color
          let color = "bg-blue-50 text-blue-700";
          if (isBorrow || isExit || isInUse) color = "bg-red-50 text-red-700";
          if (isReturn || isEntry) color = "bg-green-50 text-green-700";
          if (isNew) color = "bg-blue-50 text-blue-700";
        
          return (
            <span className={`text-xs rounded px-2 py-0.5 ${color}`}>
              {sign}{qtyVal}
            </span>
          );
        })();

        return (
          <Card key={id} className="p-4 w-[100%] self-center border">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="min-w-[200px]">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-semibold">{itemName}</span>
                  {/* {itemType && (
                    <span className="text-xs bg-gray-100 text-gray-600 rounded px-2 py-0.5">
                      {itemType}
                    </span>
                  )} */}
                  {activityTypeDisplay.label && (
                    <span className={`text-xs rounded px-2 py-0.5 font-medium ${activityTypeDisplay.color}`}>
                      {activityTypeDisplay.label}
                    </span>
                  )}
                  {qtyChip}
                </div>
                <div className="text-xs text-gray-500 mt-1 flex flex-wrap gap-3">
                  {when && <span>{when}</span>}
                  {user && <span>Creado por: <span className="font-medium">{user}</span></span>}
                </div>
              </div>
              {!deleteMode && (
                <div className="ml-auto pl-2">
                  <Button variant="outline" size="sm" onClick={() => requestDeleteSingle(realId)} disabled={!canSelect}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              )}
              {deleteMode && (
                <div className="ml-auto pl-2">
                  <label className={`flex items-center gap-2 ${!canSelect ? "opacity-40 cursor-not-allowed" : ""}`}>
                    <input
                      type="checkbox"
                      disabled={!canSelect}
                      checked={checked}
                      onChange={() => toggleSelect(realId)}
                    />
                    <span className="text-xs">Seleccionar</span>
                  </label>
                </div>
              )}
            </div>
          </Card>
        );
      })}
      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmar eliminación</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <p className="text-sm">
              {confirmIds.length > 1
                ? `Vas a eliminar ${confirmIds.length} movimientos. Esta acción no se puede deshacer.`
                : `Vas a eliminar 1 movimiento. Esta acción no se puede deshacer.`}
            </p>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => { setConfirmOpen(false); setConfirmIds([]); }}>
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
  );
}

function formatDateTime(value?: string) {
  if (!value) return "";
  try {
    const d = new Date(value);
    if (isNaN(d.getTime())) return value;
    return d.toLocaleString("es-AR", { 
      year: 'numeric', 
      month: '2-digit', 
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false
    });
  } catch {
    return value;
  }
}

function formatDateTimeLocal(d: Date) {
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');
  const seconds = String(d.getSeconds()).padStart(2, '0');
  return `${day}/${month}/${year} ${hours}:${minutes}:${seconds}`;
}

function cryptoRandomId() {
  try {
    return crypto.randomUUID();
  } catch {
    return Math.random().toString(36).slice(2);
  }
}