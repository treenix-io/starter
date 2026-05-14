import { trpc, usePath, view } from '@treenx/react';
import { Badge } from '@treenx/react/ui/badge';
import { Button } from '@treenx/react/ui/button';
import { useEffect, useState } from 'react';
import { Profile } from './types';

view(Profile, () => {
  const [userId, setUserId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    trpc.me.query().then(res => setUserId(res?.userId ?? null));
  }, []);

  const { data: userNode } = usePath(userId ? `/auth/users/${userId}` : null);
  const groups = userNode?.groups as { $type: string; list: string[] } | undefined;
  const avatar = userNode?.avatar as { $type: string; url?: string } | undefined;

  async function handleLogout() {
    setBusy(true);
    try {
      await trpc.logout.mutate();
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
