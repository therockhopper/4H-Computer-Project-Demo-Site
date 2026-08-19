/**
 * Packages each Scratch project into a self-contained HTML file under
 * public/games/, so the games keep working with no connection.
 *
 * The TurboWarp packager embeds the whole .sb3 — code, sprites, costumes,
 * sounds — plus the VM and renderer into one file that makes no network requests
 * at runtime. That is what makes offline play possible at all: a
 * scratch.mit.edu iframe is cross-origin and can never be cached.
 *
 *   npm run package-games            # all games
 *   npm run package-games fly-bat    # just one
 *
 * Re-run when a game changes, then commit the output.
 */
import { mkdirSync, writeFileSync, readFileSync, existsSync, statSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const outDir = join(here, '..', 'public', 'games');

const games = JSON.parse(readFileSync(join(here, 'games.json'), 'utf8'));
const only = process.argv.slice(2);
const selected = only.length ? games.filter((g) => only.includes(g.slug)) : games;

if (!selected.length) {
  console.error(`No matching game. Known slugs: ${games.map((g) => g.slug).join(', ')}`);
  process.exit(1);
}

// Installed on demand rather than kept in package.json: this is an authoring
// tool, run by a maintainer when a game changes. The output is committed, so a
// deploy build has no reason to pull down its ~226 packages.
let Packager;
try {
  const mod = await import('@turbowarp/packager');
  Packager = mod.default ?? mod;
} catch {
  console.error('The packager is not installed. Run:\n');
  console.error('  npm install --no-save @turbowarp/packager\n');
  process.exit(1);
}

mkdirSync(outDir, { recursive: true });

const mb = (n) => `${(n / 1024 / 1024).toFixed(1)} MB`;
let failures = 0;

for (const game of selected) {
  const target = join(outDir, `${game.slug}.html`);
  process.stdout.write(`  ${game.slug.padEnd(26)} `);

  try {
    // trampoline.turbowarp.org issues the token the Scratch project API needs.
    const metaRes = await fetch(`https://trampoline.turbowarp.org/api/projects/${game.id}`);
    if (!metaRes.ok) throw new Error(`metadata HTTP ${metaRes.status}`);
    const meta = await metaRes.json();

    const dataRes = await fetch(
      `https://projects.scratch.mit.edu/${game.id}?token=${meta.project_token}`
    );
    if (!dataRes.ok) throw new Error(`project HTTP ${dataRes.status}`);
    const projectData = await dataRes.arrayBuffer();

    const packager = new Packager.Packager();
    packager.project = await Packager.loadProject(projectData);

    const o = packager.options;
    o.target = 'html'; // single self-contained file
    o.app.windowTitle = `${game.title} — ${game.author}`;
    o.autoplay = false;

    // Cloud variables default to a live WebSocket to clouddata.turbowarp.org.
    // 'local' keeps them working as ordinary variables with no network at all.
    o.cloudVariables.mode = 'local';

    // Visitors need to be able to restart a game they've finished.
    o.controls.greenFlag.enabled = true;
    o.controls.stopAll.enabled = true;
    o.controls.fullscreen.enabled = true;

    const result = await packager.package();
    writeFileSync(target, Buffer.from(result.data));
    console.log(mb(statSync(target).size));
  } catch (err) {
    failures++;
    console.log(`FAILED — ${err.message}`);
    if (existsSync(target)) console.log(`    keeping the existing ${game.slug}.html`);
  }
}

if (failures) {
  console.error(`\n${failures} game(s) failed to package.`);
  process.exit(1);
}

console.log('\nCheck nothing still reaches the network:');
console.log('  npm run check-games');
