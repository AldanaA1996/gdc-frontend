import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/app/lib/supabaseClient";
import { Card } from "@/app/components/ui/card";
import { Button } from "@/app/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/app/components/ui/dialog";
import { Trash2 } from "lucide-react";

type MovementRecord = Record<string, any> & {
  id?: number | string;
  created_at?: string;
  created_date?: string;
  activity_type?: string;
  material?: number | string;
  tool?: number | string;
  quantity?: number;
  department_id?: number;
  user_id?: string;
  volunteerd?: number;
};

interface MovementsViewProps {
  tableName?: string;
  filterBy?: "tool" | "material";
}

export default function MovementsView({ tableName = "activity", filterBy }: MovementsViewProps) {
  const [data, setData] = useState<MovementRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [inventoryById, setInventoryById] = useState<Record<string, { name?: string }>>({});
  const [toolById, setToolById] = useState<Record<string, { name?: string }>>({});
  const [fromDate, setFromDate] = useState<string>("");
  const [toDate, setToDate] = useState<string>("");
  const [typeFilter, setTypeFilter] = useState<string>("");
  const [deleteMode, setDeleteMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmIds, setConfirmIds] = useState<string[]>([]);
  const [volunteers, setVolunteers] = useState<any[]>([]);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const { data, error } = await supabase
          .from(tableName)
          .select("id, material, tool, activity_type, created_at, created_date, quantity, user:user_creator (id,name, email),volunteer")
          .order("created_date", { ascending: false })
          .order("created_at", { ascending: false });

        if (error) throw error;
        const rows = (data as MovementRecord[]) || [];
        setData(rows);

        // Cargar nombres de tools e inventory
        const toolIds = Array.from(new Set(rows.map((r) => r.tool).filter(Boolean))) as number[];
        const materialIds = Array.from(new Set(rows.map((r) => r.material).filter(Boolean))) as number[];

        if (toolIds.length) {
          const { data: toolData } = await supabase.from("tools").select("id, name").in("id", toolIds);
          const map: Record<string, { name?: string }> = {};
          (toolData || []).forEach((t) => (map[String(t.id)] = { name: t.name }));
          setToolById(map);
        }

        if (materialIds.length) {
          const { data: invData } = await supabase.from("inventory").select("id, name").in("id", materialIds);
          const map: Record<string, { name?: string }> = {};
          (invData || []).forEach((i) => (map[String(i.id)] = { name: i.name }));
          setInventoryById(map);
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

  useEffect(() => {
    const loadVolunteers = async () => {
      const { data, error } = await supabase.from("volunteers").select("id, name");
      if (error) console.error("Error loading volunteers:", error);
      else setVolunteers(data || []);
    };
    loadVolunteers();
  }, []);

  // Tipos de movimiento únicos
  const movementTypes = useMemo(() => {
    const set = new Set<string>();
    data.forEach((m) => {
      const mt = (m as any).activity_type;
      if (mt) set.add(String(mt));
    });
    return Array.from(set).sort();
  }, [data]);

  // Filtros combinados
  const filtered = useMemo(() => {
    if (!data.length) return [];

    const from = fromDate ? new Date(fromDate + "T00:00:00") : null;
    const to = toDate ? new Date(toDate + "T23:59:59.999") : null;

    const getWhen = (m: MovementRecord): Date | null => {
      const cd = m.created_date;
      if (cd) {
        const d = new Date(cd);
        return isNaN(d.getTime()) ? null : d;
      }
      return null;
    };

    return data.filter((a) => {
      // Filtro por fecha
      const when = getWhen(a);
      if (from && when && when < from) return false;
      if (to && when && when > to) return false;

      // Filtro por tipo de actividad
      const at = (a as any).activity_type ?? a.type;
      if (typeFilter && String(at) !== typeFilter) return false;

      // Filtro por pestaña (tool / material)
      if (filterBy === "tool" && !a.tool) return false;
      if (filterBy === "material" && !a.material) return false;

      return true;
    });
  }, [data, fromDate, toDate, typeFilter, filterBy]);

  // Modo eliminar
  const toggleSelect = (id?: number | string) => {
    if (!id) return;
    setSelectedIds((prev) => {
      const next = new Set(prev);
      const key = String(id);
      next.has(key) ? next.delete(key) : next.add(key);
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
    if (!id) return;
    setConfirmIds([String(id)]);
    setConfirmOpen(true);
  };

  const confirmDelete = async () => {
    if (!confirmIds.length) return;
    try {
      const idsForDb = confirmIds.map((x) => (isNaN(Number(x)) ? x : Number(x)));
      const { error } = await supabase.from(tableName).delete().in("id", idsForDb);
      if (error) throw error;
      const toRemove = new Set(confirmIds);
      setData((prev) => prev.filter((r) => !toRemove.has(String(r.id))));
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
  if (!filtered.length) return <p className="p-4 text-center text-gray-500">No hay movimientos registrados.</p>;

  return (
    <div className="flex flex-col space-y-3 p-2 w-[95%] self-center h-full">
      {/* Barra de filtros */}
      <div className="sticky top-0 z-10 bg-white/70 backdrop-blur border rounded-md p-3 flex flex-wrap items-end gap-3">
        <div>
          <select className="border rounded h-9 px-2" value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}>
            <option value="">Todos</option>
            {movementTypes.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
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
                onClick={() => {
                  setDeleteMode(false);
                  clearSelection();
                }}
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
            // Parse como fecha local, no UTC
            const dateStr = String(cd).replace('Z', '').trim();
            
            // Intenta parsear formato: YYYY-MM-DDTHH:mm:ss o YYYY-MM-DD HH:mm:ss
            const parts = dateStr.match(/(\d{4})-(\d{2})-(\d{2})[T\s](\d{2}):(\d{2}):(\d{2})/);
            if (parts) {
              const [, year, month, day, hour, min, sec] = parts;
              const d = new Date(Number(year), Number(month) - 1, Number(day), Number(hour), Number(min), Number(sec));
              if (!isNaN(d.getTime())) {
                return formatDateTimeLocal(d);
              }
            }
            
            // Fallback: formato más flexible (puede que falte segundos)
            const match2 = dateStr.match(/(\d{4})-(\d{2})-(\d{2})[T\s]?(\d{2}):(\d{2}):?(\d{2})?/);
            if (match2) {
              const [, year, month, day, hour, min, sec] = match2;
              const d = new Date(Number(year), Number(month) - 1, Number(day), Number(hour), Number(min), Number(sec || 0));
              if (!isNaN(d.getTime())) {
                return formatDateTimeLocal(d);
              }
            }
            
            // Si nada funciona, mostrar el valor raw de created_date con la hora
            return cd + (ca ? ` (${ca})` : "");
          }
          
          // Si solo hay hora, mostrarla
          return ca ? `${ca}` : "";
        })();

        const materialName = m.material ? inventoryById[String(m.material)]?.name : undefined;
        const toolName = m.tool ? toolById[String(m.tool)]?.name : undefined;
        const itemName = materialName || toolName || "Movimiento";

        const types: Record<string, { label: string; color: string }> = {
          borrow: { label: "Préstamo", color: "bg-orange-100 text-orange-700" },
          return: { label: "Devolución", color: "bg-green-100 text-green-700" },
          entry: { label: "Entrada", color: "bg-blue-100 text-blue-700" },
          exit: { label: "Salida", color: "bg-red-100 text-red-700" },
          new: { label: "Nuevo", color: "bg-purple-100 text-purple-700" },
          inuse: { label: "En uso", color: "bg-yellow-100 text-yellow-700" },
        };

        const typeDisplay = types[String(movementType).toLowerCase()] || {
          label: movementType,
          color: "bg-gray-100 text-gray-700",
        };

        const qty = m.quantity ? (
          <span className="text-xs rounded px-2 py-0.5 bg-blue-50 text-blue-700">{m.quantity}</span>
        ) : null;

        const user = (m as any).user?.name;
        const volunteerName = m.volunteer ? volunteers.find(v => v.id === m.volunteer)?.name : null;

        return (
          <Card key={id} className="p-3 w-full border border-gray-200 shadow-sm hover:shadow-md transition-all duration-150 rounded-xl bg-white">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="min-w-[200px]">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-semibold">{itemName}</span>
                  {typeDisplay.label && (
                    <span className={`text-xs rounded px-2 py-0.5 font-medium ${typeDisplay.color}`}>
                      {typeDisplay.label}
                    </span>
                  )}
                  {qty}
                </div>
                <div className="text-xs text-gray-500 mt-1 flex flex-wrap gap-3">
                  {when && <span>{when}</span>}
                  {user && (
                    <span>
                      Creado por: <span className="font-medium">{user}</span>
                    </span>
                  )}
                  {volunteerName && (
                    <span>
                      Voluntario: <span className="font-medium">{volunteerName}</span>
                    </span>
                  )}
                </div>
              </div>

              {!deleteMode && (
                <div className="ml-auto pl-2">
                  <Button variant="outline" size="sm" onClick={() => requestDeleteSingle(m.id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              )}
              {deleteMode && (
                <div className="ml-auto pl-2">
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={selectedIds.has(String(m.id))}
                      onChange={() => toggleSelect(m.id)}
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
              <Button variant="outline" onClick={() => setConfirmOpen(false)}>
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

function formatDateTimeLocal(d: Date) {
  // Formato: DD/MM/YYYY HH:mm:ss (24 horas) para objeto Date ya creado como local
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
