import { declareClientModule, declareView } from '@treenx/react/context/client-registry';
import { usePath, useTreeEffects } from '@treenx/react';
import { Badge } from '@treenx/react/ui/badge';
import { Button } from '@treenx/react/ui/button';
import { useAuthContext } from '@treenx/react/app/auth-context';
import { getComponent } from '@treenx/core';
import type { Node } from '@treenx/core/kernel/types';
import { KernelError } from '@treenx/core/errors';
import { useEffect, useState } from 'react';
import { Profile } from './types';

const ProfileView = declareView(Profile, 'react', () => {
  const auth = useAuthContext();
  const effects = useTreeEffects();
  const userId = auth.authed;
  const [busy, setBusy] = useState(false);
  const [userPath, setUserPath] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    if (userId === null) return;
    const kernel = effects.kernel;
    if (kernel === undefined) throw new KernelError('UNAVAILABLE', 'Profile requires a native source');
    void kernel.read({ children: '/auth/users', where: { $id: userId.slice(2) } }).then(result => {
      const copy = result.copies[0];
      if (copy === undefined) throw new KernelError('NOT_FOUND', 'Authenticated account is missing');
      if ('error' in copy) throw copy.error;
      if (active) setUserPath(copy.node.$path);
    }).catch(error => { console.error(error); throw error; });
    return () => { active = false; };
  }, [effects, userId]);

  const { data: userNode } = usePath<Node>(userPath);
  const groups = userNode === undefined ? undefined : getComponent<{ $type: string; list: string[] }>(userNode, 't.groups');
  const avatar = userNode === undefined ? undefined : getComponent<{ $type: string; url?: string }>(userNode, 't.avatar');

  /** End the native session through the owner shared by the original application shell. */
  async function handleLogout() {
    setBusy(true);
    try {
      auth.logout();
      window.location.reload();
    } finally {
      setBusy(false);
    }
  }

  if (!userId) return <div className="text-muted-foreground p-6">Loading...</div>;

  return (
    <div className="max-w-md mx-auto p-6 space-y-6">
      {avatar?.url && (
        <div className="flex justify-center">
          <img
            src={avatar.url}
            alt={userId}
            className="w-24 h-24 rounded-full object-cover border-2 border-border"
          />
        </div>
      )}

      <div className="space-y-3 border rounded-lg p-4">
        <h2 className="text-lg font-semibold">Profile</h2>

        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">User ID</span>
          <span className="font-mono text-sm">{userId}</span>
        </div>

        {groups?.list && groups.list.length > 0 && (
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Groups</span>
            <div className="flex gap-1">
              {groups.list.map(g => (
                <Badge key={g} variant="secondary">{g}</Badge>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="flex justify-end">
        <Button variant="outline" disabled={busy} onClick={handleLogout}>
          {busy ? '...' : 'Log out'}
        </Button>
      </div>
    </div>
  );
});

export const clientModules = [declareClientModule('starter/profile/views', [ProfileView])];
