# shared-site-config

`SiteConfigService`: per-environment backend URLs read from `site-config.json` at runtime (written by `tools/scripts/prepare-hosting.mjs --site-config`).

`n8nUrl` points StudyLM and ChatPulse at a self-hosted n8n (`n8nWebhookUrl(config, name)` builds a webhook URL). Development uses the local container; in production it comes from the `N8N_URL` CI secret, so the tunnel address never lands in the repository. Without it both apps fall back to the local container and let visitors enter their own webhook URL.
