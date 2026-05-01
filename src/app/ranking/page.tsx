"use client";

import { useState, useEffect } from "react";
import { 
  Trophy, 
  Frown, 
  Medal, 
  ArrowLeft, 
  Zap,
  Loader2
} from "lucide-react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { supabase } from "@/lib/supabase";

interface RankingPlayer {
  name: string;
  matches: number;
  rate: string;
  status: 'crack' | 'regular' | 'colgado';
}

export default function RankingPage() {
  const router = useRouter();
  const [ranking, setRanking] = useState<RankingPlayer[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRanking();
  }, []);

  const fetchRanking = async () => {
    try {
      // Get all players and count their attendances
      const { data, error } = await supabase
        .from('players')
        .select('name, status');

      if (error) throw error;

      // Group by name
      const stats: Record<string, { matches: number, going: number }> = {};
      data.forEach(p => {
        if (!stats[p.name]) stats[p.name] = { matches: 0, going: 0 };
        stats[p.name].matches += 1;
        if (p.status === 'going') stats[p.name].going += 1;
      });

      const formatted = Object.entries(stats).map(([name, s]) => {
        const rateNum = (s.going / s.matches) * 100;
        let status: 'crack' | 'regular' | 'colgado' = 'regular';
        if (rateNum > 80) status = 'crack';
        if (rateNum < 30) status = 'colgado';

        return {
          name,
          matches: s.going,
          rate: Math.round(rateNum) + "%",
          status
        };
      }).sort((a, b) => b.matches - a.matches);

      setRanking(formatted);
    } catch (error) {
      console.error("Error fetching ranking:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return (
    <div className="flex-1 flex items-center justify-center">
      <Loader2 className="w-8 h-8 animate-spin text-primary" />
    </div>
  );

  const topThree = ranking.slice(0, 3);
  const theColgado = [...ranking].sort((a, b) => parseInt(a.rate) - parseInt(b.rate))[0];

  return (
    <main className="flex-1 flex flex-col px-4 py-8 max-w-md mx-auto">
      <div className="flex items-center justify-between mb-8">
        <button 
          onClick={() => router.back()}
          className="p-2 rounded-full bg-white/5 border border-white/10"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-xl font-bold font-outfit">Ranking de Cracks</h1>
        <div className="w-9" />
      </div>

      <div className="space-y-8">
        {ranking.length >= 3 ? (
          <div className="flex items-end justify-center gap-4 pt-12 pb-4">
            {/* 2nd Place */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="flex flex-col items-center">
              <div className="w-16 h-16 rounded-full bg-white/5 border-2 border-slate-400 flex items-center justify-center mb-2 relative">
                <span className="font-bold text-lg">{topThree[1].name[0]}</span>
                <div className="absolute -top-2 -right-2 bg-slate-400 p-1 rounded-full"><Medal className="w-3 h-3 text-black" /></div>
              </div>
              <span className="text-xs font-bold text-slate-400">#2</span>
              <span className="text-sm font-medium">{topThree[1].name}</span>
            </motion.div>

            {/* 1st Place */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col items-center">
              <div className="w-20 h-20 rounded-full bg-primary/10 border-2 border-primary flex items-center justify-center mb-2 relative shadow-[0_0_20px_rgba(16,185,129,0.3)]">
                <span className="font-bold text-2xl text-primary">{topThree[0].name[0]}</span>
                <div className="absolute -top-3 -right-1 bg-primary p-1.5 rounded-full"><Trophy className="w-4 h-4 text-black" /></div>
              </div>
              <span className="text-xs font-bold text-primary">#1</span>
              <span className="text-base font-bold">{topThree[0].name}</span>
            </motion.div>

            {/* 3rd Place */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="flex flex-col items-center">
              <div className="w-16 h-16 rounded-full bg-white/5 border-2 border-orange-700 flex items-center justify-center mb-2 relative">
                <span className="font-bold text-lg">{topThree[2].name[0]}</span>
                <div className="absolute -top-2 -right-2 bg-orange-700 p-1 rounded-full"><Medal className="w-3 h-3 text-black" /></div>
              </div>
              <span className="text-xs font-bold text-orange-700">#3</span>
              <span className="text-sm font-medium">{topThree[2].name}</span>
            </motion.div>
          </div>
        ) : (
          <div className="text-center py-12 text-muted-foreground">Necesitamos al menos 3 jugadores confirmados para armar el podio.</div>
        )}

        {theColgado && parseInt(theColgado.rate) < 50 && (
          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="bg-red-500/10 border border-red-500/20 rounded-3xl p-6 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-10"><Frown className="w-20 h-20 text-red-500" /></div>
            <div className="relative z-10 space-y-2">
              <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-red-500">El colgado de la semana</span>
              <h3 className="text-2xl font-bold flex items-center gap-2">{theColgado.name} 💤</h3>
              <p className="text-sm text-muted-foreground">Tasa de asistencia: <span className="text-red-500 font-bold">{theColgado.rate}</span></p>
            </div>
          </motion.div>
        )}

        <div className="space-y-4">
          <h3 className="font-bold flex items-center gap-2 px-2 text-muted-foreground"><Zap className="w-4 h-4" />Estadísticas Completas</h3>
          <div className="space-y-2">
            {ranking.map((player, idx) => (
              <div key={idx} className="bg-white/5 border border-white/10 rounded-2xl p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="text-xs font-bold text-muted-foreground w-4">{idx + 1}</div>
                  <span className="font-medium">{player.name}</span>
                </div>
                <div className="flex items-center gap-6">
                  <div className="text-right">
                    <p className="text-[10px] text-muted-foreground uppercase">Partidos</p>
                    <p className="font-bold">{player.matches}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] text-muted-foreground uppercase">Efectividad</p>
                    <p className={`font-bold ${player.status === 'colgado' ? 'text-red-500' : 'text-primary'}`}>{player.rate}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}
