import { register } from '@treenx/core/core';
import { Render, type View } from '@treenx/react/context';
import { useChildren, usePath } from '@treenx/react/hooks';
import { Button } from '@treenx/react/ui/button';
import { Input } from '@treenx/react/ui/input';
import { useState } from 'react';
import {
  ExampleCounter,
  ExamplePoll,
  ExampleShowcase,
  ExampleTicker,
  ExampleTodoItem,
  ExampleTodoList,
} from './types';

// ── Counter View ──

const CounterView: View<ExampleCounter> = ({ value, ctx }) => {
  return (
    <div className="flex flex-col items-center gap-4">
      <div className="text-5xl font-mono font-bold tabular-nums">{value.count ?? 0}</div>
      <div className="flex gap-2">
        <Button size="sm" variant="outline" onClick={() => value.decrement()}>−</Button>
        <Button size="sm" variant="outline" onClick={() => value.reset()}>Reset</Button>
        <Button size="sm" onClick={() => value.increment()}>+</Button>
      </div>
    </div>
  );
};
register('example.counter', 'react', CounterView);

// ── Todo List View ──

const TodoListView: View<ExampleTodoList> = ({ value, ctx }) => {
  const children = useChildren(ctx!.path, { watch: true, watchNew: true });
  const [draft, setDraft] = useState('');

  const handleAdd = async () => {
    if (!draft.trim()) return;
    await ctx!.execute('add', { title: draft });
    setDraft('');
  };

  return (
    <div className="space-y-3">
      <h3 className="font-medium">{value.title ?? 'Todos'}</h3>
      <div className="flex gap-2">
        <Input
          className="flex-1"
          placeholder="Add a todo..."
          value={draft}
          onChange={e => setDraft(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleAdd()}
        />
        <Button size="sm" onClick={handleAdd}>Add</Button>
      </div>
      <ul className="space-y-1">
        {children.map(child => (
          <TodoItemView key={child.$path} value={child as any} ctx={{ node: child, path: child.$path, execute: ctx!.execute }} />
        ))}
      </ul>
    </div>
  );
};
register('example.todo.list', 'react', TodoListView);

// ── Todo Item View ──
// Uses usePath for TypeProxy — needs toggle() action method

const TodoItemView: View<ExampleTodoItem> = ({ value, ctx }) => {
  const item = usePath(ctx!.path, ExampleTodoItem);

  return (
    <li
      className="flex items-center gap-2 px-3 py-2 rounded hover:bg-muted cursor-pointer"
      onClick={() => item.toggle()}
    >
      <span className={`w-4 h-4 rounded border flex items-center justify-center text-xs
        ${value.done ? 'bg-primary border-primary text-primary-foreground' : 'border-input'}`}>
        {value.done ? '✓' : ''}
      </span>
      <span className={value.done ? 'line-through text-muted-foreground' : ''}>
        {value.title ?? ''}
      </span>
    </li>
  );
};
register('example.todo.item', 'react', TodoItemView);

// ── Poll View ──

const PollView: View<ExamplePoll> = ({ value, ctx }) => {
  const votes = value.votes ?? {};
  const options = value.options ?? [];
  const totalVotes = Object.values(votes).reduce((s, n) => s + n, 0);
  const closed = value.status === 'closed';

  return (
    <div className="space-y-3">
      <div className="font-medium">{value.question ?? ''}</div>

      <div className="space-y-2">
        {options.map(opt => {
          const count = votes[opt] || 0;
          const pct = totalVotes > 0 ? Math.round((count / totalVotes) * 100) : 0;
          return (
            <button
              key={opt}
              disabled={closed}
              onClick={() => ctx!.execute('vote', { option: opt })}
              className="w-full text-left px-3 py-2 rounded border border-input
                hover:bg-muted disabled:opacity-60 disabled:cursor-not-allowed"
            >
              <div className="flex justify-between text-sm mb-1">
                <span>{opt}</span>
                <span className="text-muted-foreground">{count} ({pct}%)</span>
              </div>
              <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                <div
                  className="h-full rounded-full bg-primary transition-all duration-300"
                  style={{ width: `${pct}%` }}
                />
              </div>
            </button>
          );
        })}
      </div>

      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <span>{totalVotes} vote{totalVotes !== 1 ? 's' : ''}</span>
        {!closed && (
          <Button size="sm" variant="ghost" onClick={() => ctx!.execute('close')}>
            Close poll
          </Button>
        )}
        {closed && <span>Poll closed</span>}
      </div>
    </div>
  );
};
register('example.poll', 'react', PollView);

// ── Ticker View ──

const TickerView: View<ExampleTicker> = ({ value, ctx }) => {
  const children = useChildren(ctx!.path, { watch: true, watchNew: true });
  const last = children.slice(-8).reverse();

  return (
    <div className="space-y-1 font-mono text-sm">
      {last.map((n, i) => {
        const val = typeof n.value === 'number' ? n.value : 0;
        const seq = typeof n.seq === 'number' ? n.seq : 0;
        const time = typeof n.ts === 'number' ? new Date(n.ts).toLocaleTimeString() : '';
        const barW = Math.round(((val - 25) / 55) * 100);
        return (
          <div
            key={n.$path}
            className="flex items-center gap-2 px-2 py-1 rounded"
            style={{ opacity: 1 - i * 0.1 }}
          >
            <span className="text-muted-foreground w-8">#{seq}</span>
            <span className="text-muted-foreground w-16">{time}</span>
            <span className="w-10 text-right font-medium">{val}</span>
            <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden">
              <div
                className="h-full rounded-full bg-primary/60 transition-all duration-500"
                style={{ width: `${Math.max(0, Math.min(100, barW))}%` }}
              />
            </div>
          </div>
        );
      })}
      {last.length === 0 && (
        <div className="text-muted-foreground text-center py-4">Waiting for data...</div>
      )}
    </div>
  );
};
register('example.ticker', 'react', TickerView);

// ── Showcase Root View ──

const LABELS: Record<string, { label: string; desc: string }> = {
  'example.counter':   { label: 'Counter',   desc: 'Simplest type + actions' },
  'example.todo.list': { label: 'Todo List',  desc: 'Children + useChildren' },
  'example.poll':      { label: 'Poll',       desc: 'State machine + validation' },
  'example.ticker':    { label: 'Ticker',     desc: 'Service + live data' },
};

const ShowcaseView: View<ExampleShowcase> = ({ value, ctx }) => {
  const children = useChildren(ctx!.path, { watch: true });

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">{value.title ?? ''}</h1>
        <p className="text-muted-foreground">{value.description ?? ''}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {children.map(child => {
          const info = LABELS[child.$type];
          if (!info) return null;
          return (
            <div key={child.$path} className="border rounded-lg p-5 space-y-3">
              <div>
                <h2 className="font-semibold">{info.label}</h2>
                <p className="text-xs text-muted-foreground">{info.desc}</p>
              </div>
              <Render value={child} />
            </div>
          );
        })}
      </div>
    </div>
  );
};
register('example.showcase', 'react', ShowcaseView);
