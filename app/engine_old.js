"use strict";

var ompt = require('../lib/libopenmpt-0.2.4923.js');

function engine() {

  var audioContext = new window.AudioContext();
  var processNode = null;
  var isConnected = false;

  var maxFramesPerChunk = 4096;
  var byteArray = null;
  var filePtr = null;
  var memPtr = null;
  var leftBufferPtr = null;
  var rightBufferPtr = null;
  var leftVU = 0;
  var rightVU = 0;

  var status = {
    stopped: true,
    paused: false
  };

  function loadBuffer(buffer) {
    processNode = audioContext.createScriptProcessor(4096, 0, 2);
    processNode.onaudioprocess = onaudioprocess;
    byteArray = new Int8Array(buffer);
    filePtr = ompt._malloc(byteArray.byteLength);
    ompt.HEAPU8.set(byteArray, filePtr);
    memPtr = ompt._openmpt_module_create_from_memory(filePtr, byteArray.byteLength, 0, 0, 0);
    leftBufferPtr = ompt._malloc(4 * maxFramesPerChunk);
    rightBufferPtr = ompt._malloc(4 * maxFramesPerChunk);
  };

  function metadata(buffer) {
    var byteArray = new Int8Array(buffer);
    var filePtr = ompt._malloc(byteArray.byteLength);
    ompt.HEAPU8.set(byteArray, filePtr);
    var memPtr = ompt._openmpt_module_create_from_memory(filePtr, byteArray.byteLength, 0, 0, 0);
    var metadata = {};
    var metadata_keys = ompt.Pointer_stringify(ompt._openmpt_module_get_metadata_keys(memPtr));
    var keys = metadata_keys.split(';');;
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
  };

  function getPosition() {
    return ompt._openmpt_module_get_position_seconds(memPtr);
  };

  function setPosition(seconds) {
    ompt._openmpt_module_set_position_seconds(memPtr, seconds);
  };

  function connect() {
    if(processNode !== null)
      processNode.connect(audioContext.destination);
  };

  function disconnect() {
    if(processNode !== null) {
      processNode.disconnect();
      isConnected = false;
    }
  }

  function play() {
    if(!isConnected) {
      connect(audioContext.destination);
      isConnected = true;
    }
    status.stopped = false;
  }

  function unload() {
    if (!status.stopped) {
      stop();
    }
    if(isConnected) {
      disconnect();
    }
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
    status.stopped = true;
    status.paused = false;
    ompt._openmpt_module_set_position_seconds(memPtr, 0);
  }

  function pause() {
    status.paused = !status.paused;
  }

  function getVU() {
    return {
      l: leftVU,
      r: rightVU
    }
  }

  var onaudioprocess = function(e) {
    var outputL = e.outputBuffer.getChannelData(0);
    var outputR = e.outputBuffer.getChannelData(1);
    var framesToRender = outputL.length;
    //
    if(status.stopped || status.paused) { // stop
      for (var i = 0; i < framesToRender; ++i) {
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
      leftVU = 0;
      rightVU = 0;
      for (var i = 0; i < actualFramesPerChunk; ++i) {
        outputL[framesRendered + i] = rawAudioLeft[i];
        outputR[framesRendered + i] = rawAudioRight[i];
        leftVU += rawAudioLeft[i];
        rightVU += rawAudioRight[i];
      }
      for (var i = actualFramesPerChunk; i < framesPerChunk; ++i) {
        outputL[framesRendered + i] = 0;
        outputR[framesRendered + i] = 0;
      }
      framesToRender -= framesPerChunk;
      framesRendered += framesPerChunk;
      leftVU = leftVU / framesPerChunk;
      rightVU = rightVU / framesPerChunk;
      if(actualFramesPerChunk == 0) {
        stop();
      }
    }
  };

  return {
    audioContext: audioContext,
    processNode: processNode,

    status: status,

    loadBuffer: loadBuffer,
    unload: unload,
    getPosition: getPosition,
    setPosition: setPosition,
    metadata: metadata,
    play: play,
    stop: stop,
    pause: pause,
    getVU: getVU
  }
}

module.exports = engine;
