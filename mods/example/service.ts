// Ticker service — generates live data points as children every 2s

import { makeNode, register } from '@treenx/core';
import '@treenx/core/contexts/service';
import { safeInterval } from '@treenx/core/util/safe-timers';
import { ExampleTick } from './types';

const MAX = 8;

register('example.ticker', 'service', async (node, ctx) => {
  let seq = 0;

  const timer = safeInterval(async () => {
    const ts = Date.now();
    const name = String(ts).slice(-6).padStart(6, '0');
    await ctx.tree.set(makeNode(`${node.$path}/${name}`, ExampleTick, {
      ts,
      value: +(50 + Math.sin(seq * 0.3) * 20 + Math.random() * 5).toFixed(1),
      seq: seq++,
    }));

    // Trim old ticks
    const { items } = await ctx.tree.getChildren(node.$path);
    if (items.length > MAX) {
      items.sort((a, b) => (a.ts as number) - (b.ts as number));
      for (const old of items.slice(0, items.length - MAX)) {
        await ctx.tree.remove(old.$path);
      }
    }
  }, 2000, 'example.ticker.tick');

  console.log(`[example] ticker started on ${node.$path}`);
  return { stop: async () => clearInterval(timer) };
});
