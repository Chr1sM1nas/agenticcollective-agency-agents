import type { PoolClient } from 'pg';
import { Store } from '../database/store.js';
import { Workflow } from './workflow.js';

export class Worker {
  private timer?: ReturnType<typeof setInterval>;
  private current: Promise<void> | null = null;
  private lock?: PoolClient;
  private stopped = false;
  constructor(private readonly store: Store, private readonly workflow: Workflow) {}

  async start(): Promise<void> {
    this.lock = await this.store.pool.connect();
    const acquired = (await this.lock.query('SELECT pg_try_advisory_lock(72421002, hashtext(current_schema())) AS acquired')).rows[0].acquired;
    if (!acquired) { this.lock.release(); this.lock = undefined; throw new Error('Another Agency Zero worker is running against this database.'); }
    this.lock.on('error', () => {
      this.stopped = true;
      if (this.timer) clearInterval(this.timer);
      console.error('Worker database lock connection lost. Restart the server before submitting more briefs.');
    });
    await this.store.recoverInterrupted();
    this.timer = setInterval(() => this.wake(), 1000);
    this.wake();
  }

  wake(): void {
    if (this.stopped || this.current) return;
    this.current = this.drain().catch(() => console.error('Workflow worker encountered a database error.')).finally(() => { this.current = null; });
  }

  private async drain(): Promise<void> {
    while (!this.stopped) {
      const run = await this.store.claim();
      if (!run) return;
      await this.workflow.execute(run.id, run.brief, run.qualityPolicy);
    }
  }

  async stop(): Promise<void> {
    this.stopped = true;
    if (this.timer) clearInterval(this.timer);
    await this.current;
    if (this.lock) {
      await this.lock.query('SELECT pg_advisory_unlock(72421002, hashtext(current_schema()))').catch(() => undefined);
      this.lock.release();
    }
  }
}