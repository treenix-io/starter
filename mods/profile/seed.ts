import { type NodeData } from '@treenx/core';
import { registerPrefab } from '@treenx/core/mod';

registerPrefab('profile', 'seed', [
  { $path: 'profile', $type: 'profile', label: 'My Profile' },
] as NodeData[]);
