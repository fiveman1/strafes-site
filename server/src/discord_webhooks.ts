// Types stolen from https://github.com/toanbku/send-discord-webhook/blob/main/src/index.ts

export type DiscordWebhookField = {
    name: string;
    value: string;
    inline?: boolean;
};

export type DiscordEmbedAuthor = {
    name: string;
    url?: string;
    icon_url?: string;
};

export type DiscordEmbedFooter = {
    text: string;
    icon_url?: string;
};

export type DiscordEmbed = {
    title: string;
    description?: string;
    url?: string;
    color?: number;
    fields?: DiscordWebhookField[];
    author?: DiscordEmbedAuthor;
    thumbnail?: { url: string };
    image?: { url: string };
    footer?: DiscordEmbedFooter;
    timestamp?: string;
};

export type DiscordWebhookParams = {
    url?: string;
    username?: string;
    avatar_url?: string;
    content?: string;
    embeds?: DiscordEmbed[];
};