import {createPublicClient, createWalletClient, custom, formatUnits, http, parseUnits} from 'viem';
import {base, baseSepolia} from 'viem/chains';
import './styles.css';

const ZERO = '0x0000000000000000000000000000000000000000';
const VAULT = import.meta.env.VITE_CIRCLA_VAULT_ADDRESS;
const USDC = import.meta.env.VITE_CIRCLA_USDC_ADDRESS ?? '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913';
const STOCK = import.meta.env.VITE_CIRCLA_STOCK_ADDRESS ?? '0xb20000000000000000000078ee7ce2fE4908108C';
const ROUTER = import.meta.env.VITE_CIRCLA_ROUTER_ADDRESS;
const FACTORY = import.meta.env.VITE_CIRCLA_AERODROME_FACTORY_ADDRESS;

const vaultAbi = [
  {type: 'function', name: 'join', stateMutability: 'nonpayable', inputs: [], outputs: []},
  {type: 'function', name: 'deposit', stateMutability: 'nonpayable', inputs: [{name: 'amount', type: 'uint256'}], outputs: []},
  {type: 'function', name: 'circleName', stateMutability: 'view', inputs: [], outputs: [{type: 'string'}]},
  {type: 'function', name: 'poolValue', stateMutability: 'view', inputs: [], outputs: [{type: 'uint256'}]},
  {type: 'function', name: 'members', stateMutability: 'view', inputs: [], outputs: [{type: 'address[]'}]},
  {type: 'function', name: 'portfolioAsset', stateMutability: 'view', inputs: [], outputs: [{type: 'address'}]},
  {type: 'function', name: 'adjustedAssetBalance', stateMutability: 'view', inputs: [], outputs: [{type: 'uint256'}]},
  {type: 'function', name: 'createProposal', stateMutability: 'nonpayable', inputs: [{name: 'asset', type: 'address'}, {name: 'router', type: 'address'}, {name: 'amountIn', type: 'uint256'}, {name: 'minAmountOut', type: 'uint256'}], outputs: [{type: 'uint256'}]},
  {type: 'function', name: 'vote', stateMutability: 'nonpayable', inputs: [{name: 'proposalId', type: 'uint256'}, {name: 'support', type: 'bool'}], outputs: []},
  {type: 'function', name: 'executeProposal', stateMutability: 'nonpayable', inputs: [{name: 'router', type: 'address'}, {name: 'proposalId', type: 'uint256'}, {name: 'routes', type: 'tuple[]', components: [{name: 'from', type: 'address'}, {name: 'to', type: 'address'}, {name: 'stable', type: 'bool'}, {name: 'factory', type: 'address'}]}], outputs: [{type: 'uint256'}]},
  {type: 'function', name: 'withdraw', stateMutability: 'nonpayable', inputs: [{name: 'units', type: 'uint256'}, {name: 'recipient', type: 'address'}], outputs: [{type: 'uint256'}, {type: 'uint256'}]},
];

const erc20Abi = [{type: 'function', name: 'approve', stateMutability: 'nonpayable', inputs: [{name: 'spender', type: 'address'}, {name: 'amount', type: 'uint256'}], outputs: [{type: 'bool'}]}];
const routerAbi = [{type: 'function', name: 'getAmountsOut', stateMutability: 'view', inputs: [{name: 'amountIn', type: 'uint256'}, {name: 'routes', type: 'tuple[]', components: [{name: 'from', type: 'address'}, {name: 'to', type: 'address'}, {name: 'stable', type: 'bool'}, {name: 'factory', type: 'address'}]}], outputs: [{name: 'amounts', type: 'uint256[]'}]}];

const chain = (import.meta.env.VITE_BASE_RPC_URL ?? '').includes('sepolia') ? baseSepolia : base;
const publicClient = createPublicClient({chain, transport: http(import.meta.env.VITE_BASE_RPC_URL ?? 'https://mainnet.base.org')});
let walletClient;
let account;

