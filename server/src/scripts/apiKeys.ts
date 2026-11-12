// Manages the public API's keys, which used to be done through the old API with an owner key.
//
//   yarn workspace server run keys list
//   yarn workspace server run keys create --name "strafes bot" --owner <discord id> --permissions lookup,link [--webhook <url>]
//   yarn workspace server run keys permissions <id> lookup,link
//   yarn workspace server run keys webhook <id> <url>   (or "none" to remove it; a new URL gets a new secret)
//   yarn workspace server run keys revoke <id>
//
// Uses LINKS_DB_USER/LINKS_DB_PASSWORD from .env, or the auth DB's user.

import { parseArgs } from "util";
import { LinksClient } from "../links/db.js";
import { formatPermissions, parsePermissions, PERMISSION_NAMES } from "../links/keys.js";

const USAGE = `Usage:
  keys list
  keys create --name <name> --owner <discord id> --permissions <${PERMISSION_NAMES.join(",").toLowerCase()}> [--webhook <url>]
  keys permissions <id> <${PERMISSION_NAMES.join(",").toLowerCase()}>
  keys webhook <id> <url | none>
  keys revoke <id>`;

function fail(message: string): never {
    console.error(message);
    console.error();
    console.error(USAGE);
    process.exit(1);
}

function parseId(value: string | undefined) {
    if (!value || !/^\d+$/.test(value)) {
        fail("Expected a key ID (from \"keys list\")");
    }
    return +value;
}

function parseWebhookUrl(value: string) {
    let url: URL;
    try {
        url = new URL(value);
    }
    catch {
        fail(`Not a URL: ${value}`);
    }
    if (url.protocol !== "https:" && url.protocol !== "http:") {
        fail("The webhook has to be http or https");
    }
    if (url.protocol === "http:" && !["localhost", "127.0.0.1", "[::1]"].includes(url.hostname)) {
        console.warn("Warning: the webhook isn't https, and isn't on this machine. Events (and their signatures) will be sent in the clear.");
    }
    return url.href;
}

function formatDate(date: Date | undefined) {
    return date ? date.toISOString().replace("T", " ").slice(0, 16) : "never";
}

async function main() {
    const { positionals, values } = parseArgs({
        allowPositionals: true,
        options: {
            name: { type: "string" },
            owner: { type: "string" },
            permissions: { type: "string" },
            webhook: { type: "string" }
        }
    });

    const [command, ...args] = positionals;
    if (!command) {
        fail("Missing a command");
    }

    const user = process.env.LINKS_DB_USER ?? process.env.AUTH_DB_USER;
    const password = process.env.LINKS_DB_PASSWORD ?? process.env.AUTH_DB_PASSWORD;
    if (!user || !password) {
        fail("Missing LINKS_DB_USER/LINKS_DB_PASSWORD (or AUTH_DB_USER/AUTH_DB_PASSWORD) in .env");
    }

    const links = new LinksClient(user, password);
    try {
        switch (command) {
            case "list": {
                const keys = await links.listApiKeys();
                if (keys.length === 0) {
                    console.log("No keys yet");
                    break;
                }
                console.table(keys.map((key) => ({
                    id: key.id,
                    name: key.name,
                    owner: key.ownerDiscordId,
                    permissions: formatPermissions(key.permissions),
                    webhook: key.webhookUrl ?? "",
                    created: formatDate(key.createdAt),
                    "last used": formatDate(key.lastUsedAt),
                    revoked: key.revokedAt ? formatDate(key.revokedAt) : ""
                })));
                break;
            }
            case "create": {
                const name = values.name?.trim();
                if (!name || name.length > 100) {
                    fail("--name is required (up to 100 characters). Users see it on the link page.");
                }
                if (!values.owner || !/^\d{1,20}$/.test(values.owner)) {
                    fail("--owner is required: the Discord ID of who the key is for");
                }
                let permissions: number;
                try {
                    permissions = parsePermissions(values.permissions ?? "");
                }
                catch (err) {
                    fail((err as Error).message);
                }
                const webhookUrl = values.webhook ? parseWebhookUrl(values.webhook) : undefined;

                const created = await links.createApiKey(name, values.owner, permissions, webhookUrl);
                console.log(`Created key ${created.id} (${formatPermissions(permissions)}). It isn't stored, so copy it now:`);
                console.log();
                console.log(`  API key:        ${created.key}`);
                if (created.webhookSecret) {
                    console.log(`  Webhook secret: ${created.webhookSecret}`);
                }
                console.log();
                break;
            }
            case "permissions": {
                const id = parseId(args[0]);
                let permissions: number;
                try {
                    permissions = parsePermissions(args[1] ?? "");
                }
                catch (err) {
                    fail((err as Error).message);
                }
                if (!await links.setApiKeyPermissions(id, permissions)) {
                    fail(`There's no key ${id}`);
                }
                console.log(`Key ${id} now has: ${formatPermissions(permissions)}`);
                break;
            }
            case "webhook": {
                const id = parseId(args[0]);
                if (!args[1]) {
                    fail("Expected a URL, or \"none\"");
                }
                const webhookUrl = args[1] === "none" ? undefined : parseWebhookUrl(args[1]);
                const result = await links.setApiKeyWebhook(id, webhookUrl);
                if (!result) {
                    fail(`There's no key ${id}`);
                }
                if (result.webhookSecret) {
                    console.log(`Key ${id} now sends events to ${webhookUrl}, signed with this secret (copy it now, the old one no longer works):`);
                    console.log();
                    console.log(`  Webhook secret: ${result.webhookSecret}`);
                    console.log();
                }
                else {
                    console.log(`Key ${id} no longer has a webhook`);
                }
                break;
            }
            case "revoke": {
                const id = parseId(args[0]);
                if (!await links.revokeApiKey(id)) {
                    fail(`There's no key ${id}, or it was already revoked`);
                }
                console.log(`Revoked key ${id}. Its pending link requests no longer work either.`);
                break;
            }
            default:
                fail(`Unknown command "${command}"`);
        }
    }
    finally {
        await links.end();
    }
}

await main();
