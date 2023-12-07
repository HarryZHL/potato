interface Options {
  el: HTMLImageElement | HTMLCanvasElement
  diffusionLength?: number
  viewSize?: number
}
export class MagnifyingGlass {
  private imgEl: HTMLImageElement | HTMLCanvasElement
  private magnifyingGlassView?: HTMLCanvasElement
  private interceptionTimer?: NodeJS.Timeout | null
  private originalPiexls: ImageData | undefined
  private smallCanvas?: HTMLCanvasElement
  private isImageFlag: boolean = false
  // 获取当前鼠标点的范围(放大范围，数值越小，放的越大)
  private diffusionLength: number
  // 放大镜窗口的大小
  private viewSize: number

  constructor(Options: Options) {
    const { el, ...opts } = Options
    if (!el) {
      throw new Error('请传入需要放大的图片')
    }

    if (el.tagName !== 'CANVAS' && el.tagName !== 'IMG') {
      throw new Error('请传入正确格式的图片')
    }
    this.diffusionLength = opts?.diffusionLength || 100
    this.viewSize = opts?.viewSize || 200
    this.imgEl = el
    if (el.tagName === 'IMG') {
      this.isImageFlag = true
    }
    this.listenerImgLoadSucceeded()
  }

  // 监听图片加载完成
  async listenerImgLoadSucceeded() {
    if (this.isImageFlag && !(this.imgEl as HTMLImageElement).complete) {
      await new Promise((resolve) => {
        this.imgEl.onload = resolve
      })
    }
    // 添加鼠标事件
    this.addMouseEvent()
    // 创建一个放大预览视图
    this.createMagnifyingGlassView()
  }

  // 添加鼠标事件
  addMouseEvent() {
    // 添加鼠标滑过事件
    this.addMouseMoveToImageEl()
    // 鼠标滑出事件
    this.addMouseLeaveToImageEl()
  }

  // 创建一个放大预览视图
  createMagnifyingGlassView() {
    if (this.magnifyingGlassView) {
      this.magnifyingGlassView.remove()
    }
    this.magnifyingGlassView = document.createElement('canvas')
    this.magnifyingGlassView.style.cssText =
      'position: fixed;background:aliceblue;left:0;top:0;pointer-events:none;display:none'
    this.magnifyingGlassView.setAttribute('width', `${this.viewSize}px`)
    this.magnifyingGlassView.setAttribute('height', `${this.viewSize}px`)
    const body = document.getElementsByTagName('body')[0]
    body.appendChild(this.magnifyingGlassView)
  }

  // 添加鼠标滑过事件
  addMouseMoveToImageEl() {
    this.imgEl.onmousemove = (event) => {
      const x = event.clientX + 20
      const y = event.clientY + 20
      const position = { x, y }
      // 截流
      this.interceptionFunc(() => {
        // 修改放大视图位置
        this.changeMagnifyingGlassViewPosition(position)
        // 获取需要放大的像素
        this.getNeedMasgnifyingGlassPiexl({
          clientX: event.clientX - this.getElementPosition(this.imgEl).left,
          clientY: event.clientY - this.getElementPosition(this.imgEl).top
        })
      })
    }
  }

  // 鼠标滑出事件
  addMouseLeaveToImageEl() {
    this.imgEl.onmouseleave = () => {
      // 移除放大框
      // magnifyingGlassView.style.display = 'none'
      this.magnifyingGlassView?.parentNode?.removeChild(
        this.magnifyingGlassView
      )
    }
    this.imgEl.onmouseenter = () => {
      this.createMagnifyingGlassView()
    }
  }

  // 获取元素在屏幕的位置
  getElementPosition(element: HTMLElement) {
    let top = element.offsetTop
    let left = element.offsetLeft

    // 相对偏移量
    let currentParent = element.offsetParent as HTMLElement
    while (currentParent !== null) {
      top += currentParent.offsetTop
      left += currentParent.offsetLeft
      currentParent = currentParent.offsetParent as HTMLElement
    }

    // 相对滚动的距离
    let parentElement = element.parentElement
    while (parentElement !== null) {
      top -= parentElement.scrollTop
      left -= parentElement.scrollLeft
      parentElement = parentElement.parentElement
    }
    return { top, left }
  }

  // 截流
  interceptionFunc(cb: () => void) {
    if (this.interceptionTimer) {
      return
    }
    this.interceptionTimer = setTimeout(() => {
      cb()
      this.interceptionTimer = null
    }, 20)
  }

  // 修改放大视图位置
  changeMagnifyingGlassViewPosition<T extends { x: number; y: number }>(
    position: T
  ) {
    if (this.magnifyingGlassView) {
      this.magnifyingGlassView.style.left = position.x + 'px'
      this.magnifyingGlassView.style.top = position.y + 'px'
      this.magnifyingGlassView.style.display = 'block'
    }
  }

