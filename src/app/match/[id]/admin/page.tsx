"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { 
  ArrowLeft,
  Users, 
  CircleDollarSign, 
  CheckCircle2, 
  RefreshCcw,
  LayoutGrid,
  Trophy,
  Loader2
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/lib/supabase";

interface Player {
  id: string;
  name: string;
  status: string;
  paid: boolean;
}

interface Match {
  id: string;
  location: string;
  price: number;
}

export default function AdminPage() {
  const params = useParams();
  const router = useRouter();
  const [players, setPlayers] = useState<Player[]>([]);
  const [match, setMatch] = useState<Match | null>(null);
  const [loading, setLoading] = useState(true);
  const [courtCost, setCourtCost] = useState<number | null>(null);
  const [teams, setTeams] = useState<{ teamA: string[], teamB: string[] } | null>(null);

  useEffect(() => {
    fetchData();
  }, [params.id]);

  useEffect(() => {
    if (match && courtCost === null) {
      const calculatedCost = Number(match.price) * Number(match.max_players || 0);
      setCourtCost(calculatedCost);
    }
  }, [match, courtCost]);

  const fetchData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/login');
        return;
      }

      const { data: matchData, error: matchError } = await supabase
        .from('matches')
        .select('*')
        .eq('id', params.id)
        .single();

      if (matchError) throw matchError;

      // Protection: Only admin can see this page
      if (matchData.admin_id !== user.id) {
        alert("No tienes permiso para administrar este partido.");
        router.push(`/match/${params.id}`);
        return;
      }

      setMatch(matchData);

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

  const togglePaid = async (player: Player) => {
    try {
      const { error } = await supabase
        .from('players')
        .update({ paid: !player.paid })
        .eq('id', player.id);

      if (error) throw error;
      setPlayers(players.map(p => p.id === player.id ? { ...p, paid: !p.paid } : p));
    } catch (error) {
      console.error("Error updating paid status:", error);
    }
  };

  const generateTeams = () => {
    const goingPlayers = players.filter(p => p.status === 'going');
    const shuffled = [...goingPlayers].sort(() => 0.5 - Math.random());
    const mid = Math.ceil(shuffled.length / 2);
    setTeams({
      teamA: shuffled.slice(0, mid).map(p => p.name),
      teamB: shuffled.slice(mid).map(p => p.name),
    });
  };

  if (loading) return (
    <div className="flex-1 flex items-center justify-center">
      <Loader2 className="w-8 h-8 animate-spin text-primary" />
    </div>
  );

  const paidPlayersCount = players.filter(p => p.paid).length;
  const pricePerPerson = Number(match?.price) || 0;
  const totalCollected = paidPlayersCount * pricePerPerson;
  const currentCourtCost = courtCost !== null ? courtCost : (match ? Number(match.price) * Number(match.max_players) : 0);
  const remainingCost = Math.max(0, currentCourtCost - totalCollected);

  return (
    <main className="flex-1 flex flex-col px-4 py-8 max-w-md mx-auto">
      <div className="flex items-center justify-between mb-8">
        <button 
          onClick={() => router.back()}
          className="p-2 rounded-full bg-white/5 border border-white/10"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="text-center">
          <h1 className="text-xl font-bold font-outfit">Panel de Control</h1>
          <p className="text-[10px] text-muted-foreground uppercase tracking-widest">Match ID: {params.id}</p>
        </div>
        <div className="w-9" />
      </div>

      <div className="space-y-6">
        {/* Expenses Card */}
        <div className="glass-card rounded-3xl p-6 space-y-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold flex items-center gap-2 text-muted-foreground uppercase tracking-wider">
                <CircleDollarSign className="w-4 h-4 text-primary" /> Finanzas del Partido
              </h3>
            </div>
            
            <div className="bg-white/5 border border-white/10 rounded-2xl p-4 flex justify-between items-center">
              <div>
                <p className="text-[10px] text-muted-foreground uppercase mb-1">Costo Total Cancha</p>
                <div className="flex items-center gap-2">
                  <span className="text-xl font-bold text-white">$</span>
                  <input 
                    type="number"
                    value={currentCourtCost}
                    onChange={(e) => setCourtCost(parseInt(e.target.value) || 0)}
                    className="w-28 bg-transparent text-xl font-bold text-white focus:outline-none border-b border-white/20"
                  />
                </div>
              </div>
              <div className="text-right">
                <p className="text-[10px] text-muted-foreground uppercase mb-1">Cobro p/p</p>
                <p className="font-bold text-white">${pricePerPerson}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="bg-primary/5 border border-primary/20 rounded-2xl p-4">
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Recaudado</p>
                <p className="text-xl font-bold text-primary">${totalCollected}</p>
                <p className="text-[9px] text-primary/60 mt-1">{paidPlayersCount} pagos recibidos</p>
              </div>
              <div className="bg-red-500/5 border border-red-500/20 rounded-2xl p-4">
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Faltante</p>
                <p className="text-xl font-bold text-red-500">${remainingCost}</p>
                <p className="text-[9px] text-red-500/60 mt-1">Deuda pendiente</p>
              </div>
            </div>
          </div>
        </div>

        {/* Player Management */}
        <div className="space-y-3">
          <h3 className="font-bold flex items-center gap-2 px-2">
            <Users className="w-4 h-4 text-primary" />
            Gestión de Jugadores ({players.length})
          </h3>
          <div className="space-y-2">
            {players.map((player) => (
              <div 
                key={player.id}
                className="bg-white/5 border border-white/10 rounded-2xl p-4 flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-xs font-bold text-primary uppercase">
                    {player.name[0]}
                  </div>
                  <div className="flex flex-col">
                    <span className="font-medium text-sm">{player.name}</span>
                    <span className={`text-[10px] uppercase font-bold ${player.status === 'going' ? 'text-primary' : 'text-red-500'}`}>
                      {player.status === 'going' ? 'Confirmado' : 'No va'}
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => togglePaid(player)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                    player.paid 
                      ? "bg-primary/20 text-primary border border-primary/30" 
                      : "bg-white/5 text-muted-foreground border border-white/10"
                  }`}
                >
                  {player.paid ? "Pagó" : "Pendiente"}
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Team Generator */}
        <div className="space-y-4 pt-4">
          <button
            onClick={generateTeams}
            className="w-full bg-white text-black font-bold py-4 rounded-3xl flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
          >
            <RefreshCcw className="w-5 h-5" />
            Armar Equipos Aleatorios
          </button>

          <AnimatePresence>
            {teams && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="grid grid-cols-2 gap-4"
              >
                <div className="space-y-3">
                  <div className="flex items-center gap-2 px-2 text-primary">
                    <Trophy className="w-4 h-4" />
                    <span className="text-sm font-bold uppercase tracking-wider">Equipo A</span>
                  </div>
                  <div className="bg-primary/5 border border-primary/20 rounded-2xl p-4 space-y-2">
                    {teams.teamA.map(name => (
                      <p key={name} className="text-sm">{name}</p>
                    ))}
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="flex items-center gap-2 px-2 text-blue-400">
                    <LayoutGrid className="w-4 h-4" />
                    <span className="text-sm font-bold uppercase tracking-wider">Equipo B</span>
                  </div>
                  <div className="bg-blue-400/5 border border-blue-400/20 rounded-2xl p-4 space-y-2">
                    {teams.teamB.map(name => (
                      <p key={name} className="text-sm">{name}</p>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </main>
  );
}
