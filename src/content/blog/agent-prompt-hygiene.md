---
title: "Agent prompt hygiene: raw evidence beats hypothesis"
description: "Coding agents are smart. They are also confidently wrong when you prompt them with a hypothesis instead of evidence. The fix is a posture change, not a tool change."
pubDate: 2026-05-11
draft: true
tags: ["ai", "engineering practice", "debugging"]
---

There is one mistake I see senior engineers make consistently when working with coding agents: they prompt with a hypothesis instead of with evidence.

It looks like this:

> *"I think the bug is in `auth_middleware.go` because token expiry is checked before refresh. Can you find it and fix it?"*

The agent dives into `auth_middleware.go`, finds something that looks like a token expiry check, agrees with you, and produces a polished patch. The patch does not fix the bug, because the bug was not in `auth_middleware.go`. It was in the upstream service generating tokens with the wrong `iat` claim. You will not learn this until production tells you, because the agent had no incentive to disagree with you.

The agent did exactly what a junior engineer trying to get a good performance review would do. It pattern-matched on your hypothesis, found supporting evidence, ignored disconfirming evidence, and shipped. This is not the agent's fault. It is a function of how you framed the prompt.

## The pattern

Hypothesis-framed prompts produce confidently wrong agents. Evidence-framed prompts produce agents that disagree with you when you are wrong.

The exact prompt that would have helped, in the example above, is something like:

> *"Auth requests started failing at 14:32 UTC with 'token expired' errors despite valid tokens being issued seconds prior. Here are 3 sample failed requests with timestamps, headers, and the issuer service's response. Here is the relevant section of `auth_middleware.go` and the JWT verification flow. Where is the actual root cause?"*

This is roughly 4 times longer to write. It is also the only kind of prompt that will reliably surface an answer of *"the bug is not in `auth_middleware.go`. Look at the issuer service."* Because the agent has independent ground truth (the timestamps, the headers, the source) to compare against your suspicion. When ground truth disagrees with your suspicion, the agent has something to say.

## Why agents are this way

Coding agents are tuned for cooperation. The reward signal during training is something like "user engages positively with response." Disagreement is a small but real penalty. If you give an agent a hypothesis with no contradicting evidence, the path of least resistance is agreement.

This is the same pattern as juniors-who-want-to-please. The fix in human teams is the same as the fix with agents: lower the cost of disagreement and raise the cost of false agreement. With humans you do that through culture. With agents you do that through the prompt.

Raw evidence raises the cost of false agreement. If you have given the agent a stack trace and a piece of code, and the agent says "yes, the bug is in `auth_middleware.go` line 47," you can verify. If the verification fails, the agent has burned credibility on the next exchange. So the agent will only commit if the evidence supports it. Or, more interestingly, the agent will refuse to commit and ask for more evidence. Both outcomes are useful.

## A receipt

Earlier this week I needed to know whether the rtw89 Linux kernel driver was advertising EHT Multi-Link capabilities for the RTL8922AU chip. I had a runtime symptom (only one of two MLO links was associating) and a hypothesis (the driver was hard-zeroing the relevant capability bits).

I dispatched a research agent. The prompt was not "is the bug in EML capabilities?" The prompt was, roughly:

> *"Read the upstream rtw89 driver in wireless-next.git. For each of these three questions, give me a verdict, the file:line reference, and a 2-3 line code excerpt:*
> *1. Does the chip_info for RTL8922A declare 320 MHz support? Find where IEEE80211_EHT_PHY_CAP0_320MHZ_IN_6GHZ is set or skipped.*
> *2. Does the driver set IEEE80211_EHT_MAC_CAP1_RESTRICTED_TWT?*
> *3. What is the wiphy.valid_links and multi_radio_capa for 8922au? Does it declare itself as STR-capable or EMLSR-only?*
>
> *Do not speculate. If a question has no source-side answer, say so."*

The agent came back with one verdict that confirmed my hypothesis (EML capabilities are zero), one that surprised me (the 320 MHz omission is silicon-bound, not driver-bound, and applies equally to PCIe variants of the same chip), and one that was structurally different from what I expected (the driver does declare 2-link support via `support_link_num = 2`, but the EML caps subfield is empty, which causes the AP to fall back to single-link mode regardless).

The "320 MHz is silicon-bound" verdict was the most useful answer of the session. If I had asked "how do I make the driver advertise 320 MHz support?" I would have gotten back a plausible patch that would have shipped silicon-incorrect capabilities. Because I asked for a source-grounded verdict instead, the agent told me not to make that patch.

## The general rule

When you talk to a coding agent about something that matters, give it:

- The actual evidence (logs, code, error messages, runtime captures)
- The exact question (one verdict, one file:line, one excerpt)
- An explicit invitation to disagree ("if no source-side answer, say so")

Do not give it:

- Your theory framed as a question
- A vague task ("fix the auth bug")
- An implicit assumption that you are right

The hypothesis-framed prompt feels efficient. You already know what the answer probably is, you are just speeding up the verification. In practice it does the opposite: it produces a polished, confident, and wrong answer that you then have to debug a second time when production catches it.

## When this matters more

The cost of confidently-wrong-agent grows with stakes:

- Trivial: refactoring a function. The agent will agree with your refactor; if the refactor was good, fine; if it was bad, the test suite will catch it. Hypothesis-framed prompts are okay here.
- Medium: tracing a bug through a familiar codebase. Hypothesis-framed prompts will sometimes work, sometimes waste your time. Evidence-framed prompts are reliably faster.
- High: tracing a bug through unfamiliar code, evaluating an upstream patch, deciding whether to file a kernel bug, writing a regulatory document patch. Hypothesis-framed prompts will reliably mislead you. Evidence-framed prompts are the only acceptable mode.

I have started treating evidence-framed prompting as a default rather than a special-case discipline. The "raise the verbosity floor" cost is real, maybe 30 to 90 seconds per non-trivial prompt. The "stop debugging confident-wrong agent output" benefit is huge, often saving entire sessions of misdirection.

## What this is not

This is not a productivity tip. It is not a prompt-engineering trick. It is a specific posture change about how you treat the agent: not as a junior engineer who agrees with you, but as a peer reviewer who needs evidence to validate or invalidate your hypothesis. The same posture you would take with a human collaborator on a high-stakes review.

Agents are smart. The smart move is to let them disagree with you.
