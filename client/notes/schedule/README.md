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
| `ends` | yes | Last day of the week. Once it has passed, the week moves to the played section. |
| `bye` | no | File name of the team sitting the week out. Several are separated by a semicolon. |

## Adding a match

Add a row to `season-3.csv`:

```
week,home,away,date,time,bestOf,casters,status,matchIds,note
1,where-halo-lobby,perhanan-perunat,,,,morality666,,,
1,march-of-the-munas,muffalonit,2026-10-02,19:00,3,morality666,,,
```

| Column | Required | Meaning |
| --- | --- | --- |
| `week` | yes | Week number from `weeks.csv`. |
| `home` | yes | The team's **file name** in `notes/teams/`, without `.md`. |
| `away` | yes | The same for the other team. |
| `date` | no | `2026-10-02`. While empty, the calendar says "Time TBA" and the homepage shows the week's dates. |
| `time` | no | Finnish local time, `19:00`. Daylight saving is handled for you. |
| `bestOf` | no | `1`, `3` or `5`. |
| `casters` | no | Casters' Twitch names, several separated by a semicolon: `morality666;niumi`. |
| `status` | no | Empty means upcoming. Otherwise `live`, `postponed` or `cancelled`. |
| `matchIds` | no | Dota match ids once played, several separated by a semicolon. These pull in the result. |
| `note` | no | Free text. Put the field in quotes if it contains a comma. |

## When the time is agreed

Fill in `date` and `time` on that row. Nothing else changes.

## When the match has been played

Paste the Dota match ids into `matchIds`. The series score is worked out for
you from which team won each game, matched through the `aliases` in
`notes/teams/`.

## Checklist

- **Check the `/schedule` page after an edit.** A row that cannot be read is
  left out without any warning.
- Teams are written as file names, not display names: `hells-kitchen`, not
  `Hell's Kitchen`.
- Do not delete the header row, and keep the same number of commas per row.
- An empty field is fine — just leave nothing between the commas.
