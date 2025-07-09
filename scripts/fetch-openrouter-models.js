#!/usr/bin/env node

/**
 * Script to fetch OpenRouter models and extract them to JSON files
 * This helps keep our model configurations up-to-date
 */

const https = require('https');
const fs = require('fs');
const path = require('path');

// Ensure data directory exists
const dataDir = path.join(__dirname, '..', 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

/**
 * Fetch data from OpenRouter API
 */
function fetchOpenRouterModels() {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'openrouter.ai',
      path: '/api/v1/models',
      method: 'GET',
      headers: {
        'User-Agent': 'ai-prompt-toolkit/1.0.0'
      }
    };

    const req = https.request(options, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        try {
          const jsonData = JSON.parse(data);
          resolve(jsonData);
        } catch (error) {
          reject(new Error(`Failed to parse JSON: ${error.message}`));
        }
      });
    });

    req.on('error', (error) => {
      reject(new Error(`Request failed: ${error.message}`));
    });

    req.setTimeout(10000, () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });

    req.end();
  });
}

/**
 * Process and categorize models
 */
function processModels(apiResponse) {
  if (!apiResponse.data || !Array.isArray(apiResponse.data)) {
    throw new Error('Invalid API response format');
  }

  const models = apiResponse.data;
  const freeModels = [];
  const paidModels = [];
  const allModels = [];

  models.forEach(model => {
    const modelInfo = {
      id: model.id,
      name: model.name,
      description: model.description,
      context_length: model.context_length,
      pricing: {
        prompt: model.pricing?.prompt || '0',
        completion: model.pricing?.completion || '0'
      },
      top_provider: model.top_provider,
      architecture: model.architecture,
      modality: model.modality || 'text',
      per_request_limits: model.per_request_limits
    };

    allModels.push(modelInfo);

    // Check if model is free (pricing is 0 or has :free suffix)
    const isFree = model.id.includes(':free') || 
                   (model.pricing?.prompt === '0' && model.pricing?.completion === '0');

    if (isFree) {
      freeModels.push(modelInfo);
    } else {
      paidModels.push(modelInfo);
    }
  });

  return {
    all: allModels,
    free: freeModels,
    paid: paidModels,
    metadata: {
      total_models: allModels.length,
      free_models: freeModels.length,
      paid_models: paidModels.length,
      last_updated: new Date().toISOString(),
      source: 'OpenRouter API v1'
    }
  };
}

/**
 * Generate TypeScript types from models
 */
function generateTypeScriptTypes(processedModels) {
  const freeModelIds = processedModels.free.map(m => `'${m.id}'`);
  const paidModelIds = processedModels.paid.map(m => `'${m.id}'`);
  const allModelIds = processedModels.all.map(m => `'${m.id}'`);

  return {
    freeModels: `// Free tier OpenRouter models\nexport type FreeModel = \n  | ${freeModelIds.join('\n  | ')};`,
    paidModels: `// Paid OpenRouter models\nexport type PaidModel = \n  | ${paidModelIds.join('\n  | ')};`,
    allModels: `// All OpenRouter models\nexport type SupportedModel = \n  | ${allModelIds.join('\n  | ')};`
  };
}

/**
 * Main execution
 */
async function main() {
  try {
    console.log('🔄 Fetching OpenRouter models...');
    
    const apiResponse = await fetchOpenRouterModels();
    console.log(`✅ Fetched ${apiResponse.data?.length || 0} models from OpenRouter`);

    console.log('🔄 Processing models...');
    const processedModels = processModels(apiResponse);

    // Save all models data
    const allModelsPath = path.join(dataDir, 'openrouter-models.json');
    fs.writeFileSync(allModelsPath, JSON.stringify(processedModels, null, 2));
    console.log(`✅ Saved all models to ${allModelsPath}`);

    // Save free models only
    const freeModelsPath = path.join(dataDir, 'free-models.json');
    fs.writeFileSync(freeModelsPath, JSON.stringify({
      models: processedModels.free,
      metadata: processedModels.metadata
    }, null, 2));
    console.log(`✅ Saved free models to ${freeModelsPath}`);

    // Save paid models only
    const paidModelsPath = path.join(dataDir, 'paid-models.json');
    fs.writeFileSync(paidModelsPath, JSON.stringify({
      models: processedModels.paid,
      metadata: processedModels.metadata
    }, null, 2));
    console.log(`✅ Saved paid models to ${paidModelsPath}`);

    // Generate TypeScript types
    const types = generateTypeScriptTypes(processedModels);
    const typesPath = path.join(dataDir, 'model-types.ts');
    const typesContent = `// Auto-generated OpenRouter model types
// Generated on: ${new Date().toISOString()}
// Source: OpenRouter API v1

${types.freeModels}

${types.paidModels}

${types.allModels}

// Model configuration interface
export interface ModelConfig {
  name: string;
  maxTokens: number;
  costPerToken: number;
  modality?: string;
  architecture?: string;
}
`;
    fs.writeFileSync(typesPath, typesContent);
    console.log(`✅ Generated TypeScript types at ${typesPath}`);

    // Summary
    console.log('\n📊 Summary:');
    console.log(`   Total models: ${processedModels.metadata.total_models}`);
    console.log(`   Free models: ${processedModels.metadata.free_models}`);
    console.log(`   Paid models: ${processedModels.metadata.paid_models}`);
    
    // Show some example free models
    console.log('\n🆓 Example free models:');
    processedModels.free.slice(0, 5).forEach(model => {
      console.log(`   - ${model.id} (${model.name})`);
    });

    console.log('\n🎉 Model data extraction complete!');
    console.log('\nNext steps:');
    console.log('1. Review the generated files in the data/ directory');
    console.log('2. Update your TypeScript types using data/model-types.ts');
    console.log('3. Update model configurations using the JSON files');

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

// Run the script
if (require.main === module) {
  main();
}

module.exports = { fetchOpenRouterModels, processModels, generateTypeScriptTypes };
