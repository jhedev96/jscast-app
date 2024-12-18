const { desktopCapturer, ipcRenderer, remote } = require('electron');
const { writeFile } = require('fs');
const { dialog, Menu } = remote;
//https://github.com/yusitnikov/fix-webm-duration
const ysFixWebmDuration = require('./lib/fix-webm-duration');

window.onload = () => {
    // const warningEl = document.getElementById('warning');
    const videoElement = document.getElementById('videoElement'),
        captureBtn = document.getElementById('captureBtn'),
        startBtn = document.getElementById('startBtn'),
        stopBtn = document.getElementById('stopBtn'),
        audioToggle = document.getElementById('audioToggle'),
        micAudioToggle = document.getElementById('micAudioToggle'),
        micDevice = document.getElementById('micDevice'),
        minimizeOnRecord = document.getElementById('minimizeOnRecord'),
        qualitySelect = document.getElementById('quality'),

        cancelBtn = document.getElementById('cancelBtn'),
        faceBtn = document.getElementById('faceBtn'),
        roundedCam = document.getElementById('roundedCam');

    /* ADDING MICS AVAILABLE */
    micAudioToggle.onchange = () => {
      micDevice.disabled = !micAudioToggle.checked
    }

    navigator.mediaDevices.enumerateDevices().then((devices) => {
      devices.map((device) => {
        if (device.kind == 'audioinput') {
          micDevice.options[micDevice.options.length] = new Option(device.label, device.deviceId);
        }
      })
    })

  /* FACE BUTTON AND LOGO SELECTION */
    faceBtn.onclick = () => {
      ipcRenderer.send('faceBtn-clicked', roundedCam.checked);
      roundedCam.disabled = !roundedCam.disabled;
    };
    
    // if('getDisplayMedia' in navigator.mediaDevices) warningEl.style.display = 'none';
  
    let blobs, blob, rec, stream, voiceStream, desktopStream, startTime;
    // let quality;
    
    /* QUALITY SELECTION */
    // quality = 

    /* MERGING STREAMS  */ 
    const mergeAudioStreams = (desktopStream, voiceStream) => {
      const context = new AudioContext();
      const destination = context.createMediaStreamDestination();
      let hasDesktop = false;
      let hasVoice = false;
      if (desktopStream && desktopStream.getAudioTracks().length > 0) {
        // If you don't want to share Audio from the desktop it should still work with just the voice.
        const source1 = context.createMediaStreamSource(desktopStream);
        const desktopGain = context.createGain();
        desktopGain.gain.value = 0.7;
        source1.connect(desktopGain).connect(destination);
        hasDesktop = true;
      }
      
      if (voiceStream && voiceStream.getAudioTracks().length > 0) {
        const source2 = context.createMediaStreamSource(voiceStream);
        const voiceGain = context.createGain();
        voiceGain.gain.value = 0.7;
        source2.connect(voiceGain).connect(destination);
        hasVoice = true;
      }
        
      return (hasDesktop || hasVoice) ? destination.stream.getAudioTracks() : [];
    };

    /* SELECCION DE LO QUE SE QUIERE GRABAR Y STREAMS PREPARADOS */
    captureBtn.onclick = async function () {
      const inputSources = await desktopCapturer.getSources({
        types: ['screen']
      });
      console.log(inputSources);
      const videoOptionsMenu = Menu.buildFromTemplate(
        inputSources.map(source => {
          return {
            label: source.name,
            click: () => selectSource(source)
          }
        })
      );
    
      videoOptionsMenu.popup();
    };

    async function selectSource(source) {
      const audio = audioToggle.checked || false;
      const mic = micAudioToggle.checked || false;
      console.log(audio);
      if (audio === true) {
        desktopStream = await navigator.mediaDevices.getUserMedia({
          audio: {
            mandatory: {
              chromeMediaSource: 'desktop'
            }
          },
          video: {
            mandatory: {
              chromeMediaSource: 'desktop',
              chromeMediaSourceId: source.id,
            }
          }
        })
      } else {
        desktopStream = await navigator.mediaDevices.getUserMedia({
          audio: false,
          video: {
            mandatory: {
              chromeMediaSource: 'desktop',
              chromeMediaSourceId: source.id,
            }
          }
        })
      }
      
      if (mic === true) {
        // voiceStream = await navigator.mediaDevices.getUserMedia({ video: false, audio: mic });
        voiceStream = await navigator.mediaDevices.getUserMedia({
          video: false,
          audio: {deviceId: micDevice.value ? {exact: micDevice.value} : undefined}
        });
      }
    
      const tracks = [
        ...desktopStream.getVideoTracks(), 
        ...mergeAudioStreams(desktopStream, voiceStream)
      ];
      
      console.log('Tracks to add to stream', tracks);
      stream = new MediaStream(tracks);
      console.log('Stream', stream)
      videoElement.srcObject = stream;
      videoElement.muted = true;
        
      blobs = [];
    
      rec = new MediaRecorder(stream, {
        audioBitsPerSecond : 128000,
        videoBitsPerSecond : parseInt(qualitySelect.value),
        mimeType: 'video/webm; codecs=vp9,opus'
      });
      rec.ondataavailable = (e) => blobs.push(e.data);
      rec.onstop = async () => {
        var duration = Date.now() - startTime;
        //blobs.push(MediaRecorder.requestData());
        blob = new Blob(blobs, {type: 'video/webm'});
        ysFixWebmDuration(blob, duration, async function(fixedBlob) {
          const buffer = Buffer.from(await fixedBlob.arrayBuffer());
          const { filePath } = await dialog.showSaveDialog({
            buttonLabel: 'Save video',
            defaultPath: `vid-${Date.now()}.webm`,
            filters: [ { name: 'Video', extensions: ['webm'] } ]
          });
        
          if (filePath) {
            writeFile(filePath, buffer, () => console.log('video saved successfully!'));
          }
        });
      };
      startBtn.disabled = false;
      captureBtn.disabled = true;
      audioToggle.disabled = true;
      micAudioToggle.disabled = true;
      micDevice.disabled = true;
      qualitySelect.disabled =  true;

      cancelBtn.disabled = false;
    };

    /* CANCELS THE SELECTION */
    cancelBtn.onclick = () => {
      captureBtn.disabled = false;
      audioToggle.disabled = false;
      micAudioToggle.disabled = false;
      micDevice.disabled = !micAudioToggle.checked;
      startBtn.disabled = true;
      stopBtn.disabled = true;
      cancelBtn.disabled = true;
      qualitySelect.disabled = false;

      blobs = undefined;
      blob = undefined;
      rec = undefined;
      stream = undefined;
      voiceStream = undefined;
      desktopStream = undefined;

      videoElement.srcObject = stream;
    }

    /* STARTS TO RECORD */
    startBtn.onclick = () => {
      const minimize = minimizeOnRecord.checked || false;
      startBtn.disabled = true;
      cancelBtn.disabled = true;
      stopBtn.disabled = false;
      ipcRenderer.send('start-record', minimize);
      setTimeout( () => { 
        rec.start();
        startTime = Date.now();
      }, 6100);
    };
  
    /* STOPS TO RECORD */
    stopBtn.onclick = () => {
      captureBtn.disabled = false;
      audioToggle.disabled = false;
      micAudioToggle.disabled = false;
      micDevice.disabled = !micAudioToggle.checked;
      startBtn.disabled = true;
      stopBtn.disabled = true;
      qualitySelect.disabled = false;
      
      rec.stop();
      
      stream.getTracks().forEach(s=>s.stop())
      videoElement.srcObject = null
      stream = null;
      ipcRenderer.send('stop-record');
    };

    ipcRenderer.on('please-stop', function(){
      if (!stopBtn.disabled) stopBtn.click();
    });

    // Open the github link in the default browser
    document.getElementById('github-link').addEventListener('click', event => {
      event.preventDefault();
      require("electron").shell.openExternal(event.target.href);
    });

};
