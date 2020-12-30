import './web_modules/three/build/three.min.js';

import { GUI } from './web_modules/three/examples/jsm/libs/dat.gui.module.js';
import { PointerLockControls } from './web_modules/three/examples/jsm/controls/PointerLockControls.js';

//import { EffectComposer } from './web_modules/three/examples/jsm/postprocessing/EffectComposer.js';
//import { RenderPass } from './web_modules/three/examples/jsm/postprocessing/RenderPass.js';
//import { SMAAPass } from './web_modules/three/examples/jsm/postprocessing/SMAAPass.js';

import * as WORLD from './gfx/World.js';
import * as ANIM from './gfx/Animations.js';
import * as SFX from './audio/SoundFX.js';
// import * as MSX from './audio/Music.js';
import * as PTFX from './gfx/ParticleEffects.js';

var controls, gpControls, composer;
var renderer;
var scene;
var camera;
var particleSystems = [];

//var rayHelper = new THREE.ArrowHelper();

var isElectronApp = (navigator.userAgent.toLowerCase().indexOf(' electron/') > -1); // detect whether run as electron app

var fps = [];

const maxNum = 25;

var lights = [];

var animClock = new THREE.Clock();
var walkClock = new THREE.Clock();

const guyOffset = 20;

const jumpInitialVel = 350;

var mixer;

var skyMesh;
var hemiLight;
var dirLight;

const dirLightIntensity = 0.4;
const hemiLightIntensity = 0.75;

var isNight = true;

const moveDir = { forward:0, backward:1, left:2, right:3 }
var moveActive = [ false, false, false, false ];

var canJump = false;

var velocity = new THREE.Vector3();
var direction = new THREE.Vector3();

var absMaxDistance = WORLD.plateCounter * WORLD.plateSize - guyOffset;

var progressBarDiv;

var isTouch = ('ontouchstart' in window);

var resolutions = [{ x: 0, y: 0 }, { x: 320, y: 240 }, {x: 640, y: 480 }, { x: 1024, y: 768 }, { x: 1280, y: 800 }, { x: 1920, y: 1080 }];
var resolutionNames  = { 'Auto': 0, '320x240': 1, '640x480': 2, '1024x768': 3, "1280x800": 4, "1920x1080": 5 };
var qualityNames = { High: 1, Low : 2};
var audioSettings = { enabled : true, volume: 100 };
var gamepadSettings = { enabled: true, moveSensitivity: 1, lookSensitivity: 1 };
var gfxSettings = { resolution: resolutionNames.Auto, quality: qualityNames.High, fullScreen: false, shadows: isTouch ? 0 : 3 , antiAlias: true , showFPS: false};

var gui, gfxFolder, controlsFolder, audioFolder, gameFolder;

var blocker = document.getElementById( 'blocker' );
var instructions = document.getElementById( 'instructions' );

var fpsLabel = document.getElementById('fpsLabel');

var touchPause = document.getElementById('touchPause');
var touchMoveForward = document.getElementById('touchForward');
var touchMoveBack = document.getElementById('touchBack');
var touchMoveLeft = document.getElementById('touchLeft');
var touchMoveRight = document.getElementById('touchRight');
var touchToggleSeason = document.getElementById('touchSeason');
var touchToggleDayNight = document.getElementById('touchDayNight');

const touchControlDirs = new Map();
var touchMoveTime;
var touchCameraControls = document.getElementById('cameraControls');
var touchCamPos = new THREE.Vector2();
var mouseMove = false;
var mouseMovePos = new THREE.Vector2();

const playerCamHeight = 85;

var sceneTotalItems, sceneInitItems = 1; // counter for startup to render only if all scene items initialized

var sceneInitFuncs = [];

var gameActive = false;

// main entry point
init();

function init() {
    initTouchControls(true);
    initScene();
    initGUI();
    initControls();
    initAudio();
    applyInitialSettings();

    showProgressBar();

    initObjects();

    sceneTotalItems = sceneInitFuncs.length;
    sceneInitItems = sceneTotalItems;
    processSceneInitItems('start');
}

