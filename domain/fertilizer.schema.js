/**
 * Fertilizer recommendation schema
 */

export const FertilizerRecommendationInputSchema = {
  $id: "FertilizerRecommendationInput",
  type: "object",
  required: [
    "temperature",
    "humidity",
    "moisture",
    "soilType",
    "cropType",
    "nitrogen",
    "phosphorous",
    "potassium"
  ],
  additionalProperties: false,
  properties: {
    temperature: {
      type: "number",
      description: "Ambient temperature in degrees Celsius"
    },
    humidity: {
      type: "number",
      description: "Relative humidity percentage"
    },
    moisture: {
      type: "number",
      description: "Soil moisture percentage"
    },
    soilType: {
      type: "string",
      description: "Categorical soil type"
    },
    cropType: {
      type: "string",
      description: "Categorical crop type"
    },
    nitrogen: {
      type: "number",
      description: "Nitrogen content"
    },
    phosphorous: {
      type: "number",
      description: "Phosphorous content"
    },
    potassium: {
      type: "number",
      description: "Potassium content"
    }
  }
};

export const FertilizerRecommendationSchema = {
  $id: "FertilizerRecommendation",
  type: "object",
  required: ["fertilizerName", "confidence", "inputs"],
  additionalProperties: false,
  properties: {
    fertilizerName: {
      type: "string",
      description: "Recommended fertilizer label"
    },
    confidence: {
      type: "number",
      description: "Prediction confidence score (0-1)"
    },
    inputs: FertilizerRecommendationInputSchema,
    modelVersion: {
      type: "string",
      description: "Version of the fertilizer recommendation model"
    },
    createdAt: {
      type: "string",
      description: "ISO timestamp when the recommendation was generated"
    }
  }
};