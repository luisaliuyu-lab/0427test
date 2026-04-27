"use client";

import { useEffect, useMemo, useRef, useState } from "react";

type Sleeve = "sleeveless" | "short" | "long";
type FitPref = "snug" | "regular" | "relaxed";
type ModelKind = "modelA" | "modelB";

type ProductColor = { id: string; name: string; a: string; b: string };
type ProductImage = {
  /** 图片放在 Next.js 的 public/ 下，比如 /images/models/... */
  src: string;
  /** 交替出现的模特类型 */
  model: ModelKind;
  /** 可选：同一商品不同颜色对应不同图 */
  colorId?: string;
  alt: string;
};
type Product = {
  id: string;
  name: string;
  desc: string;
  sleeve: Sleeve;
  tags: string[];
  price: number;
  createdAt: string; // YYYY-MM-DD
  colors: ProductColor[];
  sizes: string[];
  highlights: string[];
  images?: ProductImage[];
};

type CartItem = {
  productId: string;
  name: string;
  colorId: string;
  colorName: string;
  size: string;
  price: number;
  qty: number;
  imageUrl: string;
};

const STORAGE_KEY = "yogaSuitCart_v1";

const money = (n: number) => `¥${Math.round(n).toLocaleString("zh-CN")}`;
const clamp = (v: number, min: number, max: number) => Math.max(min, Math.min(max, v));

const makeSvgDataUrl = (seedA: string, seedB: string) => {
  const svg = encodeURIComponent(`
  <svg xmlns="http://www.w3.org/2000/svg" width="1200" height="800">
    <defs>
      <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stop-color="${seedA}" stop-opacity="0.85"/>
        <stop offset="1" stop-color="${seedB}" stop-opacity="0.75"/>
      </linearGradient>
      <radialGradient id="r" cx="0.78" cy="0.24" r="0.9">
        <stop offset="0" stop-color="#ffffff" stop-opacity="0.55"/>
        <stop offset="1" stop-color="#ffffff" stop-opacity="0"/>
      </radialGradient>
    </defs>
    <rect width="1200" height="800" fill="url(#g)"/>
    <circle cx="900" cy="220" r="260" fill="url(#r)"/>
    <circle cx="330" cy="560" r="320" fill="url(#r)" opacity="0.75"/>
    <path d="M220 740 C 420 640, 560 720, 760 600 S 1120 560, 1150 430"
      stroke="#ffffff" stroke-opacity="0.25" stroke-width="16" fill="none" stroke-linecap="round"/>
    <path d="M180 120 C 390 220, 560 140, 760 260 S 1120 340, 1180 460"
      stroke="#000000" stroke-opacity="0.12" stroke-width="12" fill="none" stroke-linecap="round"/>
    <text x="70" y="110" font-family="ui-sans-serif, system-ui" font-weight="700" font-size="52" fill="#ffffff" fill-opacity="0.78">
      YOGA SUIT
    </text>
    <text x="70" y="170" font-family="ui-sans-serif, system-ui" font-size="28" fill="#ffffff" fill-opacity="0.62">
      One-piece jumpsuit placeholder
    </text>
  </svg>`);
  return `data:image/svg+xml;charset=utf-8,${svg}`;
};

