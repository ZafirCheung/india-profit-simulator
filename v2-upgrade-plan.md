# 盈利模拟器 V2 完整升级计划

## 📊 数据字段变更总览

### ❌ 删除字段（3个）
1. `b2bRevenue` - B2B/授权收入（移除）
2. `subscriptionRate` - 订阅渗透（移除）
3. `subscriptionPrice` - 订阅月费（移除）

### ➕ 新增字段（29个）

#### 模式切换（1个）
1. `businessMode` - 业务模式：social(社交) / rmg(真金) / custom(自定义)

#### 获客渠道拆分（3个）
2. `paidChannelRatio` - 付费渠道占比 (0-100%)
3. `paidChannelCac` - 付费渠道CAC (₹50-800)
4. `referralChannelCac` - 推荐渠道CAC (₹20-200)

#### 留存率（6个）
5. `retentionD1` - 次日留存 (20-70%)
6. `retentionD7` - 七日留存 (10-50%)
7. `retentionD30` - 月留存 (5-30%)
8. `payerRetentionD7` - 付费用户7日留存 (40-90%)
9. `payerRetentionD30` - 付费用户30日留存 (30-70%)
10. `payerRetentionD90` - 付费用户90日留存 (15-50%)

#### 流失召回（3个）
11. `recallBudgetRatio` - 召回预算占比 (5-40%)
12. `recallSuccessRate` - 召回成功率 (3-25%)
13. `recallUserLtvRatio` - 召回用户LTV倍数 (0.4-1.0)

#### 促销成本细化（4个）
14. `firstDepositBonus` - 首充奖金成本 (5-20%)
15. `dailyRebate` - 每日返水 (1-8%)
16. `eventBonus` - 活动赠金 (1-6%)
17. `vipBenefit` - VIP特权成本 (0.5-5%)

#### 用户分群（6个）
18. `smallPayerRatio` - 小R占比(<₹1000) (40-80%)
19. `smallPayerArppu` - 小R月ARPPU (₹200-900)
20. `midPayerRatio` - 中R占比(₹1000-10000) (15-50%)
21. `midPayerArppu` - 中R月ARPPU (₹2000-8000)
22. `whaleRatio` - 大R占比(>₹10000) [已有]
23. `whaleArppu` - 大R月ARPPU [已有]

#### 现金流管理（2个）
24. `liquidityReserve` - 流动性储备 (₹50万-5亿)
25. `reserveTargetMonths` - 目标储备月数 (1-6个月)

#### 风控与合规（4个）
26. `riskReserveFund` - 月风险准备金 (₹10万-500万)
27. `domainBanProbability` - 域名被封概率/月 (0-30%)
28. `banLossRate` - 被封后流失率 (10-60%)
29. `recoveryDays` - 恢复时间 (1-14天)

#### 支付渠道细化（已有paymentSuccessRate，需拆分为3个子项）
- 保持原有字段，在UI层面拆分显示

#### 订阅改为单一字段（1个）
30. `subscriptionRevenue` - 会员月费收入 (₹0-500万)

---

## 🎨 UI结构重构

### 新增：模式切换区（顶部工具栏）
```html
<div class="mode-switcher">
  <button data-mode="social">社交娱乐模式</button>
  <button data-mode="rmg" class="active">真金模式</button>
  <button data-mode="custom">自定义</button>
</div>
```

**行为**：
- 社交模式：提现率→0%，隐藏提现相关，显示广告，广告ARPDAU→₹1.5
- 真金模式：提现率→68%，显示提现相关，隐藏广告
- 自定义模式：所有字段可调

---

### 左侧控制面板重构（7个section）

#### Section 1: 获客与渠道 ⭐新增
```
📊 获客渠道分布
├─ 月营销预算：₹___
├─ 付费渠道占比：___%
│  └─ 付费CAC：₹___
├─ 推荐渠道占比：___% (自动 = 100% - 付费占比)
│  └─ 推荐CAC：₹___
└─ 加权平均CAC：₹___ (自动计算，只读)

📈 转化漏斗
├─ 自然新增放大：___%
├─ 注册到活跃：___%
├─ 首充转化率：___%
└─ 首充金额：₹___
```

#### Section 2: 用户留存 ⭐新增
```
👥 全体用户留存
├─ 次日留存(D1)：___%
├─ 七日留存(D7)：___%
└─ 月留存(D30)：___%

💰 付费用户留存
├─ 首充后7日：___%
├─ 首充后30日：___%
└─ 首充后90日：___%
```

#### Section 3: 活跃与流失召回 ⭐部分新增
```
📱 用户活跃
├─ 当前月活基数：___
├─ DAU/MAU：___%
└─ 平均付费生命周期：___ 个月

🔄 流失召回
├─ 召回预算占比：___%
├─ 召回成功率：___%
└─ 召回用户LTV倍数：___x
```

