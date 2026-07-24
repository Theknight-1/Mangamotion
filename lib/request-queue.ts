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
  private processing = false;
  private maxConcurrent = 3;
  private activeRequests = 0;

  /**
   * Enqueue a request. If an identical request (same key) is already pending,
   * returns the existing promise instead of creating a new request.
   */
  async enqueue<T>(key: string, fn: () => Promise<T>): Promise<T> {
    // Check if this exact request is already pending
    if (this.pending.has(key)) {
      const existing = this.pending.get(key)!;
      return existing.promise as Promise<T>;
    }

    // Create a new pending request
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

    // Add to queue
    this.queue.push({
      key,
      fn,
      resolve: resolve!,
      reject: reject!,
    });

    // Start processing
    this.process();

    return promise;
  }

  private async process() {
    if (
      this.processing ||
      this.queue.length === 0 ||
      this.activeRequests >= this.maxConcurrent
    ) {
      return;
    }

    this.processing = true;

    while (this.queue.length > 0 && this.activeRequests < this.maxConcurrent) {
      const item = this.queue.shift();
      if (!item) break;

      this.activeRequests++;

      try {
        const result = await item.fn();
        item.resolve(result);
      } catch (error) {
        item.reject(error);
      } finally {
        this.activeRequests--;
        // Remove from pending map
        this.pending.delete(item.key);
        // Continue processing
        await this.process();
      }
    }

    this.processing = false;
  }

  /**
   * Clear all pending requests for a specific key
   */
  clear(key: string) {
    this.queue = this.queue.filter((item) => item.key !== key);
    this.pending.delete(key);
  }

  /**
   * Get pending request count
   */
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
