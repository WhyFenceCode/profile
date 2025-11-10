import * as THREE from 'three';
import html2canvas from 'html2canvas';
import simVertexShader from '../shaders/simulationVertex.glsl?raw';
import dspVertexShader from '../shaders/displayVertex.glsl?raw';
import simFragmentShader from '../shaders/simulationFragment.glsl?raw';
import dspFragmentShader from '../shaders/displayFragment.glsl?raw';

export async function rippleAnimation(){

  const dspScene = new THREE.Scene();
  const simScene = new THREE.Scene();

  const camera = new THREE.OrthographicCamera(-1, 1, 2, -1, 0, 1);

  const renderer = new THREE.WebGLRenderer({
    antialias: false,
    alpha: true,
    preserveDrawingBuffer: true,
  });

  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(window.innerWidth, window.innerHeight);

  const placeholderCanvas = document.getElementById('ripple-canvas') as HTMLCanvasElement;
  if (!placeholderCanvas) {
    console.warn("failed to find placeholder canvas");
    return;
  }

  const outputCanvas = placeholderCanvas.parentNode?.replaceChild(renderer.domElement, placeholderCanvas);

  if (!outputCanvas) {
    console.warn("failed to make output canvas");
    return;
  }
  outputCanvas.className = 'w-dvw h-dvh';

  const mouse = new THREE.Vector3();
  let frame = 0;

  const width = window.innerWidth * window.devicePixelRatio;
  const height = window.innerHeight * window.devicePixelRatio;

  const renderOptions = {
    format: THREE.RGBAFormat,
    type: THREE.FloatType,
    minFilter: THREE.LinearFilter,
    magFilter: THREE.LinearFilter,
    stencilBuffer: false,
    depthBuffer: false,
  };

  let targetA = new THREE.WebGLRenderTarget(width, height, renderOptions);
  let targetB = new THREE.WebGLRenderTarget(width, height, renderOptions);

  const simulatedMaterial = new THREE.ShaderMaterial({
    uniforms: {
      textureA: {value:null},
      mouse: {value:mouse},
      resolution: {value: new THREE.Vector2(width, height)},
      time: {value: 0},
      frame: {value: 0},
    },
    vertexShader: simVertexShader,
    fragmentShader: simFragmentShader,
  });

  const displayMaterial = new THREE.ShaderMaterial({
    uniforms: {
      textureA: {value: null},
      textureB: {value: null}
    },
    vertexShader: dspVertexShader,
    fragmentShader: dspFragmentShader,
  });

  const plane = new THREE.PlaneGeometry(2, 2);
  const simPlane = new THREE.Mesh(plane, simulatedMaterial);
  const dspPlane = new THREE.Mesh(plane, displayMaterial);

  simScene.add(simPlane);
  dspScene.add(dspPlane);

  const hiddenDiv = document.getElementById('offscreen-division') as HTMLElement;
  if (!hiddenDiv) return;
  let divCanvas = await html2canvas(hiddenDiv);
  let backgroundTexture = new THREE.CanvasTexture(divCanvas);  

  backgroundTexture.minFilter = THREE.LinearFilter;
  backgroundTexture.magFilter = THREE.LinearFilter;
  backgroundTexture.format = THREE.RGBAFormat;

  window.addEventListener("resize", () => resizeRenderers());

  async function resizeRenderers() {
    const newWidth = window.innerWidth * window.devicePixelRatio;
    const newHeight = window.innerHeight * window.devicePixelRatio;
  
    renderer.setSize(window.innerWidth, window.innerHeight);
    targetA.setSize(newWidth, newHeight);
    targetB.setSize(newWidth, newHeight);

    divCanvas = await html2canvas(hiddenDiv);
    backgroundTexture = new THREE.CanvasTexture(divCanvas);

    backgroundTexture.needsUpdate = true;
  }

  renderer.domElement.addEventListener("mousemove", (e) => {
    mouse.x = e.clientX * window.devicePixelRatio;
    mouse.y = (window.innerHeight - e.clientY) * window.devicePixelRatio;
  });

  renderer.domElement.addEventListener('mousedown', () => {
    console.log("mouse pressed");
    mouse.z = 1.0;
  });

  renderer.domElement.addEventListener('mouseup', () => {
    console.log("mouse released");
    mouse.z = 0.0;
  });

  renderer.domElement.addEventListener("mouseleave", () => {
    mouse.set(0, 0, 0);
  });

  const animate = () => {
    simulatedMaterial.uniforms.frame.value = frame++;
    simulatedMaterial.uniforms.time.value = performance.now() / 1000;
  
    simulatedMaterial.uniforms.textureA.value = targetA.texture;
    renderer.setRenderTarget(targetB);
    renderer.render(simScene, camera);

    displayMaterial.uniforms.textureA.value = targetB.texture;
    displayMaterial.uniforms.textureB.value = backgroundTexture;

    renderer.setRenderTarget(null);
    renderer.render(dspScene, camera);

    const targetTemp = targetA;
    targetA = targetB;
    targetB = targetTemp;

    requestAnimationFrame(animate);
  }

  console.log("started animation");

  requestAnimationFrame(animate);
}