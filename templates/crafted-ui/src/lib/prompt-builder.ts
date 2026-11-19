import type { PropValues, RegistryComponent, RegistryItemJSON } from "@/types/registry";

export type PackageManager = "pnpm" | "npm" | "yarn" | "bun";

export const filePath = (c: RegistryComponent) => `components/ui/${c.slug}.tsx`;

export const registryUrl = (c: RegistryComponent, origin: string) => `${origin}/api/r/${c.slug}.json`;

export function cliCommand(c: RegistryComponent, pm: PackageManager, origin: string) {
  const runner = { pnpm: "pnpm dlx", npm: "npx", yarn: "yarn dlx", bun: "bunx --bun" }[pm];
  return `${runner} shadcn@latest add "${registryUrl(c, origin)}"`;
}

export function installDeps(c: RegistryComponent, pm: PackageManager = "npm") {
  if (!c.dependencies.length) return "";
  const verb = pm === "npm" ? "npm install" : `${pm} add`;
  return `${verb} ${c.dependencies.join(" ")}`;
}

function jsxValue(v: PropValues[string]) {
  if (typeof v === "string") return JSON.stringify(v);
  return `{${String(v)}}`;
}

/** Usage snippet with only the props that differ from the schema defaults. */
export function usageCode(c: RegistryComponent, props: PropValues, all = false) {
  const changed = c.propSchema.filter((p) => props[p.name] !== undefined && (all || props[p.name] !== p.default));
  const attrs = changed.map((p) => `\n      ${p.name}=${jsxValue(props[p.name])}`).join("");
  const open = changed.length ? `<${c.exportName}${attrs}\n    />` : `<${c.exportName} />`;
  return `import { ${c.exportName} } from "@/components/ui/${c.slug}";

export default function ${c.exportName}Demo() {
  return (
    ${open}
  );
}
`;
}

/** The "Copy prompt" text: everything a coding agent needs to drop the component into a project. */
export function buildPrompt(c: RegistryComponent, source: string, props: PropValues, origin: string) {
  const deps = installDeps(c);
  return `You are given a task to integrate an existing React component in the codebase.

The codebase should support:
- shadcn project structure
- Tailwind CSS
- TypeScript

If it doesn't, provide instructions on how to set up the project via shadcn CLI, install Tailwind or TypeScript.

Determine the default path for components and styles. If the default path for components is not /components/ui, explain why it's important to create this folder.

## Component: ${c.name}
${c.description}

Copy-paste this component to /${filePath(c)}:
\`\`\`tsx
${source.trimEnd()}
\`\`\`

## Usage (demo.tsx)
\`\`\`tsx
${usageCode(c, props).trimEnd()}
\`\`\`
${deps ? `\n## Install NPM dependencies\n\`\`\`bash\n${deps}\n\`\`\`\n` : ""}
## Or install with the shadcn CLI
\`\`\`bash
${cliCommand(c, "npm", origin)}
\`\`\`

Implementation guidelines:
1. Analyze the component structure and identify all required dependencies.
2. Review the component's arguments and state.
3. Identify any required context providers or hooks and install them.
4. Questions to ask:
   - What data/props will be passed to this component?
   - Are there any specific state management requirements?
   - Are there any required assets (images, icons, etc.)?
   - What is the expected responsive behavior?
   - What is the best place to use this component in the app?

Steps to integrate:
0. Copy-paste all the code above in the correct directories.
1. Install external dependencies.
2. Fill image assets with Unsplash stock images you know exist.
3. Use lucide-react icons for svgs or logos if the component requires them.
`;
}

export function registryItem(c: RegistryComponent, source: string): RegistryItemJSON {
  return {
    $schema: "https://ui.shadcn.com/schema/registry-item.json",
    name: c.slug,
    type: "registry:ui",
    title: c.name,
    description: c.description,
    dependencies: c.dependencies,
    registryDependencies: c.registryDependencies,
    files: [{ path: filePath(c), content: source, type: "registry:ui" }],
    tailwind: c.tailwind ?? { config: {} },
  };
}
