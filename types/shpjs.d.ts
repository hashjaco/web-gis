declare module "shpjs" {
  import type { FeatureCollection } from "geojson";
  function shpjs(
    buffer: ArrayBuffer | string,
  ): Promise<FeatureCollection | FeatureCollection[]>;
  export default shpjs;
}
