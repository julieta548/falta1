"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { 
  Plus, 
  Search, 
  Calendar, 
  MapPin, 
  Users, 
  ChevronRight, 
  Trophy,
  Activity,
  LogOut,
  Settings,
  LayoutGrid
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/lib/supabase";

interface Match {
  id: string;
  location: string;
  time: string;
  max_players: number;
  admin_id: string;
}

export default function HomePage() {
  const router = useRouter();
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [showCreate, setShowCreate] = useState(false);

  const [location, setLocation] = useState("");
  const [time, setTime] = useState("");
  const [maxPlayers, setMaxPlayers] = useState("10");
  const [price, setPrice] = useState("");

  useEffect(() => {
    checkUser();
    fetchMatches();
  }, []);

  const checkUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    setUser(user);
    if (!user) {
      router.push("/login");
    } else {
      fetchMatches(user.id);
    }
  };

  const fetchMatches = async (userId: string) => {
    const { data, error } = await supabase
      .from("matches")
      .select("*")
      .eq('admin_id', userId)
      .order("time", { ascending: true });

    if (!error) setMatches(data || []);
    setLoading(false);
  };

  const createMatch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    const { data, error } = await supabase
      .from("matches")
      .insert([
        { 
          location, 
          time, 
          max_players: parseInt(maxPlayers), 
          price: parseFloat(price),
          admin_id: user.id 
        }
      ])
      .select();

    if (!error && data) {
      router.push(`/match/${data[0].id}`);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/login");
  };

  const now = new Date();
  const upcomingMatches = matches.filter(m => new Date(m.time) >= now);
  const pastMatches = matches.filter(m => new Date(m.time) < now);

  return (
    <main className="flex-1 flex flex-col px-4 py-8 max-w-md mx-auto min-h-screen">
      {/* User Profile Bar */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-primary/20 flex items-center justify-center border border-primary/30">
            <Activity className="w-6 h-6 text-primary" />
          </div>
          <div>
            <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest">Bienvenido</p>
            <h2 className="text-lg font-bold font-outfit truncate max-w-[150px]">{user?.email?.split('@')[0]}</h2>
          </div>
        </div>
        <button 
          onClick={handleLogout}
          className="p-3 rounded-2xl bg-white/5 border border-white/10 text-muted-foreground hover:text-white transition-all active:scale-90"
        >
          <LogOut className="w-5 h-5" />
        </button>
      </div>

      <div className="space-y-8 pb-24">
        {/* Actions */}
        <button 
          onClick={() => setShowCreate(!showCreate)}
          className="w-full bg-primary hover:bg-primary/90 text-black font-bold py-4.5 rounded-2xl flex items-center justify-center gap-3 shadow-xl shadow-primary/20 transition-all active:scale-[0.98]"
        >
          <Plus className="w-6 h-6" />
          <span className="tracking-wide">CREAR NUEVO PARTIDO</span>
        </button>

        <AnimatePresence>
          {showCreate && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="glass-card rounded-3xl p-6 border border-primary/20 shadow-2xl shadow-primary/5"
            >
              <form onSubmit={createMatch} className="space-y-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest px-1">Lugar</label>
                  <div className="relative">
                    <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <input 
                      required 
                      className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-4 outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                      placeholder="Nombre del complejo..."
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest px-1">Fecha y Hora</label>
                    <input 
                      type="datetime-local" 
                      required 
                      className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-4 outline-none focus:ring-2 focus:ring-primary/20 transition-all text-xs"
                      value={time}
                      onChange={(e) => setTime(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest px-1">Jugadores</label>
                    <select 
                      className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-4 outline-none focus:ring-2 focus:ring-primary/20 transition-all text-xs appearance-none"
                      value={maxPlayers}
                      onChange={(e) => setMaxPlayers(e.target.value)}
                    >
                      <option value="10">Fútbol 5 (10)</option>
                      <option value="12">Fútbol 6 (12)</option>
                      <option value="14">Fútbol 7 (14)</option>
                      <option value="16">Fútbol 8 (16)</option>
                      <option value="22">Fútbol 11 (22)</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest px-1">Precio por Jugador</label>
                  <input 
                    type="number" 
                    required 
                    className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-4 outline-none focus:ring-2 focus:ring-primary/20 transition-all text-xs"
                    placeholder="Ej: 5000"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                  />
                </div>

                <button type="submit" className="w-full bg-white text-black font-bold py-4 rounded-2xl transition-all active:scale-[0.98] mt-2">
                  Confirmar Partido
                </button>
              </form>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Sections */}
        <div className="space-y-6">
          <div className="space-y-4">
            <h3 className="text-[11px] font-bold text-muted-foreground uppercase tracking-[0.2em] px-1 flex items-center gap-2">
              <Calendar className="w-3.5 h-3.5 text-primary" /> Próximos Partidos
            </h3>
            <div className="space-y-3">
              {upcomingMatches.length === 0 ? (
                <div className="glass-card p-8 rounded-3xl text-center border border-dashed border-white/10">
                  <p className="text-xs text-muted-foreground">No tienes partidos programados</p>
                </div>
              ) : (
                upcomingMatches.map(match => (
                  <button 
                    key={match.id}
                    onClick={() => router.push(`/match/${match.id}`)}
                    className="w-full glass-card p-5 rounded-3xl flex items-center justify-between group hover:bg-white/10 transition-all active:scale-[0.99] border border-white/5 shadow-lg"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-2xl bg-white/5 flex flex-col items-center justify-center border border-white/10">
                        <span className="text-[10px] font-bold text-primary leading-none mb-1">
                          {new Date(match.time).toLocaleDateString('es-AR', { month: 'short' }).toUpperCase()}
                        </span>
                        <span className="text-lg font-bold leading-none">
                          {new Date(match.time).getDate()}
                        </span>
                      </div>
                      <div className="text-left">
                        <h4 className="font-bold text-sm mb-1">{match.location}</h4>
                        <div className="flex items-center gap-3">
                          <span className="text-[10px] text-muted-foreground flex items-center gap-1 font-medium">
                            <Users className="w-3 h-3" /> {match.max_players} Jgs
                          </span>
                          <span className="text-[10px] text-muted-foreground flex items-center gap-1 font-medium">
                            <MapPin className="w-3 h-3" /> {new Date(match.time).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })} hs
                          </span>
                        </div>
                      </div>
                    </div>
                    <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:translate-x-1 transition-transform" />
                  </button>
                ))
              )}
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-[11px] font-bold text-muted-foreground uppercase tracking-[0.2em] px-1 flex items-center gap-2">
              <Trophy className="w-3.5 h-3.5 text-muted-foreground" /> Historial
            </h3>
            <div className="space-y-3 opacity-60 grayscale-[0.5]">
              {pastMatches.map(match => (
                <button 
                  key={match.id}
                  onClick={() => router.push(`/match/${match.id}`)}
                  className="w-full glass-card p-5 rounded-3xl flex items-center justify-between group hover:bg-white/10 transition-all border border-white/5"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-white/5 flex flex-col items-center justify-center border border-white/5">
                      <span className="text-lg font-bold leading-none text-muted-foreground">
                        {new Date(match.time).getDate()}
                      </span>
                    </div>
                    <div className="text-left">
                      <h4 className="font-bold text-sm mb-1 text-muted-foreground">{match.location}</h4>
                      <p className="text-[10px] text-muted-foreground/60 uppercase font-bold tracking-widest">Partido Finalizado</p>
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-muted-foreground/40" />
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