document.querySelector('#app').innerHTML = `
  <main class="shell">
    <header class="topbar">
      <a class="brand" href="/">CIRCLA<span>/BASE</span></a>
      <button id="connect" class="button primary">Connect wallet</button>
    </header>
    <section class="hero">
      <p class="eyebrow">PRIVATE INVESTMENT CIRCLES ON BASE</p>
      <h1>Make the group decision.<br><em>Own the outcome.</em></h1>
      <p class="lede">CIRCLA turns Telegram votes into transparent, policy-bound ownership of Coinbase Tokenized Stocks.</p>
      <div class="status"><span id="networkDot" class="dot"></span><span id="walletLabel">Wallet not connected</span><span class="status-separator">/</span><span>Base mainnet</span></div>
    </section>
    <section class="grid">
      <article class="panel wide">
        <div class="panel-head"><div><p class="eyebrow">LIVE CIRCLE</p><h2 id="circleName">Connect to load vault</h2></div><span class="tag">B20 EQUITY</span></div>
        <div class="metrics"><div><span>POOL VALUE</span><strong id="poolValue">--</strong></div><div><span>MEMBERS</span><strong id="memberCount">--</strong></div><div><span>ASSET BALANCE</span><strong id="assetBalance">--</strong></div></div>
        <div class="action-row"><button id="join" class="button secondary">Join circle</button><button id="refresh" class="button secondary">Refresh vault</button></div>
      </article>
      <article class="panel">
        <p class="eyebrow">CONTRIBUTE</p><h2>Add to the pool</h2><p class="muted">Approve Base USDC, then deposit it into the circle vault.</p>
        <div class="field"><label for="depositAmount">USDC amount</label><input id="depositAmount" value="50" inputmode="decimal" /></div>
        <button id="deposit" class="button primary full">Approve and deposit</button>
      </article>
      <article class="panel wide">
        <div class="panel-head"><div><p class="eyebrow">TOKENIZED STOCK ORDER</p><h2>Propose and execute a buy</h2></div><span class="tag">AERODROME ROUTE</span></div>
        <p class="muted">The quote is read from the configured Aerodrome router. The proposal stores the router, asset, amount, and minimum output before anyone votes.</p>
        <div class="order-grid"><div class="field"><label for="orderAmount">USDC amount</label><input id="orderAmount" value="100" inputmode="decimal" /></div><div class="field"><label for="slippage">Slippage (bps)</label><input id="slippage" value="100" inputmode="numeric" /></div><div class="field"><label for="orderId">Proposal ID</label><input id="orderId" placeholder="created after proposal" inputmode="numeric" /></div></div>
        <div class="action-row"><button id="quoteOrder" class="button secondary">Quote and create proposal</button><button id="executeOrder" class="button primary">Execute approved proposal</button></div>
        <p id="quoteResult" class="quote-result"></p>
      </article>
      <article class="panel">
        <p class="eyebrow">GOVERNANCE</p><h2>Vote on a proposal</h2><p class="muted">Use the proposal ID posted by CIRCLA in Telegram.</p>
        <div class="field"><label for="proposalId">Proposal ID</label><input id="proposalId" value="1" inputmode="numeric" /></div>
        <div class="action-row"><button id="voteYes" class="button primary">Vote yes</button><button id="voteNo" class="button secondary">Vote no</button></div>
      </article>
      <article class="panel wide">
        <div class="panel-head"><div><p class="eyebrow">WITHDRAWAL</p><h2>Exit with a wallet check</h2></div><span class="tag neutral">ELIGIBILITY AWARE</span></div>
        <p class="muted">Direct B20 delivery requires an authorized recipient. The vault also supports a guarded USDC liquidation path for blocked recipients.</p>
        <div class="withdraw-grid"><div class="field"><label for="units">Claim units</label><input id="units" value="0" inputmode="decimal" /></div><div class="field"><label for="recipient">Recipient</label><input id="recipient" placeholder="0x..." /></div><button id="withdraw" class="button secondary">Withdraw B20</button></div>
      </article>
    </section>
    <footer><span>Coinbase Tokenized Stocks are available only to eligible users in permitted non-US jurisdictions.</span><span id="activity">No wallet activity yet.</span></footer>
  </main>`;

const $ = (id) => document.querySelector(`#${id}`);
const setActivity = (text, error = false) => { $('activity').textContent = text; $('activity').className = error ? 'error' : ''; };

$('connect').addEventListener('click', connect);
$('refresh').addEventListener('click', refresh);
$('join').addEventListener('click', () => send('join', []));
$('deposit').addEventListener('click', deposit);
$('voteYes').addEventListener('click', () => vote(true));
$('voteNo').addEventListener('click', () => vote(false));
$('withdraw').addEventListener('click', withdraw);
$('quoteOrder').addEventListener('click', createProposal);
$('executeOrder').addEventListener('click', executeProposal);

async function connect() {
  if (!window.ethereum) return setActivity('Install a Base-compatible wallet to continue.', true);
  walletClient = createWalletClient({chain, transport: custom(window.ethereum)});
  [account] = await walletClient.requestAddresses();
  await walletClient.switchChain({id: chain.id});
  $('connect').textContent = `${account.slice(0, 6)}...${account.slice(-4)}`;
  $('walletLabel').textContent = `${account.slice(0, 6)}...${account.slice(-4)} connected`;
  $('networkDot').classList.add('active');
  await refresh();
}

