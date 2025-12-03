/**
 * Three-Statement Financial Model
 *
 * Links Income Statement, Balance Sheet, and Cash Flow Statement
 * for comprehensive financial planning and analysis
 *
 * @module lib/finance/three-statement-model
 */

// ============================================================
// Types
// ============================================================

export interface MonthlyRevenue {
  month: Date;
  mrr: number;
  newMrr: number;
  expansionMrr: number;
  churnMrr: number;
  contractionMrr: number;
}

export interface IncomeStatement {
  period: {
    start: Date;
    end: Date;
  };
  revenue: {
    subscriptionRevenue: number;
    apiRevenue: number;
    servicesRevenue: number;
    totalRevenue: number;
  };
  costOfRevenue: {
    aiApiCosts: number;
    infrastructureCosts: number;
    paymentProcessingFees: number;
    totalCogs: number;
  };
  grossProfit: number;
  grossMargin: number;
  operatingExpenses: {
    salaries: number;
    benefits: number;
    software: number;
    marketing: number;
    legal: number;
    insurance: number;
    officeAndAdmin: number;
    totalOpex: number;
  };
  operatingIncome: number;
  operatingMargin: number;
  otherIncomeExpense: {
    interestIncome: number;
    interestExpense: number;
    otherIncome: number;
    totalOther: number;
  };
  pretaxIncome: number;
  taxes: number;
  netIncome: number;
  netMargin: number;
}

export interface BalanceSheet {
  asOfDate: Date;
  assets: {
    current: {
      cash: number;
      accountsReceivable: number;
      prepaidExpenses: number;
      totalCurrentAssets: number;
    };
    nonCurrent: {
      propertyEquipment: number;
      accumulatedDepreciation: number;
      netPropertyEquipment: number;
      intangibleAssets: number;
      otherAssets: number;
      totalNonCurrentAssets: number;
    };
    totalAssets: number;
  };
  liabilities: {
    current: {
      accountsPayable: number;
      accruedExpenses: number;
      deferredRevenue: number;
      currentPortionLongTermDebt: number;
      totalCurrentLiabilities: number;
    };
    nonCurrent: {
      longTermDebt: number;
      otherLiabilities: number;
      totalNonCurrentLiabilities: number;
    };
    totalLiabilities: number;
  };
  equity: {
    commonStock: number;
    additionalPaidInCapital: number;
    retainedEarnings: number;
    totalEquity: number;
  };
  totalLiabilitiesAndEquity: number;
}

export interface CashFlowStatement {
  period: {
    start: Date;
    end: Date;
  };
  operatingActivities: {
    netIncome: number;
    adjustments: {
      depreciation: number;
      amortization: number;
      stockBasedCompensation: number;
    };
    workingCapitalChanges: {
      accountsReceivable: number;
      prepaidExpenses: number;
      accountsPayable: number;
      accruedExpenses: number;
      deferredRevenue: number;
    };
    netCashFromOperations: number;
  };
  investingActivities: {
    capitalExpenditures: number;
    acquisitions: number;
    otherInvesting: number;
    netCashFromInvesting: number;
  };
  financingActivities: {
    equityIssuance: number;
    debtIssuance: number;
    debtRepayment: number;
    dividends: number;
    otherFinancing: number;
    netCashFromFinancing: number;
  };
  netChangeInCash: number;
  beginningCash: number;
  endingCash: number;
}

export interface ThreeStatementModel {
  incomeStatement: IncomeStatement;
  balanceSheet: BalanceSheet;
  cashFlowStatement: CashFlowStatement;
  metrics: FinancialMetrics;
}

export interface FinancialMetrics {
  // Profitability
  grossMargin: number;
  operatingMargin: number;
  netMargin: number;
  returnOnEquity: number;
  returnOnAssets: number;

  // Liquidity
  currentRatio: number;
  quickRatio: number;
  cashRatio: number;
  workingCapital: number;

  // Efficiency
  daysOfCash: number;
  arTurnover: number;
  apTurnover: number;

