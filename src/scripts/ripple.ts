import * as THREE from 'three';
import html2canvas from 'html2canvas';
import vertexShader from '../shaders/vertex.glsl?raw';
import fragmentShader from '../shaders/fragment.glsl?raw';

export async function initRipple() {
  const canvas = document.getElementById('ripple-canvas');
  const hiddenDiv = document.getElementById('offscreen-division');
  if (!canvas || !hiddenDiv) return;

  const divCanvas = await html2canvas(hiddenDiv);
  const texture = new THREE.CanvasTexture(divCanvas);

  const renderer = new THREE.WebGLRenderer({ canvas });
  renderer.setSize(window.innerWidth, window.innerHeight);

  const scene = new THREE.Scene();
  const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);

  const uniforms = {
    iResolution: { value: new THREE.Vector2(window.innerWidth, window.innerHeight) },
    iTime: { value: 0.0 },
    iChannel0: { value: texture }
  };

  const material = new THREE.ShaderMaterial({
    vertexShader,
    fragmentShader,
    uniforms
  });

  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), material);
  scene.add(mesh);

  function animate(time:number) {
    uniforms.iTime.value = time * 0.001;
    renderer.render(scene, camera);
    requestAnimationFrame(animate);
  }

  animate(0);
}