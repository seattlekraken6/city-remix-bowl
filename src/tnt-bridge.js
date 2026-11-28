/*
  TNTgames bridge
  ---------------
  Connects this game to www.tntgames.fun when it's played there (inside the site's game frame).
  Played on its own, the game works as usual and the Feedback button opens tntgames.fun/feedback.

  Set up once:
    TNTBridge.init({ game: "retro-rink" });

  Then the game can call:
    TNTBridge.feedback()            opens the site's feedback form (the game is paused while it's open)
    TNTBridge.on("pause", fn)       the site asks the game to pause (a window opened over it)
    TNTBridge.on("resume", fn)      the window closed
    TNTBridge.season(done, total)   reports season progress (e.g. 9 of 17 weeks); the site may use it for stats
    TNTBridge.embedded              true when the game is running inside tntgames.fun

  The game's saves stay in the player's own browser, as before.
  This file is the same in every TNTgames game. The original lives in the tntgames repo.
*/

(function () {
  var SITE = "https://www.tntgames.fun";
  var PORTALS = [
    /^https:\/\/(www\.)?tntgames\.fun$/,
    /^https:\/\/seattlekraken6-tntgames(-[a-z0-9-]+)?\.vercel\.app$/,
    /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/
  ];

  var embedded = false;
  try { embedded = window.parent !== window; } catch (e) { embedded = true; }

  var game = "";
  var portal = null; // the site's origin, once it has answered
  var handlers = { pause: [], resume: [] };

  function send(msg) {
    if (!embedded) return;
    msg.tnt = 1;
    try { window.parent.postMessage(msg, portal || "*"); } catch (e) { /* ignore */ }
  }

  window.addEventListener("message", function (e) {
    if (e.source !== window.parent || !PORTALS.some(function (re) { return re.test(e.origin); })) return;
    var m = e.data;
    if (!m || m.tnt !== 1) return;
    portal = e.origin;
    if (m.type === "pause" || m.type === "resume") {
      api.paused = m.type === "pause";
      handlers[m.type].forEach(function (fn) { try { fn(); } catch (err) { console.error(err); } });
    }
  });

  var api = {
    embedded: embedded,
    paused: false,
    init: function (options) {
      game = String((options && options.game) || "");
      send({ type: "hello", game: game });
      return api;
    },
    on: function (event, fn) { if (handlers[event]) handlers[event].push(fn); return api; },
    season: function (done, total) {
      if (total > 0) send({ type: "season", done: Number(done) || 0, total: Number(total) });
    },
    feedback: function () {
      if (embedded && portal) send({ type: "feedback" });
      else window.open(SITE + "/feedback?game=" + encodeURIComponent(game), "_blank", "noopener");
    }
  };

  window.TNTBridge = api;
})();
