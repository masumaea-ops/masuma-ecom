
interface ImportMetaEnv {
  readonly VITE_API_URL: string;
  readonly API_KEY: string;
  // more env variables...
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