#### Section 4: 变现结构 ⭐改版
```
💵 付费率与ARPU
├─ 整体付费率：___%
├─ 月充值次数：___ 次

💎 用户价值分层
├─ 小R(<₹1000)：
│   ├─ 占比：___%
│   └─ 月ARPPU：₹___
├─ 中R(₹1000-10000)：
│   ├─ 占比：___%
│   └─ 月ARPPU：₹___
└─ 大R(>₹10000)：
    ├─ 占比：___%
    └─ 月ARPPU：₹___

💰 其他收入
├─ 提现率：___% (真金模式显示)
├─ 广告ARPDAU：₹___ (社交模式显示)
└─ 会员月费收入：₹___
```

#### Section 5: 成本结构 ⭐改版
```
💳 支付与交易
├─ 支付通道费：___%
├─ 支付成功率：___%
└─ 游戏供应商分成：___%

🎁 促销成本细分
├─ 首充奖金：___%
├─ 每日返水：___%
├─ 活动赠金：___%
└─ VIP特权：___%
└─ 总促销成本：___% (自动计算，只读)

🛡️ 风控成本
├─ 提现审核成本：₹___/笔
├─ 欺诈损失率：___%
└─ 每新增合规成本：₹___
```

#### Section 6: 运营成本
```
💻 基础运营
├─ 有效税费/合规：___%
├─ 每MAU云与客服：₹___
└─ 月固定运营成本：₹___
```

#### Section 7: 风险管理 ⭐新增（默认折叠）
```
⚖️ 合规与风险
├─ 月风险准备金：₹___
├─ 域名被封概率：___%/月
├─ 被封后流失率：___%
└─ 恢复时间：___ 天

💰 现金流储备
├─ 流动性储备：₹___
└─ 目标储备月数：___ 个月
```

---

### 右侧仪表盘重构

#### 新增：智能诊断面板（置顶）
```html
<div class="diagnostic-panel">
  <h3>⚠️ 关键问题</h3>
  <div id="criticalIssues"></div>
  
  <h3>💡 优化建议</h3>
  <div id="quickSuggestions"></div>
</div>
```

**逻辑**：
- 最多显示3个最严重的问题
- 最多显示3个最有效的优化建议
- 根据优先级排序

#### 指标卡片扩展到12个（4×3网格）

**第一行（核心财务）**
1. 月净利润
2. 月实际收入
3. 净利率
4. LTV/CAC

**第二行（现金流与风险）**
5. 净现金流
6. 流动性覆盖
7. 提现率
8. 支付成功率

**第三行（用户质量）**
9. 首充转化
10. D7留存率
11. 付费用户30日留存
12. 加权平均CAC

---

## 🧮 计算逻辑更新

### 1. 获客成本计算（新逻辑）
```javascript
// 旧逻辑
const avgCac = input.cac;
const newUsers = marketingBudget / avgCac;

// 新逻辑
const paidBudget = marketingBudget * (input.paidChannelRatio / 100);
const referralBudget = marketingBudget * (1 - input.paidChannelRatio / 100);

const paidUsers = paidBudget / input.paidChannelCac;
const referralUsers = referralBudget / input.referralChannelCac;
const totalNewUsers = paidUsers + referralUsers;

const weightedAvgCac = marketingBudget / totalNewUsers;
```

### 2. 用户分群收入计算（新逻辑）
```javascript
// 旧逻辑
const iapRevenue = totalPayers * input.arppu;

// 新逻辑
const totalPayers = mau * (input.payerRate / 100);

const smallPayers = totalPayers * (input.smallPayerRatio / 100);
const midPayers = totalPayers * (input.midPayerRatio / 100);
const whalePayers = totalPayers * (input.whaleRatio / 100);

const iapRevenue = 
  smallPayers * input.smallPayerArppu +
  midPayers * input.midPayerArppu +
  whalePayers * input.whaleArppu;
```

### 3. 促销成本计算（新逻辑）
```javascript
// 旧逻辑
const promoCost = actualRevenue * (input.promoRate / 100);

// 新逻辑
const totalPromoRate = 
  input.firstDepositBonus +
  input.dailyRebate +
  input.eventBonus +
  input.vipBenefit;

const promoCost = actualRevenue * (totalPromoRate / 100);
```

### 4. 流失召回收入（新逻辑）
```javascript
const recallBudget = marketingBudget * (input.recallBudgetRatio / 100);
const churnedUsers = mau * (1 - input.retentionD30 / 100); // 简化估算
const recalledUsers = churnedUsers * (input.recallSuccessRate / 100);
const recallCac = recallBudget / Math.max(recalledUsers, 1);

// 召回用户贡献（LTV较低）
const recallUserLtv = adjustedLtv * input.recallUserLtvRatio;
```

### 5. 现金流覆盖月数（新逻辑）
```javascript
const monthlyWithdraw = withdrawAmount; // 当月提现额
const coverageMonths = input.liquidityReserve / Math.max(monthlyWithdraw, 1);

// 预警
if (coverageMonths < 1) {
  risk = "high"; // 红色
} else if (coverageMonths < 3) {
  risk = "medium"; // 黄色
} else {
  risk = "low"; // 绿色
}
```

