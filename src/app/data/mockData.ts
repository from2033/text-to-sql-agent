export interface Column {
  name: string;
  type: string;
  isPrimary?: boolean;
  isForeignKey?: boolean;
  isUnique?: boolean;
  nullable?: boolean;
  references?: string;
  description?: string;
}

export interface Table {
  name: string;
  description?: string;
  rowCount: number;
  columns: Column[];
}

export interface DbSchema {
  name: string;
  type: "PostgreSQL" | "MySQL" | "SQLite" | "ClickHouse";
  host: string;
  version: string;
  tables: Table[];
}

export interface QueryResult {
  columns: string[];
  rows: (string | number | null)[][];
  rowCount: number;
}

export interface ChartDataPoint {
  name: string;
  value: number;
  value2?: number;
}

export interface ChatMessage {
  id: string;
  type: "user" | "assistant" | "system";
  content: string;
  sql?: string;
  queryResult?: QueryResult;
  chartData?: ChartDataPoint[];
  chartType?: "bar" | "line" | "pie" | "area";
  confidence?: number;
  executionTime?: number;
  timestamp: Date;
  isError?: boolean;
}

export interface TrainingPair {
  id: string;
  question: string;
  sql: string;
  description?: string;
  createdAt: Date;
}

export interface DbConfig {
  type: string;
  host: string;
  port: string;
  database: string;
  username: string;
  password: string;
}

export const MOCK_SCHEMA: DbSchema = {
  name: "ecommerce_db",
  type: "PostgreSQL",
  host: "prod-db-01.company.com",
  version: "15.4",
  tables: [
    {
      name: "customers",
      description: "存储所有注册客户的基本信息",
      rowCount: 12543,
      columns: [
        { name: "id", type: "BIGINT", isPrimary: true, nullable: false, description: "客户唯一标识符" },
        { name: "name", type: "VARCHAR(100)", nullable: false, description: "客户全名" },
        { name: "email", type: "VARCHAR(200)", isUnique: true, nullable: false, description: "登录邮箱" },
        { name: "phone", type: "VARCHAR(20)", nullable: true, description: "手机号码" },
        { name: "country", type: "VARCHAR(50)", nullable: true, description: "所在国家/地区" },
        { name: "tier", type: "VARCHAR(10)", nullable: false, description: "会员等级: bronze/silver/gold/platinum" },
        { name: "created_at", type: "TIMESTAMP", nullable: false, description: "注册时间" },
        { name: "last_login_at", type: "TIMESTAMP", nullable: true, description: "最近登录时间" },
      ],
    },
    {
      name: "products",
      description: "商品信息主表",
      rowCount: 3821,
      columns: [
        { name: "id", type: "BIGINT", isPrimary: true, nullable: false },
        { name: "name", type: "VARCHAR(200)", nullable: false, description: "商品名称" },
        { name: "sku", type: "VARCHAR(50)", isUnique: true, nullable: false, description: "SKU编号" },
        { name: "category_id", type: "BIGINT", isForeignKey: true, references: "categories.id", nullable: false },
        { name: "price", type: "DECIMAL(10,2)", nullable: false, description: "当前售价 (CNY)" },
        { name: "cost", type: "DECIMAL(10,2)", nullable: true, description: "成本价" },
        { name: "stock", type: "INTEGER", nullable: false, description: "当前库存数量" },
        { name: "is_active", type: "BOOLEAN", nullable: false, description: "是否上架" },
        { name: "created_at", type: "TIMESTAMP", nullable: false },
      ],
    },
    {
      name: "categories",
      description: "商品分类层级结构",
      rowCount: 45,
      columns: [
        { name: "id", type: "BIGINT", isPrimary: true, nullable: false },
        { name: "name", type: "VARCHAR(100)", nullable: false, description: "分类名称" },
        { name: "parent_id", type: "BIGINT", isForeignKey: true, references: "categories.id", nullable: true, description: "父分类 (自引用)" },
        { name: "slug", type: "VARCHAR(100)", isUnique: true, nullable: false },
        { name: "description", type: "TEXT", nullable: true },
      ],
    },
    {
      name: "orders",
      description: "订单主表",
      rowCount: 89274,
      columns: [
        { name: "id", type: "BIGINT", isPrimary: true, nullable: false },
        { name: "customer_id", type: "BIGINT", isForeignKey: true, references: "customers.id", nullable: false },
        { name: "status", type: "VARCHAR(20)", nullable: false, description: "pending/processing/shipped/delivered/cancelled/refunded" },
        { name: "total_amount", type: "DECIMAL(12,2)", nullable: false, description: "订单总金额" },
        { name: "shipping_fee", type: "DECIMAL(8,2)", nullable: false, description: "运费" },
        { name: "coupon_discount", type: "DECIMAL(8,2)", nullable: true, description: "优惠券折扣金额" },
        { name: "payment_method", type: "VARCHAR(30)", nullable: true, description: "支付方式" },
        { name: "created_at", type: "TIMESTAMP", nullable: false, description: "下单时间" },
        { name: "updated_at", type: "TIMESTAMP", nullable: false },
      ],
    },
    {
      name: "order_items",
      description: "订单明细，每行对应一个商品",
      rowCount: 234891,
      columns: [
        { name: "id", type: "BIGINT", isPrimary: true, nullable: false },
        { name: "order_id", type: "BIGINT", isForeignKey: true, references: "orders.id", nullable: false },
        { name: "product_id", type: "BIGINT", isForeignKey: true, references: "products.id", nullable: false },
        { name: "quantity", type: "INTEGER", nullable: false, description: "购买数量" },
        { name: "unit_price", type: "DECIMAL(10,2)", nullable: false, description: "下单时单价快照" },
        { name: "subtotal", type: "DECIMAL(12,2)", nullable: false, description: "小计金额" },
      ],
    },
  ],
};

