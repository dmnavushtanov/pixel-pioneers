export interface UnitAssetManifest {
  id: string;
  name: string;
  parts: string[]; // List of png filenames expected
  tags?: string[];
}
