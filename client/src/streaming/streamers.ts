import { siteConfig } from "../config.ts";

export type Streamer = {
  channel: string;
  isMainCaster: boolean;
};

export const STREAMERS: Streamer[] = siteConfig.twitchChannels.map((channel) => ({
  channel,
  isMainCaster: channel === "morality666",
}));

const shuffledCommunityCasters = STREAMERS.filter(
  (streamer) => !streamer.isMainCaster,
);

for (let index = shuffledCommunityCasters.length - 1; index > 0; index -= 1) {
  const randomIndex = Math.floor(Math.random() * (index + 1));
  [shuffledCommunityCasters[index], shuffledCommunityCasters[randomIndex]] = [
    shuffledCommunityCasters[randomIndex],
    shuffledCommunityCasters[index],
  ];
}

export const STREAMER_CHECK_ORDER = [
  ...STREAMERS.filter((streamer) => streamer.isMainCaster),
  ...shuffledCommunityCasters,
];