export const INITIAL_TRAINING_PAIRS: TrainingPair[] = [
  {
    id: "t1",
    question: "最近7天的日订单量",
    sql: `SELECT DATE(created_at) AS date,
       COUNT(*) AS order_count
FROM orders
WHERE created_at >= NOW() - INTERVAL '7 days'
GROUP BY DATE(created_at)
ORDER BY date;`,
    description: "按天统计近7天订单数",
    createdAt: new Date("2025-12-01"),
  },
  {
    id: "t2",
    question: "销售额最高的10个产品",
    sql: `SELECT p.name, p.sku,
       SUM(oi.quantity) AS total_qty,
       SUM(oi.subtotal) AS total_revenue
FROM order_items oi
JOIN products p ON p.id = oi.product_id
JOIN orders o ON o.id = oi.order_id
WHERE o.status NOT IN ('cancelled', 'refunded')
GROUP BY p.id, p.name, p.sku
ORDER BY total_revenue DESC
LIMIT 10;`,
    description: "排除取消和退款订单，按销售额排名",
    createdAt: new Date("2025-12-05"),
  },
  {
    id: "t3",
    question: "各会员等级的平均客单价",
    sql: `SELECT c.tier,
       COUNT(DISTINCT o.id) AS order_count,
       COUNT(DISTINCT o.customer_id) AS customer_count,
       ROUND(AVG(o.total_amount), 2) AS avg_order_value
FROM orders o
JOIN customers c ON c.id = o.customer_id
WHERE o.status = 'delivered'
GROUP BY c.tier
ORDER BY avg_order_value DESC;`,
    description: "分析不同会员等级的消费能力",
    createdAt: new Date("2025-12-10"),
  },
];

interface MockResponse {
  sql: string;
  columns: string[];
  rows: (string | number | null)[][];
  explanation: string;
  confidence: number;
  chartType?: "bar" | "line" | "pie" | "area";
  chartData?: ChartDataPoint[];
  executionTime: number;
}

const randomExecTime = () => Math.round(48 + Math.random() * 420);

