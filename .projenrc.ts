import { javascript, typescript } from "projen";
import { TypeScriptProjectOptions } from "projen/lib/typescript";

export type Obj<T> = { [key: string]: T };

export function deepMerge(
  objects: Array<Obj<any> | undefined>,
  destructive: boolean = false,
) {
  function mergeOne(target: Obj<any>, source: Obj<any>) {
    for (const key of Object.keys(source)) {
      const value = source[key];

      if (typeof value === "object") {
        // if the value at the target is not an object, override it with an
        // object so we can continue the recursion
        if (typeof target[key] !== "object") {
          target[key] = value;
        }

        if ("__$APPEND" in value && Array.isArray(value.__$APPEND)) {
          if (Array.isArray(target[key])) {
            target[key].push(...value.__$APPEND);
          } else {
            target[key] = value.__$APPEND;
          }
        }

        mergeOne(target[key], value);

        // if the result of the merge is an empty object, it's because the
        // eventual value we assigned is `undefined`, and there are no
        // sibling concrete values alongside, so we can delete this tree.
        const output = target[key];
        if (
          typeof output === "object" &&
          Object.keys(output).length === 0 &&
          destructive
        ) {
          delete target[key];
        }
      } else if (value === undefined && destructive) {
        delete target[key];
      } else if (typeof value !== "undefined") {
        target[key] = value;
      }
    }
  }

  const others = objects.filter((x) => x != null) as Array<Obj<any>>;

  if (others.length === 0) {
    return {};
  }
  const into = others.splice(0, 1)[0];

  others.forEach((other) => mergeOne(into, other));
  return into;
}

export interface ViteProjectOptions extends TypeScriptProjectOptions {}

class ViteProject extends typescript.TypeScriptProject {
  constructor(options: ViteProjectOptions) {
    const defaultOptions = {
      typescriptVersion: options.typescriptVersion ?? "^5.0.0",
    };

    super(
      deepMerge([
        defaultOptions,
        options,
        { sampleCode: false },
      ]) as TypeScriptProjectOptions,
    );
  }
}

const project = new ViteProject({
  defaultReleaseBranch: "main",
  name: "projen-vite",
  packageManager: javascript.NodePackageManager.PNPM,
  prettier: true,
  projenrcTs: true,

  // deps: [],                /* Runtime dependencies of this module. */
  // description: undefined,  /* The description is just a string that helps people understand the purpose of the package. */
  // devDeps: [],             /* Build dependencies for this module. */
  // packageName: undefined,  /* The "name" in package.json. */
});
project.synth();
