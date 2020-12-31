export function createBlendAnimation(startValue, newValue, trackName, duration) {
    var times = [0, duration], values = [startValue, newValue];
    var track = new THREE.NumberKeyframeTrack(trackName, times, values, THREE.InterpolateSmooth);
    return new THREE.AnimationClip(null, duration, [track]);
}

export function blendProperty(mixer, obj, propName, targetValue, duration) {
    let currValue = obj[propName];
    mixer.uncacheRoot(obj);
    obj[propName] = currValue;

    let action = mixer.clipAction(createBlendAnimation(currValue, targetValue, '.' + propName, duration), obj);
    action.clampWhenFinished = true;
    action.setLoop(THREE.LoopOnce).play();
}