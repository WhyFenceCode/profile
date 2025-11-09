import * as THREE from 'three';
import html2canvas from 'html2canvas';
import vertexShader from '../shaders/vertex.glsl?raw';
import fragmentShader from '../shaders/fragment.glsl?raw';
import displayShader from '../shaders/display.glsl?raw';


export async function initRipple() {
  //Get Current Canvases
  const renderCanvas = document.getElementById('ripple-canvas') as HTMLCanvasElement;
  const hiddenDiv = document.getElementById('offscreen-division') as HTMLElement;
  if (!renderCanvas || !hiddenDiv) return;

  //Build a background texture from the html (TODO fix flex it breaks here)
  const divCanvas = await html2canvas(hiddenDiv);
  const texture = new THREE.CanvasTexture(divCanvas);

  //Ensure a clean canvas by replacing the existing one
  let newCanvas = document.createElement('canvas');
  newCanvas.id = 'ripple-canvas';
  newCanvas.className = 'w-dvw h-dvh';
  renderCanvas.parentNode?.replaceChild(newCanvas, renderCanvas);

  //Write a storage canvas for the effect buffer
  let pNewCanvas = document.createElement('canvas');
  pNewCanvas.id = 'pressure-ripple-canvas';
  pNewCanvas.className = 'w-dvw h-dvh';
  newCanvas.parentNode?.appendChild(pNewCanvas);

  //Set up both renders
  const renderer = new THREE.WebGLRenderer({ canvas: newCanvas, antialias: false });
  const pRenderer = new THREE.WebGLRenderer({ canvas: pNewCanvas, antialias: false });
  renderer.setSize(window.innerWidth, window.innerHeight);
  pRenderer.setSize(window.innerWidth, window.innerHeight);

  //Build both scenes and respective Orthographic Cameras
  const scene = new THREE.Scene();
  const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
  const pScene = new THREE.Scene();
  const pCamera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);

  const resolution = new THREE.Vector2(window.innerWidth, window.innerHeight);

  //Build two render targets
  const rt1 = new THREE.WebGLRenderTarget(resolution.x, resolution.y);
  const rt2 = new THREE.WebGLRenderTarget(resolution.x, resolution.y);
  let mainRT = rt1;
  let vRT = rt2;

  //Set Uniforms
  const uniforms = {
    iResolution: { value: new THREE.Vector2(window.innerWidth, window.innerHeight) },
    iTime: { value: 0 },
    iMouse: { value: new THREE.Vector4(0,0,0,0) },
    iChannel1: { value: vRT.texture },
    iChannel0: { value: texture }
  };

  //Display Material
  const material = new THREE.ShaderMaterial({
    vertexShader,
    fragmentShader:displayShader,
    uniforms
  });

  //Simulation Material
  const pressure = new THREE.ShaderMaterial({
    vertexShader,
    fragmentShader,
    uniforms
  });

  //Build both capture meshes
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), material);
  scene.add(mesh);
  const pMesh = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), pressure);
  pScene.add(pMesh);

  //Alter uniforms with mouse input
  window.addEventListener('mousemove', (e) => {
    uniforms.iMouse.value.x = e.clientX;
    uniforms.iMouse.value.y = window.innerHeight - e.clientY;
    uniforms.iMouse.value.z = 1;
  });

  let clock = new THREE.Clock();

  //Render and write all buffers
  function animate() {
    uniforms.iTime.value = clock.getElapsedTime();
    uniforms.iChannel1.value = vRT.texture;
    renderer.setRenderTarget(mainRT);
    renderer.render(scene, camera);
    renderer.setRenderTarget(null);

    pRenderer.setRenderTarget(vRT);
    pRenderer.render(scene, pCamera);
    pRenderer.setRenderTarget(null);

    uniforms.iChannel1.value = vRT.texture;
    renderer.render(scene, camera);


    requestAnimationFrame(animate);
  }

  animate();
}