function monthlyTrend(): MockResponse {
  return {
    sql: `SELECT
  TO_CHAR(created_at, 'YYYY-MM') AS month,
  COUNT(*) AS order_count,
  ROUND(SUM(total_amount) / 10000, 2) AS revenue_wan
FROM orders
WHERE created_at >= NOW() - INTERVAL '12 months'
  AND status NOT IN ('cancelled', 'refunded')
GROUP BY TO_CHAR(created_at, 'YYYY-MM')
ORDER BY month;`,
    columns: ["month", "order_count", "revenue_wan"],
    rows: [
      ["2025-06", 6234, 892.3],
      ["2025-07", 5891, 823.1],
      ["2025-08", 6782, 978.4],
      ["2025-09", 7123, 1034.2],
      ["2025-10", 7891, 1156.8],
      ["2025-11", 9234, 1456.3],
      ["2025-12", 10823, 1789.5],
      ["2026-01", 8234, 1234.2],
      ["2026-02", 7123, 1012.8],
      ["2026-03", 8934, 1323.4],
      ["2026-04", 9234, 1423.1],
      ["2026-05", 10234, 1623.5],
    ],
    explanation:
      "过去12个月订单量整体呈上升趋势，**11–12月**（双十一/双十二）出现明显峰值，最高月收入达 **1,789.5万元**。今年5月环比增长约 14%，同比增长约 64%。",
    confidence: 0.96,
    chartType: "area",
    chartData: [
      { name: "6月", value: 6234, value2: 892 },
      { name: "7月", value: 5891, value2: 823 },
      { name: "8月", value: 6782, value2: 978 },
      { name: "9月", value: 7123, value2: 1034 },
      { name: "10月", value: 7891, value2: 1157 },
      { name: "11月", value: 9234, value2: 1456 },
      { name: "12月", value: 10823, value2: 1790 },
      { name: "1月", value: 8234, value2: 1234 },
      { name: "2月", value: 7123, value2: 1013 },
      { name: "3月", value: 8934, value2: 1323 },
      { name: "4月", value: 9234, value2: 1423 },
      { name: "5月", value: 10234, value2: 1624 },
    ],
    executionTime: randomExecTime(),
  };
}

function topProducts(): MockResponse {
  return {
    sql: `SELECT
  p.name AS product_name,
  p.sku,
  SUM(oi.quantity) AS total_sold,
  ROUND(SUM(oi.subtotal), 2) AS total_revenue
FROM order_items oi
JOIN products p ON p.id = oi.product_id
JOIN orders o ON o.id = oi.order_id
WHERE o.status NOT IN ('cancelled', 'refunded')
GROUP BY p.id, p.name, p.sku
ORDER BY total_revenue DESC
LIMIT 10;`,
    columns: ["product_name", "sku", "total_sold", "total_revenue"],
    rows: [
      ["iPhone 16 Pro Max 256G", "AP-16PM-256", 3821, 3043515],
      ["AirPods Pro 2代", "AP-APP2", 5234, 2104866],
      ["MacBook Pro 14\" M4", "AP-MBP14-M4", 1234, 1852344],
      ["华为 Mate 70 Pro", "HW-M70P", 4521, 1803579],
      ["Samsung 65\" QLED 4K", "SM-Q65-4K", 892, 1512336],
      ["小米 15 Ultra", "MI-15U", 5123, 1483670],
      ["iPad Pro 13\" M4", "AP-IPP13-M4", 1892, 1324640],
      ["索尼 WH-1000XM6", "SNY-XM6", 6234, 1123920],
      ["戴森 V15 Detect", "DY-V15D", 2341, 1054450],
      ["Bose QC45 II", "BS-QC45-2", 4521, 902400],
    ],
    explanation:
      "苹果系列产品占据前三名，**iPhone 16 Pro Max** 以 **304万元**收入领跑，华为 Mate 70 Pro 进入前五，显示高端手机市场竞争激烈。耳机品类（AirPods/索尼/Bose）合计贡献超400万元收入。",
    confidence: 0.98,
    chartType: "bar",
    chartData: [
      { name: "iPhone 16 Pro", value: 3044 },
      { name: "AirPods Pro 2", value: 2105 },
      { name: "MacBook Pro M4", value: 1852 },
      { name: "华为 Mate 70", value: 1804 },
      { name: "Samsung 65\" 4K", value: 1512 },
      { name: "小米 15 Ultra", value: 1484 },
      { name: "iPad Pro M4", value: 1325 },
      { name: "索尼 XM6", value: 1124 },
      { name: "戴森 V15", value: 1054 },
      { name: "Bose QC45 II", value: 902 },
    ],
    executionTime: randomExecTime(),
  };
}

