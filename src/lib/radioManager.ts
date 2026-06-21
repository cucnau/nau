import { db } from './firebase';
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore';

// Web Audio synthesizer for Lofi & Ambient sounds
export class AmbientSynthesizer {
  public ctx: AudioContext | null = null;
  public muted: boolean = false;

  // Nodes for ambient sounds
  private rainNode: AudioNode | null = null;
  private rainGain: GainNode | null = null;
  
  private fireNode: AudioNode | null = null;
  private fireGain: GainNode | null = null;
  private firePopGain: GainNode | null = null;
  
  private wavesNode: AudioNode | null = null;
  private wavesGain: GainNode | null = null;
  private wavesFilter: BiquadFilterNode | null = null;
  
  private windNode: AudioNode | null = null;
  private windGain: GainNode | null = null;
  private windFilter: BiquadFilterNode | null = null;

  // LoFi Melodic generator parameters
  public isMelodyPlaying: boolean = false;
  private melodyTimer: any = null;
  private chordIndex: number = 0;
  private synthGain: GainNode | null = null;

  // Chords progression for relaxing feel (Cmaj7, Am7, Fmaj7, G7 or similar)
  private chords = [
    [261.63, 329.63, 392.00, 493.88], // Cmaj7
    [220.00, 261.63, 329.63, 392.00], // Am7
    [174.61, 220.00, 261.63, 329.63], // Fmaj7
    [196.00, 246.94, 293.66, 349.23], // G7
    [164.81, 196.00, 246.94, 293.66]  // Em7
  ];

  constructor() {}

  public init() {
    if (this.ctx) return;
    try {
      this.ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      
      // Create master synth gain
      this.synthGain = this.ctx.createGain();
      this.synthGain.gain.setValueAtTime(0.08, this.ctx.currentTime);
      this.synthGain.connect(this.ctx.destination);

      // Initialize individual ambient synthesizers
      this.setupRainSynth();
      this.setupFireSynth();
      this.setupWavesSynth();
      this.setupWindSynth();
    } catch (e) {
      console.error("Failed to init AudioContext:", e);
    }
  }

