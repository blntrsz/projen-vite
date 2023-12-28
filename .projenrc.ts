import { Component, javascript, typescript } from "projen";
import { NodeProject } from "projen/lib/javascript";
import { TypeScriptProjectOptions } from "projen/lib/typescript";
import { deepMerge } from "./src/util";

export interface ViteProjectOptions extends TypeScriptProjectOptions {}

export class ViteComponent extends Component {
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
      typescriptVersion: options.typescriptVersion ?? "^5.0.0",
    };

    super(
      deepMerge([
        defaultOptions,
        options,
        { sampleCode: false },
      ]) as TypeScriptProjectOptions,
    );

    new ViteComponent(this);
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
