import * as THREE from "three";
import { VRButton } from "./VRButton"; // this seems to be missing in https://js13kgames.com/webxr-src/2020/three.js
import { createPlane, createCorridor, createHand, createControllerModel } from "./geometries";
import { Vector2, Vector3 } from "three";
import { initRenderer, renderScene } from "./renderer";

const renderer = initRenderer();
const scene = createScene();
const hubs = createHubs(scene);

function createScene() {
  const scene = new THREE.Scene();

  const geometry = new THREE.BoxGeometry();
  const material = new THREE.MeshLambertMaterial({ color: 0xff6633 });
  const cube = new THREE.Mesh(geometry, material);
  cube.position.z = -4;
  cube.position.y = 1;
  cube.castShadow = true;
  scene.add(cube);

  const corridorGeometry = createCorridor();
  const corridorMaterial = new THREE.MeshLambertMaterial({ color: 0xcccccc, side: THREE.BackSide });

  const corridor = new THREE.Mesh(corridorGeometry, corridorMaterial);
  scene.add(corridor);
  corridor.position.z = -5;
  corridor.receiveShadow = true;

  scene.add(new THREE.HemisphereLight(0x606080, 0x404060));

  const light = new THREE.DirectionalLight(0xffffff);
  light.position.set(0.1, 1, 0.1).normalize();
  light.castShadow = true;
  light.shadow.mapSize.set(1024, 1024);
  scene.add(light);

  return scene;
}

function createHubs(scene: THREE.Scene) {
  const hubPositions = [
    new THREE.Vector3(-1, 1, -3),
    new THREE.Vector3(1, 1.5, -2),
    new THREE.Vector3(0.5, 1, -0.5),
    new THREE.Vector3(0.0, 0.5, 0),
    new THREE.Vector3(-0.5, 1, -0.5),
  ];

  const geometry = new THREE.BoxGeometry();

  const hubs = hubPositions.map((pos) => {
    const hubMaterial = new THREE.MeshLambertMaterial({ color: 0x333333 });
    const hub = new THREE.Mesh(geometry, hubMaterial);
    hub.position.copy(pos);
    hub.scale.set(0.1, 0.1, 0.1);
    scene.add(hub);
    return hub;
  });

  return hubs;
}

// eslint-disable-next-line
const controller1 = renderer.xr.getController(0);
const controller2 = renderer.xr.getController(1);
// eslint-disable-next-line
controller2.addEventListener("connected", function (event) {});

const controller1Grip = renderer.xr.getControllerGrip(0);
controller1Grip.add(createControllerModel("right"));
scene.add(controller1Grip);

const controller2Grip = renderer.xr.getControllerGrip(1);
controller2Grip.add(createControllerModel("left"));
scene.add(controller2Grip);

controller1.addEventListener("selectstart", () => {
  controller1.userData.isSelecting = true;
});
7;

controller1.addEventListener("selectend", () => {
  controller1.userData.isSelecting = false;
});

const lineMaterial = new THREE.LineBasicMaterial({ color: 0xff0000 });
const points: THREE.Vector3[] = [];
points.push(new THREE.Vector3(-1, 1, -3));
points.push(new THREE.Vector3(1, 1.5, -2));
points.push(new THREE.Vector3(0.5, 1, -0.5));
points.push(new THREE.Vector3(0.0, 0.5, 0));

const lineGeometry = new THREE.BufferGeometry().setFromPoints(points);
const line = new THREE.Line(lineGeometry, lineMaterial);
scene.add(line);

const ray = new THREE.Vector3(-0.5, -0.5, 0.5);
const rotRay = new THREE.Vector3();
const raycaster = new THREE.Raycaster();

renderer.setAnimationLoop(() => {
  //cube.rotation.x += 0.01;
  //cube.rotation.y += 0.01;
  renderScene(scene);

  const closestHub = findClosestHub(controller1Grip.position, hubs);
  if (closestHub && controller1Grip.position.distanceTo(closestHub.position) < 0.1) {
    (closestHub.material as THREE.MeshLambertMaterial).emissive.setHex(0x008888);
    if (controller1.userData.isSelecting) {
      if (!controller1.userData.wasSelecting) {
        controller1.userData.wasSelecting = true;

        const startQuaternion = new THREE.Quaternion();
        startQuaternion.copy(controller1Grip.quaternion);
        controller1.userData.startQuaternion = startQuaternion;

        const hubStartQuaternion = new THREE.Quaternion();
        hubStartQuaternion.copy(closestHub.quaternion);
        controller1.userData.hubStartQuaternion = hubStartQuaternion;
      }

      const startQuaternion = new THREE.Quaternion();
      startQuaternion.copy(controller1.userData.startQuaternion);

      const hubStartQuaternion = new THREE.Quaternion();
      hubStartQuaternion.copy(controller1.userData.hubStartQuaternion);

      const currentQuaternion = new THREE.Quaternion();
      currentQuaternion.copy(controller1Grip.quaternion);

      startQuaternion.inverse();

      const tempQuaternion = new THREE.Quaternion();
      tempQuaternion.copy(currentQuaternion);
      tempQuaternion.multiply(startQuaternion);

      tempQuaternion.multiply(hubStartQuaternion);

      closestHub.setRotationFromQuaternion(tempQuaternion);

      if (closestHub) {
        rotRay.copy(ray);
        rotRay.applyQuaternion(tempQuaternion);

        let rayLength = 3;

        raycaster.ray.origin.set(0.5, 1, -0.5);
        const direction = new THREE.Vector3();
        direction.copy(rotRay);
        direction.normalize();
        raycaster.ray.direction.copy(direction);

        const intersects = raycaster.intersectObjects(hubs);
        if (intersects.length > 0) {
          (closestHub.material as THREE.MeshLambertMaterial).emissive.setHex(0x009900);
          rayLength = intersects[0].distance + 0.2;
        } else {
          (closestHub.material as THREE.MeshLambertMaterial).emissive.setHex(0x000000);
        }

        lineGeometry.attributes.position.setXYZ(
          3,
          0.5 + rotRay.x * rayLength,
          1 + rotRay.y * rayLength,
          -0.5 + rotRay.z * rayLength
        );
        lineGeometry.attributes.position.needsUpdate = true;
      }
    }
  } else {
    //(closestHub.material as THREE.MeshLambertMaterial).setHex(0x000000);
  }

  if (!controller1.userData.isSelecting) {
    controller1.userData.wasSelecting = false;
  }
});

function findClosestHub(position: THREE.Vector3, hubs: THREE.Mesh[]) {
  const closest: [THREE.Mesh | null, number] = [null, Number.MAX_VALUE];
  hubs.forEach((hub) => {
    const dist = position.distanceTo(hub.position);
    if (dist < closest[1]) {
      closest[0] = hub;
      closest[1] = dist;
    }
  });
  return closest[0];
}
