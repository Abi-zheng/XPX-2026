/** 学校端 · 操作日志产品批注 */
window.SCHOOL_AUDIT_PROTO = {
  name: '操作日志 · 学校端',
  goal: '校级管理员查看本校关键写操作审计，只读检索，满足合规与问题追溯。',
  structure: '顶栏 + 筛选工具栏 + 日志表格 + 分页；右侧产品批注（可展开/收起）。',
  modules: [
    {
      num: '①',
      name: '页面权限与只读',
      purpose: '确保仅校级管理员可访问全校审计数据。',
      logic: '非 admin 显示无权限横幅；列表不可编辑、删除、回滚。',
      interaction: '侧栏「操作日志」入口；无权限时仅见 denied-banner。',
      fields: '本模块无表格字段；权限由 session.role 判定。',
      permission: 'role=admin（校级管理员）；年级组长、班主任不可见本页。',
      data: {
        source: 'RBAC 角色判定 + audit_log 表（school_id 隔离）',
        update: '只读查询',
        timing: '进入页面时鉴权',
        sync: '与组织与成员岗位配置一致',
        calc: '无'
      },
      stateFlow: '鉴权 → 有权限展示列表 / 无权限占位。',
      impact: '合规审计入口；与平台端日志分租户存储。',
      exception: '越权 API 返回 403；前端不渲染表格。',
      scope: '1.0 · admin-only。'
    },
    {
      num: '②',
      name: '筛选条件字段',
      purpose: '缩小日志检索范围，快速定位某操作人或业务对象相关记录。',
      logic: '关键字 + 模块 + 时间范围 AND 组合；默认近 7 天、按时间倒序。',
      interaction: '输入/选择后即时过滤（原型前端过滤；正式建议服务端分页查询）。',
      fields:
        '<strong>操作人 / 操作内容（filterKw）</strong>模糊匹配操作人姓名、操作内容全文（含动作与主体关键字）。<br>' +
        '示例：输入「王芳」→ 匹配操作人为王芳的记录；输入「李明远」→ 匹配操作内容含该学生的记录；输入「编辑安全教育」→ 匹配安全教育编辑类日志。<br><br>' +
        '<strong>业务模块（filterModule）</strong>下拉枚举，与侧栏模块名一致；空=全部。<br>' +
        '示例：选「安全教育」→ 仅展示 module=安全教育 的日志（编辑/发布/上下架等，见批注 ⑦）；选「统计看板」→ 切换学期、导出报表等；选「班级投保名单」→ 订单导出、通知家长等（见批注 ④⑤）。<br><br>' +
        '<strong>时间范围（filterRange）</strong>相对区间：近 7 天 / 近 30 天 / 本学期（按学期配置起止日）。<br>' +
        '示例：选「近 7 天」→ operated_at ≥ 今日 0 点 − 7 天；「本学期」按学校当前统计学期口径过滤。',
      data: {
        source: 'audit_log API；学期起止来自 school_term 配置',
        update: '筛选变更触发重新查询',
        timing: '用户改条件时',
        sync: '模块枚举与侧栏、写日志时的 module 字段一致',
        calc: '时间范围由服务端按 operated_at 计算'
      },
      stateFlow: '默认条件 → 用户筛选 → 分页浏览结果。',
      impact: '仅影响列表展示，不改日志数据。',
      exception: '无匹配记录时表格空态；导出 CSV 为 P2 占位。',
      scope: '1.0 · 含 IP 脱敏展示规则（见字段 ③）。'
    },
    {
      num: '③',
      name: '日志表格字段',
      purpose: '每条审计记录的标准字段，支撑「谁在何时对什么做了什么」的追溯。',
      logic: '关键写操作须落库（A-07 P1）：档案删除、组织变更、成员变更、二维码下载、导入/导出、内容发布等；只读不可删改。',
      interaction: '表格只读；行 hover 高亮；不支持行内编辑或删除。',
      fields:
        '<strong>时间（operated_at）</strong>操作<strong>完成</strong>时的服务器时间，格式 YYYY-MM-DD HH:mm:ss，列表默认倒序。<br>' +
        '示例：<code>2026-05-21 09:20:00</code>（张校长发布安全教育内容）<br><br>' +
        '<strong>操作人（operator_name）</strong>当时登录账号的显示名，取自用户档案 display_name。<br>' +
        '示例：<code>张敏</code>、<code>王芳</code>；系统任务可记为「系统自动」。<br><br>' +
        '<strong>角色（operator_role）</strong>操作发生时使用的岗位身份，与登录选岗一致。<br>' +
        '示例：<code>校级管理员</code>、<code>年级组长</code>、<code>班主任</code>；用于区分同人多岗下的操作范围。<br><br>' +
        '<strong>模块（module）</strong>业务域枚举，与侧栏一级菜单对应。<br>' +
        '示例：<code>统计看板</code>、<code>班级投保名单</code>（订单）、<code>安全教育</code>、<code>学生档案</code>、<code>组织与成员</code>（详见批注 ④⑤⑦ 全量操作）。<br><br>' +
        '<strong>操作内容（operation_summary）</strong>将原「动作 + 对象」合并为单列可读摘要；核心公式 <code>{动作}{主体标识}{变更内容}</code>，三段<strong>直接拼接</strong>（段间不加空格/标点），细则见批注 <strong>⑥</strong>。<br>' +
        '示例：<code>编辑档案李明远补充健康标签「过敏」</code> · <code>查看订单详情ORD20260518003李明远保障中</code> · <code>编辑安全教育内容防溺水知识宣传变更：正文</code> · <code>切换统计学期2026 春季 → 2026 秋季</code> · <code>发布内容防溺水知识宣传</code> · <code>登录学校端</code><br><br>' +
        '<strong>IP（ip_address）</strong>发起请求的客户端 IP；<strong>前端脱敏展示</strong>，完整 IP 仅后端留存。<br>' +
        '示例：公网 <code>58.1.*.*</code>；校内/运维 <code>10.2.*.*</code>。',
      data: {
        source: '各业务写操作成功后异步写入 audit_log',
        update: 'append-only，不可 UPDATE/DELETE',
        timing: '写操作事务提交成功后',
        sync: 'module 与后端枚举表一致；operation_summary 由 action+主体+变更组装；库表仍存 action、entity 供检索',
        calc: '无；时间取服务器 UTC+8'
      },
      stateFlow: '业务写 → 落库 audit_log → 本页只读展示。',
      impact: '档案、组织、投保、安全教育、风险事件等所有写操作模块。',
      exception: '日志写入失败不影响主业务，但需后端告警与补偿；登录失败一般不记本表（可记安全日志）。',
      scope: '1.0 · 原型为静态样例；正式需完整枚举与 entity 关联。'
    },
    {
      num: '④',
      name: '订单模块 · 操作枚举（班级投保名单）',
      purpose: '学校端订单流水均在「班级投保名单」维护；以下写操作与关键读操作均须落审计日志。',
      logic: '模块字段 module=<code>班级投保名单</code>；operation_summary=<code>{动作}{主体标识}{变更内容}</code>。',
      interaction: '列表页与班级详情页操作均可能产生日志；纯 Tab 切换/排序可不记（P2 可配置）。',
      fields:
        '<strong>切换统计学期</strong> — 列表/详情顶栏切换学期，刷新全班汇总与 KPI 口径。<br>' +
        '示例：<code>切换统计学期2026 春季 → 2026 秋季</code><br><br>' +
        '<strong>查看班级一览 / 进入班级详情</strong> — 从年级班级列表进入某班订单详情。<br>' +
        '示例：<code>进入班级详情高一(3)班班主任王芳</code><br><br>' +
        '<strong>搜索 / 筛选班级</strong> — 按班级名、班主任、年级筛选（可选记 P2）。<br>' +
        '示例：<code>筛选班级年级=高三关键词=3班</code><br><br>' +
        '<strong>查看订单列表</strong> — 详情页 Tab（全部 / 已关联档案 / 未建档）或保障状态筛选。<br>' +
        '示例：<code>查看订单列表高一(3)班Tab=未建档保障中</code><br><br>' +
        '<strong>查看订单详情</strong> — 打开单笔订单只读详情（含投保人、方案、保障期）。<br>' +
        '示例：<code>查看订单详情ORD20260518003李明远保障中</code><br><br>' +
        '<strong>跳转学生档案</strong> — 从已关联订单链至档案详情（读操作，建议记 P1）。<br>' +
        '示例：<code>跳转学生档案ORD202605001S20240001</code><br><br>' +
        '<strong>手动关联档案</strong> — 将未建档订单与档案建立弱关联（P2）。<br>' +
        '示例：<code>手动关联档案ORD20260512007关联 S20240115</code><br><br>' +
        '<strong>编辑订单内容（平台 · ORDER_EDIT_CONTENT）</strong> — 学校端不提供；非金额字段变更。枚举示例（6+）：<br>' +
        '① 被保人：<code>编辑订单内容ORD…被保人：李华 → 李明远</code> · ② 班级：<code>编辑订单内容ORD…班级：高一(2)班 → 高一(3)班</code><br>' +
        '③ 同次保存：<code>编辑订单内容ORD20260618021被保人+班级</code> · ④ 方案：<code>编辑订单内容ORD…保障方案 A款 → B款</code><br>' +
        '⑤ 投保人：<code>编辑订单内容ORD…投保人/手机变更</code> · ⑥ 保障期：<code>编辑订单内容ORD…2026-03-01~08-31 → 09-01~12-31</code><br>' +
        '⑦ 升学更正：<code>编辑订单内容ORD…初二(4)班 → 初三(1)班</code> · ⑧ 关联档案：<code>编辑订单内容ORD…未建档 → S20240115</code><br><br>' +
        '<strong>编辑订单金额（平台 · ORDER_EDIT_AMOUNT）</strong> — 学校端不提供；高危标红。枚举示例（6+）：<br>' +
        '① 补差 <code>编辑订单金额ORD…¥100→¥120</code> · ② 回退 <code>编辑订单金额ORD…¥120→¥100</code> · ③ 方案补价 <code>编辑订单金额ORD…¥80→¥100</code><br>' +
        '④ 渠道价 <code>编辑订单金额ORD…¥120→¥90</code> · ⑤ 零差额 <code>编辑订单金额ORD…¥100→¥100</code> · ⑥ 统调价 <code>编辑订单金额ORD…¥100→¥110</code><br><br>' +
        '<strong>导出本班订单</strong> — 导出当前班级订单 CSV/Excel。<br>' +
        '示例：<code>导出本班订单高一(3)班46 条</code>（表中已有样例）<br><br>' +
        '<strong>导出全部订单</strong> — 校级导出全校各班级订单（P2 占位）。<br>' +
        '示例：<code>导出全部订单2026 春季全校1248 条</code><br><br>' +
        '<strong>通知未投保家长</strong> — 向未投保学生家长发送短信/站内提醒（P2）。<br>' +
        '示例：<code>通知未投保家长高三年级18 人短信通知</code>（表中已有样例）',
      data: {
        source: 'enrollment_order 相关 API + 导出/通知任务',
        update: 'append-only 审计；订单本体在业务表',
        timing: '操作成功或导出任务创建时',
        sync: 'operation_summary 含 term_id、class_id、order_id 摘要',
        calc: '无'
      },
      stateFlow: '用户操作 → 业务处理 → audit_log 写入。',
      impact: '班级投保名单、统计看板已投保 KPI、学生档案弱关联展示。',
      exception: '导出超量走异步任务；通知失败记失败原因摘要（P2）。',
      scope: '1.0 · 原型静态样例覆盖主要动作；关联/全部导出为 P2。'
    },
    {
      num: '⑤',
      name: '数据统计模块 · 操作枚举（统计看板）',
      purpose: '统计看板为登录默认页；学期口径与 KPI 变更、导出等须可追溯。',
      logic: '模块字段 module=<code>统计看板</code>；与班级投保名单共用统计学期配置。',
      interaction: '切换学期即时刷新 KPI；导出/刷新为显式按钮操作。',
      fields:
        '<strong>切换统计学期</strong> — 顶栏下拉变更统计口径，联动 KPI 与副文案。<br>' +
        '示例：<code>切换统计学期2026 春季 → 2026 秋季</code> · 张敏 · 校级管理员<br><br>' +
        '<strong>查看看板</strong> — 进入或刷新看板页，按角色加载数据范围（可选记 P2）。<br>' +
        '示例：<code>查看看板高三年级2026 春季口径</code> · 李建华 · 年级组长<br><br>' +
        '<strong>查看 KPI · 学生总数</strong> — 读取建制在册档案人数（读操作，可选 P2）。<br>' +
        '示例：<code>查看 KPI学生总数全校1286 人</code><br><br>' +
        '<strong>查看 KPI · 已投保 / 投保率</strong> — 读取订单去重人数与投保率。<br>' +
        '示例：<code>查看 KPI2026 春季已投保1042 人81.0%</code><br><br>' +
        '<strong>查看近期风险事件</strong> — 展开摘要列表或点击跳转风险模块（读操作，可选 P2）。<br>' +
        '示例：<code>查看风险摘要近期5 条含较严重1 条</code><br><br>' +
        '<strong>快捷入口跳转</strong> — 点击底部卡片进入业务页（纯导航，一般不记；需分析时 P2）。<br>' +
        '示例：<code>快捷跳转班级投保名单</code><br><br>' +
        '<strong>导出统计报表</strong> — 导出 KPI + 班级汇总（P2 占位）。<br>' +
        '示例：<code>导出统计报表全校2026 春季KPI+班级汇总</code><br><br>' +
        '<strong>手动刷新数据</strong> — 触发订单同步/缓存刷新（P2）。<br>' +
        '示例：<code>刷新数据手动同步投保订单增量12 条</code>',
      data: {
        source: '看板聚合 API、school_term 配置、order 同步任务',
        update: '审计 append-only；KPI 为查询结果',
        timing: '学期切换、导出、刷新按钮或进入页（若启用）',
        sync: 'term_id 与班级投保名单、看板批注 ① 一致',
        calc: '投保率 = 已投保去重人数 / 学生总数'
      },
      stateFlow: '切换学期 / 导出 → 刷新展示 → 可选写 audit_log。',
      impact: '全校/年级/班级范围 KPI 展示；不影响订单与档案源数据。',
      exception: '同步延迟时 KPI 展示上次成功快照；刷新失败提示重试。',
      scope: '1.0 · 切换学期、导出样例已覆盖；KPI 纯读是否记日志为 P2 策略。'
    },
    {
      num: '⑥',
      name: '操作内容获取规则（operation_summary）',
      purpose: '统一「操作内容」列文案的组装口径：将动作、主体、变更合并为单列，保证可读、可追溯，且与后端 entity 关联一致。',
      logic:
        '① <strong>服务端组装</strong>：operation_summary = <code>{动作}{主体标识}{变更内容}</code>，由 AuditLogger 在操作成功时生成，禁止前端传入。<br>' +
        '② <strong>三段直接拼接</strong>：动作（action 枚举文案）+ 主体标识 + 变更内容，<strong>段与段之间不加空格、不加中点</strong>；变更内容内部可保留 <code>→</code>、<code>：</code>、<code>+</code> 等语义符号。<br>' +
        '③ <strong>操作时刻快照</strong>：主体标识取操作完成当下字段；实体后续改名/删档<strong>不回写</strong>历史 operation_summary。<br>' +
        '④ <strong>结构化存储</strong>：列表展示 operation_summary；库表仍存 action、entity_type、entity_id、audit_payload 供研发检索与精确关联。',
      interaction: '管理员仅见 operation_summary 单列；研发可通过 action + entity_id + audit_payload 反查详情。',
      fields:
        '<strong>核心公式：{动作}{主体标识}{变更内容}</strong><br>' +
        '列表「操作内容」列的默认结构。公式中三段语义独立，<strong>字面直接相连</strong>（非加号拼接）。无变更时省略变更段；无独立主体时主体段可为空（如纯状态切换）。<br><br>' +
        '<strong>① 动作 — 做了什么</strong><br>' +
        '取自 action 枚举中文文案，如 <code>编辑档案</code>、<code>发布内容</code>、<code>切换统计学期</code>；作为 operation_summary 的<strong>前缀</strong>。<br><br>' +
        '<strong>② 主体标识 — 对谁/对什么</strong><br>' +
        '回答操作锚定的<strong>那一个</strong>实体：订单号、姓名、标题、班级路径等。<br>' +
        '· 优先级：业务唯一编号 → 稳定展示名 → 组织路径 → entity_id<br>' +
        '· 仅主体、无变更时：summary = 动作 + 主体，如 <code>发布内容防溺水知识宣传</code>、<code>登录学校端</code><br><br>' +
        '<strong>③ 变更内容 — 产生什么结果</strong><br>' +
        '补充本次操作的可辨识结果/上下文；<strong>不重复</strong>动作文案。<br>' +
        '· 常见：变更摘要（<code>变更：正文</code>）、状态（<code>保障中</code>）、范围规模（<code>46 条</code>）、箭头变更（<code>2026 春季 → 2026 秋季</code>）<br>' +
        '· 无变更段时省略，如 <code>下架内容暑期安全提示</code><br><br>' +
        '<strong>④ 拼装示例（拆解）</strong><br>' +
        '<code>编辑档案李明远补充健康标签「过敏」</code><br>' +
        '→ 动作：<code>编辑档案</code> · 主体：<code>李明远</code> · 变更：<code>补充健康标签「过敏」</code><br><br>' +
        '<code>查看订单详情ORD20260518003李明远保障中</code><br>' +
        '→ 动作：<code>查看订单详情</code> · 主体：<code>ORD20260518003</code> · 变更：<code>李明远保障中</code>（读操作附上下文）<br><br>' +
        '<code>切换统计学期2026 春季 → 2026 秋季</code><br>' +
        '→ 动作：<code>切换统计学期</code> · 主体：（无） · 变更：<code>2026 春季 → 2026 秋季</code><br><br>' +
        '<code>编辑安全教育内容防溺水知识宣传变更：正文</code><br>' +
        '→ 动作：<code>编辑安全教育内容</code> · 主体：<code>防溺水知识宣传</code> · 变更：<code>变更：正文</code><br><br>' +
        '<strong>⑤ 段数与长度</strong><br>' +
        '· 总长度 ≤256 字符，超出截断末尾加 <code>…</code>；完整字段进 audit_payload<br>' +
        '· 禁止写入：身份证、完整手机号、密码、富文本正文全文<br><br>' +
        '<strong>按 entity_type 主体/变更拆分规则（学校端）</strong><br>' +
        '<table style="width:100%;font-size:10px;border-collapse:collapse;margin:6px 0">' +
        '<tr style="border-bottom:1px dotted #fde68a"><th align="left">类型</th><th align="left">主体标识</th><th align="left">变更内容</th></tr>' +
        '<tr><td>student_profile</td><td><code>{姓名}</code></td><td><code>{变更摘要}</code></td></tr>' +
        '<tr><td>safety_content（发布/下架）</td><td><code>{标题}</code></td><td>空</td></tr>' +
        '<tr><td>safety_content（编辑）</td><td><code>{标题}</code></td><td><code>变更：{字段摘要}</code> 或 <code>{旧标题}→{新标题}</code></td></tr>' +
        '<tr><td>safety_content（重新发布）</td><td><code>{标题}</code></td><td><code>刷新发布时间</code> 或 <code>已下架 → 已发布</code></td></tr>' +
        '<tr><td>enrollment_order</td><td><code>{order_no}</code></td><td><code>{student_name}{status_label}</code></td></tr>' +
        '<tr><td>enrollment_export</td><td><code>{scope}</code></td><td><code>{term_label}{count} 条</code></td></tr>' +
        '<tr><td>org_member</td><td><code>{display_name}</code></td><td><code>{phone_mask}{role_label}</code></td></tr>' +
        '<tr><td>school_term</td><td>空</td><td><code>{旧学期} → {新学期}</code></td></tr>' +
        '<tr><td>system_login</td><td><code>学校端</code></td><td>空</td></tr>' +
        '</table><br>' +
        '<strong>获取失败兜底</strong><br>' +
        '· 已知 entity_id：<code>{动作}{entity_type}{entity_id}</code><br>' +
        '· 批量任务：<code>{动作}共 N 条</code><br>' +
        '· 绝不留空 operation_summary；异常记 audit_payload.error_code',
      data: {
        source: 'AuditLogger.buildOperationSummary(action, entity, context)',
        update: '写入 audit_log 时一次性生成，后续不 UPDATE operation_summary',
        timing: '业务事务 commit 后 / 异步任务 accepted 后',
        sync: 'action、entity_type 仍独立落库；与 module+action 模板矩阵维护',
        calc: '批量类变更段的 N 由服务端 COUNT，不信任前端传参'
      },
      stateFlow: '业务层提交 context → 模板渲染 operation_summary → 落库 → 列表只读展示。',
      impact: '全模块审计可读性；筛选 filterKw 依赖 operation_summary 质量。',
      exception: '模板渲染异常走兜底规则并告警；不阻断主业务但须补偿写日志。',
      scope: '1.0 · 规则定稿；各模块接入 AuditLogger 为 P1。'
    },
    {
      num: '⑦',
      name: '安全教育模块 · 操作枚举',
      purpose: '学校端安全教育（安全宣传 / 安全提醒）的发布、编辑、上下架、置顶、删除等写操作均须落审计日志；编辑页「保存」「重新发布」与列表 Switch 分 action 枚举。',
      logic:
        'module=<code>安全教育</code>；entity_type=<code>safety_content</code>。编辑类 operation_summary 遵循批注 ⑥ 公式 <code>{动作}{主体标识}{变更内容}</code>；禁止写入富文本正文全文。',
      interaction: '编辑页「保存」「重新发布」、列表 Switch（置顶/上架）、批量下架/删除均可能产生日志；Drawer 只读查看可选记 P2。',
      fields:
        '<strong>发布内容（新增 · SAFETY_PUBLISH）</strong> — 新建编辑页确认发布，同步上架；无草稿态。<br>' +
        '示例：<code>发布内容防溺水知识宣传</code><br><br>' +
        '<strong>编辑安全教育内容（SAFETY_EDIT_CONTENT）</strong> — 编辑已有内容点击「保存」：仅 mergeFormData，不改 status/publish_time。<br>' +
        '<strong>编辑安全教育内容 · 枚举示例（6+）</strong><br>' +
        '① 正文微调：<code>编辑安全教育内容防溺水知识宣传变更：正文</code><br>' +
        '② 标题：<code>编辑安全教育内容暴雨预警 → 暴雨橙色预警提醒</code><br>' +
        '③ 封面：<code>编辑安全教育内容防溺水知识宣传变更：封面图</code><br>' +
        '④ 内容类型：<code>编辑安全教育内容校园欺凌预防变更：安全宣传 → 安全提醒</code><br>' +
        '⑤ 标题+正文同次：<code>编辑安全教育内容交通安全须知变更：标题+正文</code><br>' +
        '⑥ 已下架静默修错：<code>编辑安全教育内容校园欺凌预防变更：正文状态=已下架</code><br>' +
        '⑦ 封面+正文：<code>编辑安全教育内容暑期安全提示变更：封面图+正文</code><br>' +
        '⑧ 类型切换：<code>编辑安全教育内容暴雨橙色预警提醒变更：安全提醒 → 安全宣传</code><br><br>' +
        '<strong>重新发布安全教育（SAFETY_REPUBLISH）</strong> — 编辑页「重新发布」+ Modal 确认：刷新 publish_time，已下架项恢复可见。<br>' +
        '<strong>重新发布安全教育 · 枚举示例（6+）</strong><br>' +
        '① 已发布改文并刷新时间：<code>重新发布安全教育防溺水知识宣传刷新发布时间</code><br>' +
        '② 已下架恢复上线：<code>重新发布安全教育校园欺凌预防已下架 → 已发布</code><br>' +
        '③ 标题变更后推送：<code>重新发布安全教育暴雨橙色预警提醒刷新发布时间</code><br>' +
        '④ 类型+正文推送：<code>重新发布安全教育交通安全须知变更：类型+正文刷新发布时间</code><br>' +
        '⑤ 平台强制下架后恢复：<code>重新发布安全教育防溺水知识宣传重新发布恢复可见</code><br>' +
        '⑥ 封面更新并推送：<code>重新发布安全教育暑期安全提示变更：封面图刷新发布时间</code><br><br>' +
        '<strong>上架 / 下架内容</strong> — 列表「上架」Switch 即时生效。<br>' +
        '示例：<code>下架内容防溺水知识宣传</code> · <code>上架内容校园欺凌预防</code><br><br>' +
        '<strong>置顶 / 取消置顶</strong> — 列表 Switch，仅已发布可置顶。<br>' +
        '示例：<code>置顶内容防溺水知识宣传置顶：关 → 开</code> · <code>取消置顶交通安全须知置顶：开 → 关</code><br><br>' +
        '<strong>删除内容 / 批量下架 / 批量删除</strong> — 二次 confirm 后落库。<br>' +
        '示例：<code>删除内容过期安全提示已下架</code> · <code>批量下架共3 条</code><br><br>' +
        '<strong>查看详情（Drawer）</strong> — 可选记 P2。<br>' +
        '示例：<code>查看详情防溺水知识宣传安全宣传</code>',
      data: {
        source: 'safety_content API + 编辑页 mergeFormData / publishWithForm',
        update: 'append-only 审计；正文存内容表，不进 operation_summary',
        timing: '保存/发布/重新发布成功；Switch 即时生效后',
        sync: 'operation_summary 含 content_id 摘要；变更明细进 audit_payload.changed_fields',
        calc: '批量下架/删除的 N 由服务端 COUNT'
      },
      stateFlow: '编辑保存 → OFFLINE/PUBLISHED 不变；重新发布/Switch 开 → PUBLISHED；Switch 关 → OFFLINE。',
      impact: '家长端发现页可见性、置顶排序、PV 统计口径（重新发布刷新 publish_time）。',
      exception: '平台强制下架后学校 Switch 开或重新发布可恢复；富文本 XSS 过滤失败不写日志。',
      scope: '1.0 · 编辑类枚举与安全教育批注 ⑤⑩⑪ 对齐；平台侧无文章编辑，仅监管（见平台批注 ⑥）。'
    }
  ]
};
