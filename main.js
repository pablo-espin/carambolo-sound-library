Tone.start();
Tone.Transport.bpm.value = 120;

// Load sounds
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
        document.getElementById('playPause').innerHTML = '<img src="assets/playButton.svg">';
        // Clear playing indicators
        document.querySelectorAll('.beat.playing').forEach(el => {
            el.classList.remove('playing');
        });
    } else {
        Tone.Transport.start();
        seq.start();
        isPlaying = true;
        document.getElementById('playPause').innerHTML = '<img src="assets/pauseButton.svg">';
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
            img.src = 'assets/muteButton.svg';
        } else {
            img.src = 'assets/soundOnButton.svg';
        }
    };
});

// Record the sequencer output
let recorder = null;
let recordingChunks = [];
let audioBlob = null;

// Function to start recording
function startRecording() {
  // Create a destination for recording
  const dest = Tone.Destination.context.createMediaStreamDestination();
  
  // Connect Tone.js output to the recording destination
  Tone.Destination.connect(dest);
  
  // Create a new media recorder
  recorder = new MediaRecorder(dest.stream);
  
  // Clear previous recording data
  recordingChunks = [];
  
  // Event handler for data available
  recorder.ondataavailable = evt => {
    recordingChunks.push(evt.data);
  };
  
  // Event handler for recording stop
  recorder.onstop = () => {
    // Create a blob from the recording chunks
    audioBlob = new Blob(recordingChunks, { type: 'audio/mp3' });
    
    // Enable the save button (it might be disabled during recording)
    document.getElementById('save').disabled = false;
  };
  
  // Start recording
  recorder.start();
}

// Function to stop recording
function stopRecording() {
  if (recorder && recorder.state !== 'inactive') {
    recorder.stop();
  }
}

// Function to save and download the recording
function saveRecording() {
  if (!audioBlob) {
    alert('No recording available. Play your sequence first!');
    return;
  }
  
  // Create a download link
  const url = URL.createObjectURL(audioBlob);
  const a = document.createElement('a');
  a.style.display = 'none';
  a.href = url;
  a.download = 'carambolo-sequence.mp3';
  
  // Add to document, trigger click, then remove
  document.body.appendChild(a);
  a.click();
  
  // Clean up
  setTimeout(() => {
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  }, 100);
}

// Function to share to social media
function shareToSocial() {
  // Check if the Web Share API is supported
  if (!navigator.share) {
    alert('Web Share API is not supported in your browser. Try a modern mobile browser.');
    return;
  }
  
  if (!audioBlob) {
    alert('No recording available. Play your sequence first!');
    return;
  }
  
  // Create a temporary file from the blob
  const file = new File([audioBlob], 'carambolo-sequence.mp3', { 
    type: 'audio/mp3' 
  });
  
  // Use the Web Share API
  navigator.share({
    title: 'My Carambolo Sequence',
    text: 'Check out this beat I made with Carambolo Sound Library!',
    files: [file]
  })
  .then(() => console.log('Shared successfully'))
  .catch((error) => console.error('Error sharing:', error));
}

// Modify your existing play button handler to start recording when playing
// Update your existing playPause function with this version
document.getElementById('playPause').onclick = async () => {
  await Tone.start();
  if (isPlaying) {
    Tone.Transport.stop();
    seq.stop();
    isPlaying = false;
    document.getElementById('playPause').innerHTML = '<img src="assets/playButton.svg">';
    // Clear playing indicators
    document.querySelectorAll('.beat.playing').forEach(el => {
      el.classList.remove('playing');
    });
    
    // Stop recording when stopping playback
    stopRecording();
  } else {
    // Start recording when starting playback
    startRecording();
    
    Tone.Transport.start();
    seq.start();
    isPlaying = true;
    document.getElementById('playPause').innerHTML = '<img src="assets/pauseButton.svg">';
  }
};

// Add event listeners for save and share buttons
document.getElementById('save').onclick = saveRecording;
document.getElementById('share').onclick = shareToSocial;

// Add a function for a fallback sharing method for browsers that don't support Web Share API
function fallbackShare() {
  if (!audioBlob) {
    alert('No recording available. Play your sequence first!');
    return;
  }
  
  // Create a modal dialog
  const modal = document.createElement('div');
  modal.style.position = 'fixed';
  modal.style.top = '0';
  modal.style.left = '0';
  modal.style.width = '100%';
  modal.style.height = '100%';
  modal.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
  modal.style.display = 'flex';
  modal.style.justifyContent = 'center';
  modal.style.alignItems = 'center';
  modal.style.zIndex = '1000';
  
  const modalContent = document.createElement('div');
  modalContent.style.backgroundColor = '#282828';
  modalContent.style.padding = '20px';
  modalContent.style.borderRadius = '8px';
  modalContent.style.maxWidth = '90%';
  modalContent.style.width = '400px';
  modalContent.style.color = '#FFFFFF';
  
  modalContent.innerHTML = `
    <h3>Share Your Beat</h3>
    <p>Download your beat and share it manually:</p>
    <button id="downloadForShare" style="background: #1E88E5; color: white; padding: 8px 16px; margin: 10px 0;">Download MP3</button>
    <p>Or copy this link to share:</p>
    <div style="display: flex; margin: 10px 0;">
      <input id="shareLink" type="text" readonly style="flex-grow: 1; padding: 8px; background: #161616; color: #45E3FF; border: 1px solid #8F8F8F;" value="Temporary link will be generated when you click below">
      <button id="copyLink" style="background: #1E88E5; color: white; padding: 8px;">Copy</button>
    </div>
    <button id="closeModal" style="background: #686868; color: white; padding: 8px 16px; margin-top: 10px;">Close</button>
  `;
  
  modal.appendChild(modalContent);
  document.body.appendChild(modal);
  
  // Download handler
  document.getElementById('downloadForShare').onclick = saveRecording;
  
  // Copy link handler (this is just a placeholder since we're not creating an actual shareable link)
  document.getElementById('copyLink').onclick = () => {
    alert('In a production environment, this would generate a shareable link to your sequence.');
    const linkInput = document.getElementById('shareLink');
    linkInput.value = 'https://carambolo-sound-library.example.com/share/' + Date.now();
    linkInput.select();
    document.execCommand('copy');
  };
  
  // Close modal handler
  document.getElementById('closeModal').onclick = () => {
    document.body.removeChild(modal);
  };
}

