/** B 端原型 · 列表筛选状态保持（sessionStorage，返回列表时恢复） */
(function () {
  function keyOf(name) {
    return 'proto_list_' + name;
  }

  window.ProtoListState = {
    save: function (name, state) {
      try { sessionStorage.setItem(keyOf(name), JSON.stringify(state || {})); } catch (e) { /* ignore */ }
    },
    load: function (name) {
      try {
        var raw = sessionStorage.getItem(keyOf(name));
        return raw ? JSON.parse(raw) : null;
      } catch (e) { return null; }
    },
    /** map: { stateField: 'inputElementId' } */
    collect: function (map) {
      var state = {};
      Object.keys(map).forEach(function (field) {
        var el = document.getElementById(map[field]);
        if (el) state[field] = el.value;
      });
      return state;
    },
    restore: function (name, map) {
      var state = ProtoListState.load(name);
      if (!state) return null;
      Object.keys(map).forEach(function (field) {
        var el = document.getElementById(map[field]);
        if (el && state[field] != null) el.value = state[field];
      });
      return state;
    },
    bindList: function (name, map, applyFn) {
      var state = ProtoListState.restore(name, map);
      if (state && applyFn) applyFn(state);
      return state;
    },
    hrefDetail: function (name, map, detailUrl, id) {
      ProtoListState.save(name, ProtoListState.collect(map));
      var sep = detailUrl.indexOf('?') >= 0 ? '&' : '?';
      return detailUrl + sep + 'id=' + encodeURIComponent(id);
    },
    hrefList: function (name, listUrl) {
      return listUrl;
    }
  };
})();
