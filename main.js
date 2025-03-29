Tone.start();
Tone.Transport.bpm.value = 120;

const instruments = {
    'A-ah': 'assets/a-ah.mp3',
    'Bap Bip': 'assets/bap_bip.mp3',
    'Búho Silbido': 'assets/buho_silbido.mp3',
    'Caballo': 'assets/caballo.mp3',
    'Cat Call': 'assets/cat_call.mp3',
    'Gl Click': 'assets/click_gl_bip.mp3',
    'Tl Click': 'assets/click_tl.mp3',
    'Cochino': 'assets/cochino.mp3',
    'Curious Awrr': 'assets/curious_awrr.mp3',
    'Descorche': 'assets/descorche.mp3',
    'Gota': 'assets/gota.mp3',
    'Jhwui': 'assets/jhwui.mp3',
    'Kinky Mmh': 'assets/kinky_mmh.mp3',
    'Perro Chiquito': 'assets/perro_chiquito.mp3',
    'Perro Normal': 'assets/perro_normal.mp3',
    'Puerta': 'assets/puerta.mp3',
    'Puño': 'assets/puno_barriga.mp3',
    'Refreshing Aah': 'assets/refreshing_aah.mp3',
    'Riffle Up': 'assets/riffle_up.mp3',
    'Riffle Down': 'assets/riffle_down.mp3',
    'Rising Whistle': 'assets/rise_whistle.mp3',
    'Sad Awrr': 'assets/sad_awrr.mp3',
    'Shhhu': 'assets/shhhu.mp3',
    'Ssss': 'assets/ssss.mp3',
    'Tongue Click': 'assets/tongue_click.mp3'
};

const channels = 6;
const steps = 12;
let currentStep = 0;
let isPlaying = false;

// Initialize Tone.js players with buffers
const players = {};
for (const [name, url] of Object.entries(instruments)) {
    players[name] = new Tone.Player({
        url: url,
        loop: false,
        autostart: false
    }).toDestination();
}

// Create sequencer grid
const grid = document.getElementById('sequencerGrid');
const sequence = Array(channels).fill().map(() => Array(steps).fill(false));
const channelInstruments = Array(channels).fill('kick');

// Create grid headers
const headerRow = document.createElement('div');
headerRow.className = 'grid-header';
headerRow.style.display = 'contents';
headerRow.innerHTML = `
    <div></div>
    ${Array(steps).fill().map((_, i) => `
        <div style="text-align: center">${i + 1}</div>
    `).join('')}
`;
grid.appendChild(headerRow);

// Create grid rows
for (let row = 0; row < channels; row++) {
    const channelControls = document.createElement('div');
    channelControls.className = 'channel-controls';
    channelControls.innerHTML = `
        <select class="instrument-select">
            <Option value="">Select sound</option>
            ${Object.keys(instruments).map(name => `
                <option value="${name}">${name}</option>
            `).join('')}
        </select>
        <button class="mute-btn"><img src='assets/soundOnButton.svg'></button>
    `;
    grid.appendChild(channelControls);

    for (let col = 0; col < steps; col++) {
        const beat = document.createElement('button');
        beat.className = 'beat';
        beat.dataset.row = row;
        beat.dataset.col = col;
        beat.onclick = () => toggleBeat(row, col, beat);
        grid.appendChild(beat);
    }
}

// Beat toggling
function toggleBeat(row, col, element) {
    sequence[row][col] = !sequence[row][col];
    element.classList.toggle('active');
}

const seq = new Tone.Sequence((time, step) => {
    // Remove previous playing column
    document.querySelectorAll('.beat.playing').forEach(el => el.classList.remove('playing'));

    // Add playing class to current column
    document.querySelectorAll(`[data-col="${step}"]`).forEach(el => el?.classList.add('playing'));

    // Play active sounds
    sequence.forEach((row, channelIndex) => {
        const isMuted = grid.querySelectorAll('.channel-controls')[channelIndex]
            .querySelector('.mute-btn img').classList.contains('muted');

        // If the beat is active and the channel is not muted
        if (row[step] && !isMuted) {
            const instrumentName = channelInstruments[channelIndex];
            const player = players[instrumentName];

            if (player.loaded) {
                player.start(time);
            } else {
                console.warn(`Player for ${instrumentName} is not loaded yet.`);
            }
        }
    });
}, Array.from({length: steps}, (_, i) => i), "8n");

// Transport controls
document.getElementById('playPause').onclick = async () => {
    await Tone.start();
    if (isPlaying) {
        Tone.Transport.stop();
        seq.stop();
        isPlaying = false;
        document.getElementById('playPause').innerHTML = '<img src="/assets/playButton.svg">';
        // Clear playing indicators
        document.querySelectorAll('.beat.playing').forEach(el => {
            el.classList.remove('playing');
        });
    } else {
        Tone.Transport.start();
        seq.start();
        isPlaying = true;
        document.getElementById('playPause').innerHTML = '<img src="/assets/pauseButton.svg">';
    }
};

// Clear button
document.getElementById('clear').onclick = () => {
    sequence.forEach((row, i) => {
        row.forEach((_, j) => {
            sequence[i][j] = false;
            grid.querySelector(`[data-row="${i}"][data-col="${j}"]`).classList.remove('active');
        });
    });
};

// BPM control
document.getElementById('bpm').onchange = (e) => {
    Tone.Transport.bpm.value = e.target.value;
};

// Master volume
document.getElementById('masterVolume').onchange = (e) => {
    Tone.Destination.volume.value = Tone.gainToDb(e.target.value / 100);
};

// Instrument select
document.querySelectorAll('.instrument-select').forEach((select, index) => {
    select.onchange = (e) => {
        channelInstruments[index] = e.target.value;
    };
});

// Mute buttons
document.querySelectorAll('.mute-btn').forEach(btn => {
    const img = btn.querySelector('img');

    btn.onclick = (e) => {
        e.target.classList.toggle('muted');
        
        if (e.target.classList.contains('muted')) {
            img.src = '/assets/muteButton.svg';
        } else {
            img.src = '/assets/soundOnButton.svg';
        }
    };
});