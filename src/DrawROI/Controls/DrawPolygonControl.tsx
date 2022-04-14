import React, { useCallback, useEffect, useRef } from 'react'
import { fabric } from 'fabric'
import { useStore } from './../store/useStore'
import shallow from 'zustand/shallow'
import { ControlsElementType } from './ControlType'
import { getRandomId } from './../helpers'
import { MyCircle } from './graph'
import { Point, Polygon } from './../types'

import Tooltip from '@mui/material/Tooltip'
import Box from '@mui/material/Box'
import ToggleButton from '@mui/material/ToggleButton'
import ChangeHistoryOutlinedIcon from '@mui/icons-material/ChangeHistoryOutlined'

export const DrawPolygonControl: ControlsElementType = ({ disabled }) => {
  const {
    controlMode,
    setControlMode,
    fabCanvas,
    imgWH,
    addPolygons,
    setMouseDownHandler,
    setMouseMoveHandler
  } = useStore(
    (state) => ({
      controlMode: state.controlMode,
      setControlMode: state.setControlMode,
      fabCanvas: state.fabCanvas,
      imgWH: state.imgWH,
      addPolygons: state.addPolygons,
      setMouseDownHandler: state.setMouseDownHandler,
      setMouseMoveHandler: state.setMouseMoveHandler
    }),
    shallow
  )
  const activeLineRef = useRef<fabric.Line | undefined>(undefined)
  const activeShapeRef = useRef<fabric.Polygon | undefined>(undefined)
  const circleArrayRef = useRef<MyCircle[]>([])
  const lineArrayRef = useRef<fabric.Line[]>([])

  const handleToggleChange = useCallback(() => {
    if (controlMode !== 'drawPolygon') {
      setControlMode('drawPolygon')
    } else {
      setControlMode('default')
    }
  }, [setControlMode, controlMode])

  const clearUpHelpers = useCallback(() => {
    if (fabCanvas === undefined) {
      return
    }
    const fabCanvas1 = fabCanvas as fabric.Canvas
    // clear up the helpers
    circleArrayRef.current.forEach((circle) => {
      fabCanvas1.remove(circle)
    })
    lineArrayRef.current.forEach((line) => {
      fabCanvas1.remove(line)
    })
    if (activeLineRef.current) {
      fabCanvas1.remove(activeLineRef.current)
    }
    if (activeShapeRef.current) {
      fabCanvas1.remove(activeShapeRef.current)
    }
    activeLineRef.current = undefined
    activeShapeRef.current = undefined
    circleArrayRef.current = []
    lineArrayRef.current = []
  }, [
    fabCanvas,
    activeLineRef.current,
    activeShapeRef.current,
    circleArrayRef.current,
    lineArrayRef.current
  ])

  const generatePolygon = useCallback(() => {
    if (fabCanvas === undefined) {
      return
    }
    const points: Point[] = []
    const circles = circleArrayRef.current
    circles.forEach((circle) => {
      points.push({ x: circle.left || 0, y: circle.top || 0 })
    })
    const newPolygon: Polygon = {
      id: getRandomId(),
      points
    }
    addPolygons([newPolygon])

    clearUpHelpers()
  }, [
    circleArrayRef.current,
    lineArrayRef.current,
    activeLineRef.current,
    activeShapeRef.current
  ])

  const addPoint = useCallback(
    (pos: Point) => {
      if (fabCanvas === undefined) {
        return
      }
      const fabCanvas1 = fabCanvas as fabric.Canvas
      const circles = circleArrayRef.current
      const id = getRandomId()
      const circle = new MyCircle({ id, left: pos.x, top: pos.y })
      if (circles.length === 0) {
        circle.set({ fill: 'red' })
      }
      // the initial start and end points of a line
      const lineEnds = [pos.x, pos.y, pos.x, pos.y]
      const line = new fabric.Line(lineEnds, {
        strokeWidth: 2,
        fill: '#999999',
        stroke: '#999999',
        originX: 'center',
        originY: 'center',
        selectable: false,
        hasBorders: false,
        hasControls: false,
        evented: false,
        objectCaching: false,
        data: {
          class: 'line'
        }
      })
      if (activeShapeRef.current) {
        const shapePoints = activeShapeRef.current.get(
          'points'
        ) as fabric.Point[]
        shapePoints.push(new fabric.Point(pos.x, pos.y))
        const polygon = new fabric.Polygon(shapePoints, {
          stroke: '#333333',
          strokeWidth: 1,
          fill: '#cccccc',
          opacity: 0.3,
          selectable: false,
          hasBorders: false,
          hasControls: false,
          evented: false,
          objectCaching: false
        })
        // everytime -- remove the former polygon, add the new one as activeShape
        fabCanvas1.remove(activeShapeRef.current)
        fabCanvas1.add(polygon)
        activeShapeRef.current = polygon
        fabCanvas1.renderAll()
      } else {
        const polyPoint = [
          new fabric.Point(pos.x, pos.y),
          new fabric.Point(pos.x, pos.y)
        ]
        const polygon = new fabric.Polygon(polyPoint, {
          stroke: '#333333',
          strokeWidth: 1,
          fill: '#cccccc',
          opacity: 0.3,
          selectable: false,
          hasBorders: false,
          hasControls: false,
          evented: false,
          objectCaching: false
        })
        activeShapeRef.current = polygon
        fabCanvas1.add(polygon)
      }
      // update activeLine
      activeLineRef.current = line

      circleArrayRef.current.push(circle)
      lineArrayRef.current.push(line)

      fabCanvas1.add(line)
      fabCanvas1.add(circle)
      circle.adjustScaleByZoom()
      // fabCanvas1.selection = false
    },
    [
      fabCanvas,
      circleArrayRef.current,
      lineArrayRef.current,
      activeLineRef.current,
      activeShapeRef.current
    ]
  )

  const updateActive = useCallback(
    (pointer: Point) => {
      // 1) update activeLine
      if (activeLineRef.current) {
        activeLineRef.current.set({ x2: pointer.x, y2: pointer.y })
      }
      // 2) update activeShape
      if (activeShapeRef.current) {
        const points = activeShapeRef.current.get('points') as fabric.Point[]
        if (points.length > 1) {
          points[points.length - 1].setX(pointer.x)
          points[points.length - 1].setY(pointer.y)
          activeShapeRef.current.set({ points: points })
        }
      }
      if (activeLineRef.current || activeShapeRef.current) {
        fabCanvas?.renderAll()
      }
    },
    [
      fabCanvas,
      activeLineRef.current,
      activeShapeRef.current,
      circleArrayRef.current.length
    ]
  )

  const onMouseDown = useCallback(
    (opt: fabric.IEvent) => {
      // console.log(`🍑`)
      // console.log(opt.target)
      if (
        opt.target &&
        opt.target.data &&
        opt.target.data.id &&
        opt.target.data.type === 'circle'
      ) {
        // close to the first point
        if (
          circleArrayRef.current[0] &&
          circleArrayRef.current[0].data.id === opt.target.data.id
        )
          generatePolygon()
      } else if (fabCanvas !== undefined) {
        const pos = fabCanvas.getPointer(opt.e)
        if (imgWH.width > 0 && imgWH.height > 0) {
          // draw points when image unloaded -- not allowed
          boundPointer(pos, imgWH.width, imgWH.height)
          addPoint(pos)
        }
      }
    },
    [generatePolygon, addPoint, circleArrayRef.current[0]]
  )

  const onMouseMove = useCallback(
    (opt: fabric.IEvent) => {
      // console.log(`move 🍑`)
      if (fabCanvas && imgWH.width > 0 && imgWH.height > 0) {
        // draw points when image unloaded -- not allowed
        const pointer = fabCanvas.getPointer(opt.e)
        boundPointer(pointer, imgWH.width, imgWH.height)
        updateActive(pointer)
      }
    },
    [fabCanvas, imgWH]
  )

  const boundPointer = useCallback(
    (pointer: Point, boundWidth: number, boundHeight: number) => {
      const x = Math.max(Math.min(pointer.x, boundWidth), 0)
      const y = Math.max(Math.min(pointer.y, boundHeight), 0)
      pointer.x = x
      pointer.y = y
    },
    []
  )

  useEffect(() => {
    if (controlMode === 'drawPolygon') {
      setMouseDownHandler(onMouseDown)
      setMouseMoveHandler(onMouseMove)
    } else {
      clearUpHelpers()
      if (controlMode === 'default') {
        // console.log('remove drawpolygon handler')
        setMouseDownHandler(undefined)
        setMouseMoveHandler(undefined)
      }
    }
  }, [
    controlMode,
    onMouseDown,
    onMouseMove,
    setMouseDownHandler,
    setMouseMoveHandler
  ])

  return (
    <Box className="DR-control1">
      <Tooltip title="draw polygon">
        <ToggleButton
          disabled={disabled === true}
          sx={{
            backgroundColor: 'white'
          }}
          value="drawPolygon"
          selected={controlMode === 'drawPolygon'}
          onChange={handleToggleChange}
        >
          <ChangeHistoryOutlinedIcon />
        </ToggleButton>
      </Tooltip>
    </Box>
  )
}