  // SaaS Specific
  arr: number;
  mrr: number;
  ltv: number;
  cac: number;
  ltvCacRatio: number;
  cacPaybackMonths: number;
  netRevenueRetention: number;
  grossRevenueRetention: number;
  magicNumber: number;
  burnMultiple: number;
  ruleOf40: number;
}

export interface ForecastAssumptions {
  revenue: {
    growthRate: number;           // Monthly MRR growth rate
    churnRate: number;            // Monthly churn rate
    expansionRate: number;        // Monthly expansion rate
    arpu: number;                 // Average revenue per user
  };
  costs: {
    cogsPercent: number;          // COGS as % of revenue
    aiApiPercent: number;         // AI API costs as % of revenue
    infraPercent: number;         // Infrastructure as % of revenue
    paymentPercent: number;       // Payment processing as % of revenue
  };
  opex: {
    salariesMonthly: number;      // Monthly salaries
    benefitsPercent: number;      // Benefits as % of salaries
    softwareMonthly: number;      // Monthly software costs
    marketingPercent: number;     // Marketing as % of revenue
    legalMonthly: number;         // Monthly legal costs
    insuranceMonthly: number;     // Monthly insurance
    adminMonthly: number;         // Monthly admin costs
  };
  balance: {
    arDays: number;               // Days to collect receivables
    apDays: number;               // Days to pay payables
    deferredRevenueMonths: number; // Months of deferred revenue
  };
}

// ============================================================
// Default Assumptions for AI Perception
// ============================================================

export const DEFAULT_ASSUMPTIONS: ForecastAssumptions = {
  revenue: {
    growthRate: 0.10,      // 10% monthly growth
    churnRate: 0.03,       // 3% monthly churn
    expansionRate: 0.02,   // 2% monthly expansion
    arpu: 49,              // $49 ARPU
  },
  costs: {
    cogsPercent: 0.15,     // 15% COGS (target 85% gross margin)
    aiApiPercent: 0.08,    // 8% AI API costs
    infraPercent: 0.05,    // 5% infrastructure
    paymentPercent: 0.029, // 2.9% Stripe fees
  },
  opex: {
    salariesMonthly: 0,    // Solo founder, no salaries yet
    benefitsPercent: 0.25, // 25% benefits load
    softwareMonthly: 500,  // $500/mo software
    marketingPercent: 0.20, // 20% marketing spend
    legalMonthly: 200,     // $200/mo legal
    insuranceMonthly: 100, // $100/mo insurance
    adminMonthly: 100,     // $100/mo admin
  },
  balance: {
    arDays: 0,             // Immediate payment (Stripe)
    apDays: 30,            // Net 30 payables
    deferredRevenueMonths: 0.5, // Half month deferred
  },
};

// ============================================================
// Three Statement Model Builder
// ============================================================

export class ThreeStatementModelBuilder {
  private assumptions: ForecastAssumptions;

  constructor(assumptions: ForecastAssumptions = DEFAULT_ASSUMPTIONS) {
    this.assumptions = assumptions;
  }

  /**
   * Build a complete three-statement model for a period
   */
  buildModel(
    periodStart: Date,
    periodEnd: Date,
    startingMrr: number,
    startingCash: number,
    previousBalanceSheet?: BalanceSheet
  ): ThreeStatementModel {
    // Calculate months in period
    const months = this.monthsBetween(periodStart, periodEnd);

    // Project monthly revenue
    const monthlyRevenue = this.projectRevenue(startingMrr, months);
    const totalRevenue = monthlyRevenue.reduce((sum, m) => sum + m.mrr, 0);

    // Build Income Statement
    const incomeStatement = this.buildIncomeStatement(
      periodStart,
      periodEnd,
      totalRevenue
    );

    // Build Balance Sheet
    const balanceSheet = this.buildBalanceSheet(
      periodEnd,
      incomeStatement,
      startingCash,
      previousBalanceSheet
    );

    // Build Cash Flow Statement
    const cashFlowStatement = this.buildCashFlowStatement(
      periodStart,
      periodEnd,
      incomeStatement,
      balanceSheet,
      previousBalanceSheet
    );

    // Calculate metrics
    const metrics = this.calculateMetrics(
      incomeStatement,
      balanceSheet,
      monthlyRevenue[monthlyRevenue.length - 1]?.mrr || startingMrr
    );

    return {
      incomeStatement,
      balanceSheet,
      cashFlowStatement,
      metrics,
    };
  }

