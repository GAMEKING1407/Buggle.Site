const drumGrid = document.getElementById("drum-grid");
const drumPlay = document.getElementById("drum-play");
const drumStop = document.getElementById("drum-stop");
const drumClear = document.getElementById("drum-clear");
const drumBpm = document.getElementById("drum-bpm");

const instruments = [
    "Kick",
    "Snare",
    "Closed Hat",
    "Open Hat",
    "Clap"
];

const patterns = instruments.map(() => Array(16).fill(false));

let drumPlaying = false;
let drumCurrentStep = 0;
let drumTimer;

function createDrumGrid() {
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
            button.setAttribute(
                "aria-label",
                `${instrument}, step ${step + 1}`
            );

            button.addEventListener("click", () => {
                patterns[row][step] = !patterns[row][step];

                button.classList.toggle(
                    "active",
                    patterns[row][step]
                );
            });

            drumRow.append(button);
        }

        drumGrid.append(drumRow);
    });
}

function kick() {
    const oscillator = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    const now = audioCtx.currentTime;

    oscillator.type = "sine";

    oscillator.frequency.setValueAtTime(150, now);
    oscillator.frequency.exponentialRampToValueAtTime(0.01, now + 0.5);

    gain.gain.setValueAtTime(1, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.5);

    oscillator.connect(gain);
    gain.connect(audioCtx.destination);

    oscillator.start(now);
    oscillator.stop(now + 0.5);
}

function snare() {
    const now = audioCtx.currentTime;
    const bufferSize = audioCtx.sampleRate * 0.2;

    const buffer = audioCtx.createBuffer(
        1,
        bufferSize,
        audioCtx.sampleRate
    );

    const data = buffer.getChannelData(0);

    for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1;
    }

    const noise = audioCtx.createBufferSource();
    const filter = audioCtx.createBiquadFilter();
    const gain = audioCtx.createGain();

    noise.buffer = buffer;

    filter.type = "highpass";
    filter.frequency.value = 1000;

    gain.gain.setValueAtTime(0.7, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.2);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(audioCtx.destination);

    noise.start(now);
    noise.stop(now + 0.2);
}

function hat(open = false) {
    const now = audioCtx.currentTime;
    const bufferSize = audioCtx.sampleRate * 0.15;

    const buffer = audioCtx.createBuffer(
        1,
        bufferSize,
        audioCtx.sampleRate
    );

    const data = buffer.getChannelData(0);

    for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1;
    }

    const noise = audioCtx.createBufferSource();
    const filter = audioCtx.createBiquadFilter();
    const gain = audioCtx.createGain();

    noise.buffer = buffer;

    filter.type = "highpass";
    filter.frequency.value = 7000;

    const duration = open ? 0.15 : 0.045;

    gain.gain.setValueAtTime(0.35, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + duration);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(audioCtx.destination);

    noise.start(now);
    noise.stop(now + duration);
}

function clap() {
    const now = audioCtx.currentTime;

    for (let i = 0; i < 3; i++) {
        const bufferSize = audioCtx.sampleRate * 0.04;

        const buffer = audioCtx.createBuffer(
            1,
            bufferSize,
            audioCtx.sampleRate
        );

        const data = buffer.getChannelData(0);

        for (let j = 0; j < bufferSize; j++) {
            data[j] = Math.random() * 2 - 1;
        }

        const noise = audioCtx.createBufferSource();
        const gain = audioCtx.createGain();

        noise.buffer = buffer;
        gain.gain.value = 0.5;

        noise.connect(gain);
        gain.connect(audioCtx.destination);

        noise.start(now + i * 0.035);
    }
}

const drumSounds = [
    kick,
    snare,
    () => hat(false),
    () => hat(true),
    clap
];

function playDrumStep() {
    drumGrid.querySelectorAll(".step").forEach(button => {
        button.classList.remove("playing");
    });

    instruments.forEach((instrument, row) => {
        const button = drumGrid.children[row].children[drumCurrentStep + 1];

        if (patterns[row][drumCurrentStep]) {
            drumSounds[row]();
        }

        button.classList.add("playing");
    });

    drumCurrentStep = (drumCurrentStep + 1) % 16;
}

function getDrumInterval() {
    return 60000 / Number(drumBpm.value) / 4;
}

function startDrums() {
    if (drumPlaying) return;

    if (!audioCtx) {
        audioCtx = new AudioContext();
    }

    if (audioCtx.state === "suspended") {
        audioCtx.resume();
    }

    drumPlaying = true;
    drumPlay.disabled = true;

    playDrumStep();

    drumTimer = setInterval(
        playDrumStep,
        getDrumInterval()
    );
}

function stopDrums() {
    drumPlaying = false;
    drumPlay.disabled = false;

    clearInterval(drumTimer);

    drumGrid.querySelectorAll(".step").forEach(button => {
        button.classList.remove("playing");
    });
}

drumPlay.addEventListener("click", startDrums);
drumStop.addEventListener("click", stopDrums);

drumClear.addEventListener("click", () => {
    patterns.forEach(pattern => pattern.fill(false));

    drumGrid.querySelectorAll(".step").forEach(button => {
        button.classList.remove("active");
    });
});

drumBpm.addEventListener("change", () => {
    drumBpm.value = Math.max(
        40,
        Math.min(240, Number(drumBpm.value) || 120)
    );

    if (drumPlaying) {
        clearInterval(drumTimer);

        drumTimer = setInterval(
            playDrumStep,
            getDrumInterval()
        );
    }
});

createDrumGrid();