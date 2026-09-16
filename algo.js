/* =========================================================
 * 算法智学 · 排序算法可视化引擎
 *
 * 每种算法以生成器（generator）形式逐步产出状态：
 *   { a: 当前数组, cmp: [i,j] 正在比较, swap: [i,j] 正在交换,
 *     pivot: 基准位置, pick: 选中位置, move: 写入位置,
 *     range: [lo,hi] 当前处理区间, done: 已就位后缀起点,
 *     doneFront: 已就位前缀终点, allSorted: 是否全部就位,
 *     line: 高亮伪代码行, desc: 步骤描述, cmpCount, swapCount }
 * ========================================================= */
"use strict";

const ALGO_KEYS = ["bubble", "selection", "insertion", "merge", "quick"];

const ALGO_INFO = {
  bubble: {
    name: "冒泡排序", cat: "交换排序",
    best: "O(n)", avg: "O(n²)", worst: "O(n²)", space: "O(1)", stable: "稳定",
    desc: "相邻元素两两比较，较大元素逐步“冒泡”到末尾；每趟结束最后一个元素即就位。优化版：某一趟无交换时提前终止。",
    pseudo: [
      "for i = 0 .. n-2",
      "  swapped = false",
      "  for j = 0 .. n-2-i",
      "    if a[j] > a[j+1]",
      "      swap(a[j], a[j+1])",
      "      swapped = true",
      "  // 本趟无交换则已有序",
      "end"
    ]
  },
  selection: {
    name: "选择排序", cat: "选择排序",
    best: "O(n²)", avg: "O(n²)", worst: "O(n²)", space: "O(1)", stable: "不稳定",
    desc: "每趟从未排序区选出最小元素，与未排序区首个元素交换；交换次数最少（至多 n-1 次），但比较次数始终为 O(n²)。",
    pseudo: [
      "for i = 0 .. n-2",
      "  minIdx = i",
      "  for j = i+1 .. n-1",
      "    if a[j] < a[minIdx]",
      "      minIdx = j",
      "  swap(a[i], a[minIdx])",
      "  // 头部元素就位",
      "end"
    ]
  },
  insertion: {
    name: "插入排序", cat: "插入排序",
    best: "O(n)", avg: "O(n²)", worst: "O(n²)", space: "O(1)", stable: "稳定",
    desc: "像整理扑克牌：将当前元素向前插入到已排序区正确位置。序列基本有序时效率极高（接近 O(n)），是工程中的常用优化基础。",
    pseudo: [
      "for i = 1 .. n-1",
      "  key = a[i]",
      "  j = i - 1",
      "  while j >= 0 && a[j] > key",
      "    a[j+1] = a[j]; j--",
      "  a[j+1] = key",
      "end"
    ]
  },
  merge: {
    name: "归并排序", cat: "归并排序",
    best: "O(n log n)", avg: "O(n log n)", worst: "O(n log n)", space: "O(n)", stable: "稳定",
    desc: "经典分治：将区间对半拆分到单个元素，再两两合并有序区间。时间复杂度稳定为 O(n log n)，但需要 O(n) 辅助空间。",
    pseudo: [
      "mergeSort(lo, hi)",
      "  if lo >= hi: return",
      "  mid = (lo + hi) / 2",
      "  mergeSort(lo, mid)",
      "  mergeSort(mid+1, hi)",
      "  merge(lo, mid, hi)",
      "    while i<=mid && j<=hi",
      "      tmp.push(较小者)",
      "    // 剩余元素依次入 tmp",
      "    for k: a[lo+k] = tmp[k]"
    ]
  },
  quick: {
    name: "快速排序", cat: "交换排序",
    best: "O(n log n)", avg: "O(n log n)", worst: "O(n²)", space: "O(log n)", stable: "不稳定",
    desc: "取区间末尾为基准，一趟划分使左边都小于基准、右边都大于基准，再递归两侧。平均性能最优，但基本有序输入下最坏退化为 O(n²)。",
    pseudo: [
      "quickSort(lo, hi)",
      "  if lo >= hi: return",
      "  pivot = a[hi]",
      "  i = lo - 1",
      "  for j = lo .. hi-1",
      "    if a[j] < pivot",
      "      i++; swap(a[i], a[j])",
      "  swap(a[i+1], a[hi])  // 基准归位"
    ]
  }
};

