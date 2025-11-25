class AudioEngine {
    constructor() {
        this.ctx = null;
        this.noteIndex = 0;
        this.nextNoteTime = 0;
        this.tempo = 110; 
        this.scale = [146.83, 174.61, 196.00, 220.00, 261.63, 293.66];
        this.bassScale = [73.42, 65.41, 55.00, 73.42];
        this.masterGain = null;
    }

    init() {
        if (!this.ctx) {
            const AudioContext = window.AudioContext || window.webkitAudioContext;
            this.ctx = new AudioContext();
            this.masterGain = this.ctx.createGain();
            this.masterGain.gain.value = 0.3;
            this.masterGain.connect(this.ctx.destination);
            
            this.delayNode = this.ctx.createDelay();
            this.delayNode.delayTime.value = 0.3;
            this.feedbackNode = this.ctx.createGain();
            this.feedbackNode.gain.value = 0.4;
            this.delayNode.connect(this.feedbackNode);
            this.feedbackNode.connect(this.delayNode);
            this.delayNode.connect(this.masterGain);

            this.scheduleMusic();
        }
        if(this.ctx.state === 'suspended') this.ctx.resume();
    }

    playSound(type) {
        if (!this.ctx) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        const now = this.ctx.currentTime;
        
        osc.connect(gain);
        gain.connect(this.masterGain);

        if (type === 'shoot') {
            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(800, now);
            osc.frequency.exponentialRampToValueAtTime(100, now + 0.15);
            gain.gain.setValueAtTime(0.3, now);
            gain.gain.exponentialRampToValueAtTime(0.01, now + 0.15);
            osc.start(now);
            osc.stop(now + 0.15);
        } else if (type === 'hit') {
            osc.type = 'square';
            osc.frequency.setValueAtTime(100, now);
            osc.frequency.linearRampToValueAtTime(10, now + 0.2);
            gain.gain.setValueAtTime(0.4, now);
            gain.gain.exponentialRampToValueAtTime(0.01, now + 0.2);
            osc.start(now);
            osc.stop(now + 0.2);
        } else if (type === 'damage') {
            osc.type = 'sine';
            osc.frequency.setValueAtTime(150, now);
            osc.frequency.linearRampToValueAtTime(50, now + 0.3);
            gain.gain.setValueAtTime(0.5, now);
            gain.gain.linearRampToValueAtTime(0.01, now + 0.3);
            osc.start(now);
            osc.stop(now + 0.3);
        }
    }

    scheduleMusic() {
        const secondsPerBeat = 60.0 / this.tempo;
        const lookahead = 0.1; 
        const interval = 25;

        setInterval(() => {
            if (!this.ctx) return;
            const now = this.ctx.currentTime;
            while (this.nextNoteTime < now + lookahead) {
                this.playNote(this.nextNoteTime, this.noteIndex);
                this.nextNoteTime += secondsPerBeat / 2;
                this.noteIndex++;
            }
        }, interval);
    }

    playNote(time, index) {
        if (index % 8 === 0) {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.connect(gain);
            gain.connect(this.masterGain);
            osc.type = 'triangle';
            const note = this.bassScale[(Math.floor(index / 16)) % this.bassScale.length];
            osc.frequency.value = note;
            gain.gain.setValueAtTime(0.4, time);
            gain.gain.exponentialRampToValueAtTime(0.01, time + 1.5);
            osc.start(time);
            osc.stop(time + 1.5);
        }

        if (Math.random() > 0.4) {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.connect(gain);
            gain.connect(this.delayNode);
            osc.type = 'sine';
            const note = this.scale[Math.floor(Math.random() * this.scale.length)] * (Math.random() > 0.8 ? 2 : 1);
            osc.frequency.setValueAtTime(note, time);
            gain.gain.setValueAtTime(0.1, time);
            gain.gain.exponentialRampToValueAtTime(0.001, time + 0.5);
            osc.start(time);
            osc.stop(time + 0.5);
        }
    }
}

export default new AudioEngine();