# dCity Burn Tool

The city is closing. Recover your SIM.

A simple tool for dCity players to burn their `CITY` NFTs and reclaim the SIM tokens locked inside. The game is winding down — this is your treasury window.

**[Launch the tool →](https://alextrapp.github.io/burnDcity/)**

---

## What it does

- Connects to your Hive account via **Hive Keychain**
- Loads all your CITY NFTs from Hive Engine
- Lets you burn cards individually or in batches of up to 50
- Releases locked SIM directly to your account on burn
- Handles combined cards separately (burning them releases inner cards)

No backend. No server. Runs entirely in your browser against public Hive Engine nodes.

---

## Requirements

**[Hive Keychain](https://hive-keychain.com)** browser extension is required. You'll need your **active key** to sign burn transactions.

---

## How to use

1. Install Hive Keychain if you haven't already
2. Open the tool and enter your Hive username
3. Wait for your cards to load — large collections may take a moment
4. Click any card stack to burn 1–50 at a time, or use the bulk burn panel for everything
5. SIM is credited to your account automatically on each transaction

---

## Running locally

```bash
npm install
npm run dev
```

---

## Notes

- Burns are **irreversible** — cards are gone permanently
- Combined cards release their inner CITY cards when burned; those will appear after a reload
- Transactions are signed locally by Keychain — your keys never leave your browser
