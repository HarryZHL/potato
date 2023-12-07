<template>
  <div v-loading="loading" class="pdf-container">
    <div class="wrapper-todo">
      <div class="page-num">
        <el-input
          class="current-page"
          v-model="pageNum"
          @blur="changePageNum"
        />
        <span class="pageTotal">&nbsp; / {{ pageTotal }}</span>
      </div>
      <div class="page-scale">
        <template v-if="props.scale">
          <el-button
            type="primary"
            :icon="ZoomIn"
            @click="handleAddscale"
          ></el-button>
          <el-input class="current-scale" readonly :modelValue="currentScale" />
          <el-button
            type="primary"
            :icon="ZoomOut"
            @click="handleMinus"
          ></el-button>
          <el-button type="primary" plain @click="handleReset">重置</el-button>
        </template>
        <el-button v-if="props.rotate" type="primary" @click="handleRotate"
          ><svg-icon name="rotate" color="#fff"
        /></el-button>
      </div>
    </div>
    <div class="pages-wrap">
      <el-scrollbar
        view-class="scroll-bar"
        ref="scrollbarRef"
        @scroll="handleScroll"
      >
        <!--此处根据pdf的页数动态生成相应数量的canvas画布-->
        <canvas
          v-for="pageIndex in pageTotal"
          ref="pdfCanvasRefs"
          :id="`pdf-canvas-` + pageIndex"
          :key="pageIndex"
          style="display: block"
        ></canvas>
      </el-scrollbar>
    </div>
  </div>
</template>

<script setup lang="ts">
import * as pdfjsLib from 'pdfjs-dist'
import type { PDFDocumentProxy } from 'pdfjs-dist'
import { ref, onMounted, nextTick, computed, reactive } from 'vue'
import { ElMessage, ElScrollbar } from 'element-plus'
import { ZoomIn, ZoomOut } from '@element-plus/icons-vue'
import pdfWorker from 'pdfjs-dist/build/pdf.worker.entry'
import { MagnifyingGlass } from './magnifyingGlass'

const pdfCanvasRefs = ref<HTMLCanvasElement[]>([])
const loading = ref<boolean>(true)
const props = withDefaults(
  defineProps<{
    magnifyingGlass: boolean
    scale: boolean
    rotate: boolean
    url: string
  }>(),
  {
    magnifyingGlass: false,
    scale: false,
    rotate: false,
    url: ''
  }
)
let pdfDoc: PDFDocumentProxy // 保存加载的pdf文件流
const pageTotal = ref(0) // pdf文件的页数
const pdfScale = ref(1.0) // 缩放比例
const pageNum = ref(1)
const scrollbarRef = ref<InstanceType<typeof ElScrollbar>>()
const maxScale = ref(3)
const minScale = ref(0.5)
const pagesHeight: number[] = reactive([])
const pagesWidth: number[] = reactive([])
const currentScale = computed(() => {
  return Math.round(pdfScale.value * 100) + '%'
})
// 调用loadFile方法
onMounted(() => {
  if (!props.url) {
    ElMessage.error('缺少pdf的路径')
    loading.value = false
    return
  }
  loadFile(props.url)
})
// 获取pdf文档流与pdf文件的页数
const loadFile = async (url: string) => {
  pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorker
  const loadingTask = pdfjsLib.getDocument(url)
  await loadingTask.promise.then((pdf) => {
    pdfDoc = pdf
    pageTotal.value = pdf.numPages
    nextTick(async () => {
      await renderPage(1)
    })
  })
  loading.value = false
}
// 渲染pdf文件
const renderPage = async (num: number) => {
  await pdfDoc.getPage(num).then(async (page) => {
    const canvasId = 'pdf-canvas-' + num
    const canvas: HTMLCanvasElement = document.getElementById(
      canvasId
    ) as HTMLCanvasElement
    if (!canvas) {
      throw new Error('缺少canvas标签')
    }
    const ctx = canvas.getContext('2d')
    const ratio = window.devicePixelRatio || 1
    const viewport = page.getViewport({ scale: pdfScale.value })
    pagesWidth[num - 1] = canvas.width = viewport.width * ratio
    pagesHeight[num - 1] = canvas.height = viewport.height * ratio
    canvas.style.width = viewport.width + 'px'
    canvas.style.height = viewport.height + 'px'
    ctx?.setTransform(ratio, 0, 0, ratio, 0, 0)
    ctx &&
      page.render({
        canvasContext: ctx,
        viewport: viewport
      })
    setTimeout(() => {
      props.magnifyingGlass &&
        new MagnifyingGlass({ el: pdfCanvasRefs.value[num - 1] })
    }, 0)
    if (num < pageTotal.value) {
      await renderPage(num + 1)
    }
  })
}
/*
 *   放大
 * */
