const fs = require("node:fs");
const path = require("node:path");

function loadDotEnv(filePath) {
  if (!fs.existsSync(filePath)) return {};
  const env = {};
  for (const line of fs.readFileSync(filePath, "utf8").split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    env[key] = value;
  }
  return env;
}

const root = path.join(__dirname, "..");
const fileEnv = loadDotEnv(path.join(root, ".env"));

module.exports = {
  apps: [
    {
      name: "syncpedia-community",
      cwd: root,
      script: ".output/server/index.mjs",
      interpreter: "node",
      instances: 1,
      autorestart: true,
      max_memory_restart: "512M",
      env: {
        ...fileEnv,
        NODE_ENV: "production",
        PORT: 3001,
        HOST: "127.0.0.1",
      },
    },
  ],
};
