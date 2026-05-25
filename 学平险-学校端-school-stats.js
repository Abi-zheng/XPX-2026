/**
 * #原型说明：学校端演示数据与统计口径（各页共用）
 * - 在册 576 人 · 6 年级 12 班（与班级投保名单 ALL_CLASSES 一致）
 * - 统计学期默认 2026 春季（REFERENCE_TODAY 2026-06-01）
 * - 已投保/未投保：按投保日期归属学期（termCodeFromDate）
 */
(function (global) {
  var REFERENCE_TODAY = '2026-06-01';
  var statTermOverride = null;

  var SCHOOL_TERM_DEFS = {
    '2026秋季': { label: '2026 秋季', coverageStart: '2026-09-01', coverageEnd: '2027-01-31', coverageText: '2026-09-01 至 2027-01-31', enrollHint: '8月下旬—10月底' },
    '2026春季': { label: '2026 春季', coverageStart: '2026-02-01', coverageEnd: '2026-08-31', coverageText: '2026-02-01 至 2026-08-31', enrollHint: '1月下旬—5月底' },
    '2025秋季': { label: '2025 秋季', coverageStart: '2025-09-01', coverageEnd: '2026-01-31', coverageText: '2025-09-01 至 2026-01-31', enrollHint: '8月下旬—10月底' },
    '2025春季': { label: '2025 春季', coverageStart: '2025-02-01', coverageEnd: '2025-08-31', coverageText: '2025-02-01 至 2025-08-31', enrollHint: '1月下旬—5月底' }
  };
  var TERM_SELECT_OPTIONS = ['2026秋季', '2026春季', '2025秋季', '2025春季'];
  var GRADE_DISPLAY_ORDER = ['高三年级', '高二年级', '高一年级', '初三年级', '初二年级', '初一年级'];

  /* 班级建制：total/insured/uninsured 为 2026 春季演示口径（各年级加总 576 / 515 / 61） */
  var ALL_CLASSES = [
    { id: 'g3-1', grade: '高三年级', name: '高三(1)班', teacher: '李建华', total: 52, insured: 50, uninsured: 2 },
    { id: 'g3-2', grade: '高三年级', name: '高三(2)班', teacher: '陈志强', total: 50, insured: 49, uninsured: 1 },
    { id: 'g3-3', grade: '高三年级', name: '高三(3)班', teacher: '刘文', total: 48, insured: 43, uninsured: 5 },
    { id: 'g2-1', grade: '高二年级', name: '高二(1)班', teacher: '王芳', total: 50, insured: 46, uninsured: 4 },
    { id: 'g2-2', grade: '高二年级', name: '高二(2)班', teacher: '赵敏', total: 49, insured: 45, uninsured: 4 },
    { id: 'g1-3', grade: '高一年级', name: '高一(3)班', teacher: '王芳', total: 46, insured: 38, uninsured: 8 },
    { id: 'g1-2', grade: '高一年级', name: '高一(2)班', teacher: '孙宁', total: 48, insured: 42, uninsured: 6 },
    { id: 'g1-1', grade: '高一年级', name: '高一(1)班', teacher: '郑国华', total: 50, insured: 42, uninsured: 8 },
    { id: 'c3-2', grade: '初三年级', name: '初三(2)班', teacher: '吴海', total: 45, insured: 36, uninsured: 9 },
    { id: 'c3-3', grade: '初三年级', name: '初三(3)班', teacher: '马涛', total: 46, insured: 38, uninsured: 8 },
    { id: 'c2-4', grade: '初二年级', name: '初二(4)班', teacher: '郭静', total: 44, insured: 39, uninsured: 5 },
    { id: 'c1-1', grade: '初一年级', name: '初一(1)班', teacher: '许涛', total: 48, insured: 47, uninsured: 1 }
  ];

  var PROFILE_STUDENTS = [
    { id: 'S20240001', name: '李明远', cls: '高三(1)班', grade: '高三年级', contact: '李建国', insurance: [
      { product: '学平险 B 款', status: 'insured', date: '2026-02-10', coverage: '2026-02-01 至 2026-08-31' }
    ]},
    { id: 'S20240002', name: '王思琪', cls: '高三(2)班', grade: '高三年级', contact: '王芳', insurance: [
      { product: '学平险 B 款', status: 'insured', date: '2026-02-25', coverage: '2026-02-01 至 2026-08-31' }
    ]},
    { id: 'S20240003', name: '赵一航', cls: '高二(1)班', grade: '高二年级', contact: '赵东', insurance: [
      { product: '学平险 A 款', status: 'expired', date: '2025-09-01', coverage: '2025-09-01 至 2026-01-31' },
      { product: '学平险 B 款', status: 'insured', date: '2026-03-15', coverage: '2026-02-01 至 2026-08-31' }
    ]},
    { id: 'S20240004', name: '陈雨桐', cls: '高二(1)班', grade: '高二年级', contact: '陈敏', insurance: [
      { product: '学平险 A 款（民政补贴）', status: 'expired', date: '2025-09-01', coverage: '2025-09-01 至 2026-01-31' }
    ]},
    { id: 'S20240005', name: '刘子轩', cls: '高一(3)班', grade: '高一年级', contact: '刘伟', insurance: [
      { product: '学平险 B 款', status: 'insured', date: '2026-02-15', coverage: '2026-02-01 至 2026-08-31' }
    ]},
    { id: 'S20240006', name: '吴欣然', cls: '初三(2)班', grade: '初三年级', contact: '吴海芳', insurance: [
      { product: '学平险 A 款', status: 'expired', date: '2025-02-20', coverage: '2025-02-01 至 2025-08-31' }
    ]},
    { id: 'S20240007', name: '郑子涵', cls: '初三(3)班', grade: '初三年级', contact: '郑国华', insurance: [
      { product: '学平险 A 款', status: 'expired', date: '2025-03-01', coverage: '2025-02-01 至 2025-08-31' }
    ]},
    { id: 'S20240008', name: '林佳怡', cls: '初二(4)班', grade: '初二年级', contact: '林国栋', insurance: [
      { product: '学平险 B 款', status: 'insured', date: '2026-02-08', coverage: '2026-02-01 至 2026-08-31' }
    ]}
  ];

  var RECENT_RISK_EVENTS = [
    { lv: 'high', label: '较严重', time: '2026-05-19 14:22', title: '高三(1)班 · 体育课摔伤', meta: '李明远 · 右脚踝软组织扭伤，已就医并报案' },
    { lv: 'warn', label: '一般', time: '2026-05-18 10:08', title: '高二(1)班 · 课间碰撞', meta: '陈雨桐 · 额头轻微擦伤，校医室处理' },
    { lv: 'warn', label: '一般', time: '2026-05-15 12:30', title: '初三(3)班 · 食堂烫伤', meta: '郑子涵 · 左手背一级烫伤，跟踪中' },
    { lv: 'light', label: '轻微', time: '2026-05-08 11:18', title: '高一(3)班 · 课间打闹擦伤', meta: '刘子轩 · 校医处理，已通知家长' }
  ];

  var DEMO_META = { specialGroups: 43, healthWatch: 18 };

  function termCodeFromDate(dateStr) {
    if (!dateStr) return null;
    var y = parseInt(dateStr.slice(0, 4), 10);
    var m = parseInt(dateStr.slice(5, 7), 10);
    if (m >= 2 && m <= 8) return y + '春季';
    if (m >= 9 && m <= 12) return y + '秋季';
    return (y - 1) + '秋季';
  }

  function termLabelFromDate(dateStr) {
    var code = termCodeFromDate(dateStr);
    if (!code) return '—';
    var d = SCHOOL_TERM_DEFS[code];
    return d ? d.label : code;
  }

  function getStatTermCode() {
    return statTermOverride || termCodeFromDate(REFERENCE_TODAY);
  }

  function getStatTerm() {
    var code = getStatTermCode();
    return SCHOOL_TERM_DEFS[code] || SCHOOL_TERM_DEFS['2026春季'];
  }

  function setStatTermOverride(code) {
    statTermOverride = code || null;
  }

  function initFromUrl() {
    var qs = new URLSearchParams(global.location && global.location.search || '');
    var t = qs.get('today');
    if (t && /^\d{4}-\d{2}-\d{2}$/.test(t)) REFERENCE_TODAY = t;
    var term = qs.get('term');
    if (term && SCHOOL_TERM_DEFS[term]) statTermOverride = term;
  }

  function cloneClasses() {
    return ALL_CLASSES.map(function (c) {
      return Object.assign({}, c);
    });
  }

  function aggregateGradesFromClasses(classes) {
    var map = {};
    (classes || ALL_CLASSES).forEach(function (c) {
      if (!map[c.grade]) map[c.grade] = { name: c.grade, classes: 0, total: 0, insured: 0 };
      map[c.grade].classes += 1;
      map[c.grade].total += c.total;
      map[c.grade].insured += c.insured;
    });
    return GRADE_DISPLAY_ORDER.map(function (name) {
      var g = map[name];
      if (!g) return null;
      g.uninsured = g.total - g.insured;
      return g;
    }).filter(Boolean);
  }

  function schoolTotals(classes) {
    var list = classes || ALL_CLASSES;
    var total = 0;
    var insured = 0;
    list.forEach(function (c) {
      total += c.total;
      insured += c.insured;
    });
    var uninsured = total - insured;
    return {
      students: total,
      insured: insured,
      uninsured: uninsured,
      classes: list.length,
      grades: GRADE_DISPLAY_ORDER.filter(function (g) {
        return list.some(function (c) { return c.grade === g; });
      }).length,
      insuredRate: total ? (insured / total * 100).toFixed(1) : '—'
    };
  }

  function roleScopeTotals(role) {
    var list = ALL_CLASSES;
    if (role === 'grade') list = list.filter(function (c) { return c.grade === '高一年级'; });
    else if (role === 'class') list = list.filter(function (c) { return c.id === 'g1-3'; });
    return schoolTotals(list);
  }

  function fmt(n) {
    return Number(n).toLocaleString();
  }

  function getTermRecord(stu, termCode) {
    return (stu.insurance || []).find(function (i) {
      return i.status === 'insured' && termCodeFromDate(i.date) === termCode;
    });
  }

  function studentPoolFromProfile() {
    return PROFILE_STUDENTS.map(function (p) {
      return { id: p.id, name: p.name, cls: p.cls, grade: p.grade };
    });
  }

  function seedInsuredForClass(classId) {
    var c = ALL_CLASSES.find(function (x) { return x.id === classId; });
    return c ? c.insured : 0;
  }

  /** 名单页按学期生成填充人数：2026 春季与看板种子一致，其他学期按比例演示 */
  function targetInsuredForClass(cls, termCode) {
    if (termCode === '2026春季') return seedInsuredForClass(cls.id);
    if (termCode === '2026秋季') return Math.round(cls.total * (REFERENCE_TODAY >= '2026-09-01' ? 0.68 : 0.08));
    if (termCode === '2025秋季') return Math.round(cls.total * 0.85);
    if (termCode === '2025春季') return Math.round(cls.total * 0.82);
    return Math.round(cls.total * 0.75);
  }

  /* ===== 投保订单流水（家长端，与学生档案独立的数据源） =====
   * 订单 = 一次家长在投保通道上完成的支付记录。班级投保名单从订单数据汇总。
   * 与学生档案的关联：仅依赖「学生姓名 + 班级名」做匹配（订单上无学籍号字段）。
   */
  var FILL_NAMES = ['郭子玉','唐雅昕','周子衡','孙怡然','许泽洋','何心怡','黄佳明','梁婉婷','韦明轩','宋家瑶','何思雨','赵语彤','张晨曦','李书铭','王雨辰','陈紫萱','钱沐辰','徐若曦','冯瑞泽','郑欣然'];
  var FILL_CONTACTS = ['周明','张丽华','黄伟','何静','孙宁','刘文','郭静','许涛','张健','王雪','李刚','马莹'];
  var ORDER_PRODUCTS = ['学平险 B 款', '学平险 A 款', '学平险 A 款（民政补贴）'];
  var CHANNEL_LIST = ['家长端 H5', '家长端 H5', '家长端 H5', '家长端小程序', '家长端小程序', '线下补录'];

  function addDaysStr(dateStr, days) {
    var d = new Date(dateStr + 'T00:00:00');
    d.setDate(d.getDate() + days);
    var y = d.getFullYear();
    var m = String(d.getMonth() + 1).padStart(2, '0');
    var dd = String(d.getDate()).padStart(2, '0');
    return y + '-' + m + '-' + dd;
  }

  function maskPhone(seed) {
    var tail = String((Math.abs(hashStr(seed)) % 9000) + 1000);
    return '138****' + tail;
  }

  function hashStr(s) {
    var h = 0;
    for (var i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
    return h;
  }

  function parseCoverageRange(coverage) {
    if (!coverage) return { start: null, end: null };
    var m = String(coverage).match(/(\d{4}-\d{2}-\d{2})\s*至\s*(\d{4}-\d{2}-\d{2})/);
    return m ? { start: m[1], end: m[2] } : { start: null, end: null };
  }

  var ENROLLMENT_RECORDS = null;
  var orderSeq = 0;
  function nextOrderId(date) {
    orderSeq += 1;
    return 'EN' + date.replace(/-/g, '') + String(orderSeq).padStart(4, '0');
  }

  function buildEnrollmentRecords() {
    var records = [];

    /* 1) 学生档案中已支付的实际投保记录 → 转为订单流水 */
    PROFILE_STUDENTS.forEach(function (p) {
      (p.insurance || []).forEach(function (ins) {
        if (ins.status !== 'insured') return;
        var range = parseCoverageRange(ins.coverage);
        records.push({
          orderId: nextOrderId(ins.date),
          studentName: p.name,
          cls: p.cls,
          grade: p.grade,
          contact: p.contact,
          contactPhone: maskPhone(p.id + ins.date),
          product: ins.product,
          enrolledAt: ins.date,
          coverageStart: range.start,
          coverageEnd: range.end,
          channel: '家长端 H5'
        });
      });
    });

    /* 2) 按各班各学期的目标投保数补足填充订单（与档案不关联的"散户"投保） */
    var activeTermCode = termCodeFromDate(REFERENCE_TODAY);
    TERM_SELECT_OPTIONS.forEach(function (termCode) {
      var def = SCHOOL_TERM_DEFS[termCode];
      var isActiveTerm = termCode === activeTermCode;
      ALL_CLASSES.forEach(function (cls) {
        var target = targetInsuredForClass(cls, termCode);
        var existing = records.filter(function (r) {
          return r.cls === cls.name && termCodeFromDate(r.enrolledAt) === termCode;
        }).length;
        var fillCount = Math.max(0, target - existing);
        for (var i = 0; i < fillCount; i++) {
          var dayOffset = (i * 2 + 5) % 90;
          var d = addDaysStr(def.coverageStart, dayOffset);
          var seedKey = cls.id + termCode + i;
          var nIdx = Math.abs(hashStr(seedKey)) % FILL_NAMES.length;
          var cIdx = Math.abs(hashStr(seedKey + 'c')) % FILL_CONTACTS.length;
          var pIdx = Math.abs(hashStr(seedKey + 'p')) % ORDER_PRODUCTS.length;
          var chIdx = Math.abs(hashStr(seedKey + 'ch')) % CHANNEL_LIST.length;
          var nameSuffix = i >= FILL_NAMES.length ? '·' + Math.floor(i / FILL_NAMES.length) : '';

          /* 在当前活跃学期为每个班级混入「临近过期 / 已失效」示例：
           * - i = 0: 临近过期（剩 8 天）
           * - i = 1: 临近过期（剩 22 天）
           * - i = 2: 已失效（提前结束 10 天前）
           * 其余订单使用学期默认 coverageEnd（保障中）。 */
          var coverageEnd = def.coverageEnd;
          var product = ORDER_PRODUCTS[pIdx];
          if (isActiveTerm) {
            if (i === 0) {
              coverageEnd = addDaysStr(REFERENCE_TODAY, 8);
              product = '学平险 A 款（短期补充）';
            } else if (i === 1) {
              coverageEnd = addDaysStr(REFERENCE_TODAY, 22);
              product = '学平险 A 款（短期补充）';
            } else if (i === 2) {
              coverageEnd = addDaysStr(REFERENCE_TODAY, -10);
              product = '学平险 A 款（短期补充）';
            }
          }

          records.push({
            orderId: nextOrderId(d),
            studentName: FILL_NAMES[nIdx] + nameSuffix,
            cls: cls.name,
            grade: cls.grade,
            contact: FILL_CONTACTS[cIdx],
            contactPhone: maskPhone(seedKey),
            product: product,
            enrolledAt: d,
            coverageStart: def.coverageStart,
            coverageEnd: coverageEnd,
            channel: CHANNEL_LIST[chIdx]
          });
        }
      });
    });

    return records;
  }

  function getEnrollmentRecords() {
    if (!ENROLLMENT_RECORDS) ENROLLMENT_RECORDS = buildEnrollmentRecords();
    return ENROLLMENT_RECORDS;
  }

  function getEnrollmentsForClass(clsName, termCode) {
    return getEnrollmentRecords().filter(function (r) {
      if (r.cls !== clsName) return false;
      if (termCode && termCodeFromDate(r.enrolledAt) !== termCode) return false;
      return true;
    });
  }

  /** 按 姓名 + 班级 在学生档案中查找匹配（订单与档案的唯一关联方式） */
  function findProfileByNameAndClass(name, clsName) {
    return PROFILE_STUDENTS.find(function (p) {
      return p.name === name && p.cls === clsName;
    }) || null;
  }

  global.SchoolStats = {
    REFERENCE_TODAY: REFERENCE_TODAY,
    SCHOOL_TERM_DEFS: SCHOOL_TERM_DEFS,
    TERM_SELECT_OPTIONS: TERM_SELECT_OPTIONS,
    GRADE_DISPLAY_ORDER: GRADE_DISPLAY_ORDER,
    ALL_CLASSES: ALL_CLASSES,
    PROFILE_STUDENTS: PROFILE_STUDENTS,
    RECENT_RISK_EVENTS: RECENT_RISK_EVENTS,
    DEMO_META: DEMO_META,
    termCodeFromDate: termCodeFromDate,
    termLabelFromDate: termLabelFromDate,
    getStatTermCode: getStatTermCode,
    getStatTerm: getStatTerm,
    setStatTermOverride: setStatTermOverride,
    initFromUrl: initFromUrl,
    cloneClasses: cloneClasses,
    aggregateGradesFromClasses: aggregateGradesFromClasses,
    schoolTotals: schoolTotals,
    roleScopeTotals: roleScopeTotals,
    fmt: fmt,
    getTermRecord: getTermRecord,
    studentPoolFromProfile: studentPoolFromProfile,
    seedInsuredForClass: seedInsuredForClass,
    targetInsuredForClass: targetInsuredForClass,
    getEnrollmentRecords: getEnrollmentRecords,
    getEnrollmentsForClass: getEnrollmentsForClass,
    findProfileByNameAndClass: findProfileByNameAndClass,
    get referenceToday() { return REFERENCE_TODAY; },
    set referenceToday(v) { REFERENCE_TODAY = v; }
  };

  initFromUrl();
})(typeof window !== 'undefined' ? window : this);
