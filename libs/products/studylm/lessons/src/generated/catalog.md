# Block catalog

### `prose`: Explanation

A short written explanation that connects the visuals.

- **Use it for:** introducing an idea before showing it; connecting two visuals.
- **Avoid it for:** a process with steps: use a visual; a list of facts to memorise: use cards.
- Two to four short paragraphs at most; the visuals carry the detail.
- Concrete before abstract: start from an example the learner knows.

### `callout`: Callout

One idea set apart: the key idea, an analogy, a pitfall, a tip or a definition.

- **Use it for:** the one thing to remember from a section; a common mistake worth warning about.
- **Avoid it for:** anything longer than a few sentences.
- One idea per callout.
- Analogies use everyday things and say where they break down.

### `compare`: Comparison table

Two to four options compared aspect by aspect.

- **Use it for:** choosing between techniques, data structures or protocols.
- **Avoid it for:** a single thing described: use prose.
- Every row compares the same aspect across all columns.
- Cells are short phrases, not sentences.

### `code-walkthrough`: Code walkthrough

Code read in steps, highlighting lines and pinning notes, without running it.

- **Use it for:** explaining how a piece of code is structured; code that doesn't run alone (a class, a config, SQL).
- **Avoid it for:** showing how values change as code runs: use code-trace.
- Real, idiomatic code that would compile.
- One idea per step; 3 to 10 steps.

### `code-trace`: Code trace

A program run line by line, with variables, the call stack and output after each line.

- **Use it for:** loops, recursion, closures, references: anything where the state matters.
- **Avoid it for:** long programs: keep the code short and the input small.
- For JavaScript use mode "execute" with a short "call": the app runs it and records every frame, so it is always right.
- For other languages use "scripted" and write each frame's state exactly as the program would have it.
- Small inputs: the run should take 5 to 30 frames.

### `array`: Array

An array changing as an algorithm runs: comparisons, swaps, pointers and the active range.

- **Use it for:** sorting, searching, two pointers, sliding windows, prefix sums.
- **Avoid it for:** data without indexes: use stack-queue, hash-table or graph.
- Prefer "simulate" when the algorithm is listed: the app computes correct steps from the input.
- For scripted steps, declare every pointer name first and narrate the decision at each step.
- Keep arrays short (5 to 10 values) so every step is readable.

### `stack-queue`: Stack or queue

Items pushed and popped (stack) or enqueued and dequeued (queue) one step at a time.

- **Use it for:** call stacks, undo, bracket matching, BFS frontiers, task scheduling.
- **Avoid it for:** random access by index: use array.
- Only operations the mode allows.
- Never remove from an empty structure.

### `hash-table`: Hash table

Keys hashed into buckets: inserts, lookups, collisions and resizing.

- **Use it for:** explaining O(1) lookup, collisions, load factor, resizing.
- **Avoid it for:** ordered data: use tree.
- Use "char-sum-mod" for string keys and "mod" for integer keys, so the app can check every bucket.
- Show at least one collision: anagrams collide under char-sum-mod.

### `tree`: Tree

A tree with its traversals and changes: BSTs, heaps, binary and general trees.

- **Use it for:** BST search and insert, heaps, traversal orders, hierarchies.
- **Avoid it for:** graphs with cycles or many parents: use graph.
- List nodes parents first; give binary children a side.
- A bst keeps the BST order and a heap its heap order; the app checks both.
- Prefer "simulate" for the listed algorithms.

### `graph`: Graph

Nodes and edges with a traversal or shortest-path algorithm running over them.

- **Use it for:** BFS, DFS, Dijkstra, topological sort, dependency graphs, networks.
- **Avoid it for:** a system's architecture: use flow.
- At most 8 to 10 nodes so the layout stays readable.
- Prefer "simulate" with a start node; topological sort needs a directed graph without cycles.

### `grid`: Grid

A grid of cells for path finding, flood fill and dynamic-programming tables.

- **Use it for:** BFS on a maze, A*, unique paths, minimum path sum, LCS tables.
- **Avoid it for:** grids larger than 10 by 10.
- Rows as strings of ".", "#", "S", "G" or digits.
- Prefer "simulate"; lcs builds its own table from "a" and "b".

### `recursion-tree`: Recursion tree

Every call a recursive function makes, as a tree, with returns and memo hits.

- **Use it for:** recursion, overlapping subproblems, memoisation, exponential blow-up.
- **Avoid it for:** loops: use code-trace.
- Prefer "simulate" with a small n: fibonacci 4 or 5 shows the repeated work clearly.
- Scripted calls follow the call stack: only the innermost open call returns.

### `flow`: Data flow

Packets of data moving between the parts of a system, step by step.

