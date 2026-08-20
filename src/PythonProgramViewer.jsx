import { useCallback, useEffect, useRef, useState } from 'react';
import hljs from 'highlight.js/lib/core';
import python from 'highlight.js/lib/languages/python';
import { runProgram } from './python/runner';

hljs.registerLanguage('python', python);

/**
 * Shows one of the club's Python programs: its source, syntax highlighted, and
 * a terminal that actually runs it. Token colours live in App.css rather than a
 * highlight.js theme so the code sits in the site's palette.
 */
const PythonProgramViewer = ({ sourcePath, title, author }) => {
  const [source, setSource] = useState(null);
  const [loadError, setLoadError] = useState(false);
  const [showOutput, setShowOutput] = useState(false);
  const [entries, setEntries] = useState([]);
  const [running, setRunning] = useState(false);
  const [awaitingInput, setAwaitingInput] = useState(false);
  const [draft, setDraft] = useState('');

  const handleRef = useRef(null);
  const resolveInputRef = useRef(null);
  const terminalRef = useRef(null);
  const promptRef = useRef(null);

  // A plain fetch, not assetUrl(): these are ~1 KB and precached by Workbox,
  // which does its own revisioning. The offline manifest is for the heavy
  // runtime-cached assets only.
  useEffect(() => {
    let alive = true;
    fetch(sourcePath)
      .then((r) => (r.ok ? r.text() : Promise.reject(new Error(r.status))))
      .then((text) => alive && setSource(text.replace(/\r\n/g, '\n')))
      .catch(() => alive && setLoadError(true));
    return () => {
      alive = false;
    };
  }, [sourcePath]);

  // Stop the interpreter if the visitor navigates away mid-program.
  useEffect(() => () => handleRef.current?.stop(), []);

  useEffect(() => {
    if (terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
    }
  }, [entries, awaitingInput]);

  useEffect(() => {
    if (awaitingInput) promptRef.current?.focus();
  }, [awaitingInput]);

  // print() arrives in fragments, so consecutive output folds into one block —
  // the newlines are already in the text.
  const append = useCallback((kind, text) => {
    setEntries((prev) => {
      const last = prev[prev.length - 1];
      if (kind === 'out' && last?.kind === 'out') {
        return [...prev.slice(0, -1), { kind, text: last.text + text }];
      }
      return [...prev, { kind, text }];
    });
  }, []);

  const handleRun = useCallback(async () => {
    if (!source) return;
    handleRef.current?.stop();
    setEntries([]);
    setShowOutput(true);
    setRunning(true);
    setAwaitingInput(false);
    setDraft('');

    const handle = await runProgram({
      source,
      onOutput: (text) => append('out', text),
      onInput: (prompt) => {
        if (prompt) append('out', prompt);
        setAwaitingInput(true);
        return new Promise((resolve) => {
          resolveInputRef.current = resolve;
        });
      },
    });
    handleRef.current = handle;

    const result = await handle.done;
    resolveInputRef.current = null;
    setAwaitingInput(false);
    setRunning(false);
    if (result.status === 'error') append('error', result.error);
    append('note', result.status === 'stopped' ? '— stopped —' : '— program finished —');
  }, [append, source]);

  const handleStop = useCallback(() => handleRef.current?.stop(), []);

  const submitInput = useCallback(
    (event) => {
      event.preventDefault();
      const resolve = resolveInputRef.current;
      if (!resolve) return;
      resolveInputRef.current = null;
      setAwaitingInput(false);
      append('in', draft);
      setDraft('');
      resolve(draft);
    },
    [append, draft],
  );

  return (
    <div className="model-card">
      <div className="card-body python-body">
        <span className="card-type">Python Program</span>

        {showOutput ? (
          <div className="python-terminal" ref={terminalRef}>
            {entries.map((entry, index) => (
              <span key={index} className={`python-line python-${entry.kind}`}>
                {entry.kind === 'in' ? `> ${entry.text}\n` : entry.text}
                {entry.kind === 'note' || entry.kind === 'error' ? '\n' : ''}
              </span>
            ))}
            {awaitingInput && (
              <form className="python-prompt" onSubmit={submitInput}>
                <span aria-hidden="true">&gt;&nbsp;</span>
                <input
                  ref={promptRef}
                  value={draft}
                  onChange={(event) => setDraft(event.target.value)}
                  aria-label={`Input for ${title}`}
                  autoComplete="off"
                />
              </form>
            )}
          </div>
        ) : (
          <pre className="python-source">
            {source ? (
              <code
                className="hljs language-python"
                dangerouslySetInnerHTML={{
                  __html: hljs.highlight(source, { language: 'python' }).value,
                }}
              />
            ) : (
              <code>{loadError ? 'Could not load this program.' : 'Loading…'}</code>
            )}
          </pre>
        )}
      </div>

      <div className="python-controls">
        {running ? (
          <button type="button" className="python-button stop" onClick={handleStop}>
            ■ Stop
          </button>
        ) : (
          <button
            type="button"
            className="python-button run"
            onClick={handleRun}
            disabled={!source}
          >
            ▶ Run
          </button>
        )}
        <button
          type="button"
          className="python-button ghost"
          onClick={() => setShowOutput((prev) => !prev)}
          disabled={!source}
        >
          {showOutput ? 'Source' : 'Output'}
        </button>
      </div>

      <div className="card-info">
        <div className="card-name">{title}</div>
        <div className="card-author">{author}</div>
      </div>
    </div>
  );
};

export default PythonProgramViewer;
