# shared-ai-schema

Turns a valibot schema into JSON Schema in the strict structured-output subset that OpenAI and Groq strict mode, Claude and Gemini all accept, and lists what would make a provider refuse one. Every key is required, objects are closed, unions are `anyOf`, and objects nest at most 5 deep.

Moved out of StudyLM's lessons lib (ADR-0021) so the Learning Engine's AI kit can use it too (ADR-0024). It is `type:util` and `runtime:agnostic`, so domain libs, browser apps and Nest can all import it.

Run `nx test shared-ai-schema` for its tests. Each lib that compiles schemas keeps its own spec, checking that every schema it exports passes `strictnessProblems`.
