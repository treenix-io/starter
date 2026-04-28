import { type NodeData } from '@treenx/core';
import { registerPrefab } from '@treenx/core/mod';

registerPrefab('example', 'seed', [
  {
    $path: 'example',
    $type: 'example.showcase',
    title: 'Treenix Showcase',
    description: 'Each card demonstrates one platform capability',
  },

  // Counter
  { $path: 'example/counter', $type: 'example.counter', count: 0 },

  // Todo list + sample items
  { $path: 'example/todos', $type: 'example.todo.list', title: 'Todos' },
  { $path: 'example/todos/1', $type: 'example.todo.item', title: 'Read the docs', done: true },
  { $path: 'example/todos/2', $type: 'example.todo.item', title: 'Build something', done: false },

  // Poll
  {
    $path: 'example/poll',
    $type: 'example.poll',
    question: 'What makes Treenix unique?',
    options: ['Tree structure', 'Typed components', 'Live reactivity', 'Action system'],
    votes: {},
    status: 'open',
  },

  // Ticker (service will generate children)
  { $path: 'example/ticker', $type: 'example.ticker', label: 'Live ticker' },
] as NodeData[]);
