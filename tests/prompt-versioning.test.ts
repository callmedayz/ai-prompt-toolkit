import {
  PromptVersionManager,
  createQuickABTest,
  PromptVersion,
  ABTestConfig,
  ABTestResult
} from '../src/prompt-versioning';

describe('PromptVersionManager', () => {
  let manager: PromptVersionManager;

  beforeEach(() => {
    manager = new PromptVersionManager();
  });

  describe('Version Management', () => {
    test('should create a new prompt version', () => {
      const version = manager.createVersion(
        'test-prompt',
        'Hello {name}',
        { name: 'World' },
        {
          description: 'Test prompt',
          tags: ['test'],
          createdBy: 'test-user'
        }
      );

      expect(version.name).toBe('test-prompt');
      expect(version.version).toBe('1.0.0');
      expect(version.template).toBe('Hello {name}');
      expect(version.variables.name).toBe('World');
      expect(version.description).toBe('Test prompt');
      expect(version.metadata.tags).toContain('test');
      expect(version.metadata.createdBy).toBe('test-user');
      expect(version.metadata.isActive).toBe(true);
      expect(version.id).toBeDefined();
    });

    test('should retrieve a version by ID', () => {
      const version = manager.createVersion('test', 'template');
      const retrieved = manager.getVersion(version.id);

      expect(retrieved).toEqual(version);
    });

    test('should return undefined for non-existent version', () => {
      const retrieved = manager.getVersion('non-existent');
      expect(retrieved).toBeUndefined();
    });

    test('should list versions by name', () => {
      const v1 = manager.createVersion('test', 'template1');
      const v2 = manager.createVersion('test', 'template2');
      const v3 = manager.createVersion('other', 'template3');

      const versions = manager.getVersionsByName('test');
      expect(versions).toHaveLength(2);
      expect(versions.map(v => v.id)).toContain(v1.id);
      expect(versions.map(v => v.id)).toContain(v2.id);
      expect(versions.map(v => v.id)).not.toContain(v3.id);
    });

    test('should return latest active version', () => {
      const v1 = manager.createVersion('test', 'template1');
      const v2 = manager.createVersion('test', 'template2');
      
      // Deactivate v1
      manager.deactivateVersion(v1.id);

      const latest = manager.getLatestVersion('test');
      expect(latest?.id).toBe(v2.id);
    });

    test('should update a version (create new version)', () => {
      const parent = manager.createVersion('test', 'original template');
      const updated = manager.updateVersion(parent.id, {
        template: 'updated template',
        description: 'Updated version'
      });

      expect(updated.name).toBe('test');
      expect(updated.template).toBe('updated template');
      expect(updated.description).toBe('Updated version');
      expect(updated.metadata.parentVersion).toBe(parent.id);
      expect(updated.version).toBe('1.0.1');
    });

    test('should throw error when updating non-existent version', () => {
      expect(() => {
        manager.updateVersion('non-existent', { template: 'new' });
      }).toThrow('Parent version non-existent not found');
    });

    test('should deactivate a version', () => {
      const version = manager.createVersion('test', 'template');
      expect(version.metadata.isActive).toBe(true);

      manager.deactivateVersion(version.id);
      expect(version.metadata.isActive).toBe(false);
    });

    test('should generate incremental version numbers', () => {
      const v1 = manager.createVersion('test', 'template1');
      expect(v1.version).toBe('1.0.0');

      const v2 = manager.updateVersion(v1.id, { template: 'template2' });
      expect(v2.version).toBe('1.0.1');

      const v3 = manager.updateVersion(v2.id, { template: 'template3' });
      expect(v3.version).toBe('1.0.2');
    });
  });

  describe('A/B Testing', () => {
    let versionA: PromptVersion;
    let versionB: PromptVersion;
    let testConfig: ABTestConfig;

    beforeEach(() => {
      versionA = manager.createVersion('test', 'Template A: {input}');
      versionB = manager.createVersion('test', 'Template B: {input}');
      
      testConfig = {
        name: 'Test A/B',
        variants: [versionA, versionB],
        trafficSplit: [50, 50],
        successCriteria: [
          { metric: 'success_rate', target: 90, operator: 'greater_than' }
        ]
      };
    });

    test('should start an A/B test', async () => {
      const result = await manager.startABTest(testConfig);

      expect(result.testId).toBeDefined();
      expect(result.config).toEqual(testConfig);
      expect(result.variants).toHaveLength(2);
      expect(result.status).toBe('running');
      expect(result.startTime).toBeInstanceOf(Date);
    });

    test('should validate A/B test config', async () => {
      // Test with insufficient variants
      const invalidConfig = {
        ...testConfig,
        variants: [versionA]
      };

      await expect(manager.startABTest(invalidConfig)).rejects.toThrow(
        'A/B test requires at least 2 variants'
      );

      // Test with mismatched traffic split
      const mismatchedConfig = {
        ...testConfig,
        trafficSplit: [50] // Only one value for two variants
      };

      await expect(manager.startABTest(mismatchedConfig)).rejects.toThrow(
        'Traffic split array must match number of variants'
      );

      // Test with invalid traffic split sum
      const invalidSplitConfig = {
        ...testConfig,
        trafficSplit: [60, 60] // Sums to 120
      };

      await expect(manager.startABTest(invalidSplitConfig)).rejects.toThrow(
        'Traffic split must sum to 100%'
      );
    });

    test('should get test status', async () => {
      const result = await manager.startABTest(testConfig);
      const status = manager.getTestStatus(result.testId);

      expect(status).toEqual(result);
    });

    test('should stop an A/B test', async () => {
      const result = await manager.startABTest(testConfig);
      const stopped = manager.stopABTest(result.testId);

      expect(stopped.status).toBe('stopped');
      expect(stopped.endTime).toBeInstanceOf(Date);
    });

    test('should complete an A/B test', async () => {
      const result = await manager.startABTest(testConfig);
      const completed = manager.completeABTest(result.testId);

      expect(completed.status).toBe('completed');
      expect(completed.endTime).toBeInstanceOf(Date);
    });

    test('should throw error for non-existent test', () => {
      expect(() => manager.stopABTest('non-existent')).toThrow(
        'Test non-existent not found'
      );
    });
  });

  describe('Export/Import', () => {
    test('should export versions to JSON', () => {
      manager.createVersion('test1', 'template1');
      manager.createVersion('test2', 'template2');

      const exported = manager.exportVersions();
      const data = JSON.parse(exported);

      expect(data.versions).toHaveLength(2);
      expect(data.exportedAt).toBeDefined();
    });

    test('should import versions from JSON', () => {
      const originalManager = new PromptVersionManager();
      const v1 = originalManager.createVersion('test', 'template');
      const exported = originalManager.exportVersions();

      const newManager = new PromptVersionManager();
      newManager.importVersions(exported);

      const imported = newManager.getVersion(v1.id);
      expect(imported).toBeDefined();
      expect(imported?.name).toBe('test');
      expect(imported?.template).toBe('template');
    });

    test('should handle invalid import data', () => {
      expect(() => {
        manager.importVersions('invalid json');
      }).toThrow('Failed to import versions');
    });
  });
});

