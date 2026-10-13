import { declareClientType } from '@treenx/core/comp/client-declaration';
import { declareClientModule } from '@treenx/react/context/client-registry';

// ── Counter: simplest type + actions ──

export class ExampleCounter {
  count = 0;

  /** @description Increment by 1 */
  increment() { this.count++; }

  /** @description Decrement by 1 */
  decrement() { this.count--; }

  /** @description Reset to zero */
  reset() { this.count = 0; }
}
const declaredExampleCounter = declareClientType('example.counter', ExampleCounter);

// ── Todo: children + useChildren ──

export class ExampleTodoList {
  title = 'Todos';

  /** @description Add a new todo item */
  declare add: (data: { title: string }) => Promise<void>;
}
const declaredExampleTodoList = declareClientType('example.todo.list', ExampleTodoList);

export class ExampleTodoItem {
  title = '';
  done = false;

  /** @description Toggle done state */
  toggle() { this.done = !this.done; }
}
const declaredExampleTodoItem = declareClientType('example.todo.item', ExampleTodoItem);

// ── Poll: state machine + validation ──

export class ExamplePoll {
  question = '';
  options: string[] = [];
  votes: Record<string, number> = {};
  status: 'open' | 'closed' = 'open';

  /** @description Cast a vote for an option */
  vote(data: { option: string }) {
    if (this.status !== 'open') throw new Error('Poll is closed');
    if (!this.options.includes(data.option)) throw new Error('Invalid option');
    this.votes[data.option] = (this.votes[data.option] || 0) + 1;
  }

  /** @description Close the poll — no more votes */
  close() {
    if (this.status !== 'open') throw new Error('Already closed');
    this.status = 'closed';
  }
}
const declaredExamplePoll = declareClientType('example.poll', ExamplePoll);

// ── Ticker: service host ──

export class ExampleTicker {
  label = 'Live ticker';
}
const declaredExampleTicker = declareClientType('example.ticker', ExampleTicker);

export class ExampleTick {
  ts = 0;
  value = 0;
  seq = 0;
}
const declaredExampleTick = declareClientType('example.tick', ExampleTick);

// ── Showcase: root gallery container ──

export class ExampleShowcase {
  title = 'Treenix Showcase';
  description = 'Capabilities gallery — each card demos one feature';
}
const declaredExampleShowcase = declareClientType('example.showcase', ExampleShowcase);

export const clientModules = [declareClientModule('starter/example/types', [], undefined, [declaredExampleCounter, declaredExampleTodoList, declaredExampleTodoItem, declaredExamplePoll, declaredExampleTicker, declaredExampleTick, declaredExampleShowcase])];
