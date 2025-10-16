import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { MessageCircle } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

const Auth = () => {
  const [username, setUsername] = useState("");
  const [secretCode, setSecretCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [adminContact, setAdminContact] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    fetchAdminContact();
    
    // Subscribe to real-time contact updates
    const channel = supabase
      .channel('contact-updates')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'admin_contact'
        },
        (payload) => {
          setAdminContact(payload.new.whatsapp_number);
        }
      )
      .subscribe();

    // Subscribe to user credential changes for real-time deactivation
    const credentialsChannel = supabase
      .channel('credentials-updates')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'user_credentials'
        },
        (payload: any) => {
          if (payload.eventType === 'DELETE' || 
              (payload.eventType === 'UPDATE' && !payload.new?.is_active)) {
            const currentUser = localStorage.getItem('current_username');
            if (currentUser === payload.old?.username || currentUser === payload.new?.username) {
              toast.error("Your account has been " + (payload.eventType === 'DELETE' ? 'deleted' : 'deactivated') + " by admin. Please contact support.");
              setTimeout(() => {
                localStorage.removeItem('current_username');
                navigate("/auth");
              }, 2000);
            }
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
      supabase.removeChannel(credentialsChannel);
    };
  }, [navigate]);

  const fetchAdminContact = async () => {
    const { data } = await supabase
      .from("admin_contact")
      .select("whatsapp_number")
      .single();
    
    if (data) {
      setAdminContact(data.whatsapp_number);
    }
  };

  const handleUserLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Verify username and secret code
      const { data: credential, error: credError } = await supabase
        .from("user_credentials")
        .select("*")
        .eq("username", username)
        .eq("secret_code", secretCode)
        .maybeSingle();

      if (credError) {
        console.error("Database error:", credError);
        throw new Error("Database error occurred");
      }

      if (!credential) {
        throw new Error("Invalid username or secret code");
      }

      // Check if account is active
      if (!credential.is_active) {
        throw new Error("Account is deactivated. Contact admin.");
      }

      // Check if account is expired
      if (credential.expires_at && new Date(credential.expires_at) < new Date()) {
        throw new Error("Account has expired. Contact admin.");
      }

      localStorage.setItem('current_username', username);
      localStorage.setItem('user_credential_id', credential.id);
      
      toast.success("Login successful!");
      navigate("/mines");
    } catch (error: any) {
      toast.error(error.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md border-border bg-card/50 backdrop-blur-sm shadow-[0_0_30px_rgba(34,211,238,0.15)]">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            Mines Verification
          </CardTitle>
          <CardDescription className="text-center text-muted-foreground">
            User Login
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleUserLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="username" className="text-foreground">Username</Label>
              <Input
                id="username"
                type="text"
                placeholder="Enter username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                className="bg-input border-border text-foreground placeholder:text-muted-foreground focus:ring-primary"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="secret-code" className="text-foreground">Secret Code</Label>
              <Input
                id="secret-code"
                type="password"
                placeholder="••••••••"
                value={secretCode}
                onChange={(e) => setSecretCode(e.target.value)}
                required
                className="bg-input border-border text-foreground placeholder:text-muted-foreground focus:ring-primary"
              />
            </div>
            <Button 
              type="submit" 
              className="w-full bg-accent hover:bg-accent/90 text-accent-foreground font-semibold shadow-[0_0_20px_rgba(16,185,129,0.3)] hover:shadow-[0_0_25px_rgba(16,185,129,0.5)] transition-all"
              disabled={loading}
            >
              {loading ? "Logging in..." : "Login"}
            </Button>
          </form>

          {adminContact && (
            <div className="mt-4 pt-4 border-t border-border">
              <p className="text-sm text-muted-foreground text-center mb-2">Need help?</p>
              <Button
                variant="outline"
                className="w-full border-accent/50 text-accent hover:bg-accent/20"
                onClick={() => window.open(`https://wa.me/${adminContact}`, '_blank')}
              >
                <MessageCircle className="w-4 h-4 mr-2" />
                Contact Admin on WhatsApp
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Auth;
