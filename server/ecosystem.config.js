module.exports = {
  apps: [
    {
      name: 'cold-storage-api',
      script: 'server.js',
      instances: 'max',          // Use all available CPU cores
      exec_mode: 'cluster',
      watch: false,
      max_memory_restart: '500M',
      env: {
        NODE_ENV: 'development',
        PORT: 5000,
      },
      env_production: {
        NODE_ENV: 'production',
        PORT: 5000,
      },
      // Logging
      log_file: './logs/pm2-combined.log',
      out_file: './logs/pm2-out.log',
      error_file: './logs/pm2-error.log',
      merge_logs: true,
      log_date_format: 'YYYY-MM-DD HH:mm:ss',
      // Restart strategy
      autorestart: true,
      max_restarts: 10,
      restart_delay: 4000,
      min_uptime: '5s',
      // Graceful shutdown
      kill_timeout: 10000,
      listen_timeout: 10000,
      // Health monitoring
      health_check_interval: 30000,
    },
  ],

  deploy: {
    production: {
      user: 'deploy',
      host: 'your-server-ip',
      ref: 'origin/main',
      repo: 'git@github.com:your-org/cold-storage-backend.git',
      path: '/var/www/cold-storage-api',
      'pre-deploy-local': '',
      'post-deploy': 'npm install && pm2 reload ecosystem.config.js --env production',
      'pre-setup': '',
    },
  },
};
