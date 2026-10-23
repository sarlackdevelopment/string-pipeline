# AI usage log

The brief asks for the AI logs "so we can understand what goes on under the hood" (R4.3). This folder shows the same work three ways.

| File                         | For                           | What                                                                                                                   |
| ---------------------------- | ----------------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| [journal.md](journal.md)     | People                        | One entry per step: what was asked, what the assistant did, what was decided and why, how it was checked, which commit |
| [agent-log.md](agent-log.md) | Agents                        | A "Current state" block, then the same steps in a fixed template. A new session reads it first to pick up the work     |
| `sessions/`                  | Anyone who wants every detail | Raw exports of sessions without private content; none so far                                                           |

How the log is kept:

- The assistant is Claude Code running Claude Opus 5.5. Commits it helped write carry a `Co-Authored-By` trailer.
- Both journals are updated at the end of every step, in the same commit as the code.
- They record only what actually happened, including dead ends and fixes.
- The developer and the assistant talk in Russian, so the raw sessions are mostly in Russian; the journals are in English.
- The session the work happens in also contains private correspondence, so it is summarised here instead of exported (D25).