  // White noise helper for generators
  private createNoiseBuffer() {
    if (!this.ctx) return null;
    const bufferSize = this.ctx.sampleRate * 2; // 2 seconds of noise
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }
    return buffer;
  }

  // Pink noise approximation helper
  private createPinkNoiseBuffer() {
    if (!this.ctx) return null;
    const bufferSize = this.ctx.sampleRate * 2;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      b0 = 0.99886 * b0 + white * 0.0555179;
      b1 = 0.99332 * b1 + white * 0.0750759;
      b2 = 0.96900 * b2 + white * 0.1538520;
      b3 = 0.86650 * b3 + white * 0.3104856;
      b4 = 0.55000 * b4 + white * 0.5329522;
      b5 = -0.7616 * b5 - white * 0.0168980;
      data[i] = b0 + b1 + b2 + b3 + b4 + b5 + b6 * 0.5362;
      data[i] *= 0.11; // normalise
      b6 = white * 0.115926;
    }
    return buffer;
  }

  // 1. Synthesize Rain (lowpassed pink noise)
  private setupRainSynth() {
    if (!this.ctx) return;
    const buffer = this.createPinkNoiseBuffer();
    if (!buffer) return;

    const source = this.ctx.createBufferSource();
    source.buffer = buffer;
    source.loop = true;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(800, this.ctx.currentTime);

    this.rainGain = this.ctx.createGain();
    this.rainGain.gain.setValueAtTime(0, this.ctx.currentTime); // start silent

    source.connect(filter);
    filter.connect(this.rainGain);
    this.rainGain.connect(this.ctx.destination);
    
    source.start();
    this.rainNode = source;
  }

  // 2. Synthesize Fire (brownized noise + crackle pops)
  private setupFireSynth() {
    if (!this.ctx) return;
    const buffer = this.createNoiseBuffer();
    if (!buffer) return;

    // Background low rumble
    const source = this.ctx.createBufferSource();
    source.buffer = buffer;
    source.loop = true;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(150, this.ctx.currentTime);
    filter.Q.setValueAtTime(1.0, this.ctx.currentTime);

    this.fireGain = this.ctx.createGain();
    this.fireGain.gain.setValueAtTime(0, this.ctx.currentTime);

    source.connect(filter);
    filter.connect(this.fireGain);
    this.fireGain.connect(this.ctx.destination);
    source.start();
    this.fireNode = source;

    // Fire crackle pops scheduler
    this.firePopGain = this.ctx.createGain();
    this.firePopGain.gain.setValueAtTime(0, this.ctx.currentTime); // controlled by overall fire sound
    this.firePopGain.connect(this.ctx.destination);

    // Schedule random little crackles
    const schedulePops = () => {
      if (!this.ctx || this.muted || !this.isMelodyPlaying) return;
      
      const now = this.ctx.currentTime;
      // create click
      const clickOsc = this.ctx.createOscillator();
      const clickGain = this.ctx.createGain();
      
      clickOsc.type = 'sine';
      clickOsc.frequency.setValueAtTime(1600 + Math.random() * 1000, now);
      
      clickGain.gain.setValueAtTime(0.002 * (this.fireGain?.gain.value || 0), now);
      clickGain.gain.exponentialRampToValueAtTime(0.00001, now + 0.015);
      
      clickOsc.connect(clickGain);
      clickGain.connect(this.firePopGain!);
      
      clickOsc.start(now);
      clickOsc.stop(now + 0.02);

      const nextPopDelay = 100 + Math.random() * 800; // random pop milliseconds
      setTimeout(schedulePops, nextPopDelay);
    };

    setTimeout(schedulePops, 500);
  }

  // 3. Synthesize Ocean Waves (slow swelling Pink noise)
  private setupWavesSynth() {
    if (!this.ctx) return;
    const buffer = this.createPinkNoiseBuffer();
    if (!buffer) return;

    const source = this.ctx.createBufferSource();
    source.buffer = buffer;
    source.loop = true;

    this.wavesFilter = this.ctx.createBiquadFilter();
    this.wavesFilter.type = 'lowpass';
    this.wavesFilter.frequency.setValueAtTime(350, this.ctx.currentTime);

    this.wavesGain = this.ctx.createGain();
    this.wavesGain.gain.setValueAtTime(0, this.ctx.currentTime);

    source.connect(this.wavesFilter);
    this.wavesFilter.connect(this.wavesGain);
    this.wavesGain.connect(this.ctx.destination);
    source.start();
    this.wavesNode = source;

    // LFO modulator for Wave swells (periodially swell filter cut-off frequency)
    let waveCycle = 0;
    const modulateWaves = () => {
      if (!this.ctx) return;
      waveCycle += 0.05;
      const waveGainVal = this.wavesGain?.gain.value || 0;
      if (waveGainVal > 0 && this.wavesFilter) {
        // dynamic filter oscillation: swell up and down every 7-8 seconds
        const cutoff = 400 + Math.sin(waveCycle) * 200;
        this.wavesFilter.frequency.setValueAtTime(cutoff, this.ctx.currentTime);
      }
      setTimeout(modulateWaves, 150);
    };
    setTimeout(modulateWaves, 200);
  }

  // 4. Synthesize Forest Wind (whistling swept bandpassed white noise)
  private setupWindSynth() {
    if (!this.ctx) return;
    const buffer = this.createNoiseBuffer();
    if (!buffer) return;

    const source = this.ctx.createBufferSource();
    source.buffer = buffer;
    source.loop = true;

    this.windFilter = this.ctx.createBiquadFilter();
    this.windFilter.type = 'bandpass';
    this.windFilter.frequency.setValueAtTime(600, this.ctx.currentTime);
    this.windFilter.Q.setValueAtTime(3.5, this.ctx.currentTime);

    this.windGain = this.ctx.createGain();
    this.windGain.gain.setValueAtTime(0, this.ctx.currentTime);

    source.connect(this.windFilter);
    this.windFilter.connect(this.windGain);
    this.windGain.connect(this.ctx.destination);
    source.start();
    this.windNode = source;

    // slow modulation of wind whistler frequencies
    let windTime = 0;
    const modulateWind = () => {
      if (!this.ctx) return;
      windTime += 0.03;
      const windGainVal = this.windGain?.gain.value || 0;
      if (windGainVal > 0 && this.windFilter) {
        // dynamic whistle change
        const cutoff = 500 + Math.sin(windTime) * 120 + Math.cos(windTime * 0.7) * 50;
        this.windFilter.frequency.setValueAtTime(cutoff, this.ctx.currentTime);
      }
      setTimeout(modulateWind, 200);
    };
    setTimeout(modulateWind, 200);
  }

  // Ambient volumes setter
  public setVolume(type: 'rain' | 'fire' | 'waves' | 'wind', val: number) {
    this.init();
    if (!this.ctx) return;
    
    // map slider from 0-100 to gain scale 0.0 - 0.75
    const targetGain = (val / 100) * 0.8;
    
    // resume context if slept
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }

    if (type === 'rain' && this.rainGain) {
      this.rainGain.gain.linearRampToValueAtTime(targetGain * 0.4, this.ctx.currentTime + 0.1);
    } else if (type === 'fire' && this.fireGain && this.firePopGain) {
      this.fireGain.gain.linearRampToValueAtTime(targetGain * 0.35, this.ctx.currentTime + 0.1);
      this.firePopGain.gain.setValueAtTime(targetGain * 1.2, this.ctx.currentTime);
    } else if (type === 'waves' && this.wavesGain) {
      this.wavesGain.gain.linearRampToValueAtTime(targetGain * 0.35, this.ctx.currentTime + 0.1);
    } else if (type === 'wind' && this.windGain) {
      this.windGain.gain.linearRampToValueAtTime(targetGain * 0.15, this.ctx.currentTime + 0.1);
    }
  }

  // Melodic synthesizer player loop
  public startLofiMelody() {
    this.init();
    if (!this.ctx || this.isMelodyPlaying) return;

    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }

    this.isMelodyPlaying = true;
    this.chordIndex = 0;

    const playNextBar = () => {
      if (!this.isMelodyPlaying || !this.ctx || !this.synthGain) return;

      const now = this.ctx.currentTime;
      const chord = this.chords[this.chordIndex];
      
      // Play soft electric piano style cords
      chord.forEach((freq) => {
        if (!this.ctx || !this.synthGain) return;
        const osc = this.ctx.createOscillator();
        const nodeGain = this.ctx.createGain();
        
        osc.type = 'sine'; // sine gives vintage electric rhodes tone
        osc.frequency.setValueAtTime(freq, now);

        // Slow soft volume attack and decay
        nodeGain.gain.setValueAtTime(0, now);
        nodeGain.gain.linearRampToValueAtTime(0.12, now + 0.2); // attack
        nodeGain.gain.exponentialRampToValueAtTime(0.0001, now + 3.8); // decay over 4 seconds

        osc.connect(nodeGain);
        nodeGain.connect(this.synthGain);
        osc.start(now);
        osc.stop(now + 3.9);
      });

      // Schedule random soothing melody notes on top of the chord
      const melodyNotes = [0, 2, 4, 7, 9, 11, 12]; // major pentatonic index on base
      for (let j = 0; j < 4; j++) {
        const noteChance = Math.random();
        if (noteChance > 0.3) {
          const noteTime = now + j * 0.8 + 0.2 + (Math.random() * 0.2);
          const baseFreq = chord[0];
          const multiplier = Math.pow(2, melodyNotes[Math.floor(Math.random() * melodyNotes.length)] / 12);
          const melodyFreq = baseFreq * 2 * multiplier;

          const melOsc = this.ctx.createOscillator();
          const melGain = this.ctx.createGain();
          
          melOsc.type = 'triangle'; // triangle gives flute/bell soft timbre
          melOsc.frequency.setValueAtTime(melodyFreq, noteTime);

          melGain.gain.setValueAtTime(0, noteTime);
          melGain.gain.linearRampToValueAtTime(0.04, noteTime + 0.08); // micro attack
          melGain.gain.exponentialRampToValueAtTime(0.0001, noteTime + 0.8); // quick fade

          melOsc.connect(melGain);
          melGain.connect(this.synthGain);
          melOsc.start(noteTime);
          melOsc.stop(noteTime + 0.9);
        }
      }

      // Next chord increment
      this.chordIndex = (this.chordIndex + 1) % this.chords.length;

      // Repeat every 4 seconds
      this.melodyTimer = setTimeout(playNextBar, 3800);
    };

    playNextBar();
  }

  public stopLofiMelody() {
    this.isMelodyPlaying = false;
    if (this.melodyTimer) {
      clearTimeout(this.melodyTimer);
      this.melodyTimer = null;
    }
  }

  // Master mute
  public setMuteAll(mute: boolean) {
    this.muted = mute;
    if (!this.ctx) return;
    if (mute) {
      this.ctx.suspend();
    } else {
      this.ctx.resume();
    }
  }
}

