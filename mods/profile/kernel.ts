import { buildTypeDef } from '@treenx/core/kernel/typedef';
import type { NativeModuleDeployment } from '@treenx/core/kernel/manifest';
import { nativeSeed } from '@treenx/mods/prefab/seed';
import { Profile } from './types';
import schema from './schemas/profile.json';
import { seedNodes } from './seed';

/** Publish the original profile data and seed under one native module owner. */
export default function profileModule(): NativeModuleDeployment {
  const id = 'starter/profile';
  return { manifest: { id, open: [], security: [], types: [buildTypeDef(Profile, { name: 't.profile', module: id, security: 'ordinary', schema: { ...schema, type: 'object' } })] }, seeds: nativeSeed('profile', seedNodes) };
}
