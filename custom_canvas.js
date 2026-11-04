/* Canvas theme entry point. The v2 bootstrap owns all feature loading. */
(function () {
  'use strict';
  if (window.self !== window.top || window.BTECH_CANVAS_V2_BOOTSTRAPPED || window.BTECH_CANVAS_V2_BOOTSTRAP_LOADING) return;
  window.BTECH_CANVAS_V2_BOOTSTRAP_LOADING = true;

  var base = window.SOURCE_URL || 'https://bridgetools.dev/canvas';
  var url = base + '/custom_canvas_v2.js';
  var script = document.createElement('script');
  script.src = window.btechAssetUrl ? window.btechAssetUrl(url) : url;
  script.async = true;
  script.onerror = function () {
    window.BTECH_CANVAS_V2_BOOTSTRAP_LOADING = false;
    console.error('[BTECH v2] Failed to load bootstrap:', script.src);
  };
  document.head.appendChild(script);
}());