async function refresh() {
  if (!VAULT || VAULT === ZERO || !VAULT.startsWith('0x')) return setActivity('Set VITE_CIRCLA_VAULT_ADDRESS to read the deployed vault.', true);
  try {
    const results = await publicClient.multicall({contracts: [
      {address: VAULT, abi: vaultAbi, functionName: 'circleName'},
      {address: VAULT, abi: vaultAbi, functionName: 'poolValue'},
      {address: VAULT, abi: vaultAbi, functionName: 'members'},
      {address: VAULT, abi: vaultAbi, functionName: 'portfolioAsset'},
      {address: VAULT, abi: vaultAbi, functionName: 'adjustedAssetBalance'},
    ]});
    const values = results.map((result) => result.status === 'success' ? result.result : null);
    if (values.some((value) => value === null)) throw new Error('one or more vault reads failed');
    $('circleName').textContent = values[0];
    $('poolValue').textContent = `${formatUnits(values[1], 6)} USDC`;
    $('memberCount').textContent = values[2].length;
    $('assetBalance').textContent = values[3] === ZERO ? 'No stock yet' : `${formatUnits(values[4], 8)} adjusted units`;
    setActivity(`Vault refreshed from Base at ${new Date().toLocaleTimeString()}.`);
  } catch (error) { setActivity(`Vault read failed: ${error.shortMessage ?? error.message}`, true); }
}

async function deposit() {
  requireWallet();
  const amount = parseUnits($('depositAmount').value, 6);
  await send('approve', [VAULT, amount], USDC);
  await send('deposit', [amount]);
}

async function vote(support) {
  requireWallet();
  await send('vote', [BigInt($('proposalId').value), support]);
}

async function withdraw() {
  requireWallet();
  const recipient = $('recipient').value || account;
  await send('withdraw', [BigInt($('units').value), recipient]);
}

async function createProposal() {
  requireWallet();
  requireTradingConfig();
  const amountIn = parseUnits($('orderAmount').value, 6);
  const routes = [route(USDC, STOCK)];
  try {
    const amounts = await publicClient.readContract({address: ROUTER, abi: routerAbi, functionName: 'getAmountsOut', args: [amountIn, routes]});
    const quotedOut = amounts[amounts.length - 1];
    const slippageBps = BigInt($('slippage').value);
    if (slippageBps < 0n || slippageBps >= 10_000n) throw new Error('slippage must be less than 10000 bps');
    const minAmountOut = quotedOut * (10_000n - slippageBps) / 10_000n;
    $('quoteResult').textContent = `Quote: ${formatUnits(quotedOut, 8)} NVDAc. Minimum output: ${formatUnits(minAmountOut, 8)} NVDAc. Creating proposal...`;
    const receipt = await send('createProposal', [STOCK, ROUTER, amountIn, minAmountOut]);
    const logs = receipt.logs ?? [];
    const proposalLog = logs.find((log) => log.address?.toLowerCase() === VAULT.toLowerCase() && log.topics?.length > 1);
    if (proposalLog) {
      const proposalId = BigInt(proposalLog.topics[1]).toString();
      $('proposalId').value = proposalId;
      $('orderId').value = proposalId;
      $('quoteResult').textContent = `Proposal #${proposalId} created. Ask the circle to vote in Telegram.`;
    }
  } catch (error) { setActivity(`Proposal creation failed: ${error.shortMessage ?? error.message}`, true); }
}

async function executeProposal() {
  requireWallet();
  requireTradingConfig();
  const proposalId = $('orderId').value || $('proposalId').value;
  if (!proposalId) throw new Error('Enter a proposal ID first.');
  await send('executeProposal', [ROUTER, BigInt(proposalId), [route(USDC, STOCK)]]);
}

async function send(functionName, args, address = VAULT) {
  requireWallet();
  try {
    const hash = await walletClient.writeContract({address, abi: address === USDC ? erc20Abi : vaultAbi, functionName, args, account, chain});
    setActivity(`Submitted ${functionName}. Waiting for confirmation...`);
    const receipt = await publicClient.waitForTransactionReceipt({hash});
    setActivity(`${functionName} confirmed: ${hash}`);
    await refresh();
    return receipt;
  } catch (error) { setActivity(`${functionName} failed: ${error.shortMessage ?? error.message}`, true); throw error; }
}

function requireWallet() {
  if (!walletClient || !account) throw new Error('Connect a wallet first.');
  if (!VAULT || VAULT === ZERO) throw new Error('Configure the deployed CIRCLA vault first.');
}

function requireTradingConfig() {
  if (!ROUTER || ROUTER === ZERO || !FACTORY || FACTORY === ZERO) throw new Error('Configure the Aerodrome router and factory first.');
}

function route(from, to) {
  return {from, to, stable: false, factory: FACTORY};
}
