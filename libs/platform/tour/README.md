# platform-tour (`@ah/platform/tour`)

Guided tours for any app in the platform (ADR-0030): a ring round part of the page, the rest dimmed, and a step card (`<ah-coachmark>` from `@ah/ui`) next to it. It's non-modal, works in five languages, mirrors right to left, and fits phones, tablets and desktops.

## Add a tour to an app

1. **Mark the targets.** Add `data-tour="<id>"` to each element a step points at. One element may carry several ids, separated by spaces. Ids are slugs: `a-z`, digits and `-`.
2. **Define the tour.** A definition holds no words.

   ```ts
   export const MY_TOUR: TourDefinition = {
     app: 'myapp', // part of where progress is kept
     id: 'main',
     version: 1, // bump when the steps change for good
     steps: [
       { id: 'welcome', targets: [], route: { path: 'home' } }, // centred
       { id: 'navigation', targets: ['nav-rail', 'nav-tabs', 'nav-bottom'] },
       {
         id: 'chart',
         targets: ['chart'],
         route: { path: 'stats', query: { tab: 'year' } },
       },
     ],
   };
   ```

   The first target with a visible box at the current width wins. List every place a step's subject can be, for example the rail on a desktop and the bottom bar on a phone. A step whose targets aren't on screen shows its card in the middle. `checkTour(definition)` lists problems; call it in a spec.

3. **Write the words** in the app's copy files, one `{ title, body }` per step id. The card's own buttons ("Next", "Step 3 of 8"…) come from this library in all five languages.
4. **Place the host once**, in the app's shell:

   ```html
   <ah-tour-host
     [text]="tourText()"
     [lang]="lang()"
     [dir]="rtl() ? 'rtl' : 'ltr'"
     [root]="appRoot"
     [insets]="insets"
     [navigate]="navigate"
   />
   ```

   - `text`: `(stepId) => { title, body }`.
   - `root`: the element the targets live in. Inside the portfolio, the site has its own page around the app.
   - `insets`: `() => ({ top, bottom })`, the bands to keep the card out of, such as a floating header or a phone's bottom bar.
   - `navigate`: `(route) => Promise`. Open the screen relative to the app's root route.

5. **Start it** from anywhere with `inject(TourService).start(MY_TOUR, openerButton)`. Focus returns to `openerButton` at the end.
   - **First visit:** `isNew(def)` is true until the tour is finished, skipped or declined. Use it to show an invitation in the page; `dismiss(def)` is "Not now".
   - **Never start it on load:** an overlay nobody asked for gets in the way, and of tests too.

## How it behaves

- **The layer:** one `popover="manual"` element in the top layer holds the ring, the dimming and the card. Clicks pass through to the page; only the card takes them.
- **Each step:**
  1. Opens its screen.
  2. Waits up to 1.5 s for a target.
  3. Scrolls the target to the middle of the window. Smooth scrolling is off under reduced motion.
  4. Places the card with `placeCard()`:
     - it takes the side with room, the step's `placement` first;
     - it mirrors right to left;
     - below 768 px it becomes a sheet docked at the bottom, above `insets.bottom`.
  5. Focuses the card.
- **The card:**
  - It is a dialog with `aria-modal="false"`, named by its title and progress and described by its body.
  - Escape skips the tour.
  - Focus goes back to the opener at the end. If the opener is gone, it goes to the last step's target, when that can take focus.
- **Progress:** stored in localStorage under `ah.tour.<app>.<id>`, with an `ah-demo.` prefix in the portfolio's demo mode. Storage that throws falls back to memory.

## Checks

```bash
pnpm nx run-many -t lint test -p platform-tour
```
