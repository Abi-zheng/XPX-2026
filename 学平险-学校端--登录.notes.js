/** 学校端 · 登录页产品批注 */
window.SCHOOL_LOGIN_PROTO = {
  name: '登录 · 学校端',
  goal: '学校租户账号认证入口；支持图形验证码、多学校选校、多身份选岗后进入工作台。',
  structure: '左侧品牌区 + 右侧登录表单（账号/密码/验证码）；步骤：登录 → 选校（可选）→ 选身份 → 进入工作台；页面右侧产品批注区。',
  modules: [
    {
      num: '①',
      name: '账号密码登录',
      purpose: '校验学校端账号与密码，建立会话前第一道门槛。',
      logic: '账号支持手机号或登录名；密码本地 Mock 校验；失败展示 error-msg 且不进入后续步骤。',
      interaction: '输入账号、密码、验证码后点击「登录」或 Enter；记住账号写 localStorage。',
      fields: 'account、password、remember',
      data: {
        source: '认证服务 / 原型 DEMO_USERS',
        update: '登录成功写 school_session（localStorage）',
        timing: '点击登录',
        sync: '会话含 account、role、scope、school',
        calc: '无'
      },
      stateFlow: '未登录 → 校验中 → 成功进入选校/选身份；失败停留登录步。',
      impact: '全局 RBAC 与数据范围；错误凭证不可见业务页。',
      exception: '账号或密码错误、验证码错误：提示并刷新验证码。',
      scope: '1.0 · 含图形验证码；忘记密码链至管理员重置说明。'
    },
    {
      num: '②',
      name: '图形验证码',
      purpose: '降低暴力破解与脚本撞库风险（原型示意）。',
      logic: 'Canvas 绘制 4 位字母数字；校验不区分大小写；错误后自动 redraw。',
      interaction: '点击画布或刷新按钮换一张；与密码一并提交校验。',
      fields: 'captchaInput、captchaCanvas',
      data: {
        source: '前端生成（正式接服务端 captcha_id + 图片）',
        update: '每次刷新或校验失败重绘',
        timing: '页面加载、校验失败、手动刷新',
        sync: '无持久化',
        calc: '随机字符序列'
      },
      stateFlow: '展示 → 输入 → 校验通过/失败重绘。',
      impact: '仅登录步；不影响已登录用户。',
      exception: '空验证码：与密码错误同等提示。',
      scope: '1.0 · 原型前端实现；正式需服务端签发与过期。'
    },
    {
      num: '③',
      name: '多学校选校',
      purpose: '一账号关联多租户时，明确本次操作所属 school_id。',
      logic: 'DEMO 中 18888889999 触发；选中学校写入 session 上下文。',
      interaction: '卡片单选 → 自动进入选身份；可返回重新登录。',
      fields: 'schoolList 卡片：school_id、name',
      data: {
        source: '账号-学校绑定关系 API',
        update: '选校后写入 session.school',
        timing: '登录成功后若 schools.length > 1',
        sync: '后续 API 带 school_id Header',
        calc: '无'
      },
      stateFlow: '登录成功 →（多校）选校 → 选身份。',
      impact: '全站数据隔离边界。',
      exception: '仅一所学校时跳过本步。',
      scope: '1.0 · 多校账号原型覆盖。'
    },
    {
      num: '④',
      name: '多身份选岗',
      purpose: '一人多岗时选择本次使用的角色与数据范围（校/年级/班级）。',
      logic: '展示 role、roleLabel、scope；进入工作台带 identity 参数。',
      interaction: '单选身份卡片 →「进入工作台」跳转统计看板/工作台。',
      fields: 'identityList：role、scope、display',
      permission: '不同 role 决定侧栏菜单与列表过滤范围。',
      data: {
        source: 'RBAC 岗位绑定',
        update: 'enterApp 写 session.identity',
        timing: '选校后或单校登录后',
        sync: '与组织与成员岗位配置一致',
        calc: '无'
      },
      stateFlow: '选身份 → session 完整 → 跳转业务首页。',
      impact: '全站菜单、导出、档案可见范围。',
      exception: '无可用身份：应阻断并联系管理员（原型未单独页）。',
      scope: '1.0 · 含多身份测试账号。'
    }
  ]
};
