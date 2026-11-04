# REPLIKA AI — iPhone beta

An iPhone-first installable web app prototype for collecting two photo references and natural-language editing instructions.

## Current beta features
- Two local image previews (identity reference and target photo).
- Additional reference attachments.
- Voice dictation through Safari Web Speech where supported, with iOS keyboard dictation as fallback.
- Conversational instruction history.
- Copyable editing brief.
- Local session text saved in browser storage.
- PWA installable from Safari and offline app shell.

## Important limitation
This first beta does **not** generate or edit images yet. It does not upload photos to a server. The image-generation engine is not integrated because a truly unlimited, free cloud image API does not exist, and iOS Safari cannot host a full diffusion model with the same capabilities as a native on-device app. The next engineering step is to validate a local iOS image engine (for example Draw Things) and determine whether a supported local bridge/API can be used. Do not present the copy-brief action as image generation.

## Install
Host this directory over HTTPS, open it in Safari on iPhone, tap Share → Add to Home Screen.

## Privacy
Image files are only previewed in memory in the current page. The text session is saved locally in localStorage when the user chooses Save. No photo upload or remote analytics is implemented.
