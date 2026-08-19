# CLAUDE.md

Working with AI agents on this repository.

## Project Overview

**4H Computer Project Demo Site** — a React + Vite web application showcasing 4H computer projects. Uses React Router for navigation, Vite for build tooling, and ESLint for code quality.

### Tech Stack
- **Frontend**: React 18, React Router 7
- **Build**: Vite 5
- **Dev Tools**: ESLint 9, Node modules
- **Extras**: react-stl-viewer for 3D model display

### Project Structure
```
src/
├── components/        # Reusable UI components
├── pages/            # Page-level components (route targets)
├── App.jsx           # Main app + routing
├── main.jsx          # Entry point
└── index.css         # Global styles
public/              # Static assets
```

## Agent Ground Rules

### ✅ DO

- **Test locally first**: Run `npm run dev` and verify changes in the browser before reporting completion.
- **Read before edit**: Always read a file before making changes; don't assume structure.
- **Follow existing patterns**: Match the code style, naming conventions, and component structure already in place.
- **Prefer small PRs**: Make focused, atomic commits. One feature or fix per commit.
- **Keep components simple**: Avoid over-engineering. A component's job should be obvious from its name and JSX.
- **Use descriptive names**: Component and variable names should be self-documenting.
- **Test the golden path**: For UI changes, verify the happy path works before saying done.

### ❌ DON'T

- **Don't refactor unprompted**: Focus on the requested change. Leave working code alone.
- **Don't add unnecessary abstractions**: Three similar lines of code do not automatically need a shared helper.
- **Don't mock away reality**: Avoid mocking when real components/routes would verify the fix.
- **Don't commit without testing**: Always verify UI changes work in the browser.
- **Don't ignore build warnings**: Fix ESLint errors before committing.
- **Don't leave console errors**: Clean up any `console.error` or `console.warn` from development.

## Commands

```bash
npm run dev      # Start dev server (http://localhost:5173)
npm run build    # Production build
npm run lint     # Run ESLint
npm run preview  # Preview production build locally
```

## Key Files to Know

- **src/App.jsx** — routing and main layout
- **src/main.jsx** — React root and mounting
- **src/index.css** — global styles
- **vite.config.js** — build config (usually doesn't need changes)
- **eslint.config.js** — lint rules

## Common Tasks

### Adding a New Page
1. Create `src/pages/YourPage.jsx`
2. Add a route in `src/App.jsx`
3. Test navigation works
4. Verify page renders

### Adding a Component
1. Create `src/components/YourComponent.jsx`
2. Export as default
3. Use consistent prop names and JSDoc comments if complex
4. Test in context before committing

### Fixing a Bug
1. Reproduce locally with `npm run dev`
2. Identify root cause
3. Fix and verify with a browser refresh
4. Check for related regressions

## Branching & Commits

- Branch from `main` for new work
- Use semantic commit messages: `feat:`, `fix:`, `refactor:`, `chore:`
- One logical change per commit
- Test before committing

## When to Ask for Help

- Unclear requirements or ambiguous UI behavior
- Large architectural changes
- Performance concerns
- Browser compatibility issues
- Deployment or build setup

## Notes

- This is a lightweight project; keep it that way.
- No backend integration required unless explicitly requested.
- Focus on clean, readable code over clever optimizations.
- Component reuse is good; premature abstraction is not.
