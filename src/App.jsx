import { useMemo, useState } from "react";

/**
 * Trading Coach (MVP)
 * - Upload a screenshot + describe the strategy you used
 * - Send to n8n webhook (LLM + storage + log)
 * - Receive structured feedback + A–F grade
 *
 * Env: VITE_N8N_TRADE_FEEDBACK_WEBHOOK=https://<your-n8n-domain>/webhook/trade_feedback
 */

const WEBHOOK_URL = import.meta.env.VITE_N8N_TRADE_FEEDBACK_WEBHOOK;

const TF_OPTIONS = ["M1", "M5", "M15", "M30", "H1", "H4", "D1"];
const SESSION_OPTIONS = ["Asia", "London", "NY", "Overlap", "After-hours"];
const DIR_OPTIONS = ["Long", "Short"];

function Labeled({ label, children }) {
  return (
    <label className="block mb-3">
      <div className="text-xs/5 opacity-70 mb-1.5">{label}</div>
      {children}
    </label>
  );
}

export default function App() {
  const [form, setForm] = useState({
    market: "",
    direction: "Long",
    timeframe: "M5",
    session: "London",
    entry: "",
    stop: "",
    target: "",
    rr: "",
    tags: "",
    strategyNotes: "",
    file: null,
  });

  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");

  const isValid = useMemo(() => {
    return !!form.market && !!form.strategyNotes && !!form.file;
  }, [form]);

  const onChange = (k, v) => setForm((prev) => ({ ...prev, [k]: v }));

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    setResult(null);
    try {
      if (!WEBHOOK_URL) throw new Error("Missing VITE_N8N_TRADE_FEEDBACK_WEBHOOK");

      const fd = new FormData();
      fd.append("market", form.market);
      fd.append("direction", form.direction);
      fd.append("timeframe", form.timeframe);
      fd.append("session", form.session);
      fd.append("entry", form.entry);
      fd.append("stop", form.stop);
      fd.append("target", form.target);
      fd.append("rr", form.rr);
      fd.append("tags", form.tags);
      fd.append("strategyNotes", form.strategyNotes);
      if (form.file) fd.append("screenshot", form.file);

      const res = await fetch(WEBHOOK_URL, { method: "POST", body: fd });
      if (!res.ok) throw new Error(`Server responded ${res.status}`);
      const data = await res.json();
      setResult(data);
      try {
        localStorage.setItem("lastTradeFeedback", JSON.stringify(data));
      } catch {}
    } catch (err) {
      setError(err.message || "Submit failed");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#0b0f14] text-[#e7ecf2]">
      <div className="max-w-4xl mx-auto px-4 pt-7 pb-20">
        <header className="flex items-center justify-between mb-5">
          <h1 className="text-2xl font-bold">Trade Coach (Personal)</h1>
          <div className="text-xs opacity-70">MVP — Upload → AI Feedback → Grade</div>
        </header>

        <form
          onSubmit={handleSubmit}
          className="bg-[#121821] rounded-2xl p-4 shadow-[0_8px_30px_rgba(0,0,0,0.35)]"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Labeled label="Market (e.g., EURUSD, SPY)">
              <input
                value={form.market}
                onChange={(e) => onChange("market", e.target.value)}
                placeholder="EURUSD"
                required
                className={ipt}
              />
            </Labeled>

            <Labeled label="Direction">
              <select
                value={form.direction}
                onChange={(e) => onChange("direction", e.target.value)}
                className={ipt}
              >
                {DIR_OPTIONS.map((o) => (
                  <option key={o}>{o}</option>
                ))}
              </select>
            </Labeled>

            <Labeled label="Timeframe">
              <select
                value={form.timeframe}
                onChange={(e) => onChange("timeframe", e.target.value)}
                className={ipt}
              >
                {TF_OPTIONS.map((o) => (
                  <option key={o}>{o}</option>
                ))}
              </select>
            </Labeled>

            <Labeled label="Session">
              <select
                value={form.session}
                onChange={(e) => onChange("session", e.target.value)}
                className={ipt}
              >
                {SESSION_OPTIONS.map((o) => (
                  <option key={o}>{o}</option>
                ))}
              </select>
            </Labeled>

            <Labeled label="Entry (optional)">
              <input
                value={form.entry}
                onChange={(e) => onChange("entry", e.target.value)}
                placeholder="1.3050"
                className={ipt}
              />
            </Labeled>

            <Labeled label="Stop (optional)">
              <input
                value={form.stop}
                onChange={(e) => onChange("stop", e.target.value)}
                placeholder="1.3020"
                className={ipt}
              />
            </Labeled>

            <Labeled label="Target (optional)">
              <input
                value={form.target}
                onChange={(e) => onChange("target", e.target.value)}
                placeholder="1.3120"
                className={ipt}
              />
            </Labeled>

            <Labeled label="Risk:Reward (optional)">
              <input
                value={form.rr}
                onChange={(e) => onChange("rr", e.target.value)}
                placeholder="1.5"
                className={ipt}
              />
            </Labeled>
          </div>

          <Labeled label="Tags (comma separated)">
            <input
              value={form.tags}
              onChange={(e) => onChange("tags", e.target.value)}
              placeholder="FVG, OB, sweep"
              className={ipt}
            />
          </Labeled>

          <Labeled label="Strategy I was using — describe the setup">
            <textarea
              value={form.strategyNotes}
              onChange={(e) => onChange("strategyNotes", e.target.value)}
              placeholder="Break of structure + FVG fill back into OB; London session; target Asia low; partials at 1R..."
              rows={6}
              required
              className={`${ipt} resize-y`}
            />
          </Labeled>

          <Labeled label="Screenshot (.png/.jpg)">
            <input
              type="file"
              accept="image/*"
              onChange={(e) => onChange("file", e.target.files?.[0] || null)}
              required
              className={ipt}
            />
          </Labeled>

          <button disabled={!isValid || submitting} className={btn}>
            {submitting ? "Scoring…" : "Get Feedback"}
          </button>
        </form>

        {error && (
          <div className="mt-4 p-3 rounded-xl bg-[#2b1620] text-[#ffd0d7]">Error: {error}</div>
        )}

        {result && <FeedbackCard data={result} />}
      </div>
    </div>
  );
}

