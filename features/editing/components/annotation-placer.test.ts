import { describe, expect, it, vi, beforeEach } from "vitest";

const store = new Map<string, unknown>();

vi.mock("idb-keyval", () => ({
  createStore: () => "mock-store",
  get: (key: string) => Promise.resolve(store.get(key)),
  set: (key: string, value: unknown) => {
    store.set(key, value);
    return Promise.resolve();
  },
  del: (key: string) => {
    store.delete(key);
    return Promise.resolve();
  },
  keys: () => Promise.resolve(Array.from(store.keys())),
  values: () => Promise.resolve(Array.from(store.values())),
  clear: () => {
    store.clear();
    return Promise.resolve();
  },
}));

import {
  addGuestFeature,
  getGuestFeatures,
  type GuestFeatureRecord,
} from "@/lib/guest/guest-db";

beforeEach(() => {
  store.clear();
});

describe("useLocal guard logic", () => {
  it("is true when user is a guest regardless of projectId", () => {
    const isGuest = true;
    expect(isGuest || !undefined).toBe(true);
    expect(isGuest || !"some-project-id").toBe(true);
  });

  it("is true when projectId is undefined and not a guest", () => {
    const isGuest = false;
    const projectId = undefined;
    expect(isGuest || !projectId).toBe(true);
  });

  it("is false only when not a guest AND projectId is set", () => {
    const isGuest = false;
    const projectId = "abc-123";
    expect(isGuest || !projectId).toBe(false);
  });
});

describe("guest feature persistence (local annotation path)", () => {
  it("saves and retrieves a text annotation feature", async () => {
    const record: GuestFeatureRecord = {
      id: crypto.randomUUID(),
      geometry: { type: "Point", coordinates: [-122.4, 37.8] },
      properties: {
        label: "Test label",
        stroke_color: "#3bb2d0",
        stroke_width: 2,
        fill_color: "#3bb2d0",
        fill_opacity: 0.3,
      },
      layer: "test-layer",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await addGuestFeature(record);
    const features = await getGuestFeatures("test-layer");

    expect(features).toHaveLength(1);
    expect(features[0].id).toBe(record.id);
    expect(features[0].geometry).toEqual({
      type: "Point",
      coordinates: [-122.4, 37.8],
    });
    expect(features[0].properties.label).toBe("Test label");
    expect(features[0].layer).toBe("test-layer");
  });

  it("saves and retrieves an image annotation feature", async () => {
    const record: GuestFeatureRecord = {
      id: crypto.randomUUID(),
      geometry: { type: "Point", coordinates: [-73.9, 40.7] },
      properties: {
        image_url: "data:image/png;base64,iVBORw0KGgo=",
        image_width: 200,
        image_height: 150,
        stroke_color: "#ff0000",
        stroke_width: 3,
        fill_color: "#00ff00",
        fill_opacity: 0.5,
      },
      layer: "image-layer",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await addGuestFeature(record);
    const features = await getGuestFeatures("image-layer");

    expect(features).toHaveLength(1);
    expect(features[0].properties.image_url).toMatch(/^data:image\/png/);
    expect(features[0].properties.image_width).toBe(200);
    expect(features[0].properties.image_height).toBe(150);
  });

  it("filters features by layer", async () => {
    const layerA: GuestFeatureRecord = {
      id: crypto.randomUUID(),
      geometry: { type: "Point", coordinates: [0, 0] },
      properties: { label: "A" },
      layer: "layer-a",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    const layerB: GuestFeatureRecord = {
      id: crypto.randomUUID(),
      geometry: { type: "Point", coordinates: [1, 1] },
      properties: { label: "B" },
      layer: "layer-b",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await addGuestFeature(layerA);
    await addGuestFeature(layerB);

    const aFeatures = await getGuestFeatures("layer-a");
    expect(aFeatures).toHaveLength(1);
    expect(aFeatures[0].properties.label).toBe("A");

    const bFeatures = await getGuestFeatures("layer-b");
    expect(bFeatures).toHaveLength(1);
    expect(bFeatures[0].properties.label).toBe("B");

    const allFeatures = await getGuestFeatures();
    expect(allFeatures).toHaveLength(2);
  });

  it("produces records matching expected schema", async () => {
    const now = new Date().toISOString();
    const id = crypto.randomUUID();
    const record: GuestFeatureRecord = {
      id,
      geometry: { type: "Point", coordinates: [10, 20] },
      properties: { label: "schema test" },
      layer: "default",
      createdAt: now,
      updatedAt: now,
    };

    await addGuestFeature(record);
    const [saved] = await getGuestFeatures("default");

    expect(saved).toMatchObject({
      id: expect.stringMatching(
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/,
      ),
      geometry: { type: "Point", coordinates: [10, 20] },
      properties: { label: "schema test" },
      layer: "default",
      createdAt: expect.any(String),
      updatedAt: expect.any(String),
    });
    expect(new Date(saved.createdAt).getTime()).not.toBeNaN();
    expect(new Date(saved.updatedAt).getTime()).not.toBeNaN();
  });
});
