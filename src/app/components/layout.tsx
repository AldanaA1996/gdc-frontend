import { Sidebar, SidebarProvider, SidebarTrigger, SidebarInset } from "@/app/components/ui/sidebar";
import { AppSidebar } from "@/app/components/app-sidebar";
import { useLocation } from "react-router-dom";
import MobileBottomNav from "@/app/components/mobile-bottom-nav";

// Función para obtener el título de la página según la ruta
function getPageTitle(pathname: string): string {
  const routes: Record<string, string> = {
    "/app": "Iniciar Sesión",
    "/app/signup": "Registro",
    "/app/paniol": "Pañol",
    "/app/inventario": "Carga de Stock",
    "/app/lista": "Lista de compras",
    "/app/search": "Buscador de Material",
    "/app/movements": "Control",
    "/app/addTool": "Herramientas",
    "/app/departments": "Departamentos",
    "/app/info": "Info",
    "/app/volunteers": "Voluntarios",

  };

  return routes[pathname] || "STOCKLY";
}

export default function Layout({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const pageTitle = getPageTitle(location.pathname);

  return (
    <>
   
    <SidebarProvider>
        <AppSidebar />
        <SidebarInset>
          {/* Header móvil */}
          <div className="sticky top-0 z-40 flex items-center border-b bg-background px-4 py-3 md:hidden">
            <SidebarTrigger buttonSizeClass="size-9" iconClassName="size-5" aria-label="Abrir/cerrar menú" />
            <h1 className="text-lg font-semibold">{pageTitle}</h1>
          </div>
          
          {children}
        </SidebarInset>
       
        {/* Floating trigger: fixed, top-right, high z-index; only visible on desktop */}
        <div className="fixed right-3 top-3 z-50 hidden md:block">
          <SidebarTrigger buttonSizeClass="size-12" iconClassName="size-6" aria-label="Abrir/cerrar menú" />
        </div>

        {/* Mobile bottom navigation */}
        <MobileBottomNav />
    </SidebarProvider>
    
    </>
  );
}