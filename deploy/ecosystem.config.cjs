/** PM2 process file — run from project root: pm2 start deploy/ecosystem.config.cjs */
module.exports = {
  apps: [
    {
      name: "syncpedia-community",
      cwd: __dirname + "/..",
      script: ".output/server/index.mjs",
      interpreter: "node",
      instances: 1,
      autorestart: true,
      max_memory_restart: "512M",
      env: {
        NODE_ENV: "production",
        PORT: 3000,
        HOST: "127.0.0.1",
      },
    },
  ],
};
