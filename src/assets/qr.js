/* Minimal QR Code generator (byte mode, ECC level M, versions 1-10). Exposes NB.qr(text) -> {size, modules[][]} and NB.qrSvg(text). */
(function () {
  'use strict';
  var NB = (window.NB = window.NB || {});
  var ECC_PER_BLOCK = [0, 10, 16, 26, 18, 24, 16, 18, 22, 22, 26];
  var NUM_BLOCKS = [0, 1, 1, 1, 2, 2, 4, 4, 4, 5, 5];
  function rawModules(v) {
    var r = (16 * v + 128) * v + 64;
    if (v >= 2) { var na = Math.floor(v / 7) + 2; r -= (25 * na - 10) * na - 55; if (v >= 7) r -= 36; }
    return r;
  }
  function dataCodewords(v) { return Math.floor(rawModules(v) / 8) - ECC_PER_BLOCK[v] * NUM_BLOCKS[v]; }
  // GF(256)
  function gfMul(x, y) { var z = 0; for (var i = 7; i >= 0; i--) { z = (z << 1) ^ ((z >>> 7) * 0x11d); z ^= ((y >>> i) & 1) * x; } return z & 255; }
  function rsDivisor(deg) {
    var r = []; for (var i = 0; i < deg - 1; i++) r.push(0); r.push(1);
    var root = 1;
    for (var i2 = 0; i2 < deg; i2++) {
      for (var j = 0; j < r.length; j++) { r[j] = gfMul(r[j], root); if (j + 1 < r.length) r[j] ^= r[j + 1]; }
      root = gfMul(root, 2);
    }
    return r;
  }
  function rsRemainder(data, div) {
    var res = div.map(function () { return 0; });
    data.forEach(function (b) {
      var f = b ^ res.shift(); res.push(0);
      div.forEach(function (c, i) { res[i] ^= gfMul(c, f); });
    });
    return res;
  }
  function utf8(s) { return Array.prototype.slice.call(new TextEncoder().encode(s)); }
  function alignPositions(v) {
    if (v === 1) return [];
    var n = Math.floor(v / 7) + 2, size = v * 4 + 17;
    var step = v === 32 ? 26 : Math.ceil((v * 4 + 4) / (n * 2 - 2)) * 2;
    var r = [6]; for (var p = size - 7; r.length < n; p -= step) r.splice(1, 0, p);
    return r;
  }
  function encode(text) {
    var bytes = utf8(text), v;
    for (v = 1; v <= 10; v++) { var cc = v < 10 ? 8 : 16; if (4 + cc + bytes.length * 8 <= dataCodewords(v) * 8) break; }
    if (v > 10) throw new Error('QR: text too long');
    var bits = [];
    function put(val, len) { for (var i = len - 1; i >= 0; i--) bits.push((val >>> i) & 1); }
    put(4, 4); put(bytes.length, v < 10 ? 8 : 16); bytes.forEach(function (b) { put(b, 8); });
    var cap = dataCodewords(v) * 8;
    put(0, Math.min(4, cap - bits.length)); while (bits.length % 8) bits.push(0);
    for (var pad = 0xec; bits.length < cap; pad ^= 0xec ^ 0x11) put(pad, 8);
    var data = []; for (var i = 0; i < bits.length; i += 8) { var b = 0; for (var k = 0; k < 8; k++) b = (b << 1) | bits[i + k]; data.push(b); }
    // blocks + ecc
    var nb = NUM_BLOCKS[v], eb = ECC_PER_BLOCK[v], raw = Math.floor(rawModules(v) / 8);
    var shortLen = Math.floor(raw / nb) - eb, numShort = nb - (raw % nb), div = rsDivisor(eb), blocks = [], pos = 0;
    for (var bi = 0; bi < nb; bi++) {
      var len = shortLen + (bi < numShort ? 0 : 1), d = data.slice(pos, pos + len); pos += len;
      var ecc = rsRemainder(d, div); if (bi < numShort) d.push(0); blocks.push(d.concat(ecc));
    }
    var out = [];
    for (var c = 0; c < blocks[0].length; c++) blocks.forEach(function (bl, j) { if (c !== shortLen || j >= numShort) out.push(bl[c]); });
    return { v: v, codewords: out };
  }
  function build(text) {
    var enc = encode(text), v = enc.v, size = v * 4 + 17;
    var mod = [], fn = [];
    for (var y = 0; y < size; y++) { mod.push(new Array(size).fill(false)); fn.push(new Array(size).fill(false)); }
    function setF(x, y, dark) { mod[y][x] = dark; fn[y][x] = true; }
    for (var i = 0; i < size; i++) { setF(6, i, i % 2 === 0); setF(i, 6, i % 2 === 0); }
    function finder(cx, cy) {
      for (var dy = -4; dy <= 4; dy++) for (var dx = -4; dx <= 4; dx++) {
        var d = Math.max(Math.abs(dx), Math.abs(dy)), x = cx + dx, y = cy + dy;
        if (x >= 0 && x < size && y >= 0 && y < size) setF(x, y, d !== 2 && d !== 4);
      }
    }
    finder(3, 3); finder(size - 4, 3); finder(3, size - 4);
    var ap = alignPositions(v), na = ap.length;
    for (var a = 0; a < na; a++) for (var b2 = 0; b2 < na; b2++) {
      if ((a === 0 && b2 === 0) || (a === 0 && b2 === na - 1) || (a === na - 1 && b2 === 0)) continue;
      for (var dy2 = -2; dy2 <= 2; dy2++) for (var dx2 = -2; dx2 <= 2; dx2++) setF(ap[a] + dx2, ap[b2] + dy2, Math.max(Math.abs(dx2), Math.abs(dy2)) !== 1);
    }
    function formatBits(mask) {
      var data = (0 << 3) | mask; /* ECC M = 0 (binary 00) */
      var rem = data; for (var i = 0; i < 10; i++) rem = (rem << 1) ^ ((rem >>> 9) * 0x537);
      return ((data << 10) | rem) ^ 0x5412;
    }
    function drawFormat(mask) {
      var bits = formatBits(mask);
      function g(i) { return ((bits >>> i) & 1) !== 0; }
      for (var i = 0; i <= 5; i++) setF(8, i, g(i));
      setF(8, 7, g(6)); setF(8, 8, g(7)); setF(7, 8, g(8));
      for (var i2 = 9; i2 < 15; i2++) setF(14 - i2, 8, g(i2));
      for (var i3 = 0; i3 < 8; i3++) setF(size - 1 - i3, 8, g(i3));
      for (var i4 = 8; i4 < 15; i4++) setF(8, size - 15 + i4, g(i4));
      setF(8, size - 8, true);
    }
    drawFormat(0);
    if (v >= 7) {
      var rem = v; for (var i5 = 0; i5 < 12; i5++) rem = (rem << 1) ^ ((rem >>> 11) * 0x1f25);
      var vb = (v << 12) | rem;
      for (var i6 = 0; i6 < 18; i6++) {
        var bit = ((vb >>> i6) & 1) !== 0, aa = size - 11 + (i6 % 3), bb = Math.floor(i6 / 3);
        setF(aa, bb, bit); setF(bb, aa, bit);
      }
    }
    // data placement
    var cw = enc.codewords, idx = 0;
    for (var right = size - 1; right >= 1; right -= 2) {
      if (right === 6) right = 5;
      for (var vert = 0; vert < size; vert++) for (var j = 0; j < 2; j++) {
        var x = right - j, upward = ((right + 1) & 2) === 0, y = upward ? size - 1 - vert : vert;
        if (!fn[y][x] && idx < cw.length * 8) { mod[y][x] = ((cw[idx >>> 3] >>> (7 - (idx & 7))) & 1) !== 0; idx++; }
      }
    }
    var MASKS = [
      function (x, y) { return (x + y) % 2 === 0; }, function (x, y) { return y % 2 === 0; }, function (x, y) { return x % 3 === 0; },
      function (x, y) { return (x + y) % 3 === 0; }, function (x, y) { return (Math.floor(x / 3) + Math.floor(y / 2)) % 2 === 0; },
      function (x, y) { return x * y % 2 + x * y % 3 === 0; }, function (x, y) { return (x * y % 2 + x * y % 3) % 2 === 0; },
      function (x, y) { return ((x + y) % 2 + x * y % 3) % 2 === 0; }
    ];
    function applyMask(m) { for (var y = 0; y < size; y++) for (var x = 0; x < size; x++) if (!fn[y][x] && MASKS[m](x, y)) mod[y][x] = !mod[y][x]; }
    function penalty() {
      var res = 0, x, y, i;
      function runs(get) {
        for (var a = 0; a < size; a++) {
          var run = 1, prev = get(a, 0);
          for (var b = 1; b < size; b++) { var c = get(a, b); if (c === prev) { run++; if (run === 5) res += 3; else if (run > 5) res++; } else { run = 1; prev = c; } }
        }
      }
      runs(function (a, b) { return mod[a][b]; }); runs(function (a, b) { return mod[b][a]; });
      for (y = 0; y < size - 1; y++) for (x = 0; x < size - 1; x++) { var c = mod[y][x]; if (c === mod[y][x + 1] && c === mod[y + 1][x] && c === mod[y + 1][x + 1]) res += 3; }
      var pat = [true, false, true, true, true, false, true, false, false, false, false];
      function fin(get) {
        for (var a = 0; a < size; a++) for (var b = 0; b <= size - 11; b++) {
          var m1 = true, m2 = true;
          for (var k = 0; k < 11; k++) { if (get(a, b + k) !== pat[k]) m1 = false; if (get(a, b + k) !== pat[10 - k]) m2 = false; }
          if (m1) res += 40; if (m2) res += 40;
        }
      }
      fin(function (a, b) { return mod[a][b]; }); fin(function (a, b) { return mod[b][a]; });
      var dark = 0; for (y = 0; y < size; y++) for (x = 0; x < size; x++) if (mod[y][x]) dark++;
      var total = size * size, k2 = Math.ceil(Math.abs(dark * 20 - total * 10) / total) - 1; res += Math.max(0, k2) * 10;
      return res;
    }
    var best = 0, bestP = Infinity;
    for (var m = 0; m < 8; m++) { applyMask(m); drawFormat(m); var p = penalty(); if (p < bestP) { bestP = p; best = m; } applyMask(m); }
    applyMask(best); drawFormat(best);
    return { size: size, modules: mod, version: v, mask: best };
  }
  NB.qr = build;
  NB.qrSvg = function (text, opts) {
    opts = opts || {}; var q = build(text), border = opts.border == null ? 4 : opts.border, s = q.size + border * 2, d = [];
    for (var y = 0; y < q.size; y++) for (var x = 0; x < q.size; x++) if (q.modules[y][x]) d.push('M' + (x + border) + ',' + (y + border) + 'h1v1h-1z');
    return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ' + s + ' ' + s + '" shape-rendering="crispEdges" role="img" aria-label="' + (opts.label || 'QR code') + '"><rect width="100%" height="100%" fill="#fff"/><path d="' + d.join('') + '" fill="#000"/></svg>';
  };
})();
