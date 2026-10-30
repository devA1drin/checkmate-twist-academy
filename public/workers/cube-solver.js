/* Kociemba two-phase solver (cubejs, MIT) running off the main thread. */
/* global importScripts, Cube */
importScripts("/vendor/cubejs/cube.js", "/vendor/cubejs/solve.js");
var ready = false;
function ensure() {
  if (!ready) {
    var t = Date.now();
    Cube.initSolver();
    ready = true;
    self.postMessage({ type: "ready", ms: Date.now() - t });
  }
}
function invert(alg) {
  return alg.trim().split(/\s+/).filter(Boolean).reverse().map(function (m) {
    if (m.endsWith("2")) return m;
    if (m.endsWith("'")) return m.slice(0, -1);
    return m + "'";
  }).join(" ");
}
self.onmessage = function (e) {
  var msg = e.data;
  try {
    if (msg.type === "init") { ensure(); return; }
    ensure();
    if (msg.type === "solve") {
      var cube = Cube.fromString(msg.facelets);
      var sol = cube.isSolved() ? "" : cube.solve(msg.maxDepth || 22);
      self.postMessage({ type: "result", id: msg.id, solution: sol });
    } else if (msg.type === "scramble") {
      var rnd = Cube.random();
      var state = rnd.asString();
      var solution = rnd.solve();
      self.postMessage({ type: "result", id: msg.id, scramble: invert(solution), state: state });
    }
  } catch (err) {
    self.postMessage({ type: "error", id: msg.id, error: String(err && err.message || err) });
  }
};
