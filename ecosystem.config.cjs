/** PM2 — Scheikunde Aantekeningen (poort 3008; 3000=dash, 3007=med). */
module.exports = {
  apps: [
    {
      name: "aantekeningen",
      cwd: "/var/www/aantekeningen",
      script: "npm",
      args: "start",
      env: {
        NODE_ENV: "production",
        PORT: 3008,
        TZ: "Europe/Amsterdam",
      },
    },
  ],
};
