# platform-assistant (`@ah/platform/assistant`)

An app's AI assistant in the browser (ADR-0031): the conversation loop, its guards, and `<ah-assistant-panel>`. The model only proposes. Look-ups and moves run at once, settings run with Undo, and changes wait on a card, written by the app, until the reader presses Apply.

The server side is `apps/assistant-edge` (a Cloudflare Worker) over `@ah/shared/assistant-engine`; the contract between them is `@ah/shared/assistant`.

## Add the assistant to an app

1. **Write the profile** in the app's domain library, so the Worker can hold it too:

   ```ts
   export const MY_ASSISTANT = {
     id: 'myapp',
     version: 1,
     tools: [
       defineTool({
         name: 'get_item',
         description: 'One item in full.',
         effect: 'read', // read | navigate | setting | write | destructive
         args: v.object({ itemId: v.string() }),
       }),
       // …
     ],
     context: v.object({ screen: v.string(), items: v.array(/* … */) }),
     system: (locale) => `You are the assistant inside MyApp. Answer in …`,
   } satisfies AssistantProfile;
   ```

   Keep argument schemas to objects, arrays, strings, numbers, booleans and picklists: `portabilityProblems(toolSpec(tool))` lists anything a provider would refuse; check it in a spec.

2. **Register it on the Worker:** add the profile to `PROFILES` in `apps/assistant-edge/src/worker.ts`, and the app's origins to `ALLOWED_ORIGINS` in its `wrangler.jsonc`.

3. **Run the tools** in the app. Each executor gets arguments already checked against the schema:

   ```ts
   const executors = {
     get_item: {
       run: ({ itemId }) => ({ ok: true, result: store.item(itemId) }),
     },
     set_dark: {
       run: ({ on }) => {
         const before = prefs.dark();
         prefs.setDark(on);
         return {
           ok: true,
           result: { on },
           note: t().dark,
           undo: () => prefs.setDark(before),
         };
       },
     },
     delete_item: {
       check: ({ itemId }) =>
         store.item(itemId) ? null : `No item "${itemId}"`,
       describe: ({ itemId }) => ({
         heading: t().deleteItem(store.item(itemId)!.name),
         lines: [t().noUndo],
       }),
       run: async ({ itemId }) =>
         (await store.delete(itemId))
           ? { ok: true, result: { deleted: itemId } }
           : { ok: false, error: 'not deleted' },
     },
   };
   ```

   - `write` and `destructive` tools need `check` (why it can't run, or `null`) and `describe` (the card, in the reader's language).
   - `note` shows in the conversation; `undo` adds an Undo button next to it.

4. **Provide it and place the panel**, in a component the shell loads on first use:

   ```ts
   @Component({
     selector: 'my-assistant',
     imports: [AssistantPanel],
     providers: [
       provideAssistant(() => ({
         profile: MY_ASSISTANT,
         locale: () => i18n.lang(),
         context: () => ({ screen: where(), items: summary() }),
         executors,
         storageKey: 'myapp.assistant',
       })),
     ],
     template: `<ah-assistant-panel
       [(open)]="open"
       [greeting]="…"
       [suggestions]="…"
       [privacy]="…"
       [placeholder]="…"
     />`,
   })
   export class MyAssistant {
     readonly open = model(false);
   }
   ```

   The shell: `@defer (when loaded()) { <my-assistant [(open)]="open" /> }`. The panel's own words (Apply, New chat, the error messages…) come with it in five languages.

5. **Point the app at the Worker:** `assistantUrl` in `tools/hosting/environments.json` is written into `site-config.json` by `prepare-hosting.mjs --site-config`.

SerraCalc is the full example: `libs/products/serracalc/domain/src/lib/assistant/` and `libs/products/serracalc/feature/src/lib/assistant/`.

## Run it locally

1. `ollama pull qwen2.5:7b` (or any model with tool calling).
2. Copy `apps/assistant-edge/.dev.vars.example` to `.dev.vars` (ignored by git).
3. Start the Worker on :8788: the `assistant-edge (wrangler dev)` launch config, or `pnpm nx serve assistant-edge`.
4. Build the app and write its development config: `node tools/scripts/prepare-hosting.mjs <dist>/browser --env development --cors --site-config`, then serve it.

A local 7B model takes about a minute a round; the Worker allows a local model 120 s and the page waits for it.

## Tests

- `pnpm nx test platform-assistant`: the loop with a scripted transport (reads, cards, cancel, refused calls, the repeat guard, failures, keeping the conversation) and the panel.
- In an app's e2e, answer the Worker with `page.route` and serve `site-config.json` with an `assistantUrl` (see `apps/portfolio/shell-e2e/src/serracalc.spec.ts`).
