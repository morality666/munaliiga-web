# Munaliiga website

## Local setup

```sh
npm install
npm run dev
```

## Site configuration

The committed production configuration lives in `.env.production`. Vite loads
it automatically for production builds, including the GitHub Pages build.
Local development uses the fallback values from `src/config.ts`; create an
uncommitted `.env.local` only when you need local overrides.

| Variable | Purpose |
| --- | --- |
| `VITE_DISCORD_URL` | Discord invite used across the landing page and sidebar |
| `VITE_YOUTUBE_URL` | Community YouTube channel |
| `VITE_SEASON_NUMBER` | Season shown beside the language controls |
| `VITE_SIGNUPS_OPEN` | Optional `true`/`false` override for registration status |
| `VITE_SIGNUP_OPENS_AT` | ISO date and time for automatic opening when no override is set |
| `VITE_SIGNUP_URL` | Registration form |
| `VITE_TWITCH_CHANNELS` | Comma-separated caster channels; `morality666` is always checked first |

The application reads these values through `src/config.ts`. All `VITE_`
variables are bundled into the public site, so they must never contain secrets.

## Markdown notes

Main navigation notes live in:

- `notes/en/`
- `notes/fi/`

Community content is grouped into three folders:

- `notes/<language>/community/articles/`
- `notes/<language>/community/guides/`
- `notes/<language>/community/other/`

Each category’s `index.md` is its landing page and contribution guide. Other Markdown files in that folder automatically become children of the category. The first heading is used as the navigation title and the optional frontmatter `order` value controls its position.
