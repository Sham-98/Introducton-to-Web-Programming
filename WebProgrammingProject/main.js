
document.addEventListener("DOMContentLoaded", function() {
    const samples = [
        {src: "audio/bass.mp3", name: "Bass"},
        {src: "audio/drum.mp3", name: "Drum"},
        {src: "audio/piano.mp3", name: "Piano"},
        {src: "audio/strange-beat.mp3", name: "Strange Beat"},
        {src: "audio/violin.mp3", name: "Violin"},
        {src: "audio/oud.mp3", name: "Oud"},
        {src: "audio/oud&ney.mp3", name: "Oud & Ney"}
    ];

    const tracks = [[], [], []];
    const audioElements = [[], [], []];
    const trackAudio = [null, null, null];
    const audioContext =new(window.AudioContext || window.webkitAudioContext)();
    let mediaRecorder = null;
    let recordedChunks = [];
    let recordingStream = null;


    const track_duration = 60;




    function SetupSegmentDelete(){
        document.querySelectorAll('.segment-delete').forEach(button => {
            button.addEventListener('click', (event) => {
                const segment = event.target.closest('.segment');
                if (segment) {
                    const trackContent = segment.closest('.track-content');
                    if (trackContent) {
                        const trackIndex = Array.from(document.querySelectorAll('.track-content')).indexOf(trackContent);

                        // Remove segment from the UI
                        segment.remove();

                        // Remove corresponding audio element from the track
                        const segmentIndex = Array.from(trackContent.children).indexOf(segment);
                        if (segmentIndex >= 0 && audioElements[trackIndex]) {
                            audioElements[trackIndex].splice(segmentIndex, 1);
                            tracks[trackIndex].splice(segmentIndex, 1);
                        }
                    }
                }
            });
        });
    }

    
    // Setup drag-and-drop for instrument buttons
    document.querySelectorAll('.instrument').forEach((button) => {
        button.addEventListener("dragstart", (event) => {
            event.dataTransfer.setData("text", event.target.dataset.id);
        });

        // Add touch event listeners
        button.addEventListener("touchstart", (event) => {
            event.preventDefault();
    const touch = event.changedTouches[0];
    const sampleId = event.target.dataset.id;
    document.elementFromPoint(touch.clientX, touch.clientY).addEventListener("touchend", (endEvent) => {
        const target = document.elementFromPoint(endEvent.changedTouches[0].clientX, endEvent.changedTouches[0].clientY).closest('.track-content');
        if (target) drop({target, dataTransfer: {getData: () => sampleId}});
    }, { once: true });
});
});


    function allowDrop(event) {
        event.preventDefault();
    }

    function drop(event) {
        event.preventDefault();
        const sampleId = event.dataTransfer.getData("text");
        const sample = samples[parseInt(sampleId)];
        const target = event.target.closest('.track-content');

        if (target && sample) {
            let newItem = document.createElement("div");
            newItem.className = "segment";
            newItem.innerText = sample.name;

            //newItem.style.backgroundColor = "#ed82fb";
            //target.appendChild(newItem);

            // Create volume slider for the segment
            let volumeSlider = document.createElement("input");
            volumeSlider.type = "range";
            volumeSlider.min = "0";
            volumeSlider.max = "100";
            volumeSlider.value = "100";
            volumeSlider.className = "segment-volume-slider";

            newItem.appendChild(volumeSlider);
            // Create and append delete button
            let deleteButton = document.createElement("button");
            deleteButton.className = "segment-delete";
            deleteButton.innerText = "✖";
            newItem.appendChild(deleteButton);
            target.appendChild(newItem);




            const trackIndex = Array.from(document.querySelectorAll('.track-content')).indexOf(target);
            if (trackIndex >= 0) {
                const audio = new Audio(sample.src);
            
                tracks[trackIndex].push(sample);
                audioElements[trackIndex].push(audio);
                //(new Audio(sample.src));
                // Update volume of the audio element when the slider is adjusted
                volumeSlider.addEventListener('input', () => {
                    audio.volume = volumeSlider.value / 100;
                });
                SetupSegmentDelete();
            }
        }
    }

    // Add event listeners to the drop zones
    document.querySelectorAll('.track-content').forEach(item => {
        item.addEventListener('drop', drop);
        item.addEventListener('dragover', allowDrop);

        // Add touch event listeners
        item.addEventListener('touchmove', allowDrop);
        item.addEventListener('touchend', drop);
    });


    // Setup play and stop functionality for each track
    function setupTrackControls(trackIndex) {
        const playButton = document.getElementById(`play${trackIndex + 1}`);
        const stopButton = document.getElementById(`stop${trackIndex + 1}`);
        const volumeSlider = document.getElementById(`volume${trackIndex + 1}`);
        const volumeValue = document.getElementById(`volume-value${trackIndex + 1}`);



        playButton.addEventListener('click', () => {
            // Stop any currently playing track

            if (!audioContext) {
                audioContext = new(window.AudioContext || window.webkitAudioContext)();

            }
            if (trackAudio[trackIndex]) {
                trackAudio[trackIndex].forEach(audio => audio.pause());
            }

            // Play the selected track
            trackAudio[trackIndex] = audioElements[trackIndex].map(audio => {
                audio.currentTime = 0;
                audio.play();
                return audio;
            });
        });

        stopButton.addEventListener('click', () => {
            // Stop all audio elements for this track
            if (trackAudio[trackIndex]) {
                trackAudio[trackIndex].forEach(audio => audio.pause());
            }
        });
        volumeSlider.addEventListener('input', () => {
            volumeValue.textContent =volumeSlider.value;
            if (trackAudio[trackIndex]){
                trackAudio[trackIndex].forEach(audio => audio.volume = volumeSlider.value / 100);
            }
        });
    }

    // Initialize controls for all tracks
 /*   setupTrackControls(0);
    setupTrackControls(1);
    setupTrackControls(2);
*/
for (let i = 0; i < 3; i++){
    setupTrackControls(i);
}




    // Play all tracks together sequentially
    document.getElementById('playback-control').addEventListener('click', () => {
        tracks.forEach((track, index) => {
            if (audioElements[index].length > 0) {
                trackAudio[index] = audioElements[index].map(audio => {
                    audio.currentTime = 0;
                    audio.play();
                    return audio
                });
            }
        });
    });
    /*
                if (trackAudio[index]){
                    trackAudio[index].forEach(audio => audio.pause());
                }
                trackAudio[index] = audioElements[index].map(audio => {
                    audio.currentTime = 0;
                    audio.play();
                    return audio;
                })
            }
        });
    });
*/
    const micButton = document.getElementById('record-control');
    micButton.addEventListener('click', async () => {
        if (!audioContext) {
            audioContext = new (window.AudioContext || window.webkitAudioContext)();
        } 

        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia){
            alert('media device API not supported.');
            return;
        }
        if (mediaRecorder && mediaRecorder.state !== 'inactive'){
            mediaRecorder.stop();
            micButton.innerHTML = 'Stop';
            return;
        }
        try {
            recordingStream = await navigator.mediaDevices.getUserMedia({ audio: true });
            const mediaStreamDestination = audioContext.createMediaStreamDestination();
            const source = audioContext.createMediaStreamSource(recordingStream);
            source.connect(mediaStreamDestination);

            mediaRecorder = new MediaRecorder(mediaStreamDestination.stream);

            mediaRecorder.ondataavailable = (event) => {
                recordedChunks.push(event.data);
            };
            mediaRecorder.onstop = () => {
                const blob = new Blob(recordedChunks, { type: 'audio/wav' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = 'recording.wav';
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                recordedChunks = [];
            };

            mediaRecorder.start();
            micButton.innerHTML = 'Record';
            
        } catch (error) {
            console.error('Error accessing the microphone:', error);
            alert('Error accessing the microphone.');
        }
    });

    // Save functionality
    document.getElementById('save-control').addEventListener('click', async() => {
        const offlineContext = new OfflineAudioContext(2, audioContext.sampleRate * track_duration, audioContext.sampleRate);
        
       /* if (!recordedChunks.length) {
            alert('No recording available.');
            return;
        }*/


        // Load and decode all audio samples
        const promises = tracks.flat().map(sample => fetch(sample.src).then(response => response.arrayBuffer()).then(data => offlineContext.decodeAudioData(data)));
        const audioBuffers = await Promise.all(promises);

        // Create buffer sources and connect them to the offline context
        audioBuffers.forEach(buffer => {
            const source = offlineContext.createBufferSource();
            source.buffer = buffer;
            source.connect(offlineContext.destination);
            source.start(0);

        })
       

        // Render the audio
        const renderedBuffer = await offlineContext.startRendering();

        // Convert the rendered buffer to a Blob and create a download link
        const wavBlob = bufferToWave(renderedBuffer, renderedBuffer.length);
        const url = URL.createObjectURL(wavBlob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'final-song.wav';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
    });

    function bufferToWave(abuffer, len) {
        const numOfChan = abuffer.numberOfChannels;
        const length = len * numOfChan * 2 + 44;
        const buffer = new ArrayBuffer(length);
        const view = new DataView(buffer);
        const channels = [];
        let sampleRate = abuffer.sampleRate;
        let offset = 0;
        let pos = 0;

        function setUint16(data) {
            view.setUint16(pos, data, true);
            pos +=2;
        }
      
        function setUint32(data) {
            view.setUint32(pos, data, true);
            pos +=4;
        }


        // write WAVE header
        setUint32(0x46464952); // "RIFF"
        setUint32(length - 8); // file length - 8
        setUint32(0x45564157); // "WAVE"

        setUint32(0x20746d66); // "fmt " chunk
        setUint32(16); // length = 16
        setUint16(1); // PCM (uncompressed)
        setUint16(numOfChan);
        setUint32(abuffer.sampleRate);
        setUint32(abuffer.sampleRate * 2 * numOfChan); // avg. bytes/sec
        setUint16(numOfChan * 2); // block-align
        setUint16(16); // 16-bit (hardcoded in this demo)

        setUint32(0x61746164); // "data" - chunk
        setUint32(length - pos - 4); // chunk length

        // write interleaved data
        for (i = 0; i < abuffer.numberOfChannels; i++)
            channels.push(abuffer.getChannelData(i));

        while (pos < length) {
            for (i = 0; i < numOfChan; i++) { // interleave channels
                sample = Math.max(-1, Math.min(1, channels[i][offset])); // clamp
                sample = (0.5 + sample * 32767) | 0; // scale to 16-bit signed int
                view.setInt16(pos, sample, true); // write 16-bit sample
                pos += 2;
            }
            offset++; // next source sample
        }

        return new Blob([buffer], { type: "audio/wav" });

        function setUint16(data) {
            view.setUint16(pos, data, true);
            pos += 2;
        }

        function setUint32(data) {
            view.setUint32(pos, data, true);
            pos += 4;
        }
    }
    SetupSegmentDelete();

    });
