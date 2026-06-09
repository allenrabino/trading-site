import React, { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/api/client';
import { formatCurrency } from '@/lib/cryptoData';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Search, Pencil, Trash2, Loader2, Users, Shield } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { motion } from 'framer-motion';

export default function Admin() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [editingUser, setEditingUser] = useState(null);
  const [form, setForm] = useState({ email: '', balance: '', role: 'user' });
  const [saving, setSaving] = useState(false);

  const { data: users = [], isLoading } = useQuery({
    queryKey: ['admin-users'],
    queryFn: () => api.admin.listUsers(),
  });

  const filtered = users.filter(u =>
    (u.email ?? '').toLowerCase().includes(search.toLowerCase()) ||
    (u.role ?? '').toLowerCase().includes(search.toLowerCase())
  );

  const openEdit = (user) => {
    setEditingUser(user);
    setForm({
      email: user.email ?? '',
      balance: String(user.balance ?? 0),
      role: user.role ?? 'user',
    });
  };

  const handleSave = async () => {
    if (!editingUser) return;
    setSaving(true);
    try {
      await api.admin.updateUser(editingUser.id, {
        email: form.email,
        balance: parseFloat(form.balance),
        role: form.role,
      });
      await queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      toast.success('User updated');
      setEditingUser(null);
    } catch (err) {
      toast.error(err.message || 'Failed to update user');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (user) => {
    if (!window.confirm(`Delete ${user.email}? This cannot be undone.`)) return;
    try {
      await api.admin.deleteUser(user.id);
      await queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      toast.success('User deleted');
    } catch (err) {
      toast.error(err.message || 'Failed to delete user');
    }
  };

  return (
    <div className="pb-4">
      <div className="hero-banner px-4 pt-4 pb-5">
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
          <div className="flex items-center gap-2 mb-1">
            <Shield className="w-5 h-5 text-primary" />
            <h1 className="text-lg font-bold">Admin Panel</h1>
          </div>
          <p className="text-xs text-muted-foreground">Manage user accounts and balances</p>
          <div className="flex items-center gap-2 mt-3 text-sm">
            <Users className="w-4 h-4 text-primary" />
            <span className="font-medium">{users.length} users</span>
          </div>
        </motion.div>
      </div>

      <div className="px-4 space-y-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search by email or role..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 bg-secondary/50"
          />
        </div>

        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground text-sm">No users found</div>
        ) : (
          <div className="space-y-2">
            {filtered.map(user => (
              <div
                key={user.id}
                className="bg-card border border-border rounded-xl p-4"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-sm truncate">{user.email}</p>
                    <p className="text-xs text-muted-foreground mt-0.5 capitalize">{user.role ?? 'user'}</p>
                    <p className="text-primary font-bold font-mono mt-2">
                      {formatCurrency(user.balance ?? 0)}
                    </p>
                    {user.created_date && (
                      <p className="text-[10px] text-muted-foreground mt-1">
                        Joined {format(new Date(user.created_date), 'MMM d, yyyy')}
                      </p>
                    )}
                  </div>
                  <div className="flex gap-1 shrink-0">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => openEdit(user)}
                    >
                      <Pencil className="w-4 h-4" />
                    </Button>
                    {user.role !== 'admin' && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive hover:text-destructive"
                        onClick={() => handleDelete(user)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <Dialog open={Boolean(editingUser)} onOpenChange={(open) => !open && setEditingUser(null)}>
        <DialogContent className="max-w-[calc(100%-2rem)] rounded-xl">
          <DialogHeader>
            <DialogTitle>Edit User</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="admin-email">Email</Label>
              <Input
                id="admin-email"
                type="email"
                value={form.email}
                onChange={(e) => setForm(f => ({ ...f, email: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="admin-balance">Balance (USD)</Label>
              <Input
                id="admin-balance"
                type="number"
                min="0"
                step="0.01"
                value={form.balance}
                onChange={(e) => setForm(f => ({ ...f, balance: e.target.value }))}
                className="font-mono"
              />
            </div>
            <div className="space-y-2">
              <Label>Role</Label>
              <Select value={form.role} onValueChange={(role) => setForm(f => ({ ...f, role }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="user">User</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setEditingUser(null)} disabled={saving}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={saving} className="primary-gradient text-primary-foreground">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Save changes'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
