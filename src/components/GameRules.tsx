import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { HelpCircle } from "lucide-react";

export const GameRules = () => {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="border-border hover:bg-primary/20">
          <HelpCircle className="w-4 h-4 mr-2" />
          Game Rules
        </Button>
      </DialogTrigger>
      <DialogContent className="bg-card border-border max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            Mines Game Rules
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 text-foreground">
          <div>
            <h3 className="font-semibold text-lg mb-2 text-primary">How to Verify Results</h3>
            <ol className="list-decimal list-inside space-y-2 text-muted-foreground">
              <li>Enter your <span className="text-foreground font-semibold">Client Seed</span> (provided by the game)</li>
              <li>Enter the <span className="text-foreground font-semibold">Server Seed</span> (revealed after the game)</li>
              <li>Set the <span className="text-foreground font-semibold">Nonce</span> (round number)</li>
              <li>Select the number of <span className="text-foreground font-semibold">Mines</span> used in the game</li>
            </ol>
          </div>

          <div>
            <h3 className="font-semibold text-lg mb-2 text-primary">Understanding the Grid</h3>
            <ul className="list-disc list-inside space-y-2 text-muted-foreground">
              <li><span className="text-destructive font-semibold">Red circles with X</span> = Mine locations (dangerous)</li>
              <li><span className="text-accent font-semibold">Green diamonds</span> = Safe spots (rewards)</li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold text-lg mb-2 text-primary">Provably Fair System</h3>
            <p className="text-muted-foreground">
              The game uses cryptographic hashing (SHA-256) to ensure fairness. The mine positions 
              are determined by combining your Client Seed, the Server Seed, and the Nonce. This 
              makes the results verifiable and impossible to manipulate.
            </p>
          </div>

          <div className="bg-primary/10 border border-primary/20 rounded-lg p-4">
            <h3 className="font-semibold text-lg mb-2 text-primary">Important Note</h3>
            <p className="text-foreground">
              Without entering the correct seeds, the grid will not display mine or diamond positions. 
              Seeds are revealed only after the game round is complete.
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
