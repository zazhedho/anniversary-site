import { FormEvent, useEffect, useMemo, useState } from "react";
import type { AnnualMomentConfig, SiteConfig } from "../../types/anniversary";
import {
  addSetupMoment,
  deleteSetupMoment,
  getSetupConfig,
  replaceSetupMoments,
  updateSetupConfig,
} from "../../services/setupService";

const SETUP_TOKEN_KEY = "anniv_setup_token";

function toPrettyJson(value: unknown): string {
  return JSON.stringify(value, null, 2);
}

function parseConfigJson(source: string): SiteConfig {
  const parsed = JSON.parse(source) as SiteConfig;
  if (!parsed || typeof parsed !== "object") {
    throw new Error("JSON config tidak valid");
  }
  return parsed;
}

export default function SetupAnniversaryPage() {
  const [setupToken, setSetupToken] = useState("");
  const [configJson, setConfigJson] = useState("{}");
  const [fetching, setFetching] = useState(false);
  const [saving, setSaving] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const [momentYear, setMomentYear] = useState(1);
  const [momentTitle, setMomentTitle] = useState("");
  const [momentDate, setMomentDate] = useState("");
  const [momentNote, setMomentNote] = useState("");
  const [deleteYear, setDeleteYear] = useState(1);

  const tokenMissing = useMemo(() => setupToken.trim() === "", [setupToken]);

  useEffect(() => {
    const savedToken = localStorage.getItem(SETUP_TOKEN_KEY) || "";
    if (savedToken) {
      setSetupToken(savedToken);
    }
  }, []);

  function saveToken() {
    localStorage.setItem(SETUP_TOKEN_KEY, setupToken.trim());
    setMessage("Setup token tersimpan di browser.");
    setError("");
  }

  async function loadConfig() {
    setMessage("");
    setError("");
    setFetching(true);
    try {
      const config = await getSetupConfig(setupToken);
      setConfigJson(toPrettyJson(config));
      setMessage("Config setup berhasil dimuat.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal memuat config setup");
    } finally {
      setFetching(false);
    }
  }

  async function onSaveConfig(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");
    setError("");
    setSaving(true);

    try {
      const payload = parseConfigJson(configJson);
      await updateSetupConfig(setupToken, payload);
      const refreshed = await getSetupConfig(setupToken);
      setConfigJson(toPrettyJson(refreshed));
      setMessage("Config JSON berhasil disimpan.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal menyimpan config setup");
    } finally {
      setSaving(false);
    }
  }

  async function onReplaceMomentsFromJson() {
    setMessage("");
    setError("");
    setActionLoading(true);

    try {
      const payload = parseConfigJson(configJson);
      if (!Array.isArray(payload.annual_moments)) {
        throw new Error("Field annual_moments harus berupa array");
      }

      await replaceSetupMoments(setupToken, payload.annual_moments);
      const refreshed = await getSetupConfig(setupToken);
      setConfigJson(toPrettyJson(refreshed));
      setMessage("Annual moments berhasil diganti dari JSON editor.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal replace annual moments");
    } finally {
      setActionLoading(false);
    }
  }

  async function onAddMoment(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");
    setError("");
    setActionLoading(true);

    try {
      const payload: AnnualMomentConfig = {
        year: Number(momentYear),
        title: momentTitle,
        date: momentDate,
        note: momentNote,
      };

      await addSetupMoment(setupToken, payload);
      const refreshed = await getSetupConfig(setupToken);
      setConfigJson(toPrettyJson(refreshed));
      setMessage(`Moment tahun ke-${momentYear} berhasil ditambahkan.`);
      setMomentTitle("");
      setMomentDate("");
      setMomentNote("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal menambah moment");
    } finally {
      setActionLoading(false);
    }
  }

  async function onDeleteMoment() {
    setMessage("");
    setError("");
    setActionLoading(true);

    try {
      await deleteSetupMoment(setupToken, Number(deleteYear));
      const refreshed = await getSetupConfig(setupToken);
      setConfigJson(toPrettyJson(refreshed));
      setMessage(`Moment tahun ke-${deleteYear} berhasil dihapus.`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal menghapus moment");
    } finally {
      setActionLoading(false);
    }
  }

  return (
    <section className="space-y-4">
      <article className="rounded-2xl border border-[#9c4f46]/20 bg-white/65 p-5">
        <p className="text-xs uppercase tracking-[0.12em] text-[#6f332f]">Ruang Persiapan</p>
        <h1 className="mt-2 font-display text-4xl leading-none">Setup Anniversary JSON</h1>
        <p className="mt-2 text-sm text-[#2b2220]/70">
          Kelola konten anniversary dan momen tahunan dari editor ini.
        </p>
      </article>

      <article className="rounded-2xl border border-[#9c4f46]/20 bg-white/65 p-4">
        <div className="grid gap-3 md:grid-cols-[1fr_auto_auto] md:items-end">
          <label className="block">
            <span className="mb-1 block text-sm font-semibold">Setup Token</span>
            <input
              type="password"
              value={setupToken}
              onChange={(event) => setSetupToken(event.target.value)}
              className="w-full rounded-xl border border-[#9c4f46]/20 bg-white px-3 py-2.5 text-sm outline-none focus:border-[#9c4f46]"
              placeholder="Token dari env SETUP_TOKEN backend"
            />
          </label>
          <button
            type="button"
            onClick={saveToken}
            disabled={tokenMissing}
            className="rounded-xl border border-[#9c4f46]/30 bg-white px-4 py-2.5 text-sm font-semibold disabled:opacity-60"
          >
            Save Token
          </button>
          <button
            type="button"
            onClick={loadConfig}
            disabled={tokenMissing || fetching}
            className="rounded-xl bg-[#9c4f46] px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-60"
          >
            {fetching ? "Loading..." : "Load Config"}
          </button>
        </div>
      </article>

      {message ? <p className="rounded-xl border border-emerald-300 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">{message}</p> : null}
      {error ? <p className="rounded-xl border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p> : null}

      <form onSubmit={onSaveConfig} className="rounded-2xl border border-[#9c4f46]/20 bg-white/65 p-4 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-sm font-semibold">Full JSON Editor</p>
          <button
            type="submit"
            disabled={tokenMissing || saving}
            className="rounded-xl bg-gradient-to-r from-[#9c4f46] to-[#6f332f] px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
          >
            {saving ? "Saving..." : "Save Full Config"}
          </button>
        </div>
        <textarea
          value={configJson}
          onChange={(event) => setConfigJson(event.target.value)}
          className="min-h-[420px] w-full rounded-xl border border-[#9c4f46]/20 bg-[#2b2220] p-3 font-mono text-xs text-[#ffe8d9] outline-none focus:border-[#9c4f46]"
          spellCheck={false}
        />
      </form>

      <div className="grid gap-4 lg:grid-cols-2">
        <form onSubmit={onAddMoment} className="rounded-2xl border border-[#9c4f46]/20 bg-white/65 p-4 space-y-3">
          <p className="text-sm font-semibold">Add Annual Moment</p>
          <label className="block">
            <span className="mb-1 block text-xs font-semibold uppercase tracking-[0.1em]">Year</span>
            <input
              type="number"
              min={1}
              value={momentYear}
              onChange={(event) => setMomentYear(Number(event.target.value))}
              className="w-full rounded-xl border border-[#9c4f46]/20 bg-white px-3 py-2 text-sm outline-none focus:border-[#9c4f46]"
              required
            />
          </label>
          <label className="block">
            <span className="mb-1 block text-xs font-semibold uppercase tracking-[0.1em]">Title</span>
            <input
              type="text"
              value={momentTitle}
              onChange={(event) => setMomentTitle(event.target.value)}
              className="w-full rounded-xl border border-[#9c4f46]/20 bg-white px-3 py-2 text-sm outline-none focus:border-[#9c4f46]"
              required
            />
          </label>
          <label className="block">
            <span className="mb-1 block text-xs font-semibold uppercase tracking-[0.1em]">Date (YYYY-MM-DD)</span>
            <input
              type="date"
              value={momentDate}
              onChange={(event) => setMomentDate(event.target.value)}
              className="w-full rounded-xl border border-[#9c4f46]/20 bg-white px-3 py-2 text-sm outline-none focus:border-[#9c4f46]"
              required
            />
          </label>
          <label className="block">
            <span className="mb-1 block text-xs font-semibold uppercase tracking-[0.1em]">Note</span>
            <textarea
              value={momentNote}
              onChange={(event) => setMomentNote(event.target.value)}
              className="min-h-[96px] w-full rounded-xl border border-[#9c4f46]/20 bg-white px-3 py-2 text-sm outline-none focus:border-[#9c4f46]"
              required
            />
          </label>
          <button
            type="submit"
            disabled={tokenMissing || actionLoading}
            className="rounded-xl bg-[#9c4f46] px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
          >
            {actionLoading ? "Processing..." : "Add Moment"}
          </button>
        </form>

        <article className="rounded-2xl border border-[#9c4f46]/20 bg-white/65 p-4 space-y-3">
          <p className="text-sm font-semibold">Moment Utilities</p>
          <label className="block">
            <span className="mb-1 block text-xs font-semibold uppercase tracking-[0.1em]">Delete By Year</span>
            <input
              type="number"
              min={1}
              value={deleteYear}
              onChange={(event) => setDeleteYear(Number(event.target.value))}
              className="w-full rounded-xl border border-[#9c4f46]/20 bg-white px-3 py-2 text-sm outline-none focus:border-[#9c4f46]"
            />
          </label>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={onDeleteMoment}
              disabled={tokenMissing || actionLoading}
              className="rounded-xl border border-red-300 bg-red-50 px-4 py-2 text-sm font-semibold text-red-700 disabled:opacity-60"
            >
              Delete Moment
            </button>
            <button
              type="button"
              onClick={onReplaceMomentsFromJson}
              disabled={tokenMissing || actionLoading}
              className="rounded-xl border border-[#9c4f46]/30 bg-white px-4 py-2 text-sm font-semibold disabled:opacity-60"
            >
              Replace Moments From JSON
            </button>
          </div>
          <p className="text-xs text-[#2b2220]/65">
            Tips: edit bagian <code>annual_moments</code> di JSON editor, lalu klik <b>Replace Moments From JSON</b>.
          </p>
        </article>
      </div>
    </section>
  );
}
