"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { 
  MapPin, 
  Clock, 
  Users, 
  CircleDollarSign, 
  CheckCircle2, 
  XCircle, 
  Trophy,
  MessageCircle,
  Loader2,
  ArrowLeft,
  RefreshCcw
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";

interface Player {
  name: string;
  status: string;
}

interface Match {
  id: string;
  location: string;
  time: string;
  price: number;
  max_players: number;
}

export default function MatchPage() {
  const params = useParams();
  const router = useRouter();
  const [match, setMatch] = useState<Match | null>(null);
  const [players, setPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(true);
  const [userStatus, setUserStatus] = useState<"none" | "going" | "not-going">("none");

  const [checkingAdmin, setCheckingAdmin] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    fetchMatchData();
    checkAdmin();
    
    // Subscribe to changes
    const channel = supabase
      .channel('schema-db-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'players' }, () => {
        fetchMatchData();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [params.id]);

  const checkAdmin = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data: m } = await supabase.from('matches').select('admin_id').eq('id', params.id).single();
      if (m?.admin_id === user.id) setIsAdmin(true);
    }
    setCheckingAdmin(false);
  };

  const fetchMatchData = async () => {
    try {
      const { data: matchData, error: matchError } = await supabase
        .from('matches')
        .select('*')
        .eq('id', params.id)
        .single();

      if (matchError) throw matchError;
      setMatch(matchData);

      const { data: playersData, error: playersError } = await supabase
        .from('players')
        .select('name, status')
        .eq('match_id', params.id);

      if (playersError) throw playersError;
      setPlayers(playersData || []);
    } catch (error) {
      console.error("Error fetching match:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleStatus = async (status: "going" | "not-going") => {
    const name = prompt("¿Cuál es tu nombre?") || "Anónimo";
    
    try {
      const { error } = await supabase
        .from('players')
        .upsert({ 
          match_id: params.id, 
          name, 
          status,
          updated_at: new Date().toISOString()
        }, { onConflict: 'match_id, name' });

      if (error) throw error;
      setUserStatus(status);
      fetchMatchData();
    } catch (error) {
      console.error("Error updating status:", error);
    }
  };

  if (loading) return (
    <div className="flex-1 flex items-center justify-center">
      <Loader2 className="w-8 h-8 animate-spin text-primary" />
    </div>
  );

  if (!match) return <div className="p-8 text-center">Partido no encontrado</div>;

  const confirmed = players.filter(p => p.status === 'going');

  const shareOnWhatsApp = () => {
    const missing = match.max_players - confirmed.length;
    const date = new Date(match.time).toLocaleString('es-AR', { weekday: 'long', hour: '2-digit', minute: '2-digit' });
    const text = `⚽ *Fútbol ${date}* en ${match.location}\n\n💰 Precio: $${match.price}\n👥 Faltan: *${missing}* jugadores\n\nConfirmá acá:\n${window.location.href}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank");
  };

  return (
    <main className="flex-1 flex flex-col items-center px-4 py-8 bg-[radial-gradient(circle_at_top,_var(--primary)_0%,_transparent_15%)] bg-no-repeat min-h-screen">
      <div className="w-full max-w-md flex justify-start mb-4">
        <button 
          onClick={() => router.push('/')}
          className="p-2 rounded-full bg-white/5 border border-white/10 text-muted-foreground hover:text-white transition-all"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
      </div>

      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-md space-y-6"
      >
        {/* Header Card */}
        <div className="glass-card rounded-3xl p-6 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-10">
            <Trophy className="w-24 h-24 text-primary rotate-12" />
          </div>
          
          <div className="flex justify-end mb-2 relative z-20">
            <button 
              onClick={() => window.location.href = "/ranking"}
              className="text-[10px] font-bold uppercase tracking-wider text-primary bg-primary/10 px-2 py-1 rounded-lg border border-primary/20 flex items-center gap-1 hover:bg-primary/20 transition-all cursor-pointer"
            >
              <Trophy className="w-3 h-3" />
              Ver Ranking
            </button>
          </div>

          <div className="space-y-4 relative z-10">
            <div className="flex items-center gap-3">
              <div className="bg-primary/20 p-2 rounded-xl">
                <Users className="w-5 h-5 text-primary" />
              </div>
              <h2 className="text-xl font-bold font-outfit">Detalles del Partido</h2>
            </div>

            <div className="space-y-3">
              <div className="flex items-center gap-3 text-muted-foreground">
                <MapPin className="w-4 h-4 text-primary" />
                <span>{match.location}</span>
              </div>
              <div className="flex items-center gap-3 text-muted-foreground">
                <Clock className="w-4 h-4 text-primary" />
                <span>{new Date(match.time).toLocaleString('es-AR')}</span>
              </div>
              <div className="flex items-center gap-3 text-muted-foreground">
                <CircleDollarSign className="w-4 h-4 text-primary" />
                <span>${match.price} por persona</span>
              </div>
            </div>
          </div>
        </div>

        {/* Player Count & List */}
        <div className="space-y-4">
          <div className="flex items-center justify-between px-2">
            <h3 className="font-bold flex items-center gap-2">
              Confirmados 
              <span className="text-primary bg-primary/10 px-2 py-0.5 rounded-full text-sm">
                {confirmed.length} / {match.max_players}
              </span>
            </h3>
            <span className="text-xs text-muted-foreground">
              {Math.max(0, match.max_players - confirmed.length)} lugares libres
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <AnimatePresence>
              {confirmed.map((player, idx) => (
                <motion.div
                  key={player.name + idx}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="bg-white/5 border border-white/10 rounded-2xl p-3 flex items-center gap-2"
                >
                  <div className="w-2 h-2 rounded-full bg-primary" />
                  <span className="text-sm font-medium">{player.name}</span>
                </motion.div>
              ))}
              {Array.from({ length: Math.max(0, match.max_players - confirmed.length) }).map((_, idx) => (
                <div key={idx} className="border border-white/5 border-dashed rounded-2xl p-3 flex items-center gap-2 opacity-30">
                  <div className="w-2 h-2 rounded-full bg-muted-foreground" />
                  <span className="text-sm">Lugar libre</span>
                </div>
              ))}
            </AnimatePresence>
          </div>
        </div>

        {/* Actions */}
        <div className="sticky bottom-8 left-0 right-0 space-y-3">
          {/* Admin Actions */}
          {isAdmin && (
            <button
              onClick={() => router.push(`/match/${params.id}/admin`)}
              className="w-full bg-white/5 hover:bg-white/10 text-white text-xs font-bold py-2.5 rounded-xl flex items-center justify-center gap-2 transition-all active:scale-95 border border-white/10 mb-2"
            >
              <RefreshCcw className="w-4 h-4" />
              Gestionar Partido
            </button>
          )}

          {/* Participation Actions */}
          <div className="flex gap-2">
            <button
              onClick={() => handleStatus("going")}
              className={`flex-1 py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all active:scale-95 ${
                userStatus === "going" 
                  ? "bg-primary text-black shadow-lg shadow-primary/20" 
                  : "bg-white/5 text-white border border-white/5 hover:bg-white/10"
              }`}
            >
              <CheckCircle2 className="w-4 h-4" />
              Voy
            </button>
            <button
              onClick={() => handleStatus("not-going")}
              className={`flex-1 py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all active:scale-95 ${
                userStatus === "not-going" 
                  ? "bg-red-500/20 text-red-500 border border-red-500/30" 
                  : "bg-white/5 text-muted-foreground border border-white/5 hover:bg-white/10"
              }`}
            >
              <XCircle className="w-4 h-4" />
              No voy
            </button>
          </div>

          <button
            onClick={shareOnWhatsApp}
            className="w-full bg-[#25D366] hover:bg-[#22c35e] text-black font-bold py-3 rounded-xl flex items-center justify-center gap-2 transition-all active:scale-95 shadow-lg shadow-[#25D366]/10 mt-2"
          >
            <MessageCircle className="w-5 h-5" />
            <span className="text-sm">Compartir en WhatsApp</span>
          </button>
        </div>
      </motion.div>
    </main>
  );
}