function categoryRevenue(): MockResponse {
  return {
    sql: `SELECT
  c.name AS category,
  COUNT(DISTINCT o.id) AS order_count,
  SUM(oi.quantity) AS units_sold,
  ROUND(SUM(oi.subtotal) / 10000, 2) AS revenue_wan
FROM order_items oi
JOIN products p ON p.id = oi.product_id
JOIN categories c ON c.id = p.category_id
JOIN orders o ON o.id = oi.order_id
WHERE o.status NOT IN ('cancelled', 'refunded')
GROUP BY c.id, c.name
ORDER BY revenue_wan DESC;`,
    columns: ["category", "order_count", "units_sold", "revenue_wan"],
    rows: [
      ["数码电子", 23421, 45823, 1523.45],
      ["服装鞋帽", 18234, 89234, 823.12],
      ["家用电器", 8923, 12341, 712.34],
      ["美妆护肤", 15234, 78923, 534.21],
      ["食品饮料", 25234, 134521, 423.56],
      ["运动户外", 9234, 23421, 389.23],
      ["家居家装", 6823, 15234, 312.45],
      ["图书音像", 12341, 56234, 189.23],
      ["母婴用品", 5234, 12341, 156.78],
      ["宠物用品", 3821, 8923, 123.45],
    ],
    explanation:
      "**数码电子**类目以 **1523万元**收入稳居第一，占总收入约30%。服装鞋帽虽然订单量大（18,234单）但客单价相对低。食品饮料靠量取胜（13万件），建议关注美妆护肤的高复购潜力。",
    confidence: 0.94,
    chartType: "bar",
    chartData: [
      { name: "数码电子", value: 1523 },
      { name: "服装鞋帽", value: 823 },
      { name: "家用电器", value: 712 },
      { name: "美妆护肤", value: 534 },
      { name: "食品饮料", value: 424 },
      { name: "运动户外", value: 389 },
      { name: "家居家装", value: 312 },
      { name: "图书音像", value: 189 },
    ],
    executionTime: randomExecTime(),
  };
}

function orderStatusDist(): MockResponse {
  return {
    sql: `SELECT
  status,
  COUNT(*) AS order_count,
  ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER (), 1) AS pct
FROM orders
GROUP BY status
ORDER BY order_count DESC;`,
    columns: ["status", "order_count", "pct"],
    rows: [
      ["delivered", 65823, 73.7],
      ["shipped", 8234, 9.2],
      ["processing", 6421, 7.2],
      ["pending", 4123, 4.6],
      ["cancelled", 3821, 4.3],
      ["refunded", 852, 1.0],
    ],
    explanation:
      "**已完成配送**订单占比73.7%，整体履约健康。当前**待发货（processing）**订单6421单需关注处理速度，**取消率4.3%**处于行业正常水平，退款率仅1%表现优秀。",
    confidence: 0.99,
    chartType: "pie",
    chartData: [
      { name: "已送达", value: 65823 },
      { name: "配送中", value: 8234 },
      { name: "处理中", value: 6421 },
      { name: "待处理", value: 4123 },
      { name: "已取消", value: 3821 },
      { name: "已退款", value: 852 },
    ],
    executionTime: randomExecTime(),
  };
}

