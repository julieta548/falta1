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
  Loader2,
  LogIn,
  CalendarDays,
  History
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/lib/supabase";

export default function Home() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [myMatches, setMyMatches] = useState<any[]>([]);
  const [formData, setFormData] = useState({
    location: "",
    time: "",
    players: "10",
    price: "",
  });

  useEffect(() => {
    checkUser();
  }, []);

  useEffect(() => {
    if (user) {
      fetchMyMatches();
    }
  }, [user]);

  const checkUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    setUser(user);
    setCheckingAuth(false);
  };

  const fetchMyMatches = async () => {
    const { data } = await supabase
      .from('matches')
      .select('*, players(count)')
      .eq('admin_id', user.id)
      .order('time', { ascending: true });
    setMyMatches(data || []);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setMyMatches([]);
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

  const now = new Date();
  const upcomingMatches = myMatches.filter(m => new Date(m.time) >= now);
  const pastMatches = myMatches.filter(m => new Date(m.time) < now);

  return (
    <main className="flex-1 flex flex-col items-center px-4 py-12 bg-[radial-gradient(circle_at_top,_var(--primary)_0%,_transparent_25%)] min-h-screen">
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
            {user ? "Organiza y gestiona tus partidos" : "Logueate para crear un partido"}
          </p>
        </div>

        <AnimatePresence mode="wait">
          {user ? (
            <div className="space-y-8">
              {/* Upcoming Matches */}
              {upcomingMatches.length > 0 && (
                <div className="space-y-4">
                  <h3 className="text-[10px] font-bold flex items-center gap-2 px-2 text-muted-foreground uppercase tracking-widest">
                    <CalendarDays className="w-3 h-3 text-primary" /> Próximos Partidos
                  </h3>
                  <div className="space-y-3">
                    {upcomingMatches.map((m) => (
                      <motion.div
                        key={m.id}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        onClick={() => router.push(`/match/${m.id}`)}
                        className="glass-card p-4 rounded-3xl flex items-center justify-between group cursor-pointer hover:bg-white/5 transition-all"
                      >
                        <div className="space-y-1">
                          <p className="font-bold text-sm">{m.location}</p>
                          <div className="flex items-center gap-3 text-[10px] text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3" /> 
                              {new Date(m.time).toLocaleDateString('es-AR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                        </div>
                        <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
                      </motion.div>
                    ))}
                  </div>
                </div>
              )}

              {/* Past Matches (History) */}
              {pastMatches.length > 0 && (
                <div className="space-y-4">
                  <h3 className="text-[10px] font-bold flex items-center gap-2 px-2 text-muted-foreground uppercase tracking-widest">
                    <History className="w-3 h-3" /> Historial
                  </h3>
                  <div className="space-y-3 opacity-60">
                    {pastMatches.slice(0, 3).map((m) => (
                      <div
                        key={m.id}
                        onClick={() => router.push(`/match/${m.id}`)}
                        className="glass-card p-3 rounded-2xl flex items-center justify-between group cursor-pointer hover:bg-white/5 transition-all"
                      >
                        <p className="text-xs font-medium">{m.location}</p>
                        <span className="text-[9px]">{new Date(m.time).toLocaleDateString()}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Create Match Form */}
              <div className="space-y-4 pt-4 border-t border-white/5">
                <h3 className="text-[10px] font-bold flex items-center gap-2 px-2 text-muted-foreground uppercase tracking-widest">
                  <Trophy className="w-3 h-3 text-primary" /> Crear Nuevo Partido
                </h3>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="glass-card p-6 rounded-3xl space-y-5">
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold uppercase tracking-widest flex items-center gap-2 text-muted-foreground">
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
                      <label className="text-[10px] font-bold uppercase tracking-widest flex items-center gap-2 text-muted-foreground">
                        <Clock className="w-4 h-4" /> Cuándo
                      </label>
                      <input
                        required
                        type="datetime-local"
                        step="900"
                        className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all [color-scheme:dark]"
                        value={formData.time}
                        onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-[10px] font-bold uppercase tracking-widest flex items-center gap-2 text-muted-foreground">
                          <Users className="w-4 h-4" /> Tipo
                        </label>
                        <div className="relative">
                          <select
                            className="w-full bg-white/10 border border-white/20 rounded-2xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all appearance-none text-white font-medium"
                            value={formData.players}
                            onChange={(e) => setFormData({ ...formData, players: e.target.value })}
                          >
                            <option value="10" className="bg-neutral-900">5 vs 5</option>
                            <option value="14" className="bg-neutral-900">7 vs 7</option>
                            <option value="18" className="bg-neutral-900">9 vs 9</option>
                            <option value="22" className="bg-neutral-900">11 vs 11</option>
                          </select>
                          <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <label className="text-[10px] font-bold uppercase tracking-widest flex items-center gap-2 text-muted-foreground">
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
              </div>
            </div>
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
        </AnimatePresence>

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

// Re-using icon for styling
function ChevronDown(props: any) {
  return (
    <svg 
      {...props}
      xmlns="http://www.w3.org/2000/svg" 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round"
    >
      <path d="m6 9 6 6 6-6"/>
    </svg>
  );
}
