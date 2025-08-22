import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Zap, User, LogOut, Home, Sword, Heart, Trophy } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import type { User as SupabaseUser } from "@supabase/supabase-js";

interface NavigationProps {
  showAuth?: boolean;
}

const Navigation = ({ showAuth = true }: NavigationProps) => {
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [username, setUsername] = useState<string>("");
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // Check current user
    const checkUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
      
      if (user) {
        // Fetch username from profiles table
        const { data: profile } = await supabase
          .from('profiles')
          .select('username')
          .eq('user_id', user.id)
          .single();
        
        if (profile) {
          setUsername(profile.username);
        }
      }
    };

    checkUser();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      setUser(session?.user ?? null);
      
      if (session?.user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('username')
          .eq('user_id', session.user.id)
          .single();
        
        if (profile) {
          setUsername(profile.username);
        }
      } else {
        setUsername("");
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut();
      toast.success("Signed out successfully");
      navigate('/');
    } catch (error) {
      toast.error("Error signing out");
    }
  };

  const isActivePage = (path: string) => {
    return location.pathname === path;
  };

  return (
    <header className="border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
      <div className="container mx-auto px-4 py-3">
        <div className="flex justify-between items-center">
          {/* Logo and Brand */}
          <div className="flex items-center space-x-2 cursor-pointer" onClick={() => navigate("/")}>
            <Zap className="h-6 w-6 text-primary" />
            <h1 className="text-xl font-bold text-foreground">PokéBattle Arena</h1>
          </div>

          {/* Navigation Links - Only show when authenticated */}
          {user && (
            <nav className="hidden md:flex items-center space-x-4">
              <Button
                variant={isActivePage("/pokemon") ? "default" : "ghost"}
                size="sm"
                onClick={() => navigate("/pokemon")}
              >
                <Home className="h-4 w-4 mr-2" />
                Pokédex
              </Button>
              <Button
                variant={isActivePage("/favorites") ? "default" : "ghost"}
                size="sm"
                onClick={() => navigate("/favorites")}
              >
                <Heart className="h-4 w-4 mr-2" />
                Favorites
              </Button>
              <Button
                variant={isActivePage("/battle") ? "default" : "ghost"}
                size="sm"
                onClick={() => navigate("/battle")}
              >
                <Sword className="h-4 w-4 mr-2" />
                Battle
              </Button>
              <Button
                variant={isActivePage("/leaderboard") ? "default" : "ghost"}
                size="sm"
                onClick={() => navigate("/leaderboard")}
              >
                <Trophy className="h-4 w-4 mr-2" />
                Leaderboard
              </Button>
            </nav>
          )}

          {/* User Menu or Auth Button */}
          {showAuth && (
            <div className="flex items-center space-x-4">
              {user ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="flex items-center space-x-2 px-3">
                      <Avatar className="h-6 w-6">
                        <AvatarImage src="" />
                        <AvatarFallback>
                          {username ? username.charAt(0).toUpperCase() : user.email?.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-sm font-medium">
                        {username || user.email?.split('@')[0]}
                      </span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    <DropdownMenuItem onClick={() => navigate("/profile")}>
                      <User className="h-4 w-4 mr-2" />
                      Profile
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleSignOut} className="text-destructive">
                      <LogOut className="h-4 w-4 mr-2" />
                      Sign Out
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <Button onClick={() => navigate("/auth")} variant="outline">
                  Sign In
                </Button>
              )}
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Navigation;