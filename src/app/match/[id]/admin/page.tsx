"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { 
  ArrowLeft,
  Users, 
  CheckCircle2, 
  XCircle,
  RefreshCcw,
  Trophy,
  Loader2,
  Save,
  ChevronDown,
  ChevronUp,
  Sparkles,
  DollarSign,
  CircleDollarSign
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
  time: string;
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
  const [aiReport, setAiReport] = useState<any[] | null>(null);

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
      setPlayers(prev => prev.map(p => p.id === player.id ? { ...p, paid: !p.paid } : p));
    } catch (error) {
      console.error("Error updating paid status:", error);
    }
  };

  const updatePlayerStats = (id: string, field: 'goals' | 'rating', value: number) => {
    setPlayers(prev => prev.map(p => p.id === id ? { ...p, [field]: value } : p));
  };

  const analyzeWithAI = async () => {
    if (!comments) return;
    
    setSaving(true);
    try {
      const response = await fetch('/api/analyze-stats', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          comments, 
          players: players.map(p => p.name) 
        })
      });

      const aiStats = await response.json();
      if (aiStats.error) throw new Error(aiStats.error);

      setAiReport(aiStats);

      // ACTUALIZACIÓN DE ESTADO INMEDIATA
      setPlayers(prev => prev.map(player => {
        const aiData = aiStats.find((s: any) => s.name.toLowerCase().trim() === player.name.toLowerCase().trim());
        if (aiData) {
          return { ...player, rating: aiData.rating, goals: aiData.goals };
        }
        return player;
      }));

    } catch (error: any) {
      console.error("AI Analysis Error:", error);
      alert("Error: " + error.message);
    } finally {
      setSaving(false);
    }
  };

  const handleSaveResults = async () => {
    setSaving(true);
    try {
      // 1. Guardar datos del partido
      const { error: matchError } = await supabase
        .from('matches')
        .update({
          score_a: scoreA === "" ? null : parseInt(scoreA),
          score_b: scoreB === "" ? null : parseInt(scoreB),
          comments: comments
        })
        .eq('id', params.id);

      if (matchError) throw matchError;

      // 2. Guardar datos de CADA jugador (incluyendo los de la IA)
      // Usamos Promise.all para que sea más rápido y seguro
      const savePromises = players.map(player => 
        supabase
          .from('players')
          .update({ 
            goals: player.goals, 
            rating: player.rating,
            paid: player.paid // Guardamos todo por seguridad
          })
          .eq('id', player.id)
      );

      const results = await Promise.all(savePromises);
      const errors = results.filter(r => r.error);
      
      if (errors.length > 0) throw new Error("Error al guardar algunos jugadores");

      alert("¡Todo guardado correctamente! ⚽✅");
      setAiReport(null);
    } catch (error: any) {
      alert("Error al guardar: " + error.message);
    } finally {
      setSaving(false);
    }
  };

  const generateTeams = () => {
    const goingPlayers = players.filter(p => p.status === 'going');
    const sorted = [...goingPlayers].sort((a, b) => (b.rating || 0) - (a.rating || 0));
    
    const teamA: string[] = [];
    const teamB: string[] = [];

    sorted.forEach((player, index) => {
      const mod = index % 4;
      if (mod === 0 || mod === 3) teamA.push(player.name);
      else teamB.push(player.name);
    });

    setTeams({ teamA, teamB });
  };

  if (loading) return (
    <div className="flex-1 flex items-center justify-center">
      <Loader2 className="w-8 h-8 animate-spin text-primary" />
    </div>
  );

  const paidPlayersCount = players.filter(p => p.paid).length;
  const totalCollected = paidPlayersCount * (match?.price || 0);
  const currentCourtCost = courtCost !== null ? courtCost : (match ? Number(match.price) * Number(match.max_players) : 0);
  const remainingCost = Math.max(0, currentCourtCost - totalCollected);
  const isMatchFinished = match ? new Date(match.time) < new Date() : false;

  return (
    <main className="flex-1 flex flex-col px-4 py-6 max-w-md mx-auto min-h-screen pb-32">
      {/* Mini Header */}
      <div className="flex items-center justify-between mb-6">
        <button onClick={() => router.back()} className="p-3 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all active:scale-90">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="text-center">
          <h1 className="text-lg font-bold font-outfit">Administrar</h1>
          <p className="text-[10px] text-muted-foreground uppercase tracking-widest">{match?.location}</p>
        </div>
        <div className="w-11" />
      </div>

      <div className="space-y-4">
        {/* Quick Stats Summary */}
        <div className="grid grid-cols-2 gap-3">
          <div className="glass-card p-4 rounded-2xl border-l-4 border-l-primary shadow-lg shadow-primary/5">
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1 font-bold">Recaudado</p>
            <p className="text-xl font-bold text-primary">${totalCollected}</p>
          </div>
          <div className="glass-card p-4 rounded-2xl border-l-4 border-l-red-500 shadow-lg shadow-red-500/5">
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1 font-bold">Faltante</p>
            <p className="text-xl font-bold text-red-500">${remainingCost}</p>
          </div>
        </div>

        {/* Post-Match Card */}
        <div className="glass-card rounded-2xl overflow-hidden border border-white/10 shadow-xl">
          <button 
            onClick={() => setShowPostMatch(!showPostMatch)}
            className="w-full p-5 flex items-center justify-between bg-white/5 hover:bg-white/10 transition-all active:bg-white/20"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center">
                <Trophy className="w-4 h-4 text-primary" />
              </div>
              <span className="text-sm font-bold">Post-Partido</span>
            </div>
            {showPostMatch ? <ChevronUp className="w-5 h-5 text-muted-foreground" /> : <ChevronDown className="w-5 h-5 text-muted-foreground" />}
          </button>

          <AnimatePresence>
            {showPostMatch && (
              <motion.div 
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="p-5 border-t border-white/5 space-y-5"
              >
                {!isMatchFinished ? (
                  <div className="py-6 text-center space-y-2">
                    <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Disponible al finalizar</p>
                    <p className="text-[10px] text-muted-foreground/50">El partido aún no ha comenzado</p>
                  </div>
                ) : (
                  <>
                    <div className="space-y-3">
                      <p className="text-[10px] font-bold text-muted-foreground uppercase text-center tracking-widest">Marcador Final</p>
                      <div className="flex items-center justify-center gap-4">
                        <input type="number" placeholder="0" className="w-14 h-14 bg-white/5 border border-white/10 rounded-2xl text-3xl font-bold text-center focus:border-primary outline-none transition-all" value={scoreA} onChange={(e) => setScoreA(e.target.value)} />
                        <span className="text-2xl font-bold text-muted-foreground">:</span>
                        <input type="number" placeholder="0" className="w-14 h-14 bg-white/5 border border-white/10 rounded-2xl text-3xl font-bold text-center focus:border-primary outline-none transition-all" value={scoreB} onChange={(e) => setScoreB(e.target.value)} />
                      </div>
                    </div>

                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <label className="text-[10px] font-bold text-muted-foreground uppercase flex items-center gap-2">
                          <CircleDollarSign className="w-3 h-3" /> Comentarios para IA
                        </label>
                        <button 
                          onClick={analyzeWithAI} 
                          disabled={saving}
                          className="text-[10px] font-bold text-primary flex items-center gap-1.5 px-3 py-1.5 bg-primary/10 rounded-xl hover:bg-primary/20 transition-all active:scale-95 border border-primary/20 disabled:opacity-50"
                        >
                          <Sparkles className="w-3 h-3" /> Analizar con IA
                        </button>
                      </div>
                      <textarea 
                        className="w-full h-24 bg-white/5 border border-white/10 rounded-2xl p-4 text-xs outline-none focus:ring-2 focus:ring-primary/20 transition-all resize-none"
                        placeholder="Ej: Santi fue crack metió 2 goles. Pedro atajó todo..."
                        value={comments}
                        onChange={(e) => setComments(e.target.value)}
                      />
                    </div>

                    {aiReport && (
                      <div className="bg-primary/5 border border-primary/20 rounded-2xl p-4 space-y-3">
                        <div className="flex items-center justify-between">
                          <p className="text-[10px] font-bold text-primary uppercase tracking-widest">Análisis de Gemini ✨</p>
                          <button onClick={() => setAiReport(null)} className="text-[9px] text-muted-foreground uppercase">Cerrar</button>
                        </div>
                        <div className="text-[11px] space-y-2">
                          {aiReport.map((s, i) => (
                            <div key={i} className="flex justify-between border-b border-white/5 pb-1">
                              <span className="font-medium">{s.name}</span>
                              <span className="text-primary font-bold">{s.rating} pts</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Players List */}
        <div className="space-y-4">
          <div className="flex items-center justify-between px-1">
            <h3 className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-2">
              <Users className="w-3 h-3" /> Jugadores Confirmados ({players.filter(p => p.status === 'going').length})
            </h3>
            <button 
              onClick={generateTeams} 
              className="text-[10px] font-bold text-primary flex items-center gap-1.5 px-3 py-1.5 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 transition-all active:scale-95"
            >
              <RefreshCcw className="w-3 h-3" /> Armar Equipos
            </button>
          </div>

          <div className="space-y-3">
            {players.filter(p => p.status === 'going').map((player) => (
              <div key={player.id} className="glass-card p-4 rounded-2xl flex items-center justify-between gap-4 shadow-sm">
                <div className="flex items-center gap-4 flex-1 min-w-0">
                  <button 
                    onClick={() => togglePaid(player)}
                    className={`w-10 h-10 rounded-2xl flex items-center justify-center transition-all active:scale-90 ${player.paid ? 'bg-primary text-black shadow-lg shadow-primary/20' : 'bg-white/5 text-muted-foreground border border-white/10'}`}
                  >
                    <DollarSign className="w-5 h-5" />
                  </button>
                  <div className="min-w-0">
                    <p className="text-sm font-bold truncate">{player.name}</p>
                    <div className="flex items-center gap-2">
                      <p className={`text-[10px] uppercase font-bold tracking-tight ${player.paid ? 'text-primary' : 'text-muted-foreground'}`}>{player.paid ? 'Pagó' : 'Pendiente'}</p>
                    </div>
                  </div>
                </div>

                {isMatchFinished && (
                  <div className="flex items-center gap-3">
                    <div className="text-center">
                      <p className="text-[8px] text-muted-foreground uppercase font-bold mb-1 tracking-tighter">Goles</p>
                      <input type="number" className="w-9 h-8 bg-white/5 border border-white/10 rounded-xl text-center text-xs font-bold focus:border-primary outline-none" value={player.goals} onChange={(e) => updatePlayerStats(player.id, 'goals', parseInt(e.target.value) || 0)} />
                    </div>
                    <div className="text-center">
                      <p className="text-[8px] text-muted-foreground uppercase font-bold mb-1 tracking-tighter">Pts</p>
                      <input type="number" className="w-11 h-8 bg-white/5 border border-white/10 rounded-xl text-center text-xs font-bold text-primary focus:border-primary outline-none" value={player.rating} onChange={(e) => updatePlayerStats(player.id, 'rating', parseInt(e.target.value) || 0)} />
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Teams Result */}
        <AnimatePresence>
          {teams && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="grid grid-cols-2 gap-3 pt-2">
              <div className="bg-primary/5 border border-primary/20 rounded-2xl p-4 shadow-lg shadow-primary/5">
                <p className="text-[10px] font-bold text-primary uppercase mb-3 tracking-widest text-center border-b border-primary/20 pb-2">Equipo A</p>
                {teams.teamA.map(n => <p key={n} className="text-xs py-1.5 border-b border-white/5 last:border-0 font-medium">{n}</p>)}
              </div>
              <div className="bg-white/5 border border-white/10 rounded-2xl p-4 shadow-lg">
                <p className="text-[10px] font-bold text-muted-foreground uppercase mb-3 tracking-widest text-center border-b border-white/10 pb-2">Equipo B</p>
                {teams.teamB.map(n => <p key={n} className="text-xs py-1.5 border-b border-white/5 last:border-0 font-medium">{n}</p>)}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Floating Save Button */}
      <div className="fixed bottom-8 left-1/2 -translate-x-1/2 w-full max-w-xs px-4">
        <button 
          onClick={handleSaveResults}
          disabled={saving}
          className="w-full bg-primary hover:bg-primary/90 text-black font-bold py-4.5 rounded-2xl flex items-center justify-center gap-3 shadow-2xl shadow-primary/30 transition-all active:scale-95 disabled:opacity-50"
        >
          {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
          <span className="tracking-wide">GUARDAR TODO</span>
        </button>
      </div>
    </main>
  );
}
