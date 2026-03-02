module.exports = {
  apps: [
    {
      name: "pulse",
      script: "packages/server/dist/index.js",
      cwd: "/home/pulse/app",
      env: {
        NODE_ENV: "production",
        PORT: 3000,
      },
      max_memory_restart: "512M",
      autorestart: true,
    },
  ],
};
