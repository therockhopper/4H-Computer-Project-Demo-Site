import skulptUrl from 'skulpt/dist/skulpt.min.js?url';
import skulptStdlibUrl from 'skulpt/dist/skulpt-stdlib.js?url';

/**
 * Runs the club's Python programs in the browser, on top of Skulpt.
 *
 * Skulpt rather than Pyodide because these programs are driven by `input()`:
 * Skulpt suspends the interpreter and takes a Promise back, so a prompt is just
 * a text field, while blocking stdin under Pyodide would need SharedArrayBuffer
 * and cross-origin isolation across the whole site — for 1 MB instead of 25.
 *
 * Everything Skulpt-specific lives here so the viewer stays plain React.
 */

// Enough to catch a runaway loop before it locks up the kiosk, generous enough
// that no real program here comes close. The clock is restarted every time a
// prompt is answered — it guards computation, not a visitor's typing speed.
const EXEC_LIMIT_MS = 15000;

// Hand the event loop a turn this often so the page stays responsive and Stop
// is honoured even inside a tight loop.
const YIELD_LIMIT_MS = 100;

let loading = null;

function loadScript(src) {
  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = src;
    script.async = false;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error(`Failed to load ${src}`));
    document.head.appendChild(script);
  });
}

/**
 * Injects Skulpt on first use and caches the promise. ~1 MB of interpreter, so
 * it is deliberately not part of the bundle — nothing downloads until a visitor
 * actually presses Run. The stdlib must land after the interpreter: it assigns
 * `Sk.builtinFiles`.
 */
export function loadSkulpt() {
  if (!loading) {
    loading = loadScript(skulptUrl)
      .then(() => loadScript(skulptStdlibUrl))
      .then(() => window.Sk);
  }
  return loading;
}

// Sk is a singleton — `Sk.configure` is global state, so two programs cannot be
// in flight at once. Starting one stops the other, which with a couple of cards
// on the page is friendlier than greying out every other Run button.
let active = null;

function describeError(Sk, err) {
  if (err instanceof Sk.builtin.BaseException) return err.toString();
  return err?.message || String(err);
}

/**
 * Runs `source`, resolving once the program ends.
 *
 * @param {string} source Python source.
 * @param {(text: string) => void} onOutput Called with each chunk the program prints.
 * @param {(prompt: string) => Promise<string>} onInput Called when the program
 *   reaches `input()`; resolve with what the visitor typed.
 * @returns {Promise<{done: Promise<{status: string, error?: string}>, stop: () => void}>}
 */
export async function runProgram({ source, onOutput, onInput }) {
  const Sk = await loadSkulpt();
  stopActive();

  const run = { stopped: false, rejectInput: null };
  active = run;

  Sk.configure({
    output: onOutput,
    read: (filename) => {
      const file = Sk.builtinFiles?.files[filename];
      if (file === undefined) throw new Error(`File not found: '${filename}'`);
      return file;
    },
    inputfun: (prompt) =>
      new Promise((resolve, reject) => {
        run.rejectInput = reject;
        Promise.resolve(onInput(prompt || '')).then((value) => {
          run.rejectInput = null;
          // Restart the exec clock: the seconds spent waiting for a person are
          // not the runaway-loop budget.
          Sk.execStart = Date.now();
          Sk.lastYield = Date.now();
          resolve(value);
        }, reject);
      }),
    inputfunTakesPrompt: true,
    __future__: Sk.python3,
    execLimit: EXEC_LIMIT_MS,
    yieldLimit: YIELD_LIMIT_MS,
  });

  const done = Sk.misceval
    .asyncToPromise(
      // canSuspend: true — without it `input()` cannot suspend the interpreter.
      () => Sk.importMainWithBody('<stdin>', false, source.replace(/\r\n/g, '\n'), true),
      {
        // Runs at every suspension, including the yields above, so Stop takes
        // effect mid-program. Returning null means "handle this normally".
        '*': () => {
          if (run.stopped) throw new Sk.builtin.KeyboardInterrupt('stopped');
          return null;
        },
      },
    )
    .then(
      () => ({ status: 'finished' }),
      (err) =>
        run.stopped
          ? { status: 'stopped' }
          : { status: 'error', error: describeError(Sk, err) },
    )
    .finally(() => {
      if (active === run) active = null;
    });

  return {
    done,
    stop: () => {
      run.stopped = true;
      // If the program is parked on a prompt there is no suspension coming to
      // trip the handler above — reject the pending input instead.
      run.rejectInput?.(new Error('stopped'));
      run.rejectInput = null;
    },
  };
}

function stopActive() {
  if (!active) return;
  active.stopped = true;
  active.rejectInput?.(new Error('stopped'));
  active.rejectInput = null;
  active = null;
}
