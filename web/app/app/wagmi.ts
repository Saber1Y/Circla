import { createConfig, http } from "wagmi";
import { base } from "wagmi/chains";
import { coinbaseWallet } from "wagmi/connectors/coinbaseWallet";
import { injected } from "wagmi/connectors/injected";
import { walletConnect } from "wagmi/connectors/walletConnect";

const projectId =
  process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID?.trim() ?? "";

export const wagmiConfig = createConfig({
  chains: [base],
  connectors: [
    // Browser-installed wallet (MetaMask, etc.) via the injected provider.
    injected(),
    coinbaseWallet({
      appName: "Circla",
      preference: { options: "all" },
    }),
    // Optional: only wired when a WalletConnect Cloud Project ID is configured.
    // Works inside Telegram's WebView via QR pairing (no popup / window.opener).
    ...(projectId
      ? [
          walletConnect({
            projectId,
            showQrModal: false,
            metadata: {
              name: "Circla",
              description: "Collective investing circles on Base",
              url: "https://circlabasebot.vercel.app",
              icons: ["https://circlabasebot.vercel.app/icon.svg"],
            },
          }),
        ]
      : []),
  ],
  transports: {
    [base.id]: http(
      process.env.NEXT_PUBLIC_BASE_RPC_URL ?? "https://mainnet.base.org"
    ),
  },
});