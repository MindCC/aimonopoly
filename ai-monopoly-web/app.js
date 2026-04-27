const STORAGE_KEY = "ai-monopoly-web-v2";
const OLD_STORAGE_KEY = "ai-monopoly-web-v1";

const initialMetrics = {
  cash: 10000,
  users: 0,
  product: 1,
  tech: 1,
  reputation: 1,
  compliance: 1,
};

const metricLabels = {
  cash: "现金",
  users: "用户",
  product: "产品力",
  tech: "技术力",
  reputation: "声誉",
  compliance: "合规",
};

const roleLabels = {
  ceo: "CEO / 产品",
  cto: "CTO / 技术",
  cmo: "CMO / 运营",
  cfo: "CFO / 风控",
};

const scoreItems = [
  ["demo", "AI 项目完成度与演示", 25],
  ["tech", "技术实现与课程知识应用", 20],
  ["market", "用户需求、MVP 与商业验证", 15],
  ["process", "课中经营累计表现", 10],
  ["finalGame", "期末大富翁决战表现", 15],
  ["teamwork", "答辩表达与团队协作", 10],
  ["compliance", "合规与反思", 5],
];

const boardCells = [
  ["起点", "公司进入期末路演", "start"],
  ["产品格", "说明目标用户和核心痛点", "product"],
  ["技术格", "说明 Agent 或 Bot 的工作机制", "tech"],
  ["机会格", "抽 1 张机会卡", "opportunity"],
  ["市场格", "说明竞品和差异化", "market"],
  ["风险格", "回答隐私、伦理或版权问题", "risk"],
  ["演示格", "演示核心功能", "demo"],
  ["资本格", "进行 1 分钟融资陈述", "capital"],
  ["危机格", "抽 1 张危机卡", "crisis"],
  ["产品格", "说明 MVP 取舍", "product"],
  ["技术格", "展示 Workflow 或流程图", "tech"],
  ["复盘格", "说明一次失败决策和改进", "review"],
  ["机会格", "抽 1 张机会卡", "opportunity"],
  ["市场格", "说明用户增长策略", "market"],
  ["风险格", "回答模型幻觉或错误输出处理", "risk"],
  ["演示格", "演示一次真实使用场景", "demo"],
  ["资本格", "回答商业模式问题", "capital"],
  ["危机格", "抽 1 张危机卡", "crisis"],
  ["产品格", "说明版本迭代依据", "product"],
  ["技术格", "说明 Prompt 优化或知识库设计", "tech"],
  ["市场格", "说明用户反馈如何改变产品", "market"],
  ["风险格", "回答数据安全和授权问题", "risk"],
  ["复盘格", "说明团队分工和协作问题", "review"],
  ["决战格", "进入最终投资人路演", "final"],
].map(([title, task, type], index) => ({ index, title, task, type }));

const strategies = [
  {
    id: "interview",
    name: "用户访谈",
    role: "cmo",
    cost: -500,
    success: { product: 1, reputation: 1 },
    partial: { product: 1 },
    fail: {},
    note: "提交访谈问题和结论。",
  },
  {
    id: "competitor",
    name: "竞品分析",
    role: "ceo",
    cost: -800,
    success: { product: 1, cash: 1000 },
    partial: { product: 1 },
    fail: {},
    note: "说明 2 个竞品和差异化。",
  },
  {
    id: "prompt",
    name: "Prompt 优化",
    role: "cto",
    cost: -800,
    success: { tech: 1 },
    partial: {},
    fail: {},
    note: "展示优化前后的变化。",
  },
  {
    id: "workflow",
    name: "工作流重构",
    role: "cto",
    cost: -1500,
    success: { tech: 2, product: 1 },
    partial: { tech: 1 },
    fail: {},
    note: "展示流程图或关键节点。",
  },
  {
    id: "knowledge",
    name: "接入知识库",
    role: "cto",
    cost: -2000,
    success: { tech: 2 },
    partial: { tech: 1 },
    fail: { compliance: -1 },
    note: "说明数据来源和使用方式，合规低时需谨慎。",
  },
  {
    id: "demo",
    name: "快速 Demo",
    role: "cto",
    cost: -1500,
    success: { product: 2 },
    partial: { product: 1 },
    fail: {},
    note: "展示原型、流程或可运行版本。",
  },
  {
    id: "ads",
    name: "广告投放",
    role: "cmo",
    cost: -2500,
    success: { users: 50 },
    partial: { users: 20 },
    fail: { reputation: -1 },
    note: "产品力低于 3 时，失败概率较高。",
  },
  {
    id: "pilot",
    name: "校园试点",
    role: "cmo",
    cost: -1000,
    success: { users: 30, reputation: 1 },
    partial: { users: 10 },
    fail: {},
    note: "说明真实使用场景。",
  },
  {
    id: "partner",
    name: "商业合作",
    role: "cfo",
    cost: -1500,
    success: { cash: 4000 },
    partial: { cash: 1000 },
    fail: {},
    note: "讲清合作对象和收益逻辑。",
  },
  {
    id: "paid-pilot",
    name: "校园小额付费试点",
    role: "cmo",
    group: "基础变现",
    cost: -500,
    success: { cash: 1500, users: 10 },
    partial: { cash: 500, users: 5 },
    fail: {},
    disabled: (team) => team.metrics.product < 2,
    note: "产品力至少为 2；适合前期验证真实付费意愿。",
  },
  {
    id: "prompt-pack",
    name: "模板/提示词包售卖",
    role: "cto",
    group: "基础变现",
    cost: -300,
    success: { cash: 1200 },
    partial: { cash: 400 },
    fail: {},
    disabled: (team) => team.metrics.tech < 2,
    note: "技术力至少为 2；把已有能力包装成可交付小产品。",
  },
  {
    id: "sponsor",
    name: "社群内测赞助",
    role: "cmo",
    group: "基础变现",
    cost: -500,
    success: { cash: 1800, reputation: 1 },
    partial: { cash: 600 },
    fail: { reputation: -1 },
    disabled: (team) => team.metrics.reputation < 2,
    note: "声誉至少为 2；适合有一定口碑后尝试。",
  },
  {
    id: "trial",
    name: "免费试用",
    role: "cmo",
    cost: -1000,
    success: { users: 60 },
    partial: { users: 25 },
    fail: { cash: -500 },
    disabled: (team) => team.metrics.cash < 3000,
    note: "现金低于 3000 时不可选。",
  },
  {
    id: "subscription",
    name: "订阅制试运营",
    role: "cfo",
    group: "增长变现",
    cost: -1000,
    success: { cash: 4000 },
    partial: { cash: 1500 },
    fail: { reputation: -1 },
    note: "需要说清收费对象、价格和续费理由；产品力低时风险较高。",
  },
  {
    id: "custom-demo",
    name: "企业定制 Demo",
    role: "cto",
    group: "增长变现",
    cost: -2000,
    success: { cash: 6000, reputation: 1 },
    partial: { cash: 2000 },
    fail: { cash: -1000 },
    disabled: (team) => team.metrics.tech < 3,
    note: "技术力至少为 3；需要展示可定制能力。",
  },
  {
    id: "campus-procurement",
    name: "校园部门采购",
    role: "cfo",
    group: "增长变现",
    cost: -1500,
    success: { cash: 5000 },
    partial: { cash: 1500 },
    fail: { compliance: -1 },
    disabled: (team) => team.metrics.compliance < 3,
    note: "合规至少为 3；需要说明采购场景、预算和责任边界。",
  },
  {
    id: "co-marketing",
    name: "联名推广分成",
    role: "cmo",
    group: "增长变现",
    cost: -1000,
    success: { cash: 3500, users: 40 },
    partial: { cash: 1200, users: 15 },
    fail: {},
    note: "适合已有目标用户和合作渠道的小组。",
  },
  {
    id: "audit",
    name: "合规审查",
    role: "cfo",
    cost: -1000,
    success: { compliance: 2 },
    partial: { compliance: 1 },
    fail: {},
    note: "短期无收入，但可抵御风险。",
  },
  {
    id: "seed-round",
    name: "种子轮融资",
    role: "ceo",
    group: "高风险融资",
    cost: -1000,
    success: { cash: 10000 },
    partial: { cash: 3000 },
    fail: { reputation: -1 },
    note: "需要 1 分钟讲清市场、产品和增长逻辑。",
  },
  {
    id: "industry-bid",
    name: "行业解决方案竞标",
    role: "cfo",
    group: "高风险融资",
    cost: -3000,
    success: { cash: 12000, reputation: 1 },
    partial: { cash: 3000 },
    fail: { cash: -2000 },
    disabled: (team) => team.metrics.tech < 3 || team.metrics.compliance < 3,
    note: "技术力和合规至少为 3；适合后期成熟项目。",
  },
  {
    id: "paid-api",
    name: "付费 API 服务上线",
    role: "cto",
    group: "高风险融资",
    cost: -2500,
    success: { cash: 8000 },
    partial: { cash: 2000 },
    fail: { reputation: -2 },
    disabled: (team) => team.metrics.tech < 4,
    note: "技术力至少为 4；重点考察稳定性和调用成本。",
  },
  {
    id: "data-partner",
    name: "数据服务合作",
    role: "cfo",
    group: "高风险融资",
    cost: -2000,
    success: { cash: 7000 },
    partial: { cash: 1500 },
    fail: { cash: -3000, compliance: -2 },
    disabled: (team) => team.metrics.compliance < 4,
    note: "合规至少为 4；必须讲清数据来源、授权和使用边界。",
  },
  {
    id: "iteration",
    name: "版本迭代",
    role: "ceo",
    cost: -1500,
    success: { product: 1, tech: 1 },
    partial: { product: 1 },
    fail: {},
    note: "展示前后变化。",
  },
];