function initAudio() {
    SFX.loadCallbacks.set(SFX.soundBuffers.explosion, buffer => {
        for (let light of lights) {
            SFX.addItemSound(light, SFX.soundBuffers.explosion, false);
        }
    });
    SFX.init(camera);
}


function applyInitialSettings() {
    onWindowResize(false);
    updateFPSLabel();
    setMasterVolume();
}

function initControls() {

    renderer = new THREE.WebGLRenderer( { antialias: gfxSettings.antiAlias } );
    if (!isTouch) {
        renderer.setPixelRatio( window.devicePixelRatio );
    }

    renderer.setSize( window.innerWidth, window.innerHeight );
    // updateShadows(gameSettings.shadow);

    renderer.domElement.setAttribute('style', "position: absolute; top: 0px; left: 0px; right: 0px; bottom: 0px; margin: auto");
    document.body.insertBefore( renderer.domElement, document.getElementById( 'blocker' ));
    // document.body.appendChild(renderer.domElement);

    camera = new THREE.PerspectiveCamera( 60, window.innerWidth / window.innerHeight, 1, 15000 );

    camera.up = new THREE.Vector3(0, 1, 0);

    camera.position.set(0, playerCamHeight, WORLD.worldPlates * WORLD.plateSize);
    camera.rotateX(Math.PI / 180 * 15);

    // initComposer();

    controls = new PointerLockControls( camera, document.body );

    scene.add( controls.getObject() );

    document.getElementById('infoLink').addEventListener('click', e => {
        e.stopPropagation();
    });

    /*
    if (isTouch) {
        instructions.addEventListener('click', function (e) {
            openFullscreen();
            window.history.pushState({}, 'pause');
            startGame();
        }, false);

        window.addEventListener('popstate', function() {
            pauseGame();
        });

    } else {
        instructions.addEventListener('click', function () {
            controls.lock();
        }, false);

        controls.addEventListener('lock', function () {
            startGame();
        });

        controls.addEventListener('unlock', function () {
            pauseGame();
        });
    }
*/
    var onKeyDown = function ( event ) {
        //console.log("down " + event.keyCode);
        switch ( event.keyCode ) {
            case 38: // up
            case 87: // w
                toggleMove(true, moveDir.forward, touchMoveForward);
                break;

            case 37: // left
            case 65: // a
            toggleMove(true, moveDir.left, touchMoveLeft);
                break;

            case 40: // down
            case 83: // s
            toggleMove(true, moveDir.backward, touchMoveBack);
                break;

            case 39: // right
            case 68: // d
            toggleMove(true, moveDir.right, touchMoveRight);
                break;

            case 32: // space
                jump();
                break;

            case 8: // backspace
                if ( animClock.running ) {
                    animClock.stop();
                } else {
                    animClock.start();
                }
                break;

            case 77: // m
                toggleSeason();
            break;
            case 78: // n
                toggleDayNight();
            break;
        }
    };

    var onKeyUp = function ( event ) {
        //console.log("up " + event.keyCode);
        switch ( event.keyCode ) {
            case 38: // up
            case 87: // w
                toggleMove(false, moveDir.forward, touchMoveForward);
                break;

            case 37: // left
            case 65: // a
                toggleMove(false, moveDir.left, touchMoveLeft);
                break;

            case 40: // down
            case 83: // s
                toggleMove(false, moveDir.backward, touchMoveBack);
                break;

            case 39: // right
            case 68: // d
                toggleMove(false, moveDir.right, touchMoveRight);
                break;
        }
    };

    document.addEventListener('keydown', onKeyDown, false);
    document.addEventListener('keyup', onKeyUp, false);
    window.addEventListener('resize', onWindowResize, false);
}


