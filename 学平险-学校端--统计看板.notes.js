/** 统计看板 · 学校端 · 产品批注数据 */
window.SCHOOL_DASHBOARD_PROTO = {
  name: '统计看板 · 学校端',
  goal: '登录后默认落点；按<strong>统计学期</strong>展示本校（或角色范围内）<strong>建档人数</strong>与<strong>投保概况</strong>，并提供核心业务快捷入口。',
  structure: '顶栏（校名 + 当前学期 + 同步说明）→ 统计学期选择条 → 2 张 KPI → 近期风险事件摘要 → 快捷入口卡片；右侧产品批注栏（可展开/收起）。',
  designPrinciples: '①学期口径与班级投保名单完全一致；②已投保按家长端订单流水去重，与学籍/建档分离；③投保人数可大于建档总数，不以 100% 硬封顶；④看板只读汇总，明细跳转业务页；⑤风险摘要不受删档影响。',
  modules: [
    {
      num: '①',
      name: '统计学期切换',
      purpose: '切换统计维度，驱动 KPI 与副文案按学期重算。',
      logic:
        '与班级投保名单共用 <code>SchoolStats</code>：<br>' +
        '· 春季：2–8 月投保归属；秋季：9–12 月（及次年 1 月）归属。<br>' +
        '· 下拉可选近 4 个学期（2025/2026 春秋季）；默认按系统参考日期自动匹配当前学期。<br>' +
        '· 切换后更新顶栏学期、KPI 标签「{学期}已投保」；学期下拉项已含保障期起止。<br>' +
        '· 支持 URL 参数 <code>?term=2026春季</code> 与 session 持久化（正式环境），保证看板与名单页口径一致。',
      interaction: '选择学期 → 即时刷新 KPI；与班级投保名单跳转时建议携带同一 term。',
      fields: 'term_code、term_label、coverage_start、coverage_end、coverage_text',
      data: {
        source: 'SchoolStats.SCHOOL_TERM_DEFS / getStatTermCode',
        update: 'setStatTermOverride + renderKpis',
        timing: '下拉 change',
        sync: '与班级投保名单、操作日志「切换统计学期」联动',
        calc: 'termCodeFromDate(REFERENCE_TODAY) 为默认'
      },
      stateFlow: '自动匹配当前学期 ↔ 用户手动切换历史/未来学期。',
      impact: 'KPI ②③、顶栏文案、名单页若共用 override 则同步。',
      exception: '非法 term 忽略；学期无订单时已投保显示 0。',
      scope: '1.0 · D-01、D-04。',
      permission: '全部业务角色可见；数据范围见批注 ②。',
      tracking: 'dashboard_term_change（操作日志 module=统计看板）。'
    },
    {
      num: '②',
      name: 'KPI · 学生总数',
      purpose: '展示建制在册学生档案人数，作为投保率分母。',
      logic:
        '取自 <code>schoolTotals().students</code>，与「学生档案」列表在册人数一致。<br>' +
        '· <strong>不含</strong>已删除档案。<br>' +
        '· 按登录角色数据范围过滤：校级管理员=全校；年级组长=所辖年级；班主任=所辖班级（P1，原型暂未过滤）。',
      interaction: '只读展示；点击无跳转（可 P2 链至学生档案）。',
      fields: 'student_count（建档在册）',
      data: {
        source: 'student_profile 聚合 / ALL_CLASSES.total 汇总',
        update: '页面 load + 学期切换不直接影响总数',
        timing: '进入看板时',
        sync: '与学生档案增删改 eventual一致',
        calc: 'SUM(class.total) 或 profile COUNT'
      },
      stateFlow: '随档案池变化；删档后总数减少，历史订单不影响本 KPI。',
      impact: '投保率分母；班级投保名单各班级 total 加总应一致。',
      exception: '范围为 0 时投保率显示 —；作为已投保 KPI 的分母，<strong>不</strong>因已投保超过总数而调增。',
      scope: '1.0 · D-02。',
      permission: '按角色 scope 过滤。',
      metrics: '建档率、班级平均人数（P2）。'
    },
    {
      num: '③',
      name: 'KPI · {学期}已投保',
      purpose: '展示所选学期内家长端投保去重人数；在档案未全部建档时，人数可超过「学生总数」。',
      logic:
        '<strong>数据源</strong>：家长端投保订单流水（<code>summarizeTermEnrollment</code>），与<strong>学生档案独立</strong>。<br>' +
        '· 去重键：<code>班级 + 学生姓名</code>（与学籍号无关；未建档学生也可产生订单）。<br>' +
        '· 档案关联：仅按「姓名 + 班级」弱匹配，统计 <code>linkedProfile</code> / <code>unlinkedProfile</code>。<br><br>' +
        '<strong>投保率 / 超建档规则</strong>：<br>' +
        '① 当 <strong>已投保 ≤ 建档总数</strong>：投保率 = 已投保 / 学生总数 × 100%（常规展示）。<br>' +
        '② 当 <strong>已投保 &gt; 建档总数</strong>（档案未建全、未建档先投保、建制滞后等）：<br>' +
        '&nbsp;&nbsp;· <strong>不</strong>展示超过 100% 的投保率，改为「<strong>超建档 N 人</strong>」（N = 已投保 − 建档总数）。<br>' +
        '&nbsp;&nbsp;· KPI 卡片高亮为警示色；主数值旁展示「超建档 N 人」。<br>' +
        '&nbsp;&nbsp;· 用户可见副文案仅展示<strong>保障期</strong>；建档差额、未关联档案等口径说明<strong>不在页面展示</strong>，见本批注。<br>' +
        '③ 已投保 ≤ 建档总数但存在未关联档案订单时，页面<strong>不</strong>单独提示未关联人数（名单页可核对）。<br><br>' +
        '明细核对请跳转「班级投保名单」查看订单与档案关联状态。',
      interaction: '只读；切换学期即时重算；超建档时引导管理员补建档或到名单页核对。',
      fields: 'insured_student_count、order_count、linked_profile_count、unlinked_profile_count、insured_rate（≤100% 时）、over_profile_count（超建档差额）',
      data: {
        source: 'enrollment_order 流水（家长端）+ student_profile 弱匹配',
        update: '约 15 分钟增量同步（正式 SLA）',
        timing: '学期切换 / 定时刷新',
        sync: '班级投保名单同学期口径',
        calc: 'uniq(cls|studentName)；over = max(0, insured − profile_total)'
      },
      stateFlow: '新订单（含未建档）入库 → 已投保上升；补建档后 unlinked 下降但不改历史订单数。',
      impact: '班级投保名单、平台端 KPI；避免误读「投保率 120%」。',
      exception: '建档总数为 0 时投保率显示 —；仅订单无建制时仍展示已投保人数。',
      scope: '1.0 · D-03；与 PRD「未建档也可投保」一致。',
      permission: '同 ② 数据范围。',
      metrics: '投保率（≤100% 场景）、未关联档案占比、超建档人次。'
    },
    {
      num: '④',
      name: '近期风险事件摘要',
      purpose: '让管理员快速感知校内最新风险动态，可跳转登记/详情。',
      logic:
        '展示最近若干条（原型 4 条）：发生时间、标题、严重程度标签、摘要 meta。<br>' +
        '· 数据来自风险事件台账，按时间倒序。<br>' +
        '· <strong>不受学生档案删除影响</strong>：删档后仍展示登记快照姓名（SD-13）。<br>' +
        '· 按角色过滤可见范围：班主任仅本班等为 P1，原型展示全校样例。',
      interaction: '整行可点击 → 风险事件登记页；右上角「登记/查看 →」同跳转。',
      fields: 'event_time、title、severity、summary_meta、event_id（跳转）',
      data: {
        source: 'risk_event 表 school_id 隔离',
        update: '事件登记/结案后刷新',
        timing: '进入看板 / 可选轮询',
        sync: '与风险事件登记模块同源',
        calc: 'TOP N ORDER BY occurred_at DESC'
      },
      stateFlow: '新登记 → 出现在摘要；结案仍展示，状态可在详情查看。',
      impact: '仅读入口；不写台账。',
      exception: '无事件时空列表（P2 占位文案）。',
      scope: '1.0 · D-05。',
      permission: '业务角色可读；过滤规则 P1。',
      tracking: 'dashboard_risk_click。'
    },
    {
      num: '⑤',
      name: '快捷入口',
      purpose: '从看板一键进入高频业务页。',
      logic: '固定 4 入口：学生档案、班级投保名单、投保二维码、风险事件登记；纯导航，无额外业务校验。',
      interaction: '点击卡片跳转对应 HTML；侧栏菜单与入口保持一致。',
      fields: '—',
      data: { source: '静态配置', update: '无', timing: '点击', sync: '与侧栏 RBAC 一致', calc: '无' },
      stateFlow: '无状态。',
      impact: '提升操作路径效率。',
      exception: '无权限时入口隐藏（正式 RBAC）。',
      scope: '1.0 · D-06。',
      permission: '随菜单权限展示/隐藏。',
      extension: 'P2 可增加「安全教育」「导出报表」等入口。'
    },
    {
      num: '⑥',
      name: '页面定位与顶栏',
      purpose: '明确看板为学校端登录后默认工作台。',
      logic:
        '登录成功跳转本页（登录页文案「进入工作台」对齐看板）。<br>' +
        '顶栏展示：校名（立德中学 · 随登录 tenant）、当前统计学期 label、数据同步频率说明。',
      interaction: '只读信息；学期随 ① 切换同步更新 <code>#topTerm</code>。',
      fields: 'school_name、term_label、sync_hint',
      data: {
        source: 'session.school_name + getStatTerm().label',
        update: 'renderKpis',
        timing: '进入页 / 换学期',
        sync: '与登录 tenant 一致',
        calc: '无'
      },
      stateFlow: '—',
      impact: '品牌与口径提示。',
      exception: '多校账号切换后整页刷新。',
      scope: '1.0 · 登录跳转规则。',
      permission: '全部已登录用户。'
    },
    {
      num: '⑦',
      name: '数据刷新与同步说明',
      purpose: '告知 KPI 非实时，避免与名单页瞬时差异误解。',
      logic:
        '顶栏文案「数据 15 分钟同步一次」；正式环境订单 KPI 走增量同步任务。<br>' +
        '· 学生总数相对实时（档案变更后下次进入或刷新更新）。<br>' +
        '· 已投保 KPI 以同步任务完成时刻为准；可选手动刷新按钮 P2。',
      interaction: '原型为静态提示；正式可增加「上次更新 HH:mm」与刷新 icon。',
      fields: 'last_synced_at、sync_interval_minutes',
      data: {
        source: 'sync_job 元数据 / BI 聚合表',
        update: '定时任务 + 可选手动 refresh',
        timing: '每 15min 或事件触发',
        sync: '班级投保名单、平台端 KPI',
        calc: '无'
      },
      stateFlow: '同步中 → 完成后 KPI 更新。',
      impact: '用户预期管理。',
      exception: '同步失败保留上次成功值并提示。',
      scope: '1.0 · D-04 补充。',
      metrics: '同步延迟、失败率（运维）。'
    }
  ],
  extension: 'P2：按角色过滤 KPI 与风险摘要；投保趋势迷你图；未投保 Top 班级；手动刷新；导出看板 PDF。'
};
