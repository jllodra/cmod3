"use strict";

angular.module('cmod.engine', [])
.factory('engine', [ //'ompt',
  function engine() {

    var audioContext = new window.AudioContext();
    var processNode = audioContext.createScriptProcessor(maxFramesPerChunk/*4096*//*8192*//*16384*/, 0, 2);
    var mp3stream = audioContext.createMediaElementSource(window.document.querySelector('audio'));

    var gainNode = audioContext.createGain();
    var safeGainNode = audioContext.createGain(); // we'll eliminate the need of this with a worker

    var splitter = audioContext.createChannelSplitter();

    var analyserNodeCh1 = audioContext.createAnalyser();
    analyserNodeCh1.smoothingTimeConstant = 0.3;
    analyserNodeCh1.fftSize = 64;
    var analyserNodeCh2 = audioContext.createAnalyser();
    analyserNodeCh2.smoothingTimeConstant = 0.3;
    analyserNodeCh2.fftSize = 64;

    processNode.connect(gainNode);
    mp3stream.connect(gainNode);

    gainNode.connect(safeGainNode);

    safeGainNode.connect(audioContext.destination);
    safeGainNode.connect(splitter);

    splitter.connect(analyserNodeCh1, 0, 0);
    splitter.connect(analyserNodeCh2, 1, 0);


    var isConnected = false;

    //var maxFramesPerChunk = 512;
    var maxFramesPerChunk = 4096;
    var byteArray = null;
    var filePtr = null;
    var memPtr = null;
    var leftBufferPtr = null;
    var rightBufferPtr = null;

    var status = {
      stopped: true,
      paused: false,
      volume: 100
    };

    processNode.onaudioprocess = function(e) {
      var outputL = e.outputBuffer.getChannelData(0);
      var outputR = e.outputBuffer.getChannelData(1);
      var framesToRender = outputL.length;
      //
      var i;
      if(status.stopped || status.paused) { // stop
        for (i = 0; i < framesToRender; ++i) {
          outputL[i] = 0;
          outputR[i] = 0;
        }
        return;
      }
      var framesRendered = 0;
      while (framesToRender > 0) {
        var framesPerChunk = Math.min(framesToRender, maxFramesPerChunk);
        var actualFramesPerChunk = ompt._openmpt_module_read_float_stereo(
          memPtr,
          audioContext.sampleRate,
          framesPerChunk,
          leftBufferPtr,
          rightBufferPtr);
        //if (actualFramesPerChunk == 0) {
          //ended = true;
        //}
        var rawAudioLeft = ompt.HEAPF32.subarray(leftBufferPtr / 4, leftBufferPtr / 4 + actualFramesPerChunk);
        var rawAudioRight = ompt.HEAPF32.subarray(rightBufferPtr / 4, rightBufferPtr / 4 + actualFramesPerChunk);
        //leftVU = 0;
        //rightVU = 0;
        for (i = 0; i < actualFramesPerChunk; ++i) {
          outputL[framesRendered + i] = rawAudioLeft[i];
          outputR[framesRendered + i] = rawAudioRight[i];
          //leftVU += rawAudioLeft[i];
          //rightVU += rawAudioRight[i];
        }
        for (i = actualFramesPerChunk; i < framesPerChunk; ++i) {
          outputL[framesRendered + i] = 0;
          outputR[framesRendered + i] = 0;
        }
        framesToRender -= framesPerChunk;
        framesRendered += framesPerChunk;
        //leftVU = leftVU / framesPerChunk;
        //rightVU = rightVU / framesPerChunk;
        if(actualFramesPerChunk === 0) {
          end();
        }
      }
    };

    function loadBuffer(buffer) {
      console.info("loadBuffer");

      byteArray = new Int8Array(buffer);
      filePtr = ompt._malloc(byteArray.byteLength);
      ompt.HEAPU8.set(byteArray, filePtr);
      memPtr = ompt._openmpt_module_create_from_memory(filePtr, byteArray.byteLength, 0, 0, 0);
      leftBufferPtr = ompt._malloc(4 * maxFramesPerChunk);
      rightBufferPtr = ompt._malloc(4 * maxFramesPerChunk);
    }

    function readMetadata(buffer) {
      console.info("readMetadata");
      var byteArray = new Int8Array(buffer);
      var filePtr = ompt._malloc(byteArray.byteLength);
      ompt.HEAPU8.set(byteArray, filePtr);
      var memPtr = ompt._openmpt_module_create_from_memory(filePtr, byteArray.byteLength, 0, 0, 0);
      var metadata = {};
      var metadata_keys = ompt.Pointer_stringify(ompt._openmpt_module_get_metadata_keys(memPtr));
      var keys = metadata_keys.split(';');
      var keyNameBuffer = 0;
      for (var i = 0; i < keys.length; i++) {
        keyNameBuffer = ompt._malloc(keys[i].length + 1);
        ompt.writeStringToMemory(keys[i], keyNameBuffer);
        metadata[keys[i]] = ompt.Pointer_stringify(ompt._openmpt_module_get_metadata(memPtr, keyNameBuffer));
        ompt._free(keyNameBuffer);
      }
      metadata.duration = ompt._openmpt_module_get_duration_seconds(memPtr);
      ompt._openmpt_free_string(metadata_keys);
      ompt._free(filePtr);
      ompt._openmpt_module_destroy(memPtr);
      return metadata;
    }

    function getPosition() {
      return ompt._openmpt_module_get_position_seconds(memPtr);
    }

    function setPosition(seconds) {
      ompt._openmpt_module_set_position_seconds(memPtr, seconds);
    }

    function connect() {
      safeGainNode.gain.value = 1; // TODO: use web workers and let the buffer empty
    }

    function disconnect() {
      safeGainNode.gain.value = 0; // TODO: use web workers and let the buffer empty
    }

    function play() {
      console.info("engine: play");
      connect();
      status.stopped = false;
    }

    function unload() {
      console.info("engine: unload");
      if (!status.stopped) {
        stop();
      }
      disconnect();
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
      metadata: readMetadata,
      play: play,
      stop: stop,
      pause: pause
    };
  }
]);