  /**
   * Project revenue for multiple months
   */
  private projectRevenue(startingMrr: number, months: number): MonthlyRevenue[] {
    const revenue: MonthlyRevenue[] = [];
    let mrr = startingMrr;

    for (let i = 0; i < months; i++) {
      const newMrr = mrr * this.assumptions.revenue.growthRate;
      const expansionMrr = mrr * this.assumptions.revenue.expansionRate;
      const churnMrr = mrr * this.assumptions.revenue.churnRate;
      const contractionMrr = mrr * 0.01; // 1% contraction

      mrr = mrr + newMrr + expansionMrr - churnMrr - contractionMrr;

      revenue.push({
        month: new Date(Date.now() + i * 30 * 24 * 60 * 60 * 1000),
        mrr,
        newMrr,
        expansionMrr,
        churnMrr,
        contractionMrr,
      });
    }

    return revenue;
  }

  /**
   * Build Income Statement
   */
  private buildIncomeStatement(
    periodStart: Date,
    periodEnd: Date,
    totalRevenue: number
  ): IncomeStatement {
    const months = this.monthsBetween(periodStart, periodEnd);

    // Revenue breakdown
    const subscriptionRevenue = totalRevenue * 0.90; // 90% subscriptions
    const apiRevenue = totalRevenue * 0.05;          // 5% API
    const servicesRevenue = totalRevenue * 0.05;     // 5% services

    // Cost of Revenue
    const aiApiCosts = totalRevenue * this.assumptions.costs.aiApiPercent;
    const infrastructureCosts = totalRevenue * this.assumptions.costs.infraPercent;
    const paymentProcessingFees = totalRevenue * this.assumptions.costs.paymentPercent;
    const totalCogs = aiApiCosts + infrastructureCosts + paymentProcessingFees;

    const grossProfit = totalRevenue - totalCogs;
    const grossMargin = totalRevenue > 0 ? grossProfit / totalRevenue : 0;

    // Operating Expenses
    const salaries = this.assumptions.opex.salariesMonthly * months;
    const benefits = salaries * this.assumptions.opex.benefitsPercent;
    const software = this.assumptions.opex.softwareMonthly * months;
    const marketing = totalRevenue * this.assumptions.opex.marketingPercent;
    const legal = this.assumptions.opex.legalMonthly * months;
    const insurance = this.assumptions.opex.insuranceMonthly * months;
    const officeAndAdmin = this.assumptions.opex.adminMonthly * months;
    const totalOpex = salaries + benefits + software + marketing + legal + insurance + officeAndAdmin;

    const operatingIncome = grossProfit - totalOpex;
    const operatingMargin = totalRevenue > 0 ? operatingIncome / totalRevenue : 0;

    // Other Income/Expense (minimal for early stage)
    const interestIncome = 0;
    const interestExpense = 0;
    const otherIncome = 0;
    const totalOther = interestIncome - interestExpense + otherIncome;

    const pretaxIncome = operatingIncome + totalOther;
    const taxes = pretaxIncome > 0 ? pretaxIncome * 0.21 : 0; // 21% federal rate
    const netIncome = pretaxIncome - taxes;
    const netMargin = totalRevenue > 0 ? netIncome / totalRevenue : 0;

    return {
      period: { start: periodStart, end: periodEnd },
      revenue: {
        subscriptionRevenue,
        apiRevenue,
        servicesRevenue,
        totalRevenue,
      },
      costOfRevenue: {
        aiApiCosts,
        infrastructureCosts,
        paymentProcessingFees,
        totalCogs,
      },
      grossProfit,
      grossMargin,
      operatingExpenses: {
        salaries,
        benefits,
        software,
        marketing,
        legal,
        insurance,
        officeAndAdmin,
        totalOpex,
      },
      operatingIncome,
      operatingMargin,
      otherIncomeExpense: {
        interestIncome,
        interestExpense,
        otherIncome,
        totalOther,
      },
      pretaxIncome,
      taxes,
      netIncome,
      netMargin,
    };
  }

