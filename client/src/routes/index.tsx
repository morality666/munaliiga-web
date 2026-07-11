import { createFileRoute, Link } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { signupsAreLive, siteConfig } from "../config.ts";
import { STREAMERS } from "../streaming/streamers.ts";
import { TwitchStream } from "../streaming/TwitchStream.tsx";

export const Route = createFileRoute("/")({
  component: MainView,
});

const TWITCH_CHANNEL =
  STREAMERS.find((streamer) => streamer.isMainCaster)?.channel ??
  "morality666";

// eslint-disable-next-line react-refresh/only-export-components
function MainView() {
  const { t } = useTranslation();
  const signupLinks = [
    {
      href: siteConfig.signup.playerUrl,
      label: t("landing.playerSignUp"),
    },
    {
      href: siteConfig.signup.coachUrl,
      label: t("landing.coachSignUp"),
    },
  ].filter((link) => link.href);

  return (
    <main className="paper-field overflow-hidden bg-[#e8e0ce] text-[#1c1d19]">
      <section className="relative bg-[#191b16] text-stone-100">
        <div className="dota-lanes pointer-events-none absolute inset-0 opacity-30" />

        <div className="relative mx-auto grid max-w-7xl gap-10 px-5 pb-10 pt-12 md:px-8 lg:grid-cols-[0.82fr_1.18fr] lg:items-center lg:pb-12 lg:pt-14">
          <div className="relative z-10 max-w-lg">
            <p className="mb-5 flex items-center gap-2 text-sm font-semibold text-[#dcae47]">
              <span className="dota-mark" aria-hidden />
              {t("landing.kicker")}
            </p>

            <h1 className="max-w-md text-5xl font-black leading-[0.95] tracking-[-0.045em] text-[#f1eadc] sm:text-6xl">
              {t("landing.heroTitle")}
            </h1>

            <p className="mt-6 max-w-md text-lg leading-8 text-stone-300">
              {t("landing.heroDescription")}
            </p>

            <div className="mt-8 flex flex-wrap gap-x-8 gap-y-4 text-sm font-bold">
              {signupsAreLive ? (
                signupLinks.map((link) => (
                  <a
                    className="border-b border-[#dcae47] pb-1 text-[#f1eadc] hover:text-[#dcae47]"
                    href={link.href}
                    key={link.label}
                    rel="noreferrer"
                    target="_blank"
                  >
                    {link.label} →
                  </a>
                ))
              ) : (
                <span className="border-b border-stone-700 pb-1 text-stone-500">
                  {t("signupsSoon")}
                </span>
              )}
              <a
                className="border-b border-stone-600 pb-1 text-stone-300 hover:border-[#dcae47] hover:text-[#dcae47]"
                href={siteConfig.discordUrl}
                rel="noreferrer"
                target="_blank"
              >
                Discord →
              </a>
            </div>
          </div>

          <div className="relative mx-auto w-full max-w-124 lg:mr-1">
            <div className="landing-poster relative rotate-[1.2deg] bg-[#e4ad37] px-5 pb-6 pt-3 shadow-[12px_14px_0_#0d0e0c] sm:px-7">
              <div className="mb-1 flex items-center justify-between border-b-2 border-stone-900/40 py-2 font-mono text-[9px] font-bold uppercase tracking-[0.16em] text-stone-900/70">
                <span>Munaliiga</span>
                <span>Dota 2</span>
              </div>
              <img
                alt={t("landing.heroImageAlt")}
                className="mx-auto w-full mix-blend-multiply"
                src="/logo.png"
              />
            </div>
            <span className="poster-tape poster-tape-left" aria-hidden />
            <span className="poster-tape poster-tape-right" aria-hidden />
          </div>
        </div>

      </section>

      <section className="px-5 py-14 md:px-8 md:py-20">
        <div className="mx-auto grid max-w-6xl gap-12 lg:grid-cols-[1.1fr_0.9fr]">
          <article className="max-w-2xl">
            <p className="font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-stone-500">
              {t("landing.aboutKicker")}
            </p>
            <h2 className="mt-3 text-3xl font-black tracking-[-0.035em] sm:text-4xl">
              {t("landing.aboutTitle")}
            </h2>
            <p className="mt-5 text-lg leading-8 text-stone-700">
              {t("landing.aboutBody")}
            </p>
            <div className="mt-6 flex flex-wrap gap-5 text-sm font-bold">
              <Link
                className="border-b border-stone-500 pb-1 hover:border-stone-950"
                params={{ slug: "about" }}
                to="/$slug"
              >
                {t("landing.aboutLink")} →
              </Link>
              <Link
                className="border-b border-stone-500 pb-1 hover:border-stone-950"
                params={{ slug: "hall-of-fame" }}
                to="/$slug"
              >
                {t("landing.previousSeasonsLink")} →
              </Link>
            </div>
          </article>

          <aside className="community-note relative self-start border border-stone-900/30 bg-[#d5c7a6] px-6 py-6 shadow-[5px_6px_0_rgba(28,29,25,0.18)] lg:mt-8 lg:rotate-1">
            <p className="font-mono text-[10px] font-bold uppercase tracking-[0.18em] text-stone-600">
              {t("landing.joinKicker")}
            </p>
            <h2 className="mt-3 text-2xl font-black">
              {t("landing.joinTitle")}
            </h2>
            <p className="mt-3 leading-7 text-stone-700">
              {t("landing.joinBody")}
            </p>
            <div className="mt-5 flex flex-wrap gap-5 text-sm font-bold">
              {signupsAreLive ? (
                signupLinks.map((link) => (
                  <a
                    className="border-b border-stone-700 pb-0.5"
                    href={link.href}
                    key={link.label}
                    rel="noreferrer"
                    target="_blank"
                  >
                    {link.label} →
                  </a>
                ))
              ) : (
                <span className="border-b border-stone-500 pb-0.5 text-stone-500">
                  {t("signupsSoon")}
                </span>
              )}
              <a
                className="border-b border-stone-700 pb-0.5"
                href={siteConfig.discordUrl}
                rel="noreferrer"
                target="_blank"
              >
                Discord →
              </a>
            </div>
            <span
              aria-hidden
              className="note-tape absolute -top-4 left-1/2 h-8 w-24 -translate-x-1/2 -rotate-2"
            />
          </aside>
        </div>
      </section>

      <section className="border-y border-stone-900/25 bg-[#dcd3c0] px-5 py-14 md:px-8 md:py-16">
        <div className="mx-auto grid max-w-6xl gap-9 lg:grid-cols-[0.48fr_1fr] lg:items-center">
          <div>
            <p className="font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-stone-500">
              {t("landing.liveKicker")}
            </p>
            <h2 className="mt-3 text-3xl font-black tracking-[-0.035em]">
              {t("landing.liveTitle")}
            </h2>
            <p className="mt-4 max-w-sm leading-7 text-stone-700">
              {t("landing.liveBody", { channel: TWITCH_CHANNEL })}
            </p>
            <a
              className="mt-5 inline-block border-b border-stone-500 pb-1 text-sm font-bold hover:border-stone-950"
              href={`https://www.twitch.tv/${TWITCH_CHANNEL}`}
              rel="noreferrer"
              target="_blank"
            >
              Twitch →
            </a>
          </div>

          <div className="border-2 border-stone-700 bg-black shadow-[7px_8px_0_#a95747]">
            <TwitchStream />
          </div>
        </div>
      </section>

      <footer className="px-5 py-7 md:px-8">
        <div className="mx-auto flex max-w-6xl flex-col gap-3 font-mono text-[10px] font-bold uppercase tracking-wider text-stone-600 sm:flex-row sm:items-center sm:justify-between">
          <span>Munaliiga / Dota 2</span>
          <nav className="flex gap-5">
            <Link
              params={{ slug: "about" }}
              to="/$slug"
            >
              {t("landing.aboutLink")}
            </Link>
            <Link
              params={{ slug: "rules" }}
              to="/$slug"
            >
              {t("landing.rulesLink")}
            </Link>
          </nav>
        </div>
      </footer>
    </main>
  );
}
