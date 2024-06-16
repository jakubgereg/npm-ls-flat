import semver from 'semver';
import type { DependencyTree, PackageInfo, PackageType } from './types';

export const isPackageType = (obj: any): obj is PackageType =>
  typeof obj === 'object' && typeof obj.version === 'string' && semver.valid(obj.version) !== null;

export const hasDependencies = (obj: any): obj is PackageType & { dependencies: DependencyTree } =>
  typeof obj === 'object' && typeof obj.dependencies === 'object';

const transformToPackageInfo = (pkg: PackageType, path: string[] = []): PackageInfo[] => {
  const result: PackageInfo[] = [];
  if (isPackageType(pkg)) {
    result.push({
      name: path[path.length - 1], // Get the name from the last element of the path
      version: pkg.version,
      invalid: pkg.invalid,
      path: path.length === 1 ? undefined : path.slice(0, -1) // Set to undefined if path is empty
    });
  }
  if (hasDependencies(pkg)) {
    for (const [key, value] of Object.entries(pkg.dependencies)) {
      result.push(...transformToPackageInfo(value, [...path, key]));
    }
  }
  return result;
};

export const traverseDependencyTree = (dependencyTree: DependencyTree): PackageInfo[] => {
  const result: PackageInfo[] = [];
  for (const [name, pkg] of Object.entries(dependencyTree)) {
    result.push(...transformToPackageInfo(pkg, [name]));
  }
  return result;
};
