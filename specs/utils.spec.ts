import { DependencyTree } from '../src/types';
import { hasDependencies, isPackageType, traverseDependencyTree } from '../src/utils';

const dependencyTree: DependencyTree = {
  'package-a': {
    version: '1.0.0',
    dependencies: {
      'package-b': {
        version: '1.1.0',
        dependencies: {
          'package-c': {
            version: '1.2.0'
          }
        }
      }
    }
  },
  'package-x': {
    version: '2.0.0',
    dependencies: {
      'package-y': {
        version: '3.0.0',
        dependencies: {
          'package-z': {
            version: '4.0.0'
          }
        }
      }
    }
  },
  'package-c': {
    version: '1.2.0'
  },
  'package-d': {
    version: '1.3.0',
    dependencies: {
      'package-a': {
        version: '1.0.1'
      }
    }
  }
};

const brokenDependencyTree: any = {
  'package-a': {
    version: '_invalid_version_'
  },
  'package-b': {
    version: '1.1.0',
    dependencies: ['package-1', 'package-2', 'package-3']
  },
  'package-c': {
    version: '1.2.0',
    dependencies: {
      'package-d': {
        version: '_invalid_version_2'
      },
      'package-e': {
        version: 0
      },
      'package-f': {
        version: '1.0.122'
      }
    }
  }
};

describe('traverseDependencyTree', () => {
  it('should return an empty array', () => {
    expect(traverseDependencyTree({})).toEqual([]);
  });
  it('should traverse dependency tree', () => {
    const result = traverseDependencyTree(dependencyTree);
    expect(result).toEqual([
      { name: 'package-a', version: '1.0.0', path: undefined },
      { name: 'package-b', version: '1.1.0', path: [{ name: 'package-a', version: '1.0.0' }] },
      {
        name: 'package-c',
        version: '1.2.0',
        path: [
          { name: 'package-a', version: '1.0.0' },
          { name: 'package-b', version: '1.1.0' }
        ]
      },
      { name: 'package-x', version: '2.0.0', path: undefined },
      { name: 'package-y', version: '3.0.0', path: [{ name: 'package-x', version: '2.0.0' }] },
      {
        name: 'package-z',
        version: '4.0.0',
        path: [
          { name: 'package-x', version: '2.0.0' },
          { name: 'package-y', version: '3.0.0' }
        ]
      },
      { name: 'package-c', version: '1.2.0', path: undefined },
      { name: 'package-d', version: '1.3.0', path: undefined },
      { name: 'package-a', version: '1.0.1', path: [{ name: 'package-d', version: '1.3.0' }] }
    ]);
    expect(traverseDependencyTree(dependencyTree)).toMatchSnapshot();
  });

  it('should handle broken dependency tree', () => {
    const result = traverseDependencyTree(brokenDependencyTree);
    expect(result).toEqual([
      { name: 'package-b', version: '1.1.0', path: undefined },
      { name: 'package-c', version: '1.2.0', path: undefined },
      { name: 'package-f', version: '1.0.122', path: [{ name: 'package-c', version: '1.2.0' }] }
    ]);
    expect(traverseDependencyTree(brokenDependencyTree)).toMatchSnapshot();
  });

  it('should match snapshot', () => {});
});

describe('isPackageType', () => {
  it('should return true', () => {
    expect(isPackageType({ version: '1.2.3' })).toBe(true);
  });
  it('should return false', () => {
    expect(isPackageType({ name: 'my package' })).toBe(false);
    expect(isPackageType(['1.2.3'])).toBe(false);
    expect(isPackageType({ version: 3 })).toBe(false);
    expect(isPackageType({ version: '_ivalid_version_' })).toBe(false);
  });
});

describe('hasDependencies', () => {
  it('should return true', () => {
    expect(hasDependencies({ version: '1.2.3', dependencies: {} })).toBe(true);
  });
  it('should return false', () => {
    expect(hasDependencies({ name: 'test', dependencies: undefined })).toBe(false);
    expect(hasDependencies({ dependencies: 'someDeps' })).toBe(false);
  });
});
