import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react";
import { STREAMERS, STREAMER_CHECK_ORDER } from "./streamers.ts";

type StreamStatusContextValue = {
  featuredChannel: string | null;
  isLive: boolean;
  liveChannels: string[];
  reportChannelStatus: (channel: string, isLive: boolean) => void;
};

const StreamStatusContext = createContext<StreamStatusContextValue | null>(null);

export function StreamStatusProvider({ children }: { children: ReactNode }) {
  const [channelStatus, setChannelStatus] = useState<Record<string, boolean>>(
    {},
  );

  const reportChannelStatus = useCallback(
    (channel: string, isLive: boolean) => {
      setChannelStatus((current) => {
        if (current[channel] === isLive) {
          return current;
        }

        return { ...current, [channel]: isLive };
      });
    },
    [],
  );

  const liveChannels = useMemo(
    () =>
      STREAMERS.filter((streamer) => channelStatus[streamer.channel]).map(
        (streamer) => streamer.channel,
      ),
    [channelStatus],
  );

  const featuredChannel =
    STREAMER_CHECK_ORDER.find((streamer) =>
      liveChannels.includes(streamer.channel),
    )?.channel ?? null;

  const value = useMemo(
    () => ({
      featuredChannel,
      isLive: liveChannels.length > 0,
      liveChannels,
      reportChannelStatus,
    }),
    [featuredChannel, liveChannels, reportChannelStatus],
  );

  return (
    <StreamStatusContext.Provider value={value}>
      {children}
    </StreamStatusContext.Provider>
  );
}

export function useStreamStatus() {
  const context = useContext(StreamStatusContext);

  if (!context) {
    throw new Error("useStreamStatus must be used inside StreamStatusProvider");
  }

  return context;
}
