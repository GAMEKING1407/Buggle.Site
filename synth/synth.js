
let audioCtx;

let oscillator;
let gainNode;
let filter;

const pad = document.getElementById("keyboard");
const waveform = document.getElementById("waveform");

const frequencyDisplay = document.getElementById("frequency");
const volumeDisplay = document.getElementById("volume-display");

let playing = false;

const MIN_FREQ = 65.41;
const MAX_FREQ = 2093;

function startSound() {
    if (!audioCtx) {
        audioCtx = new (
            window.AudioContext ||
            window.webkitAudioContext
        )();
    }

    audioCtx.resume();

    if (playing) return;

    oscillator = audioCtx.createOscillator();
    gainNode = audioCtx.createGain();
    filter = audioCtx.createBiquadFilter();

    oscillator.type = waveform.value;

    filter.type = "lowpass";
    filter.frequency.value = 12000;

    gainNode.gain.value = 0;

    oscillator.connect(filter);
    filter.connect(gainNode);
    gainNode.connect(audioCtx.destination);

    oscillator.start();

    playing = true;
}

function stopSound() {
    if (!playing) return;

    const now = audioCtx.currentTime;

    gainNode.gain.cancelScheduledValues(now);
    gainNode.gain.setTargetAtTime(0, now, 0.03);

    oscillator.stop(now + 0.15);

    playing = false;
}

function updatePad(event) {
    const rect = pad.getBoundingClientRect();

    const x = Math.max(
        0,
        Math.min(1, (event.clientX - rect.left) / rect.width)
    );

    const y = Math.max(
        0,
        Math.min(1, (event.clientY - rect.top) / rect.height)
    );

    const frequency = MIN_FREQ *
        Math.pow(MAX_FREQ / MIN_FREQ, x);

    const volume = 1 - y;

    pad.style.setProperty("--mouse-x", `${x * 100}%`);
    pad.style.setProperty("--mouse-y", `${y * 100}%`);

    frequencyDisplay.textContent =
        `${frequency.toFixed(1)} Hz`;

    volumeDisplay.textContent =
        `Volume: ${Math.round(volume * 100)}%`;

    if (!playing) return;

    const now = audioCtx.currentTime;

    oscillator.frequency.setTargetAtTime(
        frequency,
        now,
        0.015
    );

    gainNode.gain.setTargetAtTime(
        volume * 0.3,
        now,
        0.015
    );
}

pad.addEventListener("pointerdown", event => {
    pad.setPointerCapture(event.pointerId);

    startSound();

    updatePad(event);
    pad.classList.add("active");
});

pad.addEventListener("pointermove", event => {
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
