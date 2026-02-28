# Launch Branches Script Analysis

## Issues Identified

### 1. **The `--strictPort` Flag (Line 44)** - PRIMARY ISSUE
The script uses `--strictPort` which tells Vite to fail if the specified port is already in use, rather than automatically selecting the next available port.

```bash
npm run dev -- --host --port "$TARGET_PORT" --strictPort
```

**Problem**: If any port is already in use (e.g., port 3001), Vite will exit with an error instead of automatically trying the next port.

**Fix**: Remove `--strictPort` to allow Vite to automatically select an available port.

---

### 2. **Silent npm install Hides Errors (Line 37)**
```bash
npm install --no-fund --no-audit > /dev/null 2>&1
```

**Problem**: All output is suppressed, including errors. If npm install fails, the script continues silently.

**Fix**: Show npm install output or at least capture and display errors.

---

### 3. **Hardcoded Port in vite.config.js**
```javascript
// frontend/vite.config.js line 54-57
server: {
  port: 3000,
  open: true
}
```

**Problem**: While CLI arguments override this, the `open: true` might cause Vite to attempt opening a browser automatically, conflicting with the script's `open_url` function.

**Fix**: Remove or comment out `open: true` in vite.config.js to let the script control browser opening.

---

### 4. **No Worktree Detection Verification**
The script relies on `git worktree list --porcelain` but doesn't verify if any worktrees exist before proceeding.

**Problem**: If no worktrees exist, the script silently does nothing.

**Fix**: Add a check to verify worktrees were found.

---

### 5. **Background Process Handling**
The script uses `&` to run processes in the background, which should work in Git Bash, but npm/node processes might have issues.

---

## Recommended Fixes

### Fix 1: Remove `--strictPort` from the npm run dev command

Change line 44 from:
```bash
(cd "$FRONTEND_PATH" && npm run dev -- --host --port "$TARGET_PORT" --strictPort) &
```

To:
```bash
(cd "$FRONTEND_PATH" && npm run dev -- --host --port "$TARGET_PORT") &
```

### Fix 2: Show npm install output

Change line 37 from:
```bash
(cd "$FRONTEND_PATH" && npm install --no-fund --no-audit > /dev/null 2>&1)
```

To:
```bash
(cd "$FRONTEND_PATH" && npm install --no-fund --no-audit)
```

### Fix 3: Update vite.config.js to remove `open: true`

Change lines 54-57 in `frontend/vite.config.js` from:
```javascript
server: {
  port: 3000,
  open: true
},
```

To:
```javascript
server: {
  port: 3000
},
```

### Fix 4: Add worktree verification

Add after line 17:
```bash
if [ -z "$WORKTREES" ]; then
    echo "No worktrees found. Exiting."
    exit 0
fi
```

---

## Summary

The primary issue causing the script to fail is the `--strictPort` flag. When Vite encounters a port that's already in use, instead of automatically selecting the next available port, it exits with an error. Removing this flag will allow each worktree to start on its assigned port or automatically find an available one.