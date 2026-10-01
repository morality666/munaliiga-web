import clsx from "clsx";
import { useEffect, useId, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { siteConfig } from "../config.ts";
import { onAirCasters } from "../schedule/schedule.ts";
import { useStreamStatus } from "./StreamStatus.tsx";
import { STREAMER_CHECK_ORDER } from "./streamers.ts";

type TwitchPlayerInstance = {
  addEventListener: (event: string, callback: () => void) => void;
  getChannel: () => string;
  setChannel: (channel: string) => void;
};

type TwitchPlayerConstructor = {
  new (
    elementId: string,
    options: {
      autoplay: boolean;
      channel: string;
      height: string;
      muted: boolean;
      parent: string[];
      width: string;
    },
  ): TwitchPlayerInstance;
  ENDED: string;
  OFFLINE: string;
  ONLINE: string;
  PAUSE: string;
  PLAY: string;
  PLAYING: string;
};

declare global {
  interface Window {
    Twitch?: {
      Player: TwitchPlayerConstructor;
    };
  }
}

let twitchScriptPromise: Promise<void> | undefined;

const MIN_TWITCH_PLAYER_WIDTH = 400;
const MIN_TWITCH_PLAYER_HEIGHT = 300;
const RECHECK_INTERVAL = 60_000;
const SWITCH_DELAY = 1_200;

/**
 * The order channels are tried in: the casters of the match on air, then the
 * main caster and the community casters.
 */
const channelOrder = () => [
  ...new Set([
    ...onAirCasters(),
    ...STREAMER_CHECK_ORDER.map((streamer) => streamer.channel),
  ]),
];

const sameChannels = (first: string[], second: string[]) =>
  first.length === second.length &&
  first.every((channel, index) => channel === second[index]);

const getTwitchParentDomains = () => {
  const currentHost = window.location.hostname.toLowerCase();
  const localAlias =
    currentHost === "127.0.0.1" || currentHost === "::1"
      ? "localhost"
      : "";

  return [
    currentHost,
    localAlias,
    ...siteConfig.twitchParentDomains,
  ].filter((domain, index, domains): domain is string => {
    return Boolean(domain) && domains.indexOf(domain) === index;
  });
};

const loadTwitchPlayer = () => {
  if (window.Twitch?.Player) {
    return Promise.resolve();
  }

  if (!twitchScriptPromise) {
    twitchScriptPromise = new Promise<void>((resolve, reject) => {
      const existingScript = document.querySelector<HTMLScriptElement>(
        'script[src="https://player.twitch.tv/js/embed/v1.js"]',
      );
      const script = existingScript ?? document.createElement("script");

      script.addEventListener("load", () => resolve(), { once: true });
      script.addEventListener("error", () => reject(new Error("Twitch player failed to load")), {
        once: true,
      });

      if (!existingScript) {
        script.src = "https://player.twitch.tv/js/embed/v1.js";
        script.async = true;
        document.head.appendChild(script);
      }
    });
  }

  return twitchScriptPromise;
};

export function TwitchStream() {
  const { t } = useTranslation();
  const { activeChannel, liveChannels, reportChannelStatus, setActiveChannel } =
    useStreamStatus();
  const elementId = `twitch-player-${useId().replace(/:/g, "")}`;
  const playerShellRef = useRef<HTMLDivElement | null>(null);
  const playerRef = useRef<TwitchPlayerInstance | null>(null);
  // The caster the viewer picked. Once set, the player stays where they put it.
  const pickedChannelRef = useRef<string | null>(null);
  const switchTimerRef = useRef<number | undefined>(undefined);
  const [playerViewportWidth, setPlayerViewportWidth] = useState(0);
  const [channels, setChannels] = useState(channelOrder);
  const shownChannel = activeChannel ?? channels[0];
  const shownChannelIsLive = liveChannels.includes(shownChannel);
  const playerRenderWidth = Math.max(
    Math.round(playerViewportWidth),
    MIN_TWITCH_PLAYER_WIDTH,
  );
  const playerRenderHeight = Math.max(
    Math.round(playerRenderWidth * 9 / 16),
    MIN_TWITCH_PLAYER_HEIGHT,
  );
  const playerScale = playerViewportWidth
    ? playerViewportWidth / playerRenderWidth
    : 1;
  const playerVisibleHeight = playerViewportWidth
    ? Math.round(playerRenderHeight * playerScale)
    : MIN_TWITCH_PLAYER_HEIGHT;

  useEffect(() => {
    const shell = playerShellRef.current;

    if (!shell) {
      return;
    }

    const updatePlayerWidth = () => {
      setPlayerViewportWidth(shell.getBoundingClientRect().width);
    };

    updatePlayerWidth();

    const observer = new ResizeObserver(updatePlayerWidth);
    observer.observe(shell);

    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    let disposed = false;
    const host = document.getElementById(elementId);
    // Channels found offline since the player last found a live one.
    const checkedChannels = new Set<string>();
    // Null until the loaded channel has said whether it is live.
    let loadedIsLive: boolean | null = null;
    // Nobody was live, so the player waits on the first channel, which
    // reports by itself when it goes live.
    let waiting = false;
    // Whether the viewer has the stream playing, from the player's events.
    // Its isPaused() cannot tell: it reads false before the first play too.
    let watching = false;

    const selectChannel = (channel: string) => {
      loadedIsLive = null;
      watching = false;
      setActiveChannel(channel);
      playerRef.current?.setChannel(channel);
    };

    /** Tries the next channel not found offline yet, or waits on the first. */
    const tryNextChannel = (player: TwitchPlayerInstance) => {
      const order = channelOrder();
      const next = order.find((channel) => !checkedChannels.has(channel));

      window.clearTimeout(switchTimerRef.current);

      if (next) {
        switchTimerRef.current = window.setTimeout(
          () => selectChannel(next),
          SWITCH_DELAY,
        );
        return;
      }

      checkedChannels.clear();
      waiting = true;

      if (player.getChannel().toLowerCase() !== order[0]) {
        selectChannel(order[0]);
      }
    };

    const recheck = () => {
      const order = channelOrder();
      setChannels((current) =>
        sameChannels(current, order) ? current : order,
      );

      const player = playerRef.current;

      if (!player || pickedChannelRef.current) {
        return;
      }

      const loaded = player.getChannel().toLowerCase();

      if (waiting) {
        // Try everyone again; the loaded channel reports by itself.
        waiting = false;
        checkedChannels.clear();
        checkedChannels.add(loaded);
        tryNextChannel(player);
      } else if (loadedIsLive && !watching && order.indexOf(loaded) > 0) {
        // A channel ranked above the live one may have gone live since. Only
        // while nobody is watching, so the check never cuts a stream off.
        checkedChannels.clear();
        selectChannel(order[0]);
      }
    };

    void loadTwitchPlayer().then(() => {
      if (disposed || !host || !window.Twitch?.Player) {
        return;
      }

      const Player = window.Twitch.Player;
      const firstChannel = pickedChannelRef.current ?? channelOrder()[0];
      const player = new Player(elementId, {
        autoplay: false,
        channel: firstChannel,
        height: "100%",
        muted: false,
        parent: getTwitchParentDomains(),
        width: "100%",
      });
      playerRef.current = player;
      setActiveChannel(firstChannel);

      player.addEventListener(Player.ONLINE, () => {
        reportChannelStatus(player.getChannel().toLowerCase(), true);
        loadedIsLive = true;
        waiting = false;
        checkedChannels.clear();
      });

      player.addEventListener(Player.OFFLINE, () => {
        const channel = player.getChannel().toLowerCase();
        reportChannelStatus(channel, false);
        loadedIsLive = false;
        watching = false;

        if (pickedChannelRef.current || waiting) {
          return;
        }

        checkedChannels.add(channel);
        tryNextChannel(player);
      });

      for (const event of [Player.PLAY, Player.PLAYING]) {
        player.addEventListener(event, () => {
          watching = true;
        });
      }

      for (const event of [Player.PAUSE, Player.ENDED]) {
        player.addEventListener(event, () => {
          watching = false;
        });
      }
    });

    const recheckTimer = window.setInterval(recheck, RECHECK_INTERVAL);

    return () => {
      disposed = true;
      window.clearInterval(recheckTimer);
      window.clearTimeout(switchTimerRef.current);
      playerRef.current = null;

      if (host) {
        host.replaceChildren();
      }
    };
  }, [elementId, reportChannelStatus, setActiveChannel]);

  const chooseChannel = (channel: string) => {
    pickedChannelRef.current = channel;
    window.clearTimeout(switchTimerRef.current);
    setActiveChannel(channel);
    playerRef.current?.setChannel(channel);
  };

  return (
    <>
      <div className="flex min-w-0 items-center justify-between gap-3 border-b-2 border-stone-600 px-3 py-2 font-mono text-[10px] font-bold uppercase tracking-wider text-stone-400">
        <span className="min-w-0 truncate">twitch.tv/{shownChannel}</span>
        <span className="flex items-center gap-2">
          <span
            className={clsx(
              "h-2 w-2 rounded-full",
              shownChannelIsLive
                ? "bg-red-500 shadow-[0_0_6px_#ef4444]"
                : "bg-stone-600",
            )}
          />
          {t(shownChannelIsLive ? "live" : "offline")}
        </span>
      </div>
      <div
        className="relative overflow-hidden bg-black"
        ref={playerShellRef}
        style={{ height: playerVisibleHeight }}
      >
        <div
          className="absolute left-0 top-0"
          id={elementId}
          style={{
            height: playerRenderHeight,
            transform: `scale(${playerScale})`,
            transformOrigin: "top left",
            width: playerRenderWidth,
          }}
        />
      </div>
      {channels.length > 1 ? (
        <div className="flex flex-wrap items-center gap-2 border-t-2 border-stone-600 bg-[#191a17] px-3 py-2">
          <span className="mr-1 font-mono text-[10px] font-bold uppercase tracking-wider text-stone-500">
            {t("landing.casters")}
          </span>
          {channels.map((channel) => (
            <button
              key={channel}
              className={`border px-2 py-1 font-mono text-[10px] font-bold uppercase tracking-wider transition ${
                shownChannel === channel
                  ? "border-[#e4ad37] text-[#e4ad37]"
                  : "border-stone-700 text-stone-400 hover:border-stone-500"
              }`}
              onClick={() => chooseChannel(channel)}
              type="button"
            >
              {channel}
            </button>
          ))}
        </div>
      ) : null}
    </>
  );
}
