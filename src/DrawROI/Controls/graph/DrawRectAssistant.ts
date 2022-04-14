import { fabric } from 'fabric'
// TODO: reform - state machine using LinkedList

// not using fabric.group because:
// https://github.com/fabricjs/fabric.js/issues/3775
export class DrawRectAssistant {
  private twoPointMode: boolean

  private status: string
  // two point mode: init -> pt1 -> init
  // four point mode: init -> pt1 -> pt2 -> pt3 -> init

  private rect: fabric.Rect

  private text: fabric.Text

  private pt1: fabric.Point

  private pt2: fabric.Point

  private pt3: fabric.Point

  private pt4: fabric.Point

  constructor(twoPointMode = true) {
    this.twoPointMode = twoPointMode
    this.status = 'init'
    this.rect = new fabric.Rect({
      name: 'drawRectAssistRect',
      fill: '#eeeeff8a',
      stroke: 'black',
      strokeWidth: 1,
      top: 0,
      left: 0,
      width: 0,
      height: 0,
      selectable: false
    })
    this.text = new fabric.Text('233x644', {
      top: 0,
      left: 0,
      fontSize: 24,
      fontFamily: 'serif',
      fontWeight: 'bold',
      selectable: false,
      fill: 'white'
    })
    this.pt1 = new fabric.Point(0, 0)
    this.pt2 = new fabric.Point(0, 0)
    this.pt3 = new fabric.Point(0, 0)
    this.pt4 = new fabric.Point(0, 0)
  }

  public get TwoPointMode(): boolean {
    return this.twoPointMode
  }

  public set TwoPointMode(twoPointMode: boolean) {
    this.twoPointMode = twoPointMode
  }

  public get Status(): string {
    return this.status
  }

  addToCanvas = (canvas: fabric.Canvas): void => {
    canvas.add(this.rect, this.text)
  }

  removeFromCanvas = (): void => {
    this.rect.canvas?.remove(this.text)
    this.rect.canvas?.remove(this.rect)
  }

  setPoint = (x: number, y: number): void => {
    // TODO: four point mode cases
    switch (this.status) {
      case 'init':
        this.set1stPoint(x, y)
        break
      case 'pt1':
        this.set2ndPoint(x, y)
        break

      default:
        break
    }
  }

  endDraw = (): {
    top: number
    left: number
    width: number
    height: number
  } => {
    // called by users
    const rectDim = {
      top: this.rect.top || 0,
      left: this.rect.left || 0,
      width: this.rect.width || 0,
      height: this.rect.height || 0
    }
    if (
      (this.twoPointMode && this.status === 'pt1') ||
      (!this.twoPointMode && this.status === 'pt3')
    ) {
      this.status = 'init'
      this.rect.set({ top: 0, left: 0, width: 0, height: 0 })
      this.text.visible = false
    }
    // else {
    //   throw new Error(
    //     `Cannot endDraw. Current mode: ${
    //       this.twoPointMode ? 'twoPoint' : 'fourPoint'
    //     }; Current status: ${this.status}`
    //   )
    // }
    return rectDim
  }

  private set1stPoint = (x: number, y: number): void => {
    this.pt1.setX(x)
    this.pt1.setY(y)
    this.status = 'pt1'
  }

  private set2ndPoint = (x: number, y: number): void => {
    this.pt2.setX(x)
    this.pt2.setY(y)
    if (this.twoPointMode) {
      const width = Math.abs(this.pt1.x - this.pt2.x)
      const height = Math.abs(this.pt1.y - this.pt2.y)
      this.rect.set({
        top: Math.min(this.pt1.y, this.pt2.y),
        left: Math.min(this.pt1.x, this.pt2.x),
        width,
        height
      })
      this.text.set({
        text: `${width.toFixed(0)}x${height.toFixed(0)}`,
        top: Math.min(this.pt1.y, this.pt2.y) + 5,
        left: Math.min(this.pt1.x, this.pt2.x) + 10
      })
      if (!this.text.visible) {
        this.text.visible = true
      }
      this.rect.setCoords()
    } else {
      // four point mode
      this.status = 'pt2'
    }
  }
}
