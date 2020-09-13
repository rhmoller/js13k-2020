import * as THREE from "three";
import { ShapeUtils } from "three";

export interface MeshData {
  vertices: number[];
  normals: number[];
  indices: number[];
}

export function extrude(
  path: number[],
  direction?: [number, number, number],
  close?: boolean,
  cap?: boolean,
  steps?: [
    {
      direction?: [number, number, number];
      scale?: number;
    }
  ]
): MeshData {
  const vertices: number[] = [];
  const normals: number[] = [];
  const indices: number[] = [];

  function addFaces(v1: THREE.Vector3, v2: THREE.Vector3, direction: [number, number, number]) {
    const v3 = new THREE.Vector3(v2.x + direction[0], v2.y + direction[1], v2.z + direction[2]);
    const v4 = new THREE.Vector3(v1.x + direction[0], v1.y + direction[1], v1.z + direction[2]);

    const e1 = new THREE.Vector3().subVectors(v2, v1);
    const e2 = new THREE.Vector3().subVectors(v3, v2);
    const normal = e1.cross(e2);

    const index = vertices.length / 3;
    vertices.push(...v1.toArray());
    vertices.push(...v2.toArray());
    vertices.push(...v3.toArray());
    vertices.push(...v4.toArray());
    const normalArray = normal.toArray();
    normals.push(...normalArray, ...normalArray, ...normalArray, ...normalArray);

    indices.push(index, index + 1, index + 3);
    indices.push(index + 1, index + 2, index + 3);
  }

  for (let i = 0; i < path.length - 3; i += 3) {
    const v1 = new THREE.Vector3(path[i], path[i + 1], path[i + 2]);
    const v2 = new THREE.Vector3(path[i + 3], path[i + 4], path[i + 5]);
    addFaces(v1, v2, direction!);
  }

  if (close) {
    const i = path.length - 3;
    const v1 = new THREE.Vector3(path[i], path[i + 1], path[i + 2]);
    const v2 = new THREE.Vector3(path[0], path[1], path[2]);
    addFaces(v1, v2, direction!);
  }

  if (cap) {
    const shape: THREE.Vector2[] = [];

    const capNormal = new THREE.Vector3(...direction!).normalize();
    const negDirection = capNormal.clone().multiplyScalar(-1);

    const base = vertices.length / 3;
    for (let i = 0; i < path.length; i += 3) {
      shape.push(new THREE.Vector2(path[i], path[i + 1]));
      vertices.push(path[i], path[i + 1], path[i + 2]);
      normals.push(...negDirection.toArray());
    }

    const base2 = vertices.length / 3;
    for (let i = 0; i < path.length; i += 3) {
      vertices.push(
        path[i] + direction![0],
        path[i + 1] + direction![1],
        path[i + 2] + direction![2]
      );
      normals.push(...capNormal.toArray());
    }

    shape.push(new THREE.Vector2(path[0], path[1]));
    vertices.push(path[0], path[1], path[2]);

    const cap1: number[][] = ShapeUtils.triangulateShape(shape, []);
    cap1.forEach((face) => {
      indices.push(face[0] + base);
      indices.push(face[2] + base);
      indices.push(face[1] + base);
    });

    cap1.forEach((face) => {
      indices.push(face[0] + base2);
      indices.push(face[1] + base2);
      indices.push(face[2] + base2);
    });
  }

  return {
    vertices,
    normals,
    indices,
  };
}