export interface TrackDef {
  id: string;
  title: string;
  desc: string;
  isExternal?: boolean;
  streamUrl?: string;
  isSpotify?: boolean;
  spotifyEmbedUrl?: string;
  isLocalFile?: boolean;
}

export class RadioManagerClass {
  public isPlaying: boolean = false;
  public muted: boolean = false;
  public activeTrackId: string = '';
  public rainVol: number = 0;
  public fireVol: number = 0;
  public wavesVol: number = 0;
  public windVol: number = 0;
  public tempoCycle: number = 0;

  public playMode: 'loop_all' | 'loop_one' | 'shuffle' = 'loop_all';

  public defaultTracks: TrackDef[] = [];

  public adminTracks: TrackDef[] = [];
  public customTracks: TrackDef[] = [];
  public synth = new AmbientSynthesizer();
  private audioElement: HTMLAudioElement | null = null;
  private subscribers = new Set<() => void>();
  private tempoTimer: any = null;

  constructor() {
    this.loadCustomTracks();
    this.fetchAdminTracks();
  }

  private loadCustomTracks() {
    try {
      const stored = localStorage.getItem('choco_radio_custom_tracks');
      if (stored) {
        this.customTracks = JSON.parse(stored);
      }
    } catch (e) {
      console.warn("Failed to load custom tracks from localStorage:", e);
    }
  }