const quickActions = [
  ["基础概念正确", { cash: 500 }, "回答基础概念正确"],
  ["结合本组项目", { cash: 1000 }, "回答能结合本组项目"],
  ["有案例和判断", { cash: 1500 }, "回答有案例、有判断、有反思"],
  ["现场演示成功", { product: 1, tech: 1 }, "现场演示成功"],
  ["主动指出风险", { compliance: 1 }, "主动指出数据、伦理或安全风险"],
  ["有价值建议", { reputation: 1 }, "给其他小组提出有价值建议"],
  ["阶段任务迟交", { cash: -1000 }, "阶段任务迟交"],
  ["项目无进展", { product: -1 }, "项目长期无明显进展"],
  ["材料造假", { cash: -3000, reputation: -2, compliance: -2 }, "数据、截图、用户反馈造假"],
];

const opportunityCards = [
  {
    name: "获得企业试点",
    desc: "产品力 >=4，现金 +5000；否则用户 +20。",
    settle: (team) => (team.metrics.product >= 4 ? { cash: 5000 } : { users: 20 }),
  },
  {
    name: "校园推广成功",
    desc: "用户 +50，声誉 +1。",
    settle: () => ({ users: 50, reputation: 1 }),
  },
  {
    name: "投资人关注",
    desc: "2 分钟讲清商业模式，成功现金 +8000。",
    success: { cash: 8000 },
    fail: {},
  },
  {
    name: "行业数据开放",
    desc: "合规 >=3，技术力 +1，产品力 +1；否则无收益。",
    settle: (team) => (team.metrics.compliance >= 3 ? { tech: 1, product: 1 } : {}),
  },
  {
    name: "用户自传播",
    desc: "声誉 >=4，用户 +80；否则用户 +30。",
    settle: (team) => (team.metrics.reputation >= 4 ? { users: 80 } : { users: 30 }),
  },
  {
    name: "教师推荐资源",
    desc: "可跳过一次危机卡；系统记录为声誉 +1。",
    settle: () => ({ reputation: 1 }),
  },
  {
    name: "找到高频场景",
    desc: "产品力 +2。",
    settle: () => ({ product: 2 }),
  },
  {
    name: "模型效果提升",
    desc: "技术力 +1，声誉 +1。",
    settle: () => ({ tech: 1, reputation: 1 }),
  },
  {
    name: "成本结构优化",
    desc: "CFO 说明降本方案，成功现金 +3000。",
    success: { cash: 3000 },
    fail: {},
  },
  {
    name: "社群试用反馈积极",
    desc: "用户 +40，产品力 +1。",
    settle: () => ({ users: 40, product: 1 }),
  },
  {
    name: "获得合作伙伴",
    desc: "说明合作价值，成功现金 +4000。",
    success: { cash: 4000 },
    fail: {},
  },
  {
    name: "产品定位变清晰",
    desc: "CEO 重新陈述定位，成功产品力 +1，声誉 +1。",
    success: { product: 1, reputation: 1 },
    fail: {},
  },
  {
    name: "技术方案被认可",
    desc: "CTO 说明架构亮点，成功技术力 +2。",
    success: { tech: 2 },
    fail: {},
  },
  {
    name: "低成本获客",
    desc: "CMO 说明渠道策略，成功用户 +60。",
    success: { users: 60 },
    fail: {},
  },
  {
    name: "合规准备充分",
    desc: "合规 +2，并免疫一次合规类处罚。",
    settle: () => ({ compliance: 2 }),
  },
  {
    name: "用户提出关键建议",
    desc: "产品力 +1，并获得一次版本迭代机会。",
    settle: () => ({ product: 1 }),
  },
];

const crisisCards = [
  {
    name: "AI 回答不稳定",
    desc: "CTO 说明 Prompt 或 Workflow 优化方案；失败声誉 -1。",
    success: { tech: 1 },
    fail: { reputation: -1 },
  },
  {
    name: "用户隐私质疑",
    desc: "CFO 说明数据处理方式和边界；失败现金 -3000，合规 -1。",
    success: { compliance: 1 },
    fail: { cash: -3000, compliance: -1 },
  },
  {
    name: "竞品上线同类功能",
    desc: "CEO 说明差异化和取舍；失败用户 -30。",
    success: { product: 1 },
    fail: { users: -30 },
  },
  {
    name: "模型调用成本上涨",
    desc: "CFO 调整商业模式或成本结构；失败现金 -2000。",
    success: { cash: 1000 },
    fail: { cash: -2000 },
  },
  {
    name: "用户不会用",
    desc: "CMO 说明用户教育或产品简化方案；失败产品力 -1。",
    success: { reputation: 1 },
    fail: { product: -1 },
  },
  {
    name: "演示现场失败",
    desc: "CTO 现场补救或解释备用方案；失败声誉 -1。",
    success: {},
    fail: { reputation: -1 },
  },
  {
    name: "数据来源不清",
    desc: "CFO 说明授权、来源和替代方案；失败合规 -2。",
    success: { compliance: 1 },
    fail: { compliance: -2 },
  },
  {
    name: "技术依赖单一平台",
    desc: "CTO 说明替代方案或迁移路径；失败技术力 -1。",
    success: { tech: 1 },
    fail: { tech: -1 },
  },
  {
    name: "功能太多太散",
    desc: "CEO 重新定义 MVP；失败产品力 -1。",
    success: { product: 1 },
    fail: { product: -1 },
  },
  {
    name: "用户反馈不一致",
    desc: "CMO 说明如何筛选有效反馈；失败用户 -20。",
    success: { reputation: 1 },
    fail: { users: -20 },
  },
  {
    name: "团队分工混乱",
    desc: "CEO 说明角色调整方案；失败声誉 -1。",
    success: {},
    fail: { reputation: -1 },
  },
  {
    name: "输出内容有事实错误",
    desc: "CTO 说明校验机制；失败声誉 -1，技术力 -1。",
    success: { tech: 1 },
    fail: { reputation: -1, tech: -1 },
  },
  {
    name: "涉及版权素材",
    desc: "CFO 说明版权处理方案；失败合规 -1。",
    success: { compliance: 1 },
    fail: { compliance: -1 },
  },
  {
    name: "项目场景过宽",
    desc: "CEO 收缩目标用户；失败产品力 -1。",
    success: { product: 1 },
    fail: { product: -1 },
  },
  {
    name: "用户增长停滞",
    desc: "CMO 设计新获客策略；失败用户 -20。",
    success: { users: 20 },
    fail: { users: -20 },
  },
  {
    name: "商业模式不清",
    desc: "CFO 说明收费对象和成本收益；失败现金 -2000。",
    success: { cash: 1000 },
    fail: { cash: -2000 },
  },
];