  /**
   * Build Balance Sheet
   */
  private buildBalanceSheet(
    asOfDate: Date,
    incomeStatement: IncomeStatement,
    startingCash: number,
    previousBalance?: BalanceSheet
  ): BalanceSheet {
    const revenue = incomeStatement.revenue.totalRevenue;

    // Current Assets
    const cash = startingCash + incomeStatement.netIncome; // Simplified
    const accountsReceivable = (revenue / 365) * this.assumptions.balance.arDays;
    const prepaidExpenses = incomeStatement.operatingExpenses.software / 12 * 3; // 3 months prepaid
    const totalCurrentAssets = cash + accountsReceivable + prepaidExpenses;

    // Non-Current Assets
    const propertyEquipment = 0; // No hardware
    const accumulatedDepreciation = 0;
    const netPropertyEquipment = 0;
    const intangibleAssets = 0;
    const otherAssets = 0;
    const totalNonCurrentAssets = netPropertyEquipment + intangibleAssets + otherAssets;

    const totalAssets = totalCurrentAssets + totalNonCurrentAssets;

    // Current Liabilities
    const accountsPayable = (incomeStatement.costOfRevenue.totalCogs / 365) * this.assumptions.balance.apDays;
    const accruedExpenses = incomeStatement.operatingExpenses.salaries / 12; // 1 month accrued
    const deferredRevenue = revenue * this.assumptions.balance.deferredRevenueMonths / 12;
    const currentPortionLongTermDebt = 0;
    const totalCurrentLiabilities = accountsPayable + accruedExpenses + deferredRevenue + currentPortionLongTermDebt;

    // Non-Current Liabilities
    const longTermDebt = 0;
    const otherLiabilities = 0;
    const totalNonCurrentLiabilities = longTermDebt + otherLiabilities;

    const totalLiabilities = totalCurrentLiabilities + totalNonCurrentLiabilities;

    // Equity
    const commonStock = previousBalance?.equity.commonStock || 100; // $100 par value
    const additionalPaidInCapital = previousBalance?.equity.additionalPaidInCapital || 0;
    const retainedEarnings = (previousBalance?.equity.retainedEarnings || 0) + incomeStatement.netIncome;
    const totalEquity = commonStock + additionalPaidInCapital + retainedEarnings;

    const totalLiabilitiesAndEquity = totalLiabilities + totalEquity;

    return {
      asOfDate,
      assets: {
        current: {
          cash,
          accountsReceivable,
          prepaidExpenses,
          totalCurrentAssets,
        },
        nonCurrent: {
          propertyEquipment,
          accumulatedDepreciation,
          netPropertyEquipment,
          intangibleAssets,
          otherAssets,
          totalNonCurrentAssets,
        },
        totalAssets,
      },
      liabilities: {
        current: {
          accountsPayable,
          accruedExpenses,
          deferredRevenue,
          currentPortionLongTermDebt,
          totalCurrentLiabilities,
        },
        nonCurrent: {
          longTermDebt,
          otherLiabilities,
          totalNonCurrentLiabilities,
        },
        totalLiabilities,
      },
      equity: {
        commonStock,
        additionalPaidInCapital,
        retainedEarnings,
        totalEquity,
      },
      totalLiabilitiesAndEquity,
    };
  }

