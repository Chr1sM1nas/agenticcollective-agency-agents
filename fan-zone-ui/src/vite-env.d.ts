/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_THESPORTSDB_API_KEY?: string;
  readonly VITE_SUPABASE_URL?: string;
  readonly VITE_SUPABASE_ANON_KEY?: string;
  readonly VITE_FANZONE_PREVIEW_VIDEO_URL?: string;
  readonly VITE_FANZONE_PREVIEW_POSTER_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
