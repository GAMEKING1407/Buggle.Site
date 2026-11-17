const grid = document.getElementById("drum-grid");
const playButton = document.getElementById("play");
const stopButton = document.getElementById("stop");
const clearButton = document.getElementById("clear");
const bpmInput = document.getElementById("bpm");

const instruments = [
    "Kick",
    "Snare",
    "Closed Hat",
    "Open Hat",
    "Clap"
];

const patterns = instruments.map(() => Array(16).fill(false));

let audioContext;
let playing = false;
let currentStep = 0;
let timer;

function createGrid() {
    instruments.forEach((instrument, row) => {
        const drumRow = document.createElement("div");
        drumRow.className = "drum-row";

        const name = document.createElement("span");
        name.className = "drum-name";
        name.textContent = instrument;

        drumRow.append(name);

        for (let step = 0; step < 16; step++) {
            const button = document.createElement("button");
            button.className = "step";
            button.setAttribute("aria-label", `${instrument}, step ${step + 1}`);

            button.addEventListener("click", () => {
                patterns[row][step] = !patterns[row][step];
                button.classList.toggle("active", patterns[row][step]);
            });

            drumRow.append(button);
        }

        grid.append(drumRow);
    });
}

function kick() {
    const oscillator = audioContext.createOscillator();
    const gain = audioContext.createGain();

    oscillator.type = "sine";
    oscillator.frequency.setValueAtTime(150, audioContext.currentTime);
    oscillator.frequency.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);

    gain.gain.setValueAtTime(1, audioContext.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);

    oscillator.connect(gain);
    gain.connect(audioContext.destination);

    oscillator.start();
    oscillator.stop(audioContext.currentTime + 0.5);
}

function snare() {
    const bufferSize = audioContext.sampleRate * 0.2;
    const buffer = audioContext.createBuffer(1, bufferSize, audioContext.sampleRate);
    const data = buffer.getChannelData(0);

    for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1;
    }

    const noise = audioContext.createBufferSource();
    const filter = audioContext.createBiquadFilter();
    const gain = audioContext.createGain();

    noise.buffer = buffer;
    filter.type = "highpass";
    filter.frequency.value = 1000;

    gain.gain.setValueAtTime(0.7, audioContext.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.2);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(audioContext.destination);

    noise.start();
}

function hat(open = false) {
    const bufferSize = audioContext.sampleRate * 0.15;
    const buffer = audioContext.createBuffer(1, bufferSize, audioContext.sampleRate);
    const data = buffer.getChannelData(0);

    for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1;
    }

    const noise = audioContext.createBufferSource();
    const filter = audioContext.createBiquadFilter();
    const gain = audioContext.createGain();

    noise.buffer = buffer;
    filter.type = "highpass";
    filter.frequency.value = 7000;

    const duration = open ? 0.15 : 0.045;

    gain.gain.setValueAtTime(0.35, audioContext.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + duration);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(audioContext.destination);

    noise.start();
    noise.stop(audioContext.currentTime + duration);
}

function clap() {
    for (let i = 0; i < 3; i++) {
        const bufferSize = audioContext.sampleRate * 0.04;
        const buffer = audioContext.createBuffer(1, bufferSize, audioContext.sampleRate);
        const data = buffer.getChannelData(0);

        for (let j = 0; j < bufferSize; j++) {
            data[j] = Math.random() * 2 - 1;
        }

        const noise = audioContext.createBufferSource();
        const gain = audioContext.createGain();

        noise.buffer = buffer;
        gain.gain.value = 0.5;

        noise.connect(gain);
        gain.connect(audioContext.destination);

        noise.start(audioContext.currentTime + i * 0.035);
    }
}

const sounds = [
    kick,
    snare,
    () => hat(false),
    () => hat(true),
    clap
];

function playStep() {
    document.querySelectorAll(".step").forEach(button => {
        button.classList.remove("playing");
    });

    instruments.forEach((instrument, row) => {
        const button = grid.children[row].children[currentStep + 1];

        if (patterns[row][currentStep]) {
            sounds[row]();
        }

        button.classList.add("playing");
    });

    currentStep = (currentStep + 1) % 16;
}

function getInterval() {
    return 60000 / Number(bpmInput.value) / 4;
}

function start() {
    if (playing) return;

    audioContext ??= new AudioContext();

    if (audioContext.state === "suspended") {
        audioContext.resume();
    }

    playing = true;
    playButton.disabled = true;

    playStep();
    timer = setInterval(playStep, getInterval());
}

function stop() {
    playing = false;
    playButton.disabled = false;

    clearInterval(timer);

    document.querySelectorAll(".step").forEach(button => {
        button.classList.remove("playing");
    });
}

playButton.addEventListener("click", start);
stopButton.addEventListener("click", stop);

clearButton.addEventListener("click", () => {
    patterns.forEach(pattern => pattern.fill(false));

    document.querySelectorAll(".step").forEach(button => {
        button.classList.remove("active");
    });
});

bpmInput.addEventListener("change", () => {
    bpmInput.value = Math.max(40, Math.min(240, Number(bpmInput.value) || 120));

    if (playing) {
        clearInterval(timer);
        timer = setInterval(playStep, getInterval());
    }
});

createGrid();