  /**
   * Build Cash Flow Statement
   */
  private buildCashFlowStatement(
    periodStart: Date,
    periodEnd: Date,
    incomeStatement: IncomeStatement,
    currentBalance: BalanceSheet,
    previousBalance?: BalanceSheet
  ): CashFlowStatement {
    const prev = previousBalance || {
      assets: {
        current: { accountsReceivable: 0, prepaidExpenses: 0, cash: 0 },
      },
      liabilities: {
        current: { accountsPayable: 0, accruedExpenses: 0, deferredRevenue: 0 },
      },
    } as BalanceSheet;

    // Operating Activities
    const netIncome = incomeStatement.netIncome;
    const depreciation = 0;
    const amortization = 0;
    const stockBasedCompensation = 0;

    // Working Capital Changes (decrease in asset = source, increase in liability = source)
    const arChange = prev.assets.current.accountsReceivable - currentBalance.assets.current.accountsReceivable;
    const prepaidChange = prev.assets.current.prepaidExpenses - currentBalance.assets.current.prepaidExpenses;
    const apChange = currentBalance.liabilities.current.accountsPayable - prev.liabilities.current.accountsPayable;
    const accruedChange = currentBalance.liabilities.current.accruedExpenses - prev.liabilities.current.accruedExpenses;
    const deferredChange = currentBalance.liabilities.current.deferredRevenue - prev.liabilities.current.deferredRevenue;

    const netCashFromOperations = netIncome + depreciation + amortization + stockBasedCompensation +
      arChange + prepaidChange + apChange + accruedChange + deferredChange;

    // Investing Activities
    const capitalExpenditures = 0;
    const acquisitions = 0;
    const otherInvesting = 0;
    const netCashFromInvesting = -(capitalExpenditures + acquisitions) + otherInvesting;

    // Financing Activities
    const equityIssuance = currentBalance.equity.additionalPaidInCapital - (prev.equity?.additionalPaidInCapital || 0);
    const debtIssuance = 0;
    const debtRepayment = 0;
    const dividends = 0;
    const otherFinancing = 0;
    const netCashFromFinancing = equityIssuance + debtIssuance - debtRepayment - dividends + otherFinancing;

    const netChangeInCash = netCashFromOperations + netCashFromInvesting + netCashFromFinancing;
    const beginningCash = prev.assets.current.cash;
    const endingCash = beginningCash + netChangeInCash;

    return {
      period: { start: periodStart, end: periodEnd },
      operatingActivities: {
        netIncome,
        adjustments: {
          depreciation,
          amortization,
          stockBasedCompensation,
        },
        workingCapitalChanges: {
          accountsReceivable: arChange,
          prepaidExpenses: prepaidChange,
          accountsPayable: apChange,
          accruedExpenses: accruedChange,
          deferredRevenue: deferredChange,
        },
        netCashFromOperations,
      },
      investingActivities: {
        capitalExpenditures,
        acquisitions,
        otherInvesting,
        netCashFromInvesting,
      },
      financingActivities: {
        equityIssuance,
        debtIssuance,
        debtRepayment,
        dividends,
        otherFinancing,
        netCashFromFinancing,
      },
      netChangeInCash,
      beginningCash,
      endingCash,
    };
  }

