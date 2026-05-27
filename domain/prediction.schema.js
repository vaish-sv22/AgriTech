/**
 * Prediction output schema
 */

export const PredictionResultSchema = {
  $id: "PredictionResult",
  type: "object",
  required: ["predictionType", "confidence", "result"],
  additionalProperties: false,
  properties: {
    predictionType: {
      type: "string",
      description: "Type of prediction returned by the model"
    },
    confidence: {
      type: "number",
      description: "Model confidence score (0-1)"
    },
    result: {
      description: "Prediction outcome",
      oneOf: [
        { type: "string" },
        { type: "number" },
        { type: "boolean" },
        { type: "object" },
        { type: "array" },
        { type: "null" }
      ]
    },
    inputs: {
      type: "object",
      description: "Input payload used to produce the prediction"
    },
    metadata: {
      type: "object",
      description: "Optional explanatory metadata returned by the model"
    },
    modelVersion: {
      type: "string",
      description: "Version of the model that produced the result"
    },
    createdAt: {
      type: "string",
      description: "ISO timestamp when the prediction was generated"
    }
  }
};