import { useMemo } from "react";
import type { JourneyPhoto, JourneyVideo } from "../../data/romanceJourney";
import MemoryUnlockStage, { type UnlockMemoryCard } from "./MemoryUnlockStage";
import SurpriseEnvelope from "./SurpriseEnvelope";
import VoiceNoteStage from "./VoiceNoteStage";

type TranslateFn = (key: string, vars?: Record<string, string | number>) => string;

export type JourneyStage = "surprise" | "voice" | "unlock" | "photos" | "videos";
export type JourneyDirection = "next" | "prev";

type JourneyChapterProps = {
  t: TranslateFn;
  stage: JourneyStage;
  direction: JourneyDirection;
  photos: JourneyPhoto[];
  photoIndex: number;
  onPreviousPhoto: () => void;
  onNextPhoto: () => void;
  onSelectPhoto: (index: number) => void;
  videos: JourneyVideo[];
  videoIndex: number;
  onSelectVideo: (index: number) => void;
  hasVideos: boolean;
  surpriseLine: string;
  isEnvelopeOpen: boolean;
  onOpenAnotherMessage: () => void;
  voiceNoteUrl?: string;
  unlockCards: UnlockMemoryCard[];
  revealedUnlockIds: string[];
  unlockRequiredCount: number;
  focusedUnlockCard?: UnlockMemoryCard;
  onRevealUnlockCard: (id: string) => void;
  canGoNext: boolean;
  canGoPrevious: boolean;
  isLast: boolean;
  onNextStage: () => void;
  onPreviousStage: () => void;
  onFinish: () => void;
};

