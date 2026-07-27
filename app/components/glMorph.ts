import * as THREE from "three";

// Displacement-морф между двумя картинками на canvas: пиксели A «перетекают» в B.
// Рендер по requestAnimationFrame нам не нужен — рисуем в setProgress (из scroll).

export interface GLMorph {
  setProgress: (p: number) => void;
  resize: () => void;
  dispose: () => void;
}

function makeNoiseTexture(size: number): THREE.CanvasTexture {
  const small = document.createElement("canvas");
  small.width = small.height = 16;
  const sctx = small.getContext("2d")!;
  const id = sctx.createImageData(16, 16);
  for (let i = 0; i < id.data.length; i += 4) {
    const v = Math.random() * 255;
    id.data[i] = id.data[i + 1] = id.data[i + 2] = v;
    id.data[i + 3] = 255;
  }
  sctx.putImageData(id, 0, 0);
  const big = document.createElement("canvas");
  big.width = big.height = size;
  const bctx = big.getContext("2d")!;
  bctx.imageSmoothingEnabled = true;
  bctx.drawImage(small, 0, 0, size, size);
  const tex = new THREE.CanvasTexture(big);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  return tex;
}

const VERT = `varying vec2 vUv; void main(){ vUv = uv; gl_Position = vec4(position,1.0); }`;

const FRAG = `
  precision highp float;
  varying vec2 vUv;
  uniform sampler2D uA;
  uniform sampler2D uB;
  uniform sampler2D uDisp;
  uniform float uProgress;
  uniform float uIntensity;
  uniform vec2 uScreen;
  uniform vec2 uResA;
  uniform vec2 uResB;
  vec2 coverUv(vec2 uv, vec2 img) {
    float sA = uScreen.x / uScreen.y;
    float iA = img.x / img.y;
    vec2 s = sA > iA ? vec2(1.0, iA / sA) : vec2(sA / iA, 1.0);
    return (uv - 0.5) * s + 0.5;
  }
  void main() {
    float p = smoothstep(0.0, 1.0, uProgress);
    float d = texture2D(uDisp, vUv).r;
    vec2 dispA = vec2(d) * uIntensity * p;
    vec2 dispB = vec2(d) * uIntensity * (1.0 - p);
    vec4 ca = texture2D(uA, coverUv(vUv + dispA, uResA));
    vec4 cb = texture2D(uB, coverUv(vUv - dispB, uResB));
    gl_FragColor = mix(ca, cb, p);
  }
`;

export function createGLMorph(
  canvas: HTMLCanvasElement,
  texAUrl: string,
  texBUrl: string,
  intensity = 0.3
): GLMorph {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: false });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  const scene = new THREE.Scene();
  const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
  const loader = new THREE.TextureLoader();

  const uniforms = {
    uA: { value: loader.load(texAUrl, (t) => uniforms.uResA.value.set(t.image.width, t.image.height)) },
    uB: { value: loader.load(texBUrl, (t) => uniforms.uResB.value.set(t.image.width, t.image.height)) },
    uDisp: { value: makeNoiseTexture(256) },
    uProgress: { value: 0 },
    uIntensity: { value: intensity },
    uScreen: { value: new THREE.Vector2(1, 1) },
    uResA: { value: new THREE.Vector2(1920, 1080) },
    uResB: { value: new THREE.Vector2(1920, 1080) },
  };
  (uniforms.uA.value as THREE.Texture).minFilter = THREE.LinearFilter;
  (uniforms.uB.value as THREE.Texture).minFilter = THREE.LinearFilter;

  const material = new THREE.ShaderMaterial({ uniforms, vertexShader: VERT, fragmentShader: FRAG });
  const quad = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), material);
  scene.add(quad);

  const render = () => renderer.render(scene, camera);

  const resize = () => {
    const w = window.innerWidth;
    const h = window.innerHeight;
    renderer.setSize(w, h, false);
    uniforms.uScreen.value.set(w, h);
    render();
  };
  resize();

  return {
    setProgress(p: number) {
      uniforms.uProgress.value = p;
      render();
    },
    resize,
    dispose() {
      quad.geometry.dispose();
      material.dispose();
      (uniforms.uA.value as THREE.Texture).dispose();
      (uniforms.uB.value as THREE.Texture).dispose();
      uniforms.uDisp.value.dispose();
      renderer.dispose();
    },
  };
}
