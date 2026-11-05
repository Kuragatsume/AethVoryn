"use client";

// Procedural Sci-Fi UI Sound Effects, Local Music Folder Player & Ambient Radio Engine

export type RadioStation = {
  id: string;
  name: string;
  genre: string;
  url: string; // "local://folder" for local music folder, "synth://drone" for built-in synth, or stream URL
};

export type LocalTrackItem = {
  id: string;
  title: string;
  artist: string;
  fileName: string;
  relPath: string;
  size: number;
};

export const DEFAULT_LOCAL_MUSIC_PATH = "C:\\Users\\dakos\\Downloads\\MediaHuman\\Music";

export const RADIO_STATIONS: RadioStation[] = [
  {
    id: "local-music",
    name: "Моя папка: MediaHuman Music",
    genre: "C:\\Users\\dakos\\Downloads\\MediaHuman\\Music",
    url: "local://folder",
  },
  {
    id: "nightwave-plaza",
    name: "Nightwave Plaza",
    genre: "Vaporwave / Future Funk 24/7",
    url: "https://radio.plaza.one/mp3",
  },
  {
    id: "somafm-defcon",
    name: "SomaFM: DEF CON Radio",
    genre: "Hacker / Industrial / Electronic",
    url: "https://ice1.somafm.com/defcon-128-mp3",
  },
  {
    id: "somafm-spacestation",
    name: "SomaFM: Space Station",
    genre: "Deep Space Ambient",
    url: "https://ice1.somafm.com/spacestation-128-mp3",
  },
  {
    id: "neural-drone",
    name: "AETHVORYN Neural Synth",
    genre: "Procedural Dark Ambient (Offline)",
    url: "synth://drone",
  },
];

type Listener = () => void;

class SoundEngine {
  private ctx: AudioContext | null = null;
  private sfxEnabled: boolean = false;

  // Radio, Local Music & Synth state
  private audioEl: HTMLAudioElement | null = null;
  private droneNodes: {
    osc1: OscillatorNode;
    osc2: OscillatorNode;
    lfo: OscillatorNode;
    gain: GainNode;
    arpTimer: number;
  } | null = null;

  private isPlayingRadio: boolean = false;
  private currentStationId: string = "local-music";
  private volume: number = 0.45;

  // Local folder music state
  private musicFolderPath: string = DEFAULT_LOCAL_MUSIC_PATH;
  private localTracks: LocalTrackItem[] = [];
  private localTracksLoaded: boolean = false;
  private currentTrackIndex: number = 0;
  private shuffle: boolean = false;
  private currentTime: number = 0;
  private duration: number = 0;

  private listeners: Set<Listener> = new Set();

  public subscribe(fn: Listener): () => void {
    this.listeners.add(fn);
    return () => {
      this.listeners.delete(fn);
    };
  }

  private notify() {
    this.listeners.forEach((fn) => {
      try {
        fn();
      } catch {
        /* ignore */
      }
    });
  }