function customerByCountry(): MockResponse {
  return {
    sql: `SELECT
  COALESCE(country, '未填写') AS country,
  COUNT(*) AS customer_count,
  ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER (), 1) AS pct
FROM customers
GROUP BY country
ORDER BY customer_count DESC
LIMIT 10;`,
    columns: ["country", "customer_count", "pct"],
    rows: [
      ["中国大陆", 8234, 65.6],
      ["中国香港", 1234, 9.8],
      ["中国台湾", 892, 7.1],
      ["新加坡", 621, 5.0],
      ["马来西亚", 423, 3.4],
      ["美国", 312, 2.5],
      ["澳大利亚", 234, 1.9],
      ["加拿大", 189, 1.5],
      ["英国", 156, 1.2],
      ["未填写", 248, 2.0],
    ],
    explanation:
      "客户主要分布在大中华区，**中国大陆**占65.6%，港台合计近17%。东南亚市场（新加坡+马来西亚）已达8.4%，具备较大增长潜力。建议针对港台和东南亚用户加强本地化运营。",
    confidence: 0.97,
    chartType: "pie",
    chartData: [
      { name: "中国大陆", value: 8234 },
      { name: "香港", value: 1234 },
      { name: "台湾", value: 892 },
      { name: "新加坡", value: 621 },
      { name: "马来西亚", value: 423 },
      { name: "其他", value: 1139 },
    ],
    executionTime: randomExecTime(),
  };
}

function customerByTier(): MockResponse {
  return {
    sql: `SELECT
  c.tier,
  COUNT(DISTINCT c.id) AS customer_count,
  COUNT(DISTINCT o.id) AS order_count,
  ROUND(AVG(o.total_amount), 2) AS avg_order_value,
  ROUND(SUM(o.total_amount) / 10000, 2) AS total_revenue_wan
FROM customers c
LEFT JOIN orders o ON o.customer_id = c.id
  AND o.status NOT IN ('cancelled', 'refunded')
GROUP BY c.tier
ORDER BY avg_order_value DESC;`,
    columns: ["tier", "customer_count", "order_count", "avg_order_value", "total_revenue_wan"],
    rows: [
      ["platinum", 234, 3421, 2341.5, 801.1],
      ["gold", 1234, 12341, 1234.8, 1523.4],
      ["silver", 3821, 28234, 523.4, 1477.6],
      ["bronze", 7254, 45278, 198.7, 899.7],
    ],
    explanation:
      "**Platinum** 会员仅234人却贡献了高客单价（¥2,341/单），**Gold** 会员是核心收入群体，贡献1,523万元。Bronze 会员数量最多但客单价仅¥198，提升 Bronze→Silver 转化是重点增长机会。",
    confidence: 0.95,
    chartType: "bar",
    chartData: [
      { name: "Platinum", value: 2342 },
      { name: "Gold", value: 1235 },
      { name: "Silver", value: 523 },
      { name: "Bronze", value: 199 },
    ],
    executionTime: randomExecTime(),
  };
}

function lowStock(): MockResponse {
  return {
    sql: `SELECT
  p.name,
  p.sku,
  c.name AS category,
  p.stock,
  p.price,
  CASE
    WHEN p.stock = 0 THEN '已断货'
    WHEN p.stock < 10 THEN '严重告急'
    WHEN p.stock < 30 THEN '库存偏低'
    ELSE '正常'
  END AS stock_status
FROM products p
JOIN categories c ON c.id = p.category_id
WHERE p.is_active = true AND p.stock < 30
ORDER BY p.stock ASC
LIMIT 15;`,
    columns: ["name", "sku", "category", "stock", "price", "stock_status"],
    rows: [
      ["戴森 V15 Detect", "DY-V15D", "家用电器", 0, 4499.0, "已断货"],
      ["iPhone 16 Pro Max 1T", "AP-16PM-1T", "数码电子", 3, 13999.0, "严重告急"],
      ["MacBook Pro 16\" M4 Max", "AP-MBP16-M4X", "数码电子", 5, 24999.0, "严重告急"],
      ["华为 Mate X5 折叠屏", "HW-MX5", "数码电子", 7, 12999.0, "严重告急"],
      ["Bose QC45 II 黑色", "BS-QC45-2-BK", "数码电子", 12, 1999.0, "库存偏低"],
      ["索尼 A7R V 机身", "SNY-A7R5", "数码电子", 15, 26999.0, "库存偏低"],
      ["DJI Mini 4 Pro", "DJI-M4P", "数码电子", 18, 4799.0, "库存偏低"],
      ["耐克 Air Max 270", "NK-AM270-42", "运动户外", 22, 899.0, "库存偏低"],
    ],
    explanation:
      "发现 **8件**商品库存告急，其中**戴森 V15 Detect 已断货**，**iPhone 16 Pro Max 1T** 等高价值单品仅剩3-7件。建议立即补货，避免高单价 SKU 的销售损失。",
    confidence: 0.99,
    chartType: "bar",
    chartData: [
      { name: "戴森 V15", value: 0 },
      { name: "iPhone 1T", value: 3 },
      { name: "MacBook M4X", value: 5 },
      { name: "Mate X5", value: 7 },
      { name: "Bose QC45", value: 12 },
      { name: "索尼 A7R5", value: 15 },
      { name: "DJI Mini 4", value: 18 },
      { name: "耐克 AM270", value: 22 },
    ],
    executionTime: randomExecTime(),
  };
}

