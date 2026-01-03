import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/app/lib/supabaseClient";
import { Card } from "@/app/components/ui/card";
import { Button } from "@/app/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/app/components/ui/dialog";
import { 
  Trash2, 
  Activity, 
  Filter, 
  Loader2, 
  AlertCircle,
  User,
  Users,
  Calendar,
  Package,
  CheckSquare,
  Square
} from "lucide-react";
import { Badge } from "@/app/components/ui/badge";

type MovementRecord = Record<string, any> & {
  id?:  number | string;
  created_at?: string;
  created_date?: string;
  activity_type?: string;
  material?: number | string;
  tool?: number | string;
  quantity?: number;
  department_id?: number;
  user_id?: string;
  volunteerd?:  number;
};

interface MovementsViewProps {
  tableName?:  string;
  filterBy?: "tool" | "material";
}

export default function MovementsView({ tableName = "activity", filterBy }: MovementsViewProps) {
  const [data, setData] = useState<MovementRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [inventoryById, setInventoryById] = useState<Record<string, { name?:  string }>>({});
  const [toolById, setToolById] = useState<Record<string, { name?:  string }>>({});
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
          .select("id, material, tool, activity_type, created_at, created_date, quantity, user: user_creator (id,name, email),volunteer")
          .order("created_date", { ascending: false })
          .order("created_at", { ascending: false });

        if (error) throw error;
        const rows = (data as MovementRecord[]) || [];
        setData(rows);

        const toolIds = Array.from(new Set(rows. map((r) => r.tool).filter(Boolean))) as number[];
        const materialIds = Array.from(new Set(rows. map((r) => r.material).filter(Boolean))) as number[];

        if (toolIds.length) {
          const { data: toolData } = await supabase. from("tools").select("id, name").in("id", toolIds);
          const map:  Record<string, { name?: string }> = {};
          (toolData || []).forEach((t) => (map[String(t.id)] = { name: t.name }));
          setToolById(map);
        }

        if (materialIds. length) {
          const { data: invData } = await supabase. from("inventory").select("id, name").in("id", materialIds);
          const map: Record<string, { name?: string }> = {};
          (invData || []).forEach((i) => (map[String(i.id)] = { name: i.name }));
          setInventoryById(map);
        }
      } catch (err:  any) {
        console.error("Error loading movements:", err);
        setError(err?. message || "Error al cargar los movimientos");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [tableName]);

  useEffect(() => {
    const loadVolunteers = async () => {
      const { data, error } = await supabase. from("volunteers").select("id, name");
      if (error) console.error("Error loading volunteers:", error);
      else setVolunteers(data || []);
    };
    loadVolunteers();
  }, []);

  const movementTypes = useMemo(() => {
    const set = new Set<string>();
    data.forEach((m) => {
      const mt = (m as any).activity_type;
      if (mt) set.add(String(mt));
    });
    return Array.from(set).sort();
  }, [data]);

  const filtered = useMemo(() => {
    if (!data. length) return [];

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
      const when = getWhen(a);
      if (from && when && when < from) return false;
      if (to && when && when > to) return false;

      const at = (a as any).activity_type ??  a.type;
      if (typeFilter && String(at) !== typeFilter) return false;

      if (filterBy === "tool" && !a.tool) return false;
      if (filterBy === "material" && !a.material) return false;

      return true;
    });
  }, [data, fromDate, toDate, typeFilter, filterBy]);

  const toggleSelect = (id?:  number | string) => {
    if (! id) return;
    setSelectedIds((prev) => {
      const next = new Set(prev);
      const key = String(id);
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });
  };

  const clearSelection = () => setSelectedIds(new Set());
  
  const requestDeleteSelected = () => {
    if (! selectedIds.size) return;
    setConfirmIds(Array.from(selectedIds));
    setConfirmOpen(true);
  };

  const requestDeleteSingle = (id?:  number | string) => {
    if (!id) return;
    setConfirmIds([String(id)]);
    setConfirmOpen(true);
  };

  const confirmDelete = async () => {
    if (!confirmIds.length) return;
    try {
      const idsForDb = confirmIds.map((x) => (isNaN(Number(x)) ? x : Number(x)));
      const { error } = await supabase. from(tableName).delete().in("id", idsForDb);
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

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
          <p className="text-sm text-gray-600">Cargando movimientos...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="flex flex-col items-center gap-3">
          <AlertCircle className="h-12 w-12 text-red-500" />
          <p className="text-sm text-red-600">{error}</p>
        </div>
      </div>
    );
  }

  if (! filtered.length) {
    return (
      <div className="px-4 pt-2 pb-24 md:pb-6">
        <div className="mb-4">
          <div className="flex items-center gap-2 mb-1">
            <Activity className="h-5 w-5 text-blue-600" />
            <h2 className="text-xl font-bold text-gray-800">Movimientos</h2>
          </div>
          <p className="text-xs text-gray-600">Registro de actividades del inventario</p>
        </div>
        <div className="flex flex-col items-center justify-center min-h-[40vh] gap-3">
          <Activity className="h-12 w-12 text-gray-300" />
          <p className="text-gray-500 text-sm">No hay movimientos registrados</p>
        </div>
      </div>
    );
  }

  return (
    <div className="px-2 sm:px-4 pt-2 pb-24 md:pb-6">
      {/* Header */}
      <div className="mb-3">
        <div className="flex items-center gap-2 mb-1">
          <Activity className="h-5 w-5 text-blue-600" />
          <h2 className="text-lg sm:text-xl font-bold text-gray-800">Movimientos</h2>
        </div>
        <p className="text-xs text-gray-600">
          {filtered.length} {filtered.length === 1 ? 'movimiento' : 'movimientos'}
        </p>
      </div>

      {/* Barra de filtros - TODO EN UNA LÍNEA */}
      <div className="sticky top-0 z-10 bg-white/95 backdrop-blur border border-gray-200 rounded-lg p-2 sm:p-3 mb-3 shadow-sm space-y-2">
        {/* Primera línea:  Filtro y botón modo eliminar */}
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-gray-500 flex-shrink-0" />
          <select 
            className="flex-1 border border-gray-300 rounded-md px-2 py-1.5 text-xs sm:text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all" 
            value={typeFilter} 
            onChange={(e) => setTypeFilter(e.target. value)}
          >
            <option value="">Todos los tipos</option>
            {movementTypes.map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>

          {! deleteMode && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setDeleteMode(true)}
              className="text-xs h-8 px-2 sm:px-3 flex-shrink-0"
            >
              <Trash2 className="h-3. 5 w-3.5 sm:mr-1.5" />
              <span className="hidden sm:inline">Modo eliminar</span>
            </Button>
          )}
        </div>

        {/* Segunda línea: Botones de eliminación (solo visible en modo eliminar) */}
        {deleteMode && (
          <div className="flex items-center gap-2 pt-2 border-t border-gray-200">
            <Button
              variant="outline"
              size="sm"
              onClick={clearSelection}
              className="text-xs h-8 px-3 flex-1"
            >
              Limpiar selección
            </Button>
            <Button
              variant="destructive"
              size="sm"
              disabled={! selectedIds.size}
              onClick={requestDeleteSelected}
              className="text-xs h-8 px-3 flex-1"
            >
              <Trash2 className="h-3.5 w-3.5 mr-1.5" />
              Eliminar ({selectedIds.size})
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setDeleteMode(false);
                clearSelection();
              }}
              className="text-xs h-8 px-3"
            >
              Salir
            </Button>
          </div>
        )}
      </div>

      {/* Lista de movimientos */}
      <div className="space-y-2 sm:space-y-3">
        {filtered.map((m) => {
          const id = String(m.id ??  cryptoRandomId());
          const movementType = (m as any).activity_type ?? (m as any).movementType ??  m.type;

          const when = (() => {
            const cd = m.created_date;
            const ca = m.created_at;
            
            if (cd) {
              const dateStr = String(cd).replace('Z', '').trim();
              const parts = dateStr.match(/(\d{4})-(\d{2})-(\d{2})[T\s](\d{2}):(\d{2}):(\d{2})/);
              if (parts) {
                const [, year, month, day, hour, min, sec] = parts;
                const d = new Date(Number(year), Number(month) - 1, Number(day), Number(hour), Number(min), Number(sec));
                if (! isNaN(d.getTime())) {
                  return formatDateTimeLocal(d);
                }
              }
              
              const match2 = dateStr.match(/(\d{4})-(\d{2})-(\d{2})[T\s]? (\d{2}):(\d{2}):?(\d{2})?/);
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

          const materialName = m.material ?  inventoryById[String(m. material)]?.name : undefined;
          const toolName = m.tool ? toolById[String(m.tool)]?.name : undefined;
          const itemName = materialName || toolName || "Movimiento";

          const types:  Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
            borrow: { label: "Préstamo", variant: "default" },
            return: { label: "Devolución", variant: "secondary" },
            entry: { label: "Entrada", variant: "outline" },
            exit: { label: "Salida", variant:  "destructive" },
            new: { label: "Nuevo", variant: "default" },
            inuse: { label: "En uso", variant: "secondary" },
          };

          const typeDisplay = types[String(movementType).toLowerCase()] || {
            label: movementType,
            variant: "outline" as const,
          };

          const user = (m as any).user?.name;
          const volunteerName = m.volunteer ? volunteers.find(v => v.id === m.volunteer)?.name : null;

          return (
            <Card 
              key={id} 
              className={`p-3 border border-gray-200 shadow-sm hover:shadow-md transition-all duration-200 bg-white ${
                deleteMode && selectedIds.has(String(m.id)) ? 'ring-2 ring-blue-500' : ''
              }`}
            >
              <div className="flex items-start gap-2">
                {/* Checkbox en modo eliminar */}
                {deleteMode && (
                  <button
                    onClick={() => toggleSelect(m.id)}
                    className="flex-shrink-0 mt-0.5"
                  >
                    {selectedIds.has(String(m.id)) ? (
                      <CheckSquare className="h-5 w-5 text-blue-600" />
                    ) : (
                      <Square className="h-5 w-5 text-gray-400" />
                    )}
                  </button>
                )}

                {/* Contenido principal */}
                <div className="flex-1 min-w-0 space-y-2">
                  {/* Línea 1: Nombre del item */}
                  <div className="flex items-start gap-2">
                    <Package className="h-4 w-4 text-gray-500 flex-shrink-0 mt-0.5" />
                    <span className="font-semibold text-sm text-gray-800 break-words line-clamp-2">
                      {itemName}
                    </span>
                  </div>

                  {/* Línea 2: Badges */}
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <Badge variant={typeDisplay.variant} className="text-xs">
                      {typeDisplay.label}
                    </Badge>
                    {m.quantity && (
                      <Badge variant="outline" className="text-xs">
                        {m.quantity}
                      </Badge>
                    )}
                  </div>

                  {/* Línea 3: Info adicional */}
                  <div className="space-y-1 text-xs text-gray-600">
                    {when && (
                      <div className="flex items-center gap-1. 5">
                        <Calendar className="h-3 w-3 flex-shrink-0" />
                        <span className="truncate">{when}</span>
                      </div>
                    )}
                    {user && (
                      <div className="flex items-center gap-1.5">
                        <User className="h-3 w-3 flex-shrink-0" />
                        <span className="truncate">{user}</span>
                      </div>
                    )}
                    {volunteerName && (
                      <div className="flex items-center gap-1.5">
                        <Users className="h-3 w-3 flex-shrink-0" />
                        <span className="truncate">{volunteerName}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Botón eliminar individual */}
                {! deleteMode && (
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => requestDeleteSingle(m.id)}
                    className="h-8 w-8 p-0 hover:bg-red-50 hover:text-red-600 flex-shrink-0"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </Card>
          );
        })}
      </div>

      {/* Modal de confirmación */}
      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent className="max-w-[90vw] sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base">
              <AlertCircle className="h-5 w-5 text-amber-600" />
              Confirmar eliminación
            </DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="text-sm text-gray-600">
              {confirmIds. length > 1
                ? `Vas a eliminar ${confirmIds.length} movimientos. Esta acción no se puede deshacer.`
                : `Vas a eliminar 1 movimiento. Esta acción no se puede deshacer.`}
            </p>
          </div>
          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button 
              variant="outline" 
              onClick={() => setConfirmOpen(false)}
              className="w-full sm:w-auto"
            >
              Cancelar
            </Button>
            <Button 
              variant="destructive" 
              onClick={confirmDelete}
              className="w-full sm:w-auto"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Eliminar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
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