# Brand packs

A brand pack dresses the Greenhouse apps in one farm's name, logo and colours, for a private demo or a farm's own deployment. The public repo and the portfolio stay neutral: **only `example/` is committed**. Every other folder here is git-ignored (`.gitignore`), because a company's logo has no place in a public repo without its consent.

## What a pack holds

| File                    | What it does                                                                                           |
| ----------------------- | ------------------------------------------------------------------------------------------------------ |
| `brand.ts`              | Replaces each app's `src/brand/brand.ts`: the `id`, the organisation's name, the logo and its alt text |
| `brand.css`             | Overrides the greenhouse look's accent colours under `[data-brand='<id>']`, light and dark             |
| `public/brand/logo.svg` | The logo, served at `brand/logo.svg`. It sits on the accent-coloured app bar, so a white logo reads    |

The CSS must keep the look's contrast (WCAG AA): text on the accent and the accent as text, at 4.5:1 on every surface, in both themes. `example/brand.css` shows the selectors.

## Build a branded demo

The branded builds read the pack in `active/`:

```bash
cp -r apps/products/greenhouse/brands/example apps/products/greenhouse/brands/active   # then edit it
pnpm nx run product-greenhouse-field:build:brand-demo        # sample farm, pretend server: a pitch demo
pnpm nx run product-greenhouse-field:build:brand-local       # against the local Supabase
pnpm nx run product-greenhouse-field:build:brand-production  # against the hosted project
pnpm nx run product-greenhouse:build:brand                   # the manager's dashboard
```

Serve a build with `node tools/scripts/serve-static.mjs dist/apps/products/greenhouse/field/browser 4314`. A branded build is for showing privately (on a laptop, an unlisted link, an Android build); never deploy it to the public portfolio.
