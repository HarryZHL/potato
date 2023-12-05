# PDF转HTML组件
基于Vue3.0构建，可将pdf转换为Canvas模式输出，支持缩放，旋转，局部放大镜等功能

## 安装
```bash
yarn add @toystory/potato -S
# OR
npm i @toystory/potato -S
```

## 基本使用方法
```vue
<template>
  <div class="pdf-container">
    <pdf-views url="/static/demo.pdf" scale rotate magnifyingGlass />
  </div>
</template>

<script setup lang="ts">
import pdfViews from '@toystory/potato'
import '@toystory/potato/dist/style.css'
</script>
```
## 单独使用放大镜
```vue
<template>
  <div class="pdf-container">
    <img ref="imgRef" src="/static/demo.jpg" />
  </div>
</template>

<script setup lang="ts">
import { MagnifyingGlass } from '@toystory/potato'
const imgRef = ref<HTMLImageElement | HTMLCanvasElement>()
new MagnifyingGlass({ el: pdfRef.value })
</script>
```
### 放大镜Options
  | 参数              | 类型    | 描述                                        |
  | ---------------- | ------- | ------------------------------------------ |
  | diffusionLength  | number  | 获取当前鼠标点的范围(放大范围，数值越小，放的越大) |
  | viewSize         | number  | 放大镜窗口的大小                              |