const propCards = [
  { id: "P01", name: "技术加班卡", desc: "演示失败后可补救一次", effect: { kind: "shield", metric: "reputation", amount: 1 } },
  { id: "P02", name: "用户口碑卡", desc: "抵消一次声誉损失", effect: { kind: "shield", metric: "reputation", amount: 1 } },
  { id: "P03", name: "合规护盾卡", desc: "抵消一次合规处罚", effect: { kind: "shield", metric: "compliance", amount: 1 } },
  { id: "P04", name: "专家顾问卡", desc: "可更换一道评委问题", effect: { kind: "note" } },
  { id: "P05", name: "追加预算卡", desc: "本轮行动成本减半", effect: { kind: "halvePenalty", metric: "cash" } },
  { id: "P06", name: "投资人引荐卡", desc: "资本格融资额 +3000", effect: { kind: "bonusDelta", delta: { cash: 3000 } } },
  { id: "P07", name: "产品聚焦卡", desc: "产品格回答成功后额外产品力 +1", effect: { kind: "bonusDelta", delta: { product: 1 } } },
  { id: "P08", name: "应急公关卡", desc: "危机卡失败后惩罚减半", effect: { kind: "halvePenalty" } },
  { id: "P09", name: "用户访谈卡", desc: "市场格回答成功后额外用户 +30", effect: { kind: "bonusDelta", delta: { users: 30 } } },
  { id: "P10", name: "架构图卡", desc: "技术格回答时可获得 30 秒准备时间", effect: { kind: "note" } },
  { id: "P11", name: "复盘加分卡", desc: "复盘格回答成功后声誉 +1", effect: { kind: "bonusDelta", delta: { reputation: 1 } } },
  {
    id: "P12",
    name: "一键迭代卡",
    desc: "可将产品力 +1 或技术力 +1，二选一",
    effect: { kind: "chooseDelta", options: [{ label: "产品力 +1", delta: { product: 1 } }, { label: "技术力 +1", delta: { tech: 1 } }] },
  },
];

const interactionDecks = {
  coop: [
    {
      name: "联合研发",
      desc: "双方各支付 1000；若两组 CTO 都能说明分工，双方技术力 +1，产品力 +1。",
      self: { cash: -1000, tech: 1, product: 1 },
      target: { cash: -1000, tech: 1, product: 1 },
    },
    {
      name: "交叉内测",
      desc: "两组互为用户并提交反馈，双方用户 +20，产品力 +1。",
      self: { users: 20, product: 1 },
      target: { users: 20, product: 1 },
    },
    {
      name: "渠道互推",
      desc: "双方 CMO 说明互推人群，双方用户 +30，声誉 +1。",
      self: { users: 30, reputation: 1 },
      target: { users: 30, reputation: 1 },
    },
    {
      name: "数据共建",
      desc: "双方 CFO 说明数据边界，双方合规 +1，技术力 +1。",
      self: { compliance: 1, tech: 1 },
      target: { compliance: 1, tech: 1 },
    },
    {
      name: "联合路演",
      desc: "两组说明商业互补关系，双方现金 +2000，声誉 +1。",
      self: { cash: 2000, reputation: 1 },
      target: { cash: 2000, reputation: 1 },
    },
    {
      name: "专家共聘",
      desc: "双方各支付 800，共同解决一个技术或产品问题，双方技术力 +1。",
      self: { cash: -800, tech: 1 },
      target: { cash: -800, tech: 1 },
    },
    {
      name: "场景拼图",
      desc: "两组产品属于同一场景上下游，双方产品力 +1，用户 +20。",
      self: { product: 1, users: 20 },
      target: { product: 1, users: 20 },
    },
    {
      name: "联合用户访谈",
      desc: "两组共同访谈同类用户，双方产品力 +1，声誉 +1。",
      self: { product: 1, reputation: 1 },
      target: { product: 1, reputation: 1 },
    },
  ],
  battle: [
    {
      name: "抢占关键词",
      desc: "发起方用户 +10；目标方若不能说明差异化定位，用户 -10。",
      self: { users: 10 },
      targetFail: { users: -10 },
      defense: "目标方 CMO 用 30 秒说明差异化定位。",
    },
    {
      name: "竞品压价",
      desc: "目标方若不能说明成本结构，下次变现收益视为减少 1000，本系统先记录现金 -1000。",
      self: {},
      targetFail: { cash: -1000 },
      targetSuccess: { reputation: 1 },
      defense: "目标方 CFO 说明成本结构和定价底线。",
    },
    {
      name: "舆情质疑",
      desc: "目标方若没有用户反馈或证据，声誉 -1；防守成功声誉 +1。",
      self: {},
      targetFail: { reputation: -1 },
      targetSuccess: { reputation: 1 },
      defense: "目标方展示用户反馈、测试记录或真实证据。",
    },
    {
      name: "技术挑战",
      desc: "目标方 CTO 回答技术问题；失败技术力 -1，成功技术力 +1。",
      self: {},
      targetFail: { tech: -1 },
      targetSuccess: { tech: 1 },
      defense: "目标方 CTO 解释架构、稳定性或工作流。",
    },
    {
      name: "用户截流",
      desc: "发起方用户 +15；目标方防守失败用户 -15。",
      self: { users: 15 },
      targetFail: { users: -15 },
      defense: "目标方 CMO 说明用户留存或社群运营策略。",
    },
    {
      name: "功能模仿",
      desc: "发起方产品力 +1；目标方若不能说明护城河，声誉 -1。",
      self: { product: 1 },
      targetFail: { reputation: -1 },
      defense: "目标方 CEO 说明差异化、数据壁垒或场景壁垒。",
    },
  ],
  negotiation: [
    {
      name: "共同投标",
      desc: "双方临时组队投标；成功双方现金 +4000，失败双方现金 -1000。",
      successSelf: { cash: 4000 },
      successTarget: { cash: 4000 },
      failSelf: { cash: -1000 },
      failTarget: { cash: -1000 },
    },
    {
      name: "技术授权",
      desc: "发起方向目标方授权技术能力：发起方现金 +2000，目标方现金 -2000、技术力 +1。",
      successSelf: { cash: 2000 },
      successTarget: { cash: -2000, tech: 1 },
      failSelf: {},
      failTarget: {},
    },
    {
      name: "市场换资源",
      desc: "双方自行谈判资源交换；教师确认合理后，发起方用户 +20，目标方现金 +2000。",
      successSelf: { users: 20 },
      successTarget: { cash: 2000 },
      failSelf: {},
      failTarget: {},
    },
    {
      name: "联盟保护",
      desc: "双方本轮不能互相使用商战卡；若共同回答市场问题成功，双方声誉 +1。",
      successSelf: { reputation: 1 },
      successTarget: { reputation: 1 },
      failSelf: {},
      failTarget: {},
    },
  ],
};

