import * as THREE from "three";
import { initRenderer } from "./renderer";

export interface Hand {
  grip: THREE.Group;
  selecting: boolean;
  wasSelecting: boolean;
  squeezing: boolean;
  wasSqueezing: boolean;
}

export interface Engine {
  renderer: THREE.WebGLRenderer;
  scene: THREE.Scene;
  camera: THREE.Camera;
  rig: THREE.Group;
  left: Hand;
  right: Hand;
}

export function initEngine() {
  const [renderer, camera] = initRenderer();
  const scene = new THREE.Scene();
  scene.add(camera.userData.rig);

  const controller1 = renderer.xr.getController(0);
  controller1.addEventListener("connected", function (event) {});
  const controller1Grip = renderer.xr.getControllerGrip(0);
  camera.userData.rig.add(controller1Grip);

  const left = {
    grip: controller1Grip,
    selecting: false,
    squeezing: false,
    wasSelecting: false,
    wasSqueezing: false,
  };

  controller1.addEventListener("selectstart", () => {
    left.selecting = true;
  });

  controller1.addEventListener("selectend", () => {
    left.selecting = false;
  });

  const controller2 = renderer.xr.getController(1);
  controller2.addEventListener("connected", function (event) {});
  const controller2Grip = renderer.xr.getControllerGrip(1);
  camera.userData.rig.add(controller2Grip);

  const right = {
    grip: controller2Grip,
    selecting: false,
    squeezing: false,
    wasSelecting: false,
    wasSqueezing: false,
  };

  controller2.addEventListener("selectstart", () => {
    right.selecting = true;
  });

  controller2.addEventListener("selectend", () => {
    right.selecting = false;
  });

  return {
    renderer,
    camera,
    scene,
    rig: camera.userData.rig,
    left,
    right,
  };
}
