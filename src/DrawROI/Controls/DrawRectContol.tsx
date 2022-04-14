import React, { useCallback, useEffect, useRef } from 'react'
import { fabric } from 'fabric'
import { useStore } from './../store/useStore'
import shallow from 'zustand/shallow'
import { ControlsElementType } from './ControlType'
import { getRandomId } from './../helpers'
import { Point, Polygon } from './../types'
import { DrawRectAssistant, cropBox } from './graph'

import Tooltip from '@mui/material/Tooltip'
import Box from '@mui/material/Box'
import ToggleButton from '@mui/material/ToggleButton'
import RectangleOutlinedIcon from '@mui/icons-material/RectangleOutlined'

export const DrawRectControl: ControlsElementType = ({ disabled }) => {
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
  const assistRef = useRef<DrawRectAssistant | undefined>(undefined)

  const clearUpHelpers = useCallback(() => {
    if (fabCanvas === undefined) {
      return
    }
    // clear up the helpers
    if (assistRef.current) {
      assistRef.current.removeFromCanvas()
    }
    assistRef.current = undefined
  }, [fabCanvas, assistRef.current])

  const addROIBox = useCallback(
    ({
      top,
      left,
      width,
      height
    }: {
      top: number
      left: number
      width: number
      height: number
    }) => {
      if (imgWH.width > 0 && imgWH.height > 0) {
        const cropRes = cropBox({
          xtl: left,
          ytl: top,
          xbr: left + width,
          ybr: top + height,
          imgW: imgWH.width,
          imgH: imgWH.height
        })
        if (cropRes !== null) {
          const points: Point[] = [
            { x: cropRes.xtl, y: cropRes.ytl },
            { x: cropRes.xbr, y: cropRes.ytl },
            { x: cropRes.xbr, y: cropRes.ybr },
            { x: cropRes.xtl, y: cropRes.ybr }
          ]
          const newPolygon: Polygon = {
            id: getRandomId(),
            points
          }
          addPolygons([newPolygon])
          clearUpHelpers()
        }
      }
    },
    [imgWH, clearUpHelpers]
  )

  const handleToggleChange = useCallback(() => {
    if (controlMode !== 'drawRect') {
      setControlMode('drawRect')
    } else {
      setControlMode('default')
    }
  }, [setControlMode, controlMode])

  const onMouseDown = useCallback(
    (opt: fabric.IEvent) => {
      // console.log(`mouse down 🍑`)
      if (fabCanvas !== undefined) {
        if (assistRef.current === undefined) {
          assistRef.current = new DrawRectAssistant()
        }
        const pt = fabCanvas.getPointer(opt.e as any)
        if (assistRef.current.Status === 'init') {
          assistRef.current.setPoint(pt.x, pt.y)
          assistRef.current.addToCanvas(fabCanvas)
          fabCanvas.requestRenderAll()
        } else if (assistRef.current.Status === 'pt1') {
          // end draw -- create new box
          assistRef.current.setPoint(pt.x, pt.y)
          const { top, left, width, height } = assistRef.current.endDraw()
          addROIBox({ top, left, width, height })
        }
      }
    },
    [addROIBox]
  )

  const onMouseMove = useCallback(
    (opt: fabric.IEvent) => {
      if (fabCanvas && imgWH.width > 0 && imgWH.height > 0) {
        //   console.log(`move 🍑`)
        if (assistRef.current !== undefined) {
          const evt = opt.e as any
          const pt = fabCanvas.getPointer(evt)
          if (assistRef.current.Status === 'pt1') {
            assistRef.current.setPoint(pt.x, pt.y)
            fabCanvas.requestRenderAll()
          }
        }
      }
    },
    [fabCanvas, imgWH]
  )

  useEffect(() => {
    if (controlMode === 'drawRect') {
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
      <Tooltip title="draw rectangle">
        <ToggleButton
          disabled={disabled === true}
          sx={{
            backgroundColor: 'white'
          }}
          value="drawRect"
          selected={controlMode === 'drawRect'}
          onChange={handleToggleChange}
        >
          <RectangleOutlinedIcon />
        </ToggleButton>
      </Tooltip>
    </Box>
  )
}
