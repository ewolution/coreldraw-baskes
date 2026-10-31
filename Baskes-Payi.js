/*
  Baskes Payi  ·  CorelDRAW (JavaScript)
  ---------------------------------------------------------------
  Magenta kesim cizgileri (CMYK 0/100/0/0) BASKIYA GITMEZ.
  Bu betik kesim cizgilerine HIC DOKUNMAZ ve onlardan kopya uretmez.
  Tasma payi yalnizca ASIL ISTEN (dolgulu nesnelerden) uretilir.

  Her dolgulu parcanin ALTINA; kendi renginde, 2 mm tasan bir kopya
  koyar:
    - duz renk  -> 4 mm kontur (cizginin ortasina cizilir, 2 mm disari)
    - degrade   -> disa dogru 2 mm KONTUR EFEKTI (degrade devam eder)

  Kopyalar sayfada, hedefin hemen arkasinda olusur (grup icinde degil).

  Kurulum: bu dosyayi
    %APPDATA%\Corel\CorelDRAW Graphics Suite 20xx\Draw\Scripts\
  klasorune kopyalayin. CorelDRAW > Araclar > Komut Dosyalari.
*/

var SURUM = "1.0.0";

var AYAR = {
  payMM: 2.0,
  kesimCmyk: [0, 100, 0, 0],
  kesimTolerans: 0.5,
  degradeKontur: true,
  onek: "BLEED_"
};

