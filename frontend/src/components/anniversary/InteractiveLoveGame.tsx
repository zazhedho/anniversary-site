import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { buildJourneyPhotos, buildJourneyVideos } from "../../data/romanceJourney";
import type { PublicSiteConfig } from "../../types/anniversary";
import { romanticLineKeys, romanticTagKey, resolveRomanticBranch, type RomanticBranch } from "./gameBranching";
import JourneyChapter, { type JourneyDirection, type JourneyStage } from "./JourneyChapter";
import type { UnlockMemoryCard } from "./MemoryUnlockStage";

type TranslateFn = (key: string, vars?: Record<string, string | number>) => string;

type HeartBurst = {
  id: number;
  left: number;
  icon: string;
};

type NoPosition = {
  top: number;
  left: number;
};

type GameStep = "challenge" | "romantic" | "journey";

type InteractiveLoveGameProps = {
  t: TranslateFn;
  config?: PublicSiteConfig;
  showcasePath: string;
};

const NO_LIMIT = 10;
const SURPRISE_TOTAL = 5;
const PHOTO_AUTO_SLIDE_MS = 3200;
const UNLOCK_REQUIRED = 3;

export default function InteractiveLoveGame({ t, config, showcasePath }: InteractiveLoveGameProps) {
  const navigate = useNavigate();
  const [noCount, setNoCount] = useState(0);
  const [yesAccepted, setYesAccepted] = useState(false);
  const [noFloating, setNoFloating] = useState(false);
  const [noPosition, setNoPosition] = useState<NoPosition>({ top: 0, left: 0 });
  const [step, setStep] = useState<GameStep>("challenge");
  const [romanticBranch, setRomanticBranch] = useState<RomanticBranch>("instant");
  const [romanticLineIndex, setRomanticLineIndex] = useState(0);
  const [journeyStage, setJourneyStage] = useState<JourneyStage>("surprise");
  const [journeyDirection, setJourneyDirection] = useState<JourneyDirection>("next");
  const [isEnvelopeOpen, setIsEnvelopeOpen] = useState(false);
  const [photoIndex, setPhotoIndex] = useState(0);
  const [videoIndex, setVideoIndex] = useState(0);
  const [unlockCards, setUnlockCards] = useState<UnlockMemoryCard[]>([]);
  const [revealedUnlockIds, setRevealedUnlockIds] = useState<string[]>([]);
  const [focusedUnlockId, setFocusedUnlockId] = useState<string | null>(null);
  const [surpriseIndex, setSurpriseIndex] = useState(0);
  const [bursts, setBursts] = useState<HeartBurst[]>([]);
  const [viewport, setViewport] = useState<{ width: number; height: number }>({ width: 1024, height: 768 });
  const timersRef = useRef<number[]>([]);
  const photos = useMemo(() => buildJourneyPhotos(config), [config]);
  const videos = useMemo(() => buildJourneyVideos(config), [config]);
  const hasVideos = videos.length > 0;
  const hasVoiceNote = useMemo(() => (config?.voice_note_url || "").trim() !== "", [config?.voice_note_url]);
  const journeyFlow = useMemo<JourneyStage[]>(() => {
    const flow: JourneyStage[] = ["surprise"];
    if (hasVoiceNote) flow.push("voice");
    flow.push("unlock", "photos");
    if (hasVideos) flow.push("videos");
    return flow;
  }, [hasVideos, hasVoiceNote]);
  const journeyIndex = journeyFlow.indexOf(journeyStage);
  const isJourneyFirst = journeyIndex <= 0;
  const isJourneyLast = journeyIndex === journeyFlow.length - 1;
  const loverName = useMemo(() => {
    const names = (config?.couple_names || "")
      .split("&")
      .map((item) => item.trim())
      .filter(Boolean);
    if (names.length > 1) return names[names.length - 1];
    if (names.length === 1) return names[0];
    return t("showcase.game.loveFallbackName");
  }, [config?.couple_names, t]);
  const romanticLines = useMemo(() => {
    const lineKeys = romanticLineKeys(romanticBranch);
    return lineKeys.map((key) => t(key, { name: loverName }));
  }, [loverName, romanticBranch, t]);
  const romanticTag = useMemo(() => t(romanticTagKey(romanticBranch)), [romanticBranch, t]);
  const surpriseLines = useMemo(
    () => [
      t("showcase.game.surpriseLine1"),
      t("showcase.game.surpriseLine2"),
      t("showcase.game.surpriseLine3"),
      t("showcase.game.surpriseLine4"),
      t("showcase.game.surpriseLine5"),
    ],
    [t]
  );
  const unlockCandidates = useMemo(() => {
    const fromMemory = (config?.memory_cards || [])
      .map((item, index) => ({
        id: `memory-${index + 1}`,
        title: item.title || `Moment ${index + 1}`,
        summary: item.summary || "",
        note: item.note || item.summary || "",
      }))
      .filter((item) => item.note.trim() !== "");

    if (fromMemory.length > 0) return fromMemory;

    return photos.map((item, index) => ({
      id: `photo-${index + 1}`,
      title: item.title || `Moment ${index + 1}`,
      summary: item.caption || "",
      note: item.caption || t("showcase.game.unlockFallbackNote"),
    }));
  }, [config?.memory_cards, photos, t]);
  const unlockRequiredCount = Math.min(UNLOCK_REQUIRED, unlockCards.length);
  const canProceedUnlock = unlockRequiredCount === 0 || revealedUnlockIds.length >= unlockRequiredCount;
  const focusedUnlockCard = unlockCards.find((item) => item.id === focusedUnlockId);
  const chapterTitle = useMemo(() => {
    if (step === "challenge") return t("showcase.game.chapterChallenge");
    if (step === "romantic") return t("showcase.game.chapterRomantic");
    if (journeyStage === "surprise") return t("showcase.game.chapterSurprise");
    if (journeyStage === "voice") return t("showcase.game.chapterVoice");
    if (journeyStage === "unlock") return t("showcase.game.chapterUnlock");
    if (journeyStage === "photos") return t("showcase.game.chapterPhotos");
    return t("showcase.game.chapterVideos");
  }, [journeyStage, step, t]);

  const noHidden = yesAccepted || noCount >= NO_LIMIT;
  const fullScreenYes = !yesAccepted && noCount >= NO_LIMIT;
  const yesVisual = useMemo(() => {
    if (fullScreenYes) {
      return { width: undefined, height: undefined, fontSize: undefined, borderRadius: undefined };
    }

    const growth = noCount * noCount;
    const width = Math.min(180 + growth * 34 + noCount * 46, Math.max(240, viewport.width - 18));
    const height = Math.min(54 + growth * 3 + noCount * 10, Math.max(68, Math.floor(viewport.height * 0.52)));
    const fontSize = Math.min(16 + growth * 0.65 + noCount * 0.9, 56);
    const borderRadius = Math.max(28 - noCount * 2.7, 2);

    return { width, height, fontSize, borderRadius };
  }, [fullScreenYes, noCount, viewport.height, viewport.width]);

  useEffect(() => {
    return () => {
      timersRef.current.forEach((timer) => window.clearTimeout(timer));
      timersRef.current = [];
    };
  }, []);

  useEffect(() => {
    if (photoIndex <= photos.length - 1) return;
    setPhotoIndex(0);
  }, [photoIndex, photos.length]);

  useEffect(() => {
    if (step !== "journey" || journeyStage !== "photos" || photos.length < 2) return;
    const slider = window.setInterval(() => {
      setPhotoIndex((prev) => (prev + 1) % photos.length);
    }, PHOTO_AUTO_SLIDE_MS);
    return () => window.clearInterval(slider);
  }, [journeyStage, photos.length, step]);

  useEffect(() => {
    if (videoIndex <= videos.length - 1) return;
    setVideoIndex(0);
  }, [videoIndex, videos.length]);

  useEffect(() => {
    if (step !== "journey" || journeyStage !== "surprise") return;
    setIsEnvelopeOpen(false);
    const timer = window.setTimeout(() => {
      setIsEnvelopeOpen(true);
    }, 240);
    timersRef.current.push(timer);
  }, [journeyStage, step, surpriseIndex]);

  useEffect(() => {
    function syncViewport() {
      setViewport({ width: window.innerWidth, height: window.innerHeight });
    }

    syncViewport();
    window.addEventListener("resize", syncViewport);
    return () => window.removeEventListener("resize", syncViewport);
  }, []);

  useEffect(() => {
    if (step !== "journey" || journeyStage !== "unlock" || unlockCards.length > 0) return;
    setUnlockCards(pickUnlockCards(unlockCandidates));
  }, [journeyStage, step, unlockCandidates, unlockCards.length]);

  function randomNoPosition() {
    const buttonWidth = 130;
    const buttonHeight = 44;
    const safePadding = 14;
    const topMin = 90;

    const maxLeft = Math.max(safePadding, window.innerWidth - buttonWidth - safePadding);
    const maxTop = Math.max(topMin, window.innerHeight - buttonHeight - safePadding);

    const left = Math.floor(Math.random() * (maxLeft - safePadding + 1)) + safePadding;
    const top = Math.floor(Math.random() * (maxTop - topMin + 1)) + topMin;

    setNoPosition({ top, left });
    setNoFloating(true);
  }

  function addHeartBurst(amount = 1) {
    for (let i = 0; i < amount; i += 1) {
      const burst: HeartBurst = {
        id: Date.now() + Math.floor(Math.random() * 1000) + i,
        left: 8 + Math.random() * 84,
        icon: Math.random() > 0.5 ? "❤️" : "💖",
      };

      setBursts((prev) => [...prev, burst]);
      const timer = window.setTimeout(() => {
        setBursts((prev) => prev.filter((item) => item.id !== burst.id));
        timersRef.current = timersRef.current.filter((value) => value !== timer);
      }, 900);
      timersRef.current.push(timer);
    }
  }

  function handleNoClick() {
    const next = Math.min(noCount + 1, NO_LIMIT);
    setNoCount(next);

    if (next < NO_LIMIT) {
      randomNoPosition();
      return;
    }

    setNoFloating(false);
  }

  function handleYesClick() {
    setYesAccepted(true);
    setNoFloating(false);
    setRomanticBranch(resolveRomanticBranch(noCount));
    addHeartBurst(7);
    const timer = window.setTimeout(() => {
      setStep("romantic");
      setYesAccepted(false);
    }, 460);
    timersRef.current.push(timer);
  }

  function moveRomanticLine() {
    setRomanticLineIndex((prev) => (prev + 1) % romanticLines.length);
  }

  function moveToJourney() {
    setStep("journey");
    setJourneyDirection("next");
    setJourneyStage("surprise");
    setUnlockCards(pickUnlockCards(unlockCandidates));
    setRevealedUnlockIds([]);
    setFocusedUnlockId(null);
  }

  function previousPhoto() {
    setPhotoIndex((prev) => (prev - 1 + photos.length) % photos.length);
  }

  function nextPhoto() {
    setPhotoIndex((prev) => (prev + 1) % photos.length);
  }

  function spinSurprise() {
    setSurpriseIndex((prev) => {
      const random = Math.floor(Math.random() * SURPRISE_TOTAL);
      return random === prev ? (random + 1) % SURPRISE_TOTAL : random;
    });
  }

  function revealAnotherMessage() {
    setIsEnvelopeOpen(false);
    const timer = window.setTimeout(() => {
      spinSurprise();
    }, 300);
    timersRef.current.push(timer);
  }

  function revealUnlockCard(id: string) {
    if (revealedUnlockIds.includes(id)) return;
    if (revealedUnlockIds.length >= unlockRequiredCount) return;

    setRevealedUnlockIds((prev) => [...prev, id]);
    setFocusedUnlockId(id);
    addHeartBurst(2);
  }

  function goNextJourneyStage() {
    setJourneyDirection("next");
    setJourneyStage((prev) => {
      const currentIndex = journeyFlow.indexOf(prev);
      if (currentIndex < 0) return journeyFlow[0];
      return journeyFlow[Math.min(currentIndex + 1, journeyFlow.length - 1)];
    });
  }

  function goPreviousJourneyStage() {
    setJourneyDirection("prev");
    setJourneyStage((prev) => {
      const currentIndex = journeyFlow.indexOf(prev);
      if (currentIndex <= 0) return journeyFlow[0];
      return journeyFlow[currentIndex - 1];
    });
  }

  function resetGame() {
    setNoCount(0);
    setYesAccepted(false);
    setNoFloating(false);
    setBursts([]);
    setStep("challenge");
    setRomanticBranch("instant");
    setRomanticLineIndex(0);
    setJourneyDirection("next");
    setJourneyStage("surprise");
    setIsEnvelopeOpen(false);
    setPhotoIndex(0);
    setVideoIndex(0);
    setUnlockCards([]);
    setRevealedUnlockIds([]);
    setFocusedUnlockId(null);
    setSurpriseIndex(0);
    timersRef.current.forEach((timer) => window.clearTimeout(timer));
    timersRef.current = [];
  }

  return (
    <section className="relative mt-7 overflow-hidden rounded-2xl border border-[#9c4f46]/20 bg-white/60 p-3 sm:p-4">
      <div className="pointer-events-none absolute inset-0">
        {bursts.map((burst) => (
          <span
            key={burst.id}
            className="absolute bottom-2 text-xl opacity-80 animate-[floatUp_0.9s_ease-out_forwards]"
            style={{ left: `${burst.left}%` }}
          >
            {burst.icon}
          </span>
        ))}
      </div>
      <style>{`
        @keyframes floatUp{0%{transform:translateY(0) scale(0.9);opacity:.9;}100%{transform:translateY(-90px) scale(1.2);opacity:0;}}
        @keyframes stepEnter{0%{transform:translateY(18px) scale(.985);opacity:0;}100%{transform:translateY(0) scale(1);opacity:1;}}
        @keyframes romanticBloom{0%{transform:translateY(20px) scale(.97);opacity:0;filter:blur(1.5px);}100%{transform:translateY(0) scale(1);opacity:1;filter:blur(0);}}
        @keyframes stageSlideInNext{0%{transform:translateX(28px);opacity:0;}100%{transform:translateX(0);opacity:1;}}
        @keyframes stageSlideInPrev{0%{transform:translateX(-28px);opacity:0;}100%{transform:translateX(0);opacity:1;}}
        @keyframes warmPulse{0%,100%{box-shadow:0 0 0 0 rgba(156,79,70,0.16);}50%{box-shadow:0 0 0 10px rgba(156,79,70,0);}}
      `}</style>
      <div className="relative z-10">
        <p className="mb-2 text-[10px] uppercase tracking-[0.14em] text-[#6f332f]/75">{chapterTitle}</p>
        {step === "challenge" ? (
          <div className="animate-[stepEnter_420ms_cubic-bezier(0.16,1,0.3,1)]">
            <h3 className="font-display text-3xl sm:text-4xl">{t("showcase.game.chaseTitle")}</h3>
            <p className="mt-1 text-sm text-[#2b2220]/70">{t("showcase.game.chaseSubtitle")}</p>
            <article className="mt-3 rounded-xl border border-[#9c4f46]/20 bg-white/75 p-4">
              <p className="text-sm font-semibold text-[#2b2220]">{t("showcase.game.chasePrompt")}</p>
              <div className="mt-3 flex flex-wrap items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={handleYesClick}
                  className={`inline-flex items-center justify-center rounded-full bg-emerald-600 px-5 py-2 text-sm font-semibold text-white shadow transition-all duration-300 ${fullScreenYes ? "fixed inset-0 z-40 rounded-none text-2xl" : "animate-[warmPulse_2.2s_ease-in-out_infinite]"}`}
                  style={
                    fullScreenYes
                      ? undefined
                      : {
                          width: `${yesVisual.width}px`,
                          height: `${yesVisual.height}px`,
                          fontSize: `${yesVisual.fontSize}px`,
                          borderRadius: `${yesVisual.borderRadius}px`,
                        }
                  }
                >
                  {fullScreenYes ? t("showcase.game.fullYes") : t("showcase.game.yes")}
                </button>
                {!noHidden && !noFloating ? (
                  <button
                    type="button"
                    onClick={handleNoClick}
                    className="rounded-full border border-[#9c4f46]/30 bg-white px-5 py-2 text-sm font-semibold text-[#2b2220]"
                  >
                    {t("showcase.game.no")}
                  </button>
                ) : null}
              </div>
            </article>
          </div>
        ) : null}

        {step === "romantic" ? (
          <article className="animate-[romanticBloom_620ms_cubic-bezier(0.16,1,0.3,1)] rounded-2xl border border-[#9c4f46]/20 bg-[linear-gradient(145deg,rgba(255,255,255,0.92),rgba(244,208,196,0.6))] p-5 text-center">
            <p className="text-xs uppercase tracking-[0.14em] text-[#6f332f]">{romanticTag}</p>
            <h3 className="mt-2 font-display text-4xl leading-[0.95] sm:text-5xl">{t("showcase.game.romanticTitle")}</h3>
            <p className="mx-auto mt-4 max-w-xl text-sm leading-relaxed text-[#2b2220]/80">{romanticLines[romanticLineIndex]}</p>
            <div className="mt-5 flex flex-wrap items-center justify-center gap-2">
              <button
                type="button"
                onClick={moveRomanticLine}
                className="rounded-full border border-[#9c4f46]/30 bg-white px-4 py-2 text-sm font-semibold text-[#2b2220]"
              >
                {t("showcase.game.anotherLine")}
              </button>
              <button
                type="button"
                onClick={moveToJourney}
                className="rounded-full bg-[#9c4f46] px-6 py-2 text-sm font-semibold text-white shadow-sm"
              >
                {t("showcase.game.next")}
              </button>
            </div>
          </article>
        ) : null}

        {step === "journey" ? (
          <JourneyChapter
            t={t}
            stage={journeyStage}
            direction={journeyDirection}
            photos={photos}
            photoIndex={photoIndex}
            onPreviousPhoto={previousPhoto}
            onNextPhoto={nextPhoto}
            onSelectPhoto={(index) => setPhotoIndex(index)}
            videos={videos}
            videoIndex={videoIndex}
            onSelectVideo={(index) => setVideoIndex(index)}
            hasVideos={hasVideos}
            surpriseLine={surpriseLines[surpriseIndex]}
            isEnvelopeOpen={isEnvelopeOpen}
            onOpenAnotherMessage={revealAnotherMessage}
            voiceNoteUrl={config?.voice_note_url || ""}
            unlockCards={unlockCards}
            revealedUnlockIds={revealedUnlockIds}
            unlockRequiredCount={unlockRequiredCount}
            focusedUnlockCard={focusedUnlockCard}
            onRevealUnlockCard={revealUnlockCard}
            canGoNext={journeyStage === "unlock" ? canProceedUnlock : true}
            canGoPrevious={!isJourneyFirst}
            isLast={isJourneyLast}
            onNextStage={goNextJourneyStage}
            onPreviousStage={goPreviousJourneyStage}
            onFinish={() => navigate(showcasePath)}
          />
        ) : null}

        {step !== "challenge" ? (
          <div className="mt-3 flex justify-end">
            <button
              type="button"
              onClick={resetGame}
              className="rounded-full border border-[#9c4f46]/30 bg-white px-3 py-1.5 text-xs font-semibold text-[#2b2220]"
            >
              {t("showcase.game.reset")}
            </button>
          </div>
        ) : null}
      </div>

      {step === "challenge" && !noHidden && noFloating ? (
        <button
          type="button"
          onClick={handleNoClick}
          className="fixed z-50 rounded-full border border-[#9c4f46]/30 bg-white px-5 py-2 text-sm font-semibold text-[#2b2220] shadow-lg"
          style={{ top: `${noPosition.top}px`, left: `${noPosition.left}px` }}
        >
          {t("showcase.game.no")}
        </button>
      ) : null}
    </section>
  );
}

function pickUnlockCards(cards: UnlockMemoryCard[]): UnlockMemoryCard[] {
  if (cards.length <= 1) return cards;
  const next = [...cards];

  for (let index = next.length - 1; index > 0; index -= 1) {
    const randomIndex = Math.floor(Math.random() * (index + 1));
    [next[index], next[randomIndex]] = [next[randomIndex], next[index]];
  }

  return next.slice(0, 6);
}
