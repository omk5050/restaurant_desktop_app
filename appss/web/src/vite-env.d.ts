/// <reference types="vite/client" />

// Asset declarations
declare module '*.svg'  { const src: string; export default src }
declare module '*.png'  { const src: string; export default src }
declare module '*.jpg'  { const src: string; export default src }
declare module '*.jpeg' { const src: string; export default src }
declare module '*.gif'  { const src: string; export default src }
declare module '*.webp' { const src: string; export default src }

// Vite environment
interface ImportMetaEnv {
  readonly VITE_APP_TITLE?: string
  readonly MODE: string
  readonly BASE_URL: string
  readonly PROD: boolean
  readonly DEV: boolean
  readonly SSR: boolean
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}

// CSS side-effect imports
declare module '*.css' {
  const content: Record<string, string>
  export default content
}
