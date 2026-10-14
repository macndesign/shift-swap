// As declarações em dist/cjs descrevem o dist/index.cjs. Este package.json faz o Node e o
// TypeScript tratá-las como CommonJS (o package.json da raiz é "type": "module").
import { writeFileSync } from "node:fs";

writeFileSync("dist/cjs/package.json", `${JSON.stringify({ type: "commonjs" }, null, 2)}\n`);