let state = loadState();
let editingTeamId = null;
let pendingStrategyId = null;
let lastDrawnCards = {};
let lastInteractionCard = null;
let compactMode = localStorage.getItem("ai-monopoly-compact-mode") === "true";

const el = (id) => document.getElementById(id);
const logic = window.AiMonopolyLogic;
const h = (value) => logic.escapeHtml(value);
const money = (value) => `${value >= 0 ? "" : "-"}${Math.abs(value).toLocaleString()} 元`;

function uid(prefix) {
  return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function blankRoles() {
  return { ceo: "", cto: "", cmo: "", cfo: "" };
}

function makeTeam(name, project = "") {
  return {
    id: uid("team"),
    name,
    project,
    roles: blankRoles(),
    boardPosition: 0,
    metrics: { ...initialMetrics },
    records: [],
    props: [],
    scores: Object.fromEntries(scoreItems.map(([key]) => [key, 0])),
  };
}

function defaultState() {
  const classId = uid("class");
  const teams = [
    makeTeam("第一组", "AI 学习助手"),
    makeTeam("第二组", "校园事务 Agent"),
  ];
  teams[0].roles = { ceo: "产品同学", cto: "技术同学", cmo: "运营同学", cfo: "风控同学" };
  return {
    activeClassId: classId,
    activeTeamId: teams[0].id,
    classes: [{ id: classId, name: "AI 创新应用 1 班", teams }],
  };
}

function migrateState(rawState) {
  if (!rawState?.classes?.length) return defaultState();
  rawState.classes.forEach((cls) => {
    cls.teams = cls.teams || [];
    cls.teams.forEach((team) => {
      team.roles = { ...blankRoles(), ...(team.roles || {}) };
      team.boardPosition = Number.isInteger(team.boardPosition) ? team.boardPosition : 0;
      team.metrics = { ...initialMetrics, ...(team.metrics || {}) };
      team.records = team.records || [];
      team.props = (team.props || []).map((prop) => {
        const matched = propCards.find((card) => card.id === prop.id || card.name === prop.name) || {};
        return {
          ...matched,
          ...prop,
          effect: prop.effect || matched.effect || { kind: "note" },
          instanceId: prop.instanceId || uid("prop"),
          used: Boolean(prop.used),
        };
      });
      team.scores = { ...Object.fromEntries(scoreItems.map(([key]) => [key, 0])), ...(team.scores || {}) };
    });
  });
  rawState.activeClassId = rawState.activeClassId || rawState.classes[0].id;
  rawState.activeTeamId =
    rawState.activeTeamId ||
    rawState.classes.find((cls) => cls.id === rawState.activeClassId)?.teams?.[0]?.id ||
    null;
  return rawState;
}

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY) || localStorage.getItem(OLD_STORAGE_KEY);
    return raw ? migrateState(JSON.parse(raw)) : defaultState();
  } catch {
    return defaultState();
  }
}

function saveState() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    alert("保存失败：浏览器本地存储空间不足或不可用，请先导出数据备份。");
  }
}

function activeClass() {
  return state.classes.find((item) => item.id === state.activeClassId) || state.classes[0];
}

function activeTeam() {
  const cls = activeClass();
  return cls?.teams.find((item) => item.id === state.activeTeamId) || cls?.teams[0];
}

function clampMetrics(team) {
  ["users", "product", "tech", "reputation", "compliance"].forEach((key) => {
    team.metrics[key] = Math.max(0, Number(team.metrics[key]) || 0);
  });
  team.metrics.cash = Number(team.metrics.cash) || 0;
}

function normalizeDelta(delta = {}) {
  return { cash: 0, users: 0, product: 0, tech: 0, reputation: 0, compliance: 0, ...delta };
}

function applyMatchingPropIfConfirmed(team, delta) {
  const props = team.props || [];
  const candidates = props.filter((prop) => {
    if (prop.used) return false;
    const effect = prop.effect || {};
    if (effect.kind === "shield") return Number(delta[effect.metric]) < 0;
    if (effect.kind === "halvePenalty") {
      return effect.metric ? Number(delta[effect.metric]) < 0 : Object.values(delta).some((value) => Number(value) < 0);
    }
    return false;
  });
  const prop = candidates[0];
  if (!prop) return null;
  if (!confirm(`检测到可用道具卡「${prop.name}」。是否使用它来抵消或减轻本次损失？`)) return null;
  const result = logic.applyPropEffect(team, prop, delta);
  return result.note ? { ...result, prop } : null;
}

function applyDelta(delta, event, topic = el("roundTopic")?.value || "课堂经营", meta = {}) {
  const team = activeTeam();
  if (!team) return;
  let fullDelta = normalizeDelta(delta);
  let eventText = event;
  const transactionId = meta.transactionId || uid("tx");
  const propResult = applyMatchingPropIfConfirmed(team, fullDelta);
  if (propResult) {
    fullDelta = normalizeDelta(propResult.delta);
    eventText = `${eventText}；${propResult.note}`;
    meta = { ...meta, propUsed: propResult.prop.instanceId || propResult.prop.id };
  }
  Object.entries(fullDelta).forEach(([key, value]) => {
    team.metrics[key] += Number(value) || 0;
  });
  clampMetrics(team);
  team.records.unshift({
    id: uid("record"),
    transactionId,
    at: new Date().toLocaleString("zh-CN"),
    topic,
    event: eventText,
    delta: fullDelta,
    meta,
  });
  saveState();
  render();
}

function render() {
  renderClasses();
  renderTeams();
  renderTopbar();
  renderDock();
  renderMetrics();
  renderRoles();
  renderStrategies();
  renderPendingStrategy();
  renderQuickActions();
  renderLeaderboard();
  renderBoard();
  renderTargetTeamSelect();
  renderProps();
  renderScores();
  renderProfile();
  renderRecords();
}

function renderTargetTeamSelect() {
  const select = el("targetTeamSelect");
  if (!select) return;
  const cls = activeClass();
  const current = activeTeam();
  const teams = (cls?.teams || []).filter((team) => team.id !== current?.id);
  select.innerHTML = teams.length
    ? teams.map((team) => `<option value="${h(team.id)}">${h(team.name)}</option>`).join("")
    : `<option value="">暂无目标小组</option>`;
}

function renderClasses() {
  const list = el("classList");
  list.innerHTML = "";
  state.classes.forEach((cls) => {
    const button = document.createElement("button");
    button.className = `class-row ${cls.id === state.activeClassId ? "active" : ""}`;
    button.innerHTML = `${h(cls.name)}<span>${cls.teams.length} 个小组</span>`;
    button.addEventListener("click", () => {
      state.activeClassId = cls.id;
      state.activeTeamId = cls.teams[0]?.id || null;
      pendingStrategyId = null;
      saveState();
      render();
    });
    list.appendChild(button);
  });
}