  private getContext(): AudioContext | null {
    if (typeof window === "undefined") return null;
    if (!this.ctx) {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext })
          .webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === "suspended") {
      this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  public setSfxEnabled(enabled: boolean) {
    this.sfxEnabled = enabled;
    this.notify();
  }

  public isSfxEnabled(): boolean {
    return this.sfxEnabled;
  }

  // Subtle tactical micro-click
  public playClick() {
    if (!this.sfxEnabled) return;
    const ctx = this.getContext();
    if (!ctx) return;
    try {
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "triangle";
      osc.frequency.setValueAtTime(1400, now);
      osc.frequency.exponentialRampToValueAtTime(420, now + 0.025);

      gain.gain.setValueAtTime(0.055, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.025);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.028);
    } catch {
      /* ignore audio errors */
    }
  }

  // Soft futuristic window open / maximize pulse
  public playWindowOpen() {
    if (!this.sfxEnabled) return;
    const ctx = this.getContext();
    if (!ctx) return;
    try {
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(240, now);
      osc.frequency.exponentialRampToValueAtTime(640, now + 0.085);

      gain.gain.setValueAtTime(0.045, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.095);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.1);
    } catch {
      /* ignore */
    }
  }

  // Soft descending window close / minimize pulse
  public playWindowClose() {
    if (!this.sfxEnabled) return;
    const ctx = this.getContext();
    if (!ctx) return;
    try {
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(520, now);
      osc.frequency.exponentialRampToValueAtTime(180, now + 0.075);

      gain.gain.setValueAtTime(0.04, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.085);
    } catch {
      /* ignore */
    }
  }

  // Magnetic snap sound
  public playSnap() {
    if (!this.sfxEnabled) return;
    const ctx = this.getContext();
    if (!ctx) return;
    try {
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(580, now);
      osc.frequency.setValueAtTime(880, now + 0.03);

      gain.gain.setValueAtTime(0.045, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.07);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.075);
    } catch {
      /* ignore */
    }
  }

  // Terminal / Command Palette key tick
  public playKey() {
    if (!this.sfxEnabled) return;
    const ctx = this.getContext();
    if (!ctx) return;
    try {
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "square";
      osc.frequency.setValueAtTime(950 + Math.random() * 180, now);
      osc.frequency.exponentialRampToValueAtTime(300, now + 0.012);

      gain.gain.setValueAtTime(0.018, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.012);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.014);
    } catch {
      /* ignore */
    }
  }

  // Harmonic chime for Pomodoro completion / notifications
  public playSuccess() {
    if (!this.sfxEnabled) return;
    const ctx = this.getContext();
    if (!ctx) return;
    try {
      const now = ctx.currentTime;
      const notes = [523.25, 659.25, 783.99, 1046.5];
      notes.forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "sine";
        osc.frequency.setValueAtTime(freq, now + i * 0.08);
        gain.gain.setValueAtTime(0.055, now + i * 0.08);
        gain.gain.exponentialRampToValueAtTime(0.0008, now + i * 0.08 + 0.35);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now + i * 0.08);
        osc.stop(now + i * 0.08 + 0.36);
      });
    } catch {
      /* ignore */
    }
  }

  // --- LOCAL FOLDER MUSIC SCANNER & LOADER ---
  public async loadLocalTracks(customDir?: string): Promise<LocalTrackItem[]> {
    if (typeof window === "undefined") return [];
    if (customDir !== undefined && customDir.trim()) {
      this.musicFolderPath = customDir.trim();
      try {
        localStorage.setItem("aethvoryn_music_dir", this.musicFolderPath);
      } catch {
        /* ignore */
      }
    } else if (!this.localTracksLoaded) {
      try {
        const saved = localStorage.getItem("aethvoryn_music_dir");
        if (saved && saved.trim()) {
          this.musicFolderPath = saved.trim();
        }
      } catch {
        /* ignore */
      }
    }

    try {
      const res = await fetch(
        `/api/music?dir=${encodeURIComponent(this.musicFolderPath)}`,
        { cache: "no-store" }
      );
      if (!res.ok) return this.localTracks;
      const data = await res.json();
      if (Array.isArray(data?.tracks)) {
        this.localTracks = data.tracks;
        this.localTracksLoaded = true;
        if (this.currentTrackIndex >= this.localTracks.length) {
          this.currentTrackIndex = 0;
        }
        this.notify();
      }
    } catch {
      /* ignore */
    }
    return this.localTracks;
  }

  public getMusicFolderPath(): string {
    return this.musicFolderPath;
  }

  public getLocalTracks(): LocalTrackItem[] {
    return this.localTracks;
  }

  public getCurrentTrack(): LocalTrackItem | null {
    return this.localTracks[this.currentTrackIndex] || null;
  }

  public getCurrentTrackIndex(): number {
    return this.currentTrackIndex;
  }

  // --- RADIO & LOCAL FOLDER PLAYER ---
  public async startRadio(stationId?: string, trackIndex?: number) {
    if (stationId) {
      this.currentStationId = stationId;
    }
    if (typeof trackIndex === "number") {
      this.currentTrackIndex = trackIndex;
    }

    this.stopRadio(false);
    this.isPlayingRadio = true;

    const station =
      RADIO_STATIONS.find((s) => s.id === this.currentStationId) ||
      RADIO_STATIONS[0];

    if (station.url === "local://folder") {
      if (!this.localTracksLoaded || this.localTracks.length === 0) {
        await this.loadLocalTracks();
      }
      const track = this.localTracks[this.currentTrackIndex] || this.localTracks[0];
      if (!track) {
        this.startProceduralDrone();
        this.notify();
        return;
      }
      if (typeof window !== "undefined") {
        const streamUrl = `/api/music?dir=${encodeURIComponent(
          this.musicFolderPath
        )}&file=${encodeURIComponent(track.relPath)}`;
        const audio = new Audio(streamUrl);
        audio.volume = this.volume;
        audio.ontimeupdate = () => {
          this.currentTime = audio.currentTime || 0;
          this.duration = Number.isFinite(audio.duration) ? audio.duration : 0;
        };
        audio.onloadedmetadata = () => {
          this.duration = Number.isFinite(audio.duration) ? audio.duration : 0;
          this.notify();
        };
        audio.onended = () => {
          this.nextTrack();
        };
        audio.onerror = () => {
          // Skip broken track automatically if more tracks exist
          if (this.localTracks.length > 1) {
            this.nextTrack();
          }
        };
        this.audioEl = audio;
        audio.play().catch(() => {
          this.isPlayingRadio = false;
          this.notify();
        });
      }
    } else if (station.url === "synth://drone") {
      this.startProceduralDrone();
    } else {
      if (typeof window !== "undefined") {
        const audio = new Audio(station.url);
        audio.crossOrigin = "anonymous";
        audio.volume = this.volume;
        audio.play().catch(() => {
          this.startProceduralDrone();
        });
        this.audioEl = audio;
      }
    }

    this.notify();
  }

  public playLocalTrack(index: number) {
    if (index < 0 || index >= this.localTracks.length) return;
    this.currentStationId = "local-music";
    this.currentTrackIndex = index;
    this.startRadio("local-music", index);
  }

  public nextTrack() {
    if (this.localTracks.length === 0) return;
    if (this.shuffle && this.localTracks.length > 1) {
      let next = Math.floor(Math.random() * this.localTracks.length);
      if (next === this.currentTrackIndex) {
        next = (next + 1) % this.localTracks.length;
      }
      this.currentTrackIndex = next;
    } else {
      this.currentTrackIndex =
        (this.currentTrackIndex + 1) % this.localTracks.length;
    }
    if (this.currentStationId === "local-music") {
      this.startRadio("local-music", this.currentTrackIndex);
    } else {
      this.notify();
    }
  }

  public prevTrack() {
    if (this.localTracks.length === 0) return;
    if (this.audioEl && this.audioEl.currentTime > 3) {
      this.audioEl.currentTime = 0;
      this.notify();
      return;
    }
    this.currentTrackIndex =
      (this.currentTrackIndex - 1 + this.localTracks.length) %
      this.localTracks.length;
    if (this.currentStationId === "local-music") {
      this.startRadio("local-music", this.currentTrackIndex);
    } else {
      this.notify();
    }
  }

  public toggleShuffle(): boolean {
    this.shuffle = !this.shuffle;
    this.notify();
    return this.shuffle;
  }

  public seekTo(seconds: number) {
    if (this.audioEl && Number.isFinite(seconds)) {
      this.audioEl.currentTime = Math.max(0, seconds);
      this.currentTime = this.audioEl.currentTime;
      this.notify();
    }
  }

  private startProceduralDrone() {
    const ctx = this.getContext();
    if (!ctx) return;
    try {
      const now = ctx.currentTime;
      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const lfo = ctx.createOscillator();
      const lfoGain = ctx.createGain();
      const filter = ctx.createBiquadFilter();
      const masterGain = ctx.createGain();

      osc1.type = "sawtooth";
      osc1.frequency.setValueAtTime(73.42, now);

      osc2.type = "triangle";
      osc2.frequency.setValueAtTime(110.0, now);
      osc2.detune.setValueAtTime(6, now);

      filter.type = "lowpass";
      filter.frequency.setValueAtTime(240, now);
      filter.Q.setValueAtTime(4, now);

      lfo.type = "sine";
      lfo.frequency.setValueAtTime(0.14, now);
      lfoGain.gain.setValueAtTime(110, now);

      lfo.connect(lfoGain);
      lfoGain.connect(filter.frequency);

      masterGain.gain.setValueAtTime(0.001, now);
      masterGain.gain.linearRampToValueAtTime(this.volume * 0.22, now + 1.2);

      osc1.connect(filter);
      osc2.connect(filter);
      filter.connect(masterGain);
      masterGain.connect(ctx.destination);

      osc1.start(now);
      osc2.start(now);
      lfo.start(now);

      const scale = [293.66, 329.63, 349.23, 440.0, 523.25, 587.33];
      const arpTimer = window.setInterval(() => {
        if (!this.isPlayingRadio || !this.ctx) return;
        try {
          const t = this.ctx.currentTime;
          const noteOsc = this.ctx.createOscillator();
          const noteGain = this.ctx.createGain();
          noteOsc.type = "sine";
          const freq = scale[Math.floor(Math.random() * scale.length)];
          noteOsc.frequency.setValueAtTime(freq, t);

          noteGain.gain.setValueAtTime(0.0001, t);
          noteGain.gain.linearRampToValueAtTime(this.volume * 0.06, t + 0.4);
          noteGain.gain.exponentialRampToValueAtTime(0.0001, t + 2.4);

          noteOsc.connect(noteGain);
          noteGain.connect(this.ctx.destination);
          noteOsc.start(t);
          noteOsc.stop(t + 2.5);
        } catch {
          /* ignore */
        }
      }, 2600);

      this.droneNodes = { osc1, osc2, lfo, gain: masterGain, arpTimer };
    } catch {
      /* ignore */
    }
  }

  public stopRadio(shouldNotify = true) {
    this.isPlayingRadio = false;
    if (this.audioEl) {
      try {
        this.audioEl.onended = null;
        this.audioEl.onerror = null;
        this.audioEl.ontimeupdate = null;
        this.audioEl.pause();
        this.audioEl.src = "";
      } catch {
        /* ignore */
      }
      this.audioEl = null;
    }
    if (this.droneNodes) {
      try {
        window.clearInterval(this.droneNodes.arpTimer);
        this.droneNodes.osc1.stop();
        this.droneNodes.osc2.stop();
        this.droneNodes.lfo.stop();
        this.droneNodes.gain.disconnect();
      } catch {
        /* ignore */
      }
      this.droneNodes = null;
    }
    if (shouldNotify) {
      this.notify();
    }
  }

  public toggleRadio(stationId?: string): boolean {
    if (
      this.isPlayingRadio &&
      (!stationId || stationId === this.currentStationId)
    ) {
      this.stopRadio();
      return false;
    } else {
      this.startRadio(stationId || this.currentStationId);
      return true;
    }
  }

  public setVolume(vol: number) {
    this.volume = Math.max(0, Math.min(1, vol));
    if (this.audioEl) {
      this.audioEl.volume = this.volume;
    }
    if (this.droneNodes && this.ctx) {
      this.droneNodes.gain.gain.setTargetAtTime(
        this.volume * 0.22,
        this.ctx.currentTime,
        0.1
      );
    }
    this.notify();
  }

  public getRadioState() {
    return {
      isPlaying: this.isPlayingRadio,
      stationId: this.currentStationId,
      volume: this.volume,
      tracks: this.localTracks,
      currentTrackIndex: this.currentTrackIndex,
      currentTrack: this.localTracks[this.currentTrackIndex] || null,
      shuffle: this.shuffle,
      currentTime: this.currentTime,
      duration: this.duration,
      folderPath: this.musicFolderPath,
    };
  }
}

export const soundEngine = new SoundEngine();
