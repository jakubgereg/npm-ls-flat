import { DependencyTree } from '../src/types';
import { hasDependencies, isPackageType, traverseDependencyTree } from '../src/utils';

const dependencyTree: DependencyTree = {
  a: {
    version: '1.0.0',
    dependencies: {
      b: {
        version: '1.1.0',
        dependencies: {
          c: {
            version: '1.2.0'
          }
        }
      }
    }
  },
  x: {
    version: '2.0.0',
    dependencies: {
      y: {
        version: '3.0.0',
        dependencies: {
          z: {
            version: '4.0.0'
          }
        }
      }
    }
  },
  c: {
    version: '1.2.0'
  },
  d: {
    version: '1.3.0',
    dependencies: {
      a: {
        version: '1.0.1'
      }
    }
  }
};

const brokenDependencyTree: any = {
  a: {
    version: 'invalid-version'
  },
  b: {
    version: '1.1.0',
    dependencies: ['1', '2', '3']
  },
  c: {
    version: '1.2.0',
    dependencies: {
      d: {
        version: 'xy'
      },
      e: {
        version: 0
      },
      correct: {
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
      { name: 'a', version: '1.0.0', path: undefined },
      { name: 'b', version: '1.1.0', path: ['a'] },
      { name: 'c', version: '1.2.0', path: ['a', 'b'] },
      { name: 'x', version: '2.0.0', path: undefined },
      { name: 'y', version: '3.0.0', path: ['x'] },
      { name: 'z', version: '4.0.0', path: ['x', 'y'] },
      { name: 'c', version: '1.2.0', path: undefined },
      { name: 'd', version: '1.3.0', path: undefined },
      { name: 'a', version: '1.0.1', path: ['d'] }
    ]);
  });

  it('should handle broken dependency tree', () => {
    const result = traverseDependencyTree(brokenDependencyTree);
    expect(result).toEqual([
      { name: 'b', version: '1.1.0', path: undefined },
      { name: 'c', version: '1.2.0', path: undefined },
      { name: 'correct', version: '1.0.122', path: ['c'] }
    ]);
  });
});

describe('isPackageType', () => {
  it('should return true', () => {
    expect(isPackageType({ version: '1.2.3' })).toBe(true);
  });
  it('should return false', () => {
    expect(isPackageType({ name: 'my package' })).toBe(false);
    expect(isPackageType(['1.2.3'])).toBe(false);
    expect(isPackageType({ version: 3 })).toBe(false);
    expect(isPackageType({ version: 'x' })).toBe(false);
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
