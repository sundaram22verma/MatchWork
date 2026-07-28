import fs from "node:fs";
import path from "node:path";

const pluginPath = path.resolve(
  process.cwd(),
  "node_modules/@tanstack/start-plugin-core/dist/esm/vite/start-compiler-plugin/plugin.js",
);

if (fs.existsSync(pluginPath)) {
  let content = fs.readFileSync(pluginPath, "utf8");
  const target = `await this.environment.transformRequest(\`\${absPath}?\${SERVER_FN_LOOKUP}\`);`;
  const replacement = `await this.environment.transformRequest(absPath);\n\t\t\t\t\t\t\t\tawait this.environment.transformRequest(\`\${absPath}?\${SERVER_FN_LOOKUP}\`);`;

  if (
    content.includes(target) &&
    !content.includes(`await this.environment.transformRequest(absPath);`)
  ) {
    content = content.replace(target, replacement);
    fs.writeFileSync(pluginPath, content, "utf8");
    console.log("[patch-tanstack-start] Successfully patched @tanstack/start-plugin-core.");
  }
}
