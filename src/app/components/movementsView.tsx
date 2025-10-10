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

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const { data, error } = await supabase
          .from(tableName)
          .select("id, material, tool, activity_type, created_at, created_date, quantity, user:user_creator (id,name, email)")
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
        const when = formatDateTime(m.created_date || m.created_at);
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

function formatDateTime(value?: string) {
  if (!value) return "";
  try {
    const d = new Date(value);
    if (isNaN(d.getTime())) return value;
    return d.toLocaleString("es-AR", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
    });
  } catch {
    return value;
  }
}

function cryptoRandomId() {
  try {
    return crypto.randomUUID();
  } catch {
    return Math.random().toString(36).slice(2);
  }
}
