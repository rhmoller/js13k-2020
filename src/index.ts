import * as THREE from "three";
import { VRButton } from "./VRButton"; // this seems to be missing in https://js13kgames.com/webxr-src/2020/three.js
import {
  createPlane,
  createCorridor,
  createHand,
  createControllerModel,
  extrudeGeometry,
  createPillar,
  createDoorFrame,
} from "./geometries";
import {
  Camera,
  RGIntegerFormat,
  Scene,
  TextGeometry,
  Vector2,
  Vector3,
  WebGLRenderer,
} from "three";
import { initRenderer, renderScene } from "./renderer";
import { Engine, Hand, initEngine } from "./engine";
import {
  createHubs,
  createLaserBeams,
  createTeleport,
  createTeleportGuideline,
  updateGuideline,
  createDoor,
  createTrigger,
} from "./game";

const raycaster = new THREE.Raycaster();

const engine = initEngine();
engine.left.grip.add(createControllerModel("left"));
engine.right.grip.add(createControllerModel("right"));
populateScene(engine.scene);
const hubs = createHubs(engine.scene);
const lineGeometry = createLaserBeams(engine.scene);
const teleport = createTeleport(engine.scene);
engine.rig.add(teleport);
teleport.position.z = -4;
teleport.position.y = 0;
teleport.visible = false;
const guideline = createTeleportGuideline();
engine.rig.add(guideline);

const door = createDoor();
door.group.position.setZ(-15);
engine.scene.add(door.group);

let teleporting = false;
const trigger = createTrigger();
trigger.position.set(0.5, 1.5, -10);
engine.scene.add(trigger);

function update() {
  handleHand(engine.left);
  handleHand(engine.right);
  updateGuideline(engine.camera, engine.renderer, guideline, teleport);
  updateRay();

  door.open = trigger.userData.activated;
  if (door.open && door.value < 1) {
    door.value += door.delta;
  } else if (!door.open && door.value > 0) {
    door.value -= door.delta;
  }
  door.leftDoor.position.setX(-1 - door.value);
  door.rightDoor.position.setX(1 + door.value);

  const session = engine.renderer.xr.getSession() as XRSession;
  if (session) {
    const dy = session.inputSources[0].gamepad?.axes[3] || 0;
    const thumbstickActivated = Math.abs(dy) > 0.2;
    if (teleporting) {
      if (!thumbstickActivated) {
        const worldPos = new THREE.Vector3();
        teleport.getWorldPosition(worldPos);

        (engine.rig as THREE.Group).position.copy(worldPos);
        teleporting = false;

        door.open = !door.open;
      }
    } else {
      if (thumbstickActivated) {
        teleporting = true;
      }
    }
    teleport.visible = thumbstickActivated;
    guideline.visible = thumbstickActivated;
  }
}

engine.renderer.setAnimationLoop(() => {
  update();
  renderScene(engine.scene);
});

function handleHand(hand: Hand) {
  const handPosition = new THREE.Vector3();
  hand.grip.getWorldPosition(handPosition);
  const closestHub = findClosestHub(handPosition, hubs);

  if (closestHub && handPosition.distanceTo(closestHub.position) < 0.1) {
    (closestHub.material as THREE.MeshLambertMaterial).emissive.setHex(0x008888);
    if (hand.selecting) {
      (closestHub.material as THREE.MeshLambertMaterial).emissive.setHex(0xff0000);
      if (!hand.wasSelecting) {
        hand.wasSelecting = true;
        const startQuaternion = new THREE.Quaternion();
        startQuaternion.copy(hand.grip.quaternion);
        hand.grip.userData.startQuaternion = startQuaternion;

        const hubStartQuaternion = new THREE.Quaternion();
        hubStartQuaternion.copy(closestHub.quaternion);
        hand.grip.userData.hubStartQuaternion = hubStartQuaternion;
      }

      const startQuaternion = new THREE.Quaternion();
      startQuaternion.copy(hand.grip.userData.startQuaternion);

      const hubStartQuaternion = new THREE.Quaternion();
      hubStartQuaternion.copy(hand.grip.userData.hubStartQuaternion);

      const currentQuaternion = new THREE.Quaternion();
      currentQuaternion.copy(hand.grip.quaternion);

      startQuaternion.inverse();

      const tempQuaternion = new THREE.Quaternion();
      tempQuaternion.copy(currentQuaternion);
      tempQuaternion.multiply(startQuaternion);

      tempQuaternion.multiply(hubStartQuaternion);

      closestHub.setRotationFromQuaternion(tempQuaternion);
    }
  } else {
    if (closestHub) {
      (closestHub.material as THREE.MeshLambertMaterial).emissive.setHex(0x000000);
    }
    hand.wasSelecting = false;
  }
}

