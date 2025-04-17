// / <reference types="vite/client" />

interface ImportMetaEnv {
    VITE_API_URL: string; // Ejemplo de variable de entorno
    // Puedes agregar más variables aquí según lo necesites
  }
  
  interface ImportMeta {
    readonly env: ImportMetaEnv;
  }
  