import * as THREE from 'three';
import html2canvas from 'html2canvas';
import vertexShader from '../shaders/vertex.glsl?raw';
import fragmentShader from '../shaders/fragment.glsl?raw';
import displayShader from '../shaders/display.glsl?raw';


export async function initRipple() {
  const renderCanvas = document.getElementById('ripple-canvas') as HTMLCanvasElement;
  const hiddenDiv = document.getElementById('offscreen-division') as HTMLElement;
  if (!renderCanvas || !hiddenDiv) return;

  const divCanvas = await html2canvas(hiddenDiv);
  const texture = new THREE.CanvasTexture(divCanvas);

  let newCanvas = document.createElement('canvas');
  newCanvas.id = 'ripple-canvas';
  newCanvas.className = 'w-dvw h-dvh';
  renderCanvas.parentNode?.replaceChild(newCanvas, renderCanvas);

  let pNewCanvas = document.createElement('canvas');
  pNewCanvas.id = 'pressure-ripple-canvas';
  pNewCanvas.className = 'w-dvw h-dvh';
  renderCanvas.parentNode?.appendChild(pNewCanvas);

  const renderer = new THREE.WebGLRenderer({ canvas: newCanvas, antialias: false });
  const pRenderer = new THREE.WebGLRenderer({ canvas: pNewCanvas, antialias: false });

  renderer.setSize(window.innerWidth, window.innerHeight);
  pRenderer.setSize(window.innerWidth, window.innerHeight);

  const scene = new THREE.Scene();
  const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);

  const pScene = new THREE.Scene();
  const pCamera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);

  const resolution = new THREE.Vector2(window.innerWidth, window.innerHeight);

  const rt1 = new THREE.WebGLRenderTarget(resolution.x, resolution.y);
  const rt2 = new THREE.WebGLRenderTarget(resolution.x, resolution.y);
  let prevRT = rt1;
  let currRT = rt2;

  const uniforms = {
    iResolution: { value: new THREE.Vector2(window.innerWidth, window.innerHeight) },
    iTime: { value: 0 },
    iMouse: { value: new THREE.Vector4(0,0,0,0) },
    iChannel1: { value: prevRT.texture },
    iChannel0: { value: texture }
};

  const material = new THREE.ShaderMaterial({
    vertexShader,
    fragmentShader:displayShader,
    uniforms
  });

  const pressure = new THREE.ShaderMaterial({
    vertexShader,
    fragmentShader,
    uniforms
  });

  const pressBuffer = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), pressure);
  pScene.add(pressBuffer);

  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), material);
  scene.add(mesh);

  window.addEventListener('mousemove', (e) => {
    uniforms.iMouse.value.x = e.clientX;
    uniforms.iMouse.value.y = window.innerHeight - e.clientY;
    uniforms.iMouse.value.z = 1;
  });

  let clock = new THREE.Clock();

  function animate() {
    uniforms.iTime.value = clock.getElapsedTime();
    uniforms.iChannel1.value = prevRT.texture;

    renderer.setRenderTarget(currRT);
    renderer.render(scene, camera);
    renderer.setRenderTarget(null);

    [prevRT, currRT] = [currRT, prevRT];

    pRenderer.setRenderTarget(prevRT);
    pRenderer.render(scene, pCamera);

    mesh.material.uniforms.iChannel1.value = prevRT.texture;
    renderer.render(scene, camera);

    requestAnimationFrame(animate);
  }

  animate();
}