import * as THREE from "three";
import { VRButton } from "./VRButton"; // this seems to be missing in https://js13kgames.com/webxr-src/2020/three.js

let renderer: THREE.WebGLRenderer;
let camera: THREE.Camera;
let cameraRig: THREE.Group;

export function initRenderer(): [THREE.WebGLRenderer, THREE.Camera] {
  cameraRig = new THREE.Group();

  camera = new THREE.PerspectiveCamera(90, window.innerWidth / window.innerHeight, 0.1, 1000);
  camera.position.y = 1.75;
  camera.userData.rig = cameraRig;
  cameraRig.add(camera);

  renderer = new THREE.WebGLRenderer();
  renderer.setSize(window.innerWidth, window.innerHeight);

  document.body.appendChild(renderer.domElement);
  document.body.appendChild(VRButton.createButton(renderer));
  renderer.xr.enabled = true;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  return [renderer, camera];
}

export function renderScene(scene: THREE.Scene) {
  renderer.render(scene, camera);
}
