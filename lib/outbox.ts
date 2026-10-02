/**
 * Offline outbox: reports captured without a connection wait here (IndexedDB, so photos fit) until they can be sent.
 * Browser-only.
 */
import type { ReportInput } from "@/lib/types"

export interface OutboxEntry {
  reference: string
  input: ReportInput
  capturedAt: string
  attempts: number
  lastError?: string
}

const DB = "rti-outbox"
const STORE = "reports"

function open(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB, 1)
    req.onupgradeneeded = () => req.result.createObjectStore(STORE, { keyPath: "reference" })
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })
}

async function tx<T>(mode: IDBTransactionMode, run: (store: IDBObjectStore) => IDBRequest<T>): Promise<T> {
  const db = await open()
  try {
    return await new Promise<T>((resolve, reject) => {
      const req = run(db.transaction(STORE, mode).objectStore(STORE))
      req.onsuccess = () => resolve(req.result)
      req.onerror = () => reject(req.error)
    })
  } finally {
    db.close()
  }
}

export const outboxAvailable = () => typeof indexedDB !== "undefined"
export const putOutbox = (entry: OutboxEntry) => tx("readwrite", (s) => s.put(entry))
export const removeOutbox = (reference: string) => tx("readwrite", (s) => s.delete(reference))
export const listOutbox = async (): Promise<OutboxEntry[]> => (outboxAvailable() ? tx("readonly", (s) => s.getAll() as IDBRequest<OutboxEntry[]>) : [])
