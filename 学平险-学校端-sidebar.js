/**
 * 学校端统一侧栏
 * 一级菜单（业务）：统计看板、学生档案、班级投保名单、投保二维码、风险事件登记、安全教育
 * 系统管理（置底，可收起，仅校级管理员可见）：组织与成员、操作日志
 * active: dashboard | studentProfile | enrollList | qrcode | riskEvent | safetyEdu | members | audit
 */
(function() {
  var STORAGE_PREFIX = 'schoolNav_';

  var NAV = [
    { type: 'item', key: 'dashboard',      icon: 'chart-pie',            href: '学平险-学校端--统计看板.html',     label: '统计看板' },
    { type: 'item', key: 'studentProfile', icon: 'address-card',         href: '学平险-学校端--学生档案.html',     label: '学生档案' },
    { type: 'item', key: 'enrollList',     icon: 'list-check',           href: '学平险-学校端--班级投保名单.html', label: '班级投保名单' },
    { type: 'item', key: 'qrcode',         icon: 'qrcode',               href: '学平险-学校端--投保二维码.html',   label: '投保二维码' },
    { type: 'item', key: 'riskEvent',      icon: 'triangle-exclamation', href: '学平险-学校端--风险事件登记.html', label: '风险事件登记' },
    { type: 'item', key: 'safetyEdu',      icon: 'shield-halved',        href: '学平险-学校端--安全教育.html',     label: '安全教育' },
    {
      type: 'group',
      key: 'sys',
      label: '系统管理',
      icon: 'cogs',
      children: [
        { key: 'members', icon: 'sitemap',         href: '学平险-学校端--组织与成员.html', label: '组织与成员' },
        { key: 'audit',   icon: 'clipboard-list',  href: '学平险-学校端--操作日志.html',   label: '操作日志' }
      ]
    }
  ];

  var KEY_TO_GROUP = { members: 'sys', audit: 'sys' };

  function itemHtml(key, icon, href, label, active, isSub) {
    var ac = key === active ? ' active' : '';
    var sub = isSub ? ' nav-sub-item' : '';
    return '<div class="nav-item' + sub + ac + '"><i class="fas fa-' + icon + '"></i><a href="' + href + '"><span>' + label + '</span></a></div>';
  }

  function groupContainsActive(group, active) {
    return group.children.some(function(c) { return c.key === active; });
  }

  function hasStoredNavState() {
    return sessionStorage.getItem(STORAGE_PREFIX + 'sys') != null;
  }

  function isGroupExpanded(groupKey, active) {
    if (!hasStoredNavState()) return true;
    var stored = sessionStorage.getItem(STORAGE_PREFIX + groupKey);
    if (stored === '1') return true;
    if (stored === '0') return false;
    return KEY_TO_GROUP[active] === groupKey;
  }

  function setGroupExpanded(el, groupKey, expanded) {
    var group = el.querySelector('.nav-group[data-group="' + groupKey + '"]');
    if (!group) return;
    var head = group.querySelector('.nav-group-head');
    group.classList.toggle('collapsed', !expanded);
    head.setAttribute('aria-expanded', expanded ? 'true' : 'false');
    sessionStorage.setItem(STORAGE_PREFIX + groupKey, expanded ? '1' : '0');
  }

  function ensureActiveGroupOpen(el, active) {
    var activeGroup = KEY_TO_GROUP[active];
    if (!activeGroup) return;
    setGroupExpanded(el, activeGroup, true);
  }

  function groupHtml(group, active) {
    var expanded = isGroupExpanded(group.key, active);
    var collapsedClass = expanded ? '' : ' collapsed';
    var hasActiveChild = groupContainsActive(group, active);
    var headActive = hasActiveChild ? ' nav-group-head-active' : '';

    var childrenHtml = group.children.map(function(c) {
      return itemHtml(c.key, c.icon, c.href, c.label, active, true);
    }).join('\n          ');

    return (
      '<div class="nav-group' + collapsedClass + '" data-group="' + group.key + '">' +
        '<button type="button" class="nav-group-head' + headActive + '" aria-expanded="' + expanded + '">' +
          '<i class="fas fa-' + group.icon + ' nav-group-icon"></i>' +
          '<span class="nav-group-label">' + group.label + '</span>' +
          '<i class="fas fa-chevron-down nav-group-chevron"></i>' +
        '</button>' +
        '<div class="nav-group-children">' + childrenHtml + '</div>' +
      '</div>'
    );
  }

  function bindSidebarToggle(el) {
    el.querySelectorAll('.nav-group-head').forEach(function(head) {
      head.addEventListener('click', function() {
        var group = head.closest('.nav-group');
        var key = group.getAttribute('data-group');
        var willExpand = group.classList.contains('collapsed');
        group.classList.toggle('collapsed');
        head.setAttribute('aria-expanded', willExpand ? 'true' : 'false');
        sessionStorage.setItem(STORAGE_PREFIX + key, willExpand ? '1' : '0');
      });
    });
  }

  /* ============ 当前账号（全局会话） ============
   * #原型说明：以下账号为示例，正式接入时由登录接口写入 sessionStorage。
   * 角色固定为三类：admin（校级）/ grade（年级组长）/ class（班主任）；
   * 其它页面通过 window.SchoolAccount.role 读取当前角色用于数据过滤；
   * 「系统管理」侧栏分组仅 admin 可见，与平台 RBAC「系统管理全开」一致。
   */
  var ACCOUNT_STORE_KEY = 'schoolAccountId';
  var ACCOUNTS = [
    { id:'admin', name:'张敏',  gender:'f', role:'admin', roleLabel:'校级管理员',         scopeText:'立德中学 · 全校 36 个班级' },
    { id:'grade', name:'李建华',gender:'m', role:'grade', roleLabel:'高一年级组长',       scopeText:'高一年级 · 任职范围内 3 个班级' },
    { id:'class', name:'王芳',  gender:'f', role:'class', roleLabel:'高一(3)班 班主任',   scopeText:'高一(3)班 · 仅本班' }
  ];

  function loadAccount() {
    var id = sessionStorage.getItem(ACCOUNT_STORE_KEY);
    return ACCOUNTS.find(function(a){ return a.id===id; }) || ACCOUNTS[0];
  }

  var listeners = [];
  window.SchoolAccount = {
    accounts: ACCOUNTS,
    get current() { return loadAccount(); },
    get role()    { return loadAccount().role; },
    get name()    { return loadAccount().name; },
    switchTo: function(id) {
      var a = ACCOUNTS.find(function(x){ return x.id===id; });
      if(!a) return;
      sessionStorage.setItem(ACCOUNT_STORE_KEY, id);
      listeners.forEach(function(cb){ try{ cb(a); }catch(e){} });
    },
    onChange: function(cb) { if(typeof cb==='function') listeners.push(cb); }
  };

  function avatarHtml(a, sizeCls) {
    return '<div class="um-avatar'+(a.gender==='f'?' f':'')+(sizeCls?' '+sizeCls:'')+'">'+a.name.charAt(0)+'</div>';
  }

  function bindUserMenu(rootEl) {
    var menu = rootEl.querySelector('.user-menu');
    if (!menu) return;
    var trigger = menu.querySelector('.user-menu-trigger');
    trigger.addEventListener('click', function(e){
      e.stopPropagation();
      menu.classList.toggle('open');
    });
    document.addEventListener('click', function(e){
      if(!menu.contains(e.target)) menu.classList.remove('open');
    });
    menu.querySelectorAll('.um-account').forEach(function(item){
      item.addEventListener('click', function(){
        window.SchoolAccount.switchTo(item.getAttribute('data-id'));
        renderUserMenu(rootEl);
        menu.classList.remove('open');
      });
    });
  }

  function isSchoolAdmin() {
    return (window.SchoolAccount && SchoolAccount.role) === 'admin';
  }

  function navEntriesForRole() {
    return NAV.filter(function(entry) {
      if (entry.type === 'group' && entry.key === 'sys') return isSchoolAdmin();
      return true;
    });
  }

  var sidebarLastActive = 'dashboard';

  function renderUserMenu(rootEl) {
    var cur = loadAccount();
    var orgLink = isSchoolAdmin()
      ? '<a class="um-link" href="学平险-学校端--组织与成员.html"><i class="fas fa-user-gear"></i>组织与成员</a>'
      : '';
    var accountsHtml = ACCOUNTS.map(function(a){
      var ac = a.id===cur.id ? ' active' : '';
      return '<div class="um-account'+ac+'" data-id="'+a.id+'">'+
               avatarHtml(a) +
               '<div class="um-text"><b>'+a.name+'</b><small>'+a.roleLabel+'</small></div>'+
               '<i class="fas fa-check um-check"></i>'+
             '</div>';
    }).join('');

    rootEl.innerHTML =
      '<div class="user-menu" id="userMenuRoot">'+
        '<button type="button" class="user-menu-trigger">'+
          avatarHtml(cur)+
          '<div class="um-info"><span class="um-name">'+cur.name+'</span><span class="um-role">'+cur.roleLabel+'</span></div>'+
          '<i class="fas fa-chevron-down um-chev"></i>'+
        '</button>'+
        '<div class="user-menu-dropdown">'+
          '<div class="um-section">当前账号</div>'+
          accountsHtml+
          '<div class="um-divider"></div>'+
          orgLink+
          '<a class="um-link danger" href="学平险-学校端--登录.html"><i class="fas fa-sign-out-alt"></i>退出登录</a>'+
        '</div>'+
      '</div>';

    bindUserMenu(rootEl);
  }

  /**
   * 在右上角挂载当前账号菜单。
   * @param {string|HTMLElement} mount  容器选择器或元素（建议在 .top-bar 的 .actions 中）
   * @param {Function} [onChange]       账号切换回调（用于页面重渲染）
   */
  window.initSchoolUserMenu = function(mount, onChange) {
    var el = typeof mount === 'string' ? document.querySelector(mount) : mount;
    if (!el) return;
    renderUserMenu(el);
    if (typeof onChange === 'function') {
      window.SchoolAccount.onChange(function(a){
        renderUserMenu(el);
        try{ onChange(a); }catch(e){}
      });
    }
  };

  window.initSchoolSidebar = function(active) {
    var el = document.getElementById('schoolSidebar');
    if (!el) return;

    active = active || sidebarLastActive || 'dashboard';
    sidebarLastActive = active;
    var parts = [
      '<div class="logo-area">',
      '  <div class="logo-icon"><i class="fas fa-shield-heart"></i></div>',
      '  <div><div class="logo-text">立德中学</div><div class="logo-module">学校端</div></div>',
      '</div>',
      '<nav class="school-nav-main" aria-label="学校端主导航">'
    ];

    navEntriesForRole().forEach(function(entry) {
      if (entry.type === 'item') {
        parts.push(itemHtml(entry.key, entry.icon, entry.href, entry.label, active, false));
      } else if (entry.type === 'group') {
        parts.push(groupHtml(entry, active));
      }
    });

    parts.push('</nav>');
    parts.push('<div class="school-nav-footer">');
    parts.push(itemHtml('_help',   'compass',       '学平险-学校端--双端说明.html',                 '双端说明', active, false));
    parts.push(itemHtml('_nav',    'th-large',      '学平险-学校端--原型导航.html',       '原型导航', active, false));
    parts.push(itemHtml('_logout', 'sign-out-alt',  '学平险-学校端--登录.html',                     '退出登录', active, false));
    parts.push('</div>');

    el.innerHTML = parts.join('\n        ');
    bindSidebarToggle(el);
    ensureActiveGroupOpen(el, active);
  };

  /* 切换账号后刷新侧栏（隐藏/显示系统管理）；账号菜单由 initSchoolUserMenu 自行重绘 */
  if (!window._schoolSidebarAccountBound) {
    window._schoolSidebarAccountBound = true;
    window.SchoolAccount.onChange(function() {
      var el = document.getElementById('schoolSidebar');
      if (el) window.initSchoolSidebar(sidebarLastActive);
    });
  }
})();
