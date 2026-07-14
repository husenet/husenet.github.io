# husenet.github.io

My site. It's an interactive terminal, so `help` and poke around.

Plain HTML/CSS/JS. No framework, no build step. Amber CRT theme with
scanlines, a custom block cursor, command history (Up/Down) and Tab
completion.

Live: https://husenet.github.io

## Commands

`ls` `posts` `cat <name>` `open <name>` `github` `medium` `whoami` `banner` `clear` `help`

(plus a couple you'll have to find)

Deep links: `/#posts` lists the write-ups, `/#some-name` opens a project
or post directly. Handy for linking from elsewhere.

## Layout

```
index.html        markup + the terminal shell
assets/style.css  amber CRT theme, scanlines, cursor
assets/main.js    the command interpreter
```

## Deploy

Push to `main`. GitHub Pages serves it from the repo root.
