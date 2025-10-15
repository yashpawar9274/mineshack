import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card } from "@/components/ui/card";
import { ChevronDown, ChevronUp, LogOut, Users } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { generateMines } from "@/utils/mineGenerator";
import { GameRules } from "@/components/GameRules";

const Mines = () => {
  const navigate = useNavigate();
  const [isAdmin, setIsAdmin] = useState(false);
  const [nonce, setNonce] = useState(0);
  const [minesCount, setMinesCount] = useState(4);
  const [clientSeed, setClientSeed] = useState("");
  const [serverSeed, setServerSeed] = useState("");
  const [grid, setGrid] = useState<boolean[]>(Array(25).fill(false));
  const [showGrid, setShowGrid] = useState(false);

  useEffect(() => {
    checkAuthAndRole();

    // Subscribe to user credential changes for real-time deactivation
    const credentialsChannel = supabase
      .channel('user-credentials-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'user_credentials'
        },
        (payload) => {
          const credentialId = localStorage.getItem('user_credential_id');
          if (payload.eventType === 'DELETE' && payload.old?.id === credentialId) {
            toast.error("Your account has been deleted by admin.");
            setTimeout(() => {
              handleLogout();
            }, 2000);
          } else if (payload.eventType === 'UPDATE' && payload.new?.id === credentialId && !payload.new?.is_active) {
            toast.error("Your account has been deactivated by admin.");
            setTimeout(() => {
              handleLogout();
            }, 2000);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(credentialsChannel);
    };
  }, []);

  const checkAuthAndRole = async () => {
    const credentialId = localStorage.getItem('user_credential_id');
    if (!credentialId) {
      navigate("/auth");
      return;
    }

    // Verify credential is still valid
    const { data: credential } = await supabase
      .from("user_credentials")
      .select("*")
      .eq("id", credentialId)
      .single();

    if (!credential || !credential.is_active) {
      toast.error("Session invalid. Please login again.");
      navigate("/auth");
      return;
    }

    // Check if admin
    const { data: { session } } = await supabase.auth.getSession();
    if (session) {
      const { data: roles } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", session.user.id)
        .eq("role", "admin");

      setIsAdmin(roles && roles.length > 0);
    }
  };

  const handleLogout = async () => {
    localStorage.removeItem('current_username');
    localStorage.removeItem('user_credential_id');
    await supabase.auth.signOut();
    toast.success("Logged out successfully");
    navigate("/auth");
  };

  useEffect(() => {
    // Only generate mines if both seeds are provided
    if (clientSeed && serverSeed) {
      const newGrid = generateMines(clientSeed, serverSeed, nonce, minesCount);
      setGrid(newGrid);
      setShowGrid(true);
    } else {
      setShowGrid(false);
      setGrid(Array(25).fill(false));
    }
  }, [minesCount, clientSeed, serverSeed, nonce]);

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="flex justify-between items-center flex-wrap gap-4">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            Mines Verification
          </h1>
          <div className="flex gap-2 flex-wrap">
            <GameRules />
            {isAdmin && (
              <Button 
                variant="outline" 
                onClick={() => navigate("/users")}
                className="border-border hover:bg-accent/20 hover:border-accent"
              >
                <Users className="w-4 h-4 mr-2" />
                Users
              </Button>
            )}
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

        <Card className="p-6 bg-card border-border space-y-6">
          <div className="space-y-2">
            <Label className="text-foreground">Game</Label>
            <Select defaultValue="mines">
              <SelectTrigger className="bg-input border-border text-foreground">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-popover border-border">
                <SelectItem value="mines">Mines</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label className="text-foreground">Client Seed</Label>
            <Input
              value={clientSeed}
              onChange={(e) => setClientSeed(e.target.value)}
              className="bg-input border-border text-foreground font-mono"
            />
          </div>

          <div className="space-y-2">
            <Label className="text-foreground">Server Seed</Label>
            <Input
              value={serverSeed}
              onChange={(e) => setServerSeed(e.target.value)}
              className="bg-input border-border text-foreground font-mono text-sm"
            />
          </div>

          <div className="space-y-2">
            <Label className="text-foreground">Nonce</Label>
            <div className="flex gap-2">
              <Input
                value={nonce}
                readOnly
                className="bg-input border-border text-foreground flex-1"
              />
              <div className="flex flex-col gap-1">
                <Button
                  size="icon"
                  variant="outline"
                  onClick={() => setNonce(n => n + 1)}
                  className="h-7 w-10 border-border hover:bg-primary/20 hover:border-primary"
                >
                  <ChevronUp className="h-4 w-4" />
                </Button>
                <Button
                  size="icon"
                  variant="outline"
                  onClick={() => setNonce(n => Math.max(0, n - 1))}
                  className="h-7 w-10 border-border hover:bg-primary/20 hover:border-primary"
                >
                  <ChevronDown className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-foreground">Mines</Label>
            <Select value={minesCount.toString()} onValueChange={(v) => setMinesCount(Number(v))}>
              <SelectTrigger className="bg-input border-border text-foreground">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-popover border-border">
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(num => (
                  <SelectItem key={num} value={num.toString()}>{num}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="border-2 border-dashed border-border rounded-lg p-4">
            {!showGrid && (
              <div className="text-center py-12">
                <p className="text-muted-foreground text-lg">
                  Enter Client Seed and Server Seed to view mine positions
                </p>
              </div>
            )}
            {showGrid && (
              <div className="grid grid-cols-5 gap-3">
                {grid.map((isMine, index) => (
                  <div
                    key={index}
                    className={`aspect-square rounded-lg flex items-center justify-center transition-all ${
                      isMine 
                        ? 'bg-destructive/20 border-2 border-destructive shadow-[0_0_15px_rgba(239,68,68,0.3)]' 
                        : 'bg-accent/20 border-2 border-accent shadow-[0_0_15px_rgba(16,185,129,0.2)]'
                    }`}
                  >
                    {isMine ? (
                      <div className="relative">
                        <div className="w-8 h-8 rounded-full bg-destructive" />
                        <div className="absolute inset-0 flex items-center justify-center">
                          <div className="w-6 h-0.5 bg-background rotate-45" />
                          <div className="w-6 h-0.5 bg-background -rotate-45 absolute" />
                        </div>
                      </div>
                    ) : (
                      <div className="w-8 h-8 bg-gradient-to-br from-accent to-primary rounded-full shadow-[0_0_10px_rgba(16,185,129,0.5)]" 
                           style={{
                             clipPath: 'polygon(50% 0%, 61% 35%, 98% 35%, 68% 57%, 79% 91%, 50% 70%, 21% 91%, 32% 57%, 2% 35%, 39% 35%)'
                           }}
                      />
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
};

export default Mines;
