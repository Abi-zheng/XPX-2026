/**
 * B 端表格分页（静态 tbody 或编程式 create）
 * 用法：<div class="pager" data-b-end-pager data-page-size="10"></div> + BEndPager.initAll()
 */
(function (global) {
  'use strict';

  var SIZES = [10, 20, 50];

  function parseIntSafe(v, fallback) {
    var n = parseInt(v, 10);
    return isNaN(n) || n < 1 ? fallback : n;
  }

  function pageList(current, total) {
    if (total <= 7) {
      var a = [];
      for (var i = 1; i <= total; i++) a.push(i);
      return a;
    }
    var pages = [1];
    if (current > 3) pages.push('…');
    for (var j = Math.max(2, current - 1); j <= Math.min(total - 1, current + 1); j++) {
      if (pages.indexOf(j) === -1) pages.push(j);
    }
    if (current < total - 2) pages.push('…');
    if (total > 1 && pages.indexOf(total) === -1) pages.push(total);
    return pages;
  }

  function findTable(host) {
    if (host.dataset.table) {
      return document.querySelector(host.dataset.table);
    }
    var card = host.closest('.card, .card-panel, .table-wrapper, .table-wrap');
    if (card) {
      var t = card.querySelector('table');
      if (t) return t;
    }
    var prev = host.previousElementSibling;
    while (prev) {
      if (prev.tagName === 'TABLE') return prev;
      var inner = prev.querySelector && prev.querySelector('table');
      if (inner) return inner;
      prev = prev.previousElementSibling;
    }
    return null;
  }

  function renderControls(container, state, onUpdate) {
    var total = state.total;
    var pageSize = state.pageSize;
    var current = state.current;
    var pages = Math.max(1, Math.ceil(total / pageSize));
    if (current > pages) current = pages;

    var sizeOpts = SIZES.map(function (s) {
      return '<option value="' + s + '"' + (s === pageSize ? ' selected' : '') + '>' + s + ' 条/页</option>';
    }).join('');

    var nums = pageList(current, pages).map(function (p) {
      if (p === '…') {
        return '<button type="button" class="pager-num is-ellipsis" disabled>…</button>';
      }
      return '<button type="button" class="pager-num' + (p === current ? ' is-active' : '') + '" data-page="' + p + '">' + p + '</button>';
    }).join('');

    container.innerHTML =
      '<span class="pager-total">共 <strong>' + total + '</strong> 条</span>' +
      '<label class="pager-size">每页<select class="pager-size-select" aria-label="每页条数">' + sizeOpts + '</select></label>' +
      '<nav class="pager-nav" aria-label="分页">' +
      '<button type="button" class="btn ghost pager-btn" data-act="prev"' + (current <= 1 ? ' disabled' : '') + '>上一页</button>' +
      '<span class="pager-nums">' + nums + '</span>' +
      '<button type="button" class="btn ghost pager-btn" data-act="next"' + (current >= pages ? ' disabled' : '') + '>下一页</button>' +
      '</nav>' +
      '<span class="pager-jump">前往<input type="number" class="pager-jump-input" min="1" max="' + pages + '" value="' + current + '" aria-label="页码">页' +
      '<button type="button" class="btn ghost pager-btn" data-act="jump">确定</button></span>';

    container.querySelector('.pager-size-select').addEventListener('change', function (e) {
      onUpdate({ pageSize: parseIntSafe(e.target.value, 10), current: 1 });
    });

    container.querySelector('[data-act="prev"]').addEventListener('click', function () {
      if (current > 1) onUpdate({ current: current - 1 });
    });

    container.querySelector('[data-act="next"]').addEventListener('click', function () {
      if (current < pages) onUpdate({ current: current + 1 });
    });

    container.querySelector('[data-act="jump"]').addEventListener('click', function () {
      var inp = container.querySelector('.pager-jump-input');
      var p = parseIntSafe(inp.value, current);
      p = Math.min(pages, Math.max(1, p));
      onUpdate({ current: p });
    });

    container.querySelectorAll('.pager-num[data-page]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        onUpdate({ current: parseIntSafe(btn.dataset.page, 1) });
      });
    });
  }

  function applyTableRows(table, current, pageSize) {
    var tbody = table.querySelector('tbody');
    if (!tbody) return { total: 0 };
    var rows = Array.prototype.slice.call(tbody.querySelectorAll('tr'));
    var total = rows.length;
    var start = (current - 1) * pageSize;
    rows.forEach(function (row, i) {
      row.style.display = i >= start && i < start + pageSize ? '' : 'none';
    });
    return { total: total };
  }

  function mount(host) {
    if (host._bEndPagerMounted) return;
    host._bEndPagerMounted = true;
    if (!host.classList.contains('pager')) host.classList.add('pager');

    var table = findTable(host);
    if (!table) return;

    var state = {
      pageSize: parseIntSafe(host.dataset.pageSize, 10),
      current: 1,
      total: 0
    };

    function refresh(patch) {
      if (patch) {
        if (patch.pageSize) state.pageSize = patch.pageSize;
        if (patch.current) state.current = patch.current;
      }
      var info = applyTableRows(table, state.current, state.pageSize);
      state.total = info.total;
      var pages = Math.max(1, Math.ceil(state.total / state.pageSize));
      if (state.current > pages) state.current = pages;
      applyTableRows(table, state.current, state.pageSize);
      renderControls(host, state, refresh);
    }

    refresh();
  }

  function create(options) {
    var container = typeof options.container === 'string'
      ? document.querySelector(options.container)
      : options.container;
    if (!container) return;

    if (!container.classList.contains('pager')) container.classList.add('pager');

    var state = {
      total: options.total || 0,
      pageSize: options.pageSize || 10,
      current: options.current || 1
    };

    function refresh(patch) {
      if (patch) {
        if (patch.pageSize != null) state.pageSize = patch.pageSize;
        if (patch.current != null) state.current = patch.current;
        if (patch.total != null) state.total = patch.total;
      }
      var pages = Math.max(1, Math.ceil(state.total / state.pageSize));
      if (state.current > pages) state.current = pages;
      renderControls(container, state, function (p) {
        refresh(p);
        if (options.onChange) options.onChange(state.current, state.pageSize);
      });
    }

    refresh();
    return { refresh: refresh, getState: function () { return Object.assign({}, state); } };
  }

  function initAll(root) {
    var scope = root || document;
    scope.querySelectorAll('[data-b-end-pager]').forEach(mount);
  }

  /** 动态表格重绘 tbody 后调用，重新统计条数并刷新分页 */
  function remount(host) {
    var el = typeof host === 'string' ? document.querySelector(host) : host;
    if (!el) return;
    el._bEndPagerMounted = false;
    mount(el);
  }

  global.BEndPager = {
    mount: mount,
    remount: remount,
    create: create,
    initAll: initAll
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () { initAll(); });
  } else {
    initAll();
  }
})(typeof window !== 'undefined' ? window : this);