const AlgoEngine = (function () {

  /* 冒泡排序 */
  function* bubble(arr) {
    const a = arr.slice();
    const n = a.length;
    let cmp = 0, swp = 0;
    for (let i = 0; i < n - 1; i++) {
      let swapped = false;
      for (let j = 0; j < n - 1 - i; j++) {
        cmp++;
        yield { a: a.slice(), cmp: [j, j + 1], done: n - 1 - i, line: 3, cmpCount: cmp, swapCount: swp, desc: `比较 a[${j}] = ${a[j]} 与 a[${j + 1}] = ${a[j + 1]}` };
        if (a[j] > a[j + 1]) {
          [a[j], a[j + 1]] = [a[j + 1], a[j]];
          swp++; swapped = true;
          yield { a: a.slice(), swap: [j, j + 1], done: n - 1 - i, line: 5, cmpCount: cmp, swapCount: swp, desc: `逆序，交换：a[${j}] ↔ a[${j + 1}]` };
        }
      }
      if (!swapped) {
        yield { a: a.slice(), allSorted: true, line: 7, cmpCount: cmp, swapCount: swp, desc: `第 ${i + 1} 趟无交换，序列已有序，提前结束 ✓` };
        return;
      }
      yield { a: a.slice(), done: n - 1 - i, line: 6, cmpCount: cmp, swapCount: swp, desc: `第 ${i + 1} 趟结束，a[${n - 1 - i}] 已就位` };
    }
    yield { a: a.slice(), allSorted: true, line: 8, cmpCount: cmp, swapCount: swp, desc: "排序完成 ✓" };
  }

  /* 选择排序 */
  function* selection(arr) {
    const a = arr.slice();
    const n = a.length;
    let cmp = 0, swp = 0;
    for (let i = 0; i < n - 1; i++) {
      let minIdx = i;
      yield { a: a.slice(), doneFront: i, pick: [i], line: 2, cmpCount: cmp, swapCount: swp, desc: `第 ${i + 1} 趟：暂定最小值 a[${i}] = ${a[i]}` };
      for (let j = i + 1; j < n; j++) {
        cmp++;
        yield { a: a.slice(), doneFront: i, cmp: [minIdx, j], line: 4, cmpCount: cmp, swapCount: swp, desc: `比较 a[${j}] = ${a[j]} 与当前最小值 a[${minIdx}] = ${a[minIdx]}` };
        if (a[j] < a[minIdx]) {
          minIdx = j;
          yield { a: a.slice(), doneFront: i, pick: [minIdx], line: 5, cmpCount: cmp, swapCount: swp, desc: `更新最小值为 a[${minIdx}] = ${a[minIdx]}` };
        }
      }
      if (minIdx !== i) {
        [a[i], a[minIdx]] = [a[minIdx], a[i]]; swp++;
        yield { a: a.slice(), doneFront: i + 1, swap: [i, minIdx], line: 6, cmpCount: cmp, swapCount: swp, desc: `交换 a[${i}] ↔ a[${minIdx}]，头部就位` };
      } else {
        yield { a: a.slice(), doneFront: i + 1, line: 6, cmpCount: cmp, swapCount: swp, desc: `a[${i}] 已是最小值，无需交换` };
      }
    }
    yield { a: a.slice(), allSorted: true, line: 8, cmpCount: cmp, swapCount: swp, desc: "排序完成 ✓" };
  }

  /* 插入排序 */
  function* insertion(arr) {
    const a = arr.slice();
    const n = a.length;
    let cmp = 0, swp = 0;
    yield { a: a.slice(), line: 1, cmpCount: 0, swapCount: 0, desc: "从第 2 个元素开始，向前插入到已排序区" };
    for (let i = 1; i < n; i++) {
      const key = a[i];
      let j = i - 1;
      yield { a: a.slice(), key, keyPos: i, doneFront: i, pick: [i], line: 2, cmpCount: cmp, swapCount: swp, desc: `取出 key = ${key}（原位置 ${i}）` };
      while (j >= 0 && a[j] > key) {
        cmp++;
        a[j + 1] = a[j]; j--;
        swp++;
        yield { a: a.slice(), key, keyPos: j + 1, doneFront: i, move: [j + 1], line: 5, cmpCount: cmp, swapCount: swp, desc: `a[${j + 1}] > key，元素后移，key 空位在 ${j + 1}` };
      }
      a[j + 1] = key;
      yield { a: a.slice(), doneFront: i + 1, pick: [j + 1], line: 6, cmpCount: cmp, swapCount: swp, desc: `将 key = ${key} 插入到 a[${j + 1}]` };
    }
    yield { a: a.slice(), allSorted: true, line: 7, cmpCount: cmp, swapCount: swp, desc: "排序完成 ✓" };
  }

  /* 归并排序 */
  function* merge(arr) {
    const a = arr.slice();
    const n = a.length;
    let cmp = 0, swp = 0;
    function* ms(lo, hi) {
      if (lo >= hi) return;
      const mid = (lo + hi) >> 1;
      yield { a: a.slice(), range: [lo, hi], line: 3, cmpCount: cmp, swapCount: swp, desc: `拆分区间 [${lo}, ${hi}]，mid = ${mid}` };
      yield* ms(lo, mid);
      yield* ms(mid + 1, hi);
      yield { a: a.slice(), range: [lo, hi], line: 6, cmpCount: cmp, swapCount: swp, desc: `合并有序区间 [${lo}, ${mid}] 与 [${mid + 1}, ${hi}]` };
      const tmp = [];
      let i = lo, j = mid + 1;
      while (i <= mid && j <= hi) {
        cmp++;
        yield { a: a.slice(), range: [lo, hi], cmp: [i, j], line: 7, cmpCount: cmp, swapCount: swp, desc: `比较 a[${i}] = ${a[i]} 与 a[${j}] = ${a[j]}` };
        if (a[i] <= a[j]) { tmp.push(a[i]); i++; }
        else { tmp.push(a[j]); j++; }
      }
      while (i <= mid) tmp.push(a[i++]);
      while (j <= hi) tmp.push(a[j++]);
      for (let k = 0; k < tmp.length; k++) { a[lo + k] = tmp[k]; }
      swp += tmp.length;
      yield { a: a.slice(), range: [lo, hi], merged: [lo, hi], line: 10, cmpCount: cmp, swapCount: swp, desc: `合并完成：[${lo}..${hi}] = ${tmp.join(", ")}` };
    }
    yield* ms(0, n - 1);
    yield { a: a.slice(), allSorted: true, line: 10, cmpCount: cmp, swapCount: swp, desc: "排序完成 ✓" };
  }

  /* 快速排序 */
  function* quick(arr) {
    const a = arr.slice();
    const n = a.length;
    let cmp = 0, swp = 0;
    function* qs(lo, hi) {
      if (lo >= hi) return;
      const pivot = a[hi];
      yield { a: a.slice(), range: [lo, hi], pivot: hi, line: 3, cmpCount: cmp, swapCount: swp, desc: `区间 [${lo}, ${hi}]：选取基准 pivot = a[${hi}] = ${pivot}` };
      let i = lo - 1;
      for (let j = lo; j < hi; j++) {
        cmp++;
        yield { a: a.slice(), range: [lo, hi], pivot: hi, cmp: [j, hi], line: 6, cmpCount: cmp, swapCount: swp, desc: `比较 a[${j}] = ${a[j]} 与基准 ${pivot}` };
        if (a[j] < pivot) {
          i++;
          if (i !== j) {
            [a[i], a[j]] = [a[j], a[i]]; swp++;
            yield { a: a.slice(), range: [lo, hi], pivot: hi, swap: [i, j], line: 7, cmpCount: cmp, swapCount: swp, desc: `交换 a[${i}] ↔ a[${j}]` };
          }
        }
      }
      [a[i + 1], a[hi]] = [a[hi], a[i + 1]]; swp++;
      yield { a: a.slice(), range: [lo, hi], pivot: i + 1, swap: [i + 1, hi], line: 8, cmpCount: cmp, swapCount: swp, desc: `基准归位：a[${i + 1}] = ${pivot}` };
      yield* qs(lo, i);
      yield* qs(i + 2, hi);
    }
    yield* qs(0, n - 1);
    yield { a: a.slice(), allSorted: true, line: 8, cmpCount: cmp, swapCount: swp, desc: "排序完成 ✓" };
  }

  return { bubble, selection, insertion, merge, quick };
})();

