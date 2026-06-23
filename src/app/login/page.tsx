"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { KeyRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MascotSigil, PixelSeparator } from "@/components/retro";
import { useBridle } from "@/lib/store";

export default function LoginPage() {
  const router = useRouter();
  const { signIn, signUp } = useBridle();
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("operator@bridle.network");
  const [name, setName] = useState("Operator Zero");

  function submit(event: FormEvent) {
    event.preventDefault();
    if (mode === "signup") {
      signUp({ email, name });
    } else {
      signIn({ email, name });
    }
    router.push("/dashboard");
  }

  return (
    <main className="grid min-h-screen place-items-center px-5 py-10">
      <div className="grid w-full max-w-5xl gap-6 md:grid-cols-[0.8fr_1fr]">
        <Card className="flex flex-col items-center justify-center">
          <MascotSigil />
          <PixelSeparator />
          <CardTitle className="text-center leading-7">Bind operator identity</CardTitle>
          <p className="mt-4 text-center text-sm leading-7 text-zinc-400">
            Demo auth persists locally. Add Supabase credentials to enable production sessions against the included schema.
          </p>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{mode === "login" ? "Login" : "Sign up"}</CardTitle>
          </CardHeader>
          <CardContent>
            <form className="grid gap-4" onSubmit={submit}>
              <label className="grid gap-2">
                <span className="text-xs uppercase tracking-[0.22em] text-zinc-500">operator name</span>
                <input
                  className="border-2 border-white/50 bg-black px-4 py-3 text-white outline-none focus:border-white"
                  onChange={(event) => setName(event.target.value)}
                  value={name}
                />
              </label>
              <label className="grid gap-2">
                <span className="text-xs uppercase tracking-[0.22em] text-zinc-500">email</span>
                <input
                  className="border-2 border-white/50 bg-black px-4 py-3 text-white outline-none focus:border-white"
                  onChange={(event) => setEmail(event.target.value)}
                  type="email"
                  value={email}
                />
              </label>
              <Button className="mt-2" type="submit">
                <KeyRound className="h-4 w-4" />
                {mode === "login" ? "Open console" : "Create operator"}
              </Button>
            </form>
            <div className="mt-6 flex flex-wrap items-center justify-between gap-3 text-sm text-zinc-400">
              <button className="uppercase tracking-[0.18em] text-white" onClick={() => setMode(mode === "login" ? "signup" : "login")} type="button">
                {mode === "login" ? "Need signup?" : "Have account?"}
              </button>
              <Link className="uppercase tracking-[0.18em] hover:text-white" href="/">
                Back to landing
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