const PRODUCTS: (Product & { imageUrl: string })[] = [
  {
    id: "contour-1p",
    name: "Contour One-Piece",
    desc: "结构分割线显瘦，背部支撑更稳，适合多种流派练习。",
    sleeve: "sleeveless",
    tags: ["热卖", "显瘦"],
    price: 399,
    createdAt: "2026-03-12",
    colors: [
      // 莫兰迪向：低饱和、更雾感
      { id: "graphite", name: "石墨灰黑", a: "#8FA3B0", b: "#BFC9CF" },
      { id: "sage", name: "雾鼠尾草", a: "#AAB9AE", b: "#C9D0C8" },
      { id: "mauve", name: "雾梅紫", a: "#B59AA7", b: "#D4C5CE" },
    ],
    sizes: ["XS", "S", "M", "L"],
    highlights: ["四向高弹", "速干透气", "无痕贴合"],
    images: [
      // 你刚上传的 4 张参考图已放到 public/images/models/ 下
      { src: "/images/models/model-a-1.png", model: "modelA", colorId: "graphite", alt: "模特A 穿着 Contour 连体裤（示例图 1）" },
      { src: "/images/models/model-b-1.png", model: "modelB", colorId: "graphite", alt: "模特B 穿着 Contour 连体裤（示例图 1）" },
      { src: "/images/models/model-a-2.png", model: "modelA", colorId: "sage", alt: "模特A 穿着 Contour 连体裤（示例图 2）" },
      { src: "/images/models/model-b-2.png", model: "modelB", colorId: "sage", alt: "模特B 穿着 Contour 连体裤（示例图 2）" },
    ],
  },
  {
    id: "flow-long",
    name: "Flow Long Sleeve One-Piece",
    desc: "长袖更防晒，肩背活动量大也不紧绷，适合瑜伽/普拉提。",
    sleeve: "long",
    tags: ["上新"],
    price: 459,
    createdAt: "2026-04-06",
    colors: [
      { id: "denim", name: "雾牛仔蓝", a: "#8CA3B8", b: "#C7D3DD" },
      { id: "oat", name: "燕麦雾白", a: "#DED8CE", b: "#C9D0D6" },
    ],
    sizes: ["S", "M", "L"],
    highlights: ["防晒长袖", "高回弹", "亲肤细旦纱"],
    images: [
      { src: "/images/models/model-a-flow-denim.jpg", model: "modelA", colorId: "denim", alt: "模特A 穿着 Flow 长袖连体裤 雾牛仔蓝" },
      { src: "/images/models/model-b-flow-denim.jpg", model: "modelB", colorId: "denim", alt: "模特B 穿着 Flow 长袖连体裤 雾牛仔蓝" },
      { src: "/images/models/model-a-flow-oat.jpg", model: "modelA", colorId: "oat", alt: "模特A 穿着 Flow 长袖连体裤 燕麦雾白" },
      { src: "/images/models/model-b-flow-oat.jpg", model: "modelB", colorId: "oat", alt: "模特B 穿着 Flow 长袖连体裤 燕麦雾白" },
    ],
  },
  {
    id: "air-short",
    name: "Air Short Sleeve One-Piece",
    desc: "短袖更好穿出街，腰线更立体，通勤+练习都能搭。",
    sleeve: "short",
    tags: ["通勤友好"],
    price: 429,
    createdAt: "2026-02-21",
    colors: [
      { id: "taupe", name: "雾可可灰棕", a: "#B6A79B", b: "#D2C8BE" },
      { id: "dustyRose", name: "灰粉玫瑰", a: "#C7A5A8", b: "#E0CED0" },
    ],
    sizes: ["XS", "S", "M", "L"],
    highlights: ["立体腰线", "不闷汗", "深蹲不透"],
    images: [
      { src: "/images/models/model-a-air-taupe.jpg", model: "modelA", colorId: "taupe", alt: "模特A 穿着 Air 短袖连体裤 雾可可灰棕" },
      { src: "/images/models/model-b-air-taupe.jpg", model: "modelB", colorId: "taupe", alt: "模特B 穿着 Air 短袖连体裤 雾可可灰棕" },
      { src: "/images/models/model-a-air-dustyRose.jpg", model: "modelA", colorId: "dustyRose", alt: "模特A 穿着 Air 短袖连体裤 灰粉玫瑰" },
      { src: "/images/models/model-b-air-dustyRose.jpg", model: "modelB", colorId: "dustyRose", alt: "模特B 穿着 Air 短袖连体裤 灰粉玫瑰" },
    ],
  },
  {
    id: "backless",
    name: "Backless Sculpt One-Piece",
    desc: "露背设计更透气，后背交叉带稳固不滑落，拍照很好看。",
    sleeve: "sleeveless",
    tags: ["露背", "透气"],
    price: 419,
    createdAt: "2026-01-29",
    colors: [
      { id: "ink", name: "墨色蓝黑", a: "#4C5968", b: "#AAB7C5" },
      { id: "mistBlue", name: "雾霾蓝", a: "#9FB2C6", b: "#D3DDE7" },
    ],
    sizes: ["XS", "S", "M"],
    highlights: ["露背透气", "交叉背带", "无痕车缝"],
    images: [
      { src: "/images/models/model-a-backless-ink.jpg", model: "modelA", colorId: "ink", alt: "模特A 穿着 Backless 露背连体裤 墨色蓝黑" },
      { src: "/images/models/model-b-backless-ink.jpg", model: "modelB", colorId: "ink", alt: "模特B 穿着 Backless 露背连体裤 墨色蓝黑" },
      { src: "/images/models/model-a-backless-mistBlue.jpg", model: "modelA", colorId: "mistBlue", alt: "模特A 穿着 Backless 露背连体裤 雾霾蓝" },
      { src: "/images/models/model-b-backless-mistBlue.jpg", model: "modelB", colorId: "mistBlue", alt: "模特B 穿着 Backless 露背连体裤 雾霾蓝" },
    ],
  },
  {
    id: "ribbed",
    name: "Ribbed Soft One-Piece",
    desc: "细坑条纹理更修饰线条，手感柔软，适合日常轻运动。",
    sleeve: "short",
    tags: ["柔软", "坑条"],
    price: 389,
    createdAt: "2026-04-18",
    colors: [
      { id: "apricot", name: "雾沙杏", a: "#D8C6B2", b: "#E7DED3" },
      { id: "softSage", name: "浅雾鼠尾草", a: "#B8C4BC", b: "#D8DED9" },
    ],
    sizes: ["S", "M", "L"],
    highlights: ["柔软坑条", "轻支撑", "日常百搭"],
    images: [
      { src: "/images/models/model-a-ribbed-apricot.jpg", model: "modelA", colorId: "apricot", alt: "模特A 穿着 Ribbed 连体裤 雾沙杏" },
      { src: "/images/models/model-b-ribbed-apricot.jpg", model: "modelB", colorId: "apricot", alt: "模特B 穿着 Ribbed 连体裤 雾沙杏" },
      { src: "/images/models/model-a-ribbed-softSage.jpg", model: "modelA", colorId: "softSage", alt: "模特A 穿着 Ribbed 连体裤 浅雾鼠尾草" },
      { src: "/images/models/model-b-ribbed-softSage.jpg", model: "modelB", colorId: "softSage", alt: "模特B 穿着 Ribbed 连体裤 浅雾鼠尾草" },
    ],
  },
  {
    id: "core-long",
    name: "Core Compression One-Piece",
    desc: "更强包裹与腰腹支撑，力量/普拉提也能稳住核心。",
    sleeve: "long",
    tags: ["支撑", "强塑形"],
    price: 489,
    createdAt: "2026-03-30",
    colors: [
      { id: "stone", name: "风暴石灰", a: "#AEB3B6", b: "#D2D5D6" },
      { id: "wineDust", name: "雾酒红", a: "#7E4B53", b: "#C9B0B6" },
    ],
    sizes: ["S", "M", "L"],
    highlights: ["强支撑", "高回弹", "深蹲不透"],
    images: [
      { src: "/images/models/model-a-core-stone.jpg", model: "modelA", colorId: "stone", alt: "模特A 穿着 Core 长袖连体裤 风暴石灰" },
      { src: "/images/models/model-b-core-stone.jpg", model: "modelB", colorId: "stone", alt: "模特B 穿着 Core 长袖连体裤 风暴石灰" },
      { src: "/images/models/model-a-core-wineDust.jpg", model: "modelA", colorId: "wineDust", alt: "模特A 穿着 Core 长袖连体裤 雾酒红" },
      { src: "/images/models/model-b-core-wineDust.jpg", model: "modelB", colorId: "wineDust", alt: "模特B 穿着 Core 长袖连体裤 雾酒红" },
    ],
  },
].map((p) => ({ ...p, imageUrl: makeSvgDataUrl(p.colors[0].a, p.colors[0].b) }));

