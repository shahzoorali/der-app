module.exports = {
    apps: [
        {
            name: "der-2026",
            script: "server.js",
            cwd: "./.next/standalone",
            instances: "max",
            exec_mode: "cluster",
            env: {
                PORT: 3000,
                NODE_ENV: "production",
                ADMIN_PASSWORD: "ramzaan2026"
            }
        }
    ]
};
