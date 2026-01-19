# 🏗️ GDC Frontend - Gestión de Grupo de Construcción  

Aplicación web para controlar herramientas, materiales y movimientos en proyectos de construcción.  

![Captura de pantalla o logo](public/ejemplo-screenshot.png)  

## **🚀 Características**  
- 📋 Registro de herramientas y materiales.  
- 🔄 Seguimiento de préstamos y devoluciones.  
- 📊 Reportes de inventario en tiempo real.  
- 🔐 Autenticación de usuarios (si aplica).  

## **🛠️ Tecnologías**  
- React.js + Vite  
- React Router (para navegación)  
- [Tailwind/Bootstrap] (para estilos)  
- [Otras librerías: axios, react-icons, etc.]  

## **⚙️ Instalación**  
1. Clona el repositorio:  
   ```bash
   git clone https://github.com/AldanaA1996/gdc-frontend.git
   cd gdc-frontend
Instala dependencias:

bash
npm install
Configura variables de entorno (crea .env):

env
VITE_API_URL=http://localhost:3000  # Ejemplo: URL del backend
Inicia la app:

bash
npm run dev
📂 Estructura del Proyecto
plaintext
src/
├── components/    # Botones, formularios, tarjetas
├── pages/         # Vistas (Inicio, Herramientas, Reportes)
├── context/       # Estado global (ej: AuthContext)
├── utils/         # Funciones auxiliares
└── App.jsx        # Rutas principal
🌐 Uso
Accede a http://localhost:5173 (puerto por defecto de Vite).

Si hay backend, asegúrate de que esté corriendo en paralelo.

🤝 Contribuir
Haz un fork del proyecto.

Crea una rama: git checkout -b feature/nueva-funcion.

Haz commit: git commit -m "Agrega X feature".

Haz push: git push origin feature/nueva-funcion.

Abre un Pull Request.

📄 Licencia
MIT. Ver LICENSE.

## **📊 Arquitectura del Sistema**

### **Flujo de Préstamos**
```mermaid
flowchart TD
    A(["UsuarioA ingresa un material o herramienta"]) --> B{"¿ya estaba en existencia?"}
    B --> C["Si"] & D["No"]
    C --> n1(["No lo deja crear"])
    D --> n2(["Se crea el nuevo material/herramienta"])
    n2 --> n3["Se relaciona con el departamento correspondiente"]
    n4(["UsuarioA edita un material"]) --> n5["¿el stock diminuye o aumenta?"]
    n5 --> n6["disminuye"] & n7["Aumenta"]
    n6 --> n8["la cantidad restante es menor al determinado minimo determinado por el usuario?"]
    n8 --> n9["Enviar una alerta de bajos suministros"]
    n7 --> n10["¿La nueva cantidad es mayor al determinado por el usuario?"]
    n10 --> n11["Enviar una notificacion de superavit"]
    n12(["UsuarioA crea una peticion de Herramienta (mediante la lectura de codigo)"]) --> n13["¿Esta disponible?"]
    n13 --> n14["Si"] & n15["No"]
    n15 --> n17["esta en uso"] & n19["esta fuera de servicio"]
    n14 --> n18["Se inicia el formulario de prestamo"]
    n17 --> n20["se dan los datos de la persona que la tiene"]
```
