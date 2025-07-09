#!/usr/bin/env node

/**
 * Script to generate model configurations for the AI Prompt Toolkit
 * Uses the fetched OpenRouter model data to create TypeScript configurations
 */

const fs = require('fs');
const path = require('path');

const dataDir = path.join(__dirname, '..', 'data');
const srcDir = path.join(__dirname, '..', 'src');

/**
 * Load model data
 */
function loadModelData() {
  const freeModelsPath = path.join(dataDir, 'free-models.json');
  const paidModelsPath = path.join(dataDir, 'paid-models.json');

  if (!fs.existsSync(freeModelsPath) || !fs.existsSync(paidModelsPath)) {
    throw new Error('Model data not found. Run "npm run fetch-models" first.');
  }

  const freeModels = JSON.parse(fs.readFileSync(freeModelsPath, 'utf8'));
  const paidModels = JSON.parse(fs.readFileSync(paidModelsPath, 'utf8'));

  return { freeModels, paidModels };
}

/**
 * Select recommended models for the toolkit
 */
function selectRecommendedModels(freeModels, paidModels) {
  // Select best free models (prioritize popular providers and good context length)
  const recommendedFree = freeModels.models.filter(model => {
    const id = model.id.toLowerCase();
    return (
      // Popular providers
      id.includes('meta-llama') ||
      id.includes('mistral') ||
      id.includes('google/gemma') ||
      id.includes('qwen') ||
      id.includes('deepseek') ||
      // Good context length
      model.context_length >= 8192
    );
  }).slice(0, 10); // Top 10 free models

  // Select popular paid models
  const recommendedPaid = paidModels.models.filter(model => {
    const id = model.id.toLowerCase();
    return (
      id.includes('openai/gpt') ||
      id.includes('anthropic/claude') ||
      id.includes('google/gemini-pro') ||
      id.includes('meta-llama/llama-3') ||
      id.includes('mistral')
    );
  }).slice(0, 15); // Top 15 paid models

  return { recommendedFree, recommendedPaid };
}

/**
 * Generate TypeScript types
 */
function generateTypes(recommendedFree, recommendedPaid) {
  const freeModelIds = recommendedFree.map(m => `'${m.id}'`);
  const paidModelIds = recommendedPaid.map(m => `'${m.id}'`);
  const allModelIds = [...freeModelIds, ...paidModelIds];

  return `// Auto-generated OpenRouter model types
// Generated on: ${new Date().toISOString()}
// Source: OpenRouter API v1

// Free tier models (recommended selection)
export type FreeModel = 
  | ${freeModelIds.join('\n  | ')};

// Paid models (popular selection)
export type PaidModel = 
  | ${paidModelIds.join('\n  | ')};

// All supported models
export type SupportedModel = FreeModel | PaidModel;

// Default free model for development
export const DEFAULT_FREE_MODEL: FreeModel = ${freeModelIds[0] || "'meta-llama/llama-3.1-8b-instruct:free'"};

// Model configuration interface
export interface ModelConfig {
  name: string;
  maxTokens: number;
  costPerToken: number;
  modality?: string;
  architecture?: string;
  provider?: string;
}
`;
}

/**
 * Generate model configurations
 */
function generateModelConfigs(recommendedFree, recommendedPaid) {
  const allModels = [...recommendedFree, ...recommendedPaid];
  
  const configs = allModels.map(model => {
    const costPerToken = parseFloat(model.pricing.prompt) || 0;
    const provider = model.id.split('/')[0];
    
    return `  '${model.id}': {
    name: '${model.name}',
    maxTokens: ${model.context_length},
    costPerToken: ${costPerToken},
    modality: '${model.modality || 'text'}',
    architecture: '${model.architecture?.modality || 'text->text'}',
    provider: '${provider}'
  }`;
  });

  return `// Auto-generated OpenRouter model configurations
// Generated on: ${new Date().toISOString()}

import { SupportedModel, ModelConfig } from './types';

export const MODEL_CONFIGS: Record<SupportedModel, ModelConfig> = {
${configs.join(',\n')}
};

// Helper functions
export function getModelConfig(model: SupportedModel): ModelConfig {
  return MODEL_CONFIGS[model];
}

export function getFreeModels(): SupportedModel[] {
  return Object.keys(MODEL_CONFIGS).filter(
    model => MODEL_CONFIGS[model as SupportedModel].costPerToken === 0
  ) as SupportedModel[];
}

export function getPaidModels(): SupportedModel[] {
  return Object.keys(MODEL_CONFIGS).filter(
    model => MODEL_CONFIGS[model as SupportedModel].costPerToken > 0
  ) as SupportedModel[];
}

export function getModelsByProvider(provider: string): SupportedModel[] {
  return Object.keys(MODEL_CONFIGS).filter(
    model => MODEL_CONFIGS[model as SupportedModel].provider === provider
  ) as SupportedModel[];
}
`;
}

/**
 * Main execution
 */
async function main() {
  try {
    console.log('🔄 Loading model data...');
    const { freeModels, paidModels } = loadModelData();

    console.log('🔄 Selecting recommended models...');
    const { recommendedFree, recommendedPaid } = selectRecommendedModels(freeModels, paidModels);

    console.log('🔄 Generating TypeScript types...');
    const types = generateTypes(recommendedFree, recommendedPaid);
    const typesPath = path.join(srcDir, 'openrouter-types.ts');
    fs.writeFileSync(typesPath, types);

    console.log('🔄 Generating model configurations...');
    const configs = generateModelConfigs(recommendedFree, recommendedPaid);
    const configsPath = path.join(srcDir, 'openrouter-models.ts');
    fs.writeFileSync(configsPath, configs);

    console.log('\n✅ Generated files:');
    console.log(`   - ${typesPath}`);
    console.log(`   - ${configsPath}`);

    console.log('\n📊 Summary:');
    console.log(`   Free models selected: ${recommendedFree.length}`);
    console.log(`   Paid models selected: ${recommendedPaid.length}`);
    console.log(`   Total models: ${recommendedFree.length + recommendedPaid.length}`);

    console.log('\n🆓 Selected free models:');
    recommendedFree.slice(0, 5).forEach(model => {
      console.log(`   - ${model.id}`);
    });

    console.log('\n💰 Selected paid models:');
    recommendedPaid.slice(0, 5).forEach(model => {
      console.log(`   - ${model.id}`);
    });

    console.log('\n🎉 Model configuration generation complete!');
    console.log('\nNext steps:');
    console.log('1. Update src/types.ts to import from openrouter-types.ts');
    console.log('2. Update src/token-counter.ts to use openrouter-models.ts');
    console.log('3. Test the new model configurations');

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

// Run the script
if (require.main === module) {
  main();
}

module.exports = { loadModelData, selectRecommendedModels, generateTypes, generateModelConfigs };