// Enhanced share function with fallback
function enhancedShare() {
  if (navigator.share) {
    shareToSocial();
  } else {
    fallbackShare();
  }
}

// Replace the previous share button event with the enhanced version
document.getElementById('share').onclick = enhancedShare;

// Export sequence data to JSON (useful for saving configuration)
function exportSequence() {
  const sequenceData = {
    bpm: Tone.Transport.bpm.value,
    steps: steps,
    channels: channels,
    sequence: sequence,
    instruments: channelInstruments
  };
  
  const dataStr = JSON.stringify(sequenceData);
  const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);
  
  const exportName = 'carambolo-sequence-config.json';
  
  const linkElement = document.createElement('a');
  linkElement.setAttribute('href', dataUri);
  linkElement.setAttribute('download', exportName);
  linkElement.click();
}

// Function to import a sequence from JSON
function importSequence(jsonData) {
  try {
    const data = JSON.parse(jsonData);
    
    // Set BPM
    Tone.Transport.bpm.value = data.bpm;
    document.getElementById('bpm').value = data.bpm;
    
    // Clear current sequence
    document.getElementById('clear').click();
    
    // Set instruments
    document.querySelectorAll('.instrument-select').forEach((select, index) => {
      if (index < data.channels && data.instruments[index]) {
        select.value = data.instruments[index];
        channelInstruments[index] = data.instruments[index];
      }
    });
    
    // Set sequence
    data.sequence.forEach((row, rowIndex) => {
      if (rowIndex < channels) {
        row.forEach((isActive, colIndex) => {
          if (colIndex < steps && isActive) {
            sequence[rowIndex][colIndex] = true;
            const beat = grid.querySelector(`[data-row="${rowIndex}"][data-col="${colIndex}"]`);
            if (beat) {
              beat.classList.add('active');
            }
          }
        });
      }
    });
    
    console.log('Sequence imported successfully');
  } catch (error) {
    console.error('Error importing sequence:', error);
    alert('There was an error importing the sequence.');
  }
}

// Add file import functionality
function setupFileImport() {
  const fileInput = document.createElement('input');
  fileInput.type = 'file';
  fileInput.accept = '.json';
  fileInput.style.display = 'none';
  document.body.appendChild(fileInput);
  
  fileInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        importSequence(event.target.result);
      };
      reader.readAsText(file);
    }
  });
  
  return fileInput;
}

const fileInput = setupFileImport();

// You could add another button for importing configurations
// For example:
// document.getElementById('import').onclick = () => fileInput.click();

// Demo patterns
const demoPatterns = {
  demo1: {
    bpm: 120,
    instruments: ['Tongue Click', 'Bap Bip', 'Cat Call', 'Jhwui', 'Puño', 'Sad Awrr'],
    patterns: [
      [0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0],
      [1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0],
      [0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 1, 0],
      [0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0],
      [1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 1],
      [0, 0, 0, 1, 0, 0, 0, 0, 0, 1, 0, 0]
    ]
  },
  demo2: {
    bpm: 128,
    instruments: ['Gl Click', 'Gota', 'Rising Whistle', 'Kinky Mmh', 'Búho Silbido', 'Perro Normal'],
    patterns: [
      [1, 0, 0, 1, 1, 0, 0, 1, 1, 0, 0, 1],
      [0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0],
      [0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0],
      [0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0],
      [0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 1, 0],
      [1, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0]
    ]
  }
};

// Add demo loading functionality
document.getElementById('demos').onchange = (e) => {
  const demoName = e.target.value;
  if (demoName && demoPatterns[demoName]) {
    // Clear current sequence
    document.getElementById('clear').click();
    
    const demo = demoPatterns[demoName];
    
    // Set BPM
    Tone.Transport.bpm.value = demo.bpm;
    document.getElementById('bpm').value = demo.bpm;
    
    // Set instruments and patterns
    demo.instruments.forEach((instrument, i) => {
      if (i < channels) {
        const select = document.querySelectorAll('.instrument-select')[i];
        select.value = instrument;
        channelInstruments[i] = instrument;
        
        // Set pattern
        demo.patterns[i].forEach((active, j) => {
          if (j < steps && active) {
            sequence[i][j] = true;
            const beat = grid.querySelector(`[data-row="${i}"][data-col="${j}"]`);
            if (beat) {
              beat.classList.add('active');
            }
          }
        });
      }
    });
    
    // Reset select
    e.target.value = '';
  }
};