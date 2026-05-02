"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { 
  ArrowLeft,
  Users, 
  CircleDollarSign, 
  CheckCircle2, 
  XCircle,
  RefreshCcw,
  LayoutGrid,
  Trophy,
  Loader2,
  Save,
  Star,
  MessageSquare,
  ChevronDown,
  ChevronUp
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/lib/supabase";

interface Player {
  id: string;
  name: string;
  status: string;
  paid: boolean;
  goals: number;
  rating: number;
}

interface Match {
  id: string;
  location: string;
  price: number;
  max_players: number;
  admin_id: string;
  score_a: number | null;
  score_b: number | null;
  comments: string | null;
}

export default function AdminPage() {
  const params = useParams();
  const router = useRouter();
  const [players, setPlayers] = useState<Player[]>([]);
  const [match, setMatch] = useState<Match | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [courtCost, setCourtCost] = useState<number | null>(null);
  const [teams, setTeams] = useState<{ teamA: string[], teamB: string[] } | null>(null);
  const [showPostMatch, setShowPostMatch] = useState(false);

  // Form states for match
  const [scoreA, setScoreA] = useState<string>("");
  const [scoreB, setScoreB] = useState<string>("");
  const [comments, setComments] = useState<string>("");

  useEffect(() => {
    fetchData();
  }, [params.id]);

  useEffect(() => {
    if (match && courtCost === null) {
      const calculatedCost = Number(match.price) * Number(match.max_players || 0);
      setCourtCost(calculatedCost);
    }
    if (match) {
      setScoreA(match.score_a?.toString() || "");
      setScoreB(match.score_b?.toString() || "");
      setComments(match.comments || "");
    }
  }, [match]);

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

  const updatePlayerStats = (id: string, field: 'goals' | 'rating', value: number) => {
    setPlayers(players.map(p => p.id === id ? { ...p, [field]: value } : p));
  };

  const handleSaveResults = async () => {
    setSaving(true);
    try {
      // Update match scores and comments
      const { error: matchError } = await supabase
        .from('matches')
        .update({
          score_a: scoreA === "" ? null : parseInt(scoreA),
          score_b: scoreB === "" ? null : parseInt(scoreB),
          comments: comments
        })
        .eq('id', params.id);

      if (matchError) throw matchError;

      // Update all players stats (using upsert or multiple updates)
      for (const player of players) {
        const { error: playerError } = await supabase
          .from('players')
          .update({
            goals: player.goals,
            rating: player.rating
          })
          .eq('id', player.id);
        if (playerError) throw playerError;
      }

      alert("¡Resultados guardados correctamente!");
      setShowPostMatch(false);
    } catch (error: any) {
      alert("Error al guardar: " + error.message);
    } finally {
      setSaving(false);
    }
  };

  const generateTeams = () => {
    const goingPlayers = players.filter(p => p.status === 'going');
    
    // Sort players by rating descending. If rating is null/0, treat as average (e.g. 50)
    const sorted = [...goingPlayers].sort((a, b) => (b.rating || 0) - (a.rating || 0));
    
    const teamA: string[] = [];
    const teamB: string[] = [];

    // Snake distribution: A, B, B, A, A, B, B, A...
    sorted.forEach((player, index) => {
      const mod = index % 4;
      if (mod === 0 || mod === 3) {
        teamA.push(player.name);
      } else {
        teamB.push(player.name);
      }
    });

    setTeams({ teamA, teamB });
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
    <main className="flex-1 flex flex-col px-4 py-8 max-w-md mx-auto min-h-screen pb-24">
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
        {/* Post-Match Summary / Results */}
        <div className="glass-card rounded-3xl overflow-hidden">
          <button 
            onClick={() => setShowPostMatch(!showPostMatch)}
            className="w-full p-6 flex items-center justify-between bg-primary/5 hover:bg-primary/10 transition-all"
          >
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/20 rounded-xl">
                <Trophy className="w-5 h-5 text-primary" />
              </div>
              <div className="text-left">
                <h3 className="font-bold text-sm">Post-Partido</h3>
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Marcador y estadísticas</p>
              </div>
            </div>
            {showPostMatch ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
          </button>

          <AnimatePresence>
            {showPostMatch && (
              <motion.div 
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="p-6 pt-0 space-y-6 border-t border-white/5"
              >
                {/* Score Inputs */}
                <div className="space-y-3 pt-4">
                  <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Marcador Final</p>
                  <div className="flex items-center justify-center gap-6">
                    <div className="text-center space-y-2">
                      <p className="text-[10px] font-medium text-muted-foreground">Equipo A</p>
                      <input 
                        type="number"
                        placeholder="0"
                        className="w-16 h-16 bg-white/5 border border-white/10 rounded-2xl text-3xl font-bold text-center focus:ring-2 focus:ring-primary/50 outline-none"
                        value={scoreA}
                        onChange={(e) => setScoreA(e.target.value)}
                      />
                    </div>
                    <div className="text-2xl font-bold text-muted-foreground mt-6">:</div>
                    <div className="text-center space-y-2">
                      <p className="text-[10px] font-medium text-muted-foreground">Equipo B</p>
                      <input 
                        type="number"
                        placeholder="0"
                        className="w-16 h-16 bg-white/5 border border-white/10 rounded-2xl text-3xl font-bold text-center focus:ring-2 focus:ring-primary/50 outline-none"
                        value={scoreB}
                        onChange={(e) => setScoreB(e.target.value)}
                      />
                    </div>
                  </div>
                </div>

                {/* General Comments */}
                <div className="space-y-2">
                  <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-2">
                    <MessageSquare className="w-3 h-3" /> Comentarios para la IA
                  </p>
                  <textarea 
                    placeholder="Ej: Partido muy parejo, Lucas fue el mejor arquero, Santi corrió todo..."
                    className="w-full h-24 bg-white/5 border border-white/10 rounded-2xl p-4 text-sm focus:ring-2 focus:ring-primary/50 outline-none resize-none"
                    value={comments}
                    onChange={(e) => setComments(e.target.value)}
                  />
                </div>

                <button
                  disabled={saving}
                  onClick={handleSaveResults}
                  className="w-full bg-primary text-black font-bold py-4 rounded-3xl flex items-center justify-center gap-2 hover:bg-primary/90 transition-all disabled:opacity-50"
                >
                  {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                  Guardar Resultados
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

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
              </div>
              <div className="bg-red-500/5 border border-red-500/20 rounded-2xl p-4">
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Faltante</p>
                <p className="text-xl font-bold text-red-500">${remainingCost}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Player List with Stats */}
        <div className="space-y-6">
          <div className="space-y-3">
            <h3 className="font-bold flex items-center gap-2 px-2 text-primary uppercase tracking-widest text-[10px]">
              <Users className="w-4 h-4" />
              Jugadores Confirmados ({players.filter(p => p.status === 'going').length})
            </h3>
            <div className="space-y-3">
              {players.filter(p => p.status === 'going').map((player) => (
                <div 
                  key={player.id}
                  className="bg-white/5 border border-white/10 rounded-3xl p-4 space-y-4"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-2xl bg-primary/20 flex items-center justify-center text-sm font-bold text-primary uppercase">
                        {player.name[0]}
                      </div>
                      <div>
                        <span className="font-bold text-sm block">{player.name}</span>
                        <button
                          onClick={() => togglePaid(player)}
                          className={`text-[10px] font-bold uppercase ${player.paid ? 'text-primary' : 'text-muted-foreground'}`}
                        >
                          {player.paid ? "Pagó ✓" : "Pendiente"}
                        </button>
                      </div>
                    </div>
                    
                    {/* Stats Inputs */}
                    <div className="flex items-center gap-4">
                      <div className="text-center">
                        <p className="text-[8px] text-muted-foreground uppercase mb-1">Goles</p>
                        <input 
                          type="number"
                          className="w-10 h-8 bg-white/5 border border-white/10 rounded-lg text-center text-sm font-bold focus:ring-1 focus:ring-primary outline-none"
                          value={player.goals}
                          onChange={(e) => updatePlayerStats(player.id, 'goals', parseInt(e.target.value) || 0)}
                        />
                      </div>
                      <div className="text-center">
                        <p className="text-[8px] text-muted-foreground uppercase mb-1">Puntos (0-100)</p>
                        <input 
                          type="number"
                          max="100"
                          min="0"
                          className="w-14 h-8 bg-white/5 border border-white/10 rounded-lg text-center text-sm font-bold text-primary focus:ring-1 focus:ring-primary outline-none"
                          value={player.rating}
                          onChange={(e) => updatePlayerStats(player.id, 'rating', parseInt(e.target.value) || 0)}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Bajas Section */}
          {players.filter(p => p.status === 'not-going').length > 0 && (
            <div className="space-y-3">
              <h3 className="font-bold flex items-center gap-2 px-2 text-red-500 uppercase tracking-widest text-[10px]">
                <XCircle className="w-4 h-4" />
                Bajas ({players.filter(p => p.status === 'not-going').length})
              </h3>
              <div className="space-y-2 opacity-50">
                {players.filter(p => p.status === 'not-going').map((player) => (
                  <div key={player.id} className="bg-white/5 border border-white/10 rounded-2xl p-3 flex justify-between items-center">
                    <span className="text-sm font-medium">{player.name}</span>
                    <span className="text-[10px] uppercase font-bold text-red-500">No va</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Team Generator */}
        <div className="space-y-4 pt-4 pb-12">
          <button
            onClick={generateTeams}
            className="w-full border border-primary/20 bg-primary/5 text-primary font-bold py-4 rounded-3xl flex items-center justify-center gap-2 hover:bg-primary/10 transition-all active:scale-[0.98]"
          >
            <RefreshCcw className="w-5 h-5" />
            Armar Equipos Equilibrados
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
                    <span className="text-sm font-bold uppercase tracking-wider text-[10px]">Equipo A</span>
                  </div>
                  <div className="bg-primary/5 border border-primary/20 rounded-2xl p-4 space-y-2">
                    {teams.teamA.map(name => (
                      <p key={name} className="text-sm font-medium">{name}</p>
                    ))}
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="flex items-center gap-2 px-2 text-blue-400">
                    <LayoutGrid className="w-4 h-4" />
                    <span className="text-sm font-bold uppercase tracking-wider text-[10px]">Equipo B</span>
                  </div>
                  <div className="bg-blue-400/5 border border-blue-400/20 rounded-2xl p-4 space-y-2">
                    {teams.teamB.map(name => (
                      <p key={name} className="text-sm font-medium">{name}</p>
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
