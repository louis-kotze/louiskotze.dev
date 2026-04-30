---
title: "Value over mastery"
description: "Why I shipped Linux kernel patches before I knew the Linux kernel, and the discipline that keeps that posture from collapsing into move-fast-break-things."
pubDate: 2026-05-18
draft: true
tags: ["philosophy", "engineering practice", "open source"]
---

> **Author note (delete before publish):**
> This is the philosophy anchor piece for `louiskotze.dev`. Per the project_blog_ideas note: write this longhand first. AI is fine for editing polish; AI-generated philosophy prose reads wrong on a personal-worldview piece. Readers can tell.
>
> What follows is an OUTLINE with key beats, structural recommendations, and pre-vetted quote handling. Use it as scaffolding. Replace each section with your own voice.

---

## Opening hook (one paragraph)

The WiFi-driver origin moment. Frame: there were workarounds. There was no real fix. I decided to write the real fix.

Specific opening line candidates (pick one, in your voice):
- "I bought a USB WiFi adapter that mostly worked. The parts that did not became upstream Linux kernel patches. I had no kernel experience when I started."
- "There were workarounds. There was no real solution. I decided to write the real solution."
- "Most of the things I have shipped that mattered were started before I felt ready to start them."

## Section 1: The Agile origin (write longhand, ~300-400 words)

Personal narrative. Three beats:
1. When you first encountered Agile / Scrum (timing, role, project)
2. What you saw in it that others did not (transparency, reflection, adaptation, value-orientation)
3. Pushback you got from peers ("why ship half-working products instead of doing it right with waterfall?") and your response

The argument here is not "Agile is good." It is "I noticed a particular shape in Agile that I had been doing instinctively in personal life, and recognising it gave me the discipline to do it on purpose."

Honest about: where Agile has been corrupted into ceremony-cargo-cult. You are not endorsing scrum-master industry. You are endorsing the underlying posture.

## Section 2: Extending the posture beyond work (write longhand, ~300-400 words)

How the same value-over-mastery posture shows up outside of formal Agile contexts:
- Personal projects shipped before feeling ready
- Career moves made before having "all the credentials"
- Open source contributed to before knowing the project deeply

Three short receipts (one paragraph each), e.g.:
1. The WiFi driver story (the rtw89 contributions)
2. A non-OSS receipt (a work decision, a personal project, a learning move)
3. The standing AI-trigger system (upstream check, best-practice check, professional-presence check): every interaction systematically captured for compounding learning

The posture: focus on the value being delivered, deliver in iterable shape, resist perfectionism that might get discarded.

## Section 3: The critical guardrail (write longhand, ~250-300 words)

The single most important section of the post. Without this, the philosophy collapses into "move fast and break things," which is not what you mean.

Core distinction to spell out: **"ship before ready" ≠ "ship bad."**

What separates them:
- The warmup-contribution habit (start with safe one-liners to learn the workflow)
- Primary-source discipline (do not trust summaries; verify against the source document)
- The 100% confidence rule (do not submit at 95%)
- Post-investigation audit (encode lessons as memory, do not let them stay in one engineer's head)
- Calibrated humility (when reviewers push back, update; do not defend)

Without these, value-over-mastery is reckless. With them, it is rigorous shipping. This is the senior-engineer version of the philosophy. Make this distinction explicit: it is what separates you from a thousand "just ship it" hot-take posts.

## Section 4: The philosophy as standing instructions (write longhand, ~200-300 words)

This is where the post differentiates from generic "ship before ready" content. You have built standing AI-triggers that turn this philosophy into a continuous practice rather than an occasional act of courage.

Specifics:
- `feedback_upstream_contributions.md`: every chat, AI watches for upstream contribution opportunities
- `feedback_best_practice_workflow.md`: every action, AI checks whether you are using the canonical tool / workflow
- `feedback_professional_presence.md`: every milestone, AI surfaces CV / portfolio / LinkedIn updates worth making
- Project-level audit memories that track current state of each artifact

The posture has been compiled into a system. The system runs continuously. You do not have to remember to apply the philosophy; it applies itself, surfacing opportunities when they arise.

The reader takeaway: this is not a one-time decision. It is a sustained operating mode.

## Section 5: The two quotes (be careful here)

Two motivational quotes resonate with this philosophy. Both are problematically attributed; neither attribution holds up to scrutiny. Quote-investigator research from 2026-04-19 (cite if you want):

**Quote A:** *"Whether you think you can, or you think you can't, you're right."*
- Almost certainly **misattributed** to Henry Ford.
- Earliest documented link: *Reader's Digest* September 1947 (posthumous, no source).
- The sentiment predates Ford and is traceable to Virgil's *Aeneid V*.
- **Recommended framing:** "There is a line often credited to Henry Ford, probably wrongly, that whether you think you can or you think you can't, you're right. Whoever first said it was onto something." Honest caveat, then use the idea anyway.

**Quote B:** *"If someone can, I can. If no one can, I must."*
- **No primary source exists.** Not in Musashi, Hagakure, Nitobe, or Gandhi. Not a documented Japanese kotowaza. Quote Investigator has no entry. Likely a modern motivational fabrication.
- **Recommended framing:** paraphrase in your own voice, claim no attribution. Something like: *"I have come to believe, maybe I read it somewhere, that if someone has done a thing, I can do it. And if no one has, I must."* Now it is yours. No attribution risk.

Place these two thoughts somewhere in the second half of the post, where they pay off the framing established earlier. Do not lead with them.

## Closing (one short paragraph)

Pay off the opening hook. The WiFi driver got patched. The follow-up patches are in flight. None of them required a credential I did not have. They required a decision I made on a particular Tuesday afternoon.

Close on the reader, not on yourself: their version of the same Tuesday afternoon is presumably available to them too.

## Distribution notes (delete before publish)

- This is the strongest candidate for the anchor / pinned post on `louiskotze.dev`. New visitors who land here should leave with a clear sense of who you are.
- Cross-post candidates: Hacker News (philosophy posts hit if titled well), lobste.rs, dev.to.
- Tag with `philosophy`, `engineering practice`, `open source`. Avoid `career` tag: it skews the audience toward job-board readers.
- Pair with the rtw89 narrative post (#1) for cross-linking; the rtw89 post is the receipts, this post is the worldview.
