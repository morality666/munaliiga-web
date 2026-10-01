import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react";

type StreamStatusContextValue = {
  /** The channel in the homepage player, or null until the player has picked one. */
  activeChannel: string | null;
  featuredChannel: string | null;
  isLive: boolean;
  liveChannels: string[];
  reportChannelStatus: (channel: string, isLive: boolean) => void;
  setActiveChannel: (channel: string) => void;
};

const StreamStatusContext = createContext<StreamStatusContextValue | null>(null);

export function StreamStatusProvider({ children }: { children: ReactNode }) {
  const [channelStatus, setChannelStatus] = useState<Record<string, boolean>>(
    {},
  );
  const [activeChannel, setActiveChannel] = useState<string | null>(null);

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

  // The player's channel leads, so the top bar names the stream being shown.
  const liveChannels = useMemo(() => {
    const live = Object.keys(channelStatus).filter(
      (channel) => channelStatus[channel],
    );

    return activeChannel && live.includes(activeChannel)
      ? [activeChannel, ...live.filter((channel) => channel !== activeChannel)]
      : live;
  }, [activeChannel, channelStatus]);

  const value = useMemo(
    () => ({
      activeChannel,
      featuredChannel: liveChannels[0] ?? null,
      isLive: liveChannels.length > 0,
      liveChannels,
      reportChannelStatus,
      setActiveChannel,
    }),
    [activeChannel, liveChannels, reportChannelStatus],
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
