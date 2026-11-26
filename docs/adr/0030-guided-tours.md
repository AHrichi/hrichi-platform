# ADR-0030: Guided tours, one engine for every app

- **Status:** Accepted
- **Date:** 2026-11-26
- **Milestone:** M2

## Context

The owner asked for a "wizard 🪄" that teaches new users an app, starting with SerraCalc, built so other apps can use it. The repo had no tour, coachmark or focus-trap code. SerraCalc's layout changes with the width: a side rail on desktops, tabs on tablets, a bottom bar on phones. It runs standalone and inside the portfolio, in five languages, two of them read right to left.

## Decision

**A generic engine and a presentational card:**

- **`libs/platform/tour` (`@ah/platform/tour`)** is the engine.
  - **Data:** a `TourDefinition` per app (`app`, `id`, `version`, `steps`). A step names `data-tour` targets in order of preference and, optionally, a screen to open first. The definition holds no words: the app passes them by step id, in its own language.
  - **`TourService`:** one tour at a time. It keeps progress per device in localStorage (`ah.tour.<app>.<id>`). The portfolio's demo of an app keeps its own (`ah-demo.` prefix), as its database does.
  - **`<ah-tour-host>`:** draws the ring round the target and the card, in a `popover="manual"` layer. That puts both in the top layer, above every header, sheet and menu, where nothing closes them by accident.
- **`<ah-coachmark>` in `@ah/ui`:** the step card, with stories and Docker baselines.

**How a step shows:**

1. It opens the step's screen.
2. It waits up to 1.5 s for the target. The first target that has a box at this width wins. With none, the card shows in the middle of the dimmed screen.
3. It scrolls the target to the middle of the window, without smooth scrolling under reduced motion.
4. It places the card next to the target with `placeCard`, a pure function:
   - it takes the side with room, the step's preference first;
   - it mirrors right to left;
   - below 768 px the card docks at the bottom as a sheet, above a phone's bottom bar.
5. It moves focus to the card.

The page stays usable: the layer lets clicks through.

**The card's accessibility:**

- It is a non-modal dialog, named by its title and "Step 3 of 10" and described by its body.
- Escape skips the tour.
- Back and Next work as expected; the last step says Finish.
- Focus returns to the button that started the tour. If that button is gone, focus goes to the last step's target when it can take focus.
- The ring is an outline, so forced-colours mode keeps it.

**Invite, never impose.** SerraCalc offers the tour in the page ("New here?", with "Take the tour" and "Not now") and never as an overlay on first load. That keeps layouts, tests and returning users unaffected. Three buttons replay it:

- the wand in the header (in both modes);
- the More sheet on phones;
- the Guide screen.

**Layout details:**

- The layer is laid out left to right, so measured boxes place things as they are. The card inside reads in the page's direction.
- The card's position goes on a wrapping slot. Chrome maps an element's logical insets by its own direction, so a right-to-left card would otherwise anchor to the right edge.
- A tab in the background gets no animation frames, so the wait for a frame also has a short timer.

## Consequences

**Adding a tour to another app:**

1. Write a `TourDefinition`.
2. Put `data-tour` attributes on the targets.
3. Add the step text to the app's copy.
4. Place `<ah-tour-host>` in the app's shell, with its language, direction, root element, insets and a `navigate` function.

`libs/platform/tour/README.md` has the recipe.

**Progress:** a new `version` doesn't invite people again, but replaying shows the new steps. Progress is never synced or backed up, since it is about this device.

**Testing:**

- Unit tests cover progress, the target lookup, the placement table and the host's flow and focus.
- SerraCalc's e2e walks all ten steps at 375, 800 and 1280 px, asserting a ring and a card fully on screen at each. It also runs axe with a step open in light, dark and Arabic.
