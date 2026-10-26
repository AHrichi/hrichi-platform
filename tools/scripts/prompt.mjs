// Terminal prompts for the setup scripts. Hidden prompts switch the terminal
// to raw mode, so a typed or pasted secret is never echoed: not on screen and
// not in the terminal's scrollback.
import { createInterface } from 'node:readline';

// Bracketed-paste markers and other escape sequences a terminal may send.
const escapeSequence = /\x1b\[[0-9;?]*[~A-Za-z]/g;

/**
 * Applies one chunk of raw terminal input to `value`. Returns the new value
 * and whether Enter (done) or Ctrl+C (cancelled) ended the input.
 */
export function applyKeys(value, chunk) {
  for (const char of chunk.replace(escapeSequence, '')) {
    if (char === '\r' || char === '\n') return { value, done: true };
    if (char === '\u0003') return { value, cancelled: true };
    if (char === '\u007f' || char === '\b') {
      value = value.slice(0, -1);
    } else if (char >= ' ') {
      value += char;
    }
  }
  return { value };
}

function askHidden(question) {
  const { stdin, stdout } = process;
  stdout.write(question);
  stdin.setRawMode(true);
  stdin.setEncoding('utf8');
  stdin.resume();
  return new Promise((resolve) => {
    let value = '';
    const onData = (chunk) => {
      const result = applyKeys(value, chunk);
      value = result.value;
      if (result.done || result.cancelled) {
        stdin.off('data', onData);
        stdin.setRawMode(false);
        stdin.pause();
        stdout.write('\n');
        if (result.cancelled) process.exit(130);
        resolve(value.trim());
      }
    };
    stdin.on('data', onData);
  });
}

function askVisible(question) {
  const rl = createInterface({ input: process.stdin, output: process.stdout });
  return new Promise((resolve) =>
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer.trim());
    }),
  );
}

/** Asks a question; `hidden` keeps the answer off the screen entirely. */
export function ask(question, { hidden = false } = {}) {
  if (hidden && !process.stdin.isTTY) {
    throw new Error('A hidden prompt needs an interactive terminal.');
  }
  return hidden ? askHidden(question) : askVisible(question);
}
