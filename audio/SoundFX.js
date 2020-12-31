export var listener;

var itemSounds = [];

const soundsPath = "./audio/sounds/";

export var loadCallbacks = new Map();

export var soundBuffers = {
    explosion: { buffer: null, filename: 'explosion.ogg' },
}

export function init(camera) {
    // create an AudioListener and add it to the camera
    listener = new THREE.AudioListener();

    if (camera) camera.add(listener);

    // load a sound and set it as the Audio object's buffer
    var audioLoader = new THREE.AudioLoader();

    for (let prop in soundBuffers) {
        let sb = soundBuffers[prop];
        audioLoader.load( soundsPath + sb.filename, function( buffer ) {
            sb.buffer = buffer;
            if (loadCallbacks.has(sb)) {
                loadCallbacks.get(sb)(buffer);
            }
        });
    }
}

export function addItemSound(item, soundBuffer, loop, volume = 0.7) {
    let sound = new THREE.PositionalAudio(listener);

    item.add(sound);
    sound.setBuffer(soundBuffer.buffer).setRefDistance(50).setDistanceModel('exponential').setRolloffFactor(0.3).setLoop(loop).setVolume(volume);
    // play(sound);

    if (loop) {
        itemSounds.push(sound);
        sound.item = item;
    } else {
        item.sound = sound;
    }

    return sound;
}