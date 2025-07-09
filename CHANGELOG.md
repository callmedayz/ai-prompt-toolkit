# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [2.4.0] - 2025-07-09

### Added
- **Prompt Versioning and A/B Testing**: Complete system for managing prompt versions with A/B testing capabilities
  - Create and manage multiple prompt versions with metadata
  - Run A/B tests between different prompt variants
  - Statistical analysis and winner determination
  - Export/import prompt versions for backup and sharing
- **Prompt Performance Analytics**: Comprehensive analytics system for tracking prompt performance
  - Real-time performance monitoring and data collection
  - Aggregated analytics with trend analysis
  - Performance insights and recommendations
  - Configurable alerting for performance degradation
  - Time-series analytics with multiple aggregation periods
- **Auto-Prompt Optimization**: AI-powered automatic prompt improvement
  - Analyze prompts for optimization opportunities
  - Generate AI-powered optimization recommendations
  - Multiple optimization strategies (clarity, conciseness, specificity, etc.)
  - Continuous optimization workflows
  - Evaluation and success tracking of optimizations
- **Multimodal Prompt Support**: Support for text + image prompts
  - Create prompts with both text and image inputs
  - Support for multiple image formats (JPEG, PNG, GIF, WebP, BMP)
  - Model compatibility checking for multimodal content
  - Image validation and processing options
  - Model recommendation based on multimodal requirements

### Enhanced
- **OpenRouter Integration**: All new features work seamlessly with OpenRouter models
- **Type Safety**: Full TypeScript support for all new features
- **Examples**: Comprehensive examples for all new functionality

### Technical
- Added comprehensive test coverage for new features
- Improved error handling and validation
- Enhanced documentation with detailed examples

## [1.0.1] - 2025-07-09

### Fixed
- Fixed missing exports for `analyzePrompt` and other utility functions
- All utility functions now properly exported and available to users

### Changed
- Updated package.json repository URL format

## [1.0.0] - 2025-07-09

### Added
- Initial release of AI Prompt Toolkit
- **Prompt Templating**: Dynamic prompt generation with variable substitution
- **Token Counting**: Accurate token estimation for GPT-3.5, GPT-4, Claude models
- **Text Chunking**: Smart text splitting for large documents
- **Prompt Validation**: Quality checks and optimization suggestions
- **Prompt Optimization**: Automatic prompt compression to save tokens
- **Multi-Model Support**: Works with GPT-3.5, GPT-4, Claude-3 models
- **TypeScript Support**: Full type definitions and IntelliSense
- **Comprehensive Testing**: 80+ unit tests with Jest
- **Documentation**: Complete README with examples
- **Examples**: JavaScript and TypeScript usage examples

### Features
- Zero dependencies for lightweight package
- Professional NPM package structure
- MIT license for open source use
- Published to NPM registry as `@callmedayz/ai-prompt-toolkit`
