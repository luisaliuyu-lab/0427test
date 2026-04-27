# 瑜伽连体裤网站（Next.js）

## 启动

```bash
cd /Users/luisa/Documents/yoga-jumpsuit-next
npm run dev -- --hostname 127.0.0.1 --port 3000
```

打开 `http://127.0.0.1:3000`

## 添加「模特穿着照」（模特A/模特B 交替出现）

代码已支持：

- 商品列表里会**交替展示**两类模特
- 顶部有「**模特：A/B**」按钮可一键切换
- 商品详情页也有同样的切换按钮

### 1) 放照片到 public

把照片放到：

- `public/images/models/`

例如（你也可以自定义文件名，但要同步改数据）：

- `public/images/models/model-a-xxx.jpg`
- `public/images/models/model-b-xxx.jpg`

### 2) 在商品数据里配置图片

编辑：

- `src/components/Shop.tsx`

找到 `PRODUCTS` 里的 `images` 字段，按颜色（`colorId`）+ 模特类型（`model`）配置：

- `model: "modelA"`：模特A
- `model: "modelB"`：模特B

### 3) 图片建议（体验更好）

- 建议格式：**WebP**（优先）或 JPG
- 建议尺寸：长边 1600px 左右（够清晰且不太大）
- 单张体积：尽量 < 300KB（移动端更快）

## 配色（莫兰迪色）

当前 `PRODUCTS.colors` 已调整为低饱和的莫兰迪方向；你可以继续在 `Shop.tsx` 里改色值与颜色名称。