  public saveCustomTracks() {
    try {
      localStorage.setItem('choco_radio_custom_tracks', JSON.stringify(this.customTracks));
    } catch (e) {
      console.warn("Failed to save custom tracks to localStorage:", e);
    }
  }

  public addCustomTrack(track: TrackDef) {
    this.customTracks.push(track);
    this.saveCustomTracks();
    this.notify();
  }

  public removeCustomTrack(id: string) {
    if (this.activeTrackId === id) {
      this.pause();
    }
    this.customTracks = this.customTracks.filter(t => t.id !== id);
    this.saveCustomTracks();
    this.notify();
  }

  private fetchAdminTracks() {
    try {
      const q = query(collection(db, 'radioTracks'));
      onSnapshot(q, (snapshot) => {
        const list: TrackDef[] = [];
        snapshot.forEach((doc) => {
          const d = doc.data();
          const streamUrl = d.streamUrl || '';
          
          // Auto detect Spotify open links (track, playlist, album, artist)
          const spotifyMatch = streamUrl.match(/open\.spotify\.com\/(track|playlist|album|artist)\/([a-zA-Z0-9]+)/);
          const isSpotify = !!spotifyMatch;
          const spotifyEmbedUrl = spotifyMatch 
            ? `https://open.spotify.com/embed/${spotifyMatch[1]}/${spotifyMatch[2]}`
            : undefined;

          list.push({
            id: doc.id,
            title: d.title || 'Nhạc không tên',
            desc: d.desc || 'Mô tả trống',
            isExternal: true,
            streamUrl: streamUrl,
            isSpotify: isSpotify,
            spotifyEmbedUrl: spotifyEmbedUrl
          });
        });
        this.adminTracks = list;
        this.notify();
      });
    } catch (e) {
      console.warn("Failed to subscribe to firestore radioTracks:", e);
    }
  }

  public get tracks(): TrackDef[] {
    return [...this.defaultTracks, ...this.customTracks, ...this.adminTracks];
  }

  public subscribe(cb: () => void) {
    this.subscribers.add(cb);
    return () => {
      this.subscribers.delete(cb);
    };
  }

  public notify() {
    this.subscribers.forEach((cb) => cb());
  }

  public setVolume(type: 'rain' | 'fire' | 'waves' | 'wind', val: number) {
    if (type === 'rain') this.rainVol = val;
    if (type === 'fire') this.fireVol = val;
    if (type === 'waves') this.wavesVol = val;
    if (type === 'wind') this.windVol = val;
    this.synth.setVolume(type, val);
    this.notify();
  }

  public togglePlay() {
    this.synth.init();
    if (this.isPlaying) {
      this.pause();
    } else {
      this.play();
    }
  }

