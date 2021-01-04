const { desktopCapturer, ipcRenderer, remote } = require('electron');
const { Menu } = remote;
//https://github.com/yusitnikov/fix-webm-duration
const ysFixWebmDuration = require('./lib/fix-webm-duration');


window.onload = () => {
    // const warningEl = document.getElementById('warning');
    const videoElement = document.getElementById('videoElement');
    const captureBtn = document.getElementById('captureBtn');
    const startBtn = document.getElementById('startBtn');
    const stopBtn = document.getElementById('stopBtn');
    const download = document.getElementById('download');
    const audioToggle = document.getElementById('audioToggle');
    const micAudioToggle = document.getElementById('micAudioToggle');
    const minimizeOnRecord = document.getElementById('minimizeOnRecord');

    const cancelBtn = document.getElementById('cancelBtn');
    const faceBtn = document.getElementById('faceBtn');

    faceBtn.onclick = () => {
      ipcRenderer.send('faceBtn-clicked');
    };


    
    // if('getDisplayMedia' in navigator.mediaDevices) warningEl.style.display = 'none';
  
    let blobs;
    let blob;
    let rec;
    let stream;
    let voiceStream;
    let desktopStream;

    let startTime;
    
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
        types: [ 'screen']
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
      download.style.display = 'none';
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
        voiceStream = await navigator.mediaDevices.getUserMedia({ video: false, audio: mic });
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
    
      rec = new MediaRecorder(stream, {mimeType: 'video/webm; codecs=vp9,opus'});
      rec.ondataavailable = (e) => blobs.push(e.data);
      rec.onstop = async () => {
        var duration = Date.now() - startTime;
        //blobs.push(MediaRecorder.requestData());
        blob = new Blob(blobs, {type: 'video/webm'});
        ysFixWebmDuration(blob, duration, function(fixedBlob) {
          let url = window.URL.createObjectURL(fixedBlob);
          download.href = url;
          download.download = 'test.webm';
          download.style.display = 'inline-block';
        });
      };
      startBtn.disabled = false;
      captureBtn.disabled = true;
      audioToggle.disabled = true;
      micAudioToggle.disabled = true;

      cancelBtn.disabled = false;
    };


  
    /* CANCELS THE SELECTION */
    cancelBtn.onclick = () => {
      captureBtn.disabled = false;
      audioToggle.disabled = false;
      micAudioToggle.disabled = false;
      startBtn.disabled = true;
      stopBtn.disabled = true;
      cancelBtn.disabled = true;

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
      startBtn.disabled = true;
      stopBtn.disabled = true;
      
      rec.stop();
      
      stream.getTracks().forEach(s=>s.stop())
      videoElement.srcObject = null
      stream = null;
      ipcRenderer.send('stop-record');
    };


    ipcRenderer.on('please-stop', function(){
      if (!stopBtn.disabled) stopBtn.click();
    });
  };