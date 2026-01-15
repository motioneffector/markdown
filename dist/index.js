function y(e) {
  return e.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");
}
function U(e) {
  return e.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}
function H(e) {
  const s = e.toLowerCase().trim();
  return s.startsWith("javascript:") || s.startsWith("vbscript:") || s.startsWith("file:") || s.startsWith("data:") && !s.startsWith("data:image/");
}
function W(e) {
  return H(e) ? "" : e;
}
function L(e) {
  return /^\s*$/.test(e);
}
const v = 32, q = /[.,;:!?)\]]+$/, Z = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/;
function E(e, s) {
  return e[s] ?? "";
}
function G(e) {
  let s = "", i = 0;
  for (let t = 0; t < e.length; t++) {
    const n = e[t];
    if (n === "	") {
      const l = 4 - i % 4;
      s += " ".repeat(l), i += l;
    } else n === `
` ? (s += n, i = 0) : (s += n, i++);
  }
  return s;
}
function F(e, s) {
  const i = {
    gfm: (s == null ? void 0 : s.gfm) ?? !0,
    sanitize: (s == null ? void 0 : s.sanitize) ?? !0,
    breaks: (s == null ? void 0 : s.breaks) ?? !1,
    linkTarget: (s == null ? void 0 : s.linkTarget) ?? ""
  };
  if (e === "")
    return "";
  const { text: t, definitions: n } = X(e), l = t.split(`
`), c = G(t);
  return R(c, i, 0, l).map((o) => M(o, i, n, 0)).join(`
`);
}
function V(e, s, i, t) {
  return e === "" || t >= v ? t >= v ? `<p>${y(e)}</p>` : "" : R(e, s, t, void 0).map((l) => M(l, s, i, t)).join(`
`);
}
function X(e) {
  const s = /* @__PURE__ */ new Map(), i = e.split(`
`), t = [];
  let n = 0;
  for (; n < i.length; ) {
    const l = i[n];
    if (!l) {
      t.push(l ?? ""), n++;
      continue;
    }
    const c = l.match(/^\[([^\]]+)\]:\s*(\S+)(?:\s+"([^"]+)")?$/);
    if (c != null && c[1] && c[2]) {
      const r = c[1].toLowerCase(), o = c[2], h = c[3];
      h ? s.set(r, { url: o, title: h }) : s.set(r, { url: o }), n++;
      continue;
    }
    t.push(l), n++;
  }
  return { text: t.join(`
`), definitions: s };
}
function R(e, s, i = 0, t) {
  if (i >= v)
    return [{ type: "paragraph", text: e }];
  const n = [];
  let l = 0;
  for (; l < e.length; ) {
    const o = e.indexOf(`
`, l);
    if (o === -1) {
      n.push(e.slice(l));
      break;
    } else
      n.push(e.slice(l, o)), l = o + 1;
  }
  const c = [];
  let r = 0;
  for (; r < n.length; ) {
    const o = n[r];
    if (!o) {
      r++;
      continue;
    }
    if (L(o)) {
      r++;
      continue;
    }
    {
      let u = !1, f = r, g = -1;
      for (; f < n.length; ) {
        const $ = n[f];
        if (!$ || L($)) break;
        if (g === -1 && (g = f), /^=+\s*$/.test($) && g !== -1 && f > g) {
          const m = n.slice(g, f).join(`
`).trim();
          c.push({
            type: "heading",
            level: 1,
            text: m
          }), r = f + 1, u = !0;
          break;
        }
        const w = g !== -1 ? n[g] : "", b = w && /^(?:-[\s-]*-[\s-]*-[\s-]*|[*][\s*]*[*][\s*]*[*][\s*]*|_[\s_]*_[\s_]*_[\s_]*)$/.test(w);
        if (/^-+\s*$/.test($) && g !== -1 && f > g && w && !/^[*\-+]\s/.test(w) && !/^\d+\.\s/.test(w) && !b) {
          const m = n.slice(g, f).join(`
`).trim();
          c.push({
            type: "heading",
            level: 2,
            text: m
          }), r = f + 1, u = !0;
          break;
        }
        f++;
      }
      if (u) continue;
    }
    const h = o.match(/^(#{1,6})\s+(.+?)(?:\s+#+\s*)?$/);
    if (h != null && h[1] && h[2]) {
      c.push({
        type: "heading",
        level: h[1].length,
        text: h[2]
      }), r++;
      continue;
    }
    if (/^ {4}/.test(o)) {
      const u = r;
      let f = r;
      for (; r < n.length; ) {
        const $ = n[r];
        if (!$) {
          r++;
          continue;
        }
        if (!/^ {4}/.test($) && !L($))
          break;
        f = r, r++;
      }
      for (; f > u && L(n[f] ?? ""); )
        f--;
      const g = t ? (() => {
        const $ = t.slice(u, f + 1).map((w) => {
          if (w.startsWith("	")) return w.slice(1);
          if (w.startsWith("    ")) return w.slice(4);
          const b = w.match(/^( {0,3}\t)/);
          return b ? w.slice(b[0].length) : w;
        }).join(`
`);
        return f + 1 < t.length ? $ + `
` : $;
      })() : (() => {
        const $ = [];
        for (let w = u; w <= f; w++) {
          const b = n[w];
          b && /^ {4}/.test(b) ? $.push(b.slice(4)) : $.push("");
        }
        return $.join(`
`);
      })();
      c.push({
        type: "code",
        language: "",
        code: g
      });
      continue;
    }
    const d = o.match(/^(`{3,}|~{3,})(.*)$/);
    if (d != null && d[1] && d[2] !== void 0) {
      const u = d[1], f = u[0], g = u.length, $ = d[2].trim(), w = r + 1;
      let b = r + 1;
      for (r++; r < n.length; ) {
        const p = E(n, r);
        if (f && p.startsWith(f.repeat(g))) {
          b = r - 1;
          break;
        }
        b = r, r++;
      }
      const m = t ? (() => {
        const p = t.slice(w, b + 1).join(`
`);
        return b + 1 < t.length && r < n.length ? p + `
` : p;
      })() : n.slice(w, b + 1).join(`
`);
      c.push({
        type: "code",
        language: $,
        code: m
      }), r++;
      continue;
    }
    if (/^(?:-[\s-]*-[\s-]*-[\s-]*|[*][\s*]*[*][\s*]*[*][\s*]*|_[\s_]*_[\s_]*_[\s_]*)$/.test(o)) {
      c.push({ type: "hr" }), r++;
      continue;
    }
    if (/^[*\-+]\s/.test(o)) {
      const { block: u, consumed: f } = O(n, r, s, "ul", i + 1);
      c.push(u), r += f;
      continue;
    }
    if (/^\d+\.\s/.test(o)) {
      const { block: u, consumed: f } = O(n, r, s, "ol", i + 1);
      c.push(u), r += f;
      continue;
    }
    if (o.startsWith("> ")) {
      const u = [];
      for (; r < n.length; ) {
        const g = E(n, r);
        if (g.startsWith("> ") || g.startsWith(">")) {
          u.push(g.replace(/^>\s?/, "")), r++;
          continue;
        }
        if (L(g) || /^ {4}/.test(g) || x(g, s))
          break;
        u.push(g), r++;
      }
      const f = u.join(`
`);
      c.push({ type: "blockquote", content: f });
      continue;
    }
    if (s.gfm && /\|/.test(o) && r + 1 < n.length) {
      const u = E(n, r + 1);
      if (u && /^\|?[\s\-:|]+\|?$/.test(u)) {
        const f = (p) => {
          const k = [];
          let I = "", A = 0;
          for (; A < p.length; ) {
            const _ = p[A];
            if (_ === "\\" && A + 1 < p.length && p[A + 1] === "|") {
              I += "|", A += 2;
              continue;
            }
            if (_ === "|") {
              k.push(I.trim()), I = "", A++;
              continue;
            }
            I += _, A++;
          }
          k.push(I.trim());
          const j = k[0] === "" ? 1 : 0, S = k[k.length - 1] === "" ? k.length - 1 : k.length;
          return k.slice(j, S);
        }, g = f(o), w = u.split("|").filter((p) => p.trim()).map((p) => p.trim()).map((p) => {
          const k = p.startsWith(":"), I = p.endsWith(":");
          return k && I ? "center" : I ? "right" : k ? "left" : null;
        }), b = [], m = r + 2;
        for (r += 2; r < n.length && /\|/.test(E(n, r)); )
          r++;
        for (let p = m; p < r; p++) {
          const k = E(n, p);
          /\|/.test(k) && b.push(f(k));
        }
        c.push({
          type: "table",
          header: g,
          alignments: w,
          rows: b
        });
        continue;
      }
    }
    const a = [];
    for (; r < n.length; ) {
      const u = E(n, r);
      if (L(u) || x(u, s)) break;
      a.push(u), r++;
    }
    if (a.length > 0)
      c.push({
        type: "paragraph",
        text: a.join(`
`)
      });
    else {
      const u = E(n, r);
      u && !L(u) && c.push({
        type: "paragraph",
        text: u
      }), r++;
    }
  }
  return c;
}
function x(e, s) {
  return /^#{1,6}\s/.test(e) || // heading
  /^[`~]{3,}/.test(e) || // code fence
  /^[*\-+]\s/.test(e) || // ul
  /^\d+\.\s/.test(e) || // ol
  e.startsWith("> ") || // blockquote
  /^(?:-[\s-]*-[\s-]*-[\s-]*|[*][\s*]*[*][\s*]*[*][\s*]*|_[\s_]*_[\s_]*_[\s_]*)$/.test(e) || // hr (fixed ReDoS)
  s.gfm && /\|/.test(e);
}
function O(e, s, i, t, n = 0) {
  if (n >= v)
    return {
      block: { type: t, items: [] },
      consumed: 1
    };
  const l = [];
  let c = s, r = !1, o = !1, h = 1;
  const d = /* @__PURE__ */ new Map(), a = (m) => {
    if (d.has(m)) return d.get(m);
    const p = E(e, m);
    let k = 0;
    for (let I = 0; I < p.length && p[I] === " "; I++)
      k++;
    return d.set(m, k), k;
  }, u = /* @__PURE__ */ new Map(), f = (m) => {
    if (u.has(m)) return u.get(m);
    const p = E(e, m);
    return u.set(m, p), p;
  }, g = t === "ol", $ = g ? /^(\d+)\.\s(.*)$/ : /^[*\-+]\s(.*)$/, w = g ? 3 : 2;
  for (; c < e.length; ) {
    const m = f(c), p = m.match($);
    if (p && (g ? p[2] !== void 0 : p[1] !== void 0)) {
      let k = g ? p[2] ?? "" : p[1] ?? "";
      g && l.length === 0 && p[1] && (h = parseInt(p[1], 10));
      const I = k.match(/^\[([ xX])\]\s(.*)$/);
      let A;
      I != null && I[1] && I[2] && (o = !0, A = I[1].toLowerCase() === "x", k = I[2]);
      const j = [k];
      for (c++; c < e.length; ) {
        const z = f(c);
        if (L(z)) {
          if (c + 1 < e.length) {
            const P = f(c + 1);
            if (a(c + 1) >= w) {
              r = !0, j.push(""), c++;
              continue;
            }
            if ($.test(P)) {
              r = !0, c++;
              break;
            }
          }
          break;
        }
        if (a(c) >= w) {
          j.push(z.slice(w)), c++;
          continue;
        }
        if ($.test(z))
          break;
        break;
      }
      const S = j.join(`
`);
      let _ = [];
      S.trim() && S !== m && n < v && (_ = R(S, i, n + 1, void 0)), l.push({
        content: S,
        children: _,
        ...A !== void 0 && { checked: A }
      });
      continue;
    }
    break;
  }
  const b = Math.max(1, c - s);
  return {
    block: {
      type: t,
      items: l,
      start: h,
      isLoose: r,
      isTaskList: o
    },
    consumed: b
  };
}
function M(e, s, i = /* @__PURE__ */ new Map(), t = 0) {
  switch (e.type) {
    case "heading": {
      const n = e.level, l = e.text;
      return typeof n != "number" || typeof l != "string" ? "" : `<h${String(n)}>${C(l, s, i)}</h${String(n)}>`;
    }
    case "paragraph": {
      const n = e.text;
      return typeof n != "string" ? "" : `<p>${C(n.trim(), s, i)}</p>`;
    }
    case "code": {
      const n = e.language, l = e.code;
      if (typeof l != "string") return "";
      const c = typeof n == "string" ? n : "";
      return `<pre><code${c ? ` class="language-${c}"` : ""}>${y(l)}</code></pre>`;
    }
    case "hr":
      return "<hr />";
    case "ul": {
      const n = !!e.isLoose;
      return `<ul>
${(Array.isArray(e.items) ? e.items.map((c) => {
        var h;
        let r;
        if ((h = c.children) != null && h.length) {
          const d = c.children.map((a) => M(a, s, i)).join(`
`);
          if (n)
            r = d;
          else {
            const a = c.children[0];
            if (c.children.length === 1 && (a == null ? void 0 : a.type) === "paragraph") {
              const u = a.text;
              r = typeof u == "string" ? C(u, s, i) : d;
            } else
              r = d;
          }
        } else
          r = C(c.content, s, i);
        return c.checked !== void 0 && (r = `${`<input type="checkbox" disabled${c.checked ? " checked" : ""} />`} ${r}`), `<li${c.checked !== void 0 ? ' class="task-list-item"' : ""}>${r}</li>`;
      }) : []).join(`
`)}
</ul>`;
    }
    case "ol": {
      const n = !!e.isLoose, l = typeof e.start == "number" ? e.start : 1, c = l !== 1 ? ` start="${String(l)}"` : "", r = Array.isArray(e.items) ? e.items.map((o) => {
        var d;
        let h;
        if ((d = o.children) != null && d.length) {
          const a = o.children.map((u) => M(u, s, i)).join(`
`);
          if (n)
            h = a;
          else {
            const u = o.children[0];
            if (o.children.length === 1 && (u == null ? void 0 : u.type) === "paragraph") {
              const f = u.text;
              h = typeof f == "string" ? C(f, s, i) : a;
            } else
              h = a;
          }
        } else
          h = C(o.content, s, i);
        return `<li>${h}</li>`;
      }) : [];
      return `<ol${c}>
${r.join(`
`)}
</ol>`;
    }
    case "blockquote": {
      const n = e.content;
      return typeof n != "string" ? "" : t >= v ? `<blockquote>
<p>${y(n)}</p>
</blockquote>` : `<blockquote>
${V(n, s, i, t + 1)}
</blockquote>`;
    }
    case "table": {
      const n = Array.isArray(e.alignments) ? e.alignments : [], c = (Array.isArray(e.header) ? e.header : []).map((h, d) => {
        const a = n[d], u = typeof a == "string" ? a : null;
        return `<th${u ? ` style="text-align: ${u}"` : ""}>${C(h, s, i)}</th>`;
      }).join(""), o = (Array.isArray(e.rows) ? e.rows : []).map((h) => `<tr>${h.map((a, u) => {
        const f = n[u], g = typeof f == "string" ? f : null;
        return `<td${g ? ` style="text-align: ${g}"` : ""}>${C(a, s, i)}</td>`;
      }).join("")}</tr>`).join(`
`);
      return `<table>
<thead>
<tr>${c}</tr>
</thead>
<tbody>
${o}
</tbody>
</table>`;
    }
    default:
      return "";
  }
}
function J(e) {
  return "!\"#$%&'()*+,-./:;<=>?@[\\]^_`{|}~".includes(e);
}
function T(e, s) {
  if (e[s] !== "[") return -1;
  let i = 1;
  for (let t = s + 1; t < e.length; t++) {
    if (e[t] === "\\" && t + 1 < e.length) {
      t++;
      continue;
    }
    if (e[t] === "[" ? i++ : e[t] === "]" && i--, i === 0) return t;
  }
  return -1;
}
function N(e, s) {
  if (e[s] !== "(") return null;
  let i = s + 1;
  for (; i < e.length && /\s/.test(e[i] ?? ""); ) i++;
  let t;
  if (e[i] === "<") {
    const l = e.indexOf(">", i);
    if (l === -1) return null;
    t = e.slice(i + 1, l), i = l + 1;
  } else {
    const l = i;
    let c = 0;
    for (; i < e.length; ) {
      const r = e[i];
      if (r === "(") c++;
      else if (r === ")") {
        if (c === 0) break;
        c--;
      } else if (/\s/.test(r ?? "") && c === 0) break;
      i++;
    }
    t = e.slice(l, i);
  }
  for (; i < e.length && /\s/.test(e[i] ?? ""); ) i++;
  let n;
  if (e[i] === '"' || e[i] === "'") {
    const l = e[i], c = i + 1, r = e.indexOf(l ?? "", c);
    r !== -1 && (n = e.slice(c, r), i = r + 1);
  }
  for (; i < e.length && /\s/.test(e[i] ?? ""); ) i++;
  return e[i] !== ")" ? null : n !== void 0 ? { url: t, title: n, endIndex: i + 1 } : { url: t, endIndex: i + 1 };
}
function K(e, s) {
  let i = 0, t = s;
  for (; t < e.length && e[t] === "`"; )
    i++, t++;
  if (i === 0) return null;
  const n = "`".repeat(i), l = e.indexOf(n, t);
  if (l === -1) return null;
  const c = l + i;
  if (c < e.length && e[c] === "`") {
    let o = l + 1;
    for (; o < e.length; ) {
      const h = e.indexOf(n, o);
      if (h === -1) return null;
      const d = h + i;
      if (d >= e.length || e[d] !== "`") {
        let a = e.slice(t, h);
        return a.startsWith(" ") && a.endsWith(" ") && a.length > 2 && (a = a.slice(1, -1)), {
          html: `<code>${y(a)}</code>`,
          endIndex: h + i
        };
      }
      o = h + 1;
    }
    return null;
  }
  let r = e.slice(t, l);
  return r.startsWith(" ") && r.endsWith(" ") && r.length > 2 && (r = r.slice(1, -1)), {
    html: `<code>${y(r)}</code>`,
    endIndex: l + i
  };
}
function Q(e, s, i, t) {
  if (e[s] !== "!" || e[s + 1] !== "[") return null;
  const n = T(e, s + 1);
  if (n === -1) return null;
  const l = e.slice(s + 2, n);
  if (e[n + 1] === "(") {
    const c = N(e, n + 1);
    if (!c) return null;
    const r = i.sanitize ? W(c.url.trim()) : c.url.trim();
    if (!r) return null;
    const o = c.title ? ` title="${y(c.title)}"` : "";
    return {
      html: `<img src="${y(r)}" alt="${y(l)}"${o} />`,
      endIndex: c.endIndex
    };
  }
  if (e[n + 1] === "[") {
    const c = T(e, n + 1);
    if (c === -1) return null;
    const r = e.slice(n + 2, c) || l, o = t.get(r.toLowerCase());
    if (!o) return null;
    const h = i.sanitize ? W(o.url.trim()) : o.url.trim();
    if (!h) return null;
    const d = o.title ? ` title="${y(o.title)}"` : "";
    return {
      html: `<img src="${y(h)}" alt="${y(l)}"${d} />`,
      endIndex: c + 1
    };
  }
  return null;
}
function Y(e, s, i, t) {
  if (e[s] !== "[") return null;
  const n = T(e, s);
  if (n === -1) return null;
  const l = e.slice(s + 1, n), c = i.linkTarget ? ` target="${i.linkTarget}"` : "";
  if (e[n + 1] === "(") {
    const o = N(e, n + 1);
    if (!o) return null;
    const h = i.sanitize ? W(o.url.trim()) : o.url.trim();
    if (!h)
      return { html: l, endIndex: o.endIndex };
    const d = o.title ? ` title="${y(o.title)}"` : "";
    return {
      html: `<a href="${y(h)}"${c}${d}>${l}</a>`,
      endIndex: o.endIndex
    };
  }
  if (e[n + 1] === "[") {
    const o = T(e, n + 1);
    if (o === -1) return null;
    const h = e.slice(n + 2, o) || l, d = t.get(h.toLowerCase());
    if (!d) return null;
    const a = i.sanitize ? W(d.url.trim()) : d.url.trim();
    if (!a)
      return { html: l, endIndex: o + 1 };
    const u = d.title ? ` title="${y(d.title)}"` : "";
    return {
      html: `<a href="${y(a)}"${c}${u}>${l}</a>`,
      endIndex: o + 1
    };
  }
  const r = t.get(l.toLowerCase());
  if (r) {
    const o = i.sanitize ? W(r.url.trim()) : r.url.trim();
    if (o) {
      const h = r.title ? ` title="${y(r.title)}"` : "";
      return {
        html: `<a href="${y(o)}"${c}${h}>${l}</a>`,
        endIndex: n + 1
      };
    }
    return { html: l, endIndex: n + 1 };
  }
  return null;
}
function ee(e, s) {
  if (e[s] !== "<") return null;
  const i = e.indexOf(">", s + 1);
  if (i === -1) return null;
  const t = e.slice(s + 1, i);
  return /^https?:\/\//.test(t) ? {
    html: `<a href="${t}">${t}</a>`,
    endIndex: i + 1
  } : /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(t) ? {
    html: `<a href="mailto:${t}">${t}</a>`,
    endIndex: i + 1
  } : null;
}
function ne(e, s, i) {
  const t = [];
  let n = s;
  for (; n < i; ) {
    const l = e[n];
    if (l !== "*" && l !== "_") {
      n++;
      continue;
    }
    let c = 0;
    const r = n;
    for (; n < i && e[n] === l; )
      c++, n++;
    const o = r > s ? e[r - 1] : " ", h = n < i ? e[n] : " ", d = /\s/.test(o ?? ""), u = !/\s/.test(h ?? ""), f = !d;
    t.push({
      type: l,
      count: c,
      position: r,
      canOpen: u,
      canClose: f,
      matched: 0
    });
  }
  return t;
}
function te(e) {
  const s = [];
  for (let i = 0; i < e.length; i++) {
    const t = e[i];
    if (t != null && t.canClose)
      for (let n = 0; n < i; n++) {
        const l = e[n];
        if (!l || !l.canOpen || l.type !== t.type || l.matched >= l.count || t.matched >= t.count) continue;
        const c = l.count - l.matched, r = t.count - t.matched, o = Math.min(c, r), h = Math.min(o, 3), d = t.position - l.position;
        s.push({
          openerIdx: n,
          closerIdx: i,
          span: d,
          matchCount: h
        });
      }
  }
  s.sort((i, t) => i.span - t.span);
  for (const i of s) {
    const t = e[i.openerIdx], n = e[i.closerIdx];
    if (!t || !n) continue;
    const l = t.count - t.matched, c = n.count - n.matched;
    if (l <= 0 || c <= 0) continue;
    const r = Math.min(l, c), o = Math.min(r, 3);
    t.matched += o, n.matched += o, t.pairedWith = i.closerIdx;
  }
}
function se(e, s, i, t, n, l) {
  if (t.length === 0) return null;
  let c = -1;
  for (let b = 0; b < t.length; b++) {
    const m = t[b];
    if (m != null && m.canOpen && m.matched > 0 && m.pairedWith !== void 0) {
      c = b;
      break;
    }
  }
  if (c === -1) return null;
  const r = t[c];
  if (!r) return null;
  const o = r.pairedWith;
  if (o === void 0 || o >= t.length) return null;
  const h = t[o];
  if (!(h != null && h.canClose) || h.matched === 0) return null;
  const d = Math.min(r.matched, h.matched, 3), a = r.position + d;
  let u = h.position;
  for (let b = c + 1; b < o; b++) {
    const m = t[b];
    if (m != null && m.canOpen && m.pairedWith === o) {
      const p = Math.min(m.matched, h.matched, 3), k = Math.min(p, d - 1);
      k > 0 && (u = h.position + k);
      break;
    }
  }
  const f = e.slice(a, u), g = C(f, n, l);
  let $;
  d >= 3 ? $ = `<strong><em>${g}</em></strong>` : d === 2 ? $ = `<strong>${g}</strong>` : $ = `<em>${g}</em>`;
  const w = h.position + h.matched;
  return { html: $, endIndex: w };
}
function re(e, s, i, t) {
  const n = e[s];
  if (n !== "*" && n !== "_") return null;
  let l = s;
  for (; l < e.length && e[l] === n; )
    l++;
  if (l >= e.length || /\s/.test(e[l] ?? "")) return null;
  let c = l + 1, r = !1;
  for (; c < e.length && c - s < 1e3; ) {
    if (e[c] === n) {
      r = !0, c += 50, c > e.length && (c = e.length);
      break;
    }
    c++;
  }
  if (!r) return null;
  const o = ne(e, s, c);
  return o.length < 2 ? null : (te(o), se(e, s, c, o, i, t));
}
function ie(e, s, i, t) {
  if (e[s] !== "~" || e[s + 1] !== "~") return null;
  const n = e.indexOf("~~", s + 2);
  if (n === -1) return null;
  const l = e.slice(s + 2, n);
  return l ? {
    html: `<del>${C(l, i, t)}</del>`,
    endIndex: n + 2
  } : null;
}
function ce(e, s) {
  if (e.slice(s, s + 7) === "http://" || e.slice(s, s + 8) === "https://") {
    let t = s;
    for (; t < e.length && !/\s/.test(e[t] ?? "") && e[t] !== "<" && e[t] !== ">"; )
      t++;
    let n = e.slice(s, t);
    const l = n.match(q);
    if (l && (n = n.slice(0, -l[0].length), t -= l[0].length), n.length > 8)
      return {
        html: `<a href="${n}">${n}</a>`,
        endIndex: t
      };
  }
  if (e.slice(s, s + 4) === "www.") {
    let t = s;
    for (; t < e.length && !/\s/.test(e[t] ?? "") && e[t] !== "<" && e[t] !== ">"; )
      t++;
    let n = e.slice(s, t);
    const l = n.match(q);
    if (l && (n = n.slice(0, -l[0].length), t -= l[0].length), n.length > 4)
      return {
        html: `<a href="http://${n}">${n}</a>`,
        endIndex: t
      };
  }
  const i = e.slice(s).match(Z);
  return i ? {
    html: `<a href="mailto:${i[0]}">${i[0]}</a>`,
    endIndex: s + i[0].length
  } : null;
}
function C(e, s, i = /* @__PURE__ */ new Map()) {
  const t = [];
  let n = 0;
  const l = s.gfm === !0, c = s.gfm === !0;
  for (; n < e.length; ) {
    const o = e[n], h = e[n + 1];
    if (o === "\\" && n + 1 < e.length && J(h ?? "")) {
      t.push(U(h ?? "")), n += 2;
      continue;
    }
    if (o === "`") {
      const a = K(e, n);
      if (a) {
        t.push(a.html), n = a.endIndex;
        continue;
      }
    }
    if (o === "!" && h === "[") {
      const a = Q(e, n, s, i);
      if (a) {
        t.push(a.html), n = a.endIndex;
        continue;
      }
    }
    if (o === "[") {
      const a = Y(e, n, s, i);
      if (a) {
        t.push(a.html), n = a.endIndex;
        continue;
      }
    }
    if (o === "<") {
      const a = ee(e, n);
      if (a) {
        t.push(a.html), n = a.endIndex;
        continue;
      }
    }
    if (l && o === "~" && h === "~") {
      const a = ie(e, n, s, i);
      if (a) {
        t.push(a.html), n = a.endIndex;
        continue;
      }
    }
    if (o === "*" || o === "_") {
      const a = re(e, n, s, i);
      if (a) {
        t.push(a.html), n = a.endIndex;
        continue;
      }
    }
    if (o === `
`) {
      if (t.length >= 2) {
        const a = t[t.length - 1], u = t[t.length - 2];
        if (a === " " && u === " ") {
          t.pop(), t.pop(), t.push(`<br />
`), n++;
          continue;
        }
      }
      if (t.length >= 1 && t[t.length - 1] === "\\") {
        t.pop(), t.push(`<br />
`), n++;
        continue;
      }
      if (s.breaks) {
        t.push(`<br />
`), n++;
        continue;
      }
    }
    if (c) {
      const a = n > 0 ? e[n - 1] : "";
      if (n === 0 || /\s/.test(a ?? "") || a === "(") {
        const u = ce(e, n);
        if (u) {
          t.push(u.html), n = u.endIndex;
          continue;
        }
      }
    }
    if (o === "&") {
      const a = e.slice(n), u = a.match(/^&#(\d+);/), f = a.match(/^&#x([0-9a-fA-F]+);/);
      if (u && u[1]) {
        const g = parseInt(u[1], 10);
        t.push(String.fromCharCode(g)), n += u[0].length;
        continue;
      }
      if (f && f[1]) {
        const g = parseInt(f[1], 16);
        t.push(String.fromCharCode(g)), n += f[0].length;
        continue;
      }
    }
    const d = n;
    for (; n < e.length; ) {
      const a = e[n], u = e[n + 1];
      if (a === "\\" || a === "`" || a === "!" || a === "[" || a === "<" || a === "*" || a === "_" || a === `
` || a === "&" || l && a === "~" && u === "~") break;
      if (c) {
        if ((a === "h" || a === "w") && (e.slice(n, n + 7) === "http://" || e.slice(n, n + 8) === "https://" || e.slice(n, n + 4) === "www."))
          break;
        if (n > d && a === " " && u && /[a-zA-Z0-9]/.test(u)) {
          n++;
          break;
        }
      }
      if (a === " " && (u === " " || u === `
`)) break;
      n++;
    }
    if (n > d) {
      t.push(e.slice(d, n));
      continue;
    }
    t.push(o ?? ""), n++;
  }
  let r = t.join("");
  return s.sanitize && (r = le(r)), r = oe(r, !s.sanitize), r;
}
function le(e) {
  return e = e.replace(/\s+on\w+\s*=\s*["'][^"']*["']/gi, ""), e = e.replace(/\s+on\w+\s*=\s*[^\s>"']+/gi, ""), e = e.replace(/(\s+(?:href|src|action|formaction|data)\s*=\s*["'])\s*javascript:/gi, "$1"), e = e.replace(/(\s+(?:href|src|action|formaction|data)\s*=\s*)\s*javascript:/gi, "$1"), e;
}
function oe(e, s = !0) {
  const i = ["script", "style", "iframe", "object", "embed"];
  for (const t of i)
    if (s)
      e = e.replace(new RegExp(`<${t}[^>]*>`, "gi"), ""), e = e.replace(new RegExp(`</${t}>`, "gi"), "");
    else {
      const n = new RegExp(`<${t}[^>]*>.*?</${t}>`, "gis");
      e = e.replace(n, ""), e = e.replace(new RegExp(`<${t}[^>]*>`, "gi"), "");
    }
  return e;
}
class D extends Error {
  constructor(s) {
    super(s), this.name = "MarkdownError", Object.setPrototypeOf(this, new.target.prototype);
  }
}
class ae extends D {
  constructor(s, i) {
    super(s), this.field = i, this.name = "ValidationError";
  }
}
class ge extends D {
  constructor(s, i, t) {
    super(s), this.position = i, this.input = t, this.name = "ParseError";
  }
}
const ue = {
  plaintext: [],
  inline: ["strong", "em", "code", "a", "br"],
  safe: ["p", "strong", "em", "code", "pre", "ul", "ol", "li", "blockquote", "h1", "h2", "h3", "h4", "h5", "h6"],
  prose: ["p", "strong", "em", "a", "blockquote", "h1", "h2", "h3", "h4", "h5", "h6", "ul", "ol", "li", "br"]
}, B = ["script", "style", "iframe", "object", "embed"];
function pe(e, s) {
  if (!e) return "";
  let i = e;
  /<[a-z][\s\S]*>/i.test(e) || (i = F(e));
  let t, n = !0;
  if (!s)
    return i;
  if (typeof s == "string")
    t = ue[s];
  else {
    if (s.allow && s.strip)
      throw new ae('Cannot use both "allow" and "strip" options');
    if (n = s.unwrap ?? !0, s.allow)
      t = s.allow;
    else if (s.strip) {
      const l = [
        "p",
        "div",
        "span",
        "br",
        "hr",
        "h1",
        "h2",
        "h3",
        "h4",
        "h5",
        "h6",
        "strong",
        "em",
        "b",
        "i",
        "u",
        "del",
        "code",
        "pre",
        "a",
        "img",
        "ul",
        "ol",
        "li",
        "table",
        "thead",
        "tbody",
        "tr",
        "th",
        "td",
        "blockquote"
      ], c = s.strip;
      t = l.filter((r) => !c.includes(r));
    } else
      t = [
        "p",
        "div",
        "span",
        "br",
        "hr",
        "h1",
        "h2",
        "h3",
        "h4",
        "h5",
        "h6",
        "strong",
        "em",
        "b",
        "i",
        "u",
        "del",
        "code",
        "pre",
        "a",
        "img",
        "ul",
        "ol",
        "li",
        "table",
        "thead",
        "tbody",
        "tr",
        "th",
        "td",
        "blockquote"
      ];
  }
  return he(i, t, n);
}
function he(e, s, i) {
  let t = e;
  for (const r of B) {
    const o = new RegExp(`<${r}[^>]*>.*?</${r}>`, "gi");
    t = t.replace(o, ""), t = t.replace(new RegExp(`<${r}[^>]*>`, "gi"), "");
  }
  if (s.length === 0)
    return t = t.replace(/<[^>]*>/g, ""), t = t.replace(/[<>]/g, ""), t;
  const n = /<\/?([a-z][a-z0-9]*)[^>]*>/gi, l = /* @__PURE__ */ new Set();
  let c;
  for (; (c = n.exec(e)) !== null; ) {
    const r = c[1];
    r && l.add(r.toLowerCase());
  }
  for (const r of l)
    if (!B.includes(r) && !s.includes(r))
      if (i) {
        const o = new RegExp(`<${r}[^>]*>`, "gi"), h = new RegExp(`</${r}>`, "gi");
        t = t.replace(o, ""), t = t.replace(h, "");
      } else {
        const o = new RegExp(`<${r}[^>]*>.*?</${r}>`, "gi");
        t = t.replace(o, ""), t = t.replace(new RegExp(`<${r}[^>]*/>`, "gi"), "");
      }
  return s.includes("img") || (t = t.replace(/<img[^>]*>/gi, "")), t;
}
export {
  D as MarkdownError,
  ge as ParseError,
  ae as ValidationError,
  F as markdown,
  pe as markdownStrip
};
