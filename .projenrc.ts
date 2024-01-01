import {
  Component,
  FileBase,
  IResolver,
  SampleDir,
  javascript,
  typescript,
} from "projen";
import {
  NodeProject,
  TypeScriptJsxMode,
  TypeScriptModuleResolution,
} from "projen/lib/javascript";
import { TypeScriptProjectOptions } from "projen/lib/typescript";

class ReactViteSampleCode extends Component {
  constructor(p: NodeProject) {
    super(p);

    new SampleDir(p, "public", {
      files: {
        "vite.svg": `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" aria-hidden="true" role="img" class="iconify iconify--logos" width="31.88" height="32" preserveAspectRatio="xMidYMid meet" viewBox="0 0 256 257"><defs><linearGradient id="IconifyId1813088fe1fbc01fb466" x1="-.828%" x2="57.636%" y1="7.652%" y2="78.411%"><stop offset="0%" stop-color="#41D1FF"></stop><stop offset="100%" stop-color="#BD34FE"></stop></linearGradient><linearGradient id="IconifyId1813088fe1fbc01fb467" x1="43.376%" x2="50.316%" y1="2.242%" y2="89.03%"><stop offset="0%" stop-color="#FFEA83"></stop><stop offset="8.333%" stop-color="#FFDD35"></stop><stop offset="100%" stop-color="#FFA800"></stop></linearGradient></defs><path fill="url(#IconifyId1813088fe1fbc01fb466)" d="M255.153 37.938L134.897 252.976c-2.483 4.44-8.862 4.466-11.382.048L.875 37.958c-2.746-4.814 1.371-10.646 6.827-9.67l120.385 21.517a6.537 6.537 0 0 0 2.322-.004l117.867-21.483c5.438-.991 9.574 4.796 6.877 9.62Z"></path><path fill="url(#IconifyId1813088fe1fbc01fb467)" d="M185.432.063L96.44 17.501a3.268 3.268 0 0 0-2.634 3.014l-5.474 92.456a3.268 3.268 0 0 0 3.997 3.378l24.777-5.718c2.318-.535 4.413 1.507 3.936 3.838l-7.361 36.047c-.495 2.426 1.782 4.5 4.151 3.78l15.304-4.649c2.372-.72 4.652 1.36 4.15 3.788l-11.698 56.621c-.732 3.542 3.979 5.473 5.943 2.437l1.313-2.028l72.516-144.72c1.215-2.423-.88-5.186-3.54-4.672l-25.505 4.922c-2.396.462-4.435-1.77-3.759-4.114l16.646-57.705c.677-2.35-1.37-4.583-3.769-4.113Z"></path></svg>`,
      },
    });
  }
}

/**
 * Type of a map mapping strings to some arbitrary type
 */
export type Obj<T> = { [key: string]: T };

/**
 * Return whether the given value is an object
 *
 * Even though arrays and instances of classes technically are objects, we
 * usually want to treat them differently, so we return false in those cases.
 */
export function isObject(x: any): x is Obj<any> {
  return (
    x !== null &&
    typeof x === "object" &&
    !Array.isArray(x) &&
    x.constructor.name === "Object"
  );
}

/**
 * Recursively merge objects together
 *
 * The leftmost object is mutated and returned. Arrays are not merged
 * but overwritten just like scalars.
 *
 * If an object is merged into a non-object, the non-object is lost.
 *
 * `undefined`s will cause a value to be deleted if destructive is enabled.
 */
export function deepMerge(
  objects: Array<Obj<any> | undefined>,
  destructive: boolean = false,
) {
  function mergeOne(target: Obj<any>, source: Obj<any>) {
    for (const key of Object.keys(source)) {
      const value = source[key];

      if (isObject(value)) {
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

class ViteConfig extends FileBase {
  protected synthesizeContent(_resolver: IResolver): string | undefined {
    return [
      "import { defineConfig } from 'vite'",
      "import react from '@vitejs/plugin-react-swc'",
      "",
      "// https://vitejs.dev/config/",
      "export default defineConfig({",
      "  plugins: [react()],",
      "})",
    ].join("\n");
  }
}

export class ViteComponent extends Component {
  viteConfig: ViteConfig;
  constructor(project: NodeProject) {
    super(project);

    project.addDeps("react", "react-dom");
    project.addDevDeps(
      "@types/react",
      "@types/react-dom",
      "@vitejs/plugin-react-swc",
      "vite",
    );

    project.compileTask.exec("vite build");

    this.viteConfig = new ViteConfig(this, "vite.config.ts");

    project.addTask("dev", {
      description: "Starts the vite application",
      exec: `vite`,
    });

    project.addTask("preview", {
      description: "Preview the vite application",
      exec: `vite preview`,
    });
  }
}

class ViteProject extends typescript.TypeScriptProject {
  constructor(options: ViteProjectOptions) {
    const defaultOptions: Partial<TypeScriptProjectOptions> = {
      tsconfig: {
        compilerOptions: {
          target: "ES2020",
          // useDefineForClassFields: true,
          lib: ["ES2020", "DOM", "DOM.Iterable"],
          module: "ESNext",
          skipLibCheck: true,

          /* Bundler mode */
          moduleResolution: TypeScriptModuleResolution.BUNDLER,
          allowImportingTsExtensions: true,
          resolveJsonModule: true,
          isolatedModules: true,
          noEmit: true,
          jsx: TypeScriptJsxMode.REACT_JSX,

          /* Linting */
          strict: true,
          noUnusedLocals: true,
          noUnusedParameters: true,
          noFallthroughCasesInSwitch: true,
        },
        include: ["src"],
        // references: [{ path: "./tsconfig.node.json" }],
      },
      tsconfigDev: {
        compilerOptions: {
          lib: ["es2019"],
          module: "CommonJS",
        },
      },
      // tsconfigDev: {
      //   compilerOptions: {
      //     // composite: true,
      //     skipLibCheck: true,
      //     module: "ESNext",
      //     moduleResolution: TypeScriptModuleResolution.BUNDLER,
      //     allowSyntheticDefaultImports: true,
      //   },
      //   include: ["vite.config.ts"],
      // },
      // tsconfigDevFile: "tsconfig.node.json",
      typescriptVersion: options.typescriptVersion ?? "^5.0.0",
    };

    super(
      deepMerge([
        defaultOptions,
        options,
        { sampleCode: false },
      ]) as TypeScriptProjectOptions,
    );

    this.package.addField("type", "module");

    new ViteComponent(this);

    // generate sample code in `src` and `public` if these directories are empty or non-existent.
    if (options.sampleCode ?? true) {
      new ReactViteSampleCode(this);
    }
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
