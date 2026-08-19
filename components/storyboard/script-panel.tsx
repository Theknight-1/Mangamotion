"use client";

import { useState } from "react";
import { FileText, Sparkles, Users2, Loader2 } from "lucide-react";
import { storyboardApi } from "@/lib/api";

interface Props {
  projectId: string;
  initialScript?: string | null;
  onParsed: (shotCount: number, newCharacterCount: number) => void;
}

export function ScriptPanel({ projectId, initialScript, onParsed }: Props) {
  const [scriptText, setScriptText] = useState(initialScript ?? "");
  const [parsing, setParsing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{ shots: number; characters: number } | null>(null);

  async function handleParse() {
    if (!scriptText.trim()) return;
    setParsing(true);
    setError(null);
    try {
      const res = await storyboardApi.generateBreakdown(projectId, {
        scriptText,
      });
      const shotCount = res.shots?.length || 0;
      const charCount = res.breakdown?.characters?.length || 0;
      setResult({ shots: shotCount, characters: charCount });
      onParsed(shotCount, charCount);
    } catch (err: any) {
      setError(err.message ?? "Failed to parse script");
    } finally {
      setParsing(false);
    }
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-2 text-xs text-white/40">
        <FileText size={13} />
        Plain text script or story. PDF/Fountain files should be converted to
        text before pasting here.
      </div>

      <textarea
        value={scriptText}
        onChange={(e) => setScriptText(e.target.value)}
        placeholder="Paste your script or story beats here..."
        rows={16}
        className="w-full resize-y rounded-xl border border-white/10 bg-black/20 p-4 font-mono text-sm leading-relaxed text-white/90 placeholder:text-white/25 focus:border-[#87da70]/40 focus:outline-none"
      />

      {error && <p className="text-xs text-red-400">{error}</p>}
      {result && !error && (
        <div className="flex items-center gap-4 rounded-lg border border-[#87da70]/20 bg-[#87da70]/5 px-3 py-2 text-xs text-[#c9f2b8]">
          <span className="flex items-center gap-1.5">
            <Sparkles size={12} />
            {result.shots} shot{result.shots === 1 ? "" : "s"} extracted
          </span>
          {result.characters > 0 && (
            <span className="flex items-center gap-1.5">
              <Users2 size={12} />
              {result.characters} character{result.characters === 1 ? "" : "s"} auto-detected
            </span>
          )}
        </div>
      )}

      <div className="flex justify-end">
        <button
          disabled={!scriptText.trim() || parsing}
          onClick={handleParse}
          className="flex items-center gap-2 rounded-xl bg-[#87da70] px-5 py-2.5 text-sm font-semibold text-black transition hover:scale-[1.02] disabled:opacity-40 disabled:hover:scale-100"
        >
          {parsing ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}
          {parsing ? "Parsing script..." : "Parse into shot list"}
        </button>
      </div>
    </div>
  );
}