function renderTeams() {
  const list = el("teamList");
  const cls = activeClass();
  list.innerHTML = "";
  if (!cls?.teams.length) {
    list.innerHTML = `<p class="empty">当前班级还没有小组。</p>`;
    return;
  }
  cls.teams.forEach((team) => {
    const button = document.createElement("button");
    button.className = `team-row ${team.id === state.activeTeamId ? "active" : ""}`;
    button.innerHTML = `${h(team.name)}<span>${h(team.project || "未填写项目名称")} · 估值 ${money(valuation(team))}</span>`;
    button.addEventListener("click", () => {
      state.activeTeamId = team.id;
      pendingStrategyId = null;
      saveState();
      render();
    });
    button.addEventListener("dblclick", () => openTeamDialog(team));
    list.appendChild(button);
  });
}

function renderTopbar() {
  const cls = activeClass();
  const team = activeTeam();
  el("currentClassLabel").textContent = cls ? `当前班级：${cls.name}` : "当前班级";
  el("currentTeamTitle").textContent = team
    ? `${team.name}${team.project ? ` · ${team.project}` : ""}`
    : "选择一个小组开始经营";
}

function renderDock() {
  document.body.classList.toggle("compact-mode", compactMode);
  const team = activeTeam();
  const button = el("quickClassBtn");
  if (button) button.textContent = compactMode ? "退出上课模式" : "上课模式";
  if (el("dockTeamName")) el("dockTeamName").textContent = team ? team.name : "未选择小组";
  if (el("dockCash")) el("dockCash").textContent = team ? `现金 ${money(team.metrics.cash)}` : "";
}

function renderMetrics() {
  const team = activeTeam();
  const strip = el("metricsStrip");
  strip.innerHTML = "";
  Object.entries(metricLabels).forEach(([key, label]) => {
    const div = document.createElement("div");
    div.className = "metric";
    const value = team ? team.metrics[key] : 0;
    div.innerHTML = `<span>${label}</span><strong>${key === "cash" ? money(value) : value}</strong>`;
    strip.appendChild(div);
  });
}

function renderRoles() {
  const team = activeTeam();
  const wrap = el("roleStrip");
  if (!team) {
    wrap.innerHTML = "";
    return;
  }
  wrap.innerHTML = Object.entries(roleLabels)
    .map(([key, label]) => `<div class="role-chip"><span>${label}</span><strong>${h(team.roles[key] || "未设置")}</strong></div>`)
    .join("");
}

function renderStrategies() {
  const grid = el("strategyGrid");
  const team = activeTeam();
  grid.innerHTML = "";
  strategies.forEach((strategy) => {
    const disabled = team && strategy.disabled?.(team);
    const button = document.createElement("button");
    button.className = `strategy-button ${pendingStrategyId === strategy.id ? "selected" : ""}`;
    button.disabled = disabled;
    const successDelta = strategyDelta(strategy, "success");
    button.innerHTML = `
      <div class="strategy-head">
        <h4>${strategy.name}</h4>
        <span>${roleLabels[strategy.role]}</span>
      </div>
      ${strategy.group ? `<em class="strategy-tag">${strategy.group}</em>` : ""}
      <p>成本 ${money(Math.abs(strategy.cost))}；成功：${formatDelta(successDelta)}</p>
      <p>${strategy.note}${disabled ? " 当前不可选。" : ""}</p>
    `;
    button.addEventListener("click", () => {
      pendingStrategyId = strategy.id;
      renderStrategies();
      renderPendingStrategy();
    });
    grid.appendChild(button);
  });
}

function renderPendingStrategy() {
  const box = el("pendingStrategy");
  const strategy = strategies.find((item) => item.id === pendingStrategyId);
  if (!strategy) {
    box.innerHTML = `<p class="empty">先从左侧选择一个运营策略，再根据课堂表现结算。</p>`;
    return;
  }
  const team = activeTeam();
  const speaker = team?.roles?.[strategy.role] || "对应角色";
  box.innerHTML = `
    <div class="pending-title">
      <div>
        <span>待判定策略</span>
        <h4>${strategy.name}</h4>
      </div>
      <strong>${roleLabels[strategy.role]}：${h(speaker)}</strong>
    </div>
    <p>${strategy.note}</p>
    <div class="settle-actions">
      <button class="primary-button" data-settle="success">成功</button>
      <button class="ghost-button" data-settle="partial">部分成功</button>
      <button class="danger-button" data-settle="fail">失败</button>
    </div>
  `;
  box.querySelectorAll("[data-settle]").forEach((button) => {
    button.addEventListener("click", () => settleStrategy(strategy, button.dataset.settle));
  });
}

function strategyDelta(strategy, result) {
  return normalizeDelta({ ...(strategy[result] || {}), cash: strategy.cost + (strategy[result]?.cash || 0) });
}

function settleStrategy(strategy, result) {
  const labels = { success: "成功", partial: "部分成功", fail: "失败" };
  applyDelta(strategyDelta(strategy, result), `策略${labels[result]}：${strategy.name}`);
  pendingStrategyId = null;
}

function renderQuickActions() {
  const wrap = el("quickActions");
  wrap.innerHTML = "";
  quickActions.forEach(([label, delta, note]) => {
    const button = document.createElement("button");
    button.className = "quick-button";
    button.innerHTML = `<strong>${label}</strong><span>${formatDelta(delta)} · ${note}</span>`;
    button.addEventListener("click", () => applyDelta(delta, note));
    wrap.appendChild(button);
  });
}

function renderLeaderboard() {
  const rows = el("leaderboardRows");
  if (!rows) return;
  const teams = [...(activeClass()?.teams || [])].sort((a, b) => valuation(b) - valuation(a));
  rows.innerHTML = teams.length
    ? teams
        .map((team, index) => {
          const m = team.metrics;
          return `
            <tr class="${team.id === state.activeTeamId ? "highlight-row" : ""}">
              <td>${index + 1}</td>
              <td>${h(team.name)}</td>
              <td>${h(team.project || "-")}</td>
              <td>${money(valuation(team))}</td>
              <td>${money(m.cash)}</td>
              <td>${m.users}</td>
              <td>${m.product}</td>
              <td>${m.tech}</td>
              <td>${m.reputation}</td>
              <td>${m.compliance}</td>
            </tr>
          `;
        })
        .join("")
    : `<tr><td colspan="10" class="empty">当前班级还没有小组。</td></tr>`;
}

function renderBoard() {
  const grid = el("boardGrid");
  const task = el("boardTask");
  if (!grid || !task) return;
  const team = activeTeam();
  if (!team) {
    grid.innerHTML = "";
    task.innerHTML = `<p class="empty">请选择小组。</p>`;
    return;
  }
  grid.innerHTML = boardCells
    .map((cell) => {
      const active = team.boardPosition === cell.index;
      return `
        <button class="board-cell ${active ? "active" : ""} type-${cell.type}" data-cell="${cell.index}">
          <span>${cell.index + 1}</span>
          <strong>${cell.title}</strong>
          <small>${cell.task}</small>
        </button>
      `;
    })
    .join("");
  grid.querySelectorAll("[data-cell]").forEach((button) => {
    button.addEventListener("click", () => setBoardPosition(Number(button.dataset.cell), "教师指定落点"));
  });
  const current = boardCells[team.boardPosition] || boardCells[0];
  task.innerHTML = `
    <div class="task-card">
      <span>${current.title}</span>
      <h4>${current.task}</h4>
      <p>${boardAdvice(current.type)}</p>
      <div class="settle-actions">
        <button class="primary-button" data-board-reward="success">完成优秀</button>
        <button class="ghost-button" data-board-reward="partial">基本完成</button>
        <button class="danger-button" data-board-reward="fail">处理失败</button>
      </div>
    </div>
  `;
  task.querySelectorAll("[data-board-reward]").forEach((button) => {
    button.addEventListener("click", () => settleBoardTask(current, button.dataset.boardReward));
  });
}

