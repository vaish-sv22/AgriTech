/**
 * Soil data schema
 */

export const SoilDataSchema = {
  $id: "SoilData",
  type: "object",
  required: ["n", "p", "k"],
  additionalProperties: false,
  properties: {
    n: {
      type: "number",
      description: "Nitrogen level"
    },
    p: {
      type: "number",
      description: "Phosphorus level"
    },
    k: {
      type: "number",
      description: "Potassium level"
    },
    ph: {
      type: "number",
      description: "Soil pH value"
    },
    moisture: {
      type: "number",
      description: "Soil moisture percentage"
    },
    temperature: {
      type: "number",
      description: "Soil temperature"
    },
    collectedAt: {
      type: "string",
      description: "ISO timestamp when the soil sample was collected"
    },
    source: {
      type: "string",
      description: "Origin of the soil data, such as sensor or manual input"
    }
  }
};