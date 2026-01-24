import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useUserRole, AppRole } from "@/hooks/useUserRole";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Users, Shield, Search, UserX, UserCheck, Trash2, Loader2, Plus, Pencil } from "lucide-react";

interface UserWithRole {
  id: string;
  user_id: string;
  nombres: string;
  apellidos: string;
  empresa: string | null;
  activo: boolean;
  created_at: string;
  role: AppRole;
  email?: string;
}

interface NewUserForm {
  email: string;
  password: string;
  nombres: string;
  apellidos: string;
  empresa: string;
  role: AppRole;
}

const initialNewUserForm: NewUserForm = {
  email: "",
  password: "",
  nombres: "",
  apellidos: "",
  empresa: "",
  role: "user",
};

export default function UsuariosPage() {
  const { user: currentUser } = useAuth();
  const { isAdmin, loading: roleLoading } = useUserRole();
  const [users, setUsers] = useState<UserWithRole[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<UserWithRole | null>(null);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [newUserForm, setNewUserForm] = useState<NewUserForm>(initialNewUserForm);
  const [creating, setCreating] = useState(false);
  const [editingUser, setEditingUser] = useState<UserWithRole | null>(null);

  useEffect(() => {
    if (isAdmin) {
      fetchUsers();
    }
  }, [isAdmin]);

  async function fetchUsers() {
    try {
      setLoading(true);

      // Obtener perfiles
      const { data: profiles, error: profilesError } = await supabase
        .from("profiles")
        .select("*")
        .order("created_at", { ascending: false });

      if (profilesError) throw profilesError;

      // Obtener roles
      const { data: roles, error: rolesError } = await supabase
        .from("user_roles")
        .select("*");

      if (rolesError) throw rolesError;

      // Combinar datos
      const usersWithRoles: UserWithRole[] = (profiles || []).map((profile) => {
        const userRole = roles?.find((r) => r.user_id === profile.user_id);
        return {
          ...profile,
          activo: profile.activo ?? true,
          role: (userRole?.role as AppRole) || "user",
        };
      });

      setUsers(usersWithRoles);
    } catch (error: any) {
      console.error("Error fetching users:", error);
      toast.error("Error al cargar usuarios");
    } finally {
      setLoading(false);
    }
  }

  async function updateUserRole(userId: string, newRole: AppRole) {
    try {
      // Verificar si ya existe un rol
      const { data: existing } = await supabase
        .from("user_roles")
        .select("id")
        .eq("user_id", userId)
        .maybeSingle();

      if (existing) {
        const { error } = await supabase
          .from("user_roles")
          .update({ role: newRole })
          .eq("user_id", userId);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("user_roles")
          .insert({ user_id: userId, role: newRole });

        if (error) throw error;
      }

      setUsers((prev) =>
        prev.map((u) => (u.user_id === userId ? { ...u, role: newRole } : u))
      );

      toast.success("Rol actualizado correctamente");
    } catch (error: any) {
      console.error("Error updating role:", error);
      toast.error("Error al actualizar rol");
    }
  }

  async function toggleUserActive(userId: string, currentActive: boolean) {
    try {
      const { error } = await supabase
        .from("profiles")
        .update({ activo: !currentActive })
        .eq("user_id", userId);

      if (error) throw error;

      setUsers((prev) =>
        prev.map((u) =>
          u.user_id === userId ? { ...u, activo: !currentActive } : u
        )
      );

      toast.success(
        currentActive ? "Usuario desactivado" : "Usuario activado"
      );
    } catch (error: any) {
      console.error("Error toggling user:", error);
      toast.error("Error al cambiar estado del usuario");
    }
  }

  async function deleteUser() {
    if (!userToDelete) return;

    try {
      // Eliminar rol
      await supabase
        .from("user_roles")
        .delete()
        .eq("user_id", userToDelete.user_id);

      // Eliminar perfil (el usuario en auth.users se eliminará por CASCADE si es necesario)
      const { error } = await supabase
        .from("profiles")
        .delete()
        .eq("user_id", userToDelete.user_id);

      if (error) throw error;

      setUsers((prev) => prev.filter((u) => u.user_id !== userToDelete.user_id));
      toast.success("Usuario eliminado correctamente");
    } catch (error: any) {
      console.error("Error deleting user:", error);
      toast.error("Error al eliminar usuario");
    } finally {
      setDeleteDialogOpen(false);
      setUserToDelete(null);
    }
  }

  function openEditDialog(user: UserWithRole) {
    setEditingUser(user);
    setNewUserForm({
      email: user.email || "",
      password: "",
      nombres: user.nombres,
      apellidos: user.apellidos,
      empresa: user.empresa || "",
      role: user.role,
    });
    setCreateDialogOpen(true);
  }

  function closeUserDialog() {
    setCreateDialogOpen(false);
    setEditingUser(null);
    setNewUserForm(initialNewUserForm);
  }

  async function handleSubmitUser() {
    if (!newUserForm.nombres || !newUserForm.apellidos) {
      toast.error("Por favor complete nombres y apellidos");
      return;
    }

    if (editingUser) {
      await updateUser();
    } else {
      await createUser();
    }
  }

  async function updateUser() {
    if (!editingUser) return;

    try {
      setCreating(true);

      // Update profile
      const { error: profileError } = await supabase
        .from("profiles")
        .update({
          nombres: newUserForm.nombres,
          apellidos: newUserForm.apellidos,
          empresa: newUserForm.empresa || null,
        })
        .eq("user_id", editingUser.user_id);

      if (profileError) throw profileError;

      // Update role if changed
      if (newUserForm.role !== editingUser.role) {
        await updateUserRole(editingUser.user_id, newUserForm.role);
      }

      toast.success("Usuario actualizado correctamente");
      closeUserDialog();
      fetchUsers();
    } catch (error: any) {
      console.error("Error updating user:", error);
      toast.error(error.message || "Error al actualizar usuario");
    } finally {
      setCreating(false);
    }
  }

  async function createUser() {
    if (!newUserForm.email || !newUserForm.password) {
      toast.error("Por favor complete email y contraseña");
      return;
    }

    if (newUserForm.password.length < 6) {
      toast.error("La contraseña debe tener al menos 6 caracteres");
      return;
    }

    try {
      setCreating(true);

      // Get current session token
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error("Sesión no válida");
        return;
      }

      // Call edge function to create user without affecting admin session
      const response = await supabase.functions.invoke("create-user", {
        body: {
          email: newUserForm.email,
          password: newUserForm.password,
          nombres: newUserForm.nombres,
          apellidos: newUserForm.apellidos,
          empresa: newUserForm.empresa || null,
          role: newUserForm.role,
        },
      });

      if (response.error) {
        throw new Error(response.error.message || "Error al crear usuario");
      }

      if (response.data?.error) {
        // Handle duplicate email error specifically
        if (response.data.error.includes("correo electrónico") || response.data.error.includes("email")) {
          toast.warning("El correo electrónico ingresado ya está en uso por otro usuario");
          return;
        }
        toast.error(response.data.error);
        return;
      }

      toast.success("Usuario creado correctamente");
      closeUserDialog();
      fetchUsers();
    } catch (error: any) {
      console.error("Error creating user:", error);
      // Handle duplicate email error from exception
      if (error.message?.includes("correo electrónico") || error.message?.includes("email") || error.message?.includes("already")) {
        toast.warning("El correo electrónico ingresado ya está en uso por otro usuario");
        return;
      }
      toast.error(error.message || "Error al crear usuario");
    } finally {
      setCreating(false);
    }
  }

  const filteredUsers = users.filter(
    (u) =>
      u.nombres.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.apellidos.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (u.empresa?.toLowerCase() || "").includes(searchTerm.toLowerCase())
  );

  const getRoleBadgeVariant = (role: AppRole) => {
    switch (role) {
      case "admin":
        return "destructive";
      case "supervisor":
        return "default";
      default:
        return "secondary";
    }
  };

  const getRoleLabel = (role: AppRole) => {
    switch (role) {
      case "admin":
        return "Administrador";
      case "supervisor":
        return "Supervisor";
      default:
        return "Usuario";
    }
  };

  if (roleLoading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="flex min-h-[400px] flex-col items-center justify-center gap-4">
        <Shield className="h-16 w-16 text-muted-foreground" />
        <h2 className="text-xl font-semibold">Acceso Restringido</h2>
        <p className="text-muted-foreground">
          Solo los administradores pueden acceder a esta sección.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Users className="h-6 w-6" />
            Gestión de Usuarios
          </h1>
          <p className="text-muted-foreground">
            Administra los usuarios del sistema y sus roles
          </p>
        </div>
        <Button onClick={() => setCreateDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Nuevo Usuario
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Usuarios Registrados</CardTitle>
            <div className="relative w-64">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar usuarios..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
              <Users className="h-12 w-12 mb-2" />
              <p>No se encontraron usuarios</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Usuario</TableHead>
                  <TableHead>Empresa</TableHead>
                  <TableHead>Rol</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Registro</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell>
                      <div className="font-medium">
                        {user.nombres} {user.apellidos}
                      </div>
                    </TableCell>
                    <TableCell>{user.empresa || "-"}</TableCell>
                    <TableCell>
                      <Select
                        value={user.role}
                        onValueChange={(value: AppRole) =>
                          updateUserRole(user.user_id, value)
                        }
                        disabled={user.user_id === currentUser?.id}
                      >
                        <SelectTrigger className="w-[140px]">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="admin">Administrador</SelectItem>
                          <SelectItem value="supervisor">Supervisor</SelectItem>
                          <SelectItem value="user">Usuario</SelectItem>
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={user.activo ? "default" : "secondary"}
                        className={user.activo ? "bg-green-600" : ""}
                      >
                        {user.activo ? "Activo" : "Inactivo"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {new Date(user.created_at).toLocaleDateString("es-PE")}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => openEditDialog(user)}
                          disabled={user.user_id === currentUser?.id}
                          title="Editar usuario"
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="destructive"
                          size="icon"
                          onClick={() => {
                            setUserToDelete(user);
                            setDeleteDialogOpen(true);
                          }}
                          disabled={user.user_id === currentUser?.id}
                          title="Eliminar usuario"
                        >
                          <Trash2 className="h-4 w-4" />
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

      {/* Dialog Crear/Editar Usuario */}
      <Dialog open={createDialogOpen} onOpenChange={(open) => {
        if (!open) closeUserDialog();
        else setCreateDialogOpen(open);
      }}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>{editingUser ? "Editar Usuario" : "Nuevo Usuario"}</DialogTitle>
            <DialogDescription>
              {editingUser 
                ? "Modifica los datos del usuario seleccionado."
                : "Crea un nuevo usuario y asigna su rol en el sistema."}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            {!editingUser && (
              <>
                <div className="grid gap-2">
                  <Label htmlFor="email">Correo electrónico *</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="usuario@ejemplo.com"
                    value={newUserForm.email}
                    onChange={(e) => setNewUserForm({ ...newUserForm, email: e.target.value })}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="password">Contraseña *</Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="Mínimo 6 caracteres"
                    value={newUserForm.password}
                    onChange={(e) => setNewUserForm({ ...newUserForm, password: e.target.value })}
                  />
                </div>
              </>
            )}
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="nombres">Nombres *</Label>
                <Input
                  id="nombres"
                  placeholder="Nombres"
                  value={newUserForm.nombres}
                  onChange={(e) => setNewUserForm({ ...newUserForm, nombres: e.target.value })}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="apellidos">Apellidos *</Label>
                <Input
                  id="apellidos"
                  placeholder="Apellidos"
                  value={newUserForm.apellidos}
                  onChange={(e) => setNewUserForm({ ...newUserForm, apellidos: e.target.value })}
                />
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="empresa">Empresa</Label>
              <Input
                id="empresa"
                placeholder="Nombre de la empresa (opcional)"
                value={newUserForm.empresa}
                onChange={(e) => setNewUserForm({ ...newUserForm, empresa: e.target.value })}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="role">Rol *</Label>
              <Select
                value={newUserForm.role}
                onValueChange={(value: AppRole) => setNewUserForm({ ...newUserForm, role: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar rol" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="user">Usuario</SelectItem>
                  <SelectItem value="supervisor">Supervisor</SelectItem>
                  <SelectItem value="admin">Administrador</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={closeUserDialog}>
              Cancelar
            </Button>
            <Button onClick={handleSubmitUser} disabled={creating}>
              {creating && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {editingUser ? "Guardar Cambios" : "Crear Usuario"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar usuario?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. Se eliminará permanentemente el
              usuario{" "}
              <strong>
                {userToDelete?.nombres} {userToDelete?.apellidos}
              </strong>{" "}
              y todos sus datos asociados.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={deleteUser}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
