# NutriControl — Bolt handoff

## Base
This repository contains the NutriControl React/Vite source currently used as the working base.

## Latest AppDeploy version checked
The latest AppDeploy version is **v27** (snapshot 1789873752228, 2026-09-20T03:09:12Z).

## Changes mirrored into this repo for the Bolt handoff
- Anime theme banner system added to profile theme cards.
- Dragon Ball banner added.
- Dandadan remains removed from the theme list.
- Top hero uses the selected theme banner instead of only the character image.
- Character images use character-specific sources.
- Toji Fushiguro uses a direct PNG source and has fallback handling.
- Image loading has proxy/direct/fallback stages so a failed remote image does not leave the character area blank.

## Important
Do **not** redeploy to AppDeploy while the daily credit block is active.

## First Bolt task
Import this GitHub repository and preserve the existing React/Vite structure. Do not rebuild NutriControl from scratch. First verify the existing UI, then continue with the remaining anime theme/image polish.