const pickProductImage = (params: {
  product: (Product & { imageUrl: string }) | null | undefined;
  model: ModelKind;
  colorId?: string | null;
}): { src: string; alt: string } => {
  const { product, model, colorId } = params;
  if (!product) return { src: "", alt: "" };

  const images = product.images ?? [];
  const match = images.find((img) => img.model === model && (!img.colorId || img.colorId === colorId));
  const fallback = images.find((img) => img.model === model);
  if (match) return { src: match.src, alt: match.alt };
  if (fallback) return { src: fallback.src, alt: fallback.alt };

  // fallback to generated placeholder
  const c = product.colors.find((x) => x.id === colorId) ?? product.colors[0];
  return { src: makeSvgDataUrl(c.a, c.b), alt: `${product.name} 占位图` };
};

const cartKey = (item: Pick<CartItem, "productId" | "colorId" | "size">) =>
  `${item.productId}__${item.colorId}__${item.size}`;

const computeSizeSuggestion = (params: { heightCm: number; weightKg: number; fitPref: FitPref }) => {
  const { heightCm, weightKg, fitPref } = params;
  const bmi = weightKg / (heightCm / 100) ** 2;

  let base = "M";
  if (heightCm < 158) base = "S";
  if (heightCm >= 170) base = "M";
  if (heightCm >= 178) base = "L";

  if (bmi < 18.2) base = base === "L" ? "M" : base === "M" ? "S" : "XS";
  if (bmi > 24.5) base = base === "XS" ? "S" : base === "S" ? "M" : "L";

  if (fitPref === "snug") base = base === "L" ? "M" : base === "M" ? "S" : "XS";
  if (fitPref === "relaxed") base = base === "XS" ? "S" : base === "S" ? "M" : "L";

  const score = bmi < 18.2 ? "偏瘦" : bmi < 24 ? "标准" : bmi < 28 ? "偏壮" : "更壮";
  return { size: base, bmi: Math.round(bmi * 10) / 10, score };
};

function Chip({
  pressed,
  children,
  onClick,
}: {
  pressed: boolean;
  children: React.ReactNode;
  onClick: () => void;
}) {
  return (
    <button type="button" className="chip" aria-pressed={pressed} onClick={onClick}>
      {children}
    </button>
  );
}