function initTouchControls(hide) {
    if (hide) {
        document.getElementById('touchControls').style.display = 'none';

        touchPause.style.display = 'none';
        touchPause.removeEventListener("click", onTouchPauseClick);

        touchCameraControls.removeEventListener("touchstart", onCamControlsTouch);
        touchCameraControls.removeEventListener("touchmove", onCamControlsTouchMove);
        touchCameraControls.removeEventListener("touchend", onCamControlsRelease);

        touchMoveForward.removeEventListener("touchstart", onMoveControlTouch);
        touchMoveForward.removeEventListener("touchend", onMoveControlRelease);

        touchMoveBack.removeEventListener("touchstart", onMoveControlTouch);
        touchMoveBack.removeEventListener("touchend", onMoveControlRelease);

        touchMoveLeft.removeEventListener("touchstart", onMoveControlTouch);
        touchMoveLeft.removeEventListener("touchend", onMoveControlRelease);

        touchMoveRight.removeEventListener("touchstart", onMoveControlTouch);
        touchMoveRight.removeEventListener("touchend", onMoveControlRelease);

        touchToggleSeason.removeEventListener("click", onToggleSeasonClick);
        touchToggleDayNight.removeEventListener("click", onToggleDayNightClick);
    } else {
        document.getElementById('touchControls').style.display = '-webkit-box';
        document.getElementById('touchControls').style.display = '-moz-box';
        document.getElementById('touchControls').style.display = 'box';

        touchPause.style.display = 'block';
        touchPause.addEventListener("click", onTouchPauseClick);

        touchCameraControls.addEventListener("touchstart", onCamControlsTouch, false);
        touchCameraControls.addEventListener("touchmove", onCamControlsTouchMove, false);
        touchCameraControls.addEventListener("touchend", onCamControlsRelease, false);

        touchControlDirs.set(touchMoveForward, moveDir.forward);
        touchControlDirs.set(touchMoveBack, moveDir.backward);
        touchControlDirs.set(touchMoveLeft, moveDir.left);
        touchControlDirs.set(touchMoveRight, moveDir.right);

        touchMoveForward.addEventListener("touchstart", onMoveControlTouch, false);
        touchMoveForward.addEventListener("touchend", onMoveControlRelease, false);

        touchMoveBack.addEventListener("touchstart", onMoveControlTouch, false);
        touchMoveBack.addEventListener("touchend", onMoveControlRelease, false);

        touchMoveLeft.addEventListener("touchstart", onMoveControlTouch, false);
        touchMoveLeft.addEventListener("touchend", onMoveControlRelease, false);

        touchMoveRight.addEventListener("touchstart", onMoveControlTouch, false);
        touchMoveRight.addEventListener("touchend", onMoveControlRelease, false);

        touchToggleSeason.addEventListener("click", onToggleSeasonClick, false);
        touchToggleDayNight.addEventListener("click", onToggleDayNightClick, false);
    }
}

function onTouchPauseClick(e) {
    e.preventDefault();
    highlightTouchControl(touchPause);
    window.history.back();
    // pauseGame();
    resetTouchControl(touchPause);
}

function onCamControlsTouchMove(e) {
    e.preventDefault();
    let touch = e.changedTouches[0];
    let factor = 0.0075;
    controls.rotateCamera((touch.pageX-touchCamPos.x) * factor, (touch.pageY - touchCamPos.y ) * factor);
    touchCamPos.x = touch.pageX;
    touchCamPos.y = touch.pageY;
}

function onCamControlsTouch(e) {
    e.preventDefault();
    highlightTouchControl(touchCameraControls);
    let touch = e.changedTouches[0];
    touchCamPos.x = touch.pageX;
    touchCamPos.y = touch.pageY;
}

function onCamControlsRelease(e) {
    e.preventDefault();
    resetTouchControl(touchCameraControls);

    let touch = e.changedTouches[0];
    if (currentHighlight && ((touchCamPos.x - touch.pageX) * (touchCamPos.y - touch.pageY)) < 10) {
        evaluateAnswer(currentHighlight);
    }
}

function onMoveControlTouch(e) {
    e.preventDefault();
    let target = e.target || e.source;

    if (e.timeStamp - touchMoveTime < 250) {
        if ( canJump === true ) velocity.y += jumpInitialVel;
        canJump = false;
    }
    toggleMove(true, touchControlDirs.get(target), target);
}

function onMoveControlRelease(e) {
    e.preventDefault();
    let target = e.target || e.source;
    toggleMove(false, touchControlDirs.get(target), target);
    touchMoveTime = e.timeStamp;
}

