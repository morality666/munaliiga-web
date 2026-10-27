# Schedule

Two files:

- **`weeks.csv`** — one row per match week: when it runs and who has a bye.
  Set up once at the start of the season.
- **`season-3.csv`** — one row per match. Who plays whom, and in which week.
  The exact day and time are **optional**: fill them in when the teams agree,
  even on the day itself.

GitHub shows both as sortable tables when you open them, and lets you edit them
as text with the pencil icon.

## Adding a week

Add a row to `weeks.csv`:

```
week,starts,ends,bye
1,2026-09-28,2026-10-04,red-mango-devils
2,2026-10-05,2026-10-11,muffalonit
```

| Column | Required | Meaning |
| --- | --- | --- |
| `week` | yes | Week number. Matches refer to it. |
| `starts` | yes | First day of the week, `2026-09-28`. |
| `ends` | yes | Last day of the week. |
| `bye` | no | File name of the team sitting the week out. Several are separated by a semicolon. |

## Adding a match

Add a row to `season-3.csv`:

```
week,home,away,date,time,bestOf,casters,status,matchIds,note
1,where-halo-lobby,perhanan-perunat,,,2,morality666,,,
1,march-of-the-munas,muffalonit,2026-10-02,19:00,2,morality666,,,
```

| Column | Required | Meaning |
| --- | --- | --- |
| `week` | yes | Week number from `weeks.csv`. |
| `home` | yes | The team's **file name** in `notes/teams/`, without `.md`. |
| `away` | yes | The same for the other team. |
| `date` | no | `2026-10-02`. While empty, the calendar says "Time TBA" and the homepage shows the week's dates. |
| `time` | no | Finnish local time, `19:00`. Daylight saving is handled for you. |
| `bestOf` | no | `2` — league matches are best of two. Another number, such as `3`, only for a match played differently. |
| `casters` | no | Casters' Twitch names, several separated by a semicolon: `morality666;niumi`. |
| `status` | no | Empty means upcoming. Otherwise `live`, `postponed` or `cancelled`. |
| `matchIds` | no | Dota match ids once played, several separated by a semicolon. These pull in the result. |
| `note` | no | Free text. Put the field in quotes if it contains a comma. |

## When the time is agreed

Fill in `date` and `time` on that row. Nothing else changes.

## Casters and the homepage stream

The homepage stream follows the `casters` column. While a match is on, its
casters are tried first, in the order written, and they get their own buttons
under the stream. A match counts as on from 30 minutes before `time` until
an hour per game plus one more after it — three hours for a best of two — and
for as long as `status` is `live`.

So a match needs `date`, `time` and `casters` for the stream to switch by
itself. If the time is not filled in, or the match runs late, set `status` to
`live` while it is played and empty it afterwards.

When no match is on, the stream shows `morality666`, then the channels listed
in `VITE_TWITCH_CHANNELS` in `client/.env.production`.

## When a match is postponed

Set `status` to `postponed`, even if the new time is not known yet. The
calendar marks the match as postponed, and the homepage leaves it out.

When the new time is agreed, fill in `date` and `time` and empty `status`.
The match then shows on the homepage again. Leave `week` as it is, even if
the new date falls in a later week.

## When the match has been played

Games played on the league ticket fill in `matchIds` by themselves at
midnight, Finnish time. A game still running then is picked up the next night.
The series score is worked out for you from
which team won each game, matched through the `aliases` in `notes/teams/`.

Fill `matchIds` in by hand only when a game is missing after that:

- **A team name the site does not know.** Add the name the game shows to that
  team's `aliases`, then paste the match id into `matchIds`. The workflow's run
  page in the Actions tab names the game.
- **A game played without the league ticket.** It cannot be fetched at all,
  so it also needs its result added to `client/src/matches/matches.json`.

An id you remove from `matchIds` is not added back.

## Standings

The `/standings` page is worked out from the same games, so there is nothing
to fill in for it. The played column counts matches, which is how many
opponents a team has faced. Everything else counts games: every game a team
wins is a point, so a 2–0 gives the winner 2 points and a 1–1 gives both teams 1.

Teams level on points are ordered by games won minus games lost, then by the
games they won against each other. Teams still level share the place.

A game counts once its id is in `matchIds` and its winner is recognised
through the `aliases`. Every team with a match in the season file is listed,
even before its first game.

## Checklist

- **Check the `/schedule` page after an edit.** A row that cannot be read is
  left out without any warning.
- Teams are written as file names, not display names: `hells-kitchen`, not
  `Hell's Kitchen`.
- Do not delete the header row, and keep the same number of commas per row.
- An empty field is fine — just leave nothing between the commas.