  /**
   * Calculate financial metrics
   */
  private calculateMetrics(
    incomeStatement: IncomeStatement,
    balanceSheet: BalanceSheet,
    currentMrr: number
  ): FinancialMetrics {
    const revenue = incomeStatement.revenue.totalRevenue;
    const netIncome = incomeStatement.netIncome;
    const totalAssets = balanceSheet.assets.totalAssets;
    const totalEquity = balanceSheet.equity.totalEquity;
    const currentAssets = balanceSheet.assets.current.totalCurrentAssets;
    const currentLiabilities = balanceSheet.liabilities.current.totalCurrentLiabilities;
    const cash = balanceSheet.assets.current.cash;

    // Profitability
    const grossMargin = incomeStatement.grossMargin * 100;
    const operatingMargin = incomeStatement.operatingMargin * 100;
    const netMargin = incomeStatement.netMargin * 100;
    const returnOnEquity = totalEquity !== 0 ? (netIncome / totalEquity) * 100 : 0;
    const returnOnAssets = totalAssets !== 0 ? (netIncome / totalAssets) * 100 : 0;

    // Liquidity
    const currentRatio = currentLiabilities !== 0 ? currentAssets / currentLiabilities : 0;
    const quickRatio = currentLiabilities !== 0 ?
      (currentAssets - 0) / currentLiabilities : 0; // No inventory
    const cashRatio = currentLiabilities !== 0 ? cash / currentLiabilities : 0;
    const workingCapital = currentAssets - currentLiabilities;

    // Efficiency
    const monthlyExpenses = incomeStatement.costOfRevenue.totalCogs +
      incomeStatement.operatingExpenses.totalOpex;
    const daysOfCash = monthlyExpenses !== 0 ? (cash / (monthlyExpenses / 30)) : 0;
    const arTurnover = revenue !== 0 ?
      revenue / balanceSheet.assets.current.accountsReceivable : 0;
    const apTurnover = incomeStatement.costOfRevenue.totalCogs !== 0 ?
      incomeStatement.costOfRevenue.totalCogs / balanceSheet.liabilities.current.accountsPayable : 0;

    // SaaS Metrics
    const mrr = currentMrr;
    const arr = mrr * 12;
    const churnRate = this.assumptions.revenue.churnRate;
    const ltv = churnRate > 0 ? (mrr / churnRate) * incomeStatement.grossMargin : 0;
    const monthlyMarketing = revenue * this.assumptions.opex.marketingPercent / 12;
    const newCustomersPerMonth = mrr * this.assumptions.revenue.growthRate / this.assumptions.revenue.arpu;
    const cac = newCustomersPerMonth > 0 ? monthlyMarketing / newCustomersPerMonth : 0;
    const ltvCacRatio = cac > 0 ? ltv / cac : 0;
    const cacPaybackMonths = cac > 0 && (mrr * incomeStatement.grossMargin / 12) > 0 ?
      cac / (this.assumptions.revenue.arpu * incomeStatement.grossMargin) : 0;

    const netRevenueRetention = (1 + this.assumptions.revenue.expansionRate - this.assumptions.revenue.churnRate) * 100;
    const grossRevenueRetention = (1 - this.assumptions.revenue.churnRate) * 100;

    // Magic Number: Net New ARR / Sales & Marketing Spend
    const netNewArr = arr * this.assumptions.revenue.growthRate * 12;
    const annualMarketing = monthlyMarketing * 12;
    const magicNumber = annualMarketing > 0 ? netNewArr / annualMarketing : 0;

    // Burn Multiple: Net Burn / Net New ARR
    const netBurn = netIncome < 0 ? -netIncome : 0;
    const burnMultiple = netNewArr > 0 ? netBurn / netNewArr : 0;

    // Rule of 40: Growth Rate + Profit Margin
    const growthRate = this.assumptions.revenue.growthRate * 12 * 100; // Annualized
    const ruleOf40 = growthRate + operatingMargin;

    return {
      grossMargin,
      operatingMargin,
      netMargin,
      returnOnEquity,
      returnOnAssets,
      currentRatio,
      quickRatio,
      cashRatio,
      workingCapital,
      daysOfCash,
      arTurnover,
      apTurnover,
      arr,
      mrr,
      ltv,
      cac,
      ltvCacRatio,
      cacPaybackMonths,
      netRevenueRetention,
      grossRevenueRetention,
      magicNumber,
      burnMultiple,
      ruleOf40,
    };
  }

  /**
   * Calculate months between two dates
   */
  private monthsBetween(start: Date, end: Date): number {
    const months = (end.getFullYear() - start.getFullYear()) * 12 +
      (end.getMonth() - start.getMonth());
    return Math.max(1, months);
  }