function highlightTouchControl(control) {
    control.style.background = 'rgba(128,128,128,0.6)';
}

function resetTouchControl(control) {
    control.style.background = '';
}

function toggleMove(activate, moveDirIndex, control) {
    if (control) {
        if (activate) {
            highlightTouchControl(control);
        } else {
            resetTouchControl(control);
        }
    }
    moveActive[moveDirIndex] = activate;
}

function pauseGame() {
    gameActive = false;
    initTouchControls(true);
    updateBlocker(false);

    SFX.pause();

    animClock.stop();
    walkClock.stop();
    document.removeEventListener('click', onDocumentClick);
    touchCameraControls.removeEventListener('click', onDocumentClick);
}

function startGame() {
    requestAnimationFrame(animate);

    updateBlocker(true);

    initTouchControls(!isTouch);

    document.addEventListener('click', onDocumentClick, false);

    document.addEventListener('mousedown', onMouseDown, false);
    document.addEventListener('mousemove', onMouseMove, false);
    document.addEventListener('mouseup', onMouseUp, false);

    touchCameraControls.addEventListener('click', onDocumentClick, false);

    animClock.start();
    walkClock.start();
    gameActive = true;

    SFX.resume();

    //MSX.play(SFX.listener);
}

function updateBlocker(hide) {
    if (hide) {
        instructions.style.display = 'none';
        blocker.style.display = 'none';
    } else {
        blocker.style.display = 'block';
        instructions.style.display = '';
    }
}

function initGUI() {
    gui = new GUI( { autoPlace: false } );

    gui.useLocalStorage = true;
    gui.remember(gfxSettings);
    gui.remember(audioSettings);
    gui.remember(gamepadSettings);

    gfxFolder = gui.addFolder ("Graphics settings");

    gfxFolder.add(gfxSettings, "resolution", resolutionNames).name("Resolution").onChange(function() {
        // update resolution
        onWindowResize();
    });

    gfxFolder.add(gfxSettings, "quality", qualityNames).name("Render quality").onChange(function() {
        // update resolution
        onWindowResize();
    });

    gfxFolder.add(gfxSettings, "antiAlias").name("*Antialiasing");//.onChange(function(value) {
        // would need to reset context - so it's a bit complex
    //});

    // does not work when starting fullscreen with F11 :(
    /*
    gfxFolder.add(gfxSettings, "fullScreen").name("Full screen").onChange(function(value) {

        if (value) {
            openFullscreen();
        } else {
            closeFullscreen();
        }

        //toggleFullScreen();
    }).listen();
    */

    gfxFolder.add(gfxSettings, "shadows", 0, 3, 1).name("Shadows").onChange(function(value) {
        // update shadows
        updateShadows(value);
        preRender();
    });

    gfxFolder.add(gfxSettings, "showFPS").name("Show FPS").onChange(function(){
            updateFPSLabel();
    });

    audioFolder = gui.addFolder("Audio settings");
    audioFolder.add(audioSettings, "enabled").name("Enabled").onChange(function () {
        setMasterVolume();
    });
    audioFolder.add(audioSettings, "volume", 0, 100).name("Volume").step(1).onChange(function () {
        setMasterVolume();
    });

    controlsFolder = gui.addFolder("Gamepad settings");
    controlsFolder.add(gamepadSettings, "enabled").name("Enabled").onChange(setGamepadEnabled);
    controlsFolder.add(gamepadSettings, "moveSensitivity", 0.1, 2).step(0.1).name("Move sensitivity").onChange(function (value) {
        gpControls.moveSensitivity = value;
    });

    controlsFolder.add(gamepadSettings, "lookSensitivity", 0.1, 2).step(0.1).name("Look sensitivity").onChange(function (value) {
        gpControls.lookSensitivity = value;
    });

    if (isElectronApp) {
        gui.add(window, "close").name("Exit game");
    }

    gui.close();

    let guiContainer = document.getElementById('guiContainer');
    guiContainer.insertBefore(gui.domElement, guiContainer.firstChild);
    document.getElementById('reloadHint').style.display = 'none';

    guiContainer.addEventListener('click', e => {
        document.getElementById('reloadHint').style.display = gui.closed ? 'none' : '';
    });
}