  public play() {
    this.isPlaying = true;
    this.synth.init();

    if (!this.activeTrackId && this.tracks.length > 0) {
      this.activeTrackId = this.tracks[0].id;
    }

    this.triggerTrackPlay(this.activeTrackId);
    
    // Start tempo cycle for sway animations
    if (this.tempoTimer) clearInterval(this.tempoTimer);
    this.tempoTimer = setInterval(() => {
      this.tempoCycle = (this.tempoCycle + 1) % 4;
      this.notify();
    }, 900);

    this.notify();
  }

  public pause() {
    this.isPlaying = false;
    this.synth.stopLofiMelody();
    if (this.audioElement) {
      this.audioElement.pause();
    }
    if (this.tempoTimer) {
      clearInterval(this.tempoTimer);
      this.tempoTimer = null;
    }
    this.tempoCycle = 0;
    this.notify();
  }

  public selectTrack(trackId: string) {
    this.activeTrackId = trackId;
    if (this.isPlaying) {
      this.triggerTrackPlay(trackId);
    } else {
      this.notify();
    }
  }

  public togglePlayMode() {
    if (this.playMode === 'loop_all') {
      this.playMode = 'loop_one';
    } else if (this.playMode === 'loop_one') {
      this.playMode = 'shuffle';
    } else {
      this.playMode = 'loop_all';
    }
    this.notify();
  }

  public handleTrackEnded() {
    if (!this.isPlaying) return;
    this.playNextTrack();
  }

  public playNextTrack() {
    const list = this.tracks;
    if (list.length === 0) return;

    if (this.playMode === 'loop_one') {
      this.triggerTrackPlay(this.activeTrackId);
      return;
    }

    if (this.playMode === 'shuffle') {
      const currentIndex = list.findIndex(t => t.id === this.activeTrackId);
      let nextIndex = currentIndex;
      if (list.length > 1) {
        while (nextIndex === currentIndex) {
          nextIndex = Math.floor(Math.random() * list.length);
        }
      } else {
        nextIndex = 0;
      }
      const nextTrack = list[nextIndex];
      this.activeTrackId = nextTrack.id;
      this.triggerTrackPlay(nextTrack.id);
      return;
    }

    // Default loop_all
    const currentIndex = list.findIndex(t => t.id === this.activeTrackId);
    if (currentIndex === -1) {
      const nextTrack = list[0];
      this.activeTrackId = nextTrack.id;
      this.triggerTrackPlay(nextTrack.id);
      return;
    }
    const nextIndex = (currentIndex + 1) % list.length;
    const nextTrack = list[nextIndex];
    this.activeTrackId = nextTrack.id;
    this.triggerTrackPlay(nextTrack.id);
  }

  public playPrevTrack() {
    const list = this.tracks;
    if (list.length === 0) return;

    const currentIndex = list.findIndex(t => t.id === this.activeTrackId);
    if (currentIndex === -1) {
      const prevTrack = list[0];
      this.activeTrackId = prevTrack.id;
      this.triggerTrackPlay(prevTrack.id);
      return;
    }
    const prevIndex = (currentIndex - 1 + list.length) % list.length;
    const prevTrack = list[prevIndex];
    this.activeTrackId = prevTrack.id;
    this.triggerTrackPlay(prevTrack.id);
  }

  private triggerTrackPlay(trackId: string) {
    this.synth.stopLofiMelody();
    if (this.audioElement) {
      this.audioElement.pause();
      this.audioElement = null;
    }

    const currentTrack = this.tracks.find(t => t.id === trackId);
    if (!currentTrack) {
      this.notify();
      return;
    }

    if (currentTrack.isExternal && currentTrack.streamUrl) {
      if (currentTrack.isSpotify) {
        // Spotify is managed in iframe so we do not stream via standard Audio element.
      } else {
        this.audioElement = new Audio(currentTrack.streamUrl);
        this.audioElement.volume = 0.28;
        this.audioElement.muted = this.muted;
        this.audioElement.addEventListener('ended', () => {
          this.handleTrackEnded();
        });
        this.audioElement.play().catch(err => {
          console.warn("Autoplay blocked or stream fail:", err);
        });
      }
    } else {
      // Procedural synthesizer
      this.synth.startLofiMelody();
    }
    this.notify();
  }

  public toggleMute() {
    this.muted = !this.muted;
    this.synth.setMuteAll(this.muted);
    if (this.audioElement) {
      this.audioElement.muted = this.muted;
    }
    this.notify();
  }
}

export const RadioManager = new RadioManagerClass();