function sampleCustomers(): MockResponse {
  return {
    sql: `SELECT id, name, email, country, tier, created_at
FROM customers
ORDER BY id
LIMIT 10;`,
    columns: ["id", "name", "email", "country", "tier", "created_at"],
    rows: [
      [1, "张伟", "zhang.wei@example.com", "中国大陆", "gold", "2023-01-15 08:23:11"],
      [2, "Li Wei", "liwei@example.hk", "中国香港", "silver", "2023-02-20 14:12:33"],
      [3, "王芳", "wangfang@163.com", "中国大陆", "bronze", "2023-03-05 09:45:22"],
      [4, "陈敏", "chenmin@qq.com", "中国大陆", "platinum", "2023-03-18 16:34:55"],
      [5, "Tan Ah Kow", "tak@singpost.sg", "新加坡", "silver", "2023-04-02 11:23:44"],
      [6, "刘洋", "liuyang@gmail.com", "中国台湾", "gold", "2023-04-15 13:56:21"],
      [7, "黄晓明", "huangxm@hotmail.com", "中国大陆", "bronze", "2023-05-01 07:12:09"],
      [8, "Sarah Lim", "slimmy@gmail.com", "马来西亚", "silver", "2023-05-20 10:34:56"],
      [9, "赵磊", "zhaolei@sina.com", "中国大陆", "gold", "2023-06-08 15:23:11"],
      [10, "孙丽", "sunli@163.com", "中国大陆", "bronze", "2023-06-22 09:11:44"],
    ],
    explanation: "已返回 **customers** 表前10条记录，共 12,543 条数据。表中存储客户基本信息，tier 字段标识会员等级（bronze < silver < gold < platinum）。",
    confidence: 1.0,
    executionTime: randomExecTime(),
  };
}

function sampleProducts(): MockResponse {
  return {
    sql: `SELECT id, name, sku, price, stock, is_active, created_at
FROM products
ORDER BY id
LIMIT 10;`,
    columns: ["id", "name", "sku", "price", "stock", "is_active", "created_at"],
    rows: [
      [1, "iPhone 16 Pro Max 256G", "AP-16PM-256", 9999.0, 234, true, "2024-09-20 00:00:00"],
      [2, "iPhone 16 Pro Max 512G", "AP-16PM-512", 11499.0, 156, true, "2024-09-20 00:00:00"],
      [3, "iPhone 16 Pro Max 1T", "AP-16PM-1T", 13999.0, 3, true, "2024-09-20 00:00:00"],
      [4, "AirPods Pro 2代", "AP-APP2", 1799.0, 892, true, "2024-09-15 00:00:00"],
      [5, "MacBook Pro 14\" M4", "AP-MBP14-M4", 14999.0, 67, true, "2024-11-01 00:00:00"],
      [6, "MacBook Pro 16\" M4 Max", "AP-MBP16-M4X", 24999.0, 5, true, "2024-11-01 00:00:00"],
      [7, "iPad Pro 13\" M4", "AP-IPP13-M4", 8999.0, 123, true, "2024-10-01 00:00:00"],
      [8, "华为 Mate 70 Pro", "HW-M70P", 5999.0, 345, true, "2024-11-26 00:00:00"],
      [9, "华为 Mate X5", "HW-MX5", 12999.0, 7, true, "2024-10-12 00:00:00"],
      [10, "小米 15 Ultra", "MI-15U", 5999.0, 456, true, "2024-10-29 00:00:00"],
    ],
    explanation: "已返回 **products** 表前10条记录，共 3,821 件商品。注意第3条和第6条库存告急，第9条 Mate X5 库存仅剩7件。",
    confidence: 1.0,
    executionTime: randomExecTime(),
  };
}