function updateFPSLabel() {
    fpsLabel.style.display = gfxSettings.showFPS ? '' : 'none';
}

function updateNightMode(blend) {
    //if (isNight != gameSettings.nightEnabled) {
        setNight(blend);
        preRender();
    //}
}

function setGamepadEnabled() {
    if (gpControls) {
        if (gamepadSettings.enabled && !gpControls.ticking) {
            gpControls.startPolling();
        } else if (gpControls.ticking) {
            gpControls.stopPolling();
        }
    }
}

function updateShadows(value) {
    if (renderer) {
        renderer.shadowMap.enabled = (value > 0);
        switch (value) {
            case 1:
                renderer.shadowMap.type = THREE.BasicShadowMap;
                break;
            case 2:
                renderer.shadowMap.type = THREE.PCFShadowMap;
                break;
            case 3:
                renderer.shadowMap.type = THREE.PCFSoftShadowMap;
                break;
            //case 4 :
            //    renderer.shadowMap.type = THREE.VSMShadowMap;
            //    break;
        }
        renderer.shadowMap.needsUpdate = true;
    }

    if (scene) {
        scene.traverse(c => {
            if (c.receiveShadow && c.material) {
                if (c.material.length > 0) {
                    for (let mat of c.material) {
                        mat.needsUpdate = true;
                    }
                }
                else {
                    c.material.needsUpdate = true;
                }
            }
        });
    }
}

function setMasterVolume() {
    if (SFX.listener) {
        SFX.listener.setMasterVolume(audioSettings.enabled ? audioSettings.volume / 100 : 0);
    }
}

function queueSceneItem(initFunc, onLoad) {
    sceneInitFuncs.push({ func: initFunc, loadFunc: obj => {
        if (onLoad) onLoad(obj);
        processSceneInitItems(initFunc.name + '()');
    } });
}

function queueNamedSceneItem(initFunc, nameParam, onLoad) {
    sceneInitFuncs.push({ func: initFunc, name: nameParam, loadFunc: obj => {
        if (onLoad) onLoad(obj);
        processSceneInitItems(initFunc.name + '("'+ nameParam + '")');
    } });
}

function initScene() {
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x000000);

    scene.fog =  new THREE.FogExp2(0x101015, 0.00012);// new THREE.Fog(0xcccccc, 2000, 12000);// .FogExp2( 0xcccccc, 0.0003);

    hemiLight = new THREE.HemisphereLight(0xffffff, 0x000000, hemiLightIntensity);
    scene.add(hemiLight);

    mixer = new THREE.AnimationMixer(scene);

    while(lights.length < maxNum) {
        let light  = new THREE.PointLight(0x000000, 0, 1250, 2);
        scene.add(light);
        lights.push(light);
    }

}

function initObjects() {

    queueNamedSceneItem(new THREE.TextureLoader().load, './gfx/textures/sky_day.jpg', texture => {
        var skyGeo = new THREE.SphereBufferGeometry(12 * WORLD.plateSize, 160, 160); // , 0, 2*Math.PI, 0, Math.PI * 0.6);
        var skyMat = new THREE.MeshLambertMaterial({ map: texture, flatShading: true, emissive: 0x5555ff, emissiveIntensity: 0.05 }); //1

        skyMat.side = THREE.BackSide;
        skyMesh = new THREE.Mesh(skyGeo, skyMat);

        createSky();
        updateNightMode(false);
        particleSystems.push(PTFX.starsAbove(scene, 1));
    });

    queueNamedSceneItem(new THREE.TextureLoader().load, './gfx/textures/snow.jpg', texture => {
        let size = WORLD.plateSize * WORLD.plateCounter * 10;
        texture.repeat.set(size / texture.image.width, size / texture.image.height);
        texture.wrapS = THREE.MirroredRepeatWrapping;
        texture.wrapT = THREE.MirroredRepeatWrapping;
        texture.needsUpdate = true;

        let pgeo = new THREE.PlaneBufferGeometry(size, size);
        let pmat = new THREE.MeshStandardMaterial({ map: texture, roughness: 1 });
        let pmesh = new THREE.Mesh(pgeo, pmat);
        pmesh.rotateX(-Math.PI/2);
        scene.add (pmesh);
    });
}

