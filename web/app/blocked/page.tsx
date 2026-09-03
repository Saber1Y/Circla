export default function Blocked() {
  return (
    <main className="mx-auto flex min-h-[70vh] max-w-[640px] flex-col items-center justify-center px-7 py-16 text-center">
      <div className="rounded-full border border-blue-200 bg-blue-50 px-4 py-1.5 text-xs font-bold uppercase tracking-wide text-[#0052FF]">
        Compliance Notice
      </div>
      <h1 className="mt-6 font-[var(--font-newsreader)] text-[32px] font-medium leading-tight tracking-tight text-[#101114]">
        Not available in your region.
      </h1>
      <p className="mt-3 max-w-[520px] font-[var(--font-sora)] text-[15px] leading-relaxed text-[#77736c]">
        CIRCLA interacts with Coinbase Tokenized Stocks on Base, available only to eligible users in permitted
        non-US jurisdictions. US IP addresses are blocked per Base hackathon rules.
      </p>
      <p className="mt-4 text-xs text-[#918d85]">
        Judges testing from the US: use the recorded Loom demo or contact the team. Contracts remain verifiable on
        Basescan.
      </p>
    </main>
  );
}