function setBoardPosition(position, reason) {
  const team = activeTeam();
  if (!team) return;
  const previousPosition = team.boardPosition || 0;
  team.boardPosition = position % boardCells.length;
  const cell = boardCells[team.boardPosition];
  applyDelta({}, `${reason}：${cell.title} - ${cell.task}`, "期末大富翁棋盘", {
    boardMove: { previousPosition, nextPosition: team.boardPosition },
  });
}

function rollDice() {
  const team = activeTeam();
  if (!team) return;
  const dice = Math.floor(Math.random() * 6) + 1;
  el("diceResult").textContent = dice;
  setBoardPosition((team.boardPosition + dice) % boardCells.length, `掷骰子 ${dice} 点`);
}

function settleBoardTask(cell, result) {
  const table = {
    product: { success: { product: 1 }, partial: {}, fail: { product: -1 } },
    tech: { success: { tech: 1 }, partial: {}, fail: { tech: -1 } },
    market: { success: { users: 30, reputation: 1 }, partial: { users: 10 }, fail: { users: -10 } },
    risk: { success: { compliance: 1 }, partial: {}, fail: { compliance: -1 } },
    capital: { success: { cash: 3000 }, partial: { cash: 1000 }, fail: {} },
    demo: { success: { product: 1, tech: 1 }, partial: { product: 1 }, fail: { reputation: -1 } },
    review: { success: { reputation: 1 }, partial: {}, fail: {} },
    final: { success: { reputation: 2, cash: 5000 }, partial: { reputation: 1 }, fail: {} },
    start: { success: {}, partial: {}, fail: {} },
    opportunity: { success: {}, partial: {}, fail: {} },
    crisis: { success: {}, partial: {}, fail: {} },
  };
  if (cell.type === "opportunity") {
    drawCard(opportunityCards, "opportunityCard", "机会卡");
    switchTab("cards");
    return;
  }
  if (cell.type === "crisis") {
    drawCard(crisisCards, "crisisCard", "危机卡");
    switchTab("cards");
    return;
  }
  const labels = { success: "优秀完成", partial: "基本完成", fail: "处理失败" };
  applyDelta(table[cell.type]?.[result] || {}, `${cell.title}${labels[result]}：${cell.task}`, "期末大富翁棋盘");
}

function boardAdvice(type) {
  const map = {
    product: "建议由 CEO / 产品经理回答，重点讲用户、痛点和取舍。",
    tech: "建议由 CTO 回答，重点讲 Agent、Workflow、Prompt 或知识库。",
    market: "建议由 CMO 回答，重点讲用户验证、渠道和竞品差异。",
    risk: "建议由 CFO 回答，重点讲隐私、版权、伦理和数据安全。",
    capital: "建议由 CFO 或 CEO 回答，重点讲成本、收益和继续投入理由。",
    demo: "建议 CTO 主演示，其他成员补充用户场景。",
    review: "建议全组复盘一次关键决策。",
    final: "进入最终投资人路演。",
    opportunity: "系统将抽取机会卡。",
    crisis: "系统将抽取危机卡。",
    start: "准备开始路演。",
  };
  return map[type] || "";
}

function renderProps() {
  const team = activeTeam();
  const list = el("propList");
  if (!team) {
    list.innerHTML = `<p class="empty">请选择小组。</p>`;
    return;
  }
  list.innerHTML = team.props.length
    ? team.props
        .map(
          (card, index) => `
        <div class="prop-card">
          <h4>${index + 1}. ${h(card.name)}${card.used ? "（已使用）" : ""}</h4>
          <p>${h(card.desc)}</p>
          ${
            card.used
              ? ""
              : `<div class="settle-actions"><button class="ghost-button" data-use-prop="${index}">使用</button></div>`
          }
        </div>`
        )
        .join("")
    : `<p class="empty">还没有购买道具卡。</p>`;
  list.querySelectorAll("[data-use-prop]").forEach((button) => {
    button.addEventListener("click", () => useProp(Number(button.dataset.useProp)));
  });
}

function renderScores() {
  const team = activeTeam();
  const form = el("scoreForm");
  form.innerHTML = "";
  let total = 0;
  scoreItems.forEach(([key, label, max]) => {
    const value = Number(team?.scores?.[key] || 0);
    total += value;
    const row = document.createElement("label");
    row.className = "score-row";
    row.innerHTML = `
      <div><strong>${label}</strong><span>满分 ${max}</span></div>
      <input data-score="${key}" type="number" min="0" max="${max}" value="${value}" />
    `;
    form.appendChild(row);
  });
  el("scoreTotal").textContent = total;
  form.querySelectorAll("[data-score]").forEach((input) => {
    input.addEventListener("input", updateLiveScoreTotal);
  });
}

function updateLiveScoreTotal() {
  let total = 0;
  document.querySelectorAll("[data-score]").forEach((input) => {
    const max = Number(input.max);
    total += Math.max(0, Math.min(max, Number(input.value) || 0));
  });
  el("scoreTotal").textContent = total;
}

function renderProfile() {
  const team = activeTeam();
  const wrap = el("profileSummary");
  if (!team) {
    wrap.innerHTML = `<p class="empty">请选择小组。</p>`;
    return;
  }
  const m = team.metrics;
  const prompts = [
    ["综合估值", money(valuation(team))],
    ["现金排名", `第 ${rankTeams("cash", team.id)} 名`],
    ["用户排名", `第 ${rankTeams("users", team.id)} 名`],
    ["棋盘位置", `${(team.boardPosition || 0) + 1} / ${boardCells.length}`],
    ["可购买道具", `${Math.max(0, Math.min(3 - team.props.length, Math.floor(m.cash / 3000)))} 张`],
    ["建议追问", buildPrompt(m)],
  ];
  wrap.innerHTML = prompts
    .map(([label, value]) => `<div class="profile-row"><strong>${label}</strong><span>${value}</span></div>`)
    .join("");
}

function renderRecords() {
  const team = activeTeam();
  const rows = el("recordRows");
  if (!team?.records.length) {
    rows.innerHTML = `<tr><td colspan="9" class="empty">暂无经营记录。</td></tr>`;
    return;
  }
  rows.innerHTML = team.records
    .map((record) => {
      const d = normalizeDelta(record.delta);
      return `
        <tr>
          <td>${h(record.at)}</td>
          <td>${h(record.topic)}</td>
          <td>${h(record.event)}</td>
          <td>${signedMoney(d.cash)}</td>
          <td>${signed(d.users)}</td>
          <td>${signed(d.product)}</td>
          <td>${signed(d.tech)}</td>
          <td>${signed(d.reputation)}</td>
          <td>${signed(d.compliance)}</td>
        </tr>
      `;
    })
    .join("");
}

function formatDelta(delta, exclude = []) {
  return (
    Object.entries(delta)
      .filter(([key, value]) => !exclude.includes(key) && value)
      .map(([key, value]) => `${metricLabels[key]} ${key === "cash" ? signedMoney(value) : signed(value)}`)
      .join("；") || "无指标变化"
  );
}