function processSceneInitItems(debuginfo) {
    // console.log ('sceneInitItems: ' + sceneInitItems + ' - ' + debuginfo);

    if (sceneInitItems-- <= 0) {
        hideProgressBar();
        startGame();
    }

    if (sceneInitFuncs.length > 0) {
        let nextAction = sceneInitFuncs.splice(0, 1)[0];
        if (nextAction.name) {
            nextAction.func(nextAction.name, nextAction.loadFunc, onProgress, onError);
        } else {
            nextAction.func(nextAction.loadFunc, onProgress, onError);
        }
    }
}

function addSun() {
    dirLight = new THREE.DirectionalLight(0x222244, dirLightIntensity); //1);
    dirLight.position.set(2500, 5000, 1000);
    dirLight.castShadow = true;
    let size = WORLD.plateSize * WORLD.plateCounter;
    dirLight.shadow.camera.left = -size;
    dirLight.shadow.camera.right = size;
    dirLight.shadow.camera.bottom = -size;
    dirLight.shadow.camera.top = size;
    dirLight.shadow.camera.near = 3800;
    dirLight.shadow.camera.far = 7800;
    dirLight.shadow.bias = 0.0001;

    // scene.add (new THREE.CameraHelper(light.shadow.camera));

    var SHADOW_MAP_WIDTH = 4096, SHADOW_MAP_HEIGHT = 4096;
    dirLight.shadow.mapSize.width = SHADOW_MAP_WIDTH;
    dirLight.shadow.mapSize.height = SHADOW_MAP_HEIGHT;
    scene.add(dirLight);

    //ANIM.blendProperty(mixer, dirLight, 'intensity', dirLightIntensity, 3);

    //let action = mixer.clipAction(ANIM.createHighlightAnimation(1, 1), dirLight);

    let sphereGeo = new THREE.SphereBufferGeometry(250, 32, 32);
    let sphereMat = new THREE.MeshStandardMaterial({ color: 0x000000, emissive: 0xffffdd, emissiveIntensity: 1 , roughness: 1});
    let sphere = new THREE.Mesh(sphereGeo, sphereMat);

    sphere.position.copy(dirLight.position).normalize().multiplyScalar(11.9 * WORLD.plateSize);
    scene.add(sphere);
}

function createSky() {
    scene.add(skyMesh);
    addSun();
}

function onProgress( xhr ) {
    if ( xhr.lengthComputable ) {
        updateProgressBar( xhr.loaded / xhr.total );
        // console.log( Math.round( xhr.loaded / xhr.total * 100, 2 ) + '% downloaded' );
    }
}

function onError() {

    var message = "Error loading model";
    progressBarDiv.innerText = message;
    console.log( message );

}

function showProgressBar() {

    if (!progressBarDiv) {
        progressBarDiv = document.createElement( 'div' );
        progressBarDiv.innerText = "Loading...";
        progressBarDiv.style.fontSize = "3em";
        progressBarDiv.style.color = "#888";
        progressBarDiv.style.display = "block";
        progressBarDiv.style.position = "absolute";
        progressBarDiv.style.top = "50%";
        progressBarDiv.style.width = "100%";
        progressBarDiv.style.textAlign = "center";
    }

    document.body.appendChild( progressBarDiv );

    animClock.stop();
    walkClock.stop();

}

function hideProgressBar() {

    if (document.body.contains(progressBarDiv)) {
        document.body.removeChild( progressBarDiv );
    }

    animClock.start();
    walkClock.start();
}

function updateProgressBar( fraction ) {
    progressBarDiv.innerText = 'Loading... ' + Math.round( ((sceneTotalItems - sceneInitItems + fraction) / sceneTotalItems) * 100, 2 ) + '%';
}

