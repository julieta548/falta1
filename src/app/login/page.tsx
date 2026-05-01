"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import { Trophy, LogIn, UserPlus, Loader2 } from "lucide-react";
import { motion } from "framer-motion";

export default function LoginPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isRegister, setIsRegister] = useState(false);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isRegister) {
        const { error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        alert("¡Cuenta creada! Revisa tu email o intenta loguearte.");
        setIsRegister(false);
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        router.push("/");
      }
    } catch (error: any) {
      alert(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="flex-1 flex flex-col items-center justify-center px-4 py-12 bg-[radial-gradient(circle_at_top,_var(--primary)_0%,_transparent_25%)]">
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
          <h1 className="text-3xl font-bold tracking-tight font-outfit">
            {isRegister ? "Crear Cuenta" : "Bienvenido de nuevo"}
          </h1>
          <p className="text-muted-foreground">
            {isRegister ? "Únete a los mejores organizadores" : "Entra para gestionar tus partidos"}
          </p>
        </div>

        <form onSubmit={handleAuth} className="glass-card p-8 rounded-3xl space-y-5">
          <div className="space-y-2">
            <label className="text-sm font-medium text-muted-foreground">Email</label>
            <input
              required
              type="email"
              placeholder="tu@email.com"
              className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-muted-foreground">Contraseña</label>
            <input
              required
              type="password"
              placeholder="••••••••"
              className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
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
                {isRegister ? <UserPlus className="w-5 h-5" /> : <LogIn className="w-5 h-5" />}
                {isRegister ? "Registrarse" : "Entrar"}
              </>
            )}
          </button>

          <div className="text-center">
            <button
              type="button"
              onClick={() => setIsRegister(!isRegister)}
              className="text-xs text-muted-foreground hover:text-primary transition-colors"
            >
              {isRegister ? "¿Ya tienes cuenta? Entra aquí" : "¿No tienes cuenta? Regístrate gratis"}
            </button>
          </div>
        </form>
      </motion.div>
    </main>
  );
}
