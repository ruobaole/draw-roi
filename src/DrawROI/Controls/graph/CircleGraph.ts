import { fabric } from 'fabric'

export type MyCircleOption = {
  id: number
  left: number
  top: number
}

const defaultOption: fabric.ICircleOptions = {
  radius: 5,
  fill: '#ffffff',
  stroke: '#333333',
  strokeWidth: 0.5,
  selectable: false,
  hasBorders: false,
  hasControls: false,
  originX: 'center',
  originY: 'center',
  objectCaching: false
}

export class MyCircle extends fabric.Circle {
  constructor({ id, left, top }: MyCircleOption) {
    super({
      ...defaultOption,
      left,
      top,
      data: {
        id,
        type: 'circle',
        ignoreZoom: true
      }
    })

    if (this.canvas) {
      const zoom = this.canvas.getZoom()
      const zoomInverse = 1 / zoom
      this.scale(zoomInverse)
    }
  }

  adjustScaleByZoom() {
    if (this.canvas) {
      const zoom = this.canvas.getZoom()
      const zoomInverse = 1 / zoom
      this.scale(zoomInverse)
    }
  }
}