function onWindowResize(update = true) {

    let res = { x: resolutions[gfxSettings.resolution].x, y: resolutions[gfxSettings.resolution].y };

    if (res.x == 0) {
        res.x = window.innerWidth ;
    }
    if (res.y == 0) {
        res.y = window.innerHeight;
    }

    res.x = Math.min(res.x, window.innerWidth);
    res.y = Math.min(res.y, window.innerHeight);

    camera.aspect = res.x / res.y;
    camera.updateProjectionMatrix();

    // renderer.setPixelRatio(window.devicePixelRatio * scale);
    let scale = gfxSettings.quality;

    /*
    if (composer) {
        composer.setSize( res.x / scale, res.y / scale, false );
    }
    */
    renderer.setSize( res.x / scale, res.y / scale, false );
    renderer.domElement.style.width = renderer.domElement.width * scale + 'px';
    renderer.domElement.style.height = renderer.domElement.height * scale + 'px';

    var style = window.getComputedStyle(renderer.domElement);
    fpsLabel.style.marginLeft = style.marginLeft;
    fpsLabel.style.marginTop = style.marginTop;

    fpsLabel.style.fontSize = res.y / (40 - (30 * (1 - res.y / 1200))) + "px"; // non-linear scale for lower res.
    fpsLabel.style.lineHeight = fpsLabel.style.fontSize;

    gfxSettings.fullScreen = (window.screen.width == window.innerWidth); // API not working when triggered with F11

    if (update) {
        preRender();
    }
}


function onToggleSeasonClick( ) {
    highlightTouchControl(touchToggleSeason);
    toggleSeason();
    resetTouchControl(touchToggleSeason);
}

function onToggleDayNightClick( ) {
    highlightTouchControl(touchToggleDayNight);
    toggleDayNight();
    resetTouchControl(touchToggleDayNight);
}

function onMouseDown(e) {
    if (e.button == 2) {
        mouseMove = true;
        mouseMovePos.x = e.offsetX;
        mouseMovePos.y = e.offsetY;
    }
}

function onMouseUp(e) {
    if (e.button == 2) {
        mouseMove = false;
    }
}

function onMouseMove(e) {
    if (mouseMove) {
        let factor = 0.0075;
        controls.rotateCamera((e.offsetX-mouseMovePos.x) * factor, (e.offsetY - mouseMovePos.y ) * factor);
        mouseMovePos.x = e.offsetX;
        mouseMovePos.y = e.offsetY;
    }
}

function onDocumentClick( e ) {
    e.preventDefault();

    var targetZ = Math.random() * 500 + 750;

    var vec = new THREE.Vector3().set(
        ( e.clientX / window.innerWidth ) * 2 - 1,
        - ( e.clientY / window.innerHeight ) * 2 + 1,
        0.5 );

    vec.unproject( camera );
    vec.sub( camera.position ).normalize();

    var distance = targetZ;// - camera.position.z / vec.z;
    var pos = new THREE.Vector3().copy( camera.position ).add( vec.multiplyScalar( distance ) );

    if (pos.y > 300 && particleSystems.length < 26) {

        let light = lights.splice(0, 1)[0];
        lights.push(light);

        let color = 0xffff66;

        light.position.copy(pos);
        light.color.setHex(color);

        let size = Math.random() * 100 + 50;

        light.intensity = 1.2 * size/100;
        ANIM.blendProperty(mixer, light, 'intensity', 0, 1.5);

        particleSystems.push(PTFX.firework(scene, new THREE.Color(color), size, pos));

        if (light.sound) {
            if (light.sound.isPlaying) light.sound.stop();
            light.sound.volume = size/100;

            light.sound.play(distance / 5000);
        }
    }
}

function animate() {

    if ( gameActive ) {

        requestAnimationFrame( animate );

        let animDelta = animClock.getDelta();
        let walkDelta = walkClock.getDelta();

        if (gfxSettings.showFPS) {
            if (fps.length > 25) fps.splice(0, 1);
                fps.push(1/ Math.max(animDelta, walkDelta));
                let currFps = 0;
                for (let idx = 0; idx < fps.length; idx++) {
                    currFps += fps[idx];
            }
            currFps = Math.round(currFps / fps.length);
            fpsLabel.innerHTML = currFps + " FPS";
        }

        mixer.update( animDelta );

        updateControls( walkDelta );

        particleSystems = particleSystems.filter(function(ps) {
            ps.update(animDelta);
            return !ps.removeAndDisposeIfFinished();
        });

        render();
    }
}


