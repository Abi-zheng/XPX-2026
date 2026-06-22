/**
 * 原型 · 时间格式统一
 * 学校端 / 平台端展示：YYYY-MM-DD HH:mm:ss
 * 家长端展示：YYYY-MM-DD
 */
(function (global) {
  var PROTO_NOW = '2026-06-21 15:30:00';

  function normalizeDateTime(str) {
    if (str == null || str === '') return '';
    if (str === '—') return '—';
    str = String(str).trim();
    if (/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/.test(str)) return str;
    if (/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}$/.test(str)) return str + ':00';
    if (/^\d{4}-\d{2}-\d{2}$/.test(str)) return str + ' 00:00:00';
    return str;
  }

  function formatDateTimeFull(str) {
    if (!str || str === '—') return '—';
    return normalizeDateTime(str);
  }

  function formatDateOnly(str) {
    if (!str || str === '—') return '—';
    var s = String(str).trim();
    var m = s.match(/^(\d{4}-\d{2}-\d{2})/);
    return m ? m[1] : s;
  }

  function nowDateTimeFull() {
    return PROTO_NOW;
  }

  global.ProtoDateTime = {
    PROTO_NOW: PROTO_NOW,
    normalizeDateTime: normalizeDateTime,
    formatDateTimeFull: formatDateTimeFull,
    formatDateOnly: formatDateOnly,
    nowDateTimeFull: nowDateTimeFull
  };
})(typeof window !== 'undefined' ? window : this);
