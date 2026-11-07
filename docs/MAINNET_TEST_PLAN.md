# Mainnet End-to-End Test Plan

This plan walks the whole CIRCLA loop on Base mainnet with real wallets, the real Telegram bot, and the live Mini App.
It covers every feature: group setup, invites, joining, deposits, proposals, voting, execution, the price floor, withdrawals, and the bot's group feed.
Run it top to bottom; each step says what to do, what the app should show, what the group should see, and how to confirm it onchain.

Vault under test: [`0x9353ccfACB7C53ce8a920A953E29F870000280ec`](https://basescan.org/address/0x9353ccfACB7C53ce8a920A953E29F870000280ec).
State on 2026-11-07: no members, no proposals, joining open, only the owner wallet invited.

## Before you start

### People and wallets

| Role | Wallet | Needs |
| --- | --- | --- |
| A, owner | `0x62f5a416c0077472822B3Ceb60bA2A6577D68784` | 2 USDC and about 0.0002 ETH on Base (has 1.24 USDC today) |
| B, member | `0xcDdb81532740E54b89300595C7586480260FCb7f` | 1 USDC and about 0.0002 ETH on Base (has 0 USDC today) |
| C, outsider | Any third wallet | Nothing; it only checks that strangers are blocked |

Total spend is about 3 USDC, most of which comes back at the end, plus well under 0.001 ETH in gas.

### Timing

- Run on a weekday between 13:30 and 20:00 UTC, when the stock price feed is fresh.
  Over weekends the feed holds Friday's close, and the 5% execution price floor may reject buys.
- A proposal stays open for 30 minutes, so have A and B ready before section 5.
- Allow about 45 minutes in total.

### Setup

- A Telegram group with A and B in it, and `@circlabasebot` added.
- Each tester can open the Mini App with their wallet.
  Inside Telegram the in-app browser blocks wallet pop-ups, so use "Continue in browser" or "Connect a phone wallet" on the connect screen.
- Keep the vault's Basescan page open to watch transactions land.

### Do not press

- "Close joining for good" in the Circle membership card.
  It cannot be undone, and it would block B from joining for the rest of this test.

## How to record results

Tick each box as it passes.
If something fails, note the step number, what you saw, the time, and the transaction hash from your wallet, then continue if you can.
Group messages can lag 10 to 60 seconds because the bot polls the public Base RPC; wait a minute before marking a group message as missing.

## 1. Group setup

1. [ ] In the group, send `/start_syndicate`.
   - Group: "Syndicate ready" with vault `0x9353…80ec`, "quorum 2", and three buttons (Contribute USDC, Vote, Portfolio).
2. [ ] Send `/help`.
   - Group: the command list, including `/invite <wallet>`, `/deposit <USDC>`, and `/withdraw`.
3. [ ] Send `/stocks`.
   - Group: the registry-enabled stocks, NVDAc among them.
4. [ ] Send `/status`.
   - Group: "Members: 0", "Pool value: 0 USDC", "Total units: 0".

## 2. Invites

5. [ ] Send `/invite` with no address.
   - Group: instructions to send `/invite` followed by a wallet address.
6. [ ] Send `/invite 0xcDdb81532740E54b89300595C7586480260FCb7f`.
   - Group: "Invite request for 0xcDdb…Cb7f (0/5 seats taken)", naming owner `0x62f5…8784`, with an "Open invite panel" button.
7. [ ] Send `/invite 0x62f5a416c0077472822B3Ceb60bA2A6577D68784`.
   - Group: "0x62f5…8784 is invited", with an "Open app to join" button.
8. [ ] Send `/invite not-a-wallet`.
   - Group: "Usage: /invite <wallet address>".
9. [ ] As A, open the Mini App and go to Actions.
   - App: a "Circle membership" card ("0 of 5 seats taken", "Joining open") above a "Join the circle" card.
   - App: "Join circle" is enabled, because A was invited after the deploy.
10. [ ] In the invite box, type `0xnotreal`.
    - App: "Not a valid address: 0xnotreal" in red, and Invite stays disabled.
11. [ ] Replace it with B's address and tap Invite, then approve in the wallet.
    - App: "Invited 1 wallet. They can tap Join circle now." after the transaction confirms.
    - Group: "✉️ 0xcDdb…Cb7f was invited to …".
12. [ ] Send `/invite 0xcDdb81532740E54b89300595C7586480260FCb7f` again.
    - Group: "0xcDdb…Cb7f is invited."
13. [ ] Optional revoke check: paste B's address, tap Revoke, confirm, then invite B again.
    - Group: a "invite … was revoked" message, then a fresh "was invited" message.

## 3. Joining

14. [ ] As C, open the Mini App and go to Actions.
    - App: "This circle is invite-only", the `/invite <C's address>` command with a Copy command button, and a disabled "Waiting for an invite" button.
    - App: no Circle membership card, since C is not the owner.
15. [ ] As A, tap "Join circle" and approve.
    - App: the button shows "Joining…", then the join card is replaced by the deposit, proposal, and withdraw cards without a manual refresh.
    - Group: "👋 0x62f5…8784 joined …".
    - Basescan: a `join` transaction from A.
16. [ ] As B, tap "Join circle" and approve.
    - App: the same switch to member cards.
    - Group: "👋 0xcDdb…Cb7f joined …".
17. [ ] Send `/members`.
    - Group: both wallets, each with 0 deposited and 0 units.

## 4. Deposits

18. [ ] As A, enter a deposit larger than A's balance.
    - App: "Your wallet holds $X USDC. Enter that or less." and a disabled "Not enough USDC" button; nothing is sent to the wallet.
19. [ ] As A, enter `1` and tap "Approve + deposit $1".
    - Wallet: two prompts, an approve for exactly 1 USDC, then the deposit.
    - App: "Approve in wallet (step 1 of 2)", "Approving…", "Deposit in wallet (step 2 of 2)", "Depositing…", then the box clears and the wallet balance drops by 1 without a manual refresh.
    - Group: "💰 0x62f5…8784 contributed 1 USDC (1 units)".
20. [ ] As B, deposit `1` the same way.
    - Group: "💰 0xcDdb…Cb7f contributed 1 USDC (1 units)".
21. [ ] Send `/status` and `/members`.
    - Group: pool value 2 USDC, total units 2, and each member at 1 USDC deposited and 50% of the pool.
22. [ ] In the app's Vault tab, check the pool value, units, quorum, and member list.
    - App: $2, 2 units, quorum 2, both members at 50%.

## 5. Proposal, votes, and execution

23. [ ] Send `/propose buy 1 NVDAc` in the group.
    - Group: a proposal preview (asset, token, 1 USDC input) with an "Open CIRCLA app" button.
24. [ ] As A, in "Propose a buy", pick NVDAc and enter `5`.
    - App: "The vault holds $2 USDC. Propose that or less, or deposit more first." and the button stays disabled.
25. [ ] Enter `1`, keep 1% slippage, and tap "Create proposal".
    - App: an estimate of about 0.005 NVDAc before sending; after confirmation, a "Proposal #1" card appears without a manual refresh, showing "Closes in 30 min".
    - Group: "🗳 Proposal #1: buy 1 USDC → 0xb200…108C".
26. [ ] As A, tap "Vote yes".
    - App: the spinner clears and the card says "You already voted on this proposal", with "1 yes".
    - Group: "0x62f5…8784 voted yes on Proposal #1 · 1/2 yes · 0 no".
27. [ ] Send `/votes`.
    - Group: "Votes: 1/2 yes · 0 no", "awaiting votes", the minutes left, and A as the voter.
28. [ ] As B, send `/vote yes` in the group, tap its button, and vote yes in the app.
    - Group: "0xcDdb…Cb7f voted yes on Proposal #1 · 2/2 yes · 0 no".
    - App: the badge changes to "ready to execute" and an "Execute swap" button appears.
29. [ ] As either member, tap "Execute swap".
    - App: the badge changes to "executed".
    - Group: "✅ Proposal #1 executed: 1 USDC → …".
    - Basescan: an `executeProposal` transaction, and the vault now holds NVDAc.
30. [ ] Send `/portfolio` and `/status`.
    - Group: about 2 USDC of pool value (1 USDC plus the NVDAc at feed price) and the NVDAc portfolio asset.
31. [ ] Optional expiry check: create a second proposal for `0.5`, vote with one member only, and wait 30 minutes.
    - App: the card shows "expired" with "Voting closed before this buy was executed", and no vote or execute buttons.

## 6. Withdrawals

32. [ ] As A, open Withdraw with "Auto → USDC" selected and tap "Withdraw 1 units (auto)".
    - App: "Withdrawing…", then "No units yet" without a manual refresh, and A's wallet balance rises by about 1 USDC.
    - Group: "↩️ 0x62f5…8784 withdrew 1 units as … USDC".
33. [ ] As B, select "Raw NVDAc" and tap withdraw.
    - B clears the NVDAc receiver policy (policy 5, checked on 2026-11-07), so this should succeed.
    - App: "No units yet" afterwards, and B's wallet holds about 0.0026 NVDAc plus about 0.5 USDC.
    - Group: "↩️ 0xcDdb…Cb7f withdrew 1 units: … USDC + … in stock".
    - If the app instead says "Your wallet does not clear the Coinbase receiver policy…", B's policy status changed; withdraw with "Auto → USDC" and note it.
34. [ ] Send `/status`.
    - Group: pool value 0 and total units 0.
    - Basescan: the vault holds no USDC and no stock.

## 7. Error handling

These are worth checking whenever they come up naturally; none needs extra money.

35. [ ] Reject a transaction in the wallet at any step.
    - App: the error shows on that card in red, the button becomes usable again, and nothing is stuck spinning.
36. [ ] If an execution fails with "The market price is more than 5% worse than the Chainlink price", note the time.
    - That is the price floor working; wait a few minutes and retry.
37. [ ] If any read shows "awaiting price feed" or a deposit fails with "The stock price feed is stale", note the time and day.
    - That is expected outside market updates and should clear when the feed updates.

## Results

| Section | Pass | Notes |
| --- | --- | --- |
| 1. Group setup | | |
| 2. Invites | | |
| 3. Joining | | |
| 4. Deposits | | |
| 5. Proposal, votes, execution | | |
| 6. Withdrawals | | |
| 7. Error handling | | |

## After the test

- The vault should end empty, with A and B still members, so the circle is ready for real use.
- Invite the real members from the Circle membership card, or have them send `/invite <wallet>` in the group.
- Close joining only when the circle is complete.
