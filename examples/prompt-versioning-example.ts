import {
  PromptVersionManager,
  createQuickABTest,
  OpenRouterClient,
  ABTestConfig,
  PromptVersion
} from '../src/index';

/**
 * Example: Prompt Versioning and A/B Testing
 * 
 * This example demonstrates how to:
 * 1. Create and manage prompt versions
 * 2. Set up A/B tests between different prompt variants
 * 3. Execute tests and analyze results
 * 4. Export/import prompt versions
 */

async function promptVersioningExample() {
  console.log('🔄 Prompt Versioning and A/B Testing Example\n');

  // Initialize the version manager
  // For real API testing, uncomment the next line and provide your API key
  // const client = OpenRouterClient.fromEnv();
  // const manager = new PromptVersionManager(client);
  const manager = new PromptVersionManager(); // Offline mode for this example

  console.log('📝 Example 1: Creating Prompt Versions');
  
  // Create initial prompt version
  const v1 = manager.createVersion(
    'customer-support',
    'You are a helpful customer support agent. Please help the customer with their {issue_type}: {customer_message}',
    { issue_type: 'general inquiry' },
    {
      description: 'Basic customer support prompt',
      tags: ['customer-support', 'v1'],
      createdBy: 'product-team'
    }
  );

  console.log(`✅ Created version: ${v1.name} v${v1.version} (ID: ${v1.id})`);

  // Create an improved version
  const v2 = manager.updateVersion(v1.id, {
    template: 'You are a friendly and knowledgeable customer support specialist. Please provide a helpful and detailed response to the customer\'s {issue_type}: {customer_message}\n\nPlease ensure your response is:\n- Clear and easy to understand\n- Actionable with specific next steps\n- Empathetic to the customer\'s situation',
    description: 'Enhanced customer support prompt with specific guidelines'
  });

  console.log(`✅ Created updated version: ${v2.name} v${v2.version} (ID: ${v2.id})`);

  // Create a third version with different approach
  const v3 = manager.updateVersion(v2.id, {
    template: 'As an expert customer support representative, I will address your {issue_type} with precision and care.\n\nCustomer inquiry: {customer_message}\n\nMy response will include:\n1. Acknowledgment of your concern\n2. Clear explanation or solution\n3. Next steps if applicable\n4. Additional resources if helpful',
    description: 'Structured customer support prompt with numbered format'
  });

  console.log(`✅ Created structured version: ${v3.name} v${v3.version} (ID: ${v3.id})\n`);

  console.log('📊 Example 2: Setting Up A/B Test');

  // Create A/B test configuration
  const abTestConfig: ABTestConfig = {
    name: 'Customer Support Prompt Optimization',
    description: 'Testing different prompt structures for customer support responses',
    variants: [v2, v3], // Compare the enhanced vs structured versions
    trafficSplit: [50, 50], // Equal split
    successCriteria: [
      { metric: 'success_rate', target: 95, operator: 'greater_than' },
      { metric: 'response_time', target: 3000, operator: 'less_than' }
    ],
    sampleSize: 20
  };

  // Start the A/B test
  const testResult = await manager.startABTest(abTestConfig);
  console.log(`🧪 Started A/B test: ${testResult.testId}`);
  console.log(`📈 Testing ${testResult.variants.length} variants with ${abTestConfig.trafficSplit.join('/')} traffic split\n`);

  console.log('🎯 Example 3: Simulating Test Executions');
  
  // Simulate some test executions (in real usage, these would be actual API calls)
  const testInputs = [
    'I can\'t log into my account',
    'My order hasn\'t arrived yet',
    'I want to return a product',
    'How do I change my subscription?',
    'The app keeps crashing'
  ];

  console.log('⚡ Simulating test executions...');
  
  // In a real scenario with OpenRouter client, you would do:
  // for (const input of testInputs) {
  //   try {
  //     const execution = await manager.executeTest(testResult.testId, input, 'openai/gpt-3.5-turbo');
  //     console.log(`✅ Test executed for variant ${execution.promptVersionId}: ${execution.success ? 'Success' : 'Failed'}`);
  //   } catch (error) {
  //     console.log(`❌ Test failed: ${error.message}`);
  //   }
  // }

  // For this example, we'll simulate the results
  console.log('📊 Simulated test results:');
  console.log('  - Variant A (Enhanced): 18/20 successful tests (90% success rate)');
  console.log('  - Variant B (Structured): 19/20 successful tests (95% success rate)');
  console.log('  - Average response time: 2.1s vs 1.8s');

  console.log('\n📈 Example 4: Analyzing Test Results');
  
  // Complete the test and analyze results
  const completedTest = manager.completeABTest(testResult.testId);
  console.log(`🏁 Test completed: ${completedTest.status}`);
  console.log(`🏆 ${completedTest.summary}`);
  console.log(`📊 Confidence level: ${(completedTest.confidence * 100).toFixed(1)}%\n`);

  console.log('📋 Example 5: Version Management');
  
  // List all versions
  const allVersions = manager.getVersionsByName('customer-support');
  console.log(`📚 Total versions for 'customer-support': ${allVersions.length}`);
  
  allVersions.forEach(version => {
    console.log(`  - v${version.version}: ${version.description} (${version.metadata.isActive ? 'Active' : 'Inactive'})`);
  });

  // Get latest version
  const latest = manager.getLatestVersion('customer-support');
  console.log(`\n🔄 Latest active version: v${latest?.version}\n`);

  console.log('💾 Example 6: Export/Import Versions');
  
  // Export versions
  const exportData = manager.exportVersions();
  console.log('✅ Exported prompt versions to JSON');
  console.log(`📦 Export size: ${(exportData.length / 1024).toFixed(1)}KB`);

  // Create new manager and import
  const newManager = new PromptVersionManager();
  newManager.importVersions(exportData);
  console.log('✅ Imported prompt versions to new manager');
  
  const importedVersions = newManager.getVersionsByName('customer-support');
  console.log(`📥 Imported ${importedVersions.length} versions\n`);

  console.log('🚀 Example 7: Quick A/B Test Utility');
  
  // Use the utility function for quick A/B testing
  const { manager: quickManager, testConfig } = createQuickABTest(
    'quick-test',
    'Summarize this text: {text}',
    'Please provide a concise summary of the following text: {text}',
    { text: 'sample text' },
    {
      description: 'Quick test of summarization prompts',
      trafficSplit: [60, 40], // 60/40 split
      successCriteria: [
        { metric: 'success_rate', target: 85, operator: 'greater_than' }
      ]
    }
  );

  console.log(`⚡ Quick A/B test created: ${testConfig.name}`);
  console.log(`🎯 Traffic split: ${testConfig.trafficSplit.join('/')} for ${testConfig.variants.length} variants`);
  console.log(`📊 Success criteria: ${testConfig.successCriteria.length} metrics defined\n`);

  console.log('✨ Prompt Versioning and A/B Testing Example Complete!');
  console.log('\n🔗 Next Steps:');
  console.log('1. Set up OpenRouter client for real API testing');
  console.log('2. Create your own prompt versions for your use case');
  console.log('3. Run A/B tests with real user inputs');
  console.log('4. Analyze results and optimize your prompts');
  console.log('5. Use version control to track prompt evolution');
}

// Run the example
if (require.main === module) {
  promptVersioningExample().catch(console.error);
}

export { promptVersioningExample };
