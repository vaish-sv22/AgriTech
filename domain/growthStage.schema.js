/**
 * Growth stage schema
 */

export const GrowthStageSchema = {
  $id: "GrowthStage",
  type: "object",
  required: ["name", "startDay", "endDay"],
  additionalProperties: false,
  properties: {
    name: {
      type: "string",
      description: "Stage name (e.g., Germination)"
    },
    startDay: {
      type: "number",
      description: "Start day of stage"
    },
    endDay: {
      type: "number",
      description: "End day of stage"
    },
    cropId: {
      type: "string",
      description: "Crop identifier that owns this stage"
    },
    description: {
      type: "string",
      description: "Optional stage description"
    },
    recommendedActions: {
      type: "array",
      description: "Suggested actions during this stage",
      items: {
        type: "string"
      }
    }
  }
};