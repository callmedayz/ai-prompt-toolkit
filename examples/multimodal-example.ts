import {
  MultimodalPromptTemplate,
  MultimodalCompletion,
  ImageInput,
  MultimodalContent,
  createImageInput,
  validateImageInput,
  OpenRouterClient
} from '../src/index';

/**
 * Example: Multimodal Prompt Support
 * 
 * This example demonstrates how to:
 * 1. Create multimodal prompts with text and images
 * 2. Work with different image formats and sources
 * 3. Check model compatibility with multimodal content
 * 4. Generate completions using multimodal models
 * 5. Optimize prompts for different multimodal models
 */

async function multimodalExample() {
  console.log('🖼️ Multimodal Prompt Support Example\n');

  console.log('📝 Example 1: Creating Image Inputs');
  
  // Create image inputs from different sources
  const productImage = await createImageInput(
    'https://example.com/product.jpg',
    'Product photo showing a red smartphone'
  );

  const chartImage = await createImageInput(
    '/path/to/sales-chart.png',
    'Sales performance chart for Q4 2024'
  );

  const screenshotImage: ImageInput = {
    data: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==',
    format: 'png',
    description: 'Screenshot of application interface',
    metadata: {
      width: 1920,
      height: 1080,
      size: 245760,
      source: 'screenshot'
    }
  };

  console.log('✅ Created image inputs:');
  console.log(`  📱 Product Image: ${productImage.format} - ${productImage.description}`);
  console.log(`  📊 Chart Image: ${chartImage.format} - ${chartImage.description}`);
  console.log(`  🖥️ Screenshot: ${screenshotImage.format} - ${screenshotImage.metadata?.width}x${screenshotImage.metadata?.height}`);

  // Validate image inputs
  const validationResults = [productImage, chartImage, screenshotImage].map(img => ({
    image: img,
    validation: validateImageInput(img)
  }));

  console.log('\n🔍 Image Validation Results:');
  validationResults.forEach((result, index) => {
    const status = result.validation.isValid ? '✅' : '❌';
    console.log(`  ${status} Image ${index + 1}: ${result.validation.isValid ? 'Valid' : 'Invalid'}`);
    if (!result.validation.isValid) {
      result.validation.errors.forEach(error => console.log(`    • ${error}`));
    }
  });

  console.log('\n🎨 Example 2: Creating Multimodal Prompts');
  
  // Create a multimodal prompt template
  const analysisPrompt = new MultimodalPromptTemplate({
    template: `Analyze the following {content_type} and provide insights:

{text_content}

Please examine the attached images and provide:
1. A detailed description of what you see
2. Key insights and observations
3. Recommendations based on the visual data
4. Any patterns or trends you notice

Focus on {analysis_focus} in your response.`,
    variables: {
      content_type: 'business data',
      analysis_focus: 'actionable insights'
    },
    imageVariables: {
      charts: [chartImage],
      screenshots: [screenshotImage]
    },
    maxImages: 5
  });

  console.log('✅ Created multimodal prompt template');
  console.log('📝 Template supports text variables and image attachments');
  console.log(`🖼️ Maximum images: 5`);

  // Render the prompt with specific content
  const renderedPrompt = analysisPrompt.render(
    {
      text_content: 'Our Q4 sales performance shows interesting trends that need analysis.',
      analysis_focus: 'revenue optimization opportunities'
    },
    {
      products: [productImage]
    }
  );

  console.log('\n📊 Rendered Multimodal Prompt:');
  console.log(`📝 Text: "${renderedPrompt.text.substring(0, 100)}..."`);
  console.log(`🖼️ Images: ${renderedPrompt.images.length} attached`);
  console.log(`🔢 Total Tokens: ${renderedPrompt.totalTokens}`);
  console.log(`📏 Total Image Size: ${(renderedPrompt.metadata.totalImageSize / 1024).toFixed(1)}KB`);

  console.log('\n🤖 Example 3: Model Compatibility and Recommendations');
  
  // Check which models support our multimodal content
  const multimodalContent: MultimodalContent = {
    text: renderedPrompt.text,
    images: renderedPrompt.images
  };

  const supportedModels = MultimodalPromptTemplate.getMultimodalModels();
  console.log(`🔍 Available multimodal models: ${supportedModels.length}`);

  supportedModels.forEach(model => {
    const isSupported = MultimodalPromptTemplate.isModelSupported(model, multimodalContent);
    const capabilities = MultimodalPromptTemplate.getModelCapabilities(model);
    const status = isSupported ? '✅' : '❌';
    
    console.log(`\n${status} ${model}:`);
    console.log(`  📊 Max Images: ${capabilities.maxImages}`);
    console.log(`  📏 Max Size: ${(capabilities.maxImageSize / (1024 * 1024)).toFixed(1)}MB`);
    console.log(`  🎨 Formats: ${capabilities.supportedFormats.join(', ')}`);
    console.log(`  💰 Cost/Image: $${capabilities.costPerImage?.toFixed(4) || 'N/A'}`);
    console.log(`  📐 Max Resolution: ${capabilities.maxResolution.width}x${capabilities.maxResolution.height}`);
  });

  // Get model recommendation
  const recommendation = MultimodalPromptTemplate.recommendModel(multimodalContent);
  console.log(`\n🎯 Recommended Model: ${recommendation.model}`);
  console.log(`💡 Reason: ${recommendation.reason}`);
  console.log(`📊 Confidence: ${(recommendation.confidence * 100).toFixed(1)}%`);

  console.log('\n🔧 Example 4: Different Multimodal Use Cases');
  
  // Use case 1: Product analysis
  const productAnalysisPrompt = MultimodalPromptTemplate.create(
    'Analyze this product image and provide a detailed description, features, and market positioning suggestions.',
    [productImage],
    { maxImages: 1 }
  );

  const productAnalysis = productAnalysisPrompt.render();
  console.log('📱 Product Analysis Prompt:');
  console.log(`  🖼️ Images: ${productAnalysis.images.length}`);
  console.log(`  🔢 Tokens: ${productAnalysis.totalTokens}`);
  console.log(`  🤖 Supported Models: ${productAnalysis.metadata.supportedModels.length}`);

  // Use case 2: Chart interpretation
  const chartPrompt = new MultimodalPromptTemplate({
    template: 'Interpret the data visualization in the attached chart. Provide insights about trends, patterns, and recommendations for {business_area}.',
    variables: { business_area: 'sales strategy' },
    imageVariables: { chart: [chartImage] }
  });

  const chartAnalysis = chartPrompt.render();
  console.log('\n📊 Chart Analysis Prompt:');
  console.log(`  🖼️ Images: ${chartAnalysis.images.length}`);
  console.log(`  🔢 Tokens: ${chartAnalysis.totalTokens}`);

  // Use case 3: UI/UX review
  const uiReviewPrompt = new MultimodalPromptTemplate({
    template: `Review the user interface shown in the screenshot. Evaluate:
1. User experience and usability
2. Visual design and accessibility
3. Information architecture
4. Suggestions for improvement

Focus on {review_aspect} in your analysis.`,
    variables: { review_aspect: 'mobile responsiveness' },
    imageVariables: { screenshot: [screenshotImage] }
  });

  const uiReview = uiReviewPrompt.render();
  console.log('\n🖥️ UI Review Prompt:');
  console.log(`  🖼️ Images: ${uiReview.images.length}`);
  console.log(`  🔢 Tokens: ${uiReview.totalTokens}`);

  console.log('\n🚀 Example 5: Multimodal Completion (Simulation)');
  
  // For real API completion, uncomment the next lines:
  // const client = OpenRouterClient.fromEnv();
  // const multimodalCompletion = new MultimodalCompletion(client);
  // const result = await multimodalCompletion.complete(
  //   renderedPrompt,
  //   'openai/gpt-4-vision-preview'
  // );

  // Simulate completion result
  console.log('🔄 Simulating multimodal completion...');
  console.log('📝 Model: openai/gpt-4-vision-preview (simulated)');
  console.log('🖼️ Processing 3 images with text prompt');
  
  const simulatedResult = {
    text: `Based on the analysis of the provided images and text content:

1. **Product Image Analysis**: The red smartphone appears to be a premium device with modern design elements. The sleek form factor and color choice suggest targeting of style-conscious consumers.

2. **Sales Chart Insights**: The Q4 performance chart shows a significant uptick in the final month, indicating strong holiday season performance. There's a clear seasonal pattern that should inform future planning.

3. **UI Screenshot Review**: The application interface demonstrates good use of whitespace and clear navigation hierarchy. However, some elements could benefit from improved contrast for better accessibility.

**Recommendations**:
- Leverage the strong Q4 momentum for Q1 planning
- Consider expanding the product line in similar premium segments
- Implement accessibility improvements in the UI design
- Focus marketing efforts on the demonstrated seasonal patterns`,
    model: 'openai/gpt-4-vision-preview' as any,
    usage: {
      promptTokens: renderedPrompt.totalTokens,
      completionTokens: 156,
      totalTokens: renderedPrompt.totalTokens + 156
    },
    cost: 0.0234
  };

  console.log('\n✅ Completion Results:');
  console.log(`📝 Response Length: ${simulatedResult.text.length} characters`);
  console.log(`🔢 Prompt Tokens: ${simulatedResult.usage.promptTokens}`);
  console.log(`🔢 Completion Tokens: ${simulatedResult.usage.completionTokens}`);
  console.log(`🔢 Total Tokens: ${simulatedResult.usage.totalTokens}`);
  console.log(`💰 Estimated Cost: $${simulatedResult.cost.toFixed(4)}`);

  console.log('\n📋 Generated Analysis:');
  console.log(simulatedResult.text);

  console.log('\n✨ Multimodal Prompt Support Example Complete!');
  console.log('\n🔗 Next Steps:');
  console.log('1. Set up OpenRouter client for real multimodal API calls');
  console.log('2. Implement image preprocessing and optimization');
  console.log('3. Create specialized prompts for your multimodal use cases');
  console.log('4. Test with different models to find optimal performance');
  console.log('5. Monitor costs and optimize image usage');
  console.log('6. Integrate with existing prompt versioning and analytics');
}

// Run the example
if (require.main === module) {
  multimodalExample().catch(console.error);
}

export { multimodalExample };
