import {
  CropSchema,
  FertilizerRecommendationInputSchema,
  FertilizerRecommendationSchema,
  GrowthStageSchema,
  PredictionResultSchema,
  SoilDataSchema
} from "./index.js";

const schemaMap = {
  Crop: CropSchema,
  FertilizerRecommendationInput: FertilizerRecommendationInputSchema,
  FertilizerRecommendation: FertilizerRecommendationSchema,
  GrowthStage: GrowthStageSchema,
  PredictionResult: PredictionResultSchema,
  SoilData: SoilDataSchema
};

const validatorCache = new Map();

function validateValue(schema, value, path = "value") {
  if (!schema) {
    return [`Unknown schema at ${path}`];
  }

  if (schema.oneOf) {
    const branchErrors = schema.oneOf.some((optionSchema) => validateValue(optionSchema, value, path).length === 0);
    return branchErrors ? [] : [`${path} does not match any allowed schema branch`];
  }

  if (schema.anyOf) {
    const branchErrors = schema.anyOf.some((optionSchema) => validateValue(optionSchema, value, path).length === 0);
    return branchErrors ? [] : [`${path} does not match any allowed schema branch`];
  }

  if (schema.type) {
    const allowedTypes = Array.isArray(schema.type) ? schema.type : [schema.type];
    const actualType = Array.isArray(value) ? "array" : value === null ? "null" : typeof value;
    if (!allowedTypes.includes(actualType)) {
      return [`${path} must be of type ${allowedTypes.join(" or ")}`];
    }
  }

  if (schema.enum && !schema.enum.includes(value)) {
    return [`${path} must be one of: ${schema.enum.join(", ")}`];
  }

  if (schema.type === "array") {
    const items = schema.items || {};
    const itemErrors = [];
    value.forEach((item, index) => {
      itemErrors.push(...validateValue(items, item, `${path}[${index}]`));
    });
    return itemErrors;
  }

  if (schema.type === "object") {
    if (typeof value !== "object" || value === null || Array.isArray(value)) {
      return [`${path} must be an object`];
    }

    const errors = [];
    const required = schema.required || [];
    required.forEach((key) => {
      if (!(key in value)) {
        errors.push(`${path}.${key} is required`);
      }
    });

    const properties = schema.properties || {};
    Object.entries(properties).forEach(([key, propertySchema]) => {
      if (key in value) {
        errors.push(...validateValue(propertySchema, value[key], `${path}.${key}`));
      }
    });

    if (schema.additionalProperties === false) {
      Object.keys(value).forEach((key) => {
        if (!(key in properties)) {
          errors.push(`${path}.${key} is not allowed`);
        }
      });
    }

    return errors;
  }

  return [];
}

export function validateSchema(schema, data) {
  const errors = validateValue(schema, data);

  return {
    valid: errors.length === 0,
    errors
  };
}

export function validateDomainData(schemaName, data) {
  const schema = schemaMap[schemaName];

  if (!schema) {
    return {
      valid: false,
      errors: [`Unknown domain schema: ${schemaName}`]
    };
  }

  if (!validatorCache.has(schemaName)) {
    validatorCache.set(schemaName, (value) => validateSchema(schema, value));
  }

  return validatorCache.get(schemaName)(data);
}

export { schemaMap as DomainSchemaMap };