  // 获取需要放大的像素
  async getNeedMasgnifyingGlassPiexl(event: {
    clientX: number
    clientY: number
  }) {
    // 获取原始像素
    this.getOriginalPiexls()
    // 如果像素为空，不进行操作
    if (!this.originalPiexls || this.originalPiexls.data.length === 0) {
      return
    }
    // 获取待放大IMG的宽度，用来计算像素
    const imageWidth = this.imgEl.offsetWidth
    // 鼠标触点
    const mouseX = event.clientX
    const mouseY = event.clientY
    // 规定区域的上下、左右宽度
    const sepX = parseInt(String(this.diffusionLength))
    const sepY = parseInt(String(this.diffusionLength))
    // 需要开始的点
    const startPoint = {
      x: mouseX - parseInt(String(sepX / 2.0)),
      y: mouseY - parseInt(String(sepY / 2.0))
    }
    // 需要结束的点
    const endPoint = {
      x: mouseX + parseInt(String(sepX / 2.0)),
      y: mouseY + parseInt(String(sepY / 2.0))
    }
    // 最终要展示的像素集合(乘以4是单一像素值宽度)
    const finallyOriginalPiexls = new Uint8ClampedArray(sepX * sepY * 4)
    let currentIndex = 0
    // 操作像素
    for (let i = startPoint.y; i < endPoint.y; i++) {
      for (let j = startPoint.x; j < endPoint.x; j++) {
        for (let k = 0; k < 4; k++) {
          const index = (i * imageWidth + j) * 4 + k
          if (index > 0 && index < this.originalPiexls.data.length) {
            // 超过宽度部分需要进行其他色值填充
            if (j < imageWidth) {
              finallyOriginalPiexls[currentIndex] =
                this.originalPiexls.data[index]
            } else {
              finallyOriginalPiexls[currentIndex] = 199
            }
          } else {
            finallyOriginalPiexls[currentIndex] = 199
          }
          currentIndex += 1
        }
      }
    }

    // 先绘制一个100*100单位长的小图
    if (!this.smallCanvas) {
      this.smallCanvas = document.createElement('canvas')
      this.smallCanvas.setAttribute('width', `${this.diffusionLength}px`)
      this.smallCanvas.setAttribute('height', `${this.diffusionLength}px`)
    }
    const smallCtx = this.smallCanvas.getContext('2d')
    // 初始化ImageData
    const finallyImageData = new ImageData(finallyOriginalPiexls, sepX, sepY)
    // 当前范围内需要放大的像素
    smallCtx?.putImageData(
      finallyImageData,
      0,
      0,
      0,
      0,
      this.diffusionLength,
      this.diffusionLength
    )
    const url = this.smallCanvas.toDataURL('image/jpeg', 1)

    // 将小图绘制到200*200的预览图上
    const image = new Image()
    image.src = url
    await new Promise((resolve) => {
      image.onload = resolve
    })
    const magnifyingGlassCtx = this.magnifyingGlassView?.getContext('2d')
    magnifyingGlassCtx?.drawImage(image, 0, 0, this.viewSize, this.viewSize)
  }

  // 保存原像素（操作像素点时候用）
  async getOriginalPiexls() {
    if (!this.originalPiexls || this.originalPiexls.data.length === 0) {
      // let canvas = imgEl
      let ctx: CanvasRenderingContext2D | null
      if (this.isImageFlag) {
        ctx = await this.imageToCanvas(this.imgEl as HTMLImageElement)
      } else {
        ctx = (this.imgEl as HTMLCanvasElement).getContext('2d')
      }
      // const ctx = (canvas as HTMLCanvasElement).getContext('2d')
      const width =
        this.imgEl.getAttribute('width') ||
        this.imgEl.style.width ||
        this.imgEl.width
      const height =
        this.imgEl.getAttribute('height') ||
        this.imgEl.style.height ||
        this.imgEl.height
      try {
        // 保存像素
        this.originalPiexls = ctx?.getImageData(
          0,
          0,
          Number(width),
          Number(height)
        )
      } catch (error) {
        console.log(error)
      }
    }
  }

  // 处理图片标签
  async imageToCanvas(
    ele: HTMLImageElement
  ): Promise<CanvasRenderingContext2D | null> {
    const image = new Image()
    image.src = ele.src
    // 等待IMG标签加载完成后保存像素值
    await new Promise((resolve) => {
      image.onload = resolve
    })
    const width = image.width
    const height = image.height
    const canvas = document.createElement('canvas')
    canvas.setAttribute('width', `${width}px`)
    canvas.setAttribute('height', `${height}px`)
    const ctx = canvas.getContext('2d')
    ctx!.fillStyle = ctx?.createPattern(image, 'no-repeat') as CanvasPattern
    ctx?.fillRect(0, 0, width, height)
    return ctx
  }
}
