/** PM2 — Scheikunde Aantekeningen (poort 3017). */
module.exports = {
  apps: [
    {
      name: "aantekeningen",
      cwd: "/var/www/aantekeningen",
      script: "npm",
      args: "start",
      env: {
        NODE_ENV: "production",
        PORT: 3017,
        TZ: "Europe/Amsterdam",
      },
    },
  ],
};
