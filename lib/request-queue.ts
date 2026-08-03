/**
 * Request Queue System
 * Prevents duplicate concurrent requests by queuing them and deduplicating
 * based on a unique key. Multiple identical requests will wait for the first one.
 */

interface QueueItem<T = any> {
  key: string;
  fn: () => Promise<T>;
  resolve: (value: T) => void;
  reject: (error: any) => void;
}

interface PendingRequest<T = any> {
  promise: Promise<T>;
  resolve: (value: T) => void;
  reject: (error: any) => void;
}

class RequestQueue {
  private queue: QueueItem[] = [];
  private pending: Map<string, PendingRequest> = new Map();
  private maxConcurrent = 3;
  private activeRequests = 0;

  async enqueue<T>(key: string, fn: () => Promise<T>): Promise<T> {
    // Dedup: if identical request is pending, return existing promise
    if (this.pending.has(key)) {
      const existing = this.pending.get(key)!;
      return existing.promise as Promise<T>;
    }

    let resolve: (value: T) => void;
    let reject: (error: any) => void;
    const promise = new Promise<T>((res, rej) => {
      resolve = res;
      reject = rej;
    });

    const pendingRequest: PendingRequest<T> = {
      promise,
      resolve: resolve!,
      reject: reject!,
    };

    this.pending.set(key, pendingRequest as PendingRequest);

    this.queue.push({
      key,
      fn,
      resolve: resolve!,
      reject: reject!,
    });

    this.process();

    return promise;
  }

  private process(): void {
    while (
      this.queue.length > 0 &&
      this.activeRequests < this.maxConcurrent
    ) {
      const item = this.queue.shift();
      if (!item) break;

      this.activeRequests++;

      item
        .fn()
        .then((result) => item.resolve(result))
        .catch((error) => item.reject(error))
        .finally(() => {
          this.activeRequests--;
          this.pending.delete(item.key);
          this.process();
        });
    }
  }

  clear(key: string) {
    this.queue = this.queue.filter((item) => item.key !== key);
    this.pending.delete(key);
  }

  getPendingCount(): number {
    return this.pending.size;
  }
}

// Export singleton instance
export const requestQueue = new RequestQueue();

/**
 * Helper function to create a queue key from an object
 */
export function createQueueKey(
  prefix: string,
  params: Record<string, any>,
): string {
  return `${prefix}:${JSON.stringify(params)}`;
}
