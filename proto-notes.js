/**
 * 产品批注（原型专用 · 非正式页面内容）
 *
 * 模块必填：功能目的、业务逻辑、交互逻辑、字段说明、数据逻辑、状态流转、影响范围、异常处理、当前版本范围
 * 模块选填：权限逻辑、统计指标、埋点需求、消息通知、审批流程、扩展规划
 * 页面选填：扩展规划（page.extension）
 */

function protoMark(num, title) {
  title = title || ('见右侧批注 ' + num);
  return '<span class="proto-mark" title="' + title + '">' + num + '</span>';
}

/** 简版模块卡片（兼容旧页） */
function buildProtoNotesHtml(notes) {
  return notes.map(function (n) {
    var rows =
      '<div class="proto-note-row"><b>位置</b>' + n.position + '</div>' +
      '<div class="proto-note-row type"><b>类型</b><span>' + n.type + '</span></div>' +
      '<div class="proto-note-row"><b>说明</b>' + n.desc + '</div>';
    if (n.ux) rows += '<div class="proto-note-row"><b>体验要求</b>' + n.ux + '</div>';
    if (n.rule) rows += '<div class="proto-note-row"><b>规则要求</b>' + n.rule + '</div>';
    if (n.sample) rows += '<div class="proto-scan-sample">' + n.sample + '</div>';
    return (
      '<article class="proto-note-card" id="proto-note-' + n.num + '">' +
        '<div class="proto-note-num">' + n.num + '</div>' +
        '<div class="proto-note-body">' + rows + '</div>' +
      '</article>'
    );
  }).join('');
}

function buildModuleField(label, text, optional) {
  if (!text) return '';
  var cls = optional ? ' proto-module-field-optional' : '';
  var tag = optional ? ' <span class="proto-optional-tag">选填</span>' : '';
  return (
    '<div class="proto-module-field' + cls + '">' +
      '<b>' + label + tag + '</b><p>' + text + '</p>' +
    '</div>'
  );
}

function buildDataLogicBlock(data) {
  if (!data) return '';
  var d = data;
  if (typeof d === 'string') {
    return buildModuleField('数据逻辑', d);
  }
  var rows =
    (d.source ? '<div class="proto-data-row"><b>数据来源</b><p>' + d.source + '</p></div>' : '') +
    (d.update ? '<div class="proto-data-row"><b>更新方式</b><p>' + d.update + '</p></div>' : '') +
    (d.timing ? '<div class="proto-data-row"><b>更新时机</b><p>' + d.timing + '</p></div>' : '') +
    (d.sync ? '<div class="proto-data-row"><b>同步逻辑</b><p>' + d.sync + '</p></div>' : '') +
    (d.calc ? '<div class="proto-data-row"><b>计算逻辑</b><p>' + d.calc + '</p></div>' : '');
  if (!rows) return '';
  return (
    '<div class="proto-module-field proto-data-logic">' +
      '<b>数据逻辑</b>' +
      '<div class="proto-data-logic-body">' + rows + '</div>' +
    '</div>'
  );
}

function buildModuleCard(m) {
  var purpose = m.purpose || m.func;
  var logic = m.logic || m.rules;
  var interaction = m.interaction;
  if (m.buttons && interaction) {
    interaction = interaction + ' 按钮：' + m.buttons;
  } else if (m.buttons) {
    interaction = '按钮：' + m.buttons;
  }
  var stateFlow = m.stateFlow || m.state;
  var impact = m.impact || m.impactScope;

  var body =
    buildModuleField('功能目的', purpose) +
    buildModuleField('业务逻辑', logic) +
    buildModuleField('交互逻辑', interaction) +
    buildModuleField('字段说明', m.fields) +
    buildDataLogicBlock(m.data || m.dataLogic) +
    buildModuleField('状态流转', stateFlow) +
    buildModuleField('影响范围', impact) +
    buildModuleField('异常处理', m.exception) +
    buildModuleField('当前版本范围', m.scope) +
    buildModuleField('权限逻辑', m.permission, true) +
    buildModuleField('统计指标', m.metrics, true) +
    buildModuleField('埋点需求', m.tracking, true) +
    buildModuleField('消息通知', m.notify, true) +
    buildModuleField('审批流程', m.approval, true) +
    buildModuleField('扩展规划', m.extension, true);

  return (
    '<article class="proto-module-card" id="proto-note-' + m.num + '">' +
      '<div class="proto-module-head">' +
        '<div class="proto-note-num">' + m.num + '</div>' +
        '<div class="module-name">' + m.name + '</div>' +
      '</div>' +
      '<div class="proto-module-body">' + body + '</div>' +
    '</article>'
  );
}

