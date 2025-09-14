import { useState } from "react";
import { Eye, EyeOff, Lock, Wine } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";

export default function PrivacyLoginPage() {
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const { login, isLoading } = useAuth();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!password.trim()) {
      toast({
        title: "Fehler",
        description: "Bitte geben Sie das Passwort ein",
        variant: "destructive",
      });
      return;
    }

    const result = await login(password);
    
    if (!result.success) {
      toast({
        title: "Login fehlgeschlagen",
        description: result.error || "Ungültiges Passwort",
        variant: "destructive",
      });
      setPassword(""); // Clear password on failed attempt
    } else {
      toast({
        title: "Erfolgreich angemeldet",
        description: "Willkommen zur Weinberg Tour 2025!",
      });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-white to-green-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="flex justify-center">
            <div className="bg-amber-100 dark:bg-amber-900 p-3 rounded-full">
              <Wine className="w-8 h-8 text-amber-600 dark:text-amber-400" />
            </div>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Weinberg Tour 2025
          </h1>
          <p className="text-gray-600 dark:text-gray-300 text-sm">
            Bitte geben Sie das Passwort ein, um die Tour-Details zu sehen
          </p>
        </div>

        {/* Login Form */}
        <Card className="shadow-lg border-0 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm">
          <CardHeader className="space-y-1 pb-4">
            <CardTitle className="text-center text-lg font-medium flex items-center justify-center gap-2">
              <Lock className="w-4 h-4" />
              Passwort erforderlich
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="password">Passwort</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Geben Sie das Tour-Passwort ein"
                    className="pr-10"
                    required
                    disabled={isLoading}
                    data-testid="input-privacy-password"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() => setShowPassword(!showPassword)}
                    disabled={isLoading}
                    data-testid="button-toggle-password"
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4 text-gray-400" />
                    ) : (
                      <Eye className="h-4 w-4 text-gray-400" />
                    )}
                  </Button>
                </div>
              </div>
              
              <Button
                type="submit"
                className="w-full bg-amber-600 hover:bg-amber-700 dark:bg-amber-700 dark:hover:bg-amber-600"
                disabled={isLoading}
                data-testid="button-privacy-login"
              >
                {isLoading ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Anmelden...
                  </div>
                ) : (
                  "Anmelden"
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="text-center text-xs text-gray-500 dark:text-gray-400">
          <p>Diese Seite ist passwortgeschützt</p>
          <p className="mt-1">
            Sie bleiben angemeldet, bis Sie sich abmelden
          </p>
        </div>
      </div>
    </div>
  );
}