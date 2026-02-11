"use client";

import { useCallback, useEffect, useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  UserPlus,
  Pencil,
  ShieldCheck,
  ShieldOff,
  KeyRound,
  Loader2,
  Users,
} from "lucide-react";

// ──────────────────────────────────────────────
// Types
// ──────────────────────────────────────────────

interface UserRow {
  id: string;
  name: string;
  email: string;
  role: string;
  isActive: boolean;
  mustChangePassword: boolean;
  managerId: string | null;
  manager: { id: string; name: string } | null;
  createdAt: string;
  _count: { reports: number; dsrs: number; staff: number };
}

interface UserForm {
  name: string;
  email: string;
  password: string;
  role: string;
  managerId: string;
}

const emptyForm: UserForm = {
  name: "",
  email: "",
  password: "",
  role: "sales_manager",
  managerId: "",
};

function roleLabel(r: string) {
  if (r === "admin") return "Admin";
  if (r === "sales_manager") return "Sales Manager";
  return "CS Staff";
}

function roleBadgeVariant(r: string) {
  if (r === "admin") return "default" as const;
  if (r === "sales_manager") return "secondary" as const;
  return "outline" as const;
}

// ══════════════════════════════════════════════
// Page
// ══════════════════════════════════════════════

export default function UsersPage() {
  const [users, setUsers] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  // Dialog state
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<UserRow | null>(null);
  const [form, setForm] = useState<UserForm>(emptyForm);

  // ── Fetch users ────────────────────────────
  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/users");
      const data = await res.json();
      setUsers(data.users || []);
    } catch {
      setUsers([]);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  // ── Managers for dropdown ──────────────────
  const managers = users.filter(
    (u) => u.role === "sales_manager" && u.isActive
  );

  // ── Open dialog ────────────────────────────
  const openCreate = () => {
    setEditingUser(null);
    setForm(emptyForm);
    setError("");
    setDialogOpen(true);
  };

  const openEdit = (user: UserRow) => {
    setEditingUser(user);
    setForm({
      name: user.name,
      email: user.email,
      password: "",
      role: user.role,
      managerId: user.managerId || "",
    });
    setError("");
    setDialogOpen(true);
  };

  // ── Save (create or update) ────────────────
  const handleSave = async () => {
    setSaving(true);
    setError("");

    try {
      if (editingUser) {
        // Update
        const body: Record<string, unknown> = {
          name: form.name,
          email: form.email,
          role: form.role,
          managerId: form.managerId || null,
        };
        if (form.password) body.newPassword = form.password;

        const res = await fetch(`/api/admin/users?id=${editingUser.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
        const data = await res.json();
        if (!res.ok) {
          setError(data.error || "Update failed");
          setSaving(false);
          return;
        }
      } else {
        // Create
        if (!form.name || !form.email || !form.password) {
          setError("Name, email and password are required");
          setSaving(false);
          return;
        }
        const res = await fetch("/api/admin/users", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: form.name,
            email: form.email,
            password: form.password,
            role: form.role,
            managerId: form.managerId || undefined,
          }),
        });
        const data = await res.json();
        if (!res.ok) {
          setError(data.error || "Create failed");
          setSaving(false);
          return;
        }
      }

      setDialogOpen(false);
      await fetchUsers();
    } catch {
      setError("Network error");
    }
    setSaving(false);
  };

  // ── Toggle active/inactive ─────────────────
  const toggleActive = async (user: UserRow) => {
    const newState = !user.isActive;
    const confirmMsg = newState
      ? `Activate ${user.name}?`
      : `Deactivate ${user.name}? They will not be able to login.`;
    if (!confirm(confirmMsg)) return;

    await fetch(`/api/admin/users?id=${user.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive: newState }),
    });
    await fetchUsers();
  };

  // ── Force password reset ───────────────────
  const forcePasswordReset = async (user: UserRow) => {
    if (!confirm(`Force ${user.name} to change password on next login?`)) return;

    await fetch(`/api/admin/users?id=${user.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ mustChangePassword: true }),
    });
    await fetchUsers();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            User Management
          </h1>
          <p className="text-muted-foreground">
            Create, edit and manage all user accounts
          </p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={openCreate}>
              <UserPlus className="mr-2 h-4 w-4" />
              Add User
            </Button>
          </DialogTrigger>

          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editingUser ? `Edit — ${editingUser.name}` : "Create New User"}
              </DialogTitle>
              <DialogDescription>
                {editingUser
                  ? "Update user details. Leave password empty to keep current."
                  : "Fill in details. User will be prompted to change password on first login."}
              </DialogDescription>
            </DialogHeader>

            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="name">Full Name</Label>
                <Input
                  id="name"
                  value={form.name}
                  onChange={(e) =>
                    setForm({ ...form, name: e.target.value })
                  }
                  placeholder="John Doe"
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={form.email}
                  onChange={(e) =>
                    setForm({ ...form, email: e.target.value })
                  }
                  placeholder="john@tigerops.in"
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="password">
                  {editingUser ? "New Password (optional)" : "Temporary Password"}
                </Label>
                <Input
                  id="password"
                  type="password"
                  value={form.password}
                  onChange={(e) =>
                    setForm({ ...form, password: e.target.value })
                  }
                  placeholder={editingUser ? "Leave empty to keep current" : "Tiger@2025"}
                />
              </div>

              <div className="grid gap-2">
                <Label>Role</Label>
                <Select
                  value={form.role}
                  onValueChange={(val) =>
                    setForm({ ...form, role: val })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin">Admin</SelectItem>
                    <SelectItem value="sales_manager">Sales Manager</SelectItem>
                    <SelectItem value="cs_staff">CS Staff</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {form.role === "cs_staff" && (
                <div className="grid gap-2">
                  <Label>Assigned Manager</Label>
                  <Select
                    value={form.managerId || "__none__"}
                    onValueChange={(val) =>
                      setForm({
                        ...form,
                        managerId: val === "__none__" ? "" : val,
                      })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select manager" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__none__">— None —</SelectItem>
                      {managers.map((m) => (
                        <SelectItem key={m.id} value={m.id}>
                          {m.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {error && (
                <p className="text-sm text-destructive">{error}</p>
              )}
            </div>

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setDialogOpen(false)}
                disabled={saving}
              >
                Cancel
              </Button>
              <Button onClick={handleSave} disabled={saving}>
                {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {editingUser ? "Save Changes" : "Create User"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{users.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Active</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {users.filter((u) => u.isActive).length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Inactive</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-muted-foreground">
              {users.filter((u) => !u.isActive).length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Users table */}
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex h-40 items-center justify-center">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Manager</TableHead>
                  <TableHead>Data</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.length === 0 && (
                  <TableRow>
                    <TableCell
                      colSpan={7}
                      className="py-8 text-center text-muted-foreground"
                    >
                      No users found
                    </TableCell>
                  </TableRow>
                )}
                {users.map((user) => (
                  <TableRow
                    key={user.id}
                    className={!user.isActive ? "opacity-50" : ""}
                  >
                    <TableCell>
                      <div className="font-medium">{user.name}</div>
                      {user.mustChangePassword && (
                        <Badge variant="warning" className="mt-0.5 text-xs">
                          Must change pwd
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {user.email}
                    </TableCell>
                    <TableCell>
                      <Badge variant={roleBadgeVariant(user.role)}>
                        {roleLabel(user.role)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {user.isActive ? (
                        <Badge variant="success">Active</Badge>
                      ) : (
                        <Badge variant="destructive">Inactive</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {user.manager?.name || "—"}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1 text-xs">
                        {user._count.reports > 0 && (
                          <Badge variant="outline">
                            {user._count.reports} reports
                          </Badge>
                        )}
                        {user._count.dsrs > 0 && (
                          <Badge variant="outline">
                            {user._count.dsrs} DSRs
                          </Badge>
                        )}
                        {user._count.staff > 0 && (
                          <Badge variant="outline">
                            {user._count.staff} staff
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex justify-end gap-1">
                        <Button
                          size="sm"
                          variant="ghost"
                          title="Edit"
                          onClick={() => openEdit(user)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          title={
                            user.isActive ? "Deactivate" : "Activate"
                          }
                          onClick={() => toggleActive(user)}
                        >
                          {user.isActive ? (
                            <ShieldOff className="h-4 w-4 text-destructive" />
                          ) : (
                            <ShieldCheck className="h-4 w-4 text-green-600" />
                          )}
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          title="Force password reset"
                          onClick={() => forcePasswordReset(user)}
                        >
                          <KeyRound className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
