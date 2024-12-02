export type DependencyList = Record<string, string>;

export interface PackageJsonType {
  dependencies?: DependencyList;
  devDependencies?: DependencyList;
}

export type DependencyTree = Record<string, PackageType>;

export interface PackageType {
  version: string;
  invalid?: string;
  dependencies?: DependencyTree;
}

export interface PackageBaseInfo {
  name: string;
  version: string;
}

export interface PackageInfo extends PackageBaseInfo {
  name: string;
  version: string;
  invalid?: string;
  path?: PackageBaseInfo[];
}
