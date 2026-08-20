import { glob } from 'glob';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

export async function importDefaults<T>(dir: string) {
  const files = await glob('**/*.{ts,js}', {
    cwd: dir,
    nodir: true,
    ignore: ['**/*.spec.ts', '**/*.d.ts', '**/_*', '**/_*/**'],
  });

  const modules: { file: string; value: T }[] = [];

  for (const file of files) {
    const value = (await import(pathToFileURL(resolve(dir, file)).href)).default as T;
    modules.push({ file, value });
  }

  return modules;
}
