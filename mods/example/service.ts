import { randomUUID } from 'node:crypto';
import type { Node, ServiceHandler } from '@treenx/core/kernel/types';
import { KernelError } from '@treenx/core/errors';

const MAX = 8;

/** Keep the original eight-point ticker under its admitted native service session. */
export const tickerService: ServiceHandler = async (node, session) => {
  let seq = 0;
  let stopped = false;
  let timer: ReturnType<typeof setTimeout> | undefined;
  let pending = Promise.resolve();
  const iterator = session.lane[Symbol.asyncIterator]();
  const welcome = await iterator.next();
  if (welcome.done || welcome.value.t !== 'welcome') throw new KernelError('INVALID', 'Ticker requires its admitted welcome');
  let epoch = welcome.value.intake;
  const delivery = (async () => {
    for await (const frame of { [Symbol.asyncIterator]: () => iterator }) {
      if (frame.t === 'fail') throw frame.error;
      if (frame.t === 'pos' && frame.coverage !== true && frame.intake !== undefined) epoch = frame.intake;
    }
  })();
  let fail: (error: unknown) => void = () => { throw new KernelError('INVALID', 'Ticker failure owner is missing'); };
  const failure = new Promise<never>((_resolve, reject) => { fail = reject; });
  const done = Promise.race([delivery, failure]);
  const key = () => ({ epoch, time: Date.now(), nonce: randomUUID() });

  /** Publish one new point and trim older points in the same accepted commit. */
  async function tick(): Promise<void> {
    const result = await session.read({ children: node.$path, sort: [['ts', 1]], window: { limit: MAX + 1 } });
    const children: Node[] = result.copies.map(copy => {
      if ('error' in copy) throw new KernelError(copy.error.code, copy.error.message);
      return copy.node;
    });
    const ts = Date.now();
    await session.commit({ opId: key(), changes: [
      { op: 'put', node: { $path: `${node.$path}/${ts}-${randomUUID()}`, $type: 'example.tick', ts,
        value: +(50 + Math.sin(seq * 0.3) * 20 + Math.random() * 5).toFixed(1), seq: seq++ } },
      ...children.slice(0, Math.max(0, children.length + 1 - MAX)).map(child => ({ op: 'remove' as const, path: child.$path })),
    ] }).outcome;
  }

  /** Wait for the previous tick before scheduling another write through this owner. */
  function schedule(): void {
    timer = setTimeout(() => {
      pending = tick().then(() => { if (!stopped) schedule(); });
      void pending.catch(fail);
    }, 2000);
  }
  schedule();
  return { done, async stop() { stopped = true; clearTimeout(timer); await pending; await delivery; } };
};
