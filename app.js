(() => {
  "use strict";

  const $ = (id) => document.getElementById(id);
  const valueEl = $("value"), exprEl = $("expr");
  const HKEY = "jades-calculator:history:v1";
  const MAX_DIGITS = 12;

  // State: acc = left operand, op = pending operator, cur = string being typed
  let cur = "0", acc = null, op = null, fresh = true, justEq = false, error = false;
  let history = [];
  try { history = JSON.parse(localStorage.getItem(HKEY)) || []; } catch {}

  const calc = (a, o, b) => {
    switch (o) {
      case "+": return a + b;
      case "−": return a - b;
      case "×": return a * b;
      case "÷": if (b === 0) throw new Error("Can't divide by zero"); return a / b;
    }
    return b;
  };
  const clean = (n) => parseFloat(n.toPrecision(12)); // removes 0.1+0.2 noise
  const fmt = (s) => {
    if (typeof s === "number") s = String(clean(s));
    if (/e/i.test(s)) {
      const n = Number(s);
      return n.toExponential(6).replace(/\.?0+e/, "e");
    }
    const neg = s.startsWith("-"); if (neg) s = s.slice(1);
    const [i, d] = s.split(".");
    const out = Number(i).toLocaleString("en-US") + (d !== undefined ? "." + d : "");
    return (neg ? "-" : "") + out;
  };

  function show() {
    valueEl.classList.toggle("err", error);
    valueEl.textContent = error ? error : fmt(cur);
    const len = valueEl.textContent.length;
    valueEl.style.fontSize = !error && len > 9 ? `${Math.max(1.6, 3 * 9 / len)}rem` : "";
    exprEl.textContent = acc !== null && op ? `${fmt(acc)} ${op}${fresh ? "" : " " + fmt(cur)}` : exprEl.textContent;
    document.querySelectorAll(".op").forEach((b) => b.classList.toggle("active", !!op && fresh && b.dataset.op === op));
  }

  function setResult(n) {
    if (!isFinite(n)) throw new Error("Result too large");
    cur = String(clean(n));
  }

  function digit(d) {
    if (error) clearAll();
    if (justEq) { acc = null; op = null; exprEl.textContent = ""; justEq = false; }
    if (fresh) { cur = "0"; fresh = false; }
    if (cur.replace(/[-.]/g, "").length >= MAX_DIGITS) return;
    cur = cur === "0" ? d : cur === "-0" ? "-" + d : cur + d;
    show();
  }
  function dot() {
    if (error) clearAll();
    if (justEq) { acc = null; op = null; exprEl.textContent = ""; justEq = false; }
    if (fresh) { cur = "0"; fresh = false; }
    if (!cur.includes(".")) cur += ".";
    show();
  }
  function operator(o) {
    if (error) return;
    try {
      if (op && !fresh) { setResult(calc(acc, op, parseFloat(cur))); }
      acc = parseFloat(cur); op = o; fresh = true; justEq = false;
      show();
    } catch (e) { fail(e); }
  }
  function equals() {
    if (error || !op) return;
    try {
      const b = parseFloat(cur), a = acc;
      setResult(calc(a, op, b));
      const text = `${fmt(a)} ${op} ${fmt(b)}`;
      exprEl.textContent = text + " =";
      history.unshift({ expr: text, result: cur });
      history = history.slice(0, 30);
      saveHist(); renderHist();
      acc = null; op = null; fresh = true; justEq = true;
      show();
    } catch (e) { fail(e); }
  }
  function percent() {
    if (error) return;
    try {
      const n = parseFloat(cur);
      // With a pending +/−, % means a share of the left operand (e.g. 200 + 10% = 220)
      setResult(op && (op === "+" || op === "−") && acc !== null ? acc * n / 100 : n / 100);
      fresh = false; show();
    } catch (e) { fail(e); }
  }
  function sign() {
    if (error || cur === "0") return;
    cur = cur.startsWith("-") ? cur.slice(1) : "-" + cur;
    if (fresh && justEq) fresh = true;
    show();
  }
  function back() {
    if (error || fresh) return;
    cur = cur.length <= 1 || (cur.length === 2 && cur.startsWith("-")) ? "0" : cur.slice(0, -1);
    show();
  }
  function clearAll() {
    cur = "0"; acc = null; op = null; fresh = true; justEq = false; error = false;
    exprEl.textContent = ""; show();
  }
  function fail(e) { error = e.message; acc = null; op = null; fresh = true; show(); }

  /* ---------- history ---------- */
  function saveHist() { try { localStorage.setItem(HKEY, JSON.stringify(history)); } catch {} }
  function renderHist() {
    const list = $("list");
    list.replaceChildren();
    history.forEach((h) => {
      const li = document.createElement("li");
      const b = document.createElement("button");
      b.type = "button";
      const s = document.createElement("small"); s.textContent = h.expr + " =";
      const r = document.createElement("b"); r.textContent = fmt(h.result);
      b.append(s, r);
      b.title = "Use this result";
      b.onclick = () => { if (error) error = false; cur = h.result; fresh = false; justEq = false; acc = null; op = null; exprEl.textContent = ""; show(); };
      li.appendChild(b); list.appendChild(li);
    });
    $("none").hidden = history.length > 0;
  }
  $("histBtn").onclick = (e) => {
    const h = $("history"); h.hidden = !h.hidden;
    e.currentTarget.setAttribute("aria-expanded", String(!h.hidden));
  };
  $("clearHist").onclick = () => { history = []; saveHist(); renderHist(); };

  /* ---------- input ---------- */
  document.querySelector(".keys").addEventListener("click", (e) => {
    const b = e.target.closest("button"); if (!b) return;
    if (b.dataset.num) return digit(b.dataset.num);
    if (b.dataset.op) return operator(b.dataset.op);
    ({ clear: clearAll, sign, percent, back, dot, equals })[b.dataset.act]?.();
  });

  const KEYOP = { "+": "+", "-": "−", "*": "×", "x": "×", "/": "÷" };
  document.addEventListener("keydown", (e) => {
    if (e.ctrlKey || e.metaKey || e.altKey) return;
    const k = e.key;
    if (/^[0-9]$/.test(k)) digit(k);
    else if (KEYOP[k]) { e.preventDefault(); operator(KEYOP[k]); }
    else if (k === "." || k === ",") dot();
    else if (k === "Enter" || k === "=") { e.preventDefault(); equals(); }
    else if (k === "Backspace") back();
    else if (k === "Escape" || k === "Delete") clearAll();
    else if (k === "%") percent();
    else return;
  });

  renderHist();
  show();
})();
