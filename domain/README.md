# Domain Schemas

This directory defines shared domain contracts used across AgriTech.

## Purpose
- Single source of truth for core entities
- Prevent schema drift across features
- Prepare project for backend & ML integration

## Current Schemas
- Crop
- FertilizerRecommendationInput
- FertilizerRecommendation
- GrowthStage
- SoilData
- PredictionResult

## Entry Points
- `index.js` exports the canonical schema map for browser and module consumers.
- `validate.js` provides lightweight boundary validation without forcing every internal call site to validate.

## Usage
Schemas are **contracts**, not enforcement.
Validation should happen only at system boundaries.

Example:

```js
import { validateDomainData } from './validate.js';

const result = validateDomainData('SoilData', { n: 50, p: 20, k: 25 });
```