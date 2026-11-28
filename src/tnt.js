// tntgames.fun connection: pausing and the Feedback button.
// tnt-bridge.js (the shared TNTgames bridge) is built in just before this file.
if(window.TNTBridge)TNTBridge.init({game:'city-gridiron'});
function sendFeedback(){if(window.TNTBridge)TNTBridge.feedback();else window.open('https://www.tntgames.fun/feedback?game=city-gridiron','_blank','noopener');}
function fbTop(){return '<button class="btn ghost sm" data-a="feedback">Feedback</button>';}
