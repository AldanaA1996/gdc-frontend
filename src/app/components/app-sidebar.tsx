import { ArrowUpDown, Home, Package, Search, Settings, Drill, DoorOpen, UsersRound, Info, LogOut } from "lucide-react"
import { supabase } from "@/app/lib/supabaseClient"
import { useAuthenticationStore } from "@/app/store/authentication"

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/app/components/ui/sidebar"
import { toast } from "sonner"

// Menu items.
const items = [
  {
    title: "Pañol",
    url: "/app/paniol",
    icon: Home,
  },
  {
    title: "Inventario",
    url: "/app/inventario",
    icon: Package,
  },
  {
    title: "Herramientas",
    url: "/app/addTool",
    icon: Drill,
  },
  {
    title: "Departamentos",
    url: "/app/departments",
    icon: DoorOpen,
  },
  {
    title: "Movimientos",
    url: "/app/movements",
    icon: ArrowUpDown,
  },
  {
    title: "Búsqueda",
    url: "/app/search",
    icon: Search,
  },

  {
    title: "Cerrar Sesión",
    url: "#",
    icon: LogOut,
  },

  {
    title: "Información",
    url: "/app/info",
    icon: Info,
  },

  // {
  //   title: "Voluntarios",
  //   url: "#",
  //   icon: UsersRound,
  // },
  
]

export function AppSidebar() {
  const { logout } = useAuthenticationStore()

  const handleLogout = async (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault()
    try {
      await supabase.auth.signOut()

      await logout()
    } finally {
      window.location.href = "/app"
      toast.success("Sesión cerrada exitosamente")
    }
  }
  return (
    <Sidebar>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Stockly</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <a href={item.url}
                    onClick={(e) => {
                      if (item.title === "Cerrar Sesión") {
                        e.preventDefault()
                        handleLogout(e)
                      }
                    }}>
                      <item.icon />
                      <span>{item.title}</span>
                    </a>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  )
}
export default AppSidebar