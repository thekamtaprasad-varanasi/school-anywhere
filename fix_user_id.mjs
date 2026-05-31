// fix_user_id.mjs
// Replaces "user.id" with master id (2) in app/ folder
// Run: node fix_user_id.mjs
// First runs in DRY mode (shows what will change), no actual writes.
// To actually write, run: node fix_user_id.mjs --apply

import { readFileSync, writeFileSync } from "fs";
import { readdirSync, statSync } from "fs";
import { join } from "path";

const MASTER_ID = 2;
const APPLY = process.argv.includes("--apply");

// Patterns to replace — each is a regex + replacement string
const PATTERNS = [
  // user_id: user.id  →  user_id: MASTER_ID
  {
    name: "INSERT user_id assignment",
    regex: /user_id:\s*user\.id\b/g,
    replace: `user_id: ${MASTER_ID}`,
  },
  // user_id: parseInt(user.id) → user_id: MASTER_ID
  {
    name: "INSERT user_id parseInt",
    regex: /user_id:\s*parseInt\(user\.id\)/g,
    replace: `user_id: ${MASTER_ID}`,
  },
  // eq(schema.X.user_id, user.id)  →  eq(schema.X.user_id, MASTER_ID)
  {
    name: "WHERE eq with user.id",
    regex: /eq\(\s*([a-zA-Z_.]+\.user_id)\s*,\s*user\.id\s*\)/g,
    replace: `eq($1, ${MASTER_ID})`,
  },
  // eq(X.user_id, user.id) → eq(X.user_id, MASTER_ID)  (no schema. prefix)
  {
    name: "WHERE eq with user.id (no schema)",
    regex: /eq\(\s*([a-zA-Z_]+\.user_id)\s*,\s*user\.id\s*\)/g,
    replace: `eq($1, ${MASTER_ID})`,
  },
];

// ─── File walker ─────────────────────────────────────────────────────────
function walk(dir, results = []) {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    const st = statSync(full);
    if (st.isDirectory()) {
      if (entry === "node_modules" || entry === ".next" || entry.startsWith("."))
        continue;
      walk(full, results);
    } else if (entry.endsWith(".js")) {
      results.push(full);
    }
  }
  return results;
}

// ─── Main ────────────────────────────────────────────────────────────────
const files = walk("app");
console.log(`Scanning ${files.length} files in app/ ...`);
console.log(APPLY ? "MODE: APPLY (will write changes)" : "MODE: DRY RUN (no writes — use --apply to write)");
console.log("");

let totalChanges = 0;
const changedFiles = [];

for (const file of files) {
  const original = readFileSync(file, "utf8");
  let updated = original;
  const fileChanges = [];

  for (const p of PATTERNS) {
    const matches = updated.match(p.regex);
    if (matches) {
      fileChanges.push({ name: p.name, count: matches.length });
      updated = updated.replace(p.regex, p.replace);
    }
  }

  if (updated !== original) {
    changedFiles.push({ file, changes: fileChanges });
    totalChanges += fileChanges.reduce((s, c) => s + c.count, 0);
    if (APPLY) {
      writeFileSync(file, updated, "utf8");
    }
  }
}

// ─── Report ──────────────────────────────────────────────────────────────
console.log(`Files changed: ${changedFiles.length}`);
console.log(`Total replacements: ${totalChanges}`);
console.log("");

for (const cf of changedFiles) {
  console.log(`  ${cf.file}`);
  for (const c of cf.changes) {
    console.log(`     ${c.count}x  ${c.name}`);
  }
}

console.log("");
if (!APPLY) {
  console.log("→ This was a DRY RUN. No files were changed.");
  console.log("→ Review the list above. If it looks right, run:");
  console.log("    node fix_user_id.mjs --apply");
} else {
  console.log("✅ Changes applied. Now:");
  console.log("   1. Check with: git diff");
  console.log("   2. Test locally: npm run dev");
  console.log("   3. If OK: git add . && git commit -m 'single-tenant fix' && git push");
}