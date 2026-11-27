/*
  TNTgames bridge
  ---------------
  Connects this game to www.tntgames.fun when it's played there (inside the site's game frame).
  Played on its own, it does nothing except open the feedback page.

  Set up once, before the game's own scripts read their saves:
    TNTBridge.init({ game: "retro-rink", keys: ["retro-rink-"] });   // localStorage keys (prefixes) that hold the saves

  Then the game can call:
    TNTBridge.season(done, total)   after each regular-season game/race (e.g. 9 of 17 weeks played)
    TNTBridge.on("pause", fn)       the site asks the game to pause (a sign-in or feedback window opened)
    TNTBridge.on("resume", fn)      the window closed
    TNTBridge.feedback()            opens the feedback form
    TNTBridge.embedded              true when the game is running inside tntgames.fun

  Saves: whenever the game writes one of its save keys, the bridge sends a copy to the site, which
  backs it up to the player's account if they're signed in. When the account has a newer save
  (from another device), the site sends it here, the bridge writes it into localStorage and reloads
  the game so it starts from that save.

  This file is the same in every TNTgames game. The original lives in the tntgames repo.
*/

(function () {
  var SITE = "https://www.tntgames.fun";
  var PORTALS = [
    /^https:\/\/(www\.)?tntgames\.fun$/,
    /^https:\/\/seattlekraken6-tntgames(-[a-z0-9-]+)?\.vercel\.app$/,
    /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/
  ];
  var META = "tnt-bridge-meta";

  var embedded = false;
  try { embedded = window.parent !== window; } catch (e) { embedded = true; }

  var cfg = { game: "", keys: [] };
  var portal = null;          // the site's origin, once it has answered
  var signedIn = false;
  var handlers = { pause: [], resume: [] };
  var applying = false;
  var saveTimer = null;

  function isPortal(origin) { return PORTALS.some(function (re) { return re.test(origin); }); }

  function send(msg) {
    if (!embedded) return;
    msg.tnt = 1;
    try { window.parent.postMessage(msg, portal || "*"); } catch (e) { /* ignore */ }
  }

  function tracked(key) {
    return typeof key === "string" && cfg.keys.some(function (p) { return key.indexOf(p) === 0; });
  }

  function storage() { try { return window.localStorage; } catch (e) { return null; } }

  function readMeta() {
    var ls = storage();
    try { return JSON.parse((ls && ls.getItem(META)) || "{}") || {}; } catch (e) { return {}; }
  }
  function writeMeta(patch) {
    var ls = storage(); if (!ls) return;
    var m = readMeta();
    for (var k in patch) m[k] = patch[k];
    applying = true;
    try { ls.setItem(META, JSON.stringify(m)); } catch (e) { /* ignore */ }
    applying = false;
  }

  function snapshot() {
    var ls = storage(), data = {};
    if (!ls) return data;
    for (var i = 0; i < ls.length; i++) {
      var k = ls.key(i);
      if (tracked(k)) data[k] = ls.getItem(k);
    }
    return data;
  }

  function localInfo() {
    var m = readMeta();
    return { updatedAt: m.updatedAt || null, syncedAt: m.syncedAt || null, hasData: Object.keys(snapshot()).length > 0 };
  }

  function pushSave() {
    clearTimeout(saveTimer);
    if (!signedIn || !portal) return;
    var m = readMeta();
    var updatedAt = m.updatedAt || new Date().toISOString();
    if (!m.updatedAt) writeMeta({ updatedAt: updatedAt });
    send({ type: "save", data: snapshot(), updatedAt: updatedAt });
  }

  var infoTimer = null;
  function changed(key) {
    if (applying || !tracked(key)) return;
    writeMeta({ updatedAt: new Date().toISOString() });
    if (signedIn) { clearTimeout(saveTimer); saveTimer = setTimeout(pushSave, 1200); return; }
    // Signed out: just tell the site this device has progress, so it can back it up after sign-in.
    clearTimeout(infoTimer);
    infoTimer = setTimeout(function () { send({ type: "local", local: localInfo() }); }, 300);
  }

  // Notice every save the game makes, without changing the game's own save code.
  try {
    var proto = window.Storage && Storage.prototype;
    if (proto && embedded) {
      var origSet = proto.setItem, origRemove = proto.removeItem;
      proto.setItem = function (k, v) {
        var r = origSet.apply(this, arguments);
        if (this === storage()) changed(String(k));
        return r;
      };
      proto.removeItem = function (k) {
        var r = origRemove.apply(this, arguments);
        if (this === storage()) changed(String(k));
        return r;
      };
    }
  } catch (e) { /* storage blocked */ }

  // Replace this game's saves with the account's copy, then restart the game from it.
  function applyCloud(cloud) {
    var ls = storage();
    if (!ls || !cloud || !cloud.data || typeof cloud.data !== "object") return;
    applying = true;
    try {
      var old = [];
      for (var i = 0; i < ls.length; i++) { var k = ls.key(i); if (tracked(k)) old.push(k); }
      old.forEach(function (k) { ls.removeItem(k); });
      Object.keys(cloud.data).forEach(function (k) {
        if (tracked(k) && cloud.data[k] != null) ls.setItem(k, String(cloud.data[k]));
      });
    } finally {
      applying = false;
    }
    writeMeta({ updatedAt: cloud.updatedAt, syncedAt: cloud.updatedAt });
    location.reload();
  }

  window.addEventListener("message", function (e) {
    if (e.source !== window.parent || !isPortal(e.origin)) return;
    var m = e.data;
    if (!m || m.tnt !== 1) return;
    portal = e.origin;
    if (m.type === "account") {
      var was = signedIn;
      signedIn = !!m.signedIn;
      if (signedIn && !was && m.autoUpload) pushSave();
    } else if (m.type === "ask-local") {
      clearTimeout(infoTimer);
      send({ type: "local", local: localInfo(), reply: m.id });
    } else if (m.type === "upload") {
      pushSave();
    } else if (m.type === "load") {
      applyCloud(m.cloud);
    } else if (m.type === "synced") {
      if (m.updatedAt) writeMeta({ syncedAt: m.updatedAt });
    } else if (m.type === "pause" || m.type === "resume") {
      api.paused = m.type === "pause";
      handlers[m.type].forEach(function (fn) { try { fn(); } catch (err) { console.error(err); } });
    }
  });

  window.addEventListener("pagehide", function () { if (saveTimer) pushSave(); });

  var api = {
    embedded: embedded,
    paused: false,
    init: function (options) {
      cfg.game = String((options && options.game) || "");
      cfg.keys = [].concat((options && options.keys) || []);
      send({ type: "hello", game: cfg.game, local: localInfo() });
      return api;
    },
    on: function (event, fn) { if (handlers[event]) handlers[event].push(fn); return api; },
    season: function (done, total) {
      if (total > 0) send({ type: "season", done: Number(done) || 0, total: Number(total) });
    },
    feedback: function () {
      if (embedded && portal) send({ type: "feedback" });
      else window.open(SITE + "/feedback?game=" + encodeURIComponent(cfg.game), "_blank", "noopener");
    }
  };

  window.TNTBridge = api;
})();