const handleAddscale = () => {
  if (pdfScale.value >= maxScale.value) {
    return
  }
  pdfScale.value += 0.1
  // this.isLoading = true;
  renderPage(1)
}
/*
 *   缩小
 * */
const handleMinus = () => {
  const scale = +pdfScale.value.toFixed(2)
  if (scale <= minScale.value) {
    return
  }
  pdfScale.value -= 0.1
  // this.isLoading = true
  renderPage(1)
}
/*
 *   重置
 * */
const handleReset = () => {
  pdfScale.value = 1
  // this.isLoading = true;
  renderPage(1)
}

const handleScroll: ({ scrollTop }: { scrollTop: number }) => void = ({
  scrollTop
}) => {
  let pageNumFlag = false
  const ratio = window.devicePixelRatio || 1
  pagesHeight.reduce((prev, cur, index) => {
    const total = prev + cur
    if (scrollTop * ratio > prev && scrollTop * ratio < total && !pageNumFlag) {
      pageNum.value = index + 1
      pageNumFlag = true
    }
    return total
  }, 0)
}

const changePageNum = () => {
  if (!/\d+/.test(pageNum.value + '') || pageNum.value <= 0) {
    pageNum.value = 1
  } else if (pageNum.value > pageTotal.value) {
    pageNum.value = pageTotal.value
  }
  const ratio = window.devicePixelRatio || 1
  const scrollTop =
    pageNum.value > 1
      ? pagesHeight
          .slice(0, pageNum.value - 1)
          .reduce((prev, cur) => prev + cur)
      : 0
  scrollbarRef.value?.setScrollTop(scrollTop / ratio + 12 * (pageNum.value - 1))
}

const handleRotate = () => {
  const canvas: HTMLCanvasElement = document.getElementById(
    `pdf-canvas-${pageNum.value}`
  ) as HTMLCanvasElement
  const transformStyle = canvas!.style.transform.match(
    /(?<=rotate\()\d+(?=deg\))/g
  )
  const currentDeg =
    transformStyle && transformStyle.length ? +transformStyle[0] : 0
  const newDeg = currentDeg + 90
  canvas!.style.transform = `rotate(${newDeg > 360 ? 0 : newDeg}deg)`
}
</script>

<style lang="scss" scoped>
.pdf-container {
  text-align: center;
  .pages-wrap {
    display: inline-block;
    max-width: 100%;
    height: calc(100vh - 292px);
    canvas {
      margin-bottom: 20px;
      box-shadow: 0 0 10px rgb(0 0 0 / 30%);
    }
  }
  :deep(.scroll-bar) {
    padding: 20px;
  }
  .current-page {
    width: 40px;
    :deep(input) {
      text-align: center;
    }
  }
  .current-scale {
    margin: 0 12px;
    width: 60px;
    :deep(input) {
      text-align: center;
    }
  }
  .page-num {
    display: inline-block;
    padding: 0 10px;
  }
  .wrapper-todo {
    padding: 10px 0;
  }
  .page-scale {
    display: inline-block;
    padding: 0 10px;
  }
}
</style>