describe('createQuickABTest', () => {
  test('should create a quick A/B test setup', () => {
    const { manager, testConfig } = createQuickABTest(
      'quick-test',
      'Template A: {input}',
      'Template B: {input}',
      { input: 'test' },
      {
        description: 'Quick test',
        trafficSplit: [60, 40],
        successCriteria: [
          { metric: 'success_rate', target: 85, operator: 'greater_than' }
        ]
      }
    );

    expect(manager).toBeInstanceOf(PromptVersionManager);
    expect(testConfig.name).toBe('quick-test');
    expect(testConfig.variants).toHaveLength(2);
    expect(testConfig.trafficSplit).toEqual([60, 40]);
    expect(testConfig.successCriteria).toHaveLength(1);

    // Check that versions were created
    const versionA = testConfig.variants[0];
    const versionB = testConfig.variants[1];
    
    expect(versionA.name).toBe('quick-test_A');
    expect(versionB.name).toBe('quick-test_B');
    expect(versionA.template).toBe('Template A: {input}');
    expect(versionB.template).toBe('Template B: {input}');
  });

  test('should use default values when options not provided', () => {
    const { testConfig } = createQuickABTest(
      'simple-test',
      'Template A',
      'Template B'
    );

    expect(testConfig.trafficSplit).toEqual([50, 50]);
    expect(testConfig.successCriteria).toHaveLength(1);
    expect(testConfig.successCriteria[0].metric).toBe('success_rate');
    expect(testConfig.successCriteria[0].target).toBe(90);
  });
});
