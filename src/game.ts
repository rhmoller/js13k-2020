import * as THREE from "three";
import { BufferAttribute, BufferGeometry, Line, LineBasicMaterial } from "three";
import { Engine, Hand } from "./engine";
import { createCorridor, createPillar } from "./geometries";

interface RoomConfig {
  dimensions: {
    x: number;
    z: number;
  };
  hubPositions: number[];
  pillarPositions: number[];
}

interface Door {
  open: boolean;
  delta: number;
  value: number;
  group: THREE.Group;
  leftDoor: THREE.Mesh;
  rightDoor: THREE.Mesh;
}

interface Room {
  door: Door;
  hubs: THREE.Mesh[];
  obstacles: THREE.Mesh[];
  //exit: THREE.Mesh;
  //floor: THREE.Mesh[];
  trigger: THREE.Mesh;
  //room: THREE.Group;
}

export function handleHand(hand: Hand, room: Room) {
  const { hubs } = room;

  const handPosition = new THREE.Vector3();
  hand.grip.getWorldPosition(handPosition);
  const mesh = hand.grip.children[0] as THREE.Mesh;
  const closestHub = findClosestHub(handPosition, mesh, hubs);

  if (closestHub) {
    if (hand.selecting) {
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
    hand.wasSelecting = false;
  }
}

function findClosestHub(position: THREE.Vector3, hand: THREE.Mesh, hubs: THREE.Mesh[]) {
  const closest: [THREE.Mesh | null, number] = [null, Number.MAX_VALUE];
  hubs.forEach((hub) => {
    const box1 = hand.geometry.boundingBox!.clone();
    box1?.applyMatrix4(hand.matrixWorld);
    const box2 = hub.geometry.boundingBox!.clone();
    box2?.applyMatrix4(hub.matrixWorld);
    const intersects = box1?.intersectsBox(box2);
    const dist = position.distanceTo(hub.position);
    if (intersects && dist < closest[1]) {
      closest[0] = hub;
      closest[1] = dist;
    }
  });
  return closest[0];
}

const raycaster = new THREE.Raycaster();

export function updateRay(room: Room, lineGeometry: BufferGeometry) {
  const { trigger, hubs } = room;
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

const rooms: RoomConfig[] = [
  {
    dimensions: {
      x: 4,
      z: 10,
    },
    // prettier-ignore
    hubPositions: [
      0.5, 1, -0.5,
      -0.5, 1, -1.5,
      0.3, 1.5, -3.2,  
    ],
    pillarPositions: [],
  },
];

export function handleLevelUpdate(engine: Engine) {
  const { rig } = engine;
  const config = rooms[0];
  const hd = config.dimensions.z / 2;
  if (rig.position.z < -hd) {
    engine.rig.position.set(0, engine.rig.position.y, hd - 1);
  }
}

export function createRoom(scene: THREE.Scene, engine: Engine) {
  const config = rooms[0];

  const corridorGeometry = createCorridor(config.dimensions.x, config.dimensions.z);
  const corridorMaterial = new THREE.MeshLambertMaterial({
    color: 0xcccccc,
    side: THREE.BackSide,
  });

  const corridor = new THREE.Mesh(corridorGeometry, corridorMaterial);
  corridor.name = "Corridor";
  scene.add(corridor);
  corridor.receiveShadow = true;

  const pillarGeometry = createPillar();
  const pillarMaterial = new THREE.MeshLambertMaterial({ color: 0xff66c33 });

  const obstacles: THREE.Mesh[] = [];

  const hw = config.dimensions.x / 2;
  const hd = config.dimensions.z / 2;

  engine.rig.position.set(0, engine.rig.position.y, hd - 1);

  for (let z = -hd; z <= hd; z += 5) {
    const pillar = new THREE.Mesh(pillarGeometry, pillarMaterial);
    pillar.position.set(hw - 2, 0, z - 0.125);
    scene.add(pillar);
    obstacles.push(pillar);

    const pillar2 = new THREE.Mesh(pillarGeometry, pillarMaterial);
    pillar2.scale.set(-1, 1, 1);
    pillar2.position.set(2 - hw, 0, z - 0.125);
    scene.add(pillar2);
    obstacles.push(pillar2);
  }

  const door = createDoor();
  door.group.position.setZ(-hd);
  scene.add(door.group);

  const [base, trigger] = createTrigger();
  base.position.set(-1, 0.5, 1 - hd);
  trigger.position.set(-1, 1.125, 1 - hd);
  scene.add(base);
  scene.add(trigger);

  const baseGeometry = new THREE.BoxGeometry();

  const hubs = createHubs(scene, config.hubPositions);

  const room = {
    obstacles,
    trigger,
    door,
    hubs,
  };

  return room;
}

export function createLaserBeams(scene: THREE.Scene) {
  const lineMaterial = new THREE.LineBasicMaterial({ color: 0xff0000 });
  lineMaterial.linewidth = 3;
  const positions = new Float32Array(10 * 3);
  const lineGeometry = new THREE.BufferGeometry();
  lineGeometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  lineGeometry.setDrawRange(0, 0);
  const line = new THREE.Line(lineGeometry, lineMaterial);
  scene.add(line);

  return lineGeometry;
}

export function createHubs(scene: THREE.Scene, hubPositions: number[]) {
  const geometry = new THREE.BoxGeometry(0.02, 0.25, 0.25);
  geometry.computeBoundingBox();

  const hubs: THREE.Mesh[] = [];
  for (let idx = 0; idx < hubPositions.length; idx += 3) {
    const hubMaterial = new THREE.MeshLambertMaterial({ color: 0x333333 });
    const hub = new THREE.Mesh(geometry, hubMaterial);
    hub.castShadow = true;
    hub.position.set(hubPositions[idx], hubPositions[idx + 1], hubPositions[idx + 2]);
    hub.rotation.set(
      Math.random() * Math.PI * 2,
      Math.random() * Math.PI * 2,
      Math.random() * Math.PI * 2
    );
    scene.add(hub);
    hubs.push(hub);
  }

  return hubs;
}

export function createTeleport(scene: THREE.Scene) {
  const material = new THREE.MeshBasicMaterial({
    color: 0x884411,
    opacity: 0.75,
    blending: THREE.AdditiveBlending,
    side: THREE.DoubleSide,
    depthWrite: false,
    transparent: true,
  });
  const ringGeometry = new THREE.CylinderGeometry(0.25, 0.25, 0.5, undefined, undefined, true);
  const ring = new THREE.Mesh(ringGeometry, material);

  return ring;
}

const vertices = new Float32Array(11 * 3);

export function createTeleportGuideline() {
  const geometry = new BufferGeometry();
  vertices.fill(0);
  geometry.setAttribute("position", new BufferAttribute(vertices, 3));
  const material = new LineBasicMaterial({
    color: 0x884411,
    opacity: 0.75,
    blending: THREE.AdditiveBlending,
    side: THREE.DoubleSide,
    depthWrite: false,
    transparent: true,
    linewidth: 5,
  });
  const guideline = new Line(geometry, material);
  guideline.frustumCulled = false;
  return guideline;
}

export function updateGuideline(
  camera: THREE.Camera,
  renderer: THREE.WebGLRenderer,
  guideline: THREE.Line,
  teleport: THREE.Mesh
) {
  const tmpVec = new THREE.Vector3();

  if (renderer.xr.getSession()) {
    const xrCamera = renderer.xr.getCamera(camera);
    const feetPos = xrCamera.getWorldPosition(tmpVec);
    feetPos.y = 0;

    const ctrl = renderer.xr.getController(0);
    const p = new THREE.Vector3();
    ctrl.getWorldPosition(p);
    const v = new THREE.Vector3();
    ctrl.getWorldDirection(v);
    v.multiplyScalar(6);

    const g = new THREE.Vector3(0, -9.8, 0);
    const t = (-v.y + Math.sqrt(v.y ** 2 - 2 * p.y * g.y)) / g.y;
    const lineGeometry = guideline.geometry as BufferGeometry;

    const vertex = tmpVec.set(0, 0, 0);
    for (let i = 0; i < 11; i++) {
      vertex.copy(guidePositionAtT((i * t) / 10, p, v, g));
      vertex.toArray(vertices, i * 3);
    }
    teleport.position.copy(guidePositionAtT(t, p, v, g));

    lineGeometry.attributes.position.needsUpdate = true;
  }
}

function guidePositionAtT(t: number, p: THREE.Vector3, v: THREE.Vector3, g: THREE.Vector3) {
  const result = p.clone();
  result.addScaledVector(v, t);
  result.addScaledVector(g, 0.5 * t ** 2);
  return result;
}

export function createDoor() {
  const box = new THREE.BoxGeometry(2, 3, 0.125);
  const material = new THREE.MeshLambertMaterial({ color: 0xcccccc });
  const leftDoor = new THREE.Mesh(box, material);
  const rightDoor = new THREE.Mesh(box, material);
  const group = new THREE.Group();
  group.add(leftDoor);
  group.add(rightDoor);
  leftDoor.position.set(-1, 1.5, 0);
  rightDoor.position.set(1, 1.5, 0);
  return {
    open: false,
    delta: 0.01,
    value: 0,
    group,
    leftDoor,
    rightDoor,
  };
}

export function createTrigger(): [THREE.Mesh, THREE.Mesh] {
  const box = new THREE.BoxGeometry(0.25, 0.25, 0.25);
  const material = new THREE.MeshLambertMaterial({ color: 0xff0000 });
  const trigger = new THREE.Mesh(box, material);

  const baseBox = new THREE.BoxGeometry(0.25, 1, 0.25);
  const baseMaterial = new THREE.MeshLambertMaterial({ color: 0xffffff });
  const base = new THREE.Mesh(baseBox, baseMaterial);

  return [base, trigger];
}
