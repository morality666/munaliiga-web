# Teams

One file per team. The file name becomes the team's web address, so
`muffalonit.md` is published at `/teams/muffalonit`. Use lower-case letters,
numbers and hyphens only — no spaces, no Scandinavian letters.

## Adding a team

1. In this folder choose **Add file → Create new file**.
2. Name it after the team, for example `muffalonit.md`.
3. Paste the template below and fill it in.
4. Choose **Commit changes**. The site rebuilds in about two minutes.

**Check the `/teams` page after every edit.** A bad file will not take the site
down, but it will not announce itself either: if the formatting is broken (wrong
indentation, a missing `---`) the whole team drops off the list, and if a field
or role name is misspelled that part is left blank. Neither stops the deploy or
sends you an email — looking at the page is the only way to notice.

## Template

```
---
name: Muffalonit
tag: MUF
color: "#8a5c4a"
season: 3
coach:
captain:
aliases:
  - Muffalonit
players:
  - name: Player One
    role: carry
  - name: Player Two
---
```

## Fields

| Field | Required | Meaning |
| --- | --- | --- |
| `name` | yes | Display name. |
| `tag` | yes | 2–4 character abbreviation shown on the dark tile in match lists. |
| `color` | yes | Team colour as hex, **in quotes**: `"#a95747"`. |
| `season` | yes | Season number, e.g. `3`. |
| `coach` | no | Coach's name. Shown under the team name. |
| `captain` | no | Captain's name. Must match a player's `name` exactly to get the captain badge. |
| `logo` | no | Image file name in `notes/attachments/`. Without a logo the `tag` tile is shown — that is the normal look, not a fallback. |
| `aliases` | no | Names this team appears under in Valve's match data, so played matches can be linked back to it. |
| `players` | no | Each with a `name`, and a `role` if you want one. |

## Roles

A role is **optional information**, not a commitment: positions are not locked,
so it can be left out entirely. Players are shown in the order you write them.

If you do give a role, write it **exactly** like this, in lower case:

`carry` · `mid` · `offlane` · `soft-support` · `hard-support`

An unrecognised role is simply not shown.

## Checklist

- Quote the colour: `color: "#a95747"`, not `color: #a95747`.
- Put a name in quotes if it contains an apostrophe or a colon:
  `name: "Hell's Kitchen"`.
- Indent player lines with two spaces as in the template. Do not use tabs.
- Do not write anything after the closing `---`. Team pages have no description
  text.
