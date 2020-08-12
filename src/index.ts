import * as THREE from "three";
import { VRButton } from "./VRButton"; // this seems to be missing in https://js13kgames.com/webxr-src/2020/three.js

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(90, window.innerWidth / window.innerHeight, 0.1, 1000);

const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);
document.body.appendChild(VRButton.createButton(renderer));
renderer.xr.enabled = true;

const geometry = new THREE.BoxGeometry();
const material = new THREE.MeshLambertMaterial({ color: Math.random() * 0xffffff });
const cube = new THREE.Mesh(geometry, material);
cube.position.z = -5;
scene.add(cube);

scene.add(new THREE.HemisphereLight(0x606060, 0x404040));

const light = new THREE.DirectionalLight(0xffffff);
light.position.set(1, 1, 1).normalize();
scene.add(light);

// eslint-disable-next-line
const controller1 = renderer.xr.getController(0);
const controller2 = renderer.xr.getController(1);
// eslint-disable-next-line
controller2.addEventListener("connected", function (event) {});

const controller1Grip = renderer.xr.getControllerGrip(0);
controller1Grip.add(createControllerModel());
scene.add(controller1Grip);

const controller2Grip = renderer.xr.getControllerGrip(1);
controller2Grip.add(createControllerModel());
scene.add(controller2Grip);

renderer.setAnimationLoop(() => {
  cube.rotation.x += 0.01;
  cube.rotation.y += 0.01;
  renderer.render(scene, camera);
});

function createControllerModel() {
  const geometry = new THREE.BoxGeometry();
  const material = new THREE.MeshLambertMaterial({ color: 0xffffff });
  const cube = new THREE.Mesh(geometry, material);
  cube.scale.set(0.07, 0.07, 0.07);
  return cube;
}
