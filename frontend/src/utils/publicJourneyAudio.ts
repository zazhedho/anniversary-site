type AudioStateListener = (isPlaying: boolean) => void;

let journeyAudio: HTMLAudioElement | null = null;
let activeSource = "";
const listeners = new Set<AudioStateListener>();
let isSuppressed = false;

function isYoutubeUrl(url: string): boolean {
  return /(?:youtu\.be\/|youtube\.com\/)/i.test(url);
}

function isDirectAudioUrl(url: string): boolean {
  const audioPattern = /\.(mp3|m4a|aac|ogg|wav|flac|webm|mp4)$/i;

  try {
    const parsed = new URL(url);
    return audioPattern.test(parsed.pathname);
  } catch {
    return audioPattern.test(url.split("?")[0] || "");
  }
}

function normalizeSource(url?: string): string {
  return (url || "").trim();
}

function emitState() {
  const isPlaying = journeyAudio ? !journeyAudio.paused : false;
  listeners.forEach((listener) => listener(isPlaying));
}

function bindAudioEvents(audio: HTMLAudioElement) {
  audio.addEventListener("play", emitState);
  audio.addEventListener("pause", emitState);
  audio.addEventListener("ended", emitState);
}

function applyJourneyAudioDefaults(audio: HTMLAudioElement) {
  audio.loop = true;
}

export function canUseJourneyAudio(url?: string): boolean {
  const source = normalizeSource(url);
  if (!source) return false;
  if (isYoutubeUrl(source)) return false;
  return isDirectAudioUrl(source);
}

export function getOrCreateJourneyAudio(url?: string): HTMLAudioElement | null {
  const source = normalizeSource(url);
  if (!canUseJourneyAudio(source)) return null;

  if (!journeyAudio) {
    journeyAudio = new Audio(source);
    applyJourneyAudioDefaults(journeyAudio);
    activeSource = source;
    bindAudioEvents(journeyAudio);
    return journeyAudio;
  }

  if (activeSource !== source) {
    const shouldResume = !journeyAudio.paused;
    journeyAudio.pause();
    journeyAudio.src = source;
    journeyAudio.currentTime = 0;
    applyJourneyAudioDefaults(journeyAudio);
    activeSource = source;
    if (shouldResume) {
      void journeyAudio.play().catch(() => undefined);
    }
  }

  return journeyAudio;
}

export async function startJourneyMusicFromGesture(url?: string): Promise<boolean> {
  if (isSuppressed) return false;
  const audio = getOrCreateJourneyAudio(url);
  if (!audio) return false;

  try {
    await audio.play();
    return true;
  } catch {
    emitState();
    return false;
  }
}

export async function playJourneyMusic(url?: string): Promise<boolean> {
  if (isSuppressed) return false;
  const audio = getOrCreateJourneyAudio(url);
  if (!audio) return false;

  try {
    await audio.play();
    return true;
  } catch {
    emitState();
    return false;
  }
}

export function pauseJourneyMusic() {
  if (!journeyAudio) return;
  journeyAudio.pause();
}

export function setJourneyMusicSuppressed(value: boolean) {
  isSuppressed = value;
  if (isSuppressed) {
    pauseJourneyMusic();
  }
}

export function stopJourneyMusic() {
  if (!journeyAudio) return;
  journeyAudio.pause();
  journeyAudio.currentTime = 0;
}

export function isJourneyMusicPlaying(): boolean {
  return journeyAudio ? !journeyAudio.paused : false;
}

export function subscribeJourneyAudioState(listener: AudioStateListener): () => void {
  listeners.add(listener);
  listener(isJourneyMusicPlaying());
  return () => {
    listeners.delete(listener);
  };
}
