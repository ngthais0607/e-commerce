/// <reference types="vite/client" />

// Khai báo bổ sung cho các biến môi trường dùng trong project
interface ImportMetaEnv {
  readonly VITE_API_URL?: string;
  readonly VITE_API_PORT?: string;
  readonly MODE?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}