function signed(value) {
  const number = Number(value) || 0;
  return number > 0 ? `+${number}` : `${number}`;
}

function signedMoney(value) {
  const number = Number(value) || 0;
  return number > 0 ? `+${money(number)}` : money(number);
}

function valuation(team) {
  const m = team.metrics;
  return Math.round(m.cash + m.users * 80 + (m.product + m.tech) * 1200 + (m.reputation + m.compliance) * 900);
}

function rankTeams(metric, teamId) {
  const cls = activeClass();
  const sorted = [...(cls?.teams || [])].sort((a, b) => b.metrics[metric] - a.metrics[metric]);
  return sorted.findIndex((team) => team.id === teamId) + 1 || "-";
}

function buildPrompt(metrics) {
  if (metrics.compliance < 2) return "优先追问数据来源、授权和隐私边界";
  if (metrics.tech < 3) return "优先追问 Agent 架构和稳定性";
  if (metrics.product < 3) return "优先追问 MVP 取舍和真实痛点";
  if (metrics.users < 30) return "优先追问用户验证和推广策略";
  return "可追问商业模式、迭代计划和长期风险";
}

function drawCard(cards, targetId, type) {
  const card = cards[Math.floor(Math.random() * cards.length)];
  lastDrawnCards[targetId] = card;
  renderDrawnCard(targetId, card, type);
  applyDelta({}, `抽取${type}：${card.name}`, "期末大富翁决战");
}

function renderDrawnCard(targetId, card, type) {
  const canAuto = typeof card.settle === "function";
  const actions = canAuto
    ? `<button class="primary-button" data-card-auto="${targetId}">按条件结算</button>`
    : `<button class="primary-button" data-card-result="${targetId}:success">成功</button>
       <button class="danger-button" data-card-result="${targetId}:fail">失败</button>`;
  el(targetId).innerHTML = `
    <span class="type">${type}</span>
    <h4>${card.name}</h4>
    <p>${card.desc}</p>
    <div class="settle-actions">${actions}</div>
  `;
  el(targetId).querySelectorAll("[data-card-auto]").forEach((button) => {
    button.addEventListener("click", () => settleCard(targetId, "auto"));
  });
  el(targetId).querySelectorAll("[data-card-result]").forEach((button) => {
    const [, result] = button.dataset.cardResult.split(":");
    button.addEventListener("click", () => settleCard(targetId, result));
  });
}

function settleCard(targetId, result) {
  const card = lastDrawnCards[targetId];
  const team = activeTeam();
  if (!card || !team) return;
  const delta = result === "auto" ? card.settle(team) : card[result] || {};
  const resultLabel = result === "auto" ? "按条件结算" : result === "success" ? "成功结算" : "失败结算";
  applyDelta(delta, `${card.name}${resultLabel}`, "期末大富翁决战");
  el(targetId).querySelector(".settle-actions")?.remove();
}

function targetTeam() {
  const id = el("targetTeamSelect")?.value;
  return activeClass()?.teams.find((team) => team.id === id);
}

function applyDeltaToTeam(team, delta) {
  if (!team) return;
  const fullDelta = normalizeDelta(delta);
  Object.entries(fullDelta).forEach(([key, value]) => {
    team.metrics[key] += Number(value) || 0;
  });
  clampMetrics(team);
}

function addRecordToTeam(team, delta, event, topic = "组间互动卡", transactionId = uid("tx")) {
  if (!team) return;
  team.records.unshift({
    id: uid("record"),
    transactionId,
    at: new Date().toLocaleString("zh-CN"),
    topic,
    event,
    delta: normalizeDelta(delta),
    meta: { interaction: true },
  });
}

function applyInteraction(selfDelta, targetDelta, event) {
  const self = activeTeam();
  const target = targetTeam();
  if (!self || !target) {
    alert("请先选择一个目标小组。");
    return;
  }
  const transactionId = uid("tx");
  applyDeltaToTeam(self, selfDelta);
  applyDeltaToTeam(target, targetDelta);
  addRecordToTeam(self, selfDelta, `${event}；目标：${target.name}`, "组间互动卡", transactionId);
  addRecordToTeam(target, targetDelta, `${event}；来源：${self.name}`, "组间互动卡", transactionId);
  saveState();
  render();
}

function drawInteraction(type) {
  const deck = interactionDecks[type];
  const card = deck[Math.floor(Math.random() * deck.length)];
  lastInteractionCard = { ...card, type };
  renderInteractionCard();
}

function renderInteractionCard() {
  const box = el("interactionCard");
  const card = lastInteractionCard;
  if (!box) return;
  if (!card) {
    box.innerHTML = `<p class="empty">抽取一张组间互动卡后，在这里完成结算。</p>`;
    return;
  }
  const typeLabel = { coop: "合作卡", battle: "商战卡", negotiation: "谈判卡" }[card.type];
  let actions = "";
  if (card.type === "coop") {
    actions = `<button class="primary-button" data-interaction="coop">双方同意并结算</button>`;
  } else if (card.type === "battle") {
    actions = `
      <button class="primary-button" data-interaction="battle-success">防守成功</button>
      <button class="danger-button" data-interaction="battle-fail">防守失败</button>
    `;
  } else {
    actions = `
      <button class="primary-button" data-interaction="negotiation-success">谈判成功</button>
      <button class="danger-button" data-interaction="negotiation-fail">谈判失败</button>
    `;
  }
  box.innerHTML = `
    <span class="type">${typeLabel}</span>
    <h4>${card.name}</h4>
    <p>${card.desc}</p>
    ${card.defense ? `<p class="defense-tip">防守：${card.defense}</p>` : ""}
    <div class="settle-actions">${actions}</div>
  `;
  box.querySelectorAll("[data-interaction]").forEach((button) => {
    button.addEventListener("click", () => settleInteraction(button.dataset.interaction));
  });
}

function settleInteraction(result) {
  const card = lastInteractionCard;
  if (!card) return;
  if (result === "coop") {
    applyInteraction(card.self, card.target, `合作卡结算：${card.name}`);
  } else if (result === "battle-success") {
    applyInteraction(card.self || {}, card.targetSuccess || {}, `商战卡防守成功：${card.name}`);
  } else if (result === "battle-fail") {
    applyInteraction(card.self || {}, card.targetFail || {}, `商战卡防守失败：${card.name}`);
  } else if (result === "negotiation-success") {
    applyInteraction(card.successSelf || {}, card.successTarget || {}, `谈判卡成功：${card.name}`);
  } else if (result === "negotiation-fail") {
    applyInteraction(card.failSelf || {}, card.failTarget || {}, `谈判卡失败：${card.name}`);
  }
  lastInteractionCard = null;
  renderInteractionCard();
}

function useProp(index) {
  const team = activeTeam();
  const prop = team?.props?.[index];
  if (!team || !prop || prop.used) return;
  const effect = prop.effect || {};
  let delta = {};
  let choice = 0;
  if (effect.kind === "chooseDelta") {
    const labels = (effect.options || []).map((option, itemIndex) => `${itemIndex + 1}. ${option.label}`).join("\n");
    const answer = prompt(`请选择道具效果：\n${labels}`, "1");
    choice = Math.max(0, Math.min((effect.options || []).length - 1, Number(answer || 1) - 1));
  } else if (effect.kind === "note" || effect.kind === "shield" || effect.kind === "halvePenalty") {
    prop.used = true;
    prop.usedAt = new Date().toISOString();
    applyDelta({}, `使用道具卡：${prop.name}（${prop.desc}）`, "期末大富翁决战", {
      propUsed: prop.instanceId || prop.id,
    });
    return;
  }
  const result = logic.applyPropEffect(team, prop, delta, choice);
  applyDelta(result.delta, `使用道具卡：${prop.name}`, "期末大富翁决战", {
    propUsed: prop.instanceId || prop.id,
  });
}

