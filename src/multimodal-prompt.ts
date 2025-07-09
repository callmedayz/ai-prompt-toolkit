import { PromptTemplate } from './prompt-template';
import { OpenRouterClient } from './openrouter-client';
import { OpenRouterCompletion } from './openrouter-completion';
import { SupportedModel } from './types';
import { DEFAULT_FREE_MODEL } from './openrouter-types';

/**
 * Supported image formats for multimodal prompts
 */
export type ImageFormat = 'jpeg' | 'jpg' | 'png' | 'gif' | 'webp' | 'bmp';

/**
 * Image input for multimodal prompts
 */
export interface ImageInput {
  data: string; // Base64 encoded image data or URL
  format: ImageFormat;
  description?: string; // Optional description of the image
  metadata?: {
    width?: number;
    height?: number;
    size?: number; // Size in bytes
    source?: string; // Source URL or file path
  };
}

/**
 * Multimodal content that can include text and images
 */
export interface MultimodalContent {
  text?: string;
  images?: ImageInput[];
  metadata?: Record<string, any>;
}

/**
 * Configuration for multimodal prompts
 */
export interface MultimodalPromptOptions {
  template: string;
  variables?: Record<string, any>;
  imageVariables?: Record<string, ImageInput | ImageInput[]>;
  maxImages?: number;
  imageProcessing?: {
    resize?: { width: number; height: number };
    quality?: number; // 0-100 for JPEG compression
    format?: ImageFormat; // Convert to specific format
  };
  escapeHtml?: boolean;
  preserveWhitespace?: boolean;
}

/**
 * Result of multimodal prompt rendering
 */
export interface MultimodalPromptResult {
  text: string;
  images: ImageInput[];
  totalTokens: number;
  estimatedCost?: number;
  metadata: {
    imageCount: number;
    totalImageSize: number;
    supportedModels: SupportedModel[];
  };
}

/**
 * Multimodal model capabilities
 */
export interface MultimodalCapabilities {
  model: SupportedModel;
  supportsImages: boolean;
  maxImages: number;
  maxImageSize: number; // in bytes
  supportedFormats: ImageFormat[];
  maxResolution: { width: number; height: number };
  costPerImage?: number;
  costPerToken?: number;
}

/**
 * Multimodal Prompt Template System
 */
export class MultimodalPromptTemplate {
  private options: MultimodalPromptOptions;
  private textTemplate: PromptTemplate;

  constructor(options: MultimodalPromptOptions) {
    this.options = {
      maxImages: 10,
      escapeHtml: false,
      preserveWhitespace: true,
      ...options
    };

    this.textTemplate = new PromptTemplate({
      template: this.options.template,
      variables: this.options.variables,
      escapeHtml: this.options.escapeHtml,
      preserveWhitespace: this.options.preserveWhitespace
    });
  }

  /**
   * Render the multimodal prompt with text and images
   */
  render(
    variables?: Record<string, any>,
    imageVariables?: Record<string, ImageInput | ImageInput[]>
  ): MultimodalPromptResult {
    // Render text portion
    const text = this.textTemplate.render(variables);

    // Collect all images
    const allImages: ImageInput[] = [];
    const combinedImageVariables = { ...this.options.imageVariables, ...imageVariables };

    Object.values(combinedImageVariables).forEach(imageVar => {
      if (Array.isArray(imageVar)) {
        allImages.push(...imageVar);
      } else {
        allImages.push(imageVar);
      }
    });

    // Apply image limit
    const images = allImages.slice(0, this.options.maxImages);

    // Process images if needed
    const processedImages = this.processImages(images);

    // Calculate metadata
    const totalImageSize = processedImages.reduce((sum, img) => {
      return sum + (img.metadata?.size || 0);
    }, 0);

    // Estimate tokens (rough approximation)
    const textTokens = Math.ceil(text.length / 4);
    const imageTokens = processedImages.length * 85; // Approximate tokens per image
    const totalTokens = textTokens + imageTokens;

    // Get supported models
    const supportedModels = this.getSupportedModels(processedImages);

    return {
      text,
      images: processedImages,
      totalTokens,
      metadata: {
        imageCount: processedImages.length,
        totalImageSize,
        supportedModels
      }
    };
  }

