import { env } from "@/config/env"
import { mockBackend } from "./mockBackend"

/** The Apps Script functions this frontend calls. Names match the existing backend. */
export type BackendFunction =
  | "fetchTickets"
  | "addTicketToSheet"
  | "approveTicketInSheet"
  | "updateDevInSheet"
  | "deleteTicketFromSheet"

export type ResolvedMode = "gas" | "http" | "mock"

export class BackendError extends Error {
  readonly fn: BackendFunction
  constructor(fn: BackendFunction, message: string) {
    super(message)
    this.name = "BackendError"
    this.fn = fn
  }
}

function hasGoogleScriptRun() {
  return typeof window !== "undefined" && typeof window.google?.script?.run !== "undefined"
}

export function resolveMode(): ResolvedMode {
  if (env.apiMode === "gas") return "gas"
  if (env.apiMode === "http") return "http"
  if (env.apiMode === "mock") return "mock"
  if (hasGoogleScriptRun()) return "gas"
  if (env.appsScriptUrl) return "http"
  return "mock"
}

/** Served from Apps Script HtmlService (doGet): call the server functions directly. */
function callGoogleScriptRun(fn: BackendFunction, args: unknown[]): Promise<unknown> {
  return new Promise((resolve, reject) => {
    const run = window.google?.script?.run
    if (!run) {
      reject(new BackendError(fn, "google.script.run غير متاح في هذه البيئة."))
      return
    }
    run
      .withSuccessHandler(resolve)
      .withFailureHandler((error: Error) => reject(new BackendError(fn, error?.message || String(error))))
      [fn](...args)
  })
}

/**
 * Deployed web app URL. Sends { action, args } as text/plain so the browser skips the CORS
 * preflight, which Apps Script web apps cannot answer. The response may be the raw return value
 * or an envelope { ok, data, error }.
 */
async function callWebApp(fn: BackendFunction, args: unknown[]): Promise<unknown> {
  if (!env.appsScriptUrl) throw new BackendError(fn, "لم يتم ضبط رابط خادم Google Apps Script.")
  let response: Response
  try {
    response = await fetch(env.appsScriptUrl, {
      method: "POST",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify({ action: fn, args }),
      redirect: "follow",
    })
  } catch {
    throw new BackendError(fn, "تعذّر الاتصال بالخادم. تحقق من الاتصال بالإنترنت.")
  }
  if (!response.ok) throw new BackendError(fn, `استجاب الخادم بالرمز ${response.status}.`)

  const text = await response.text()
  let payload: unknown = text
  try {
    payload = JSON.parse(text)
  } catch {
    // Plain-text responses are passed through as-is.
  }
  if (payload && typeof payload === "object" && "ok" in payload) {
    const envelope = payload as { ok: boolean; data?: unknown; error?: string }
    if (!envelope.ok) throw new BackendError(fn, envelope.error || "رفض الخادم الطلب.")
    return envelope.data
  }
  return payload
}

export function callBackend(fn: BackendFunction, ...args: unknown[]): Promise<unknown> {
  const mode = resolveMode()
  if (mode === "gas") return callGoogleScriptRun(fn, args)
  if (mode === "http") return callWebApp(fn, args)
  return mockBackend.call(fn, args)
}
