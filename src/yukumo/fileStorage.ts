import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";
import type { StorageAdapter } from "yukumo";

/**
 * Dependency-free {@link StorageAdapter} backed by a single JSON file. Good
 * enough for a single-process bot to survive restarts (session resuming, queue
 * persistence) without standing up Redis. Swap for `RedisStorage` when scaling
 * to multiple shards/processes.
 */
export class FileStorage implements StorageAdapter {
  private readonly store = new Map<string, unknown>();
  private writeTimer: ReturnType<typeof setTimeout> | null = null;

  constructor(private readonly filePath: string) {
    try {
      if (existsSync(filePath)) {
        const parsed = JSON.parse(readFileSync(filePath, "utf8")) as Record<string, unknown>;
        for (const [key, value] of Object.entries(parsed)) this.store.set(key, value);
      }
    } catch (err) {
      console.error(`[STORAGE] Failed to load ${filePath}, starting empty:`, err);
    }
  }

  async get(key: string): Promise<unknown | null> {
    return this.store.has(key) ? this.store.get(key)! : null;
  }

  async set(key: string, value: unknown): Promise<void> {
    this.store.set(key, value);
    this.scheduleFlush();
  }

  async delete(key: string): Promise<boolean> {
    const existed = this.store.delete(key);
    if (existed) this.scheduleFlush();
    return existed;
  }

  async has(key: string): Promise<boolean> {
    return this.store.has(key);
  }

  async clear(): Promise<void> {
    this.store.clear();
    this.scheduleFlush();
  }

  async disconnect(): Promise<void> {
    this.flush();
  }

  /** Coalesce rapid writes into a single flush on the next tick. */
  private scheduleFlush(): void {
    if (this.writeTimer) return;
    this.writeTimer = setTimeout(() => this.flush(), 250);
  }

  private flush(): void {
    if (this.writeTimer) {
      clearTimeout(this.writeTimer);
      this.writeTimer = null;
    }
    try {
      mkdirSync(dirname(this.filePath), { recursive: true });
      const obj = Object.fromEntries(this.store.entries());
      writeFileSync(this.filePath, JSON.stringify(obj), "utf8");
    } catch (err) {
      console.error(`[STORAGE] Failed to persist ${this.filePath}:`, err);
    }
  }
}
