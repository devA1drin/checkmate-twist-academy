"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { getSupabase } from "@/lib/supabase/client";
import { writeLocalPrefs, type Interest, type Skill } from "@/lib/onboarding";

const INTERESTS: [Interest, string, string][] = [
  ["chess", "Chess", "Lessons, openings, puzzles, live games."],
  ["cube", "Rubik's Cube", "Solving methods, algorithms, timer, battles."],
  ["both", "Both", "A bit of each. You can change this later."],
];
const LEVELS: [Skill, string, string][] = [
  ["new", "Completely new", "I don't know the rules or how to solve the cube yet."],
  ["beginner", "Beginner", "I know the basics but I'm not confident."],
  ["intermediate", "Intermediate", "I play or solve regularly and want to get better."],
  ["advanced", "Advanced", "I study seriously or compete."],
];

function Choice<T extends string>({ name, options, value, onChange }: { name: string; options: [T, string, string][]; value: T | null; onChange: (v: T) => void }) {
  return (
    <fieldset>
      <legend className="sr-only">{name}</legend>
      <div className="border-t border-ink">
        {options.map(([k, label, desc]) => (
          <label key={k} className={`flex items-center gap-4 px-3 py-4 border-b border-line cursor-pointer min-h-[64px] ${value === k ? "bg-surface-2" : "hover:bg-surface"}`}>
            <input type="radio" name={name} value={k} checked={value === k} onChange={() => onChange(k)} className="sr-only" />
            <span aria-hidden className={`h-5 w-5 shrink-0 rounded-full border-2 grid place-items-center ${value === k ? "border-electric bg-electric text-on-electric" : "border-muted"}`}>{value === k && <Check size={12} strokeWidth={3} />}</span>
            <span><span className="block font-medium">{label}</span><span className="block text-sm text-muted">{desc}</span></span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}

export function Onboarding() {
  const { user, refreshProfile } = useAuth();
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [interest, setInterest] = useState<Interest | null>(null);
  const [level, setLevel] = useState<Skill | null>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const finish = async () => {
    if (!interest || !level) return;
    setBusy(true); setErr(null);
    writeLocalPrefs({ interests: interest, level });
    const sb = getSupabase();
    if (sb && user) {
      const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
      const { error } = await sb.from("profiles").update({ interests: interest, skill_level: level, onboarded: true, tz }).eq("id", user.id);
      if (error) { setErr("Could not save to your account. Your choice is kept in this browser."); setBusy(false); return; }
      await refreshProfile();
    }
    router.push("/dashboard");
  };

  return (
    <div>
      <p className="eyebrow">Step {step + 1} of 2</p>
      {step === 0 ? (
        <>
          <h1 className="font-display text-3xl font-semibold mt-2 mb-2">What do you want to learn?</h1>
          <p className="text-muted mb-6">We use this to pick your first lessons. Nothing is hidden; you can open everything at any time.</p>
          <Choice name="interest" options={INTERESTS} value={interest} onChange={setInterest} />
          <div className="mt-6 flex justify-end"><button className="btn btn-primary" disabled={!interest} onClick={() => setStep(1)}>Next</button></div>
        </>
      ) : (
        <>
          <h1 className="font-display text-3xl font-semibold mt-2 mb-2">How much do you know already?</h1>
          <p className="text-muted mb-6">Be honest; you can skip ahead whenever lessons feel too easy.</p>
          <Choice name="level" options={LEVELS} value={level} onChange={setLevel} />
          {err && <p className="notice notice-bad mt-4">{err}</p>}
          <div className="mt-6 flex justify-between"><button className="btn btn-ghost" onClick={() => setStep(0)}>Back</button><button className="btn btn-primary" disabled={!level || busy} onClick={finish}>{busy ? "Saving…" : "Show my plan"}</button></div>
        </>
      )}
    </div>
  );
}
