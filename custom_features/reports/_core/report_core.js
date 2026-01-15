(function () {
  const RC = (window.ReportCore = window.ReportCore || {});
  window.ReportTable = ReportTable;
  window.ReportColumn = ReportColumn;

  RC.util = RC.util || (function () {
    function safeStr(v) {
      return v === null || v === undefined ? "" : String(v);
    }

    function msToPretty(ms) {
      const n = Number(ms);
      if (!Number.isFinite(n) || n < 0) return "n/a";
      if (n < 1000) return `${Math.round(n)} ms`;
      const s = n / 1000;
      if (s < 60) return `${s.toFixed(1)} s`;
      const m = s / 60;
      if (m < 60) return `${m.toFixed(1)} min`;
      const h = m / 60;
      return `${h.toFixed(1)} hr`;
    }

    function parseTs(v) {
      if (v === null || v === undefined) return NaN;

      let s = String(v).trim().replace(/\u00A0/g, "");
      s = s.replace(/^["']+/, "").replace(/["']+$/, "");

      // Use Date constructor, not Date.parse (Canvas seems to have patched Date.parse)
      const d = new Date(s);
      const t = d.getTime();
      return Number.isFinite(t) ? t : NaN;
    }

    function fmtDateTime(v) {
      const t = parseTs(v);
      if (!Number.isFinite(t)) return "n/a";
      return new Date(t).toLocaleString();
    }

    function daysAgo(v) {
      const t = parseTs(v);
      if (!Number.isFinite(t)) return NaN;
      return (Date.now() - t) / (1000 * 60 * 60 * 24);
    }

    async function httpGetJson(url) {
      if (window.bridgetools?.req) {
        const resp = await window.bridgetools.req(url);
        return resp?.data ?? resp;
      }
      const resp = await fetch(url, { credentials: "include" });
      if (!resp.ok) throw new Error(`GET failed: ${resp.status}`);
      return await resp.json();
    }

    return { safeStr, msToPretty, parseTs, fmtDateTime, daysAgo, httpGetJson };
  })();

  RC.ui = RC.ui || (function () {
    function stripVueTemplate(vueFileText) {
      return String(vueFileText || "")
        .replace(/^[\s\S]*?<template>/i, "")
        .replace(/<\/template>[\s\S]*$/i, "")
        .trim();
    }

    async function loadTemplateHtml(templateUrl) {
      let vueText = "";
      await $.get(templateUrl, null, (txt) => (vueText = txt), "text");
      return stripVueTemplate(vueText);
    }

    async function mountIntoContentWithTemplate({
      templateUrl,
      hostId,
      rootId,
      contentSelector = "#content",
    }) {
      const content = document.querySelector(contentSelector);
      if (!content) {
        console.error(`Expected ${contentSelector} on page, but it was not found.`);
        return null;
      }

      const templateHtml = await loadTemplateHtml(templateUrl);

      content.innerHTML = "";
      const host = document.createElement("div");
      host.id = hostId;
      host.innerHTML = templateHtml;
      content.appendChild(host);

      const root = host.querySelector(`#${rootId}`);
      if (!root) {
        console.error(`Template must contain an element with id='${rootId}'`);
        return null;
      }

      return root;
    }

    return { mountIntoContentWithTemplate };
  })();
})();
