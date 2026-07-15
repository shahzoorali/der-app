module.exports = {
    apps: [
        {
            name: "der-2026",
            script: "server.js",
            cwd: "./.next/standalone",
            // Single instance in fork mode: the app holds one long-lived
            // WhatsApp (Baileys) socket in-memory. Cluster mode with multiple
            // instances would each open their own socket against the same
            // session and fight each other with "stream conflict" errors.
            instances: 1,
            exec_mode: "fork",
            env: {
                PORT: 3003,
                NODE_ENV: "production"
                // All secrets (ADMIN_PASSWORD, AWS creds, SESSION_SECRET, etc.)
                // come from the .env file symlinked into .next/standalone —
                // not hardcoded here.
            }
        }
    ]
};