function sampleOrders(): MockResponse {
  return {
    sql: `SELECT id, customer_id, status, total_amount, payment_method, created_at
FROM orders
ORDER BY id
LIMIT 10;`,
    columns: ["id", "customer_id", "status", "total_amount", "payment_method", "created_at"],
    rows: [
      [1, 234, "delivered", 9999.0, "alipay", "2025-01-03 10:23:11"],
      [2, 891, "delivered", 3598.0, "wechat_pay", "2025-01-03 11:45:22"],
      [3, 12, "delivered", 1799.0, "credit_card", "2025-01-03 12:12:33"],
      [4, 3421, "shipped", 14999.0, "alipay", "2025-06-12 08:34:55"],
      [5, 782, "processing", 5999.0, "wechat_pay", "2025-06-13 09:23:11"],
      [6, 4521, "delivered", 899.0, "alipay", "2025-01-15 14:56:44"],
      [7, 234, "cancelled", 24999.0, "credit_card", "2025-02-01 16:23:33"],
      [8, 1892, "delivered", 1234.0, "wechat_pay", "2025-02-14 11:12:22"],
      [9, 5234, "processing", 8999.0, "alipay", "2025-06-14 08:45:11"],
      [10, 892, "pending", 5999.0, "wechat_pay", "2025-06-15 07:23:44"],
    ],
    explanation: "已返回 **orders** 表前10条记录，共 89,274 条订单。支付宝（alipay）和微信支付（wechat_pay）为主流支付方式，信用卡占比较小。",
    confidence: 1.0,
    executionTime: randomExecTime(),
  };
}

function newCustomersTrend(): MockResponse {
  return {
    sql: `SELECT
  DATE_TRUNC('month', created_at) AS month,
  COUNT(*) AS new_customers
FROM customers
WHERE created_at >= NOW() - INTERVAL '6 months'
GROUP BY DATE_TRUNC('month', created_at)
ORDER BY month;`,
    columns: ["month", "new_customers"],
    rows: [
      ["2025-12-01", 892],
      ["2026-01-01", 734],
      ["2026-02-01", 623],
      ["2026-03-01", 812],
      ["2026-04-01", 934],
      ["2026-05-01", 1123],
    ],
    explanation:
      "近6个月新客增长呈现回升趋势，**5月新增1,123人**为近半年最高，环比增长约20%。1-2月因春节影响出现低谷，3月起逐步恢复，建议5月获客策略可复制推广。",
    confidence: 0.93,
    chartType: "line",
    chartData: [
      { name: "12月", value: 892 },
      { name: "1月", value: 734 },
      { name: "2月", value: 623 },
      { name: "3月", value: 812 },
      { name: "4月", value: 934 },
      { name: "5月", value: 1123 },
    ],
    executionTime: randomExecTime(),
  };
}

