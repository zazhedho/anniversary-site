import { useEffect, useMemo, useRef, useState } from "react";
import { buildJourneyPhotos, buildJourneyVideos } from "../../data/romanceJourney";
import type { PublicSiteConfig } from "../../types/anniversary";
import SurpriseEnvelope from "./SurpriseEnvelope";

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
type JourneyStage = "surprise" | "photos" | "videos";
type JourneyDirection = "next" | "prev";

type InteractiveLoveGameProps = {
  t: TranslateFn;
  config?: PublicSiteConfig;
};

const NO_LIMIT = 10;
const ROMANTIC_LINE_TOTAL = 3;
const SURPRISE_TOTAL = 5;

export default function InteractiveLoveGame({ t, config }: InteractiveLoveGameProps) {
  const [noCount, setNoCount] = useState(0);
  const [yesAccepted, setYesAccepted] = useState(false);
  const [noFloating, setNoFloating] = useState(false);
  const [noPosition, setNoPosition] = useState<NoPosition>({ top: 0, left: 0 });
  const [step, setStep] = useState<GameStep>("challenge");
  const [romanticLineIndex, setRomanticLineIndex] = useState(0);
  const [journeyStage, setJourneyStage] = useState<JourneyStage>("surprise");
  const [journeyDirection, setJourneyDirection] = useState<JourneyDirection>("next");
  const [isEnvelopeOpen, setIsEnvelopeOpen] = useState(false);
  const [photoIndex, setPhotoIndex] = useState(0);
  const [videoIndex, setVideoIndex] = useState(0);
  const [surpriseIndex, setSurpriseIndex] = useState(0);
  const [bursts, setBursts] = useState<HeartBurst[]>([]);
  const [viewport, setViewport] = useState<{ width: number; height: number }>({ width: 1024, height: 768 });
  const timersRef = useRef<number[]>([]);
  const photos = useMemo(() => buildJourneyPhotos(config), [config]);
  const videos = useMemo(() => buildJourneyVideos(config), [config]);
  const hasVideos = videos.length > 0;
  const journeyFlow = useMemo<JourneyStage[]>(
    () => (hasVideos ? ["surprise", "photos", "videos"] : ["surprise", "photos"]),
    [hasVideos]
  );
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
  const romanticLines = useMemo(
    () => [
      t("showcase.game.romanticLine1", { name: loverName }),
      t("showcase.game.romanticLine2", { name: loverName }),
      t("showcase.game.romanticLine3", { name: loverName }),
    ],
    [loverName, t]
  );
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

  const noHidden = yesAccepted || noCount >= NO_LIMIT;
  const fullScreenYes = !yesAccepted && noCount >= NO_LIMIT;
  const yesVisual = useMemo(() => {
    if (fullScreenYes) {
      return { width: undefined, height: undefined, fontSize: undefined, borderRadius: undefined };
    }

    const width = Math.min(180 + noCount * 140, Math.max(240, viewport.width - 24));
    const height = Math.min(54 + noCount * 16, Math.max(68, Math.floor(viewport.height * 0.44)));
    const fontSize = Math.min(16 + noCount * 2.35, 40);
    const borderRadius = Math.max(26 - noCount * 2.2, 6);

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
    addHeartBurst(7);
    const timer = window.setTimeout(() => {
      setStep("romantic");
      setYesAccepted(false);
    }, 460);
    timersRef.current.push(timer);
  }

  function moveRomanticLine() {
    setRomanticLineIndex((prev) => (prev + 1) % ROMANTIC_LINE_TOTAL);
  }

  function moveToJourney() {
    setStep("journey");
    setJourneyDirection("next");
    setJourneyStage("surprise");
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

  function goNextJourneyStage() {
    setJourneyDirection("next");
    setJourneyStage((prev) => {
      if (prev === "surprise") return "photos";
      if (prev === "photos") return hasVideos ? "videos" : "photos";
      return "videos";
    });
  }

  function goPreviousJourneyStage() {
    setJourneyDirection("prev");
    setJourneyStage((prev) => {
      if (prev === "videos") return "photos";
      if (prev === "photos") return "surprise";
      return "surprise";
    });
  }

  function resetGame() {
    setNoCount(0);
    setYesAccepted(false);
    setNoFloating(false);
    setBursts([]);
    setStep("challenge");
    setRomanticLineIndex(0);
    setJourneyDirection("next");
    setJourneyStage("surprise");
    setIsEnvelopeOpen(false);
    setPhotoIndex(0);
    setVideoIndex(0);
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
        {step === "challenge" ? (
          <div className="animate-[stepEnter_420ms_cubic-bezier(0.16,1,0.3,1)]">
            <h3 className="font-display text-3xl sm:text-4xl">{t("showcase.game.chaseTitle")}</h3>
            <p className="mt-1 text-sm text-[#2b2220]/70">{t("showcase.game.chaseSubtitle")}</p>

            <article className="mt-3 rounded-xl border border-[#9c4f46]/20 bg-white/75 p-4">
              <p className="text-sm font-semibold text-[#2b2220]">{t("showcase.game.chasePrompt")}</p>

              <div className="mt-3 flex flex-wrap items-center gap-2">
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
            <p className="text-xs uppercase tracking-[0.14em] text-[#6f332f]">{t("showcase.game.romanticTag")}</p>
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
          <article className="animate-[stepEnter_420ms_cubic-bezier(0.16,1,0.3,1)] rounded-2xl border border-[#9c4f46]/20 bg-[linear-gradient(150deg,rgba(255,255,255,0.92),rgba(244,208,196,0.55))] p-4 sm:p-5">
            <h3 className="font-display text-3xl sm:text-4xl">{t("showcase.game.journeyTitle")}</h3>
            <p className="mt-1 text-sm text-[#2b2220]/75">{t("showcase.game.journeySubtitle")}</p>

            <p className="mt-3 inline-flex rounded-full border border-[#9c4f46]/30 bg-white/70 px-3 py-1 text-xs font-semibold text-[#6f332f]">
              {journeyIndex + 1}/{journeyFlow.length}
            </p>

            <div
              key={`${journeyStage}-${journeyDirection}`}
              className={`mt-4 ${journeyDirection === "next" ? "animate-[stageSlideInNext_420ms_cubic-bezier(0.16,1,0.3,1)]" : "animate-[stageSlideInPrev_420ms_cubic-bezier(0.16,1,0.3,1)]"}`}
            >
              {journeyStage === "photos" ? (
                <div>
                  <div className="overflow-hidden rounded-2xl border border-[#9c4f46]/20 bg-white">
                    <img src={photos[photoIndex].image_url} alt={photos[photoIndex].title} className="h-56 w-full object-cover sm:h-72 md:h-[24rem]" />
                  </div>

                  <div className="mt-3 flex items-center justify-between gap-2">
                    <button
                      type="button"
                      onClick={previousPhoto}
                      className="rounded-full border border-[#9c4f46]/30 bg-white px-4 py-1.5 text-sm font-semibold text-[#2b2220]"
                    >
                      {t("showcase.game.previous")}
                    </button>
                    <button
                      type="button"
                      onClick={nextPhoto}
                      className="rounded-full border border-[#9c4f46]/30 bg-white px-4 py-1.5 text-sm font-semibold text-[#2b2220]"
                    >
                      {t("showcase.game.next")}
                    </button>
                  </div>

                  <p className="mt-3 font-display text-3xl">{photos[photoIndex].title}</p>
                  <p className="text-sm text-[#2b2220]/75">{photos[photoIndex].caption || t("showcase.game.photoCaptionDefault")}</p>

                  <div className="mt-3 grid grid-cols-3 gap-2 sm:grid-cols-4">
                    {photos.map((photo, index) => (
                      <button
                        key={photo.id}
                        type="button"
                        onClick={() => setPhotoIndex(index)}
                        className={`overflow-hidden rounded-xl border ${photoIndex === index ? "border-[#9c4f46] ring-2 ring-[#9c4f46]/25" : "border-[#9c4f46]/20"}`}
                      >
                        <img src={photo.image_url} alt={photo.title} className="h-16 w-full object-cover sm:h-20" />
                      </button>
                    ))}
                  </div>
                </div>
              ) : null}

              {journeyStage === "videos" && hasVideos ? (
                <div className="grid gap-3 lg:grid-cols-[1.2fr_0.8fr]">
                  <div className="overflow-hidden rounded-2xl border border-[#9c4f46]/20 bg-black/90">
                    <video key={videos[videoIndex].id} src={videos[videoIndex].video_url} poster={videos[videoIndex].poster_url} controls playsInline className="h-56 w-full object-cover sm:h-72 md:h-[24rem]" />
                  </div>
                  <div className="space-y-2">
                    {videos.map((video, index) => (
                      <button
                        key={video.id}
                        type="button"
                        onClick={() => setVideoIndex(index)}
                        className={`w-full rounded-xl border p-3 text-left ${videoIndex === index ? "border-[#9c4f46] bg-white" : "border-[#9c4f46]/20 bg-white/70"}`}
                      >
                        <p className="font-semibold text-[#2b2220]">{video.title}</p>
                        <p className="text-xs text-[#2b2220]/70">{video.description || t("showcase.game.videoDescriptionDefault")}</p>
                      </button>
                    ))}
                  </div>
                </div>
              ) : null}

              {journeyStage === "surprise" ? (
                <SurpriseEnvelope
                  ctaLabel={t("showcase.game.openAnother")}
                  isOpen={isEnvelopeOpen}
                  note={surpriseLines[surpriseIndex]}
                  noteLabel={t("showcase.game.noteLabel")}
                  onNext={revealAnotherMessage}
                />
              ) : null}
            </div>

            <div className="mt-4 flex items-center justify-between gap-2">
              {!isJourneyFirst ? (
                <button
                  type="button"
                  onClick={goPreviousJourneyStage}
                  className="rounded-full border border-[#9c4f46]/30 bg-white px-4 py-2 text-sm font-semibold text-[#2b2220] sm:px-5"
                >
                  {t("showcase.game.previous")}
                </button>
              ) : (
                <span />
              )}

              {!isJourneyLast ? (
                <button
                  type="button"
                  onClick={goNextJourneyStage}
                  className="rounded-full bg-[#9c4f46] px-5 py-2 text-sm font-semibold text-white sm:px-6"
                >
                  {t("showcase.game.next")}
                </button>
              ) : null}
            </div>
          </article>
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
