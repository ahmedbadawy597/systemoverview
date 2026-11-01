/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_MODE?: string
  readonly VITE_APPS_SCRIPT_URL?: string
  readonly VITE_ROLE_HASH_APPROVER?: string
  readonly VITE_ROLE_HASH_DEVELOPER?: string
  readonly VITE_ROLE_HASH_ADMIN?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}

interface GoogleScriptRunner {
  withSuccessHandler(fn: (value: unknown) => void): GoogleScriptRunner
  withFailureHandler(fn: (error: Error) => void): GoogleScriptRunner
  [backendFunction: string]: (...args: unknown[]) => unknown
}

interface Window {
  google?: { script?: { run?: GoogleScriptRunner } }
}
