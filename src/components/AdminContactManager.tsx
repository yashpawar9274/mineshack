import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Phone } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const AdminContactManager = () => {
  const [whatsappNumber, setWhatsappNumber] = useState("");
  const [loading, setLoading] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);

  useEffect(() => {
    fetchContact();
    
    // Subscribe to real-time updates
    const channel = supabase
      .channel('admin-contact-changes')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'admin_contact'
        },
        (payload) => {
          setWhatsappNumber(payload.new.whatsapp_number);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchContact = async () => {
    const { data } = await supabase
      .from("admin_contact")
      .select("whatsapp_number")
      .single();
    
    if (data) {
      setWhatsappNumber(data.whatsapp_number);
    }
  };

  const handleUpdateContact = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Not authenticated");

      const { error } = await supabase
        .from("admin_contact")
        .update({ 
          whatsapp_number: whatsappNumber,
          updated_by: session.user.id 
        })
        .eq("id", (await supabase.from("admin_contact").select("id").single()).data?.id);

      if (error) throw error;

      toast.success("Contact number updated successfully!");
      setDialogOpen(false);
    } catch (error: any) {
      toast.error(error.message || "Failed to update contact");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="border-border hover:bg-primary/20">
          <Phone className="w-4 h-4 mr-2" />
          Update Contact
        </Button>
      </DialogTrigger>
      <DialogContent className="bg-card border-border">
        <DialogHeader>
          <DialogTitle className="text-foreground">Update Admin Contact</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleUpdateContact} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="whatsapp" className="text-foreground">WhatsApp Number</Label>
            <Input
              id="whatsapp"
              type="tel"
              value={whatsappNumber}
              onChange={(e) => setWhatsappNumber(e.target.value)}
              required
              className="bg-input border-border text-foreground"
              placeholder="8446690597"
            />
          </div>
          <Button 
            type="submit" 
            className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
            disabled={loading}
          >
            {loading ? "Updating..." : "Update Contact"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
};
