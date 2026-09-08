import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));

// Maps a Telegram chat id to the dedicated CirclaVault it governs.
// The default circle (CIRCLA_VAULT_ADDRESS) governs every group unless a
// per-chat override exists in the store file (CIRCLA_CIRCLES_FILE).
// Simple JSON file, no external state dependency.

const DEFAULT_CIRCLES_FILE = join(__dirname, '..', 'data', 'circles.json');

export function createCircleStore({ vaultAddress, circlesFile = process.env.CIRCLA_CIRCLES_FILE ?? DEFAULT_CIRCLES_FILE } = {}) {
  if (!vaultAddress) throw new Error('CIRCLA_VAULT_ADDRESS is not configured');
  const file = circlesFile;

  function readCircles() {
    if (!existsSync(file)) return {};
    try {
      return JSON.parse(readFileSync(file, 'utf8'));
    } catch {
      return {};
    }
  }

  function writeCircles(circles) {
    mkdirSync(dirname(file), { recursive: true });
    writeFileSync(file, JSON.stringify(circles, null, 2) + '\n');
  }

  // getCircle(chatId): returns the vault for a group. Every group is bound to
  // exactly one vault; the default vault is used unless a per-chat override
  // was mapped. The mapping is persistent so restarts never re-bind a group.
  function getCircle(chatId) {
    const circles = readCircles();
    return {
      chatId: String(chatId),
      vault: circles[String(chatId)]?.vault ?? vaultAddress,
      isDefault: !(circles[String(chatId)]?.vault),
    };
  }

  // mapCircle(chatId, vault): bind a group to a specific vault.
  function mapCircle(chatId, vault) {
    const circles = readCircles();
    circles[String(chatId)] = { vault, boundAt: new Date().toISOString() };
    writeCircles(circles);
    return getCircle(chatId);
  }

  // listCircles(): every chat currently bound to a vault. Used at startup to
  // restore the onchain watchers for all groups, and by /start_syndicate to
  // avoid double-starting.
  function listCircles() {
    const circles = readCircles();
    return Object.entries(circles).map(([chatId, entry]) => ({
      chatId,
      vault: entry.vault,
      isDefault: false,
    }));
  }

  return { getCircle, mapCircle, listCircles };
}