const ipt = "w-full bg-[#0d121a] border border-[#243043] text-[#e7ecf2] rounded-xl px-3 py-2 outline-none focus:border-[#3b4e6c]";
const btn = "mt-2 w-full bg-[#1b9aaa] hover:brightness-110 text-white border-0 rounded-xl px-4 py-3 font-bold cursor-pointer disabled:opacity-50";

function FeedbackCard({ data }) {
  // Expected shape from n8n response:
  // { id, timestamp, market, direction, timeframe, session, screenshotUrl, grade, feedback: { wentWrong:[], doBetter:[], learn:[], verdict:"" } }
  const { id, timestamp, market, direction, timeframe, session, screenshotUrl, grade, feedback } = data || {};

  return (
    <div className="mt-6 bg-[#121821] rounded-2xl p-4 shadow-[0_8px_30px_rgba(0,0,0,0.35)]">
      <div className="flex flex-col md:flex-row gap-4 items-start">
        {screenshotUrl && (
          <img
            src={screenshotUrl}
            alt="trade"
            className="w-[220px] h-auto rounded-xl border border-[#243043]"
          />
        )}
        <div className="flex-1">
          <div className="flex items-center justify-between gap-3">
            <div>
              <div className="text-lg font-bold">{market} · {direction} · {timeframe}</div>
              <div className="text-xs opacity-70">{session} · {timestamp ? new Date(timestamp).toLocaleString() : ""}</div>
            </div>
            <div className="text-3xl font-black leading-none px-3 py-1 rounded-xl border border-[#243043]">
              {grade}
            </div>
          </div>

          {feedback?.verdict && (
            <p className="mt-3 opacity-90">{feedback.verdict}</p>
          )}

          <div className="grid md:grid-cols-3 gap-3 mt-3">
            <Pillar title="Where it went wrong" items={feedback?.wentWrong} />
            <Pillar title="What to do better next time" items={feedback?.doBetter} />
            <Pillar title="What to learn" items={feedback?.learn} />
          </div>

          <div className="mt-3 text-xs opacity-60">ID: {id}</div>
        </div>
      </div>
    </div>
  );
}

function Pillar({ title, items }) {
  if (!items || items.length === 0) return null;
  return (
    <div className="bg-[#0d121a] border border-[#243043] rounded-xl p-3">
      <div className="font-bold mb-1.5">{title}</div>
      <ul className="pl-4 m-0 list-disc">
        {items.map((it, i) => (
          <li key={i} className="my-1">{it}</li>
        ))}
      </ul>
    </div>
  );
}
