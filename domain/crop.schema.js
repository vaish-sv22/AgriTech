/**
 * Crop domain schema
 * Shared across roadmap, prediction, and analytics
 */

export const CropSchema = {
  $id: "Crop",
  type: "object",
  required: ["id", "name", "durationDays"],
  additionalProperties: false,
  properties: {
    id: {
      type: "string",
      description: "Unique crop identifier"
    },
    name: {
      type: "string",
      description: "Human readable crop name"
    },
    durationDays: {
      type: "number",
      description: "Total crop lifecycle in days"
    },
    scientificName: {
      type: "string",
      description: "Optional scientific crop name"
    },
    preferredSoilTypes: {
      type: "array",
      description: "Optional list of suitable soil types",
      items: {
        type: "string"
      }
    },
    optimalPhRange: {
      type: "object",
      description: "Optional pH range for ideal growth",
      required: ["min", "max"],
      additionalProperties: false,
      properties: {
        min: {
          type: "number"
        },
        max: {
          type: "number"
        }
      }
    }
  }
};