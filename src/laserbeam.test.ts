import * as THREE from "three";
import { createHubs, createLaserBeams } from "./game";

describe("laser beam", () => {
  const scene = new THREE.Scene();
  const hubs = createHubs(scene);
  const lineGeometry = createLaserBeams(scene);

  it("handles no collisions", () => {
    const hub = hubs[0];
    const ray = new THREE.Vector3(-1, 0, 0);
    const rotRay = new THREE.Vector3();
    const raycaster = new THREE.Raycaster();
    raycaster.ray.origin.copy(hub.position);

    rotRay.copy(ray);
    rotRay.applyQuaternion(hub.quaternion);

    raycaster.ray.direction.copy(rotRay);

    const otherHubs = hubs.filter((other) => other !== hub);
    const intersects = raycaster.intersectObjects(otherHubs);

    expect(intersects.length).toEqual(1);
  });
});
