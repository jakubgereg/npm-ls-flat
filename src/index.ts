#!/usr/bin/env node

import { exec } from 'node:child_process';
import path from 'node:path';
import chalk from 'chalk';
import fs from 'fs-extra';
import lodash from 'lodash';
import semver from 'semver';

import type { DependencyList, DependencyTree, PackageInfo, PackageJsonType, PackageType } from './types.js';
import { sortPackageVersions, traverseDependencyTree } from './utils.js';

const readPackageJsonFile = async (path: string, allowDev = false): Promise<DependencyList> => {
  try {
    const { dependencies, devDependencies }: PackageJsonType = await fs.readJson(path);
    let allPackages = { ...dependencies };
    if (allowDev && devDependencies) allPackages = { ...allPackages, ...devDependencies };
    return allPackages;
  } catch (err) {
    console.error('Error reading package.json:', err);
    throw err;
  }
};

const getDependencyTree = (packages: string[] = []): Promise<DependencyTree | undefined> =>
  new Promise((resolve, reject) => {
    const npmls = packages.length ? `npm ls ${packages.join(' ')} --all --json` : 'npm ls --all --json';
    exec(npmls, (_, stdout) => {
      try {
        const { dependencies } = JSON.parse(stdout) as PackageType;
        resolve(dependencies);
      } catch (parseError) {
        reject(parseError);
      }
    });
  });

const findMismatchedVersions = (deps: Record<string, PackageInfo[]>): Record<string, [PackageInfo, PackageInfo[]]> =>
  Object.entries(deps).reduce(
    (acc, [name, dependencies]) => {
      const root = dependencies.find((dependency) => !dependency.path);
      if (!root) return acc;
      const differentVersions = dependencies.filter((dependency) => dependency.version !== root.version);
      const versions: [PackageInfo, PackageInfo[]] | [] = differentVersions.length
        ? [root, dependencies.filter((dependency) => dependency.version !== root.version)]
        : [root, []];

      if (versions[1].length > 0 || root.invalid) acc[name] = versions;
      return acc;
    },
    {} as Record<string, [PackageInfo, PackageInfo[]]>
  );

(async () => {
  const packageJsonPath = path.resolve(process.cwd(), 'package.json');
  try {
    const packageNames = Object.keys(await readPackageJsonFile(packageJsonPath, true));
    console.log(
      `Looking for mismatches in ${chalk.greenBright(packageNames.length)} ${
        packageNames.length > 1 ? 'packages' : 'package'
      }...`
    );
    const dependencyTree = await getDependencyTree(packageNames);
    const groupedDependencyTree = lodash.groupBy(
      traverseDependencyTree(dependencyTree ?? {}).filter((dependency) =>
        packageNames.some((name) => dependency.name === name)
      ),
      'name'
    );

    const mismatches = Object.values(findMismatchedVersions(groupedDependencyTree))
      //sort first packages that have invalid versions
      .sort((a) => (a[0].invalid ? -1 : 1));

    if (!mismatches.length) {
      console.log(chalk.green('All packages have consistent versions.'));
      return;
    }

    for (const [root, pckgs] of mismatches) {
      console.log(
        `\n${root.name} ${chalk.cyanBright(root.version)} ${root.invalid ? chalk.redBright('(invalid)') : ''}`
      );
      if (root.invalid) console.log(` ${chalk.redBright(root.invalid)}`);

      const sortedPackages = sortPackageVersions(pckgs, 'DESC');

      const packageVersionColor = (version: string) =>
        semver.gt(root.version, version) ? chalk.redBright(version) : chalk.greenBright(version);
      for (const pckg of sortedPackages) {
        console.log(
          ` ${packageVersionColor(pckg.version)} (${chalk.yellow(pckg.path?.map(({ name }) => name)?.join(' > '))})`
        );
      }
    }
  } catch (err) {
    console.error('Failed to get packages:', err);
  }
})();
