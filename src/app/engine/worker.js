"use strict";

importScripts('../../lib/libopenmpt-0.2.5602_opt2.js');
self.ompt = Module;

//postMessage("Worker launched");

/*var maxFramesPerChunk = 4096;

function loadBuffer(buffer) {
  console.info("loadBuffer in Worker");
  var byteArray = new Int8Array(buffer);
  var filePtr = ompt._malloc(byteArray.byteLength);
  ompt.HEAPU8.set(byteArray, filePtr);
  var memPtr = ompt._openmpt_module_create_from_memory(filePtr, byteArray.byteLength, 0, 0, 0);
  var leftBufferPtr = ompt._malloc(4 * maxFramesPerChunk);
  var rightBufferPtr = ompt._malloc(4 * maxFramesPerChunk);
  console.warn(memPtr);
}*/

function readMetadata(buffer) {
  console.info("readMetadata in Worker");
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

var onmessage = function (e) {
  console.warn(ompt);
  if(e.data.command === 'loadBuffer') {
    //loadBuffer(e.data.data);
    //postMessage(e.data.data);
  } else if (e.data.command === 'readMetadata') {
    var metadata = readMetadata(e.data.data);
    postMessage({
      command: 'readMetadata',
      id: e.data.id,
      data: metadata
    });
  } else {
    postMessage('unknown command...');
  }
};