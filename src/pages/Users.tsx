import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { LogOut, Plus, Trash2, CheckCircle, XCircle, Calendar } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface UserCredential {
  id: string;
  username: string;
  secret_code: string;
  is_active: boolean;
  created_at: string;
  expires_at: string | null;
}

const Users = () => {
  const navigate = useNavigate();
  const [users, setUsers] = useState<UserCredential[]>([]);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [newUsername, setNewUsername] = useState("");
  const [newSecretCode, setNewSecretCode] = useState("");
  const [expiresAt, setExpiresAt] = useState("");

  useEffect(() => {
    checkAdminAndFetchUsers();
  }, []);

  const checkAdminAndFetchUsers = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      navigate("/auth");
      return;
    }

    const { data: roles } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", session.user.id)
      .eq("role", "admin")
      .single();

    if (!roles) {
      toast.error("Access denied. Admin only.");
      navigate("/mines");
      return;
    }

    setIsAdmin(true);
    fetchUsers();
  };

  const fetchUsers = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("user_credentials")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      toast.error("Failed to fetch users");
    } else {
      setUsers(data || []);
    }
    setLoading(false);
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    const { error } = await supabase
      .from("user_credentials")
      .insert({
        username: newUsername,
        secret_code: newSecretCode,
        created_by: session.user.id,
        expires_at: expiresAt || null,
      });

    if (error) {
      toast.error("Failed to create user: " + error.message);
    } else {
      toast.success("User created successfully!");
      setNewUsername("");
      setNewSecretCode("");
      setExpiresAt("");
      setDialogOpen(false);
      fetchUsers();
    }
  };

  const handleToggleActive = async (id: string, currentStatus: boolean) => {
    const { error } = await supabase
      .from("user_credentials")
      .update({ is_active: !currentStatus })
      .eq("id", id);

    if (error) {
      toast.error("Failed to update user status");
    } else {
      toast.success(`User ${!currentStatus ? "activated" : "deactivated"} successfully`);
      fetchUsers();
    }
  };

  const handleSetExpiration = async (id: string) => {
    const expiryDate = prompt("Enter expiration date (YYYY-MM-DD HH:MM:SS or leave empty to remove):");
    
    if (expiryDate === null) return; // User cancelled
    
    const { error } = await supabase
      .from("user_credentials")
      .update({ expires_at: expiryDate || null })
      .eq("id", id);

    if (error) {
      toast.error("Failed to set expiration date");
    } else {
      toast.success(expiryDate ? "Expiration date set successfully" : "Expiration date removed");
      fetchUsers();
    }
  };

  const handleDeleteUser = async (id: string) => {
    const { error } = await supabase
      .from("user_credentials")
      .delete()
      .eq("id", id);

    if (error) {
      toast.error("Failed to delete user");
    } else {
      toast.success("User deleted successfully");
      fetchUsers();
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    toast.success("Logged out successfully");
    navigate("/auth");
  };

  if (!isAdmin) return null;

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            User Management
          </h1>
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              onClick={() => navigate("/mines")}
              className="border-border hover:bg-primary/20"
            >
              Mines
            </Button>
            <Button 
              variant="outline" 
              onClick={handleLogout}
              className="border-border hover:bg-destructive/20 hover:text-destructive hover:border-destructive"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>

        <Card className="p-6 bg-card border-border">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold text-foreground">Users</h2>
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-[0_0_20px_rgba(34,211,238,0.3)]">
                  <Plus className="w-4 h-4 mr-2" />
                  Add User
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-card border-border">
                <DialogHeader>
                  <DialogTitle className="text-foreground">Create New User</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleCreateUser} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="username" className="text-foreground">Username</Label>
                    <Input
                      id="username"
                      value={newUsername}
                      onChange={(e) => setNewUsername(e.target.value)}
                      required
                      className="bg-input border-border text-foreground"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="secret_code" className="text-foreground">Secret Code</Label>
                    <Input
                      id="secret_code"
                      value={newSecretCode}
                      onChange={(e) => setNewSecretCode(e.target.value)}
                      required
                      className="bg-input border-border text-foreground"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="expires_at" className="text-foreground">Expiration Date (Optional)</Label>
                    <Input
                      id="expires_at"
                      type="datetime-local"
                      value={expiresAt}
                      onChange={(e) => setExpiresAt(e.target.value)}
                      className="bg-input border-border text-foreground"
                    />
                  </div>
                  <Button 
                    type="submit" 
                    className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
                  >
                    Create User
                  </Button>
                </form>
              </DialogContent>
            </Dialog>
          </div>

          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto" />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="border-border hover:bg-muted/50">
                  <TableHead className="text-muted-foreground">Username</TableHead>
                  <TableHead className="text-muted-foreground">Secret Code</TableHead>
                  <TableHead className="text-muted-foreground">Status</TableHead>
                  <TableHead className="text-muted-foreground">Expires</TableHead>
                  <TableHead className="text-muted-foreground">Created</TableHead>
                  <TableHead className="text-muted-foreground">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((user) => (
                  <TableRow key={user.id} className="border-border hover:bg-muted/30">
                    <TableCell className="font-medium text-foreground">{user.username}</TableCell>
                    <TableCell className="font-mono text-sm text-foreground">{user.secret_code}</TableCell>
                    <TableCell>
                      <span className={`px-2 py-1 rounded text-xs ${
                        user.is_active 
                          ? 'bg-accent/20 text-accent' 
                          : 'bg-destructive/20 text-destructive'
                      }`}>
                        {user.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {user.expires_at ? new Date(user.expires_at).toLocaleString() : 'Never'}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {new Date(user.created_at).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleToggleActive(user.id, user.is_active)}
                          className={user.is_active 
                            ? "border-destructive/50 text-destructive hover:bg-destructive/20" 
                            : "border-accent/50 text-accent hover:bg-accent/20"
                          }
                          title={user.is_active ? "Deactivate" : "Activate"}
                        >
                          {user.is_active ? <XCircle className="w-4 h-4" /> : <CheckCircle className="w-4 h-4" />}
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleSetExpiration(user.id)}
                          className="border-primary/50 text-primary hover:bg-primary/20"
                          title="Set Expiration"
                        >
                          <Calendar className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDeleteUser(user.id)}
                          className="border-destructive/50 text-destructive hover:bg-destructive/20"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </Card>
      </div>
    </div>
  );
};

export default Users;
