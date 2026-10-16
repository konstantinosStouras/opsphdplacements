# Social previews, favicon and site metadata

Implemented 16 October 2026. Canonical share URL: https://www.stouras.com/opsphdplacements/.

## What is published

- Static Open Graph metadata in `index.html`: title, description, canonical URL, site name, locale, image URL, dimensions, content type and alternative text. Crawlers do not need JavaScript or the research datasets to read it.
- A matching `summary_large_image` Twitter/X card, without an invented social handle or application ID.
- `assets/social-preview-v1.png`: 1200 × 630 pixels, approximately 54 KB. It uses the website's cream, green and serif identity and deliberately excludes changing research counts or completion claims.
- Existing SVG favicon plus ICO and 32/48-pixel PNG fallbacks; a 180-pixel Apple touch icon; 192/512-pixel icons referenced by `site.webmanifest`.
- Page description, author, theme colour, canonical link and WebSite structured data. The manifest uses browser display mode; it does not claim offline support or introduce a service worker.

Open Graph fields follow the [Open Graph protocol](https://ogp.me/). The image meets [LinkedIn's published website-sharing dimensions and size limits](https://www.linkedin.com/help/linkedin/answer/a521928/making-your-website-shareable-on-linkedin). The small public PNG is intended for social networks and messaging previews; each service controls whether and how it displays or crops a preview.

## Update and verify

1. Edit the static metadata in `index.html`. Keep canonical and social URLs absolute HTTPS URLs under the project path. Do not point project icons at the account site's root favicon.
2. To regenerate typographic assets, run `python scripts/generate-brand-assets.py` with Pillow and Georgia or DejaVu Serif installed. The script renders text and simple shapes; font files are not distributed. Georgia was used for the committed assets. Assets are committed, so deployment does not require Pillow or these fonts.
3. When the preview artwork changes, give it a new versioned filename and update the generator, Open Graph, Twitter/X and structured-data references together. Keep prior images available for existing cached references. Never insert live counts into the artwork unless maintaining their accuracy is intentional.
4. Run `npm run check`, `node scripts/build.mjs` and `node scripts/check-sharing.mjs _site`. Inspect the image visually for legibility and clipping.
5. After deployment, request the public page and image without authentication, including with a social crawler user agent. Verify the raw HTML contains the metadata, the image returns HTTP 200 and its content type is an image. Check icon/manifest paths too.
6. Distinguish technical validation from actual in-app preview tests. No messages or social posts should be sent for testing without user authorization. A service may cache older previews; use its inspection/refresh tools where available. The site cannot force an already-sent message to refresh or guarantee a particular crop.

`scripts/check-sharing.mjs` runs with the normal validation and checks the source or built directory. It guards against missing deployment assets, wrong dimensions, inconsistent image URLs and accidentally omitted static tags.

Update this guide and relevant README/workflow entries when assets, metadata or publishing rules change. The research ledger and counts do not change for a metadata-only release.