function buildOptionalPageBlock(title, text) {
  if (!text) return '';
  return (
    '<article class="proto-module-card proto-module-card-optional">' +
      '<div class="proto-module-head">' +
        '<div class="module-name">' + title + ' <span class="proto-optional-tag">选填</span></div>' +
      '</div>' +
      '<div class="proto-module-body"><p>' + text + '</p></div>' +
    '</article>'
  );
}

/**
 * @param {object} page - { name, goal, structure, modules[], extension?, future?, notify?, approval? }
 */
function buildFullProtoNotesSection(page) {
  var meta =
    '<div class="proto-page-meta">' +
      '<div class="pm-name"><i class="fas fa-file-lines"></i> ' + page.name + '</div>' +
      '<div class="pm-block"><b>页面目标</b>' + page.goal + '</div>' +
      '<div class="pm-block"><b>页面结构</b>' + page.structure + '</div>' +
      (page.designPrinciples ? '<div class="pm-block"><b>设计规范遵循</b>' + page.designPrinciples + '</div>' : '') +
    '</div>';

  var modules = (page.modules || []).map(buildModuleCard).join('');
  var ext = page.extension || page.future;

  var optionalFooter =
    buildOptionalPageBlock('扩展规划', ext) +
    buildOptionalPageBlock('消息通知', page.notify) +
    buildOptionalPageBlock('审批流程', page.approval);

  var footer = optionalFooter
    ? '<div class="proto-footer-block">' + optionalFooter + '</div>'
    : '';

  return (
    '<section class="proto-notes-section" aria-label="产品批注">' +
      '<div class="proto-notes-header">' +
        '<div class="proto-notes-header-row">' +
          '<h3><i class="fas fa-clipboard-list"></i> 产品批注</h3>' +
          protoNotesToggleBtn(true) +
        '</div>' +
        '<span class="proto-notes-badge">仅原型说明 · 非用户可见正式内容</span>' +
      '</div>' +
      '<div class="proto-notes-body">' + meta +
      '<div class="proto-notes-grid">' + modules + footer + '</div></div>' +
    '</section>'
  );
}

function protoNotesToggleBtn(expanded) {
  var label = expanded ? '收起' : '展开';
  var icon = expanded ? 'fa-chevron-right' : 'fa-chevron-left';
  return (
    '<button type="button" class="proto-notes-toggle" aria-expanded="' + (expanded ? 'true' : 'false') + '" title="' + label + '产品批注">' +
      '<i class="fas ' + icon + '"></i> ' + label +
    '</button>'
  );
}

function renderProtoNotesSection(notes) {
  return (
    '<section class="proto-notes-section" aria-label="产品批注与开发注意点">' +
      '<div class="proto-notes-header">' +
        '<div class="proto-notes-header-row">' +
          '<h3><i class="fas fa-clipboard-list"></i> 产品批注 / 开发注意点</h3>' +
          protoNotesToggleBtn(true) +
        '</div>' +
        '<span class="proto-notes-badge">仅原型说明 · 非用户可见正式内容</span>' +
      '</div>' +
      '<div class="proto-notes-body">' +
      '<div class="proto-notes-grid">' + buildProtoNotesHtml(notes) + '</div></div>' +
    '</section>'
  );
}

