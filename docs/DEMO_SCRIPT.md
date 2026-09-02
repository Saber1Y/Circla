# CIRCLA Demo Script

## 1. Demo Goal

Show that a Telegram group can collectively authorize a real Coinbase Tokenized Stock purchase on Base and receive transparent pro-rata ownership records.

Target duration is three minutes.

## 2. Preparation

- Use an eligible non-US demo participant.
- Use a clean private Telegram group.
- Use Base wallets with enough USDC and gas.
- Confirm the selected B20 address against `base.org/stocks`.
- Confirm the selected Aerodrome route.
- Confirm the Chainlink feed is usable.
- Prepare BaseScan links for the final transactions.

## 3. Walkthrough

### Step 1: Create a Circle

Send:

```text
/create Nairobi Tech Circle
```

The bot replies with the circle rules, supported assets, quorum, and eligibility notice.

### Step 2: Invite Members

Send:

```text
/invite
```

Open the generated link with two additional Telegram accounts.

### Step 3: Contribute USDC

Each member sends:

```text
/deposit 50
```

The bot provides a wallet transaction request.

After confirmation it posts:

```text
Contribution confirmed: 50 USDC
Claim units minted: ...
Transaction: https://basescan.org/tx/...
```

### Step 4: Propose a Stock Purchase

Send:

```text
Buy 100 USDC of NVDAc
```

The bot displays the resolved official token address, quote, minimum output, router, expiry, and required votes.

### Step 5: Vote

Members press the inline `Approve` button.

The bot shows progress:

```text
Proposal #1
Votes: 2 of 3 required
Status: ready for execution
```

### Step 6: Execute

The approved executor presses `Execute`.

The vault validates the proposal and sends the swap transaction.

The bot waits for confirmation before reporting success.

### Step 7: Show the Portfolio

Send:

```text
/portfolio
```

The response shows raw B20 balance, adjusted display balance, feed price, total value, pool units, and each member's ownership percentage.

### Step 8: Demonstrate a Guardrail

Attempt one invalid action, such as an unsupported asset or amount above the cap.

The bot shows:

```text
Blocked by vault policy.
Reason: asset is not allowlisted.
Funds moved: 0.
```

### Step 9: Withdraw

Send:

```text
/withdraw
```

The bot reports whether the recipient is eligible for direct B20 delivery or whether the claim will be liquidated to USDC.

## 4. Proof Requirements

The recording MUST show:

- Telegram messages.
- Wallet confirmation.
- Proposal and vote state.
- Real transaction pending state.
- Confirmed BaseScan transaction.
- Live portfolio read.
- A rejected action with zero funds moved.

The video MUST NOT use fake transaction hashes, hardcoded balances, or simulated success screens.