  /**
   * Generate a multi-year forecast
   */
  generateForecast(
    years: number,
    startingMrr: number,
    startingCash: number
  ): ThreeStatementModel[] {
    const models: ThreeStatementModel[] = [];
    let previousBalance: BalanceSheet | undefined;
    let currentMrr = startingMrr;
    let currentCash = startingCash;

    for (let year = 0; year < years; year++) {
      const periodStart = new Date(2025 + year, 0, 1);
      const periodEnd = new Date(2025 + year, 11, 31);

      const model = this.buildModel(
        periodStart,
        periodEnd,
        currentMrr,
        currentCash,
        previousBalance
      );

      models.push(model);

      // Update for next year
      previousBalance = model.balanceSheet;
      currentMrr = model.metrics.mrr;
      currentCash = model.balanceSheet.assets.current.cash;
    }

    return models;
  }

  /**
   * Format model as markdown report
   */
  formatAsMarkdown(model: ThreeStatementModel): string {
    const is = model.incomeStatement;
    const bs = model.balanceSheet;
    const cf = model.cashFlowStatement;
    const m = model.metrics;

    const formatCurrency = (n: number) => `$${n.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
    const formatPercent = (n: number) => `${n.toFixed(1)}%`;

    return `
# Three-Statement Financial Model

## Period: ${is.period.start.toISOString().split('T')[0]} to ${is.period.end.toISOString().split('T')[0]}

---

## Income Statement

| Line Item | Amount |
|-----------|--------|
| **Revenue** | |
| Subscription Revenue | ${formatCurrency(is.revenue.subscriptionRevenue)} |
| API Revenue | ${formatCurrency(is.revenue.apiRevenue)} |
| Services Revenue | ${formatCurrency(is.revenue.servicesRevenue)} |
| **Total Revenue** | **${formatCurrency(is.revenue.totalRevenue)}** |
| | |
| **Cost of Revenue** | |
| AI API Costs | ${formatCurrency(is.costOfRevenue.aiApiCosts)} |
| Infrastructure Costs | ${formatCurrency(is.costOfRevenue.infrastructureCosts)} |
| Payment Processing | ${formatCurrency(is.costOfRevenue.paymentProcessingFees)} |
| **Total COGS** | **${formatCurrency(is.costOfRevenue.totalCogs)}** |
| | |
| **Gross Profit** | **${formatCurrency(is.grossProfit)}** |
| Gross Margin | ${formatPercent(is.grossMargin * 100)} |
| | |
| **Operating Expenses** | |
| Marketing | ${formatCurrency(is.operatingExpenses.marketing)} |
| Software | ${formatCurrency(is.operatingExpenses.software)} |
| Legal | ${formatCurrency(is.operatingExpenses.legal)} |
| Insurance | ${formatCurrency(is.operatingExpenses.insurance)} |
| Office & Admin | ${formatCurrency(is.operatingExpenses.officeAndAdmin)} |
| **Total OpEx** | **${formatCurrency(is.operatingExpenses.totalOpex)}** |
| | |
| **Operating Income** | **${formatCurrency(is.operatingIncome)}** |
| Operating Margin | ${formatPercent(is.operatingMargin * 100)} |
| | |
| **Net Income** | **${formatCurrency(is.netIncome)}** |
| Net Margin | ${formatPercent(is.netMargin * 100)} |

---

## Balance Sheet

### Assets

| Line Item | Amount |
|-----------|--------|
| Cash | ${formatCurrency(bs.assets.current.cash)} |
| Accounts Receivable | ${formatCurrency(bs.assets.current.accountsReceivable)} |
| Prepaid Expenses | ${formatCurrency(bs.assets.current.prepaidExpenses)} |
| **Total Current Assets** | **${formatCurrency(bs.assets.current.totalCurrentAssets)}** |
| | |
| **Total Assets** | **${formatCurrency(bs.assets.totalAssets)}** |

### Liabilities & Equity

| Line Item | Amount |
|-----------|--------|
| Accounts Payable | ${formatCurrency(bs.liabilities.current.accountsPayable)} |
| Accrued Expenses | ${formatCurrency(bs.liabilities.current.accruedExpenses)} |
| Deferred Revenue | ${formatCurrency(bs.liabilities.current.deferredRevenue)} |
| **Total Current Liabilities** | **${formatCurrency(bs.liabilities.current.totalCurrentLiabilities)}** |
| | |
| **Total Liabilities** | **${formatCurrency(bs.liabilities.totalLiabilities)}** |
| | |
| Common Stock | ${formatCurrency(bs.equity.commonStock)} |
| Retained Earnings | ${formatCurrency(bs.equity.retainedEarnings)} |
| **Total Equity** | **${formatCurrency(bs.equity.totalEquity)}** |
| | |
| **Total L&E** | **${formatCurrency(bs.totalLiabilitiesAndEquity)}** |

---

## Cash Flow Statement

| Line Item | Amount |
|-----------|--------|
| **Operating Activities** | |
| Net Income | ${formatCurrency(cf.operatingActivities.netIncome)} |
| Working Capital Changes | ${formatCurrency(
      cf.operatingActivities.workingCapitalChanges.accountsReceivable +
      cf.operatingActivities.workingCapitalChanges.prepaidExpenses +
      cf.operatingActivities.workingCapitalChanges.accountsPayable +
      cf.operatingActivities.workingCapitalChanges.accruedExpenses +
      cf.operatingActivities.workingCapitalChanges.deferredRevenue
    )} |
| **Net Cash from Operations** | **${formatCurrency(cf.operatingActivities.netCashFromOperations)}** |
| | |
| **Investing Activities** | |
| **Net Cash from Investing** | **${formatCurrency(cf.investingActivities.netCashFromInvesting)}** |
| | |
| **Financing Activities** | |
| **Net Cash from Financing** | **${formatCurrency(cf.financingActivities.netCashFromFinancing)}** |
| | |
| **Net Change in Cash** | **${formatCurrency(cf.netChangeInCash)}** |
| Beginning Cash | ${formatCurrency(cf.beginningCash)} |
| **Ending Cash** | **${formatCurrency(cf.endingCash)}** |

---

## Key Metrics

### Profitability

| Metric | Value |
|--------|-------|
| Gross Margin | ${formatPercent(m.grossMargin)} |
| Operating Margin | ${formatPercent(m.operatingMargin)} |
| Net Margin | ${formatPercent(m.netMargin)} |
| ROE | ${formatPercent(m.returnOnEquity)} |
| ROA | ${formatPercent(m.returnOnAssets)} |

### Liquidity

| Metric | Value |
|--------|-------|
| Current Ratio | ${m.currentRatio.toFixed(2)}x |
| Quick Ratio | ${m.quickRatio.toFixed(2)}x |
| Cash Ratio | ${m.cashRatio.toFixed(2)}x |
| Working Capital | ${formatCurrency(m.workingCapital)} |
| Days of Cash | ${m.daysOfCash.toFixed(0)} days |

### SaaS Metrics

| Metric | Value |
|--------|-------|
| MRR | ${formatCurrency(m.mrr)} |
| ARR | ${formatCurrency(m.arr)} |
| LTV | ${formatCurrency(m.ltv)} |
| CAC | ${formatCurrency(m.cac)} |
| LTV:CAC Ratio | ${m.ltvCacRatio.toFixed(1)}x |
| CAC Payback | ${m.cacPaybackMonths.toFixed(1)} months |
| Net Revenue Retention | ${formatPercent(m.netRevenueRetention)} |
| Gross Revenue Retention | ${formatPercent(m.grossRevenueRetention)} |
| Magic Number | ${m.magicNumber.toFixed(2)} |
| Burn Multiple | ${m.burnMultiple.toFixed(2)}x |
| Rule of 40 | ${m.ruleOf40.toFixed(0)} |

---

*Generated: ${new Date().toISOString()}*
`;
  }
}

// ============================================================
// Exports
// ============================================================

export const threeStatementModel = new ThreeStatementModelBuilder();
