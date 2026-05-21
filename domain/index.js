import { CropSchema } from "./crop.schema.js";
import { GrowthStageSchema } from "./growthStage.schema.js";
import { PredictionResultSchema } from "./prediction.schema.js";
import { SoilDataSchema } from "./soil.schema.js";

export {
  CropSchema,
  GrowthStageSchema,
  PredictionResultSchema,
  SoilDataSchema
};

export const DomainSchemas = {
  Crop: CropSchema,
  GrowthStage: GrowthStageSchema,
  PredictionResult: PredictionResultSchema,
  SoilData: SoilDataSchema
};

if (typeof window !== "undefined") {
  window.AgriTechDomain = {
    ...DomainSchemas
  };
}