import { FormEvent, useEffect, useMemo, useState } from "react";
import PasswordInput from "../../components/common/PasswordInput";
import { useLanguage } from "../../contexts/LocaleContext";
import { useNotification } from "../../contexts/NotificationContext";
import type { SetupAnnualMoment, SetupSiteConfig } from "../../types/anniversary";
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

function parseConfigJson(source: string, invalidMessage: string): SetupSiteConfig {
  const parsed = JSON.parse(source) as SetupSiteConfig;
  if (!parsed || typeof parsed !== "object") {
    throw new Error(invalidMessage);
  }
  return parsed;
}

export default function SetupAnniversaryPage() {
  const { t } = useLanguage();
  const { notifyError, notifySuccess } = useNotification();
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
    const text = t("setup.tokenSaved");
    setMessage(text);
    notifySuccess(text);
    setError("");
  }

  async function loadConfig() {
    setMessage("");
    setError("");
    setFetching(true);
    try {
      const config = await getSetupConfig(setupToken);
      setConfigJson(toPrettyJson(config));
      const text = t("setup.configLoaded");
      setMessage(text);
      notifySuccess(text);
    } catch (err) {
      const text = err instanceof Error ? err.message : t("setup.configLoadFailed");
      setError(text);
      notifyError(text);
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
      const payload = parseConfigJson(configJson, t("setup.invalidJson"));
      await updateSetupConfig(setupToken, payload);
      const refreshed = await getSetupConfig(setupToken);
      setConfigJson(toPrettyJson(refreshed));
      const text = t("setup.configSaved");
      setMessage(text);
      notifySuccess(text);
    } catch (err) {
      const text = err instanceof Error ? err.message : t("setup.configSaveFailed");
      setError(text);
      notifyError(text);
    } finally {
      setSaving(false);
    }
  }

  async function onReplaceMomentsFromJson() {
    setMessage("");
    setError("");
    setActionLoading(true);

    try {
      const payload = parseConfigJson(configJson, t("setup.invalidJson"));
      if (!Array.isArray(payload.annual_moments)) {
        throw new Error(t("setup.momentsArrayRequired"));
      }

      await replaceSetupMoments(setupToken, payload.annual_moments);
      const refreshed = await getSetupConfig(setupToken);
      setConfigJson(toPrettyJson(refreshed));
      const text = t("setup.momentsReplaced");
      setMessage(text);
      notifySuccess(text);
    } catch (err) {
      const text = err instanceof Error ? err.message : t("setup.momentsReplaceFailed");
      setError(text);
      notifyError(text);
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
      const payload: SetupAnnualMoment = {
        year: Number(momentYear),
        title: momentTitle,
        date: momentDate,
        note: momentNote,
      };

      await addSetupMoment(setupToken, payload);
      const refreshed = await getSetupConfig(setupToken);
      setConfigJson(toPrettyJson(refreshed));
      const text = t("setup.momentAdded", { year: momentYear });
      setMessage(text);
      notifySuccess(text);
      setMomentTitle("");
      setMomentDate("");
      setMomentNote("");
    } catch (err) {
      const text = err instanceof Error ? err.message : t("setup.momentAddFailed");
      setError(text);
      notifyError(text);
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
      const text = t("setup.momentDeleted", { year: deleteYear });
      setMessage(text);
      notifySuccess(text);
    } catch (err) {
      const text = err instanceof Error ? err.message : t("setup.momentDeleteFailed");
      setError(text);
      notifyError(text);
    } finally {
      setActionLoading(false);
    }
  }

  return (
    <section className="space-y-4">
      <article className="rounded-2xl border border-[#9c4f46]/20 bg-white/65 p-5">
        <p className="text-xs uppercase tracking-[0.12em] text-[#6f332f]">{t("setup.tag")}</p>
        <h1 className="mt-2 font-display text-4xl leading-none">{t("setup.title")}</h1>
        <p className="mt-2 text-sm text-[#2b2220]/70">
          {t("setup.subtitle")}
        </p>
      </article>

      <article className="rounded-2xl border border-[#9c4f46]/20 bg-white/65 p-4">
        <div className="grid gap-3 md:grid-cols-[1fr_auto_auto] md:items-end">
          <label className="block">
            <span className="mb-1 block text-sm font-semibold">{t("setup.tokenLabel")}</span>
            <PasswordInput
              value={setupToken}
              onChange={(event) => setSetupToken(event.target.value)}
              className="w-full rounded-xl border border-[#9c4f46]/20 bg-white px-3 py-2.5 text-sm outline-none focus:border-[#9c4f46]"
              placeholder={t("setup.tokenPlaceholder")}
            />
          </label>
          <button
            type="button"
            onClick={saveToken}
            disabled={tokenMissing}
            className="rounded-xl border border-[#9c4f46]/30 bg-white px-4 py-2.5 text-sm font-semibold disabled:opacity-60"
          >
            {t("setup.saveToken")}
          </button>
          <button
            type="button"
            onClick={loadConfig}
            disabled={tokenMissing || fetching}
            className="rounded-xl bg-[#9c4f46] px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-60"
          >
            {fetching ? t("setup.loading") : t("setup.loadConfig")}
          </button>
        </div>
      </article>

      {message ? <p className="rounded-xl border border-emerald-300 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">{message}</p> : null}
      {error ? <p className="rounded-xl border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p> : null}

      <form onSubmit={onSaveConfig} className="rounded-2xl border border-[#9c4f46]/20 bg-white/65 p-4 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-sm font-semibold">{t("setup.fullJsonEditor")}</p>
          <button
            type="submit"
            disabled={tokenMissing || saving}
            className="rounded-xl bg-gradient-to-r from-[#9c4f46] to-[#6f332f] px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
          >
            {saving ? t("setup.saving") : t("setup.saveFullConfig")}
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
          <p className="text-sm font-semibold">{t("setup.addAnnualMoment")}</p>
          <label className="block">
            <span className="mb-1 block text-xs font-semibold uppercase tracking-[0.1em]">{t("setup.year")}</span>
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
            <span className="mb-1 block text-xs font-semibold uppercase tracking-[0.1em]">{t("setup.titleField")}</span>
            <input
              type="text"
              value={momentTitle}
              onChange={(event) => setMomentTitle(event.target.value)}
              className="w-full rounded-xl border border-[#9c4f46]/20 bg-white px-3 py-2 text-sm outline-none focus:border-[#9c4f46]"
              required
            />
          </label>
          <label className="block">
            <span className="mb-1 block text-xs font-semibold uppercase tracking-[0.1em]">{t("setup.dateField")}</span>
            <input
              type="date"
              value={momentDate}
              onChange={(event) => setMomentDate(event.target.value)}
              className="w-full rounded-xl border border-[#9c4f46]/20 bg-white px-3 py-2 text-sm outline-none focus:border-[#9c4f46]"
              required
            />
          </label>
          <label className="block">
            <span className="mb-1 block text-xs font-semibold uppercase tracking-[0.1em]">{t("setup.noteField")}</span>
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
            {actionLoading ? t("setup.processing") : t("setup.addMoment")}
          </button>
        </form>

        <article className="rounded-2xl border border-[#9c4f46]/20 bg-white/65 p-4 space-y-3">
          <p className="text-sm font-semibold">{t("setup.momentUtilities")}</p>
          <label className="block">
            <span className="mb-1 block text-xs font-semibold uppercase tracking-[0.1em]">{t("setup.deleteByYear")}</span>
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
              {t("setup.deleteMoment")}
            </button>
            <button
              type="button"
              onClick={onReplaceMomentsFromJson}
              disabled={tokenMissing || actionLoading}
              className="rounded-xl border border-[#9c4f46]/30 bg-white px-4 py-2 text-sm font-semibold disabled:opacity-60"
            >
              {t("setup.replaceFromJson")}
            </button>
          </div>
          <p className="text-xs text-[#2b2220]/65">
            {t("setup.tips")}
          </p>
        </article>
      </div>
    </section>
  );
}