function defaultResponse(question: string): MockResponse {
  return {
    sql: `-- 根据您的问题自动生成
-- "${question}"
SELECT
  o.id,
  c.name AS customer_name,
  o.total_amount,
  o.status,
  o.created_at
FROM orders o
JOIN customers c ON c.id = o.customer_id
WHERE o.created_at >= NOW() - INTERVAL '30 days'
ORDER BY o.total_amount DESC
LIMIT 20;`,
    columns: ["id", "customer_name", "total_amount", "status", "created_at"],
    rows: [
      [88234, "陈敏", 24999.0, "delivered", "2026-05-28 10:23:11"],
      [87891, "张伟", 18999.0, "delivered", "2026-05-29 14:12:33"],
      [89012, "刘洋", 14999.0, "shipped", "2026-06-01 09:45:22"],
      [88567, "黄晓明", 13999.0, "processing", "2026-06-05 16:34:55"],
      [89234, "赵磊", 12999.0, "delivered", "2026-05-31 11:23:44"],
      [88123, "孙丽", 9999.0, "delivered", "2026-05-26 13:56:21"],
      [89456, "Wang Fang", 8999.0, "shipped", "2026-06-08 07:12:09"],
      [87234, "Li Wei", 7998.0, "delivered", "2026-05-22 10:34:56"],
    ],
    explanation:
      `根据您的问题「**${question}**」，我生成了一个近30天高金额订单查询，返回了最近一个月内金额最高的20笔订单及客户信息。如果这不是您想要的，可以尝试更具体地描述您的需求。`,
    confidence: 0.71,
    executionTime: randomExecTime(),
  };
}

export function generateMockResponse(question: string): MockResponse {
  const q = question.toLowerCase();

  if (
    (q.includes("月") || q.includes("month")) &&
    (q.includes("趋势") || q.includes("订单") || q.includes("收入") || q.includes("销售") || q.includes("每月") || q.includes("按月"))
  ) {
    return monthlyTrend();
  }
  if (q.includes("新客") || (q.includes("新增") && q.includes("客户"))) {
    return newCustomersTrend();
  }
  if (
    (q.includes("产品") || q.includes("商品")) &&
    (q.includes("top") || q.includes("最") || q.includes("热门") || q.includes("排名") || q.includes("畅销") || q.includes("销量") || q.includes("收入"))
  ) {
    return topProducts();
  }
  if (q.includes("库存") || q.includes("stock") || q.includes("断货") || q.includes("告急")) {
    return lowStock();
  }
  if (q.includes("分类") || q.includes("类别") || q.includes("category")) {
    return categoryRevenue();
  }
  if (q.includes("订单") && (q.includes("状态") || q.includes("status") || q.includes("分布") || q.includes("比例"))) {
    return orderStatusDist();
  }
  if (q.includes("客户") || q.includes("用户") || q.includes("customer")) {
    if (q.includes("国家") || q.includes("地区") || q.includes("分布") || q.includes("哪里")) {
      return customerByCountry();
    }
    if (q.includes("等级") || q.includes("tier") || q.includes("会员") || q.includes("层级")) {
      return customerByTier();
    }
    if (q.includes("展示") || q.includes("查看") || q.includes("前") || q.includes("数据")) {
      return sampleCustomers();
    }
    return customerByCountry();
  }
  if (
    (q.includes("收入") || q.includes("销售额") || q.includes("gmv") || q.includes("revenue")) &&
    !q.includes("月")
  ) {
    return categoryRevenue();
  }
  if (q.includes("产品") || q.includes("商品") || q.includes("product")) {
    if (q.includes("展示") || q.includes("查看") || q.includes("前") || q.includes("数据")) {
      return sampleProducts();
    }
  }
  if (q.includes("订单") || q.includes("order")) {
    if (q.includes("展示") || q.includes("查看") || q.includes("前") || q.includes("数据")) {
      return sampleOrders();
    }
  }
  return defaultResponse(question);
}

export const SUGGESTED_QUESTIONS = [
  "每月订单量和收入趋势如何？",
  "销售额最高的10个产品是哪些？",
  "各商品分类的收入占比",
  "最近30天的新增客户趋势",
  "哪些产品库存告急？",
  "客户的国家/地区分布",
  "各会员等级的消费情况",
  "订单状态分布情况",
];