/* ---------- DOM 渲染器 ---------- */
const AlgoRender = {
  render(stage, step) {
    const maxV = Math.max(...step.a);
    const n = step.a.length;
    let html = "";
    for (let i = 0; i < n; i++) {
      const v = step.a[i];
      const h = Math.max(3, Math.round(v / maxV * 100));
      let cls = "";
      if (step.allSorted) cls = "sorted";
      else if (step.swap && (step.swap[0] === i || step.swap[1] === i)) cls = "swap";
      else if (step.pivot === i) cls = "pivot";
      else if (step.cmp && (step.cmp[0] === i || step.cmp[1] === i)) cls = "compare";
      else if (step.pick && step.pick[0] === i) cls = "compare";
      else if (step.move && step.move[0] === i) cls = "pivot";
      else if (step.keyPos === i) cls = "pivot";
      else if (step.merged && i >= step.merged[0] && i <= step.merged[1]) cls = "pivot";
      else if (step.done && i >= step.done) cls = "sorted";
      else if (step.doneFront && i < step.doneFront) cls = "sorted";
      else if (step.range && i >= step.range[0] && i <= step.range[1]) cls = "range";
      html += `<div class="bar-col">
        <div class="bar ${cls}" style="height:${h}%"><span class="vlabel">${v}</span></div>
        <span class="idx-label">${i}</span>
      </div>`;
    }
    stage.innerHTML = html;
  }
};