  /**
   * Check if a model supports the given multimodal content
   */
  static isModelSupported(model: SupportedModel, content: MultimodalContent): boolean {
    const capabilities = this.getModelCapabilities(model);
    
    if (!capabilities.supportsImages && content.images && content.images.length > 0) {
      return false;
    }

    if (content.images) {
      if (content.images.length > capabilities.maxImages) {
        return false;
      }

      for (const image of content.images) {
        if (!capabilities.supportedFormats.includes(image.format)) {
          return false;
        }

        if (image.metadata?.size && image.metadata.size > capabilities.maxImageSize) {
          return false;
        }
      }
    }

    return true;
  }

  /**
   * Get multimodal capabilities for a specific model
   */
  static getModelCapabilities(model: SupportedModel): MultimodalCapabilities {
    // Define capabilities for known multimodal models
    const capabilities: Record<string, Partial<MultimodalCapabilities>> = {
      'openai/gpt-4.5-preview': {
        supportsImages: true,
        maxImages: 10,
        maxImageSize: 20 * 1024 * 1024, // 20MB
        supportedFormats: ['jpeg', 'jpg', 'png', 'gif', 'webp'],
        maxResolution: { width: 2048, height: 2048 },
        costPerImage: 0.00765
      }
    };

    const modelCapabilities = capabilities[model];

    return {
      model,
      supportsImages: modelCapabilities?.supportsImages || false,
      maxImages: modelCapabilities?.maxImages || 0,
      maxImageSize: modelCapabilities?.maxImageSize || 0,
      supportedFormats: modelCapabilities?.supportedFormats || [],
      maxResolution: modelCapabilities?.maxResolution || { width: 0, height: 0 },
      costPerImage: modelCapabilities?.costPerImage,
      costPerToken: modelCapabilities?.costPerToken
    };
  }

  /**
   * Get all models that support multimodal input
   */
  static getMultimodalModels(): SupportedModel[] {
    // Return models that are actually in the SupportedModel type and have multimodal capabilities
    // Based on the current limited model set, only GPT-4.5 Preview supports multimodal
    return [
      'openai/gpt-4.5-preview' // Has text+image->text architecture according to model configs
    ];
  }

  /**
   * Recommend the best multimodal model for given content
   */
  static recommendModel(content: MultimodalContent): {
    model: SupportedModel;
    reason: string;
    confidence: number;
  } {
    const multimodalModels = this.getMultimodalModels();
    
    if (!content.images || content.images.length === 0) {
      return {
        model: DEFAULT_FREE_MODEL,
        reason: 'No images detected, using default text model',
        confidence: 1.0
      };
    }

    // Find models that support the content
    const supportedModels = multimodalModels.filter(model => 
      this.isModelSupported(model, content)
    );

    if (supportedModels.length === 0) {
      return {
        model: DEFAULT_FREE_MODEL,
        reason: 'No multimodal models support this content',
        confidence: 0.0
      };
    }

    // Score models based on capabilities and cost
    const scoredModels = supportedModels.map(model => {
      const capabilities = this.getModelCapabilities(model);
      let score = 0;

      // Prefer models with higher image limits
      score += (capabilities.maxImages / 20) * 30;

      // Prefer models with larger size limits
      score += (capabilities.maxImageSize / (20 * 1024 * 1024)) * 20;

      // Prefer models with more format support
      score += (capabilities.supportedFormats.length / 5) * 10;

      // Prefer lower cost models
      if (capabilities.costPerImage) {
        score += (1 - Math.min(capabilities.costPerImage / 0.05, 1)) * 40;
      }

      return { model, score, capabilities };
    });

    // Sort by score and return the best
    scoredModels.sort((a, b) => b.score - a.score);
    const best = scoredModels[0];

    return {
      model: best.model,
      reason: `Best balance of capabilities and cost for ${content.images?.length} images`,
      confidence: Math.min(best.score / 100, 1.0)
    };
  }

  /**
   * Create a multimodal prompt from text and images
   */
  static create(
    text: string,
    images: ImageInput[],
    options?: Partial<MultimodalPromptOptions>
  ): MultimodalPromptTemplate {
    return new MultimodalPromptTemplate({
      template: text,
      imageVariables: { images },
      ...options
    });
  }

  /**
   * Convert a regular prompt template to multimodal
   */
  static fromPromptTemplate(
    promptTemplate: PromptTemplate,
    images?: ImageInput[]
  ): MultimodalPromptTemplate {
    return new MultimodalPromptTemplate({
      template: promptTemplate['template'], // Access private property
      variables: promptTemplate['variables'],
      imageVariables: images ? { images } : undefined,
      escapeHtml: promptTemplate['escapeHtml'],
      preserveWhitespace: promptTemplate['preserveWhitespace']
    });
  }

