"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { 
  MapPin, 
  Clock, 
  Users, 
  CircleDollarSign, 
  ChevronRight, 
  Trophy,
  LogOut,
  User,
  Loader2
} from "lucide-react";
import { motion } from "framer-motion";
import { supabase } from "@/lib/supabase";

export default function Home() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [formData, setFormData] = useState({
    location: "",
    time: "",
    players: "10",
    price: "",
  });

  useEffect(() => {
    const checkUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
      setCheckingAuth(false);
    };
    checkUser();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    router.push("/login");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      router.push("/login");
      return;
    }
    
    setLoading(true);
    
    try {
      const { data, error } = await supabase
        .from("matches")
        .insert([
          {
            location: formData.location,
            time: formData.time,
            max_players: parseInt(formData.players),
            price: parseInt(formData.price),
            admin_id: user.id,
          },
        ])
        .select()
        .single();

      if (error) throw error;
      if (data) {
        router.push(`/match/${data.id}`);
      }
    } catch (error: any) {
      console.error("Error creating match:", error);
      alert("Error: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  if (checkingAuth) return (
    <div className="flex-1 flex items-center justify-center">
      <Loader2 className="w-8 h-8 animate-spin text-primary" />
    </div>
  );

  return (
    <main className="flex-1 flex flex-col items-center justify-center px-4 py-12 bg-[radial-gradient(circle_at_top,_var(--primary)_0%,_transparent_25%)]">
      {/* User Header */}
      <div className="absolute top-6 right-6 flex items-center gap-4">
        {user ? (
          <div className="flex items-center gap-3 glass p-2 rounded-2xl">
            <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
              <User className="w-4 h-4 text-primary" />
            </div>
            <span className="text-xs font-medium hidden sm:inline">{user.email}</span>
            <button 
              onClick={handleLogout}
              className="p-2 hover:text-red-500 transition-colors"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <button 
            onClick={() => router.push("/login")}
            className="glass px-4 py-2 rounded-2xl text-sm font-bold text-primary"
          >
            Entrar
          </button>
        )}
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md space-y-8"
      >
        <div className="text-center space-y-2">
          <div className="flex justify-center mb-4">
            <div className="p-3 rounded-2xl bg-primary/10 border border-primary/20">
              <Trophy className="w-8 h-8 text-primary" />
            </div>
          </div>
          <h1 className="text-4xl font-bold tracking-tight font-outfit">
            Falta<span className="text-primary">1</span>
          </h1>
          <p className="text-muted-foreground">
            {user ? "Armá tu partido en segundos" : "Logueate para crear un partido"}
          </p>
        </div>

        {user ? (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="glass-card p-6 rounded-3xl space-y-5">
              <div className="space-y-2">
                <label className="text-sm font-medium flex items-center gap-2 text-muted-foreground">
                  <MapPin className="w-4 h-4" /> Lugar
                </label>
                <input
                  required
                  type="text"
                  placeholder="Ej: Cancha El Predio"
                  className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium flex items-center gap-2 text-muted-foreground">
                  <Clock className="w-4 h-4" /> Cuándo
                </label>
                <input
                  required
                  type="datetime-local"
                  className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all [color-scheme:dark]"
                  value={formData.time}
                  onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium flex items-center gap-2 text-muted-foreground">
                    <Users className="w-4 h-4" /> Jugadores
                  </label>
                  <select
                    className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all appearance-none"
                    value={formData.players}
                    onChange={(e) => setFormData({ ...formData, players: e.target.value })}
                  >
                    <option value="10">5 vs 5</option>
                    <option value="14">7 vs 7</option>
                    <option value="18">9 vs 9</option>
                    <option value="22">11 vs 11</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium flex items-center gap-2 text-muted-foreground">
                    <CircleDollarSign className="w-4 h-4" /> Precio ($)
                  </label>
                  <input
                    required
                    type="number"
                    placeholder="Total p/p"
                    className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                  />
                </div>
              </div>
            </div>

            <button
              disabled={loading}
              type="submit"
              className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-bold py-4 rounded-3xl flex items-center justify-center gap-2 transition-all active:scale-[0.98] disabled:opacity-50"
            >
              {loading ? (
                <Loader2 className="w-6 h-6 animate-spin" />
              ) : (
                <>
                  Crear partido
                  <ChevronRight className="w-5 h-5" />
                </>
              )}
            </button>
          </form>
        ) : (
          <div className="space-y-4">
            <button
              onClick={() => router.push("/login")}
              className="w-full bg-primary text-primary-foreground font-bold py-6 rounded-3xl flex items-center justify-center gap-3 transition-all active:scale-[0.98]"
            >
              <LogIn className="w-6 h-6" />
              Entrar para organizar
            </button>
            <p className="text-center text-sm text-muted-foreground">
              Es gratis y te permite gestionar todos tus partidos.
            </p>
          </div>
        )}

        <div className="flex justify-center mt-6">
          <button
            onClick={() => router.push("/ranking")}
            className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-primary transition-colors"
          >
            <Trophy className="w-4 h-4" />
            Ver Ranking de Cracks
          </button>
        </div>
      </motion.div>
    </main>
  );
}
