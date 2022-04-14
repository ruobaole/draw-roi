import { fabric } from 'fabric'
import { Point } from '../../types'

export type MyPolygonOption = {
  id: number
  points: Point[]
}

const defaultOption: fabric.IPolylineOptions = {
  stroke: '#ffd000',
  strokeWidth: 0.5,
  fill: '#fff200',
  opacity: 0.5,
  selectable: false,
  objectCaching: false,
  transparentCorners: false
}

export class MyPolygon extends fabric.Polygon {
  private _selected: boolean
  private _editing: boolean

  constructor({ id, points }: MyPolygonOption) {
    const fPoints = points.map((pt) => new fabric.Point(pt.x, pt.y))
    super(fPoints, {
      ...defaultOption,
      data: {
        id,
        type: 'polygon'
      }
    })
    this._editing = false
    this._selected = false
    this.on('mousedblclick', this.handleDoubleClick)
    // this.on('modified', this.handleModified)
  }

  private _createPolygonVertexControl(
    lastControlIndex: number,
    index: number
  ): fabric.Control {
    const canvas1 = this.canvas as fabric.Canvas

    function polygonPositionHandler(
      dim: { x: number; y: number },
      finalMatrix: any,
      fabricObject: fabric.Object
    ): fabric.Point {
      const polygonObj = fabricObject as fabric.Polygon
      let x = 0
      let y = 0
      if (polygonObj.points) {
        x = polygonObj.points[index].x - polygonObj.pathOffset.x
        y = polygonObj.points[index].y - polygonObj.pathOffset.y
      }
      const point0 = new fabric.Point(x, y)
      if (canvas1.viewportTransform) {
        return fabric.util.transformPoint(
          point0,
          fabric.util.multiplyTransformMatrices(
            canvas1.viewportTransform as number[],
            fabricObject.calcTransformMatrix()
          )
        )
      }
      return point0
    }

    // define a function that will define what the control does
    // this function will be called on every mouse move after a control has been
    // clicked and is being dragged.
    // The function receive as argument the mouse event, the current trasnform object
    // and the current position in canvas coordinate
    // transform.target is a reference to the current object being transformed,
    function actionHandler(
      eventData: MouseEvent,
      transformData: fabric.Transform,
      x: number,
      y: number
    ): boolean {
      const polygon = transformData.target as fabric.Polygon
      // const currentControl = polygon.controls[
      //   (polygon as any).__corner
      // ] as fabric.Control
      if (polygon.points) {
        const mouseLocalPosition = polygon.toLocalPoint(
          new fabric.Point(x, y),
          'center',
          'center'
        )
        const polygonBaseSize = polygon._getNonTransformedDimensions()
        const size = polygon._getTransformedDimensions(0, 0)
        const finalPoint = new fabric.Point(
          (mouseLocalPosition.x * polygonBaseSize.x) / size.x +
            polygon.pathOffset.x,
          (mouseLocalPosition.y * polygonBaseSize.y) / size.y +
            polygon.pathOffset.y
        )
        const points = polygon.get('points') as fabric.Point[]
        points[index].setX(finalPoint.x)
        points[index].setY(finalPoint.y)
        // const dim = polygon._calcDimensions()
        polygon.set({ points: points })
        return true
      }
      return false
    }

    // A function to keep the polygon in the same position when we change its
    // width/height/top/left.
    function anchorWrapper(
      anchorIndex: number,
      actionHandler: fabric.Control['actionHandler']
    ) {
      const wrappedActionHandler: fabric.Control['actionHandler'] = (
        eventData,
        transform,
        x,
        y
      ): boolean => {
        const fabricObject = transform.target as fabric.Polygon
        if (fabricObject.points) {
          const point0 = new fabric.Point(
            fabricObject.points[anchorIndex].x - fabricObject.pathOffset.x,
            fabricObject.points[anchorIndex].y - fabricObject.pathOffset.y
          )
          const absolutePoint = fabric.util.transformPoint(
            point0,
            fabricObject.calcTransformMatrix()
          )
          const actionPerformed = actionHandler(eventData, transform, x, y)
          ;(fabricObject as any)._setPositionDimensions({})
          const polygonBaseSize = fabricObject._getNonTransformedDimensions()
          const newX =
            (fabricObject.points[anchorIndex].x - fabricObject.pathOffset.x) /
            polygonBaseSize.x
          const newY =
            (fabricObject.points[anchorIndex].y - fabricObject.pathOffset.y) /
            polygonBaseSize.y
          ;(fabricObject as any).setPositionByOrigin(
            absolutePoint,
            newX + 0.5,
            newY + 0.5
          )
          return actionPerformed
        }
        return false
      }
      return wrappedActionHandler
    }

    return new fabric.Control({
      positionHandler: polygonPositionHandler,
      actionHandler: anchorWrapper(
        index > 0 ? index - 1 : lastControlIndex,
        actionHandler
      ),
      // actionHandler,
      actionName: 'modifyPolygon'
    })
  }

  private _updateControls() {
    if (!this.canvas) {
      return
    }

    if (this.editing && this.points) {
      const lastControlIndex = this.points.length - 1
      this.cornerStyle = 'circle'
      // this.cornerColor = 'rgba(0,0,255,0.5)'
      this.controls = this.points.reduce((acc, point, index) => {
        acc[`p_${index}`] = this._createPolygonVertexControl(
          lastControlIndex,
          index
        )
        return acc
      }, {} as { [key: string]: fabric.Control })
    } else if (this._selected) {
      this.cornerStyle = 'rect'
      this.controls = { ...fabric.Object.prototype.controls }
    }
    this.hasBorders = !this.editing
    this.canvas?.requestRenderAll()
  }

  public get editing() {
    return this._editing
  }

  public set editing(isEditing: boolean) {
    this._editing = isEditing
    if (isEditing === false) {
      this._selected = false
    }
  }

  onSelect(): boolean {
    // console.log('onSelect')
    this._selected = true
    this._updateControls()
    return false
  }

  onDeselect(): boolean {
    // console.log('onDeselect')
    if (!this.editing) {
      this._selected = false
      return false
    }
    return true
  }

  handleModified() {
    console.log('mmmmmodified')
  }

  handleDoubleClick() {
    // console.log('double clickkkk')
    if (this._selected) {
      this.editing = true
      this._updateControls()
    }
  }
}