- **Use it for:** request lifecycles, caching, queues, microservices, pipelines between services.
- **Avoid it for:** who-talks-to-whom over time with replies: use sequence.
- Typed nodes (client, server, database, cache, queue…) and labelled edges.
- Every step moves or handles one packet, with a payload preview when the content matters.

### `sequence`: Sequence diagram

Messages between participants over time: requests, replies and async messages.

- **Use it for:** protocols and handshakes (HTTP, TCP, TLS, OAuth), API call chains.
- **Avoid it for:** data transformed in place: use pipeline.
- Messages in the order they happen; replies use the style "reply".
- Show each message once.

### `state-machine`: State machine

States and the events that move between them, fired one by one.

- **Use it for:** promises, TCP states, UI states, parsers, protocol states.
- **Avoid it for:** processes without distinct states.
- Exactly one initial state.
- Each fire must leave the current state; reject shows an ignored event.

### `pipeline`: Pipeline

Data passing through stages and changing shape at each one.

- **Use it for:** compilers (source, tokens, AST), middleware, ETL, CI/CD, rendering.
- **Avoid it for:** back-and-forth between systems: use sequence.
- Show the data after each stage, so the change is visible.
- 3 to 6 stages.

### `event-loop`: Event loop

The call stack, Web APIs, task queue and microtask queue as JavaScript runs.

- **Use it for:** setTimeout, promises, async/await ordering, why the UI freezes.
- **Avoid it for:** synchronous code: use code-trace.
- Prefer mode "execute": the app runs the code and records the queues itself.
- Scripted steps must follow the loop: microtasks drain before the next task, and tasks run only on an empty stack.

### `git-graph`: Git graph

Commits, branches and merges growing as git commands run.

- **Use it for:** branching, merging, rebasing, resetting, tags.
- **Avoid it for:** anything that isn't version control.
- Commit ids are new and unique; merges create a merge commit.
- Check out a branch before committing to it.

### `concept-map`: Concept map

Ideas and how they relate, revealed step by step or shown at once.

- **Use it for:** recaps, how the parts of a topic fit together.
- **Avoid it for:** a process in order: use flow or pipeline.
- Every link has a short verb phrase: "points to", "stores", "is a".
- 5 to 10 concepts.

### `chart`: Chart

A line or bar chart, with growth curves the app computes.

- **Use it for:** comparing complexities (log n, n, n²), benchmark numbers.
- **Avoid it for:** data that changes step by step: use a visual.
- For complexity, give "fn" and let the app compute the values.
- At most 4 series.

### `predict`: Predict first

The learner commits to an answer before a visual shows it.

- **Use it for:** right before a visual reveals something surprising.
- **Avoid it for:** questions the lesson hasn't set up yet.
- Point "reveal" at the visual (and step) that shows the answer.
- Prediction helps even when the guess is wrong: ask about the outcome, not trivia.

### `quiz`: Quiz question

A multiple-choice question; several options may be right.

- **Use it for:** checking understanding after a section.
- **Avoid it for:** testing recall of wording.
- Distractors come from real misconceptions.
- The explanation says why the right answers are right and the others wrong.

### `self-explain`: Explain it

An open question the learner answers in their own words.

- **Use it for:** the "why" behind a design or behaviour.
- **Avoid it for:** questions with one-word answers: use cloze.
- Ask why or how, generally ("Why does…?"), not for a specific fact.
- The rubric lists the 2 to 4 points a good answer makes.

### `order-steps`: Put in order

The learner puts the steps of a process in order.

- **Use it for:** lifecycles, algorithms, protocols, workflows.
- **Avoid it for:** steps whose order doesn't matter.
- Items in the right order; the app shuffles them.
- 4 to 7 items.

### `categorize`: Sort into groups

The learner sorts items into two to four groups.

- **Use it for:** telling cases apart: base case or recursive case, O(1) or O(n), sync or async.
- **Avoid it for:** items that fit several groups.
- Every item belongs to exactly one group, and every group gets items.

### `parsons`: Arrange the code

The learner puts shuffled lines of a solution in order, filling in any blanks (faded Parsons).

- **Use it for:** practising a code pattern before writing it from scratch.
- **Avoid it for:** code longer than about 12 lines.
- Lines in the right order with their indent; the app shuffles them.
- Fade one or two key parts into ___ blanks; add at most 3 plausible wrong lines.

### `predict-output`: What does it print?

The learner predicts the exact output of a short program.

- **Use it for:** ordering surprises (event loop, closures, hoisting), language edge cases.
- **Avoid it for:** programs whose output is long.
- For JavaScript use "execute": the app runs the code to confirm the output.
- The output is a few short lines.

### `cloze`: Fill the gaps

A sentence with key terms blanked out for the learner to recall.

- **Use it for:** terminology, key facts at the end of a section.
- **Avoid it for:** blanks with many possible answers.
- Blank only the key terms; list accepted variants.