function buyProp() {
  const team = activeTeam();
  if (!team) return;
  if (team.props.length >= 3) {
    alert("每组最多购买 3 张道具卡。");
    return;
  }
  if (team.metrics.cash < 3000) {
    alert("现金不足 3000 元，无法购买。");
    return;
  }
  const card = propCards[Math.floor(Math.random() * propCards.length)];
  const owned = { ...card, effect: { ...(card.effect || {}) }, instanceId: uid("prop"), used: false, acquiredAt: new Date().toISOString() };
  team.props.push(owned);
  applyDelta({ cash: -3000 }, `购买道具卡：${owned.name}`, "期末大富翁决战", { propAdded: owned.name });
}

function openTeamDialog(team = null) {
  editingTeamId = team?.id || null;
  el("dialogTitle").textContent = team ? "编辑小组与角色" : "新增小组";
  el("teamNameInput").value = team?.name || "";
  el("projectNameInput").value = team?.project || "";
  el("roleCeoInput").value = team?.roles?.ceo || "";
  el("roleCtoInput").value = team?.roles?.cto || "";
  el("roleCmoInput").value = team?.roles?.cmo || "";
  el("roleCfoInput").value = team?.roles?.cfo || "";
  el("teamDialog").showModal();
}

function saveTeamFromDialog(event) {
  event.preventDefault();
  const cls = activeClass();
  const name = el("teamNameInput").value.trim();
  const project = el("projectNameInput").value.trim();
  if (!name) return;
  const roles = {
    ceo: el("roleCeoInput").value.trim(),
    cto: el("roleCtoInput").value.trim(),
    cmo: el("roleCmoInput").value.trim(),
    cfo: el("roleCfoInput").value.trim(),
  };
  if (editingTeamId) {
    const team = cls.teams.find((item) => item.id === editingTeamId);
    team.name = name;
    team.project = project;
    team.roles = roles;
  } else {
    const team = makeTeam(name, project);
    team.roles = roles;
    cls.teams.push(team);
    state.activeTeamId = team.id;
  }
  saveState();
  el("teamDialog").close();
  render();
}

function addClass() {
  const name = prompt("请输入班级名称", `AI 创新应用 ${state.classes.length + 1} 班`);
  if (!name?.trim()) return;
  const cls = { id: uid("class"), name: name.trim(), teams: [] };
  state.classes.push(cls);
  state.activeClassId = cls.id;
  state.activeTeamId = null;
  pendingStrategyId = null;
  saveState();
  render();
}

function applyManual() {
  const delta = {
    cash: Number(el("manualCash").value) || 0,
    users: Number(el("manualUsers").value) || 0,
    product: Number(el("manualProduct").value) || 0,
    tech: Number(el("manualTech").value) || 0,
    reputation: Number(el("manualReputation").value) || 0,
    compliance: Number(el("manualCompliance").value) || 0,
  };
  const note = el("manualNote").value.trim() || "手动调整";
  applyDelta(delta, note);
  ["manualCash", "manualUsers", "manualProduct", "manualTech", "manualReputation", "manualCompliance"].forEach(
    (id) => (el(id).value = 0)
  );
  el("manualNote").value = "";
}

function saveScore() {
  const team = activeTeam();
  if (!team) return;
  document.querySelectorAll("[data-score]").forEach((input) => {
    const key = input.dataset.score;
    const max = Number(input.max);
    team.scores[key] = Math.max(0, Math.min(max, Number(input.value) || 0));
  });
  saveState();
  render();
}

function undoLast() {
  const team = activeTeam();
  if (!team || !logic.undoLastTransaction(state, team.id)) {
    alert("当前小组没有可撤销的记录。");
    return;
  }
  saveState();
  render();
}

function exportData() {
  const blob = new Blob([JSON.stringify(state, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `ai-monopoly-data-${new Date().toISOString().slice(0, 10)}.json`;
  link.click();
  URL.revokeObjectURL(url);
}

function importData(file) {
  const reader = new FileReader();
  reader.onload = () => {
    try {
      const parsed = JSON.parse(reader.result);
      const validation = logic.validateImportState(parsed);
      if (!validation.ok) throw new Error(validation.reason);
      const imported = migrateState(parsed);
      state = imported;
      saveState();
      render();
    } catch {
      alert("导入失败，请选择正确的 JSON 文件。");
    }
  };
  reader.readAsText(file);
}

function switchTab(name) {
  document.querySelectorAll(".tab").forEach((item) => item.classList.toggle("active", item.dataset.tab === name));
  document.querySelectorAll(".tab-view").forEach((item) => item.classList.remove("active"));
  el(`${name}View`).classList.add("active");
}

function bindEvents() {
  el("addClassBtn").addEventListener("click", addClass);
  el("addTeamBtn").addEventListener("click", () => openTeamDialog());
  el("editTeamBtn").addEventListener("click", () => {
    const team = activeTeam();
    if (team) openTeamDialog(team);
  });
  el("saveTeamBtn").addEventListener("click", saveTeamFromDialog);
  el("manualApplyBtn").addEventListener("click", applyManual);
  el("drawOpportunityBtn").addEventListener("click", () =>
    drawCard(opportunityCards, "opportunityCard", "机会卡")
  );
  el("drawCrisisBtn").addEventListener("click", () => drawCard(crisisCards, "crisisCard", "危机卡"));
  el("drawCoopBtn").addEventListener("click", () => drawInteraction("coop"));
  el("drawBattleBtn").addEventListener("click", () => drawInteraction("battle"));
  el("drawNegotiationBtn").addEventListener("click", () => drawInteraction("negotiation"));
  el("buyPropBtn").addEventListener("click", buyProp);
  el("rollDiceBtn").addEventListener("click", rollDice);
  el("saveScoreBtn").addEventListener("click", saveScore);
  el("undoBtn").addEventListener("click", undoLast);
  el("dockUndoBtn").addEventListener("click", undoLast);
  el("quickClassBtn").addEventListener("click", () => {
    compactMode = !compactMode;
    localStorage.setItem("ai-monopoly-compact-mode", String(compactMode));
    render();
  });
  document.querySelectorAll("[data-dock-tab]").forEach((button) => {
    button.addEventListener("click", () => switchTab(button.dataset.dockTab));
  });
  el("exportBtn").addEventListener("click", exportData);
  el("importInput").addEventListener("change", (event) => {
    const file = event.target.files[0];
    if (file) importData(file);
    event.target.value = "";
  });
  el("resetBtn").addEventListener("click", () => {
    if (!confirm("确定重置为示例数据吗？当前浏览器本地数据会被覆盖。建议先导出数据备份。")) return;
    state = defaultState();
    pendingStrategyId = null;
    saveState();
    render();
  });
  el("clearRecordsBtn").addEventListener("click", () => {
    const team = activeTeam();
    if (!team || !confirm("确定清空本组经营记录吗？资源数值不会重置。")) return;
    team.records = [];
    saveState();
    render();
  });
  document.querySelectorAll(".tab").forEach((tab) => {
    tab.addEventListener("click", () => switchTab(tab.dataset.tab));
  });
}

bindEvents();
render();