var PROTO_NOTES_STORAGE_KEY = 'protoNotesCollapsed';

function getProtoNotesScope(section) {
  return section.closest('.page-with-notes')
    || section.closest('.layout')
    || section.closest('.proto-page-shell')
    || section.parentElement;
}

function setProtoNotesCollapsed(scope, collapsed) {
  if (!scope) return;
  scope.classList.toggle('proto-notes-collapsed', collapsed);
  document.documentElement.classList.toggle('proto-notes-collapsed', collapsed);
  var btn = scope.querySelector('.proto-notes-toggle');
  if (btn) {
    btn.setAttribute('aria-expanded', collapsed ? 'false' : 'true');
    btn.innerHTML = collapsed
      ? '<i class="fas fa-chevron-left"></i> 展开'
      : '<i class="fas fa-chevron-right"></i> 收起';
    btn.title = (collapsed ? '展开' : '收起') + '产品批注';
  }
  try {
    sessionStorage.setItem(PROTO_NOTES_STORAGE_KEY, collapsed ? '1' : '0');
  } catch (e) {}
}

function ensureProtoNotesStructure(section) {
  if (!section || section.dataset.protoStructured === '1') return;
  var header = section.querySelector('.proto-notes-header');
  if (!header) return;

  if (!header.querySelector('.proto-notes-header-row')) {
    var h3 = header.querySelector('h3');
    var badge = header.querySelector('.proto-notes-badge');
    var row = document.createElement('div');
    row.className = 'proto-notes-header-row';
    if (h3) row.appendChild(h3);
    row.insertAdjacentHTML('beforeend', protoNotesToggleBtn(true));
    header.innerHTML = '';
    header.appendChild(row);
    if (badge) header.appendChild(badge);
  } else if (!header.querySelector('.proto-notes-toggle')) {
    header.querySelector('.proto-notes-header-row').insertAdjacentHTML('beforeend', protoNotesToggleBtn(true));
  }

  if (!section.querySelector('.proto-notes-body')) {
    var body = document.createElement('div');
    body.className = 'proto-notes-body';
    Array.from(section.children).forEach(function (ch) {
      if (ch !== header) body.appendChild(ch);
    });
    section.appendChild(body);
  }

  section.dataset.protoStructured = '1';
}

function bindProtoNotesToggle(section) {
  ensureProtoNotesStructure(section);
  if (section.dataset.protoToggleBound === '1') return;
  section.dataset.protoToggleBound = '1';

  var scope = getProtoNotesScope(section);
  var btn = section.querySelector('.proto-notes-toggle');
  if (!btn || !scope) return;

  btn.addEventListener('click', function () {
    var collapsed = !scope.classList.contains('proto-notes-collapsed');
    setProtoNotesCollapsed(scope, collapsed);
  });

  try {
    if (sessionStorage.getItem(PROTO_NOTES_STORAGE_KEY) === '1') {
      setProtoNotesCollapsed(scope, true);
    }
  } catch (e) {}
}

function initProtoNotesPanels(root) {
  var sections;
  if (root) {
    var el = typeof root === 'string' ? document.querySelector(root) : root;
    sections = el ? (el.classList && el.classList.contains('proto-notes-section')
      ? [el]
      : Array.from(el.querySelectorAll('.proto-notes-section'))) : [];
  } else {
    sections = Array.from(document.querySelectorAll('.proto-notes-section'));
  }
  sections.forEach(bindProtoNotesToggle);
}

window.initProtoNotesPanels = initProtoNotesPanels;
window.mountProtoNotes = function (mount, html) {
  var el = typeof mount === 'string' ? document.getElementById(mount) : mount;
  if (!el) return;
  el.innerHTML = html;
  initProtoNotesPanels(el);
};

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', function () { initProtoNotesPanels(); });
} else {
  initProtoNotesPanels();
}