(function () {
  "use strict";

  var CDR_MILLIMETER = 3;
  var CDR_INCH = 1;
  var PT_PER_MM = 2.83464566929134;

  var doc = null;
  var oldUnit = null;
  var grupAcik = false;
  var konturMm = true;

  // ------------------------------------------------------------------
  // Host yardimcilari
  // ------------------------------------------------------------------

  function dene(fn, varsayilan) {
    try { return fn(); } catch (e) { return varsayilan; }
  }

  function P(obj, ad) {
    if (!obj) return null;
    var v = dene(function () { return obj[ad]; }, null);
    if (typeof v === "function") {
      var c = dene(function () { return v.call(obj); }, null);
      if (c !== null && c !== undefined) return c;
    }
    return v;
  }

  function M(obj, ad, a1, a2, a3, a4) {
    if (!obj) return null;
    var self = obj;
    switch (arguments.length - 2) {
      case 0: return dene(function () { return self[ad](); }, null);
      case 1: return dene(function () { return self[ad](a1); }, null);
      case 2: return dene(function () { return self[ad](a1, a2); }, null);
      case 3: return dene(function () { return self[ad](a1, a2, a3); }, null);
      case 4: return dene(function () { return self[ad](a1, a2, a3, a4); }, null);
    }
    return null;
  }

  function it(coll, i) {
    if (!coll) return null;
    var v = dene(function () { return coll.Item(i); }, null);
    if (v) return v;
    v = dene(function () { return coll(i); }, null);
    if (v) return v;
    v = dene(function () { return coll[i - 1]; }, null);
    return v || null;
  }

  function adet(coll) {
    if (!coll) return 0;
    var n = dene(function () { return coll.Count; }, null);
    if (typeof n === "function") n = dene(function () { return n.call(coll); }, null);
    if (typeof n === "number") return n;
    n = dene(function () { return coll.length; }, 0);
    return typeof n === "number" ? n : 0;
  }

  function msg(text) {
    alert("Baskes Payi v" + SURUM + "\n\n" + text);
  }

  function num(v) { return Math.round(v * 100) / 100; }

  // ------------------------------------------------------------------
  // Renk
  // ------------------------------------------------------------------

  function sayi(v) {
    if (typeof v === "number") return isFinite(v) ? v : null;
    if (typeof v === "string" && v !== "" && !isNaN(Number(v))) return Number(v);
    return null;
  }

  function cmykOf(color) {
    if (!color) return null;
    var c = sayi(P(color, "CMYKCyan"));
    var m = sayi(P(color, "CMYKMagenta"));
    var y = sayi(P(color, "CMYKYellow"));
    var k = sayi(P(color, "CMYKBlack"));
    if (c === null || m === null || y === null || k === null) return null;
    return { c: c, m: m, y: y, k: k };
  }

  function isCutCmyk(cmyk) {
    if (!cmyk) return false;
    var t = AYAR.kesimTolerans;
    return Math.abs(cmyk.c - AYAR.kesimCmyk[0]) <= t &&
           Math.abs(cmyk.m - AYAR.kesimCmyk[1]) <= t &&
           Math.abs(cmyk.y - AYAR.kesimCmyk[2]) <= t &&
           Math.abs(cmyk.k - AYAR.kesimCmyk[3]) <= t;
  }

  function yakin(a, b, tolerans) {
    if (!a || !b) return false;
    return Math.abs(a.c - b.c) <= tolerans &&
           Math.abs(a.m - b.m) <= tolerans &&
           Math.abs(a.y - b.y) <= tolerans &&
           Math.abs(a.k - b.k) <= tolerans;
  }

  function fillInfo(shape) {
    var fill = P(shape, "Fill");
    var type = P(fill, "Type");
    var info = {
      type: type, hasFill: false, supported: false, cut: false,
      uniformColor: null, fountain: null, cmyk: null, startColor: null
    };

    if (type === 1) {
      info.hasFill = true;
      var u = P(fill, "UniformColor");
      var uc = cmykOf(u);
      info.uniformColor = u;
      info.cmyk = uc;
      info.startColor = u;
      info.cut = isCutCmyk(uc);
      info.supported = !info.cut;
    } else if (type === 2) {
      info.hasFill = true;
      info.supported = true;
      info.fountain = P(fill, "Fountain");
      info.startColor = P(info.fountain, "StartColor");
      info.cmyk = fountainAvg(info.fountain);
    } else if (type !== 0 && type !== null && type !== undefined) {
      info.hasFill = true;
    }

    return info;
  }

  function fountainAvg(f) {
    if (!f) return null;
    var a = cmykOf(P(f, "StartColor"));
    var b = cmykOf(P(f, "EndColor"));
    if (a && b) {
      return { c: (a.c + b.c) / 2, m: (a.m + b.m) / 2, y: (a.y + b.y) / 2, k: (a.k + b.k) / 2 };
    }
    if (a) return a;
    if (b) return b;

    var cols = P(f, "Colors");
    var first = cmykOf(P(P(cols, "First"), "Color"));
    var last = cmykOf(P(P(cols, "Last"), "Color"));
    if (first && last) {
      return { c: (first.c + last.c) / 2, m: (first.m + last.m) / 2,
               y: (first.y + last.y) / 2, k: (first.k + last.k) / 2 };
    }
    return first || last || null;
  }

  function applyOutlineColor(shape, cmyk, sourceColor) {
    var outline = P(shape, "Outline");
    if (!outline) return false;
    var c = P(outline, "Color");
    if (!c) return false;

    if (cmyk) {
      dene(function () { M(c, "CMYKAssign", cmyk.c, cmyk.m, cmyk.y, cmyk.k); });
      if (outlineOk(shape, cmyk)) return true;
    }

    if (sourceColor) {
      var src = cmykOf(sourceColor);
      dene(function () { M(c, "CopyAssign", sourceColor); });
      if (outlineOk(shape, src)) return true;
    }

    return false;
  }

  function outlineOk(shape, beklenen) {
    var o = P(shape, "Outline");
    if (!o) return false;
    var got = cmykOf(P(o, "Color"));
    if (!got) return true;
    if (isCutCmyk(got)) return false;
    if (beklenen && !yakin(got, beklenen, 12)) return false;
    return true;
  }

  // ------------------------------------------------------------------
  // Nesne yardimcilari
  // ------------------------------------------------------------------

  function shapesOf(collection) {
    var list = [];
    var n = adet(collection);
    for (var i = 1; i <= n; i++) {
      var s = it(collection, i);
      if (s) list.push(s);
    }
    return list;
  }

  function childList(shape) {
    return shapesOf(P(shape, "Shapes"));
  }

  function isPowerClip(shape) {
    return !!P(shape, "PowerClip");
  }

  function isBleedShape(shape) {
    var name = P(shape, "Name") || "";
    return String(name).substring(0, AYAR.onek.length) === AYAR.onek;
  }

  function moveToSameLayer(kopya, kaynak) {
    var x = P(kopya, "PositionX");
    var y = P(kopya, "PositionY");
    M(kopya, "MoveToLayer", P(kaynak, "Layer"));
    if (x !== null) {
      var nx = P(kopya, "PositionX");
      var ny = P(kopya, "PositionY");
      if (typeof nx === "number" && typeof ny === "number") {
        var dx = x - nx, dy = y - ny;
        if (dx !== 0 || dy !== 0) M(kopya, "Move", dx, dy);
      }
    }
  }

  function restoreSelection(shapes) {
    M(doc, "ClearSelection");
    for (var i = 0; i < shapes.length; i++) M(shapes[i], "AddToSelection");
  }

  function collectLeaves(shape, out) {
    var kids = childList(shape);
    if (kids.length) {
      for (var i = 0; i < kids.length; i++) collectLeaves(kids[i], out);
      return out;
    }
    out.push(shape);
    return out;
  }

  function hasArtworkLeaves(leaves) {
    for (var i = 0; i < leaves.length; i++) {
      if (fillInfo(leaves[i]).supported) return true;
    }
    return false;
  }

  // ------------------------------------------------------------------
  // Kontur efekti (degrade icin)
  // ------------------------------------------------------------------

  function effectCount(shape) {
    return adet(P(shape, "Effects"));
  }

  function contourBleed(shape, stat) {
    var outline = P(shape, "Outline");
    if (outline) dene(function () { outline.Type = 0; });

    var onceki = effectCount(shape);
    var tipOnce = P(shape, "Type");
    var off = AYAR.payMM;
    var donus = "-";
    var hata = "";

    var denemeler = [
      function () { return shape.CreateContour(1, off, 1); },
      function () { return shape.CreateContour(1, off, 1, 0); },
      function () { return shape.CreateContour(1, off, 1, 0, undefined, undefined, undefined, 0, 0, 0, 4, 0); }
    ];

    for (var i = 0; i < denemeler.length; i++) {
      var eff = null;
      try {
        eff = denemeler[i]();
      } catch (e) {
        if (!hata) hata = (e && e.message) ? String(e.message) : String(e);
      }
      if (i === 0) donus = eff ? "obje" : String(eff);

      if (eff || effectCount(shape) > onceki) {
        stat.kontur++;
        return true;
      }
    }

    if (!stat.tani) {
      stat.tani = "kontur: tip " + tipOnce + "->" + P(shape, "Type") +
                  ", efekt " + onceki + "->" + effectCount(shape) +
                  ", donus " + donus + (hata ? ", hata: " + hata : "");
    }

    return false;
  }

  // Dolgu kopyalama (degradeyi tasma halkasina bindirmek icin)
  function fillCopy(target, sourceFill) {
    var f = P(target, "Fill");
    if (!f || !sourceFill) return false;

    dene(function () { M(f, "CopyAssign", sourceFill); });

    var t = P(f, "Type");
    var s = P(sourceFill, "Type");
    return (t === s);
  }

  function makeClone(leaf, target) {
    var kopya = M(leaf, "Clone");
    if (!kopya) return null;
    moveToSameLayer(kopya, target);
    return kopya;
  }

  // PLAN B: kontur efektine gerek yok.
  // Kopyaya 4 mm kontur ver, konturu nesneye cevir (halka), halkaya
  // orijinal degradeyi kopyala, kopyayi sil, halkayi hedefin arkasina koy.
  function ringBleed(leaf, target, width, stat) {
    var k = makeClone(leaf, target);
    if (!k) return false;

    var o = P(k, "Outline");
    if (!o) { M(k, "Delete"); return false; }

    dene(function () { o.Type = 1; });
    dene(function () { o.Width = width; });

    var ring = dene(function () { return o.ConvertToObject(); }, null);
    if (!ring) {
      if (!stat.tani) stat.tani = "halka: ConvertToObject bos";
      M(k, "Delete");
      return false;
    }

    var srcFill = P(k, "Fill");
    var n = adet(ring);
    var parcalar = [];
    if (n > 0) {
      for (var i = 1; i <= n; i++) {
        var p = it(ring, i);
        if (p) parcalar.push(p);
      }
    } else {
      parcalar.push(ring);
    }

    var ok = false;
    for (var j = 0; j < parcalar.length; j++) {
      var parca = parcalar[j];

      // Halkada kontur kalmasin
      var po = P(parca, "Outline");
      if (po) dene(function () { po.Type = 0; });

      if (fillCopy(parca, srcFill)) ok = true;
    }

    if (!ok) {
      if (!stat.tani) {
        stat.tani = "halka: dolgu kopyalanamadi (dolgu tipi " + P(srcFill, "Type") + ")";
      }
      M(k, "Delete");
      M(ring, "Delete");
      return false;
    }

    M(k, "Delete");

    for (var m = 0; m < parcalar.length; m++) {
      dene(function () { parcalar[m].OrderBackOf(target); });
      dene(function () { parcalar[m].Name = AYAR.onek + (P(leaf, "Name") || ""); });
    }

    stat.halka++;
    return true;
  }

  function bleedLeaf(leaf, target, width, stat) {
    var info = fillInfo(leaf);

    // Kesim cizgisi veya dolgusuz parca: kopya uretme
    if (!info.hasFill || info.cut) return;

    if (!info.supported) {
      stat.desteksiz++;
      return;
    }

    if (info.type === 1) stat.duz++;
    else if (info.type === 2) stat.degrade++;

    // 1) Degrade: kontur efekti (en temiz yol)
    if (info.type === 2 && AYAR.degradeKontur) {
      var k1 = makeClone(leaf, target);
      if (k1) {
        if (contourBleed(k1, stat)) {
          dene(function () { k1.OrderBackOf(target); });
          dene(function () { k1.Name = AYAR.onek + (P(leaf, "Name") || ""); });
          stat.eklenen++;
          return;
        }
        M(k1, "Delete");
      }
    }

    // 2) Degrade: konturu nesneye cevir + orijinal degradeyi bindir
    if (info.type === 2) {
      if (ringBleed(leaf, target, width, stat)) {
        stat.eklenen++;
        return;
      }
    }

    // 3) Duz renk (veya ustekiler olmadi): 4 mm kontur
    var kopya = makeClone(leaf, target);
    if (!kopya) {
      stat.atlanan++;
      return;
    }

    var ok = false;
    var outline = P(kopya, "Outline");
    if (outline) {
      dene(function () { outline.Type = 1; });
      dene(function () { outline.Width = width; });
      dene(function () { outline.LineJoin = 1; });

      ok = applyOutlineColor(kopya, info.cmyk, info.startColor);
      if (!ok) stat.renksiz++;
    } else {
      stat.hata++;
    }

    if (ok) {
      dene(function () { kopya.OrderBackOf(target); });
      dene(function () { kopya.Name = AYAR.onek + (P(leaf, "Name") || ""); });
      stat.eklenen++;
    } else {
      M(kopya, "Delete");
      stat.atlanan++;
    }
  }

  // ------------------------------------------------------------------
  // Secim / sayfa
  // ------------------------------------------------------------------

  function readSelection() {
    var adaylar = [];
    function ekle(a) {
      if (!a) return;
      try {
        if (typeof a === "function") a = a();
      } catch (e) { return; }
      for (var i = 0; i < adaylar.length; i++) {
        if (adaylar[i] === a) return;
      }
      adaylar.push(a);
    }

    ekle(P(host, "ActiveSelection"));
    ekle(P(host, "ActiveSelectionRange"));
    ekle(P(host.ActiveDocument, "Selection"));

    for (var c = 0; c < adaylar.length; c++) {
      var shapes = shapesOf(P(adaylar[c], "Shapes"));
      if (!shapes.length) shapes = shapesOf(adaylar[c]);
      if (shapes.length) return shapes;
    }

    return [];
  }

  function pageShapes(page) {
    var list = [];
    var layers = P(page, "Layers");
    var n = adet(layers);

    for (var i = 1; i <= n; i++) {
      var layer = it(layers, i);
      if (!layer) continue;
      if (P(layer, "IsSpecialLayer")) continue;
      var shapes = shapesOf(P(layer, "Shapes"));
      for (var j = 0; j < shapes.length; j++) list.push(shapes[j]);
    }

    return list;
  }

  // ------------------------------------------------------------------
  // Kontur birimi probu
  // ------------------------------------------------------------------

  function probeLayer() {
    var page = P(doc, "ActivePage");
    if (!page) return null;

    var active = P(page, "ActiveLayer");
    if (active && P(active, "Editable") !== false) return active;

    var layers = P(page, "Layers");
    var n = adet(layers);
    for (var i = 1; i <= n; i++) {
      var layer = it(layers, i);
      if (!layer) continue;
      if (P(layer, "IsSpecialLayer")) continue;
      if (P(layer, "Editable") === false) continue;
      return layer;
    }
    return null;
  }

  function probeOutlineUnits() {
    var layer = probeLayer();
    if (!layer) return false;

    var test = M(layer, "CreateRectangle", 0, 0, 1, 1);
    if (!test) return false;

    var result = false;
    try {
      var o = P(test, "Outline");
      dene(function () { o.Type = 1; });
      dene(function () { o.Width = 1; });

      dene(function () { doc.Unit = CDR_INCH; });
      var inc = P(P(test, "Outline"), "Width");

      dene(function () { doc.Unit = CDR_MILLIMETER; });
      var mm = P(P(test, "Outline"), "Width");

      if (typeof inc === "number" && typeof mm === "number") {
        result = Math.abs(inc - mm) > 0.0001;
      }
    } catch (e) {
      result = false;
    } finally {
      M(test, "Delete");
      dene(function () { doc.Unit = CDR_MILLIMETER; });
    }

    return result;
  }

  // ------------------------------------------------------------------
  // main
  // ------------------------------------------------------------------

  try {
    doc = P(host, "ActiveDocument");
    if (!doc) {
      msg("Açık bir belge yok. Önce CorelDRAW'da dosyanızı açın.");
      return;
    }

    oldUnit = P(doc, "Unit");
    dene(function () { doc.Unit = CDR_MILLIMETER; });
    dene(function () { host.Optimization = true; });

    var secilen = readSelection();
    var hedefler = secilen;
    var secimVar = secilen.length > 0;

    if (!secimVar) hedefler = pageShapes(P(doc, "ActivePage"));

    if (!hedefler.length) {
      msg("İşlenecek nesne bulunamadı.");
      return;
    }

    M(doc, "BeginCommandGroup", "Baskes payi ekle");
    grupAcik = true;

    konturMm = probeOutlineUnits();
    var kalinlik = AYAR.payMM * 2 * (konturMm ? 1 : PT_PER_MM);

    if (secimVar) restoreSelection(secilen);

    var stat = {
      eklenen: 0, atlanan: 0, kesim: 0, duz: 0, degrade: 0,
      desteksiz: 0, renksiz: 0, hata: 0, kontur: 0, halka: 0, tani: ""
    };

    for (var i = 0; i < hedefler.length; i++) {
      var shape = hedefler[i];

      if (isBleedShape(shape) || isPowerClip(shape)) {
        stat.atlanan++;
        continue;
      }

      var leaves = collectLeaves(shape, []);

      if (!hasArtworkLeaves(leaves)) {
        stat.atlanan++;
        stat.kesim++;
        continue;
      }

      for (var li = 0; li < leaves.length; li++) {
        bleedLeaf(leaves[li], shape, kalinlik, stat);
      }
    }

    M(doc, "EndCommandGroup");
    grupAcik = false;

    var text =
      "Taşma payı eklendi.\n\n" +
      "Mod: " + (secimVar ? "seçili nesneler" : "sayfa") + "\n" +
      "Eklenen kopya: " + stat.eklenen + "\n" +
      "Atlanan nesne: " + stat.atlanan + " (bunların " + stat.kesim + " tanesi sadece kesim çizgisi)\n" +
      "Dolgu: düz " + stat.duz + " · degrade " + stat.degrade +
      " · desteklenmeyen " + stat.desteksiz + "\n" +
      "Degrade taşma: kontur efekti " + stat.kontur +
      " · halka (degrade kopya) " + stat.halka + "\n" +
      "Pay: " + num(AYAR.payMM) + " mm (düz renkte kontur " + num(AYAR.payMM * 2) + " mm)\n" +
      "Kontur birimi: " + (konturMm ? "mm" : "pt") + "\n\n" +
      "Kesim çizgilerine (CMYK " + AYAR.kesimCmyk.join("/") + ") dokunulmadı.\n" +
      "Geri almak için: Ctrl+Z";

    if (stat.renksiz > 0) {
      text += "\n\nUyarı: " + stat.renksiz +
              " parçada kontur rengi uygulanamadı, taşma almadı.";
    }
    if (stat.hata > 0) {
      text += "\n\nUyarı: " + stat.hata + " parçada kontur ayarlanamadı.";
    }
    if (stat.degrade > 0 && stat.kontur === 0 && stat.halka === 0) {
      text += "\n\nDegrade taşma yöntemleri çalışmadı. " + stat.tani +
              "\n(Degradeler düz ortalama renkle taşlandı.)";
    }

    if (secimVar) restoreSelection(secilen);

    msg(text);
  } catch (e) {
    if (grupAcik) {
      dene(function () { M(doc, "EndCommandGroup"); });
      grupAcik = false;
    }
    msg("Hata: " + (e && e.message ? e.message : e));
  } finally {
    dene(function () { host.Optimization = false; });
    dene(function () { if (doc && oldUnit !== null) doc.Unit = oldUnit; });
  }
})();
