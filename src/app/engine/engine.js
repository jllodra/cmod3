"use strict";

angular.module('cmod.engine', [])
.factory('engine', [ //'ompt',
  function engine() {

    console.info("creating worker");
    var worker = new Worker("app/engine/worker.js");
    var workeridmsg = 0;
    var workermessages = {};
    worker.onmessage = function (e) {
      if(e.data.command === 'readMetadata') {
        //console.warn(e.data.command + ": worker response");
        //console.warn(e.data.id);
        workermessages[e.data.id](e.data.data);
        delete workermessages[e.data.id];
      }
    };

    var audioContext = new window.AudioContext();

    var maxFramesPerChunk = 4096;

    var processNode = audioContext.createScriptProcessor(maxFramesPerChunk/*4096*//*8192*//*16384*/, 0, 2);
    var mp3stream = audioContext.createMediaElementSource(window.document.querySelector('audio'));
    var gainNode = audioContext.createGain();
    var safeGainNode = audioContext.createGain(); // we'll hopefully fix this with a worker that supports a ScriptProcessor
    var splitter = audioContext.createChannelSplitter();
    var analyserNodeCh1 = audioContext.createAnalyser();
    analyserNodeCh1.smoothingTimeConstant = 0.8;
    analyserNodeCh1.fftSize = 32;
    var analyserNodeCh2 = audioContext.createAnalyser();
    analyserNodeCh2.smoothingTimeConstant = 0.8;
    analyserNodeCh2.fftSize = 32;
    processNode.connect(gainNode);
    mp3stream.connect(gainNode);
    gainNode.connect(safeGainNode);
    safeGainNode.connect(audioContext.destination);
    safeGainNode.connect(splitter);
    splitter.connect(analyserNodeCh1, 0, 0);
    splitter.connect(analyserNodeCh2, 1, 0);

    var isConnected = false; // TODO: not used

    var byteArray = null;
    var filePtr = null;
    var memPtr = null;
    var leftBufferPtr = null;
    var rightBufferPtr = null;

    var status = {
      stopped: true,
      paused: false,
      playingNectarine: false,
      bufferIsEmptyEnsured: false,
      volume: 100
    };

    processNode.onaudioprocess = function(e) {
      var outputL = e.outputBuffer.getChannelData(0);
      var outputR = e.outputBuffer.getChannelData(1);
      var framesToRender = outputL.length;
      //
      var i;
      if(status.stopped || status.paused || status.playingNectarine) { // stop
        for (i = 0; i < framesToRender; ++i) {
          outputL[i] = 0;
          outputR[i] = 0;
        }
        if(!status.bufferIsEmptyEnsured) {
          safeGainNode.gain.value = 0; // no data (disconnecting through the safe gain node)
          status.bufferIsEmptyEnsured = true;
        } else {
          safeGainNode.gain.value = 1;
        }
        return;
      }
      status.bufferIsEmptyEnsured = false;
      var framesRendered = 0;
      while (framesToRender > 0) {
        var framesPerChunk = Math.min(framesToRender, maxFramesPerChunk);
        var actualFramesPerChunk = ompt._openmpt_module_read_float_stereo(
          memPtr,
          audioContext.sampleRate,
          framesPerChunk,
          leftBufferPtr,
          rightBufferPtr);
        var rawAudioLeft = ompt.HEAPF32.subarray(leftBufferPtr / 4, leftBufferPtr / 4 + actualFramesPerChunk);
        var rawAudioRight = ompt.HEAPF32.subarray(rightBufferPtr / 4, rightBufferPtr / 4 + actualFramesPerChunk);
        for (i = 0; i < actualFramesPerChunk; ++i) {
          outputL[framesRendered + i] = rawAudioLeft[i];
          outputR[framesRendered + i] = rawAudioRight[i];
        }
        for (i = actualFramesPerChunk; i < framesPerChunk; ++i) {
          outputL[framesRendered + i] = 0;
          outputR[framesRendered + i] = 0;
        }
        framesToRender -= framesPerChunk;
        framesRendered += framesPerChunk;
        if(actualFramesPerChunk === 0) {
          end();
        } else {
          safeGainNode.gain.value = 1; // we have data (reconnecting through the safe gain node)
        }
      }
    };

    function loadBuffer(buffer) {
      console.info("loadBuffer");
      /*worker.postMessage({
        command: "loadBuffer",
        data: buffer
      });*/
      byteArray = new Int8Array(buffer);
      filePtr = ompt._malloc(byteArray.byteLength);
      ompt.HEAPU8.set(byteArray, filePtr);
      memPtr = ompt._openmpt_module_create_from_memory(filePtr, byteArray.byteLength, 0, 0, 0);
      leftBufferPtr = ompt._malloc(4 * maxFramesPerChunk);
      rightBufferPtr = ompt._malloc(4 * maxFramesPerChunk);
    }

    function readMetadataAsync(buffer, callback) {
      //console.warn("readMetadataAsync");
      workermessages[workeridmsg] = callback;
      worker.postMessage({
        command: "readMetadata",
        id: workeridmsg++,
        data: buffer
      });
    }

    function getPosition() {
      if(memPtr) {
        return ompt._openmpt_module_get_position_seconds(memPtr);
      }
    }

    function setPosition(seconds) {
      if(memPtr) {
        ompt._openmpt_module_set_position_seconds(memPtr, seconds);
      }
    }

    /*function connect() {
      safeGainNode.gain.value = 1; // TODO: use web workers and let the buffer empty
    }

    function disconnect() {
      safeGainNode.gain.value = 0; // TODO: use web workers and let the buffer empty
    }*/

    function play() {
      console.info("engine: play");
      //connect();
      status.stopped = false;
    }

    function unload() {
      console.info("engine: unload");
      if (!status.stopped) {
        stop();
      }
      //disconnect();
      if(memPtr !== null && memPtr !== 0) {
        ompt._free(filePtr);
        ompt._openmpt_module_destroy(memPtr);
        ompt._free(leftBufferPtr);
        ompt._free(rightBufferPtr);
      }
      memPtr = null;
      leftBufferPtr = null;
      rightBufferPtr = null;
    }

    function stop() {
      console.info("engine: stop");
      status.stopped = true;
      status.paused = false;
      ompt._openmpt_module_set_position_seconds(memPtr, 0);
    }

    function end() {
      console.info("engine: end");
      status.stopped = true;
      status.paused = false;
    }

    function pause() {
      console.info("engine: pause");
      status.paused = !status.paused;
    }

    function setVolume(v) {
      console.info("engine: setVolume");
      v = Math.min(Math.max(v, 0), 1);
      status.volume = v;
      gainNode.gain.value = v;
    }

    function getVolume() {
      console.info("engine: getVolume");
      return status.volume;
    }

    return {
      audioContext: audioContext,
      processNode: processNode,
      analyzerNodeCh1: analyserNodeCh1,
      analyzerNodeCh2: analyserNodeCh2,
      gainNode: gainNode,

      status: status,

      loadBuffer: loadBuffer,
      unload: unload,
      getPosition: getPosition,
      setPosition: setPosition,
      getVolume: getVolume,
      setVolume: setVolume,
      //metadata: readMetadata,
      readMetadataAsync: readMetadataAsync,
      play: play,
      stop: stop,
      pause: pause
    };
  }
]);
