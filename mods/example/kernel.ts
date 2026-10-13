import { randomUUID } from 'node:crypto';
import { buildTypeDef } from '@treenx/core/kernel/typedef';
import { R, W, type ActionDef } from '@treenx/core/kernel/types';
import type { NativeModuleDeployment } from '@treenx/core/kernel/manifest';
import { KernelError } from '@treenx/core/errors';
import { nativeSeed } from '@treenx/mods/prefab/seed';
import { ExampleCounter, ExampleTick, ExampleTicker, ExampleTodoList, ExampleTodoItem, ExamplePoll, ExampleShowcase } from './types';
import { tickerService } from './service';
import { seedNodes } from './seed';
import example_counter from './schemas/example.counter.json';
import example_poll from './schemas/example.poll.json';
import example_showcase from './schemas/example.showcase.json';
import example_tick from './schemas/example.tick.json';
import example_ticker from './schemas/example.ticker.json';
import example_todo_item from './schemas/example.todo.item.json';
import example_todo_list from './schemas/example.todo.list.json';

/** Create the existing todo child through the current native action's atomic change set. */
const add: ActionDef = { kind: 'write', args: { type: 'object', properties: { title: { type: 'string', minLength: 1 } }, required: ['title'] }, async handler(ctx, args) {
  if (typeof args !== 'object' || args === null || !('title' in args) || typeof args.title !== 'string' || args.title.trim().length === 0)
    throw new KernelError('INVALID', 'Title required');
  const path = `${ctx.node.$path}/${randomUUID()}`;
  await ctx.requireReadWrite(path);
  ctx.change.put({ $path: path, $type: 'example.todo.item', title: args.title.trim(), done: false });
} };

/** Publish the authored example schemas, actions, live ticker owner, and existing showcase seed. */
export default function exampleModule(): NativeModuleDeployment {
  const id = 'starter/example';
  return { manifest: { id, open: [], security: [{ type: 'example.ticker', context: 'service', handler: tickerService }], types: [
    buildTypeDef(ExampleCounter, { name: 'example.counter', module: id, security: 'ordinary', schema: { ...example_counter, type: 'object' }, }),
    buildTypeDef(ExamplePoll, { name: 'example.poll', module: id, security: 'ordinary', schema: { ...example_poll, type: 'object' }, }),
    buildTypeDef(ExampleShowcase, { name: 'example.showcase', module: id, security: 'ordinary', schema: { ...example_showcase, type: 'object' }, }),
    buildTypeDef(ExampleTick, { name: 'example.tick', module: id, security: 'ordinary', schema: { ...example_tick, type: 'object' }, }),
    buildTypeDef(ExampleTicker, { name: 'example.ticker', module: id, security: 'user-capability', schema: { ...example_ticker, type: 'object' }, }),
    buildTypeDef(ExampleTodoItem, { name: 'example.todo.item', module: id, security: 'ordinary', schema: { ...example_todo_item, type: 'object' }, }),
    buildTypeDef(ExampleTodoList, { name: 'example.todo.list', module: id, security: 'ordinary', schema: { ...example_todo_list, type: 'object' }, actions: { add } }),
  ] }, seeds: nativeSeed('example', seedNodes, [], [
    { executor: '/sys/autostart', target: '/example/ticker', grant: R },
    { executor: '/example/ticker', target: '/example/ticker', grant: R | W },
  ]) };
}
