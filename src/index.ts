import * as THREE from "three";
import { VRButton } from "./VRButton"; // this seems to be missing in https://js13kgames.com/webxr-src/2020/three.js
import { createControllerModel } from "./geometries";
import { renderScene } from "./renderer";
import { initEngine } from "./engine";
import {
  createLaserBeams,
  createTeleport,
  createTeleportGuideline,
  handleHand,
  updateGuideline,
  updateRay,
  createRoom,
  isLevelCompleted,
  RoomConfig,
} from "./game";

const engine = initEngine();
engine.left.grip.add(createControllerModel("left"));
engine.right.grip.add(createControllerModel("right"));

let currentRoom = 2;
const rooms: RoomConfig[] = [
  {
    dimensions: {
      x: 4,
      z: 5,
    },
    // prettier-ignore
    hubPositions: [
      0.5, 1, -0.5,
      -0.5, 1, -1.5,
    ],
    pillarPositions: [],
    beam: {
      origin: new THREE.Vector3(-1.5, 2.5, 2.5),
    },
  },
  {
    dimensions: {
      x: 10,
      z: 8,
    },
    // prettier-ignore
    hubPositions: [
      -1, 1, 1,
      2, 1, -1,
      -0.5, 1.5, -3,  
      1, 1.5, -3,  
    ],
    // prettier-ignore
    pillarPositions: [
      2.5, -3,
      2.5, 3,
      -2.5, -3,
      -2.5, 3
    ],
    beam: {
      origin: new THREE.Vector3(-5, 3, -2),
    },
  },
  {
    dimensions: {
      x: 6,
      z: 5,
    },
    // prettier-ignore
    hubPositions: [
      1, 1, 1,
      -0.5, 1.5, -3,  
      1, 1.5, -3,  
    ],
    // prettier-ignore
    pillarPositions: [
      -2.5, -2,
      2.5, -0,
      -2.5, 2
    ],
    beam: {
      origin: new THREE.Vector3(0, 1, 2.5),
    },
  },
];

configureEnvironment(engine.scene);
let room = createRoom(engine.scene, engine, rooms[currentRoom]);
engine.scene.add(room.group);
const lineGeometry = createLaserBeams(engine.scene);

const teleport = createTeleport(engine.scene);
engine.rig.add(teleport);
teleport.position.z = -4;
teleport.position.y = 0;
teleport.visible = false;
const guideline = createTeleportGuideline();
engine.rig.add(guideline);

let teleporting = false;

let t = 0;

function update() {
  t++;

  //hubs.forEach((hub) => (hub.material as THREE.MeshLambertMaterial).emissive.setHex(0x000000));
  handleHand(engine.left, room);
  handleHand(engine.right, room);
  updateGuideline(engine.camera, engine.renderer, guideline, teleport);
  updateRay(room, rooms[currentRoom], lineGeometry);

  const { door, trigger } = room;

  door.open = trigger.userData.activated;
  let triggerIntensity = 128 + Math.sin(t * 0.15) * 127;
  (trigger.material as THREE.MeshLambertMaterial).emissive.setHex(
    trigger.userData.activated ? triggerIntensity << 8 : triggerIntensity << 16
  );
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

  if (isLevelCompleted(engine, rooms[currentRoom])) {
    currentRoom++;
    if (currentRoom == rooms.length) currentRoom = 0;
    engine.scene.remove(room.group);
    room = createRoom(engine.scene, engine, rooms[currentRoom]);
    engine.scene.add(room.group);
  }
}

engine.renderer.setAnimationLoop(() => {
  update();
  renderScene(engine.scene);
});

function configureEnvironment(scene: THREE.Scene) {
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
}
