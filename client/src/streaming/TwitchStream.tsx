import clsx from "clsx";
import { useEffect, useId, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { siteConfig } from "../config.ts";
import { useStreamStatus } from "./StreamStatus.tsx";
import { STREAMERS, STREAMER_CHECK_ORDER } from "./streamers.ts";

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
  OFFLINE: string;
  ONLINE: string;
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
  const { liveChannels, reportChannelStatus } = useStreamStatus();
  const elementId = `twitch-player-${useId().replace(/:/g, "")}`;
  const playerShellRef = useRef<HTMLDivElement | null>(null);
  const playerRef = useRef<TwitchPlayerInstance | null>(null);
  const checkedChannelsRef = useRef(new Set<string>());
  const ignoreOfflineRef = useRef(false);
  const retryTimerRef = useRef<number | undefined>(undefined);
  const [playerViewportWidth, setPlayerViewportWidth] = useState(0);
  const [activeChannel, setActiveChannel] = useState(
    STREAMERS[0]?.channel ?? "morality666",
  );
  const activeChannelIsLive = liveChannels.includes(activeChannel);
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

    const selectChannel = (channel: string) => {
      setActiveChannel(channel);
      playerRef.current?.setChannel(channel);
    };

    const checkAgainLater = () => {
      window.clearTimeout(retryTimerRef.current);
      retryTimerRef.current = window.setTimeout(() => {
        checkedChannelsRef.current.clear();
        const mainChannel = STREAMER_CHECK_ORDER[0]?.channel;

        if (mainChannel) {
          selectChannel(mainChannel);
        }
      }, 60_000);
    };

    void loadTwitchPlayer().then(() => {
      if (disposed || !host || !window.Twitch?.Player) {
        return;
      }

      const Player = window.Twitch.Player;
      const player = new Player(elementId, {
        autoplay: false,
        channel: STREAMER_CHECK_ORDER[0]?.channel ?? "morality666",
        height: "100%",
        muted: false,
        parent: getTwitchParentDomains(),
        width: "100%",
      });
      playerRef.current = player;

      player.addEventListener(Player.ONLINE, () => {
        const channel = player.getChannel().toLowerCase();
        reportChannelStatus(channel, true);
        checkedChannelsRef.current.clear();

        if (channel === STREAMER_CHECK_ORDER[0]?.channel) {
          window.clearTimeout(retryTimerRef.current);
        } else {
          checkAgainLater();
        }
      });

      player.addEventListener(Player.OFFLINE, () => {
        const channel = player.getChannel().toLowerCase();
        reportChannelStatus(channel, false);

        if (ignoreOfflineRef.current) {
          ignoreOfflineRef.current = false;
          return;
        }

        checkedChannelsRef.current.add(channel);
        const nextStreamer = STREAMER_CHECK_ORDER.find(
          (streamer) => !checkedChannelsRef.current.has(streamer.channel),
        );

        if (nextStreamer) {
          window.setTimeout(() => selectChannel(nextStreamer.channel), 1_200);
          return;
        }

        const mainChannel = STREAMER_CHECK_ORDER[0]?.channel;
        checkedChannelsRef.current.clear();

        if (mainChannel && channel !== mainChannel) {
          ignoreOfflineRef.current = true;
          selectChannel(mainChannel);
        }
        checkAgainLater();
      });
    });

    return () => {
      disposed = true;
      window.clearTimeout(retryTimerRef.current);
      playerRef.current = null;

      if (host) {
        host.replaceChildren();
      }
    };
  }, [elementId, reportChannelStatus]);

  const chooseChannel = (channel: string) => {
    checkedChannelsRef.current.clear();
    window.clearTimeout(retryTimerRef.current);
    setActiveChannel(channel);
    playerRef.current?.setChannel(channel);
  };

  return (
    <>
      <div className="flex min-w-0 items-center justify-between gap-3 border-b-2 border-stone-600 px-3 py-2 font-mono text-[10px] font-bold uppercase tracking-wider text-stone-400">
        <span className="min-w-0 truncate">twitch.tv/{activeChannel}</span>
        <span className="flex items-center gap-2">
          <span
            className={clsx(
              "h-2 w-2 rounded-full",
              activeChannelIsLive
                ? "bg-red-500 shadow-[0_0_6px_#ef4444]"
                : "bg-stone-600",
            )}
          />
          {t(activeChannelIsLive ? "live" : "offline")}
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
      {STREAMERS.length > 1 ? (
        <div className="flex flex-wrap items-center gap-2 border-t-2 border-stone-600 bg-[#191a17] px-3 py-2">
          <span className="mr-1 font-mono text-[10px] font-bold uppercase tracking-wider text-stone-500">
            {t("landing.casters")}
          </span>
          {STREAMERS.map((streamer) => (
            <button
              key={streamer.channel}
              className={`border px-2 py-1 font-mono text-[10px] font-bold uppercase tracking-wider transition ${
                activeChannel === streamer.channel
                  ? "border-[#e4ad37] text-[#e4ad37]"
                  : "border-stone-700 text-stone-400 hover:border-stone-500"
              }`}
              onClick={() => chooseChannel(streamer.channel)}
              type="button"
            >
              {streamer.channel}
            </button>
          ))}
        </div>
      ) : null}
    </>
  );
}
