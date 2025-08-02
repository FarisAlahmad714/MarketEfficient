// ecosystem.config.js
// PM2 configuration for running the app with continuous monitoring

module.exports = {
  apps: [
    {
      name: 'marketefficient',
      script: 'npm',
      args: 'start',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '2G',
      env: {
        NODE_ENV: 'production',
        PORT: 3000
      },
      error_file: './logs/app-error.log',
      out_file: './logs/app-out.log',
      log_file: './logs/app-combined.log',
      time: true
    },
    {
      name: 'monitoring-worker',
      script: './lib/monitoring-worker.js',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '512M',
      env: {
        NODE_ENV: 'production'
      },
      error_file: './logs/monitor-error.log',
      out_file: './logs/monitor-out.log',
      log_file: './logs/monitor-combined.log',
      time: true,
      cron_restart: '0 */6 * * *' // Restart every 6 hours to prevent any memory leaks
    }
  ],

  deploy: {
    production: {
      user: 'node',
      host: 'localhost',
      ref: 'origin/main',
      repo: 'git@github.com:user/repo.git',
      path: '/var/www/marketefficient',
      'post-deploy': 'npm install && pm2 reload ecosystem.config.js --env production'
    }
  }
};