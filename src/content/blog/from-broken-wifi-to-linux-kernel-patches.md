---
title: "From broken WiFi to Linux kernel patches in a week"
description: "I switched from Windows to Linux. The WiFi adapter that worked fine on Windows could not connect at all. Fixing that for myself turned into upstream contributions across six projects."
pubDate: 2026-05-04
draft: true
tags: ["linux", "kernel", "wifi", "open source"]
---

In April 2026 I switched my desktop from Windows back to Linux. The USB WiFi 7 adapter that had worked fine on Windows could not connect at all. Three weeks later I had merged contributions to two upstream projects (a USB calibration timeout fix in the [rtw89 kernel driver](https://git.kernel.org/pub/scm/linux/kernel/git/pkshih/rtw89.git/commit/?id=5055188134c3) and [six commits across five jurisdictions in wireless-regdb](https://lore.kernel.org/wireless-regdb/?q=f:loukot@gmail.com)) with another five fixes in submission queue across NetworkManager, wpa\_supplicant, cfg80211, and the Fedora SELinux policy. This post is what happened, what each fix was, and why open-source maintenance in 2026 still rewards a single user with a real problem and the right tools.

## Contents

1. [Background: Windows to Linux](#background-windows-to-linux)
2. [Tools first, theories second](#tools-first-theories-second)
3. [The first patch: USB calibration timeouts](#the-first-patch-usb-calibration-timeouts)
4. [The cascade](#the-cascade)
5. [The regulatory layer](#the-regulatory-layer)
6. [What this required from me](#what-this-required-from-me)
7. [Closing](#closing)

## Background: Windows to Linux

I had been on Windows for years. The USB WiFi 7 adapter I was using (Realtek RTL8922AU) had been running on that Windows machine for several months without much complaint. Occasionally the WiFi list would freeze and refuse to show any networks until I rebooted, but during normal use it was fine. Solid throughput, stable connection, no surprises.

Earlier in 2026 I decided to switch back to Linux as my daily driver. Microsoft has spent the last few years actively making Windows worse for the people who actually use it: ads in the Start menu, forced Microsoft accounts, Recall AI digesting screenshots whether you want it or not, an update cadence that prioritises telemetry over stability. I had used Ubuntu as my daily dev OS on a laptop about six years prior, and I remembered it being good. I picked Bazzite (an immutable Fedora variant) for the desktop and reinstalled.

The first thing I tried to do on the new install was connect to my home WiFi.

It did not work. Not "slow." Not "intermittent." It would scan, see the network, accept the password, and then fail to associate. The dmesg logs were full of RF calibration failures: `failed to wait RF DACK`, `failed to wait RF TSSI`, `failed to wait RF RX_DCK`. The connection never reached a usable state. I tried both the 5 GHz and 6 GHz bands. Neither worked.

This was the moment that mattered. I had two obvious paths from there.

The first path was the one I would have taken on Windows: search for someone else's workaround, apply it, hope it sticks. There were workarounds. Disable 6 GHz. Force a specific channel. Use NetworkManager's IWD backend instead of wpa_supplicant. Rebuild from a different fork of the driver. People had been chaining these together for months. The forum threads were long.

The second path was different. Linux is open source. The driver is open source. The supplicant is open source. The connection manager is open source. The regulatory database is open source. If I fixed the actual underlying problem instead of working around it, that fix could land upstream, and every other Linux user with this adapter (or related Realtek WiFi chips) would benefit. The forum-thread chain of workarounds would not need to exist. The bug would be fixed, not avoided.

I had no prior kernel experience. I had written embedded firmware in a previous life and I write enterprise full-stack code in my day job. The kernel was foreign. The mailing list workflow was foreign. The patch review etiquette was foreign. None of that would have stopped me on a junior project; I saw no reason it should stop me here.

I picked the second path.

What followed, over about three weeks, was upstream contributions to six different projects: the rtw89 kernel driver, the wireless regulatory database, the cfg80211 subsystem, NetworkManager, wpa_supplicant, and the Fedora SELinux policy. The rtw89 and wireless-regdb work has merged as I write this. The cfg80211 grammar fix has been accepted by Johannes Berg. The remaining patches (NetworkManager, wpa_supplicant, SELinux) are in soak or in the submission queue. The original "WiFi will not connect" problem was the first of about seven layered bugs, each one exposed by fixing the previous one.

I want to talk about how that happened. Not because the WiFi story is special, but because it is a clean illustration of what open source maintenance looks like in 2026 when one user with a real problem shows up with the right tools and the willingness to do the unglamorous middle 90 percent of the work.

## Tools first, theories second

The first thing I had to internalise was a discipline that I now write down in every retrospective: capture the runtime evidence before reading the source. Linux WiFi has a lot of moving parts. cfg80211 talks to mac80211 talks to the driver talks to firmware. Above that, wpa_supplicant talks to the kernel via nl80211. Above that, NetworkManager talks to wpa_supplicant via DBus. A bug at any layer can present as symptoms at any other layer.

In my case the symptom was "WiFi will not associate," which sounds like a wpa_supplicant or NetworkManager problem, the layers most users would reach for first. The actual cause was a firmware-side calibration timeout that lived in the driver, designed for the millisecond-scale round-trips of PCIe and never adjusted for the four-times-slower USB transport. The error messages in dmesg pointed at the right layer once I read them; I just had to know that "RF DACK timeout" was a driver-firmware handshake, not a wpa_supplicant authentication issue. That kind of layer-mapping is a learnable skill, and it pays for itself the first time it saves you a wasted afternoon trying to fix the wrong thing.

The temptation, if you've read any of those layers' source code, is to skip straight to "I bet I know which function." That instinct is almost always wrong. The bug isn't where you'd put it. It's where the previous maintainer didn't think about USB latency, or where someone added a heuristic in 2019 that assumed all multi-BSSID networks were extender meshes, or where the kernel returns a polite ENOENT that wpa_supplicant treats as fatal.

So: `iw event`, `journalctl -u wpa_supplicant -dd`, `dmesg`, `ftrace` for the really stubborn ones. For the calibration failures specifically, I did stress-ng matrices to confirm the timeouts were USB I/O bound and not host CPU bound. The matrix mattered later, when the maintainer asked exactly that question in code review.

## The first patch: USB calibration timeouts

The calibration failures turned out to be a clean upstream story. Realtek's RF calibration runs in firmware. The driver sends an H2C ("host-to-card") command, the firmware does the calibration, and a C2H ("card-to-host") response comes back. The driver waits for that response with a timeout designed for PCIe round-trips. USB round-trips are roughly 4 times slower. On 5 GHz and 6 GHz, the calibration deterministically timed out.

The fix is one variable. In `rtw89_phy_rfk_report_wait()`, multiply the timeout by 4 if the bus type is USB. Eight added lines, no removed lines, no per-chip changes, no behaviour change for PCIe users. Every calibration benefits: DACK, RX_DCK, TSSI, TXGAPK, IQK, DPK, and PRE_NTFY.

Three rounds of review with Ping-Ke Shih, Realtek's upstream rtw89 maintainer. v1 used per-calibration hardcoded values; he correctly pushed back on the cross-cutting hardcoding, and v2 collapsed to a single multiplier. v2 also included a "make calibration non-fatal on USB" patch that I had to drop after Ping-Ke pointed out the return value is silently discarded by every 8922a caller, and one specific caller (`rtw8922d_rfk_tssi`) uses it to fall back to non-TSSI mode. Dropping that fallback would have silently broken a different chip variant. [v3 on lore.kernel.org](https://lore.kernel.org/linux-wireless/20260416045536.817930-1-loukot@gmail.com/) was a single patch with the correct commit message, tested by Devin Wittmayer ("Lucid-Duck") across four different chipsets (RTL8922AU, 8852AU, 8852BU, 8852CU) plus a hard xHCI lockup reproducer with corroborating crash logs.

Merged into morrownr's out-of-tree tree as commit [`d3cb9b27`](https://github.com/morrownr/rtw89/commit/d3cb9b27) on 2026-04-24, and into Ping-Ke's `rtw-next` branch as commit [`5055188134c3`](https://git.kernel.org/pub/scm/linux/kernel/git/pkshih/rtw89.git/commit/?id=5055188134c3) on 2026-04-29. Wireless-next promotion follows on the next merge cycle. Mainline shortly after.

There was a small social moment. Within hours of the merge, the morrownr maintainer ("a5a5aa555oo") was responding to another reporter's bug report on the same project with "The fix from @louis-kotze is just merged." Real user fredthefrenchy on [morrownr/rtw89 issue #83](https://github.com/morrownr/rtw89/issues/83) confirmed in-wild that the fix resolved their TP-Link Archer TBE400UH problems on a different distribution and kernel.

This is unspectacular work. It's also where most upstream contributions live. Find the bug, fit the fix to the maintainer's preference, supply the testing matrix when asked, and watch it cascade.

## The cascade

About six hours after the calibration patch merged, dubhater (Bitterblue Smith) pushed [`f93ba288`](https://github.com/morrownr/rtw89/commit/f93ba288): "rtw89: Add missing TX queue mappings for RTL8922AU." It fixed a `Cannot map qsel to dma v2: 26` error that had been polluting dmesg for some users.

Why did it land six hours after my fix? Because before the calibration succeeded, the MLO link never came up, and the qsel mapping bug only surfaces when both bands of a multi-link association are active. My fix unblocked the next bug. Different contributor, different file, same cascade.

This pattern repeated several times over the following weeks. Each fix exposed the next gap. With WiFi finally connecting, I started using it normally, and a new symptom showed up: video calls dropped every five minutes, like clockwork. Not random, not signal-related. The connection wasn't disassociating; the receive and transmit queues just blocked for several seconds and then resumed. That turned out to be the NetworkManager bgscan heuristic mis-classifying WiFi-7 multi-link BSSIDs as separate access points and triggering an aggressive scan loop. Another layer, another fix, another patch in the queue. The chain, in rough order:

1. RF calibration timeouts (rtw89, merged)
2. TX queue mapping for B1 management frames (rtw89, merged)
3. The wpa_supplicant `wpa_clear_keys()` race during PMKSA-cached MLO reauth (patched locally, soaking before submission to hostap)
4. The NetworkManager bgscan heuristic mis-classifying WiFi-7 MLO per-link BSSIDs as separate APs and triggering a 5-minute scan loop (the "video calls drop every 5 minutes" symptom, patched locally, MR queued for gitlab.freedesktop.org)
5. The Fedora SELinux policy missing about 17 rules for systemd 256+, OpenSSH 9.8 split, polkit 124+ worker split, and NetworkManager 1.46+ dispatcher subdomains (local module loaded, upstream issue draft prepared)
6. The rtw89 driver hard-zeroing `eml_capabilities` and `mac_cap_info[1]` for all chip families, causing AP/STA negotiation to fall back to single-link MLO instead of EMLSR multi-link (patched locally, soaking before submission)
7. The wpa_supplicant pre-MLO-assoc scan-cache gap, exposed only once the EML capabilities were correctly advertised and multi-link assoc was actually attempted (RFC planned for hostap mailing list)

Seven layers of the Linux WiFi stack, surfaced by one user trying to get WiFi working on a fresh install. None of those gaps are anyone's fault. Multi-Link Operation is brand new. The 802.11be spec was ratified Q4 2024. The community has been catching up for less than two years. Vendors test what they can; community contributors fill in what falls between the test plans.

## The regulatory layer

The regulatory database problem actually surfaced during the same initial connect failure. With the calibration patch applied locally and the WiFi finally negotiating, my dmesg started logging `[link 2] regulatory prevented using AP config, downgraded` every time the kernel tried to bring up the 6 GHz band. The router was advertising 6 GHz at the South African legal limit (23 dBm LPI). The kernel was rejecting it because the in-kernel regulatory entry for ZA still listed only 14 dBm VLP, which predated the 2023 amendment. The runtime workaround was easy: tell `cfg80211` to load the GB regulatory entry, which has the right 23 dBm LPI rule because the same ETSI standard underpins both jurisdictions. But the proper fix was to update the wireless-regdb upstream to reflect ICASA Notice 1822 of 2023.

ICASA's notice referenced ETSI EN 303 687 for power, channel, and PSD. I downloaded the ICASA gazette PDF and the EN 303 687 standard, ran them through `pdftotext`, and grep-verified each claim against the actual standard text. The 100 percent confidence rule from the kernel community translates directly: secondary sources like blog posts or Wikipedia entries do not count. You read the primary regulatory document, you cite it in the commit message, and you supply the PDF if asked.

That patch landed in wens/wireless-regdb master as commit [`0bfb3d4`](https://git.kernel.org/pub/scm/linux/kernel/git/wens/wireless-regdb.git/commit/?id=0bfb3d4) on 2026-04-28. Hong Kong, Russia, South Korea, Ukraine, and a separate Russia 320 MHz patch from another contributor (where I supplied the Reviewed-by) landed over the next two days. Six total commits across five jurisdictions. None of them required deep technical knowledge of WiFi. They required reading the actual law and not trusting summaries.

## What this required from me

A few things, none of them exotic:

- A working Linux laptop or desktop. I happen to run Bazzite, an immutable Fedora variant, but any modern distro works. The atomic nature of Bazzite forced me to learn `rpm-ostree` overrides for replacing system packages with patched local builds, which turned out to be a transferable skill.

- A willingness to learn the toolchain. If you are coming from Windows, the kernel community's workflow looks alien at first. There is no GitHub PR button. Patches are emails. Reviews happen on a public mailing list. You use `git format-patch`, `git send-email`, `b4` for thread management, and `msmtp` with OAuth2 to send through Gmail without app passwords. None of this is mysterious. It is well documented and it is how everyone in this community works. The one-week investment to get fluent with it pays back forever, and once you have done one patch this way, the second one feels routine.

- A willingness to be wrong publicly. v1 of my v3-eventually-merged patch had a structural problem that the maintainer politely pointed out. I rewrote it. v2 had a different structural problem; I rewrote it again. The third version is what merged. None of those rewrites were embarrassing. They were the work.

- Discipline about primary sources. Every claim in every commit message I wrote was traceable to either a runtime capture I had personally produced, a regulatory document I had personally read, or the linux source code I had personally inspected. When I caught myself relying on a summary, I went back and verified the source. The 100 percent confidence rule is the entire game.

## Closing

If you are a Linux user with a problem you can describe specifically and reproduce reliably, the upstream community will work with you. Not always quickly, not always cheerfully, but consistently. Maintainers like Ping-Ke Shih and Chen-Yu Tsai (wireless-regdb) and Johannes Berg (cfg80211) and Jouni Malinen (wpa_supplicant) are doing the work because someone has to. When you show up with primary-source evidence and a respectful patch, you become a force multiplier for them.

The contributions worth making are usually the ones that are right in front of you. I did not pick a strategic feature roadmap. I picked the bug that was stopping me from getting on WiFi. Everything else cascaded from that. If your laptop's audio mic gets reset to 0 percent on every reconnect, the upstream fix for that is probably waiting for you to find it. If your country's regulatory entry is wrong, you can fix that. If your distribution's SELinux module hasn't caught up to the systemd 256 split, you can file the issue.

Linux works because users decide their problems are worth fixing. That decision is the bottleneck. Everything downstream of it (the tooling, the conventions, the maintainer relationships) is learnable in a week or two. The decision is the hard part.

I am going to keep going. The wpa_supplicant MLO group-key patch, the NetworkManager bgscan refinement, the Fedora SELinux policy gaps, the rtw89 EML capabilities, and the wpa_supplicant pre-MLO scan-cache RFC are all in flight as I post this on 2026-05-04. Some are likely to have landed by the time you read this. The cleanest way to verify is the commit log of each project.

If you are switching to Linux right now and your hardware does not quite work out of the box, you are not stuck with workarounds. The fix is a patch away. It might already exist in the next release of one of the projects above. If your specific case is the RTL8922AU or a related Realtek WiFi 7 chip, grab the latest [morrownr/rtw89](https://github.com/morrownr/rtw89) driver and the next [wireless-regdb](https://git.kernel.org/pub/scm/linux/kernel/git/wens/wireless-regdb.git) release; what was painful for me earlier this year should not be painful for you. If your case is something else and the fix does not exist yet, you are now in the same position I was in. File the bug. Or send the patch.

---

**What's next:** I will be writing a follow-up on the cross-stack debugging methodology that made this possible (agent-augmented source reading, raw-evidence prompting, and the multi-source verification habit). Subscribe via [RSS](/rss.xml) if you want it in your feed.

**Related:** [About me](/about) · [Open-source contributions list](/#open-source)
