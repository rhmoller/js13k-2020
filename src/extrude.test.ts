import * as THREE from "three";
import { extrude } from "./extrude";

describe("extrude", () => {
  it("extrudes a line segment", () => {
    const path = [0, 0, 0, 1, 0, 0];
    const data = extrude(path, [0, 0, 1]);
    expect(data).toBeDefined();
    expect(data.vertices.length).toEqual(4 * 3);
    expect(data.vertices).toEqual([0, 0, 0, 1, 0, 0, 1, 0, 1, 0, 0, 1]);
    expect(data.normals).toEqual([0, -1, 0, 0, -1, 0, 0, -1, 0, 0, -1, 0]);
    expect(data.indices.length).toEqual(6);
  });

  it("extrudes two segments", () => {
    const path = [0, 0, 0, 1, 0, 0, 2, 0.5, 0];
    const data = extrude(path, [0, 0, 1]);
    expect(data).toBeDefined();
    expect(data.vertices.length).toEqual(4 * 3 * 2);
    expect(data.indices.length).toEqual(6 * 2);
  });
});
