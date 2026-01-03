import { ArrowUpDown, Box, Drill, Home, Search } from "lucide-react"

export default function MobileBottomNav() {
  return (
    <nav
      className="md:hidden fixed bottom-0 inset-x-0 z-50 border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60"
      role="navigation"
      aria-label="Acceso rápido"
    >
      <ul className="grid grid-cols-4 h-16">
        <li>
          <a
            href="/app/paniol"
            className="flex h-full w-full flex-col items-center justify-center gap-1 text-xs text-muted-foreground hover:text-foreground"
          >
            <Home className="h-5 w-5" />
            <span>Pañol</span>
          </a>
        </li>
        <li>
          <a
            href="/app/inventario"
            className="flex h-full w-full flex-col items-center justify-center gap-1 text-xs text-muted-foreground hover:text-foreground"
          >
            <Box className="h-5 w-5" />
            <span>Inventario</span>
          </a>
        </li>
        <li>
          <a
            href="/app/addTool"
            className="flex h-full w-full flex-col items-center justify-center gap-1 text-xs text-muted-foreground hover:text-foreground"
          >
            <Drill className="h-5 w-5" />
            <span>Herramientas</span>
          </a>
        </li>
        <li>
          <a
            href="/app/search"
            className="flex h-full w-full flex-col items-center justify-center gap-1 text-xs text-muted-foreground hover:text-foreground"
          >
            <Search className="h-5 w-5" />
            <span>Buscar</span>
          </a>
        </li>
      </ul>
      <div className="h-[env(safe-area-inset-bottom)]" />
    </nav>
  )
}
