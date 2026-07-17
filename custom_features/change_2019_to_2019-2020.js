IMPORTED_FEATURE = {};
if (/^\/courses\/[0-9]+/.test(window.location.pathname)) {
  let _section = $('#section-tabs-header-subtitle');
  let _text = _section.text();
  let _new = _text.replace('2019', '2019/2020');
  _section.text(_new);
}