### 6. 风险损失计算（新逻辑）
```javascript
// 域名被封预期损失
const banExpectedLoss = 
  (input.domainBanProbability / 100) * // 被封概率
  (result.grossRevenue * (input.recoveryDays / 30)) * // 损失天数收入
  (input.banLossRate / 100); // 流失率

// 加入总成本
const totalCosts = ... + input.riskReserveFund + banExpectedLoss;
```

---

## 🎯 智能诊断逻辑

### 关键问题检测（按优先级）

```javascript
const issues = [];

// P0 - 致命问题
if (result.ltvCac < 1) {
  issues.push({
    level: 'critical',
    title: 'LTV/CAC 低于 1',
    desc: '无法盈利，立即停止放量',
    priority: 100
  });
}

if (result.netCashFlow < 0 && result.coverageMonths < 1) {
  issues.push({
    level: 'critical',
    title: '现金流枯竭风险',
    desc: `流动性储备仅能覆盖${result.coverageMonths.toFixed(1)}个月`,
    priority: 95
  });
}

// P1 - 严重问题
if (result.withdrawRate > 80) {
  issues.push({
    level: 'warning',
    title: `提现率过高 ${result.withdrawRate}%`,
    desc: '玩家赢太多，检查RTP设置',
    priority: 80
  });
}

if (result.paymentSuccessRate < 75) {
  issues.push({
    level: 'warning',
    title: `支付成功率仅 ${result.paymentSuccessRate}%`,
    desc: `每月损失 ${shortMoney(result.paymentLoss)}`,
    priority: 75
  });
}

if (result.retentionD7 < 15) {
  issues.push({
    level: 'warning',
    title: 'D7留存率过低',
    desc: '产品吸引力不足',
    priority: 70
  });
}

// P2 - 需关注
if (result.firstDepositRate < 20) {
  issues.push({
    level: 'info',
    title: '首充转化率偏低',
    desc: '优化新手引导和首充门槛',
    priority: 60
  });
}

// 排序并返回前3个
return issues.sort((a, b) => b.priority - a.priority).slice(0, 3);
```

### 优化建议生成

```javascript
const suggestions = [];

// 基于问题提供建议
if (result.ltvCac < 1.5) {
  suggestions.push({
    title: '降低获客成本',
    actions: [
      `提升推荐渠道占比至 ${Math.min(60, input.paidChannelRatio + 20)}%`,
      '优化落地页转化率',
      '暂停ROI<1的渠道'
    ]
  });
}

if (result.withdrawRate > 75) {
  suggestions.push({
    title: '调整游戏经济',
    actions: [
      '降低RTP至94-96%',
      '检查是否有刷单行为',
      '增加游戏难度'
    ]
  });
}

if (result.paymentSuccessRate < 80) {
  suggestions.push({
    title: '优化支付通道',
    actions: [
      '接入2-3家备用支付网关',
      '实现失败自动切换',
      `预期提升转化率 ${((80 - result.paymentSuccessRate) * 0.6).toFixed(1)}%`
    ]
  });
}

return suggestions.slice(0, 3);
```

---

## 📱 响应式适配

### 移动端（<860px）
- 12个指标卡片改为2列布局（6行）
- 智能诊断面板置顶，默认折叠
- Section 7 风险管理默认折叠

### 平板端（860-1400px）
- 指标卡片改为3列布局（4行）
- 左侧面板可折叠

---

## 🚀 分步实施计划

### Phase 1: 数据结构（2小时）
1. 更新presets，添加30个新字段
2. 更新fields数组
3. 更新compute()函数

### Phase 2: UI重构（3小时）
4. 添加模式切换按钮
5. 重构左侧7个section
6. 添加智能诊断面板
7. 扩展指标卡片到12个

### Phase 3: 逻辑优化（2小时）
8. 实现新的计算逻辑
9. 实现智能诊断算法
10. 更新render()函数

### Phase 4: 测试优化（1小时）
11. 测试三种模式切换
12. 验证所有计算逻辑
13. 优化响应式布局

---

## 📊 预期效果

### 功能提升
- ✅ 支持3种业务模式快速切换
- ✅ 获客成本拆分，CAC可降低30-50%
- ✅ 用户分层，精准识别高价值用户
- ✅ 留存分层，定位流失环节
- ✅ 现金流预警，避免流动性危机
- ✅ 风险量化，评估法律风险
- ✅ 智能诊断，自动识别Top 3问题

### 使用体验
- ✅ 新手：选择模式→一键设置
- ✅ 运营：快速定位问题环节
- ✅ 财务：现金流和风险可视化
- ✅ 决策：智能建议直接可执行

---

下一步：开始实施 Phase 1 - 数据结构更新
