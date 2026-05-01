"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { 
  MapPin, 
  Clock, 
  Users, 
  CircleDollarSign, 
  ChevronRight, 
  Trophy 
} from "lucide-react";
import { motion } from "framer-motion";

import { supabase } from "@/lib/supabase";

export default function Home() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    location: "",
    time: "",
    players: "10",
    price: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
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
          },
        ])
        .select()
        .single();

      if (error) throw error;
      if (data) {
        router.push(`/match/${data.id}`);
      }
    } catch (error) {
      console.error("Error creating match:", error);
      alert("Error al crear el partido. ¿Creaste las tablas en Supabase?");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="flex-1 flex flex-col items-center justify-center px-4 py-12 bg-[radial-gradient(circle_at_top,_var(--primary)_0%,_transparent_25%)] bg-no-repeat">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
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
            Armá tu partido en menos de un minuto.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="glass-card p-6 rounded-3xl space-y-5">
            {/* Lugar */}
            <div className="space-y-2">
              <label className="text-sm font-medium flex items-center gap-2 text-muted-foreground">
                <MapPin className="w-4 h-4" /> Lugar
              </label>
              <input
                required
                type="text"
                placeholder="Ej: Cancha El Predio"
                className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all placeholder:text-muted-foreground/50"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
              />
            </div>

            {/* Hora */}
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
              {/* Jugadores */}
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

              {/* Precio */}
              <div className="space-y-2">
                <label className="text-sm font-medium flex items-center gap-2 text-muted-foreground">
                  <CircleDollarSign className="w-4 h-4" /> Precio ($)
                </label>
                <input
                  required
                  type="number"
                  placeholder="Total p/p"
                  className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all placeholder:text-muted-foreground/50"
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
              <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                Crear partido
                <ChevronRight className="w-5 h-5" />
              </>
            )}
          </button>
        </form>

        <div className="flex justify-center mt-6">
          <button
            onClick={() => router.push("/ranking")}
            className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-primary transition-colors"
          >
            <Trophy className="w-4 h-4" />
            Ver Ranking de Cracks
          </button>
        </div>

        <p className="text-center text-xs text-muted-foreground/50 pt-4">
          Al crear un partido aceptás que sos un crack organizando.
        </p>
      </motion.div>
    </main>
  );
}