export default function Shop() {
  const year = new Date().getFullYear();

  const [query, setQuery] = useState("");
  const [filterSleeve, setFilterSleeve] = useState<"all" | Sleeve>("all");
  const [sortBy, setSortBy] = useState<"featured" | "priceAsc" | "priceDesc" | "newest">("featured");
  const [modelKind, setModelKind] = useState<ModelKind>("modelB");

  const [cart, setCart] = useState<CartItem[]>([]);
  const [menuOpen, setMenuOpen] = useState(false);
  const [cartOpen, setCartOpen] = useState(false);

  const [productOpen, setProductOpen] = useState(false);
  const [activeProductId, setActiveProductId] = useState<string | null>(null);
  const activeProduct = useMemo(
    () => (activeProductId ? PRODUCTS.find((p) => p.id === activeProductId) ?? null : null),
    [activeProductId],
  );
  const [selectedColorId, setSelectedColorId] = useState<string | null>(null);
  const [selectedSize, setSelectedSize] = useState<string | null>(null);

  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const toastTimer = useRef<number | null>(null);

  const [sizeGuideOpen, setSizeGuideOpen] = useState(false);
  const [heightCm, setHeightCm] = useState<number | "">("");
  const [weightKg, setWeightKg] = useState<number | "">("");
  const [fitPref, setFitPref] = useState<FitPref>("regular");
  const [sizeResultHtml, setSizeResultHtml] = useState("填写信息后会给出建议尺码。");

  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [shipName, setShipName] = useState("");
  const [shipPhone, setShipPhone] = useState("");
  const [shipCity, setShipCity] = useState("");
  const [shipAddr, setShipAddr] = useState("");

  const subtotal = useMemo(() => cart.reduce((sum, i) => sum + i.price * i.qty, 0), [cart]);
  const cartCount = useMemo(() => cart.reduce((sum, i) => sum + i.qty, 0), [cart]);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    if (toastTimer.current) window.clearTimeout(toastTimer.current);
    toastTimer.current = window.setTimeout(() => setToastMsg(null), 2200);
  };

  // Load cart from localStorage
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) setCart(parsed);
    } catch {
      // ignore
    }
  }, []);

  // Persist cart
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(cart));
    } catch {
      // ignore
    }
  }, [cart]);

  // Scroll elevation
  useEffect(() => {
    const onScroll = () => {
      const header = document.querySelector(".site-header[data-elevate]");
      header?.classList.toggle("is-scrolled", window.scrollY > 8);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Lock scroll when drawers open
  useEffect(() => {
    const anyOverlay = menuOpen || cartOpen || productOpen;
    document.body.style.overflow = anyOverlay ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [menuOpen, cartOpen, productOpen]);

  // ESC close drawers
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      setMenuOpen(false);
      setCartOpen(false);
      setProductOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const filteredProducts = useMemo(() => {
    const normalize = (s: string) => s.trim().toLowerCase();
    const q = normalize(query);
    const match = (p: Product) => {
      if (!q) return true;
      const hay = normalize(`${p.name} ${p.desc} ${p.tags.join(" ")} ${p.sleeve} ${p.highlights.join(" ")}`);
      return hay.includes(q);
    };

    let list = PRODUCTS.filter((p) => match(p));
    if (filterSleeve !== "all") list = list.filter((p) => p.sleeve === filterSleeve);

    const copy = [...list];
    if (sortBy === "priceAsc") return copy.sort((a, b) => a.price - b.price);
    if (sortBy === "priceDesc") return copy.sort((a, b) => b.price - a.price);
    if (sortBy === "newest") return copy.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    return copy;
  }, [query, filterSleeve, sortBy]);

  const openProduct = (id: string) => {
    const p = PRODUCTS.find((x) => x.id === id);
    if (!p) return;
    setActiveProductId(id);
    setSelectedColorId(p.colors[0].id);
    setSelectedSize(p.sizes[0]);
    setProductOpen(true);
  };

  const addToCart = (params: { productId: string; colorId: string; size: string; qty?: number }) => {
    const { productId, colorId, size } = params;
    const qty = clamp(params.qty ?? 1, 1, 99);
    const p = PRODUCTS.find((x) => x.id === productId);
    if (!p) return;
    const color = p.colors.find((c) => c.id === colorId) ?? p.colors[0];
    const safeSize = p.sizes.includes(size) ? size : p.sizes[0];

    const key = cartKey({ productId, colorId: color.id, size: safeSize });
    setCart((prev) => {
      const existing = prev.find((i) => cartKey(i) === key);
      if (existing) {
        return prev.map((i) => (cartKey(i) === key ? { ...i, qty: clamp(i.qty + qty, 1, 99) } : i));
      }
      return [
        ...prev,
        {
          productId,
          name: p.name,
          colorId: color.id,
          colorName: color.name,
          size: safeSize,
          price: p.price,
          qty,
          imageUrl: makeSvgDataUrl(color.a, color.b),
        },
      ];
    });
    showToast("已加入购物车");
  };

  const removeCartItem = (key: string) => {
    setCart((prev) => prev.filter((i) => cartKey(i) !== key));
    showToast("已移除");
  };

  const updateQty = (key: string, nextQty: number) => {
    setCart((prev) => prev.map((i) => (cartKey(i) === key ? { ...i, qty: clamp(nextQty, 1, 99) } : i)));
  };

  const hero = PRODUCTS[0];

  const renderSleeveLabel = (s: Sleeve) => (s === "long" ? "长袖" : s === "short" ? "短袖" : "无袖");

  const productDetailImage = useMemo(() => {
    return pickProductImage({ product: activeProduct, model: modelKind, colorId: selectedColorId });
  }, [activeProduct, modelKind, selectedColorId]);

  const productDetailColorName = useMemo(
    () => (activeProduct && selectedColorId ? activeProduct.colors.find((c) => c.id === selectedColorId)?.name ?? "" : ""),
    [activeProduct, selectedColorId],
  );

  const handleCalcSize = () => {
    const h = typeof heightCm === "number" ? heightCm : NaN;
    const w = typeof weightKg === "number" ? weightKg : NaN;
    if (!Number.isFinite(h) || !Number.isFinite(w) || h <= 0 || w <= 0) {
      setSizeResultHtml("请填写有效的身高体重。");
      return;
    }
    const { size, bmi, score } = computeSizeSuggestion({ heightCm: h, weightKg: w, fitPref });
    setSizeResultHtml(
      `建议尺码：<strong>${size}</strong>（BMI ${bmi}，${score}体型）<div class="muted tiny" style="margin-top:6px;">提示：不同款式的版型与偏好会影响结果，真实上线请增加试穿建议与尺码表。</div>`,
    );
  };

  const placeOrder = () => {
    if (cart.length === 0) return showToast("购物车为空");
    if (!shipName.trim() || !shipPhone.trim() || !shipCity.trim() || !shipAddr.trim()) {
      return showToast("请填写完整收货信息");
    }
    setCheckoutOpen(false);
    setCart([]);
    setCartOpen(false);
    showToast("下单成功（演示）");
    setTimeout(() => alert("演示下单完成：真实上线请对接支付/订单系统。"), 100);
  };

  return (
    <>
      <a className="skip-link" href="#main">
        跳到主要内容
      </a>

      <header className="site-header" data-elevate>
        <div className="container header-inner">
          <div className="brand" role="banner" aria-label="YOGA SUIT">
            <button className="icon-btn mobile-only" onClick={() => setMenuOpen(true)} aria-label="打开菜单">
              <span aria-hidden="true">☰</span>
            </button>
            <a className="brand-mark" href="/" aria-label="回到首页">
              <span className="brand-logo" aria-hidden="true" />
              <span className="brand-name">YOGA SUIT</span>
            </a>
            <span className="brand-tag">瑜伽连体裤</span>
          </div>

          <nav className="nav desktop-only" aria-label="主导航">
            <a href="#catalog">商品</a>
            <a href="#about">面料与工艺</a>
            <a href="#faq">常见问题</a>
          </nav>

          <div className="header-actions">
            <button
              className="pill-btn desktop-only"
              onClick={() => setModelKind((m) => (m === "modelA" ? "modelB" : "modelA"))}
              aria-label="切换模特类型"
              title="切换模特（用于图片交替展示）"
            >
              <span aria-hidden="true">🧍</span>
              <span>模特：{modelKind === "modelA" ? "A" : "B"}</span>
            </button>

            <label className="search" aria-label="搜索">
              <span className="search-icon" aria-hidden="true">
                ⌕
              </span>
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                type="search"
                placeholder="搜索：长袖 / 短袖 / 露背…"
                autoComplete="off"
              />
            </label>

            <button className="pill-btn" onClick={() => setCartOpen(true)} aria-label="打开购物车">
              <span aria-hidden="true">🛒</span>
              <span className="desktop-only">购物车</span>
              <span className="badge" aria-label="购物车数量">
                {cartCount}
              </span>
            </button>
          </div>
        </div>
      </header>

      {/* Menu drawer */}
      <aside className={`drawer drawer-left ${menuOpen ? "is-open" : ""}`} aria-hidden={!menuOpen}>
        <div className="drawer-scrim" onClick={() => setMenuOpen(false)} />
        <div className="drawer-panel" role="dialog" aria-label="菜单">
          <div className="drawer-head">
            <div className="drawer-title">菜单</div>
            <button className="icon-btn" onClick={() => setMenuOpen(false)} aria-label="关闭菜单">
              ✕
            </button>
          </div>
          <nav className="drawer-nav" aria-label="移动端导航">
            <a href="#catalog" onClick={() => setMenuOpen(false)}>
              商品
            </a>
            <a href="#about" onClick={() => setMenuOpen(false)}>
              面料与工艺
            </a>
            <a href="#faq" onClick={() => setMenuOpen(false)}>
              常见问题
            </a>
          </nav>
          <div className="drawer-foot">
            <div className="muted">提示：这是 Next.js 演示站，可直接替换商品数据与图片。</div>
          </div>
        </div>
      </aside>

      <main id="main">
        <section className="hero">
          <div className="container hero-inner">
            <div className="hero-copy">
              <p className="kicker">2026 春夏 · 轻盈高弹</p>
              <h1>显瘦、稳固、无束缚的瑜伽连体裤</h1>
              <p className="lead">
                专注一件事：让你在流动、拉伸、倒立时依然稳稳贴合。支持尺码推荐与快速结算（演示版）。
              </p>
              <div className="hero-cta">
                <a className="primary-btn" href="#catalog">
                  立即选购
                </a>
                <button className="ghost-btn" onClick={() => setSizeGuideOpen(true)}>
                  尺码推荐
                </button>
              </div>
              <ul className="hero-badges" aria-label="卖点">
                <li>四向高弹</li>
                <li>无痕贴合</li>
                <li>速干透气</li>
                <li>显瘦分割线</li>
              </ul>
            </div>

            <div className="hero-card" aria-label="主视觉">
              <div
                className="hero-media"
                role="img"
                aria-label="瑜伽连体裤主视觉占位图"
                style={{
                  backgroundImage: `url("${pickProductImage({ product: hero, model: modelKind, colorId: hero.colors[0].id }).src}")`,
                  backgroundSize: "cover",
                  backgroundPosition: "center",
                }}
              />
              <div className="hero-card-foot">
                <div>
                  <div className="muted">本周热卖</div>
                  <div className="hero-sku">{hero.name}</div>
                </div>
                <button
                  className="pill-btn"
                  onClick={() => {
                    addToCart({ productId: hero.id, colorId: hero.colors[0].id, size: hero.sizes[0], qty: 1 });
                    setCartOpen(true);
                  }}
                >
                  <span aria-hidden="true">＋</span> 加入购物车
                </button>
              </div>
            </div>
          </div>
        </section>

        <section className="container section" id="catalog">
          <div className="section-head">
            <div>
              <h2>精选商品</h2>
              <p className="muted">点击商品查看详情、选择颜色与尺码并加入购物车。</p>
            </div>
            <div className="controls" role="group" aria-label="筛选与排序">
              <select
                value={filterSleeve}
                onChange={(e) => setFilterSleeve(e.target.value as "all" | Sleeve)}
                className="select"
                aria-label="袖长筛选"
              >
                <option value="all">全部袖长</option>
                <option value="sleeveless">无袖</option>
                <option value="short">短袖</option>
                <option value="long">长袖</option>
              </select>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
                className="select"
                aria-label="排序"
              >
                <option value="featured">推荐</option>
                <option value="priceAsc">价格从低到高</option>
                <option value="priceDesc">价格从高到低</option>
                <option value="newest">上新优先</option>
              </select>
            </div>
          </div>

          <div className="grid" aria-live="polite">
            {filteredProducts.length === 0 ? (
              <div className="card" style={{ gridColumn: "1 / -1" }}>
                <div style={{ fontWeight: 800, marginBottom: 6 }}>没有找到商品</div>
                <div className="muted">试试换个关键词，或把筛选改回「全部袖长」。</div>
              </div>
            ) : (
              filteredProducts.map((p, idx) => {
                const showModel: ModelKind = idx % 2 === 0 ? modelKind : modelKind === "modelA" ? "modelB" : "modelA";
                const preview = pickProductImage({ product: p, model: showModel, colorId: p.colors[0].id });
                return (
                <article key={p.id} className="product">
                  <div className="product-media">
                    {p.tags?.[0] ? <div className="tag">{p.tags[0]}</div> : null}
                    <img src={preview.src} alt={preview.alt || p.name} loading="lazy" />
                  </div>
                  <div className="product-body">
                    <div className="product-title">{p.name}</div>
                    <div className="product-meta">
                      <div className="muted">{renderSleeveLabel(p.sleeve)}</div>
                      <div className="price">{money(p.price)}</div>
                    </div>
                    <div className="product-desc">{p.desc}</div>
                    <div className="product-actions">
                      <button className="ghost-btn" onClick={() => openProduct(p.id)}>
                        查看
                      </button>
                      <button
                        className="primary-btn"
                        onClick={() => {
                          addToCart({ productId: p.id, colorId: p.colors[0].id, size: p.sizes[0], qty: 1 });
                          setCartOpen(true);
                        }}
                      >
                        快速加入
                      </button>
                    </div>
                  </div>
                </article>
              );
            })
            )}
          </div>
        </section>

        <section className="container section split" id="about">
          <div className="card soft">
            <h2>面料与工艺</h2>
            <ul className="feature-list">
              <li>
                <strong>亲肤细旦纱</strong>
                <span className="muted">贴身不扎，适合长时间练习。</span>
              </li>
              <li>
                <strong>高回弹氨纶</strong>
                <span className="muted">深蹲不透，回弹不松垮。</span>
              </li>
              <li>
                <strong>结构剪裁</strong>
                <span className="muted">腰腹与背部支撑更稳定。</span>
              </li>
              <li>
                <strong>无痕车缝</strong>
                <span className="muted">减少摩擦，运动更舒适。</span>
              </li>
            </ul>
            <div className="note">你可以在 `src/components/Shop.tsx` 中替换材质说明、卖点与商品数据。</div>
          </div>

          <div className="card">
            <h2>口碑亮点</h2>
            <div className="quotes">
              <figure className="quote">
                <blockquote>倒立也不滑落，胸背处非常稳。</blockquote>
                <figcaption>— 阿昕 · 练习 3 年</figcaption>
              </figure>
              <figure className="quote">
                <blockquote>分割线很显腿长，面料也不闷。</blockquote>
                <figcaption>— Lily · 热瑜伽</figcaption>
              </figure>
              <figure className="quote">
                <blockquote>一件解决穿搭，出门加外套就行。</blockquote>
                <figcaption>— 可可 · 通勤+练习</figcaption>
              </figure>
            </div>
          </div>
        </section>

        <section className="container section" id="faq">
          <div className="section-head">
            <div>
              <h2>常见问题</h2>
              <p className="muted">以下为演示文案，你可以按真实政策替换。</p>
            </div>
          </div>

          <div className="accordion">
            <details open>
              <summary>尺码怎么选？</summary>
              <div className="muted">
                可使用「尺码推荐」填写身高体重与偏好松紧度。真实上线时建议接入更精细的体型数据与试穿建议。
              </div>
            </details>
            <details>
              <summary>会不会透？</summary>
              <div className="muted">高支数面料与加密织造，深蹲不透。浅色建议搭配肤色无痕内衣。</div>
            </details>
            <details>
              <summary>怎么清洗保养？</summary>
              <div className="muted">建议装洗衣袋冷水轻柔洗，阴干，避免高温烘干与柔顺剂。</div>
            </details>
            <details>
              <summary>退换政策？</summary>
              <div className="muted">演示：签收 7 天内未下水可退换，需保持吊牌与包装完整。</div>
            </details>
          </div>
        </section>

        <footer className="site-footer">
          <div className="container footer-inner">
            <div>
              <div className="brand-name">YOGA SUIT</div>
              <div className="muted">
                © {year} 瑜伽连体裤官方店（Next.js 演示站）
              </div>
            </div>
            <div className="muted footer-links">
              <a href="#catalog">商品</a>
              <a href="#about">面料</a>
              <a href="#faq">FAQ</a>
            </div>
          </div>
        </footer>
      </main>

      {/* Product drawer */}
      <aside className={`drawer ${productOpen ? "is-open" : ""}`} aria-hidden={!productOpen}>
        <div className="drawer-scrim" onClick={() => setProductOpen(false)} />
        <div className="drawer-panel wide" role="dialog" aria-label="商品详情">
          <div className="drawer-head">
            <div className="drawer-title">{activeProduct?.name ?? "商品详情"}</div>
            <button className="icon-btn" onClick={() => setProductOpen(false)} aria-label="关闭商品详情">
              ✕
            </button>
          </div>
          <div className="drawer-body">
            {activeProduct ? (
              <div className="product-detail">
                <div className="pd-media">
                  <img src={productDetailImage.src} alt={productDetailImage.alt || `${activeProduct.name} - ${productDetailColorName}`} />
                </div>
                <div className="pd-info">
                  <div className="pd-title">{activeProduct.name}</div>
                  <div className="price">{money(activeProduct.price)}</div>
                  <div className="pd-sub">{activeProduct.desc}</div>
                  <div className="divider" />

                  <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
                    <button className="pill-btn" onClick={() => setModelKind((m) => (m === "modelA" ? "modelB" : "modelA"))}>
                      <span aria-hidden="true">🧍</span> 模特：{modelKind === "modelA" ? "A" : "B"}（点击切换）
                    </button>
                  </div>

                  <div>
                    <div className="muted" style={{ fontSize: 12, marginBottom: 8 }}>
                      颜色
                    </div>
                    <div className="chip-row">
                      {activeProduct.colors.map((c) => (
                        <Chip key={c.id} pressed={c.id === selectedColorId} onClick={() => setSelectedColorId(c.id)}>
                          {c.name}
                        </Chip>
                      ))}
                    </div>
                  </div>

                  <div>
                    <div className="muted" style={{ fontSize: 12, marginBottom: 8 }}>
                      尺码
                    </div>
                    <div className="chip-row">
                      {activeProduct.sizes.map((s) => (
                        <Chip key={s} pressed={s === selectedSize} onClick={() => setSelectedSize(s)}>
                          {s}
                        </Chip>
                      ))}
                    </div>
                  </div>

                  <div className="divider" />
                  <div className="muted" style={{ fontSize: 12 }}>
                    亮点：{activeProduct.highlights.join(" · ")}
                  </div>

                  <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap", marginTop: 6 }}>
                    <button
                      className="primary-btn"
                      onClick={() => {
                        addToCart({
                          productId: activeProduct.id,
                          colorId: selectedColorId ?? activeProduct.colors[0].id,
                          size: selectedSize ?? activeProduct.sizes[0],
                          qty: 1,
                        });
                        setCartOpen(true);
                      }}
                    >
                      加入购物车
                    </button>
                    <button
                      className="ghost-btn"
                      onClick={() => {
                        addToCart({
                          productId: activeProduct.id,
                          colorId: selectedColorId ?? activeProduct.colors[0].id,
                          size: selectedSize ?? activeProduct.sizes[0],
                          qty: 1,
                        });
                        setProductOpen(false);
                        setCartOpen(true);
                        setCheckoutOpen(true);
                      }}
                    >
                      立即结算
                    </button>
                  </div>

                  <div className="note">
                    提示：这是演示站。真实站点可在这里补充成分、洗护、物流、退款与尺寸图等模块。
                  </div>
                </div>
              </div>
            ) : (
              <div className="muted">未找到商品</div>
            )}
          </div>
        </div>
      </aside>

      {/* Cart drawer */}
      <aside className={`drawer ${cartOpen ? "is-open" : ""}`} aria-hidden={!cartOpen}>
        <div className="drawer-scrim" onClick={() => setCartOpen(false)} />
        <div className="drawer-panel" role="dialog" aria-label="购物车">
          <div className="drawer-head">
            <div className="drawer-title">购物车</div>
            <button className="icon-btn" onClick={() => setCartOpen(false)} aria-label="关闭购物车">
              ✕
            </button>
          </div>

          <div className="drawer-body">
            {cart.length === 0 ? (
              <div className="cart-empty is-show muted">你的购物车还是空的。</div>
            ) : (
              <div className="cart-list">
                {cart.map((item) => {
                  const key = cartKey(item);
                  return (
                    <div className="cart-item" key={key}>
                      <div className="cart-thumb">
                        <img src={item.imageUrl} alt={item.name} loading="lazy" />
                      </div>
                      <div>
                        <div className="cart-row">
                          <div>
                            <div className="cart-name">{item.name}</div>
                            <div className="cart-opts">
                              {item.colorName} · {item.size}
                            </div>
                          </div>
                          <div className="price">{money(item.price)}</div>
                        </div>
                        <div className="qty">
                          <button aria-label="减少" onClick={() => updateQty(key, item.qty - 1)}>
                            −
                          </button>
                          <input
                            aria-label="数量"
                            inputMode="numeric"
                            pattern="[0-9]*"
                            value={String(item.qty)}
                            onChange={(e) => {
                              const n = Number(e.target.value);
                              if (!Number.isFinite(n)) return;
                              updateQty(key, n);
                            }}
                          />
                          <button aria-label="增加" onClick={() => updateQty(key, item.qty + 1)}>
                            ＋
                          </button>
                          <button
                            className="pill-btn danger"
                            style={{ marginLeft: "auto", padding: "8px 10px" }}
                            onClick={() => removeCartItem(key)}
                          >
                            移除
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="drawer-foot">
            <div className="cart-totals">
              <div className="muted">小计</div>
              <div className="price">{money(subtotal)}</div>
            </div>
            <button
              className="primary-btn full"
              onClick={() => {
                if (cart.length === 0) return showToast("购物车为空");
                setCheckoutOpen(true);
              }}
            >
              去结算
            </button>
            <div className="muted tiny">演示站：不产生真实支付。</div>
          </div>
        </div>
      </aside>

      {/* Size modal */}
      {sizeGuideOpen ? (
        <dialog className="modal" open aria-label="尺码推荐">
          <div className="modal-card">
            <div className="modal-head">
              <div className="modal-title">尺码推荐</div>
              <button className="icon-btn" onClick={() => setSizeGuideOpen(false)} aria-label="关闭尺码推荐">
                ✕
              </button>
            </div>
            <div className="modal-body">
              <div className="form-grid">
                <label className="field">
                  <span>身高（cm）</span>
                  <input
                    type="number"
                    min={120}
                    max={210}
                    placeholder="例如 165"
                    value={heightCm}
                    onChange={(e) => setHeightCm(e.target.value === "" ? "" : Number(e.target.value))}
                  />
                </label>
                <label className="field">
                  <span>体重（kg）</span>
                  <input
                    type="number"
                    min={30}
                    max={150}
                    placeholder="例如 52"
                    value={weightKg}
                    onChange={(e) => setWeightKg(e.target.value === "" ? "" : Number(e.target.value))}
                  />
                </label>
                <label className="field span-2">
                  <span>偏好贴合度</span>
                  <select value={fitPref} onChange={(e) => setFitPref(e.target.value as FitPref)}>
                    <option value="snug">偏紧（更塑形）</option>
                    <option value="regular">适中（推荐）</option>
                    <option value="relaxed">偏松（更舒适）</option>
                  </select>
                </label>
              </div>
              <div className="result" role="status" aria-live="polite" dangerouslySetInnerHTML={{ __html: sizeResultHtml }} />
            </div>
            <div className="modal-foot">
              <button className="ghost-btn" onClick={() => setSizeGuideOpen(false)}>
                取消
              </button>
              <button className="primary-btn" onClick={handleCalcSize}>
                生成建议
              </button>
            </div>
          </div>
        </dialog>
      ) : null}

      {/* Checkout modal */}
      {checkoutOpen ? (
        <dialog className="modal" open aria-label="结算">
          <div className="modal-card">
            <div className="modal-head">
              <div className="modal-title">结算（演示）</div>
              <button className="icon-btn" onClick={() => setCheckoutOpen(false)} aria-label="关闭结算">
                ✕
              </button>
            </div>
            <div className="modal-body">
              <div className="checkout-summary">
                <div className="muted">应付</div>
                <div className="price big">{money(subtotal)}</div>
              </div>
              <div className="form-grid">
                <label className="field span-2">
                  <span>收货人</span>
                  <input value={shipName} onChange={(e) => setShipName(e.target.value)} type="text" placeholder="姓名" />
                </label>
                <label className="field">
                  <span>手机号</span>
                  <input value={shipPhone} onChange={(e) => setShipPhone(e.target.value)} type="tel" placeholder="11 位手机号" />
                </label>
                <label className="field">
                  <span>城市</span>
                  <input value={shipCity} onChange={(e) => setShipCity(e.target.value)} type="text" placeholder="例如 上海" />
                </label>
                <label className="field span-2">
                  <span>地址</span>
                  <input value={shipAddr} onChange={(e) => setShipAddr(e.target.value)} type="text" placeholder="街道门牌等" />
                </label>
              </div>
              <div className="note">真实上线时可把表单提交到你的后端，或者对接 Shopify/独立站支付。</div>
            </div>
            <div className="modal-foot">
              <button className="ghost-btn" onClick={() => setCheckoutOpen(false)}>
                取消
              </button>
              <button className="primary-btn" onClick={placeOrder}>
                模拟下单
              </button>
            </div>
          </div>
        </dialog>
      ) : null}

      {/* Toast */}
      <div className={`toast ${toastMsg ? "is-show" : ""}`} role="status" aria-live="polite" aria-atomic="true">
        {toastMsg ?? ""}
      </div>
    </>
  );
}