export default function JourneyChapter({
  t,
  stage,
  direction,
  photos,
  photoIndex,
  onPreviousPhoto,
  onNextPhoto,
  onSelectPhoto,
  videos,
  videoIndex,
  onSelectVideo,
  hasVideos,
  surpriseLine,
  isEnvelopeOpen,
  onOpenAnotherMessage,
  voiceNoteUrl,
  unlockCards,
  revealedUnlockIds,
  unlockRequiredCount,
  focusedUnlockCard,
  onRevealUnlockCard,
  canGoNext,
  canGoPrevious,
  isLast,
  onNextStage,
  onPreviousStage,
  onFinish,
}: JourneyChapterProps) {
  const chapterTitle = useMemo(() => {
    if (stage === "surprise") return t("showcase.game.chapterSurprise");
    if (stage === "voice") return t("showcase.game.chapterVoice");
    if (stage === "unlock") return t("showcase.game.chapterUnlock");
    if (stage === "photos") return t("showcase.game.chapterPhotos");
    return t("showcase.game.chapterVideos");
  }, [stage, t]);
  const chapterSubtitle = useMemo(() => {
    if (stage === "surprise") return t("showcase.game.chapterSubtitleSurprise");
    if (stage === "voice") return t("showcase.game.chapterSubtitleVoice");
    if (stage === "unlock") return t("showcase.game.chapterSubtitleUnlock");
    if (stage === "photos") return t("showcase.game.chapterSubtitlePhotos");
    return t("showcase.game.chapterSubtitleVideos");
  }, [stage, t]);

  return (
    <article className="animate-[stepEnter_420ms_cubic-bezier(0.16,1,0.3,1)] rounded-2xl border border-[#9c4f46]/20 bg-[linear-gradient(150deg,rgba(255,255,255,0.92),rgba(244,208,196,0.55))] p-4 sm:p-5">
      <p className="text-[10px] uppercase tracking-[0.14em] text-[#6f332f]/80">{chapterTitle}</p>
      <h3 className="mt-1 font-display text-3xl sm:text-4xl">{t("showcase.game.journeyTitle")}</h3>
      <p className="mt-1 text-sm text-[#2b2220]/75">{chapterSubtitle}</p>

      <div
        key={`${stage}-${direction}`}
        className={`mt-4 ${direction === "next" ? "animate-[stageSlideInNext_420ms_cubic-bezier(0.16,1,0.3,1)]" : "animate-[stageSlideInPrev_420ms_cubic-bezier(0.16,1,0.3,1)]"}`}
      >
        {stage === "photos" ? (
          <div className="mx-auto w-full max-w-3xl">
            <div className="overflow-hidden rounded-2xl border border-[#9c4f46]/20 bg-white">
              <img
                src={photos[photoIndex].image_url}
                alt={photos[photoIndex].title}
                loading="lazy"
                decoding="async"
                className="h-56 w-full object-cover sm:h-72 md:h-[24rem]"
              />
            </div>

            <div className="mt-3 flex items-center justify-between gap-2">
              <button
                type="button"
                onClick={onPreviousPhoto}
                className="rounded-full border border-[#9c4f46]/30 bg-white px-4 py-1.5 text-sm font-semibold text-[#2b2220]"
              >
                {t("showcase.game.previous")}
              </button>
              <button
                type="button"
                onClick={onNextPhoto}
                className="rounded-full border border-[#9c4f46]/30 bg-white px-4 py-1.5 text-sm font-semibold text-[#2b2220]"
              >
                {t("showcase.game.next")}
              </button>
            </div>

            <p className="mt-3 text-center font-display text-3xl">{photos[photoIndex].title}</p>
            <p className="text-center text-sm text-[#2b2220]/75">{photos[photoIndex].caption || t("showcase.game.photoCaptionDefault")}</p>

            <div className="mt-3 flex justify-center">
              <div className="grid w-fit grid-cols-3 gap-2 sm:grid-cols-4">
                {photos.map((photo, index) => (
                  <button
                    key={photo.id}
                    type="button"
                    onClick={() => onSelectPhoto(index)}
                    className={`overflow-hidden rounded-xl border ${photoIndex === index ? "border-[#9c4f46] ring-2 ring-[#9c4f46]/25" : "border-[#9c4f46]/20"}`}
                  >
                    <img src={photo.image_url} alt={photo.title} loading="lazy" decoding="async" className="h-16 w-20 object-cover sm:h-20 sm:w-24" />
                  </button>
                ))}
              </div>
            </div>
          </div>
        ) : null}

        {stage === "videos" && hasVideos ? (
          <div className="grid gap-3 lg:grid-cols-[1.2fr_0.8fr]">
            <div className="overflow-hidden rounded-2xl border border-[#9c4f46]/20 bg-black/90">
              <video
                key={videos[videoIndex].id}
                src={videos[videoIndex].video_url}
                poster={videos[videoIndex].poster_url}
                controls
                playsInline
                preload="metadata"
                className="h-56 w-full object-cover sm:h-72 md:h-[24rem]"
              />
            </div>
            <div className="space-y-2">
              {videos.map((video, index) => (
                <button
                  key={video.id}
                  type="button"
                  onClick={() => onSelectVideo(index)}
                  className={`w-full rounded-xl border p-3 text-left ${videoIndex === index ? "border-[#9c4f46] bg-white" : "border-[#9c4f46]/20 bg-white/70"}`}
                >
                  <p className="font-semibold text-[#2b2220]">{video.title}</p>
                  <p className="text-xs text-[#2b2220]/70">{video.description || t("showcase.game.videoDescriptionDefault")}</p>
                </button>
              ))}
            </div>
          </div>
        ) : null}

        {stage === "surprise" ? (
          <SurpriseEnvelope
            ctaLabel={t("showcase.game.openAnother")}
            isOpen={isEnvelopeOpen}
            note={surpriseLine}
            noteLabel={t("showcase.game.noteLabel")}
            onNext={onOpenAnotherMessage}
          />
        ) : null}

        {stage === "voice" ? <VoiceNoteStage t={t} url={voiceNoteUrl} /> : null}

        {stage === "unlock" ? (
          <MemoryUnlockStage
            t={t}
            cards={unlockCards}
            revealedIds={revealedUnlockIds}
            requiredCount={unlockRequiredCount}
            focusedCard={focusedUnlockCard}
            onReveal={onRevealUnlockCard}
          />
        ) : null}
      </div>

      <div className="mt-4 flex items-center justify-between gap-2">
        {canGoPrevious ? (
          <button
            type="button"
            onClick={onPreviousStage}
            className="rounded-full border border-[#9c4f46]/30 bg-white px-4 py-2 text-sm font-semibold text-[#2b2220] sm:px-5"
          >
            {t("showcase.game.previous")}
          </button>
        ) : (
          <span />
        )}

        {isLast ? (
          <button
            type="button"
            onClick={onFinish}
            className="rounded-full bg-[#9c4f46] px-5 py-2 text-sm font-semibold text-white sm:px-6"
          >
            {t("showcase.game.finish")}
          </button>
        ) : (
          <button
            type="button"
            onClick={onNextStage}
            disabled={!canGoNext}
            className="rounded-full bg-[#9c4f46] px-5 py-2 text-sm font-semibold text-white sm:px-6 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {t("showcase.game.next")}
          </button>
        )}
      </div>
    </article>
  );
}
