# agents.md

Best practices for AI agents working on this repository.

## Before You Start

Read [CLAUDE.md](./CLAUDE.md) first — it contains project-specific context and ground rules.

## Agent Best Practices

### 1. Understand Before Acting

- **Read the task carefully**: What's the actual ask? Avoid assumptions.
- **Explore the codebase**: Locate relevant files. Don't guess at structure.
- **Check existing patterns**: How do components, routes, or styles work in this project? Match that style.
- **Ask clarifying questions**: If requirements are vague, ask rather than guess.

### 2. Work Incrementally

- **One thing at a time**: Solve one problem, verify it works, then move to the next.
- **Test frequently**: Don't batch multiple changes and test once at the end.
- **Small commits**: Atomic, well-described commits make it easy to understand and revert changes.

### 3. Verification Matters

For **UI/frontend changes**, this means:
1. Run `npm run dev`
2. Open http://localhost:5173 in a browser
3. Navigate to the affected feature
4. Test the golden path (happy case)
5. Test edge cases (empty states, errors, boundaries)
6. Check for console errors
7. Verify other features still work (no regressions)

For **code changes**, this means:
1. Run `npm run lint` (ESLint must pass)
2. Read the changed code — does it make sense?
3. Trace through it mentally — any logic bugs?
4. If tests exist, run them

**Do not skip verification.** Code review and tests are safety nets, not replacements.

### 4. Communication

- **Be explicit about state changes**: If you edit a file, say which file and what changed.
- **Report blockers early**: If something doesn't make sense or is blocking progress, speak up.
- **Confirm assumptions**: If you think you understand the task, restate it.
- **Update the user on progress**: Periodic updates help catch misunderstandings early.

### 5. Error Handling

- **Understand error messages**: Don't dismiss build errors or lint warnings. Fix the root cause.
- **Diagnose before retrying**: If a command fails, understand why before trying again.
- **Leave no console errors**: `console.error`, `console.warn` in production builds are a smell.

## Common Patterns in This Project

### React Components

```jsx
export default function MyComponent({ prop1, prop2 }) {
  return (
    <div>
      {prop1 && <p>{prop1}</p>}
      {prop2 && <p>{prop2}</p>}
    </div>
  );
}
```

**Pattern**: 
- Functional components (no class components)
- Props destructured in the function signature
- Explicit return JSX
- Conditional rendering with `&&` for simple cases

### Routing

Routes are defined in `src/App.jsx`. Each route typically maps to a page component in `src/pages/`.

```jsx
<Route path="/my-page" element={<MyPage />} />
```

### Styling

- Global styles in `src/index.css`
- Component-scoped styles via `className` or inline `style` (keep it minimal)
- No CSS-in-JS libraries; prefer plain CSS

### Naming Conventions

| Type | Pattern | Example |
|------|---------|---------|
| Components | PascalCase | `MyComponent.jsx` |
| Pages | PascalCase | `ProjectDetail.jsx` |
| Variables/functions | camelCase | `const myVar = ...` |
| CSS classes | kebab-case | `.my-section` |
| Routes | kebab-case | `/project-detail` |

## How to Debug

### Issue: Component not rendering
1. Check the route is correct in `App.jsx`
2. Verify the component file exists at the path
3. Check props are passed correctly
4. Look for console errors

### Issue: Styles not applying
1. Check the class name is spelled correctly
2. Verify CSS rule exists in `index.css` (or component stylesheet)
3. Check CSS specificity (inline styles override classes)
4. Inspect element in DevTools to see applied styles

### Issue: ESLint errors
1. Read the error message carefully
2. Most are auto-fixable: run the linter with `--fix` flag (usually `npx eslint . --fix`)
3. If not auto-fixable, understand the rule and refactor the code

### Issue: Build fails
1. Read the full error message
2. Check the affected file exists and has valid syntax
3. Verify dependencies are installed (`npm install`)
4. Try `npm run build` to see the actual error

## What to Do Before Committing

- [ ] Feature works as described (tested in browser)
- [ ] No console errors
- [ ] ESLint passes: `npm run lint`
- [ ] Commit message is clear and semantic
- [ ] Related features still work (no regressions)
- [ ] Code follows project conventions

## When to Escalate

- **Ambiguous requirements**: Ask the user for clarification.
- **Architecture questions**: Suggest an approach and wait for feedback.
- **Browser compatibility**: If a feature doesn't work on a specific browser, flag it.
- **Performance concerns**: If a change causes noticeable slowdown, discuss with the user.
- **Deployment/CI issues**: Beyond the scope of local development — ask the user.

## Workflow Summary

1. **Understand** the task and existing code
2. **Plan** the smallest change that solves the problem
3. **Implement** with incremental commits
4. **Verify** manually in the browser
5. **Lint** and fix any issues
6. **Commit** with a clear message
7. **Report** completion and any edge cases discovered

## Remember

- Clarity > cleverness
- Simple > sophisticated
- Tested > untested
- Small changes > big refactors (unless requested)
- Ask > assume
