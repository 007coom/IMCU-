
class SoundManager {
  ctx: AudioContext | null = null;
  masterGain: GainNode | null = null;
  ambienceNodes: AudioNode[] = [];
  isMuted: boolean = false;

  constructor() {
    // Singleton
  }

  init() {
    if (this.ctx && this.ctx.state === 'running') return;
    
    if (!this.ctx) {
        const AudioContextClass = (window.AudioContext || (window as any).webkitAudioContext);
        this.ctx = new AudioContextClass();
        
        // Master Chain
        this.masterGain = this.ctx.createGain();
        this.masterGain.gain.value = 0.6; // Increased volume for recording

        // Optional: Add a compressor to glue sounds together
        const compressor = this.ctx.createDynamicsCompressor();
        compressor.threshold.value = -24;
        compressor.knee.value = 30;
        compressor.ratio.value = 12;
        compressor.attack.value = 0.003;
        compressor.release.value = 0.25;

        // Optional: Lowpass filter to simulate muffled speaker
        const filter = this.ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.value = 12000; 

        this.masterGain.connect(compressor);
        compressor.connect(filter);
        filter.connect(this.ctx.destination);
    }

    this.resume();
    this.startAmbience();
    this.playBootSequence();
  }

  resume() {
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().then(() => {
        console.log("AudioContext resumed");
      });
    }
  }

  private createNoiseBuffer() {
    if (!this.ctx) return null;
    const bufferSize = this.ctx.sampleRate * 2; // 2 seconds
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }
    return buffer;
  }

  startAmbience() {
    if (!this.ctx || !this.masterGain) return;

    // Clear existing if restarting
    this.ambienceNodes.forEach(n => n.disconnect());
    this.ambienceNodes = [];

    const t = this.ctx.currentTime;

    // 1. Low Rumble (Brownian-ish noise via Filter)
    const noiseBuffer = this.createNoiseBuffer();
    if (!noiseBuffer) return;

    const noiseSource = this.ctx.createBufferSource();
    noiseSource.buffer = noiseBuffer;
    noiseSource.loop = true;

    const noiseFilter = this.ctx.createBiquadFilter();
    noiseFilter.type = 'lowpass';
    noiseFilter.frequency.value = 120; // Deep rumble

    const noiseGain = this.ctx.createGain();
    noiseGain.gain.value = 0.15;

    noiseSource.connect(noiseFilter);
    noiseFilter.connect(noiseGain);
    noiseGain.connect(this.masterGain);
    noiseSource.start(t);
    this.ambienceNodes.push(noiseSource);

    // 2. High Static/Hiss (Simulate tape/radio floor)
    const hissSource = this.ctx.createBufferSource();
    hissSource.buffer = noiseBuffer;
    hissSource.loop = true;

    const hissFilter = this.ctx.createBiquadFilter();
    hissFilter.type = 'highpass';
    hissFilter.frequency.value = 8000;

    const hissGain = this.ctx.createGain();
    hissGain.gain.value = 0.02;

    hissSource.connect(hissFilter);
    hissFilter.connect(hissGain);
    hissGain.connect(this.masterGain);
    hissSource.start(t);
    this.ambienceNodes.push(hissSource);

    // 3. Mains Hum (60Hz)
    const osc = this.ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.value = 60;
    
    const oscGain = this.ctx.createGain();
    oscGain.gain.value = 0.05;

    osc.connect(oscGain);
    oscGain.connect(this.masterGain);
    osc.start(t);
    this.ambienceNodes.push(osc);
  }

  playBootSequence() {
    this.resume(); // Ensure context is running
    if (!this.ctx || !this.masterGain) return;
    const t = this.ctx.currentTime;

    // Rising Tone
    const osc = this.ctx.createOscillator();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(100, t);
    osc.frequency.exponentialRampToValueAtTime(2000, t + 0.8);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.3, t);
    gain.gain.exponentialRampToValueAtTime(0.01, t + 0.8);

    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start(t);
    osc.stop(t + 0.8);
  }

  playKeystroke() {
    this.resume();
    if (!this.ctx || !this.masterGain) return;
    const t = this.ctx.currentTime;

    // Short click (Noise burst)
    const noiseBuffer = this.createNoiseBuffer();
    if (!noiseBuffer) return;

    const source = this.ctx.createBufferSource();
    source.buffer = noiseBuffer;
    
    // Varies pitch slightly for realism
    source.playbackRate.value = 0.8 + Math.random() * 0.4;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = 2000;

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.1, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.05);

    source.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);
    
    source.start(t);
    source.stop(t + 0.05);
  }

  playLoginFail() {
    this.resume();
    if (!this.ctx || !this.masterGain) return;
    const t = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(150, t);
    osc.frequency.linearRampToValueAtTime(100, t + 0.3);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.3, t);
    gain.gain.exponentialRampToValueAtTime(0.01, t + 0.3);

    osc.connect(gain);
    gain.connect(this.masterGain);
    
    osc.start(t);
    osc.stop(t + 0.3);
  }

  playLoginSuccess() {
    this.resume();
    if (!this.ctx || !this.masterGain) return;
    const t = this.ctx.currentTime;

    // Arpeggio
    [440, 554, 659].forEach((freq, i) => {
      const osc = this.ctx.createOscillator();
      osc.type = 'square';
      osc.frequency.value = freq;
      
      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(0.1, t + i * 0.1);
      gain.gain.exponentialRampToValueAtTime(0.01, t + i * 0.1 + 0.4);

      osc.connect(gain);
      gain.connect(this.masterGain);
      
      osc.start(t + i * 0.1);
      osc.stop(t + i * 0.1 + 0.4);
    });
  }

  playEnter() {
    this.resume();
    if (!this.ctx || !this.masterGain) return;
    const t = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(600, t);
    
    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.1, t);
    gain.gain.exponentialRampToValueAtTime(0.01, t + 0.1);

    osc.connect(gain);
    gain.connect(this.masterGain);

    osc.start(t);
    osc.stop(t + 0.1);
  }
}

export const soundManager = new SoundManager();
