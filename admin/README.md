# Private research administration — work in progress, 29 October 2026

The owner requested private verification links across People, Organisations and Graduates. All individual links belong in the admin Verification column, including recorded LinkedIn and Google Scholar profiles. Brief OM List and Operations Academia attribution remains public.

Firebase project `operations-phd-placements` is created under the owner's `kstouras@gmail.com` account on Spark ($0/month). The Research administration web app is registered, Google sign-in enabled, and `www.stouras.com` authorised. Optional Gemini and Google Analytics were disabled at creation. No billing account, storage bucket or service-account key was created.

The default Firestore database now exists in `eur3` (European multi-region), as found on resuming the owner's completed console setup. The owner approved EU storage. Owner-only rules are published; the Rules Playground allows the verified owner and rejects anonymous/other-email requests. A live unauthenticated REST read returns 403. A fresh admin login/import still needs verification after an initial signed-in request was denied; no private catalog upload or website deployment is confirmed.

`firebase-client.js` uses Google sign-in with in-memory session/data storage. `firestore.rules` allows only the verified `kstouras@gmail.com` Google identity to read/write the admin collections. Publish and test these rules before uploading data. The client email check is not the security boundary. The public build includes only the admin interface code, not its source catalog.

`catalog.mjs` indexes existing committed-format datasets by stable IDs. It collects source URLs with their observation paths and original source dates. A recorded URL is not new verification, a complete profile read, or support for every fact on that row. Unrecorded LinkedIn/Scholar profiles remain missing. No name-based cross-person join, guessed profile, or unmerged research proposal is included. The Organisations view joins reviewed university overlays by existing entity links; it does not perform a fresh identity reconciliation.

Run `node scripts/build-admin-data.mjs` to prepare `research/admin/catalog.json` locally. That directory is ignored. Do not commit or deploy this generated file to GitHub Pages. Run `node --test admin/catalog.test.mjs` for the source extraction and identity-join checks.

Before implementation is complete:

- Approve the database region, create Firestore in production mode, and publish/test the owner-only rules.
- Finish the owner login, import the private catalog and verify it. Imports activate a hash-checked manifest only after every bounded Firestore chunk saves; previous snapshots remain available.
- Validate the source-free public projection in `scripts/public-data.mjs` and inspect expanded tables on desktop/mobile. All 70 tests and existing data/stamp validators passed locally. Expanded People, Organisation and Graduate previews contain no external source links. Mobile sizing remains unverified because the browser did not apply the requested viewport.
- Decide how to preserve future private provenance separately from the public repository. Previously published Git history cannot be made secret by changing the current page.
- Connect the UI to authenticated storage, validate unauthenticated and wrong-account denial, and inspect desktop/mobile tables.
- Publish the `#people` navigation change separately or with the completed privacy work; retain old `#explorer` and `#explorer.` links as redirects.

Authoritative research data and record stamps have not changed. The public build now projects source-free datasets; this does not remove already public Git history. No new person research has started. Preserve unrelated concurrent filter-count edits in the shared checkout. Current private catalog: 3,215 people, 1,028 underlying organisation entities and 14,600 graduate records; entity count differs from the grouped public organisation view.


## Confirmed Firebase checkpoint

The owner signed in and imported the private catalog successfully. The database is in eur3 (European multi-region). The published rules allow only the verified owner Google account; anonymous and other-email simulations were denied, and a live unauthenticated REST request returned 403. Admin table checks confirmed 3,215 people, 1,028 underlying organisation entities and 14,600 graduates, including LinkedIn links inside the Verification column. Website publication remains a separate step; record its final receipt here.
