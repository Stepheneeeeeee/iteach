// 算法引擎测试：验证五种排序的每一步数组为原排列、最终有序
const fs = require("fs");
const vm = require("vm");
const path = "C:/Users/Lenovo/Doubao/chats/2026-09-16/new-chat/算法可视化互动学习系统/js/algo.js";
const src = fs.readFileSync(path, "utf8");
const ctx = {};
vm.createContext(ctx);
vm.runInContext(src + "\n;globalThis.__out = {ALGO_KEYS, ALGO_INFO, AlgoEngine};", ctx);
const { ALGO_KEYS, AlgoEngine } = ctx.__out;

function isSorted(a) {
  for (let i = 1; i < a.length; i++) if (a[i] < a[i - 1]) return false;
  return true;
}
function sameMultiset(a, b) {
  const m = {};
  for (const x of a) m[x] = (m[x] || 0) + 1;
  for (const x of b) { if (!m[x]) return false; m[x]--; }
  return Object.values(m).every(v => v === 0);
}
/* 插入排序允许 key 被“持有”的瞬态：keyPos 处为持有的 key，从数组扣除后加回 key 应与原序列等量 */
function stepValid(key, step, input) {
  if (key === "insertion" && step.key !== undefined) {
    const arr = step.a.slice();
    arr.splice(step.keyPos, 1);
    return sameMultiset(arr.concat([step.key]), input);
  }
  return sameMultiset(step.a, input);
}

const cases = [
  [8, 3, 5, 1, 9, 2, 7, 4],
  [1, 2, 3, 4, 5],
  [5, 4, 3, 2, 1],
  [3, 1, 4, 1, 5, 9, 2, 6, 5, 3, 5],
  [42]
];
let pass = 0, fail = 0;

for (const key of ALGO_KEYS) {
  for (const input of cases) {
    const steps = Array.from(AlgoEngine[key](input));
    const last = steps[steps.length - 1];
    let ok = true;
    let msg = "";
    for (const s of steps) {
      if (!stepValid(key, s, input)) { ok = false; msg = "存在数组非原排列的步骤"; break; }
      if (s.cmpCount === undefined || s.swapCount === undefined) { ok = false; msg = "缺少统计字段"; break; }
    }
    if (!isSorted(last.a)) { ok = false; msg = "最终数组未有序"; }
    if (!last.allSorted) { ok = false; msg = "末步未标记 allSorted"; }
    if (ok) { pass++; console.log(`PASS ${key} len=${input.length} steps=${steps.length} cmp=${last.cmpCount} swp=${last.swapCount}`); }
    else { fail++; console.log(`FAIL ${key} len=${input.length}: ${msg}`); }
  }
}
console.log(`\n结果: ${pass} 通过, ${fail} 失败`);
process.exit(fail ? 1 : 0);
