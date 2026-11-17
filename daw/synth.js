let audioCtx;
let oscillator;
let voiceGain;

let masterInput;
let distortion;
let filter;
let delay;
let delayFeedback;
let delayWet;
let reverb;
let reverbWet;
let masterCompressor;

const pad = document.getElementById("keyboard");
const waveform = document.getElementById("waveform");
const frequencyDisplay = document.getElementById("frequency");
const volumeDisplay = document.getElementById("volume-display");

const filterSlider = document.getElementById("filter-cutoff");
const distortionSlider = document.getElementById("distortion-amount");
const delaySlider = document.getElementById("delay-mix");
const reverbSlider = document.getElementById("reverb-mix");

let playing = false;

const MIN_FREQ = 65.41;
const MAX_FREQ = 2093;

function makeDistortionCurve(amount = 0) {
  const k = typeof amount === "number" ? amount : 0;
  const nSamples = 44100;
  const curve = new Float32Array(nSamples);
  const deg = Math.PI / 180;

  for (let i = 0; i < nSamples; ++i) {
    const x = (i * 2) / nSamples - 1;
    curve[i] =
      k === 0 ? x : ((3 + k) * x * 20 * deg) / (Math.PI + k * Math.abs(x));
  }
  return curve;
}

function createReverbImpulse(ctx, duration = 2.0, decay = 2.5) {
  const rate = ctx.sampleRate;
  const length = rate * duration;
  const impulse = ctx.createBuffer(2, length, rate);

  for (let channel = 0; channel < 2; channel++) {
    const channelData = impulse.getChannelData(channel);
    for (let i = 0; i < length; i++) {
      channelData[i] =
        (Math.random() * 2 - 1) * Math.pow(1 - i / length, decay);
    }
  }
  return impulse;
}

function initAudio() {
  if (audioCtx) return;

  audioCtx = new (window.AudioContext || window.webkitAudioContext)();

  masterInput = audioCtx.createGain();

  distortion = audioCtx.createWaveShaper();
  distortion.curve = makeDistortionCurve(Number(distortionSlider?.value || 0));
  distortion.oversample = "4x";

  filter = audioCtx.createBiquadFilter();
  filter.type = "lowpass";
  filter.frequency.value = Number(filterSlider?.value || 12000);
  filter.Q.value = 2.0;

  delay = audioCtx.createDelay(2.0);
  delay.delayTime.value = 0.3;

  delayFeedback = audioCtx.createGain();
  delayFeedback.gain.value = 0.4;

  delayWet = audioCtx.createGain();
  delayWet.gain.value = Number(delaySlider?.value || 0);

  reverb = audioCtx.createConvolver();
  reverb.buffer = createReverbImpulse(audioCtx, 2.2, 2.5);

  reverbWet = audioCtx.createGain();
  reverbWet.gain.value = Number(reverbSlider?.value || 0);

  masterCompressor = audioCtx.createDynamicsCompressor();

  masterInput.connect(distortion);
  distortion.connect(filter);

  filter.connect(masterCompressor);

  filter.connect(delay);
  delay.connect(delayFeedback);
  delayFeedback.connect(delay);
  delay.connect(delayWet);
  delayWet.connect(masterCompressor);

  filter.connect(reverb);
  reverb.connect(reverbWet);
  reverbWet.connect(masterCompressor);

  masterCompressor.connect(audioCtx.destination);
}

function startSound() {
  initAudio();
  audioCtx.resume();

  if (playing) return;

  oscillator = audioCtx.createOscillator();
  voiceGain = audioCtx.createGain();

  oscillator.type = waveform.value;
  voiceGain.gain.value = 0;

  oscillator.connect(voiceGain);
  voiceGain.connect(masterInput);

  oscillator.start();
  playing = true;
}

function stopSound() {
  if (!playing) return;

  const now = audioCtx.currentTime;

  voiceGain.gain.cancelScheduledValues(now);
  voiceGain.gain.setTargetAtTime(0, now, 0.03);

  oscillator.stop(now + 0.15);
  playing = false;
}

function updatePad(event) {
  const rect = pad.getBoundingClientRect();
  const x = Math.max(0, Math.min(1, (event.clientX - rect.left) / rect.width));
  const y = Math.max(0, Math.min(1, (event.clientY - rect.top) / rect.height));

  const frequency = MIN_FREQ * Math.pow(MAX_FREQ / MIN_FREQ, x);
  const volume = 1 - y;

  pad.style.setProperty("--mouse-x", `${x * 100}%`);
  pad.style.setProperty("--mouse-y", `${y * 100}%`);

  frequencyDisplay.textContent = `${frequency.toFixed(1)} Hz`;
  volumeDisplay.textContent = `Volume: ${Math.round(volume * 100)}%`;

  if (!playing) return;

  const now = audioCtx.currentTime;
  oscillator.frequency.setTargetAtTime(frequency, now, 0.015);
  voiceGain.gain.setTargetAtTime(volume * 0.3, now, 0.015);
}

pad.addEventListener("pointerdown", (event) => {
  pad.setPointerCapture(event.pointerId);
  startSound();
  updatePad(event);
  pad.classList.add("active");
});

pad.addEventListener("pointermove", (event) => {
  if (!playing) return;
  updatePad(event);
});

pad.addEventListener("pointerup", () => {
  stopSound();
  pad.classList.remove("active");
});

pad.addEventListener("pointercancel", () => {
  stopSound();
  pad.classList.remove("active");
});

waveform.addEventListener("change", () => {
  if (oscillator) {
    oscillator.type = waveform.value;
  }
});

filterSlider?.addEventListener("input", (e) => {
  if (!filter) return;
  filter.frequency.setTargetAtTime(
    Number(e.target.value),
    audioCtx.currentTime,
    0.02,
  );
});

distortionSlider?.addEventListener("input", (e) => {
  if (!distortion) return;
  distortion.curve = makeDistortionCurve(Number(e.target.value));
});

delaySlider?.addEventListener("input", (e) => {
  if (!delayWet) return;
  delayWet.gain.setTargetAtTime(
    Number(e.target.value),
    audioCtx.currentTime,
    0.02,
  );
});

reverbSlider?.addEventListener("input", (e) => {
  if (!reverbWet) return;
  reverbWet.gain.setTargetAtTime(
    Number(e.target.value),
    audioCtx.currentTime,
    0.02,
  );
});
