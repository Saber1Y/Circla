const COMMANDS = new Set(['start', 'status', 'portfolio', 'withdraw', 'help']);

export function parseIntent(input) {
  const text = String(input ?? '').trim();
  if (!text) return {type: 'unknown', raw: text, reason: 'empty message'};

  const normalized = text.replace(/\s+/g, ' ');
  const command = normalized.match(/^\/(\w+)(?:\s+(.*))?$/);
  if (command) return parseCommand(command[1].toLowerCase(), command[2] ?? '', normalized);

  const purchase = normalized.match(/^buy\s+([0-9]+(?:\.[0-9]+)?)\s+USDC\s+of\s+([A-Za-z0-9]+)$/i);
  if (purchase) {
    return {
      type: 'create_proposal',
      action: 'buy',
      amountUsdc: purchase[1],
      assetSymbol: purchase[2].toUpperCase(),
      raw: normalized,
    };
  }

  return {type: 'unknown', raw: normalized, reason: 'unsupported command'};
}

function parseCommand(name, args, raw) {
  if (COMMANDS.has(name)) return {type: name, raw};
  if (name === 'deposit') {
    if (!/^\d+(?:\.\d+)?$/.test(args)) return {type: 'unknown', raw, reason: 'deposit amount is invalid'};
    return {type: 'deposit', amountUsdc: args, raw};
  }
  if (name === 'vote') {
    const choice = args.toLowerCase();
    if (choice !== 'yes' && choice !== 'no') return {type: 'unknown', raw, reason: 'vote must be yes or no'};
    return {type: 'vote', support: choice === 'yes', raw};
  }
  if (name === 'propose') return parseProposal(args, raw);
  if (name === 'create') return {type: 'create_circle', name: args.trim(), raw};
  if (name === 'invite') return {type: 'invite', raw};
  return {type: 'unknown', raw, reason: `unknown command: ${name}`};
}

function parseProposal(args, raw) {
  const match = args.match(/^buy\s+([0-9]+(?:\.[0-9]+)?)\s+([A-Za-z0-9]+)$/i);
  if (!match) return {type: 'unknown', raw, reason: 'usage: /propose buy <amount> <asset>'};
  return {
    type: 'create_proposal',
    action: 'buy',
    amountUsdc: match[1],
    assetSymbol: match[2].toUpperCase(),
    raw,
  };
}
