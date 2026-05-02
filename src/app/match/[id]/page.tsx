"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { 
  ArrowLeft, 
  Calendar, 
  MapPin, 
  Users, 
  Share2, 
  CheckCircle2, 
  XCircle,
  RefreshCcw,
  MessageCircle,
  Trophy,
  Star,
  Zap,
  ChevronRight
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/lib/supabase";

interface Player {
  id: string;
  name: string;
  status: string;
  goals: number;
  rating: number;
}

interface Match {
  id: string;
  location: string;
  time: string;
  max_players: number;
  price: number;
  admin_id: string;
  score_a: number | null;
  score_b: number | null;
  comments: string | null;
}

export default function MatchPage() {
  const params = useParams();
  const router = useRouter();
  const [match, setMatch] = useState<Match | null>(null);
  const [players, setPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(true);
  const [userStatus, setUserStatus] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    fetchData();
  }, [params.id]);

  const fetchData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      const { data: matchData, error: matchError } = await supabase
        .from('matches')
        .select('*')
        .eq('id', params.id)
        .single();

      if (matchError) throw matchError;
      setMatch(matchData);
      
      if (user && matchData.admin_id === user.id) {
        setIsAdmin(true);
      }

      const { data: playersData, error: playersError } = await supabase
        .from('players')
        .select('*')
        .eq('match_id', params.id);

      if (playersError) throw playersError;
      setPlayers(playersData || []);

    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleStatus = async (status: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    
    // Si está logueado, usamos su nombre de perfil o pedimos uno
    const defaultName = user?.email?.split('@')[0] || "";
    const name = prompt("Confirmar nombre para la lista:", defaultName);
    if (!name) return;

    try {
      const { error } = await supabase
        .from('players')
        .insert([{ 
          name, 
          status, 
          match_id: params.id,
          user_id: user?.id || null, // Guardamos el ID del usuario logueado
          goals: 0,
          rating: 50
        }]);

      if (error) throw error;
      fetchData();
    } catch (error) {
      console.error("Error updating status:", error);
      alert("Error al unirse: Asegúrate de que la tabla 'players' tenga la columna 'user_id'");
    }
  };

  const shareOnWhatsApp = () => {
    const text = `¡Me sumo al partido en ${match?.location}! ⚽\nMirá quiénes van acá: ${window.location.href}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`);
  };

  if (loading) return (
    <div className="flex-1 flex items-center justify-center">
      <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
    </div>
  );

  const isFinished = match ? new Date(match.time) < new Date() : false;
  const goingPlayers = players.filter(p => p.status === 'going');

  return (
    <main className="flex-1 flex flex-col px-4 py-6 max-w-md mx-auto min-h-screen pb-32">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <button onClick={() => router.push('/')} className="p-2.5 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-xl font-bold font-outfit">Detalles del Partido</h1>
        <button onClick={shareOnWhatsApp} className="p-2.5 rounded-2xl bg-primary/10 border border-primary/20 text-primary hover:bg-primary/20 transition-all">
          <Share2 className="w-5 h-5" />
        </button>
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-6"
      >
        {/* Post-Match Results Summary (Only if finished) */}
        {isFinished && match?.score_a !== null && (
          <div className="glass-card rounded-3xl p-6 border-2 border-primary/20 shadow-xl shadow-primary/5 space-y-4">
            <div className="text-center space-y-1">
              <p className="text-[10px] font-bold text-primary uppercase tracking-[0.3em]">Resultado Final</p>
              <div className="flex items-center justify-center gap-6 py-2">
                <div className="text-center">
                  <p className="text-[9px] text-muted-foreground uppercase mb-1">Equipo A</p>
                  <span className="text-4xl font-black">{match?.score_a}</span>
                </div>
                <span className="text-2xl font-bold text-muted-foreground self-end mb-1">:</span>
                <div className="text-center">
                  <p className="text-[9px] text-muted-foreground uppercase mb-1">Equipo B</p>
                  <span className="text-4xl font-black">{match?.score_b}</span>
                </div>
              </div>
            </div>

            {match?.comments && (
              <div className="bg-white/5 rounded-2xl p-4 border border-white/5">
                <p className="text-[10px] font-bold text-muted-foreground uppercase mb-2 flex items-center gap-2">
                  <Trophy className="w-3 h-3 text-primary" /> Crónica del Capitán
                </p>
                <p className="text-xs text-muted-foreground italic leading-relaxed">
                  "{match?.comments}"
                </p>
              </div>
            )}
          </div>
        )}

        {/* Info Card */}
        <div className="glass-card rounded-3xl p-6 space-y-4 shadow-lg border border-white/5">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center border border-primary/20">
              <Calendar className="w-6 h-6 text-primary" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground font-medium">
                {new Date(match?.time || '').toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long' })}
              </p>
              <p className="text-xl font-bold">
                {new Date(match?.time || '').toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })} hs
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center border border-white/10">
              <MapPin className="w-6 h-6 text-muted-foreground" />
            </div>
            <div className="min-w-0">
              <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Complejo</p>
              <p className="text-lg font-bold truncate">{match?.location}</p>
            </div>
          </div>
        </div>

        {/* Players List */}
        <div className="space-y-4">
          <div className="flex items-center justify-between px-2">
            <h3 className="text-sm font-bold flex items-center gap-2">
              <Users className="w-4 h-4 text-primary" /> 
              Confirmados ({goingPlayers.length}/{match?.max_players})
            </h3>
            {isFinished && <span className="text-[10px] font-bold text-primary uppercase border border-primary/30 px-2 py-1 rounded-lg">Stats Disponibles</span>}
          </div>

          <div className="grid gap-3">
            {goingPlayers.map((player, idx) => (
              <motion.div 
                key={player.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.05 }}
                className="glass-card p-4 rounded-2xl flex items-center justify-between border border-white/5 hover:bg-white/10 transition-all"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-[10px] font-bold text-muted-foreground">
                    {idx + 1}
                  </div>
                  <span className="font-bold text-sm">{player.name}</span>
                </div>

                {/* Stats in player list (Only if finished) */}
                {isFinished && (
                  <div className="flex items-center gap-3">
                    {player.goals > 0 && (
                      <div className="flex items-center gap-1 bg-white/5 px-2 py-1 rounded-lg border border-white/10">
                        <Zap className="w-3 h-3 text-yellow-500 fill-yellow-500" />
                        <span className="text-xs font-bold">{player.goals}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-1 bg-primary/10 px-2 py-1 rounded-lg border border-primary/20">
                      <Star className="w-3 h-3 text-primary fill-primary" />
                      <span className="text-xs font-bold text-primary">{player.rating || 50}</span>
                    </div>
                  </div>
                )}
              </motion.div>
            ))}

            {/* Empty slots */}
            {!isFinished && Array.from({ length: Math.max(0, (match?.max_players || 0) - goingPlayers.length) }).map((_, i) => (
              <div key={`empty-${i}`} className="p-4 rounded-2xl border border-dashed border-white/10 flex items-center gap-3 opacity-40">
                <div className="w-8 h-8 rounded-xl bg-transparent border border-dashed border-white/20" />
                <span className="text-xs font-medium italic">Lugar libre...</span>
              </div>
            ))}
          </div>
        </div>

        {/* Bajas Section (Subtle) */}
        {players.filter(p => p.status === 'not-going').length > 0 && (
          <div className="opacity-40 grayscale pt-4">
            <h3 className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest px-2 mb-2">Bajas del partido</h3>
            <div className="flex flex-wrap gap-2">
              {players.filter(p => p.status === 'not-going').map(p => (
                <span key={p.id} className="text-[10px] bg-white/5 px-2 py-1 rounded-lg border border-white/5">{p.name}</span>
              ))}
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="sticky bottom-8 left-0 right-0 space-y-3 pt-4">
          {isAdmin && (
            <button
              onClick={() => router.push(`/match/${params.id}/admin`)}
              className="w-full bg-white/5 hover:bg-white/10 text-white text-xs font-bold py-3 rounded-2xl flex items-center justify-center gap-2 transition-all active:scale-95 border border-white/10"
            >
              <RefreshCcw className="w-4 h-4" />
              Panel de Administración
            </button>
          )}

          {!isFinished ? (
            <div className="flex gap-2">
              <button
                onClick={() => handleStatus("going")}
                className="flex-1 py-4 rounded-2xl bg-primary text-black font-bold flex items-center justify-center gap-2 transition-all active:scale-95 shadow-lg shadow-primary/20"
              >
                <CheckCircle2 className="w-5 h-5" />
                ¡Voy!
              </button>
              <button
                onClick={() => handleStatus("not-going")}
                className="flex-1 py-4 rounded-2xl bg-white/5 text-muted-foreground border border-white/5 font-bold flex items-center justify-center gap-2 transition-all active:scale-95"
              >
                <XCircle className="w-5 h-5" />
                Baja
              </button>
            </div>
          ) : (
            <div className="bg-primary/5 border border-primary/20 p-4 rounded-3xl text-center">
              <p className="text-xs font-bold text-primary uppercase tracking-[0.2em]">Partido Finalizado</p>
              <p className="text-[10px] text-muted-foreground mt-1">¡Gracias por participar!</p>
            </div>
          )}
        </div>
      </motion.div>
    </main>
  );
}
