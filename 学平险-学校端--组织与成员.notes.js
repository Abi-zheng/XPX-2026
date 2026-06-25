/** 组织与成员 · 学校端 · 产品批注数据 */
window.ORG_MEMBER_PROTO = {
  name: '组织与成员 · 学校端',
  goal: '校级管理员维护本校年级班级结构与成员岗位，作为学生档案、投保、安全教育等模块的组织基线；无校务对接时支持手工建结构 + 批量导入。',
  structure: '左右分栏：左侧组织树（搜索/展开/新建年级班级/重命名删除）+ 右侧 Tab（成员列表 | 批量导入）；弹窗：新建年级、新建班级、添加/编辑成员、导入结果；右侧产品批注栏。',
  designPrinciples: '①组织 ID 稳定（grade_id/class_id 创建后不变）；②展示名可改；③删除为 archived 不 CASCADE；④成员 scope 存 ID 非展示名；⑤三角色 admin/grade/class；⑥批量导入与手工建结构二选一或组合使用。',
  modules: [
    {
      num: '①',
      name: '页面权限',
      purpose: '仅校级管理员可维护组织与成员，防止年级/班主任误改全校结构。',
      logic: 'session.role=admin 可访问；非 admin 显示 denied-banner，侧栏入口可见但页内不可操作（正式接口 403）。',
      interaction: '原型顶栏 role-switch 仅演示；正式按登录选岗判定。',
      fields: '无表格字段；RBAC 键 members:manage。',
      data: {
        source: 'school_session.role',
        update: '只读鉴权',
        timing: '进入页面 / 写 API 前',
        sync: '与登录选身份一致',
        calc: '无'
      },
      stateFlow: '鉴权 → 有权限展示 split 布局 / 无权限占位。',
      impact: '组织树、成员、导入全模块。',
      exception: '权限变更后需重新登录或刷新 session。',
      scope: '1.0 · admin-only。',
      permission: '校级管理员。',
      metrics: '无。'
    },
    {
      num: '②',
      name: '组织树 · 年级班级',
      purpose: '维护学校 → 年级 → 班级三级结构；左侧选中节点驱动右侧成员范围与表单预填。',
      logic:
        '树节点 type=school|grade|class；创建时生成 grade_id/class_id、grade_code/class_code（见 PRD 4.8）；删除为 archived，不物理删档案/订单。<br>' +
        '新建年级：选级别 + 班级数量 0–40（0=仅年级）；≥1 按「高一(1)班」规则批量建班。<br>' +
        '新建班级：在选中年级下追加单班，班号同年级唯一。<br>' +
        '重命名：仅改 display_name，ID 与 scope 引用不变。<br>' +
        '删除：confirm；删班/删年级前检查关联档案，有则阻断或强制迁移（P2）。',
      interaction: '搜索过滤树；展开/折叠年级；hover 显示重命名/删除；选中节点更新 nodeMeta 与「新建班级」可用态。',
      fields: 'grade：segment、level、name、sort、grade_code、status；class：class_no、name、class_code、grade_id。',
      data: {
        source: 'org_grade / org_class 表（school_id 隔离）',
        update: '手工弹窗 / 批量导入（见批注 ⑤）',
        timing: '确认创建/重命名/删除后立即落库',
        sync: '成员 scope 下拉、学生档案班级、投保二维码范围',
        calc: 'grade_code=GR-{级别码}；class_code 由 grade_code + 班号派生'
      },
      stateFlow: '空校 → 建年级 → 建班 → 分配成员；archived 节点不出现在下拉。',
      impact: '全校组织基线；错误结构影响档案导入与统计口径。',
      exception: '删班有学生档案时阻断；树搜索无匹配空态。',
      scope: '1.0 · 无校务同步；对接后改为「同步为主+微调」。',
      permission: '校级管理员。',
      metrics: '年级数、班级数、archived 占比。'
    },
    {
      num: '③',
      name: '成员添加与编辑',
      purpose: '为教职工分配登录账号与岗位范围（全校 / 年级 / 班级）。',
      logic:
        '三角色：admin（全校）、grade（年级组长，多选年级）、class（班主任，多选班级）；admin 与 grade/class 互斥；允许 grade+class 同人兼任。<br>' +
        'scope 存 grade_id[] / class_id[]，展示用组织路径文案。<br>' +
        '初始密码默认手机号后 6 位；停用后不可登录。<br>' +
        '删除成员=撤销登录资格（非删人事档案）。',
      interaction: '「添加成员」弹窗：姓名、手机、角色多选、任职年级/班级多选下拉、账号状态单选；行内「编辑」同表单；删除 confirm。',
      fields: 'display_name、phone、roles[]、grade_scope_ids[]、class_scope_ids[]、status(on/off)。',
      data: {
        source: 'org_member + user 账号表',
        update: '弹窗保存 / 批量导入（批注 ⑤）',
        timing: '保存成功即时生效',
        sync: '登录选岗、各业务模块数据范围',
        calc: '岗位范围文案由 scope ID 解析'
      },
      stateFlow: '添加 → 启用 → 可编辑/停用/删除；停用不可登录。',
      impact: 'RBAC 与全校/年级/班级数据可见性。',
      exception: '手机号全校唯一；scope 引用 archived 节点时保存拦截。',
      scope: '1.0 · 无短信邀请开通。',
      permission: '校级管理员。',
      metrics: '各角色人数、停用账号数。'
    },
    {
      num: '④',
      name: '成员列表与范围筛选',
      purpose: '按左侧树选中范围 + 工具栏条件浏览成员，支撑日常运维检索。',
      logic: '选中 school=全校成员；grade=该年级相关成员；class=该班班主任等。工具栏：姓名/手机模糊 + 角色枚举 AND 过滤。',
      interaction: '切换树节点刷新列表（正式服务端筛选；原型静态样例）；分页每页 10 条。',
      fields: '列表列：姓名、手机号（脱敏）、角色 chip、岗位范围、账号状态、操作。',
      data: {
        source: 'org_member 列表 API',
        update: '只读查询；增删改后刷新',
        timing: '树节点变更 / 筛选项变更',
        sync: '与批注 ③ 成员数据同源',
        calc: '无'
      },
      stateFlow: '只读列表；编辑/删除后本地刷新分页。',
      impact: '管理员日常查看与跳转编辑入口。',
      exception: '范围内无成员空态。',
      scope: '1.0 · 原型未做树联动过滤 Mock。',
      permission: '校级管理员。',
      metrics: '列表查询次数。'
    },
    {
      num: '⑤',
      name: '批量导入',
      purpose: '开学或人事变更时批量写入年级班级或教职工信息，减少手工逐条录入。',
      logic:
        '<strong>自动识别</strong><br>' +
        '· 上传后按表头自动判断：<code>年级名称+班级序号</code> → 年级班级；<code>姓名+手机号</code> → 成员信息<br>' +
        '· 正式环境：单 Excel 含「年级班级」「成员信息」两张表，可分别填写后整文件上传<br>' +
        '· 已存在的年级/班级按「年级+序号」更新名称；手机号重复的成员按更新处理<br><br>' +
        '<strong>交互三步</strong><br>' +
        '① 下载模板 → ② 上传文件（展示文件名，可移除；CSV 即时显示识别结果）→ ③ 开始导入<br><br>' +
        '<strong>校验</strong><br>' +
        '· 表格列须与模板一致<br>' +
        '· 年级班级：年级名称、班级序号（1–40）必填<br>' +
        '· 成员信息：姓名、手机号、角色（校级管理员/年级组长/班主任）必填；校级管理员不可与其他角色同条<br><br>' +
        '<strong>导入结果</strong><br>' +
        '· 结果弹窗：成功 / 失败 / 跳过计数 + 失败行原因<br>' +
        '· 「查看成员列表」关闭弹窗并切回成员 Tab<br><br>' +
        '<strong>审计</strong>：module=组织与成员；action=批量导入组织结构 / 批量导入成员。',
      interaction: '右侧 Tab「批量导入」；无需手动选择类型；导入完成写操作日志（正式）。',
      fields:
        '年级班级：年级名称、班级序号、班级名称、排序、备注<br>' +
        '成员信息：姓名、手机号、角色、任职年级、任职班级、账号状态',
      data: {
        source: '上传文件 → 导入任务 queue',
        update: '异步 bulk upsert org_grade/org_class/org_member',
        timing: '点击「开始导入」且校验通过后',
        sync: '成功后刷新左侧树与成员列表',
        calc: '成功/失败/跳过由服务端逐行统计'
      },
      stateFlow: '下模板 → 上传 → 自动识别类型 → 校验 → 执行 → 结果弹窗 → 刷新树/列表。',
      impact: '组织基线与成员账号批量变更；错误导入影响下游档案班级匹配。',
      exception: '超 500 行拒绝；表头不匹配整批失败；部分失败不影响成功行（事务按行或分批）。',
      scope: '1.0 · 原型 CSV 真解析；xlsx 模拟；失败明细导出 P2。',
      permission: '校级管理员。',
      metrics: '导入次数、失败率、组织/成员增量。'
    },
    {
      num: '⑥',
      name: '组织数据与下游模块',
      purpose: '明确组织树作为全校基线数据，被多业务模块只读或引用。',
      logic:
        '学生档案：班级须匹配 org_class；批量导入档案时校验「组织与成员」已建班。<br>' +
        '班级投保名单 / 统计看板：按年级班级聚合。<br>' +
        '投保二维码：有效学期 + 组织范围。<br>' +
        '安全教育 / 操作日志：module 枚举含组织与成员。<br>' +
        'archived 节点：不出现在新建下拉、导入 scope 校验失败。',
      interaction: '他模块只读引用；本页变更后他模块下次查询生效。',
      fields: 'grade_id、class_id 为跨模块关联键。',
      data: {
        source: 'org_* 主数据',
        update: '本页与导入维护',
        timing: '变更 commit 后',
        sync: '档案、订单、二维码、成员 RBAC',
        calc: '无'
      },
      stateFlow: '组织变更 → 下游只读快照或实时查询。',
      impact: '全校数据一致性与权限边界。',
      exception: '删档/删班需先解绑或迁移关联数据。',
      scope: '1.0 · 跨模块规则见 PRD 4.8.3。',
      permission: '读：各业务按 scope；写：仅本页 admin。',
      metrics: '无。'
    }
  ],
  extension: '校务系统组织同步；短信邀请开通；导入失败明细导出；组织变更审批流。'
};
