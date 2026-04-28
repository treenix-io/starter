import { register } from '@treenx/core';
import { usePath } from '@treenx/react/hooks';
import { trpc } from '@treenx/react/tree/trpc';
import { Badge } from '@treenx/react/ui/badge';
import { Button } from '@treenx/react/ui/button';
import { Input } from '@treenx/react/ui/input';
import { Label } from '@treenx/react/ui/label';
import { useEffect, useState } from 'react';

function ProfileView() {
  const [userId, setUserId] = useState<string | null>(null);
  const [oldPw, setOldPw] = useState('');
  const [newPw, setNewPw] = useState('');
  const [confirmPw, setConfirmPw] = useState('');
  const [msg, setMsg] = useState<{ text: string; ok: boolean } | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    trpc.me.query().then(res => setUserId(res?.userId ?? null));
  }, []);

  const userNode = usePath(userId ? `/auth/users/${userId}` : null);
  const groups = userNode?.groups as { $type: string; list: string[] } | undefined;
  const avatar = userNode?.avatar as { $type: string; url?: string } | undefined;
  const isAnon = userId?.startsWith('anon-');

  async function handleChangePassword(e: React.FormEvent) {
    e.preventDefault();
    if (!oldPw || !newPw) return;
    if (newPw !== confirmPw) {
      setMsg({ text: 'Passwords do not match', ok: false });
      return;
    }

    setLoading(true);
    setMsg(null);
    try {
      await trpc.changePassword.mutate({ oldPassword: oldPw, newPassword: newPw });
      setMsg({ text: 'Password changed', ok: true });
      setOldPw('');
      setNewPw('');
      setConfirmPw('');
    } catch (e) {
      setMsg({ text: e instanceof Error ? e.message : 'Failed', ok: false });
    } finally {
      setLoading(false);
    }
  }

  if (!userId) return <div className="text-muted-foreground p-6">Loading...</div>;

  return (
    <div className="max-w-md mx-auto p-6 space-y-6">
      {/* Avatar */}
      {avatar?.url && (
        <div className="flex justify-center">
          <img
            src={avatar.url}
            alt={userId}
            className="w-24 h-24 rounded-full object-cover border-2 border-border"
          />
        </div>
      )}

      {/* User info */}
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

      {/* Change password — only for non-anon users */}
      {!isAnon && (
        <form onSubmit={handleChangePassword} className="space-y-3 border rounded-lg p-4">
          <h2 className="text-lg font-semibold">Change Password</h2>

          <div className="space-y-1">
            <Label htmlFor="old-pw">Current password</Label>
            <Input id="old-pw" type="password" value={oldPw} onChange={e => setOldPw(e.target.value)} />
          </div>

          <div className="space-y-1">
            <Label htmlFor="new-pw">New password</Label>
            <Input id="new-pw" type="password" value={newPw} onChange={e => setNewPw(e.target.value)} />
          </div>

          <div className="space-y-1">
            <Label htmlFor="confirm-pw">Confirm new password</Label>
            <Input id="confirm-pw" type="password" value={confirmPw} onChange={e => setConfirmPw(e.target.value)} />
          </div>

          {msg && (
            <div className={`text-sm ${msg.ok ? 'text-green-600' : 'text-destructive'}`}>
              {msg.text}
            </div>
          )}

          <Button type="submit" disabled={loading || !oldPw || !newPw || !confirmPw}>
            {loading ? '...' : 'Change password'}
          </Button>
        </form>
      )}

      {isAnon && (
        <div className="text-sm text-muted-foreground border rounded-lg p-4">
          You are logged in as an anonymous user. Register an account to set a password.
        </div>
      )}
    </div>
  );
}
register('profile', 'react', ProfileView);
