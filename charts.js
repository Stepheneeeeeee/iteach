/* =========================================================
 * 算法智学 · 轻量 Canvas 图表库
 * （不依赖任何外部库，离线可运行）
 * ========================================================= */
"use strict";

const Charts = (function () {

  /* 传入 canvas 或任意容器（容器内自动创建 canvas），返回 {ctx, w, h} */
  function setup(container) {
    let canvas = container;
    if (!(canvas instanceof HTMLCanvasElement)) {
      canvas = document.createElement("canvas");
      canvas.style.width = "100%";
      canvas.style.height = "100%";
      canvas.style.display = "block";
      container.appendChild(canvas);
    }
    const dpr = window.devicePixelRatio || 1;
    const w = canvas.clientWidth || container.clientWidth || 600;
    const h = canvas.clientHeight || container.clientHeight || 260;
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
    const ctx = canvas.getContext("2d");
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, w, h);
    return { ctx, w, h };
  }

  const PALETTE = ["#1d6ef0", "#0d9488", "#f97316", "#8b5cf6", "#e11d48", "#eab308", "#14b8a6", "#64748b"];

  /* 竖向柱状图：{labels:[], values:[], unit, color} */
  function barChart(canvas, opt) {
    const { ctx, w, h } = setup(canvas);
    const labels = opt.labels || [], values = opt.values || [];
    const unit = opt.unit || "", color = opt.color || PALETTE[0];
    const padL = 40, padB = 26, padT = 18, padR = 10;
    const cw = w - padL - padR, ch = h - padT - padB;
    const maxV = Math.max(1, ...values.map(v => Math.abs(v)));
    const n = labels.length || 1;
    const slot = cw / n, bw = Math.min(46, slot * 0.55);

    ctx.font = "10px sans-serif";
    for (let g = 0; g <= 4; g++) {
      const gv = maxV * g / 4;
      const gy = padT + ch - ch * g / 4;
      ctx.strokeStyle = "#eef2f7"; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(padL, gy); ctx.lineTo(w - padR, gy); ctx.stroke();
      ctx.fillStyle = "#94a3b8"; ctx.textAlign = "right";
      ctx.fillText(Number.isInteger(gv) ? String(gv) : gv.toFixed(1), padL - 5, gy + 3);
    }
    values.forEach((v, i) => {
      const cx = padL + slot * i + slot / 2;
      const vh = Math.abs(v) / maxV * ch;
      const y0 = v >= 0 ? padT + ch - vh : padT + ch;
      ctx.fillStyle = v >= 0 ? color : "#e11d48";
      ctx.fillRect(cx - bw / 2, Math.min(y0, padT + ch), bw, Math.abs(vh));
      ctx.fillStyle = "#475569"; ctx.textAlign = "center"; ctx.font = "bold 11px sans-serif";
      ctx.fillText(String(v) + unit, cx, v >= 0 ? y0 - 6 : y0 - vh + 14);
      ctx.font = "10px sans-serif"; ctx.fillStyle = "#64748b";
      ctx.fillText(labels[i], cx, h - 6);
    });
  }

  /* 横向条形图（掌握度等）：{labels:[], values:[0-100], unit} */
  function hBarChart(canvas, opt) {
    const { ctx, w, h } = setup(canvas);
    const labels = opt.labels || [], values = opt.values || [];
    const unit = opt.unit || "";
    const padL = 104, padR = 36, padT = 10, padB = 12;
    const cw = w - padL - padR, ch = h - padT - padB;
    const n = labels.length || 1;
    const row = ch / n;
    labels.forEach((lb, i) => {
      const y = padT + row * i + row * 0.5;
      ctx.font = "11px sans-serif"; ctx.fillStyle = "#475569"; ctx.textAlign = "right";
      ctx.fillText(lb, padL - 8, y + 4);
      ctx.fillStyle = "#eef2f7";
      ctx.beginPath(); ctx.roundRect(padL, y - 7, cw, 14, 7); ctx.fill();
      const v = Math.max(0, Math.min(100, values[i] || 0));
      const vc = v >= 60 ? "#0d9488" : (v >= 40 ? "#f97316" : "#e11d48");
      if (v > 0) {
        ctx.fillStyle = vc;
        ctx.beginPath(); ctx.roundRect(padL, y - 7, cw * v / 100, 14, 7); ctx.fill();
      }
      ctx.font = "bold 11px sans-serif"; ctx.fillStyle = "#334155"; ctx.textAlign = "left";
      ctx.fillText(v + unit, padL + cw * v / 100 + 6, y + 4);
    });
  }

  /* 雷达图：{axes:[], values:[0-100], max} */
  function radarChart(canvas, opt) {
    const { ctx, w, h } = setup(canvas);
    const axes = opt.axes || [], values = opt.values || [];
    const cx = w / 2, cy = h / 2 + 4;
    const R = Math.min(w, h) / 2 - 42;
    const n = Math.max(3, axes.length);
    const ang = i => -Math.PI / 2 + (2 * Math.PI * i) / n;
    ctx.font = "10.5px sans-serif";
    for (let ring = 1; ring <= 4; ring++) {
      ctx.strokeStyle = ring === 4 ? "#cbd5e1" : "#e5eaf2";
      ctx.lineWidth = 1;
      ctx.beginPath();
      for (let i = 0; i <= n; i++) {
        const a = ang(i % n);
        const rr = R * ring / 4;
        const px = cx + rr * Math.cos(a), py = cy + rr * Math.sin(a);
        i === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py);
      }
      ctx.closePath(); ctx.stroke();
    }
    for (let i = 0; i < n; i++) {
      const a = ang(i);
      ctx.strokeStyle = "#e5eaf2";
      ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(cx + R * Math.cos(a), cy + R * Math.sin(a)); ctx.stroke();
      const lx = cx + (R + 16) * Math.cos(a), ly = cy + (R + 16) * Math.sin(a);
      ctx.fillStyle = "#475569"; ctx.textAlign = Math.abs(Math.cos(a)) < 0.3 ? "center" : (Math.cos(a) > 0 ? "left" : "right");
      ctx.fillText(axes[i], lx, ly + 3);
    }
    ctx.fillStyle = "rgba(29,110,240,0.20)";
    ctx.strokeStyle = "#1d6ef0"; ctx.lineWidth = 2;
    ctx.beginPath();
    for (let i = 0; i < n; i++) {
      const a = ang(i);
      const rr = R * (Math.max(0, Math.min(100, values[i] || 0)) / 100);
      const px = cx + rr * Math.cos(a), py = cy + rr * Math.sin(a);
      i === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py);
    }
    ctx.closePath(); ctx.fill(); ctx.stroke();
    for (let i = 0; i < n; i++) {
      const a = ang(i);
      const rr = R * (Math.max(0, Math.min(100, values[i] || 0)) / 100);
      ctx.fillStyle = "#1d6ef0";
      ctx.beginPath(); ctx.arc(cx + rr * Math.cos(a), cy + rr * Math.sin(a), 3, 0, Math.PI * 2); ctx.fill();
    }
    ctx.fillStyle = "#94a3b8"; ctx.textAlign = "center"; ctx.font = "10px sans-serif";
    ctx.fillText("掌握度综合得分（0-100）", cx, h - 8);
  }

  /* 折线图：{labels:[], values:[], fill} */
  function lineChart(canvas, opt) {
    const { ctx, w, h } = setup(canvas);
    const labels = opt.labels || [], values = opt.values || [];
    const unit = opt.unit || "", color = opt.color || PALETTE[0];
    const padL = 40, padB = 24, padT = 16, padR = 14;
    const cw = w - padL - padR, ch = h - padT - padB;
    const maxV = Math.max(100, ...values.map(v => Math.abs(v))) * 1.1;
    const n = Math.max(2, labels.length);
    const X = i => padL + cw * i / (n - 1);
    const Y = v => padT + ch - (v / maxV) * ch;

    for (let g = 0; g <= 4; g++) {
      const gy = padT + ch * g / 4;
      ctx.strokeStyle = "#eef2f7";
      ctx.beginPath(); ctx.moveTo(padL, gy); ctx.lineTo(w - padR, gy); ctx.stroke();
      ctx.fillStyle = "#94a3b8"; ctx.font = "10px sans-serif"; ctx.textAlign = "right";
      ctx.fillText(String(Math.round(maxV * (1 - g / 4))) + unit, padL - 5, gy + 3);
    }
    ctx.strokeStyle = color; ctx.lineWidth = 2;
    ctx.beginPath();
    values.forEach((v, i) => {
      const px = X(i), py = Y(v);
      i === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py);
    });
    ctx.stroke();
    if (opt.fill && values.length > 1) {
      ctx.lineTo(X(n - 1), padT + ch); ctx.lineTo(X(0), padT + ch); ctx.closePath();
      ctx.fillStyle = "rgba(29,110,240,0.10)"; ctx.fill();
    }
    values.forEach((v, i) => {
      const px = X(i), py = Y(v);
      ctx.fillStyle = "#fff"; ctx.strokeStyle = color; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.arc(px, py, 3.5, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
      ctx.fillStyle = "#475569"; ctx.font = "bold 10px sans-serif"; ctx.textAlign = "center";
      ctx.fillText(String(v), px, py - 8);
      ctx.font = "10px sans-serif"; ctx.fillStyle = "#94a3b8";
      ctx.fillText(labels[i], px, h - 6);
    });
  }

  /* 环形图：{value, total, label} */
  function donutChart(canvas, opt) {
    const { ctx, w, h } = setup(canvas);
    const total = Math.max(1, opt.total || 1);
    const value = Math.max(0, Math.min(total, opt.value || 0));
    const cx = w / 2, cy = h / 2;
    const R = Math.min(w, h) / 2 - 6, r = R * 0.62;
    const frac = value / total;
    ctx.strokeStyle = "#eef2f7"; ctx.lineWidth = R - r;
    ctx.beginPath(); ctx.arc(cx, cy, (R + r) / 2, 0, Math.PI * 2); ctx.stroke();
    if (frac > 0) {
      ctx.strokeStyle = opt.color || PALETTE[0]; ctx.lineCap = "round";
      ctx.beginPath(); ctx.arc(cx, cy, (R + r) / 2, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * frac); ctx.stroke();
      ctx.lineCap = "butt";
    }
    ctx.fillStyle = "#1f2937"; ctx.font = "bold 26px sans-serif"; ctx.textAlign = "center";
    ctx.fillText(Math.round(frac * 100) + "%", cx, cy - 2);
    ctx.fillStyle = "#9ca3af"; ctx.font = "11px sans-serif";
    ctx.fillText(opt.label || "", cx, cy + 18);
  }

  return { barChart, hBarChart, radarChart, lineChart, donutChart, PALETTE };
})();