function updateRay() {
  const ray = new THREE.Ray(new THREE.Vector3(0.5, 1, 5), new THREE.Vector3(0, 0, -1));

  let hub: THREE.Object3D | null = null;
  raycaster.ray.origin.copy(ray.origin);
  raycaster.ray.direction.copy(ray.direction);

  lineGeometry.attributes.position.setXYZ(
    0,
    raycaster.ray.origin.x,
    raycaster.ray.origin.y,
    raycaster.ray.origin.z
  );

  let idx = 1;
  trigger.userData.activated = false;

  while (true) {
    let drawLength = 50;

    const otherHubs = hubs.filter((other) => other !== hub);
    otherHubs.push(trigger);
    const intersects = raycaster.intersectObjects(otherHubs);

    if (intersects.length > 0) {
      const point = intersects[0];
      drawLength = point.distance;
    } else {
      drawLength = 50;
    }

    lineGeometry.attributes.position.setXYZ(
      idx,
      raycaster.ray.origin.x + raycaster.ray.direction.x * drawLength,
      raycaster.ray.origin.y + raycaster.ray.direction.y * drawLength,
      raycaster.ray.origin.z + raycaster.ray.direction.z * drawLength
    );

    idx++;

    if (intersects.length > 0) {
      if (intersects[0].object === trigger) {
        trigger.userData.activated = true;
        break;
      }

      const point = intersects[0];
      raycaster.ray.origin.copy(point.point);

      hub = point.object as any;
      const normal = point.face?.normal.clone();
      normal?.applyQuaternion(hub!.quaternion);
      raycaster.ray.direction.reflect(normal!);
    } else {
      break;
    }

    if (intersects.length == 0 || idx > 10) break;
  }

  lineGeometry.setDrawRange(0, idx);
  lineGeometry.attributes.position.needsUpdate = true;
}

function populateScene(scene: THREE.Scene) {
  scene.fog = new THREE.FogExp2(0x223388, 0.1);
  scene.background = new THREE.Color(0x223388);
  scene.add(new THREE.HemisphereLight(0x888833, 0x333366, 0.3));
  const light = new THREE.DirectionalLight(0xffffff, 0.75);
  light.position.set(0, 4, 0.1).normalize();
  light.castShadow = true;
  light.shadow.mapSize.set(4096, 4096);
  light.shadow.camera.near = -1;
  light.shadow.camera.far = 5;
  const d = 10;
  light.shadow.camera.left = -d;
  light.shadow.camera.right = d;
  light.shadow.camera.top = d;
  light.shadow.camera.bottom = -d;
  scene.add(light);
  //scene.add(new THREE.CameraHelper(light.shadow.camera));

  const corridorGeometry = createCorridor();
  const corridorMaterial = new THREE.MeshLambertMaterial({
    color: 0xcccccc,
    side: THREE.BackSide,
  });

  const corridor = new THREE.Mesh(corridorGeometry, corridorMaterial);
  corridor.name = "Corridor";
  scene.add(corridor);
  corridor.position.z = -15;
  corridor.receiveShadow = true;

  const pillarGeometry = createPillar();
  const pillarMaterial = new THREE.MeshLambertMaterial({ color: 0xff66c33 });

  for (let z = -15; z < -15 + 20; z += 5) {
    const pillar = new THREE.Mesh(pillarGeometry, pillarMaterial);
    pillar.position.set(0, 0, z);
    scene.add(pillar);

    const pillar2 = new THREE.Mesh(pillarGeometry, pillarMaterial);
    pillar2.scale.set(-1, 1, 1);
    pillar2.position.set(0, 0, z);
    scene.add(pillar2);
  }

  const pillar = new THREE.Mesh(pillarGeometry, pillarMaterial);
  pillar.position.set(0, 0, 4.75);
  scene.add(pillar);

  const pillar2 = new THREE.Mesh(pillarGeometry, pillarMaterial);
  pillar2.scale.set(-1, 1, 1);
  pillar2.position.set(0, 0, 4.75);
  scene.add(pillar2);

  return scene;
}

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
