const uniqueChannels = (import.meta.env.VITE_TWITCH_CHANNELS ?? "morality666")
  .split(",")
  .map((channel: string) => channel.trim().toLowerCase())
  .filter(Boolean);

const normalizeDomain = (domain: string) => {
  const trimmed = domain.trim();

  if (!trimmed) {
    return "";
  }

  try {
    return new URL(trimmed.includes("://") ? trimmed : `https://${trimmed}`)
      .hostname;
  } catch {
    return trimmed.split("/")[0]?.split(":")[0] ?? "";
  }
};

const twitchParentDomains = (
  import.meta.env.VITE_TWITCH_PARENT_DOMAINS ??
  "munaliiga.fi,www.munaliiga.fi,localhost,127.0.0.1"
)
  .split(",")
  .map((domain: string) => normalizeDomain(domain).toLowerCase())
  .filter(Boolean);

const signupOpensAt =
  import.meta.env.VITE_SIGNUP_OPENS_AT?.trim() || null;
const signupOpenOverride =
  import.meta.env.VITE_SIGNUPS_OPEN?.trim().toLowerCase() || null;

export const siteConfig = {
  discordUrl:
    import.meta.env.VITE_DISCORD_URL ?? "https://discord.gg/Nd75KFMAQt",
  signup: {
    opensAt: signupOpensAt,
    season: import.meta.env.VITE_SEASON_NUMBER?.trim() || "3",
    url: import.meta.env.VITE_SIGNUP_URL ?? "https://forms.google.com",
  },
  twitchChannels: [...new Set(["morality666", ...uniqueChannels])],
  twitchParentDomains: [...new Set(twitchParentDomains)],
  youtubeUrl:
    import.meta.env.VITE_YOUTUBE_URL ??
    "https://www.youtube.com/@morality666",
} as const;

const signupTimestamp = siteConfig.signup.opensAt
  ? Date.parse(siteConfig.signup.opensAt)
  : Number.NaN;

export const signupsAreLive = signupOpenOverride
  ? signupOpenOverride === "true"
  : Number.isFinite(signupTimestamp) && Date.now() >= signupTimestamp;
