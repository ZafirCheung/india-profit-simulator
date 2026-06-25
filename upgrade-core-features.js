/**
 * 盈利模拟器核心功能升级补丁
 * 功能1: 获客渠道拆分（付费 vs 推荐）
 * 功能2: 促销成本细化（4个子项）
 * 功能3: 模式切换（社交/真金/自定义）
 *
 * 使用方法：在原HTML文件的</body>前添加 <script src="upgrade-core-features.js"></script>
 */

(function() {
  'use strict';

  // ==================== 新增字段定义 ====================

  const newFields = {
    // 模式切换
    businessMode: { type: 'mode', default: 'rmg', values: ['social', 'rmg', 'custom'] },

    // 获客渠道拆分
    paidChannelRatio: { type: 'percent', default: 40, min: 0, max: 100, step: 5 },
    paidChannelCac: { type: 'currency', default: 180, min: 50, max: 800, step: 10 },
    referralChannelCac: { type: 'currency', default: 60, min: 20, max: 200, step: 5 },

    // 促销成本细化
    firstDepositBonus: { type: 'percent', default: 10, min: 5, max: 20, step: 0.5 },
    dailyRebate: { type: 'percent', default: 3, min: 1, max: 8, step: 0.5 },
    eventBonus: { type: 'percent', default: 2, min: 1, max: 6, step: 0.5 },
    vipBenefit: { type: 'percent', default: 1.5, min: 0.5, max: 5, step: 0.5 }
  };

  // ==================== 三种预设模式 ====================

  const modePresets = {
    social: {
      name: '社交娱乐模式',
      description: '虚拟货币，不可提现，广告+IAP变现',
      overrides: {
        withdrawRate: 0,
        adArpdau: 1.5,
        payerRate: 3.5,
        arppu: 500,
        withdrawProcessCost: 0,
        fraudLossRate: 0.5,
        effectiveTax: 3
      }
    },
    rmg: {
      name: '真金模式',
      description: '可充值提现，通过House Edge盈利',
      overrides: {
        withdrawRate: 68,
        adArpdau: 0.15,
        payerRate: 5.2,
        arppu: 1000,
        withdrawProcessCost: 8,
        fraudLossRate: 1.2,
        effectiveTax: 8
      }
    },
    custom: {
      name: '自定义模式',
      description: '所有参数手动调整',
      overrides: {}
    }
  };

  // ==================== 升级后的计算逻辑 ====================

  function computeUpgraded(input) {
    // 1. 获客渠道拆分计算
    const paidBudget = input.marketingBudget * (input.paidChannelRatio / 100);
    const referralBudget = input.marketingBudget * (1 - input.paidChannelRatio / 100);

    const paidUsers = paidBudget / Math.max(input.paidChannelCac, 1);
    const referralUsers = referralBudget / Math.max(input.referralChannelCac, 1);
    const totalPaidRegisters = paidUsers + referralUsers;

    // 加权平均CAC
    const weightedAvgCac = input.marketingBudget / Math.max(totalPaidRegisters, 1);

    const totalRegisters = totalPaidRegisters * (1 + input.organicUplift / 100);
    const activatedUsers = totalRegisters * input.activationRate / 100;
    const mau = input.baseMau + activatedUsers;
    const dau = mau * input.stickiness / 100;

    // 首充用户计算
    const firstDepositUsers = activatedUsers * input.firstDepositRate / 100;
    const firstDepositRevenue = firstDepositUsers * input.firstDepositAmount;

    // 付费用户
    const regularPayers = mau * input.payerRate / 100;
    const whalePayers = regularPayers * input.whaleRate / 100;
    const normalPayers = regularPayers - whalePayers;

    // 收入计算
    const iapRevenue = normalPayers * input.arppu + whalePayers * input.whaleArppu;
    const adRevenue = dau * input.adArpdau * 30;
    const subscriptionRevenue = (mau * input.subscriptionRate / 100) * input.subscriptionPrice;
    const b2bRevenue = input.b2bRevenue || 0;
    const grossRevenue = iapRevenue + adRevenue + subscriptionRevenue + b2bRevenue + firstDepositRevenue;

    // 支付成功率影响
    const actualRevenue = grossRevenue * (input.paymentSuccessRate / 100);
    const paymentLoss = grossRevenue - actualRevenue;

    // 2. 促销成本细化计算
    const totalPromoRate =
      input.firstDepositBonus +
      input.dailyRebate +
      input.eventBonus +
      input.vipBenefit;

    const promoCost = actualRevenue * (totalPromoRate / 100);

    // 其他成本
    const paymentFeeCost = actualRevenue * (input.paymentFee / 100);
    const providerShareCost = actualRevenue * (input.providerShare / 100);
    const taxCost = actualRevenue * (input.effectiveTax / 100);

    const revenueCosts = paymentFeeCost + providerShareCost + promoCost + taxCost;
    const cloudCost = mau * input.cloudCost;
    const complianceCost = totalRegisters * input.complianceCost;
    const withdrawalCost = (regularPayers * 0.5) * input.withdrawProcessCost;
    const fraudLoss = actualRevenue * (input.fraudLossRate / 100);

    const variableCosts = revenueCosts + cloudCost + complianceCost + withdrawalCost + fraudLoss;
    const totalCosts = variableCosts + input.marketingBudget + input.fixedOpex;
    const netProfit = actualRevenue - totalCosts;
    const profitMargin = actualRevenue > 0 ? netProfit / actualRevenue : 0;

    // 提现计算
    const totalDeposit = iapRevenue + firstDepositRevenue;
    const withdrawAmount = totalDeposit * (input.withdrawRate / 100);
    const netCashFlow = totalDeposit - withdrawAmount;

    // LTV计算
    const userRevenue = iapRevenue + adRevenue + subscriptionRevenue;
    const monthlyArpu = mau > 0 ? userRevenue / mau : 0;
    const revenueCostRate = revenueCosts / Math.max(actualRevenue, 1);
    const monthlyContribution = Math.max(0, monthlyArpu * (1 - revenueCostRate) - input.cloudCost);
    const ltv = monthlyContribution * input.lifetimeMonths;
    const adjustedLtv = ltv * input.activationRate / 100;
    const ltvCac = weightedAvgCac > 0 ? adjustedLtv / weightedAvgCac : 0;
    const paybackMonths = monthlyContribution > 0 ? weightedAvgCac / (monthlyContribution * input.activationRate / 100) : Infinity;
    const breakEvenCac = adjustedLtv;

    return {
      // 新增渠道数据
      paidUsers,
      referralUsers,
      totalPaidRegisters,
      weightedAvgCac,
      paidBudget,
      referralBudget,

      // 新增促销细分
      firstDepositBonusCost: actualRevenue * (input.firstDepositBonus / 100),
      dailyRebateCost: actualRevenue * (input.dailyRebate / 100),
      eventBonusCost: actualRevenue * (input.eventBonus / 100),
      vipBenefitCost: actualRevenue * (input.vipBenefit / 100),
      totalPromoRate,
      promoCost,

      // 原有数据
      totalRegisters,
      activatedUsers,
      firstDepositUsers,
      firstDepositRevenue,
      mau,
      dau,
      regularPayers,
      whalePayers,
      normalPayers,
      iapRevenue,
      adRevenue,
      subscriptionRevenue,
      b2bRevenue,
      grossRevenue,
      actualRevenue,
      paymentLoss,
      paymentSuccessRate: input.paymentSuccessRate,
      totalDeposit,
      withdrawAmount,
      withdrawRate: input.withdrawRate,
      netCashFlow,
      revenueCostRate,
      revenueCosts,
      cloudCost,
      complianceCost,
      withdrawalCost,
      fraudLoss,
      variableCosts,
      totalCosts,
      netProfit,
      profitMargin,
      monthlyArpu,
      monthlyContribution,
      ltv,
      adjustedLtv,
      ltvCac,
      paybackMonths,
      breakEvenCac
    };
  }

  // ==================== UI 增强 ====================

  function addModeSwitcher() {
    const toolbar = document.querySelector('.toolbar');
    if (!toolbar) return;

    const modeSwitcher = document.createElement('div');
    modeSwitcher.className = 'mode-switcher';
    modeSwitcher.innerHTML = `
      <button class="mode-btn" data-mode="social">社交娱乐</button>
      <button class="mode-btn active" data-mode="rmg">真金模式</button>
      <button class="mode-btn" data-mode="custom">自定义</button>
    `;

    // 插入到toolbar的segmented前面
    const segmented = toolbar.querySelector('.segmented');
    toolbar.insertBefore(modeSwitcher, segmented);

    // 添加样式
    const style = document.createElement('style');
    style.textContent = `
      .mode-switcher {
        display: inline-flex;
        gap: 8px;
        padding: 4px;
        border-radius: 12px;
        background: var(--control);
        border: 0.5px solid var(--hairline);
        box-shadow: var(--shadow-sm);
      }
      .mode-btn {
        padding: 6px 14px;
        border: 0;
        border-radius: 8px;
        background: transparent;
        color: var(--muted);
        font-size: 12px;
        font-weight: 500;
        cursor: pointer;
        transition: all 0.2s;
        white-space: nowrap;
      }
      .mode-btn.active {
        background: var(--accent);
        color: white;
        box-shadow: 0 2px 6px rgba(0, 122, 255, 0.25);
      }
      .mode-btn:hover:not(.active) {
        background: rgba(0, 0, 0, 0.05);
      }
    `;
    document.head.appendChild(style);

    // 绑定切换事件
    modeSwitcher.querySelectorAll('.mode-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const mode = btn.dataset.mode;
        switchMode(mode);

        // 更新按钮状态
        modeSwitcher.querySelectorAll('.mode-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
      });
    });
  }

  function switchMode(mode) {
    const preset = modePresets[mode];
    if (!preset) return;

    // 应用预设值
    Object.entries(preset.overrides).forEach(([key, value]) => {
      const input = document.getElementById(key);
      if (input) {
        input.value = value;
        // 触发input事件更新显示
        input.dispatchEvent(new Event('input', { bubbles: true }));
      }
    });

    // 显示提示
    showToast(`已切换到${preset.name}`);
  }

  function showToast(message) {
    const toast = document.createElement('div');
    toast.textContent = message;
    toast.style.cssText = `
      position: fixed;
      top: 80px;
      left: 50%;
      transform: translateX(-50%);
      padding: 12px 24px;
      background: var(--accent);
      color: white;
      border-radius: 999px;
      font-size: 13px;
      font-weight: 500;
      box-shadow: 0 4px 16px rgba(0, 122, 255, 0.3);
      z-index: 10000;
      animation: slideDown 0.3s ease;
    `;

    const keyframes = `
      @keyframes slideDown {
        from { opacity: 0; transform: translateX(-50%) translateY(-10px); }
        to { opacity: 1; transform: translateX(-50%) translateY(0); }
      }
    `;
    const style = document.createElement('style');
    style.textContent = keyframes;
    document.head.appendChild(style);

    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 2000);
  }

  function addNewControls() {
    const acquisitionSection = document.querySelector('.section');
    if (!acquisitionSection) return;

    // 添加渠道拆分控件
    const channelSplitHTML = `
      <div class="control">
        <div class="label-row">
          <label for="paidChannelRatio">付费渠道占比 ⭐</label>
          <span class="value" id="paidChannelRatioValue"></span>
        </div>
        <input id="paidChannelRatio" type="range" min="0" max="100" step="5" value="40">
        <p class="hint">Google/FB/KOL等付费渠道占营销预算的比例，其余为推荐/老带新。</p>
      </div>
      <div class="control">
        <div class="label-row">
          <label for="paidChannelCac">付费渠道CAC</label>
          <span class="value" id="paidChannelCacValue"></span>
        </div>
        <input id="paidChannelCac" type="range" min="50" max="800" step="10" value="180">
        <p class="hint">付费广告渠道的平均获客成本。</p>
      </div>
      <div class="control">
        <div class="label-row">
          <label for="referralChannelCac">推荐渠道CAC</label>
          <span class="value" id="referralChannelCacValue"></span>
        </div>
        <input id="referralChannelCac" type="range" min="20" max="200" step="5" value="60">
        <p class="hint">老带新/推荐奖励的获客成本，通常是付费渠道的1/3。</p>
      </div>
      <div class="control">
        <div class="label-row">
          <label>加权平均CAC ⭐</label>
          <span class="value" id="weightedAvgCacDisplay" style="background: rgba(0, 122, 255, 0.1); border-color: var(--accent); color: var(--accent); font-weight: 600;">-</span>
        </div>
        <p class="hint">根据渠道占比自动计算的实际平均CAC。</p>
      </div>
    `;

    // 在第一个control后插入
    const firstControl = acquisitionSection.querySelector('.control');
    if (firstControl) {
      firstControl.insertAdjacentHTML('afterend', channelSplitHTML);
    }
  }

  function addPromotionBreakdown() {
    // 找到成本section
    const sections = document.querySelectorAll('.section');
    let costSection = null;
    sections.forEach(sec => {
      const h2 = sec.querySelector('h2');
      if (h2 && h2.textContent.includes('成本与税费')) {
        costSection = sec;
      }
    });

    if (!costSection) return;

    // 找到促销成本control
    const promoControl = Array.from(costSection.querySelectorAll('.control')).find(ctrl => {
      const label = ctrl.querySelector('label');
      return label && label.textContent.includes('奖金与促销');
    });

    if (!promoControl) return;

    // 替换为细分控件
    const promoBreakdownHTML = `
      <div class="control">
        <div class="label-row">
          <label for="firstDepositBonus">首充奖金成本 ⭐</label>
          <span class="value" id="firstDepositBonusValue"></span>
        </div>
        <input id="firstDepositBonus" type="range" min="5" max="20" step="0.5" value="10">
        <p class="hint">首充100%/200% Match Bonus的成本占收入比例。</p>
      </div>
      <div class="control">
        <div class="label-row">
          <label for="dailyRebate">每日返水</label>
          <span class="value" id="dailyRebateValue"></span>
        </div>
        <input id="dailyRebate" type="range" min="1" max="8" step="0.5" value="3">
        <p class="hint">充值返水、VIP返水的成本。</p>
      </div>
      <div class="control">
        <div class="label-row">
          <label for="eventBonus">活动赠金</label>
          <span class="value" id="eventBonusValue"></span>
        </div>
        <input id="eventBonus" type="range" min="1" max="6" step="0.5" value="2">
        <p class="hint">签到奖励、节日活动等赠金成本。</p>
      </div>
      <div class="control">
        <div class="label-row">
          <label for="vipBenefit">VIP特权成本</label>
          <span class="value" id="vipBenefitValue"></span>
        </div>
        <input id="vipBenefit" type="range" min="0.5" max="5" step="0.5" value="1.5">
        <p class="hint">VIP专属礼包、生日礼金等特权成本。</p>
      </div>
      <div class="control">
        <div class="label-row">
          <label>总促销成本 ⭐</label>
          <span class="value" id="totalPromoDisplay" style="background: rgba(255, 59, 48, 0.1); border-color: var(--danger); color: var(--danger); font-weight: 600;">-</span>
        </div>
        <p class="hint">上述4项自动求和，占收入比例。</p>
      </div>
    `;

    promoControl.outerHTML = promoBreakdownHTML;
  }

  function enhanceBreakdownTable() {
    // 在renderBreakdown中添加新行
    const originalRenderBreakdown = window.renderBreakdown;
    if (typeof originalRenderBreakdown !== 'function') return;

    window.renderBreakdown = function(input, result) {
      const rows = [
        ["新增注册用户", result.totalRegisters, null, "number"],
        ["├─ 付费渠道", result.paidUsers || 0, null, "number"],
        ["└─ 推荐渠道", result.referralUsers || 0, null, "number"],
        ["加权平均CAC", result.weightedAvgCac || input.cac, null, "currency"],
        ["新增活跃用户", result.activatedUsers, null, "number"],
        ["首充用户", result.firstDepositUsers, result.firstDepositUsers / result.activatedUsers, "number"],
        ["MAU / DAU", `${window.fmtNumber.format(result.mau)} / ${window.fmtNumber.format(result.dau)}`, null, "text"],
        ["付费用户（普通/大R）", `${window.fmtNumber.format(result.normalPayers)} / ${window.fmtNumber.format(result.whalePayers)}`, null, "text"],
        ["首充收入", result.firstDepositRevenue, result.firstDepositRevenue / result.actualRevenue, "currency"],
        ["IAP 虚拟商品收入", result.iapRevenue, result.iapRevenue / result.actualRevenue, "currency"],
        ["订阅收入", result.subscriptionRevenue, result.subscriptionRevenue / result.actualRevenue, "currency"],
        ["广告收入", result.adRevenue, result.adRevenue / result.actualRevenue, "currency"],
        ["总充值额", result.totalDeposit, null, "currency"],
        ["提现金额", -result.withdrawAmount, -result.withdrawAmount / result.actualRevenue, "currency"],
        ["净现金流入", result.netCashFlow, null, "currency"],
        ["支付失败损失", -result.paymentLoss, -result.paymentLoss / result.grossRevenue, "currency"],
        ["促销成本细分：", null, null, "header"],
        ["├─ 首充奖金", -result.firstDepositBonusCost, -result.firstDepositBonusCost / result.actualRevenue, "currency"],
        ["├─ 每日返水", -result.dailyRebateCost, -result.dailyRebateCost / result.actualRevenue, "currency"],
        ["├─ 活动赠金", -result.eventBonusCost, -result.eventBonusCost / result.actualRevenue, "currency"],
        ["└─ VIP特权", -result.vipBenefitCost, -result.vipBenefitCost / result.actualRevenue, "currency"],
        ["其他收入成本", -(result.revenueCosts - result.promoCost), -(result.revenueCosts - result.promoCost) / result.actualRevenue, "currency"],
        ["云与客服", -result.cloudCost, -result.cloudCost / result.actualRevenue, "currency"],
        ["提现审核成本", -result.withdrawalCost, -result.withdrawalCost / result.actualRevenue, "currency"],
        ["欺诈损失", -result.fraudLoss, -result.fraudLoss / result.actualRevenue, "currency"],
        ["获客投放", -input.marketingBudget, -input.marketingBudget / result.actualRevenue, "currency"],
        ["固定运营", -input.fixedOpex, -input.fixedOpex / result.actualRevenue, "currency"]
      ];

      const breakdownTable = document.getElementById('breakdown');
      if (!breakdownTable) return;

      breakdownTable.innerHTML = rows.map(([name, value, share, type]) => {
        if (type === "header") {
          return `<tr><td colspan="3" style="font-weight: 600; color: var(--accent); padding-top: 12px;">${name}</td></tr>`;
        }
        const formatted = type === "number"
          ? window.fmtNumber.format(value)
          : type === "text"
            ? value
            : window.fmtCurrency.format(value);
        const shareText = share === null || !Number.isFinite(share) ? "-" : window.fmtDecimal.format(share * 100) + "%";
        return `<tr><td>${name}</td><td>${formatted}</td><td>${shareText}</td></tr>`;
      }).join("");
    };
  }

  // ==================== 初始化 ====================

  function init() {
    // 等待DOM加载完成
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', init);
      return;
    }

    console.log('🚀 盈利模拟器核心功能升级补丁已加载');

    // 添加UI组件
    addModeSwitcher();
    addNewControls();
    addPromotionBreakdown();
    enhanceBreakdownTable();

    // 覆盖计算函数
    if (typeof window.compute === 'function') {
      window.computeOriginal = window.compute;
      window.compute = computeUpgraded;
    }

    // 注册新字段
    if (typeof window.collect === 'function') {
      const originalCollect = window.collect;
      window.collect = function() {
        const data = originalCollect();
        // 添加新字段
        Object.keys(newFields).forEach(key => {
          const elem = document.getElementById(key);
          if (elem) {
            data[key] = elem.type === 'checkbox' ? elem.checked : Number(elem.value);
          } else {
            data[key] = newFields[key].default;
          }
        });
        return data;
      };
    }

    // 更新render函数
    const originalRender = window.render;
    if (typeof originalRender === 'function') {
      window.render = function() {
        originalRender();

        // 更新加权平均CAC显示
        const input = window.collect();
        const result = window.compute(input);

        const weightedCacDisplay = document.getElementById('weightedAvgCacDisplay');
        if (weightedCacDisplay) {
          weightedCacDisplay.textContent = window.fmtCurrency.format(result.weightedAvgCac || input.cac);
        }

        // 更新总促销成本显示
        const totalPromoDisplay = document.getElementById('totalPromoDisplay');
        if (totalPromoDisplay && result.totalPromoRate) {
          totalPromoDisplay.textContent = window.fmtDecimal.format(result.totalPromoRate) + '%';
        }

        // 更新新字段的值显示
        ['paidChannelRatio', 'paidChannelCac', 'referralChannelCac',
         'firstDepositBonus', 'dailyRebate', 'eventBonus', 'vipBenefit'].forEach(id => {
          const input = document.getElementById(id);
          const valueSpan = document.getElementById(id + 'Value');
          if (input && valueSpan) {
            const value = Number(input.value);
            const field = newFields[id];
            if (field) {
              if (field.type === 'percent') {
                valueSpan.textContent = window.fmtDecimal.format(value) + '%';
              } else if (field.type === 'currency') {
                valueSpan.textContent = window.fmtCurrency.format(value);
              }
            }
            // 更新range填充
            const min = Number(input.min);
            const max = Number(input.max);
            const fill = ((value - min) / (max - min)) * 100;
            input.style.setProperty('--fill', `${fill}%`);
          }
        });
      };
    }

    // 绑定新字段的input事件
    Object.keys(newFields).forEach(key => {
      const elem = document.getElementById(key);
      if (elem) {
        elem.addEventListener('input', () => {
          if (window.render) window.render();
        });
      }
    });

    console.log('✅ 升级完成！新功能：\n1. 获客渠道拆分\n2. 促销成本细化\n3. 模式切换按钮');
  }

  // 自动初始化
  init();
})();
