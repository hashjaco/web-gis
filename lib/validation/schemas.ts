import { z } from "zod";

const coordinateValue = z.number().min(-180).max(180);

const position = z.tuple([coordinateValue, coordinateValue]).or(
  z.tuple([coordinateValue, coordinateValue, z.number()]),
);

const geometryType = z.enum([
  "Point",
  "MultiPoint",
  "LineString",
  "MultiLineString",
  "Polygon",
  "MultiPolygon",
  "GeometryCollection",
]);

export const geometrySchema = z.object({
  type: geometryType,
  coordinates: z.any(),
}).refine(
  (val) => val.coordinates !== undefined || val.type === "GeometryCollection",
  { message: "coordinates is required for non-GeometryCollection geometries" },
);

export const propertiesSchema = z
  .record(z.string(), z.unknown())
  .optional()
  .default({});

export const uuidSchema = z.string().uuid();

export const projectIdSchema = z.string().uuid({ message: "Invalid projectId" });

export const bboxSchema = z
  .string()
  .transform((val) => val.split(",").map(Number))
  .refine(
    (parts) => parts.length === 4 && parts.every((n) => !Number.isNaN(n)),
    { message: "bbox must be 4 comma-separated numbers" },
  )
  .refine(
    ([minX, minY, maxX, maxY]) =>
      minX >= -180 && maxX <= 180 && minY >= -90 && maxY <= 90,
    { message: "bbox coordinates out of valid range" },
  );

export const createFeatureSchema = z.object({
  geometry: geometrySchema,
  properties: propertiesSchema,
  layer: z.string().min(1).max(255),
  projectId: projectIdSchema,
});

export const updateFeatureSchema = z
  .object({
    geometry: geometrySchema.optional(),
    properties: propertiesSchema.optional(),
  })
  .refine((val) => val.geometry || val.properties, {
    message: "At least one of geometry or properties is required",
  });

export const spatialQuerySchema = z.object({
  geometry: geometrySchema,
  layer: z.string().min(1).max(255).optional(),
  operation: z.enum(["intersects", "within", "contains"]).default("intersects"),
  projectId: projectIdSchema,
});

export const analysisSchema = z.object({
  operation: z.enum(["buffer", "intersect", "within", "union"]),
  distance: z.number().positive().optional(),
  layer: z.string().min(1).max(255).optional(),
  targetLayer: z.string().min(1).max(255).optional(),
  projectId: projectIdSchema,
});

export const batchUpdateSchema = z.object({
  ids: z.array(uuidSchema).min(1).max(1000),
  properties: z.record(z.string(), z.unknown()),
  projectId: projectIdSchema,
});

export const batchDeleteSchema = z.object({
  ids: z.array(uuidSchema).min(1).max(1000),
  projectId: projectIdSchema,
});

export const createLayerSchema = z.object({
  name: z.string().min(1).max(255),
  description: z.string().max(1000).nullable().optional(),
  sourceType: z.string().max(50).default("vector"),
  style: z.record(z.string(), z.unknown()).nullable().optional(),
  order: z.number().int().min(0).default(0),
  isVisible: z.boolean().default(true),
  opacity: z.number().int().min(0).max(100).default(100),
  projectId: projectIdSchema,
});

export const updateLayerSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  description: z.string().max(1000).nullable().optional(),
  style: z.record(z.string(), z.unknown()).nullable().optional(),
  order: z.number().int().min(0).optional(),
  isVisible: z.boolean().optional(),
  opacity: z.number().int().min(0).max(100).optional(),
});

export const createProjectSchema = z.object({
  name: z.string().min(1).max(255),
  description: z.string().max(2000).nullable().optional(),
  state: z.record(z.string(), z.unknown()),
  isPublic: z.boolean().default(false),
});

export const updateProjectSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  description: z.string().max(2000).nullable().optional(),
  state: z.record(z.string(), z.unknown()).optional(),
  isPublic: z.boolean().optional(),
});

export const adminPlanUpdateSchema = z.object({
  userId: z.string().min(1),
  plan: z.enum(["free", "pro", "team", "enterprise", "admin"]),
});

export const toggleAddOnSchema = z.object({
  addOn: z.enum(["collaboration"]),
  enabled: z.boolean(),
  target: z.enum(["user", "org"]),
});