  private processImages(images: ImageInput[]): ImageInput[] {
    if (!this.options.imageProcessing) {
      return images;
    }

    return images.map(image => {
      let processedImage = { ...image };

      // Apply image processing options
      if (this.options.imageProcessing?.format && 
          this.options.imageProcessing.format !== image.format) {
        processedImage.format = this.options.imageProcessing.format;
        // In a real implementation, you would convert the image format here
      }

      return processedImage;
    });
  }

  private getSupportedModels(images: ImageInput[]): SupportedModel[] {
    const multimodalModels = MultimodalPromptTemplate.getMultimodalModels();
    
    return multimodalModels.filter(model => {
      const content: MultimodalContent = { images };
      return MultimodalPromptTemplate.isModelSupported(model, content);
    });
  }
}

/**
 * Multimodal Completion Service
 */
export class MultimodalCompletion {
  private client: OpenRouterClient;
  private completion: OpenRouterCompletion;

  constructor(client: OpenRouterClient) {
    this.client = client;
    this.completion = new OpenRouterCompletion(client);
  }

  /**
   * Generate completion for multimodal prompt
   */
  async complete(
    prompt: MultimodalPromptResult,
    model?: SupportedModel,
    options?: any
  ): Promise<{
    text: string;
    model: SupportedModel;
    usage: {
      promptTokens: number;
      completionTokens: number;
      totalTokens: number;
    };
    cost?: number;
  }> {
    // Select appropriate model if not specified
    const selectedModel = model || this.selectBestModel(prompt);
    
    // Verify model supports the content
    const content: MultimodalContent = {
      text: prompt.text,
      images: prompt.images
    };
    
    if (!MultimodalPromptTemplate.isModelSupported(selectedModel, content)) {
      throw new Error(`Model ${selectedModel} does not support this multimodal content`);
    }

    // Format the prompt for the API
    const formattedPrompt = this.formatPromptForAPI(prompt, selectedModel);

    // Make the API call
    const result = await this.completion.complete(formattedPrompt, {
      model: selectedModel,
      ...options
    });

    return {
      text: result.text,
      model: selectedModel,
      usage: {
        promptTokens: prompt.totalTokens,
        completionTokens: Math.ceil(result.text.length / 4),
        totalTokens: prompt.totalTokens + Math.ceil(result.text.length / 4)
      },
      cost: prompt.estimatedCost
    };
  }

  private selectBestModel(prompt: MultimodalPromptResult): SupportedModel {
    const content: MultimodalContent = {
      text: prompt.text,
      images: prompt.images
    };
    
    const recommendation = MultimodalPromptTemplate.recommendModel(content);
    return recommendation.model;
  }

  private formatPromptForAPI(prompt: MultimodalPromptResult, model: SupportedModel): string {
    // In a real implementation, this would format the prompt according to
    // the specific API requirements for the model
    let formattedPrompt = prompt.text;
    
    if (prompt.images.length > 0) {
      formattedPrompt += '\n\n[Images attached: ' + prompt.images.length + ']';
      prompt.images.forEach((image, index) => {
        if (image.description) {
          formattedPrompt += `\nImage ${index + 1}: ${image.description}`;
        }
      });
    }

    return formattedPrompt;
  }
}

/**
 * Utility functions for multimodal prompts
 */

/**
 * Create an image input from a file path or URL
 */
export async function createImageInput(
  source: string,
  description?: string
): Promise<ImageInput> {
  // In a real implementation, this would:
  // 1. Load the image from file or URL
  // 2. Convert to base64 if needed
  // 3. Detect format and metadata
  // 4. Return ImageInput object

  // For now, return a placeholder
  const format = source.split('.').pop()?.toLowerCase() as ImageFormat || 'jpeg';
  
  return {
    data: source, // In real implementation, this would be base64 data
    format,
    description,
    metadata: {
      source
    }
  };
}

/**
 * Validate image input
 */
export function validateImageInput(image: ImageInput): {
  isValid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (!image.data) {
    errors.push('Image data is required');
  }

  if (!image.format) {
    errors.push('Image format is required');
  }

  const validFormats: ImageFormat[] = ['jpeg', 'jpg', 'png', 'gif', 'webp', 'bmp'];
  if (image.format && !validFormats.includes(image.format)) {
    errors.push(`Unsupported image format: ${image.format}`);
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}
