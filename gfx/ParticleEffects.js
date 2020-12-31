import '../web_modules/partykals/dist/partykals.js';
import * as WORLD from './World.js';

const size = WORLD.plateCounter * WORLD.plateSize;

export const ptfxType = {
    none: 0,
    stars: 1,
    firework: 2
}

export const starsTtl = 10;

export function starsAbove(scene, intensity = 1.0) {

    let tex = new THREE.TextureLoader().load( './gfx/textures/firefly.png' );

    let system = new Partykals.ParticlesSystem({
        container: scene,
        particles: {
            globalSize: 60, // new Partykals.Randomizers.MinMaxRandomizer(15, 35),
            texture: tex,
            //alpha: 1,
            //color: new THREE.Color(0xeeeeee),
            startColor: new THREE.Color(0xffffff),
            endColor: new THREE.Color(0x222222),
            startColorChangeAt: starsTtl * 0.75,
            startAlpha: 0,
            endAlpha: 1,
            startAlphaChangeAt : 0,
            blending: 'blend',
            ttl: starsTtl,
            ttlExtra : starsTtl,
            offset: new Partykals.Randomizers.SphereRandomizer(7495, 7000) //, new THREE.Vector3(1, 1, 1), new THREE.Vector3(-1, 0, -1), new THREE.Vector3(1, 1, 1))
        },
        system: {
            particlesCount: 5000 * intensity,
            emitters: new Partykals.Emitter({
                onSpawnBurst: 500 * intensity,
                onInterval: new Partykals.Randomizers.MinMaxRandomizer(250 / starsTtl * intensity, 500 / starsTtl * intensity),
                interval: 1, //new Partykals.Randomizers.MinMaxRandomizer(0, 0.25),
                detoretingMinTtl: 1
            }),
            speed: 1,
            perspective: true,
            scale: 500,
            depthWrite: false
        }
    });

    system.type = ptfxType.stars;
    return system;
}

export function generateWind(maxValue) {
    return new Partykals.Randomizers.SphereRandomizer(maxValue, 1, new THREE.Vector3(1, 1, 1), new THREE.Vector3(-1, 0, -1), new THREE.Vector3(1, 0, 1)).generate();
}

export function firework(parent, startColor, size, pos) {
    let endColor = new THREE.Color().copy(startColor);
    endColor.r *= 0.3;
    endColor.g *= 0.1;
    endColor.b *= 0.1;

    let system = new Partykals.ParticlesSystem({
        container: parent,
        particles: {
            globalSize: 15,
            //texture: tex,
            //alpha: 1,
            startColor: startColor,
            endColor: endColor,
            startAlpha: 1,
            endAlpha: 0,
            //startAlphaChangeAt : 0,
            blending: 'blend',
            velocity: new Partykals.Randomizers.SphereRandomizer(1 * size, 0.8 * size),
            velocityBonus: new THREE.Vector3(0, 0, 0),
            gravity: -10,
            ttl: 0.5,
            ttlExtra : 3,
            offset: pos
        },
        system: {
            ttl: 0.1,
            particlesCount: 2000,
            emitters: new Partykals.Emitter({
                onSpawnBurst: 2000
            }),
            speed: 1,
            perspective: true,
            scale: 100,
            depthWrite: false
        }
    });

    system.type = ptfxType.sstars;
    return system;
}