function updateControls(delta) {

    velocity.x -= velocity.x * 10.0 * delta;
    velocity.z -= velocity.z * 10.0 * delta;
    velocity.y -= 9.8 * 100.0 * delta; // 100.0 = mass

    direction.z = Number(moveActive[moveDir.forward]) - Number(moveActive[moveDir.backward]);
    direction.x = Number(moveActive[moveDir.right]) - Number(moveActive[moveDir.left]);
    direction.normalize(); // this ensures consistent movements in all directions

    if (moveActive[moveDir.forward] || moveActive[moveDir.backward]) {
        velocity.z -= direction.z * 4000.0 * delta;
    }
    if (moveActive[moveDir.left] || moveActive[moveDir.right])
        velocity.x -= direction.x * 4000.0 * delta;
    /*
    if ( onObject === true ) {

        velocity.y = Math.max( 0, velocity.y );
        canJump = true;

    }
    */

    let oldPos = controls.getObject().position;
    oldPos = new THREE.Vector3(oldPos.x, oldPos.y, oldPos.z);

    controls.moveRight(-velocity.x * delta);
    controls.moveForward(-velocity.z * delta);
    controls.getObject().position.y += (velocity.y * delta); // new behavior
    if (controls.getObject().position.y < playerCamHeight) {
        velocity.y = 0;
        controls.getObject().position.y = playerCamHeight;
        canJump = true;
    }

    let pos = controls.getObject().position;

    if (pos.x > absMaxDistance) {
        pos.x = absMaxDistance;
    } else if (pos.x < -absMaxDistance) {
        pos.x = -absMaxDistance;
    }
    if (pos.z > absMaxDistance) {
        pos.z = absMaxDistance;
    } else if (pos.z < -absMaxDistance) {
        pos.z = -absMaxDistance;
    }
}

function setNight(blend) {
    let nightChangeDuration = 1;

    isNight = true;

    if (dirLight) {

        if (blend) {
            ANIM.blendColor(mixer, dirLight, isNight ? 0x222244 : 0xffffff, nightChangeDuration);
        } else {
            dirLight.color.setHex(isNight ? 0x222244 : 0xffffff);
        }
    }

    if (hemiLight) {
        if (blend) {
            ANIM.blendProperty(mixer, hemiLight, 'intensity', hemiLightIntensity * (isNight ? 0.1 : 1), nightChangeDuration);
        } else {
            hemiLight.intensity = hemiLightIntensity * (isNight ? 0.1 : 1);
        }
    }

    if (skyMesh) {
        if (blend) {
            ANIM.blendProperty(mixer, skyMesh.material, 'emissiveIntensity', (isNight ? 0.05 : 1), nightChangeDuration);
        } else {
            skyMesh.material.emissiveIntensity = (isNight ? 0.05 : 1);// (isNight ? 0.1 : 1);
        }
    }

    for (let light of lights) {
        light.visible = isNight;
    }

    fpsLabel.style.color = (isNight ? "gold" : "black");
}

function preRender() {
    if (sceneInitItems<= 0) {
        render();
    }
}

function render() {
    // checkIntersect();
    //composer.render(scene, camera);

    renderer.render( scene, camera );
}

/* View in fullscreen */
function openFullscreen() {

    if (document.body.requestFullscreen) {
        document.body.requestFullscreen();
    } else if (document.body.mozRequestFullScreen) { /* Firefox */
        document.body.mozRequestFullScreen();
    } else if (document.body.webkitRequestFullscreen) { /* Chrome, Safari and Opera */
        document.body.webkitRequestFullscreen();
    } else if (document.body.msRequestFullscreen) { /* IE/Edge */
        document.body.msRequestFullscreen();
    }
}

function isFullScreen() {
    var doc = window.document;
    return (doc.fullscreenElement || doc.mozFullScreenElement || doc.webkitFullscreenElement || doc.msFullscreenElement);
}
