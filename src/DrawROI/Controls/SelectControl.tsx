import React, { useCallback, useEffect, useMemo } from 'react'
import { fabric } from 'fabric'
import { useStore } from './../store/useStore'
import shallow from 'zustand/shallow'
import { ControlsElementType } from './ControlType'
import { Point } from './../types'

import Tooltip from '@mui/material/Tooltip'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import ToggleButton from '@mui/material/ToggleButton'
import DeleteIcon from '@mui/icons-material/Delete'
import IconButton from '@mui/material/IconButton'
import { MyPolygon } from './graph'

export const SelectControl: ControlsElementType = ({ disabled }) => {
  const {
    fabCanvas,
    controlMode,
    setControlMode,
    setMouseDownHandler,
    setMouseMoveHandler,
    deletePolygons,
    modifyPolygonPoints
  } = useStore(
    (state) => ({
      fabCanvas: state.fabCanvas,
      controlMode: state.controlMode,
      setControlMode: state.setControlMode,
      setMouseDownHandler: state.setMouseDownHandler,
      setMouseMoveHandler: state.setMouseMoveHandler,
      deletePolygons: state.deletePolygons,
      modifyPolygonPoints: state.modifyPolygonPoints
    }),
    shallow
  )

  const handleToggleChange = useCallback(() => {
    if (controlMode !== 'select') {
      setControlMode('select')
    } else {
      setControlMode('default')
    }
  }, [setControlMode, controlMode])

  const handleDoneClick = useCallback(() => {
    if (fabCanvas) {
      if (
        fabCanvas.getActiveObject() &&
        fabCanvas.getActiveObject().data &&
        fabCanvas.getActiveObject().data.type === 'polygon'
      ) {
        const selectedPolygon = fabCanvas.getActiveObject() as MyPolygon
        selectedPolygon.editing = false
        fabCanvas.discardActiveObject()
        fabCanvas.renderAll()
      }
    }
  }, [fabCanvas])

  const handleDeleteClick = useCallback(() => {
    if (fabCanvas) {
      if (
        fabCanvas.getActiveObject() &&
        fabCanvas.getActiveObject().data &&
        fabCanvas.getActiveObject().data.type === 'polygon'
      ) {
        const selectedPolygon = fabCanvas.getActiveObject() as MyPolygon
        console.log(`delete- ${selectedPolygon.data.id}`)
        deletePolygons([selectedPolygon.data.id])
      }
    }
  }, [fabCanvas, deletePolygons])

  const onMouseDown = useCallback((opt: fabric.IEvent) => {
    // console.log(`down 🍟`)
    // console.log(opt.target)
  }, [])

  const onMouseMove = useCallback(
    (opt: fabric.IEvent) => {
      //   console.log(`move 🍟`)
    },
    [fabCanvas]
  )

  const init = useCallback(() => {
    if (fabCanvas) {
      fabCanvas.getObjects().forEach((obj) => {
        const handleObjModified = () => {
          const polygonObj = obj as MyPolygon
          if (polygonObj.points) {
            const matrix = polygonObj.calcTransformMatrix()
            const newPoints = polygonObj.points
              .map((p) => {
                return new fabric.Point(
                  p.x - polygonObj.pathOffset.x,
                  p.y - polygonObj.pathOffset.y
                )
              })
              .map((p) => {
                return fabric.util.transformPoint(p, matrix)
              })
              .map((pt) => {
                // console.log(`pt: (${pt.x}, ${pt.y})`)
                return {
                  x: pt.x,
                  y: pt.y
                } as Point
              })
            modifyPolygonPoints(polygonObj.data.id, newPoints)
          }
        }
        if (obj.data && obj.data.type && obj.data.type !== 'mainImage') {
          obj.selectable = true
          if (obj.data.type === 'polygon') {
            obj.on('modified', handleObjModified)
          }
        }
      })
    }
  }, [fabCanvas, modifyPolygonPoints])

  const clearUp = useCallback(() => {
    if (fabCanvas) {
      fabCanvas.discardActiveObject()
      fabCanvas.getObjects().forEach((obj) => {
        obj.selectable = false
      })
      fabCanvas.renderAll()
    }
  }, [fabCanvas])

  useEffect(() => {
    if (controlMode === 'select') {
      init()
      setMouseDownHandler(onMouseDown)
      setMouseMoveHandler(onMouseMove)
    } else {
      clearUp()
      if (controlMode === 'default') {
        // console.log('remove select handler')
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
    <>
      <Box className="DR-control1">
        <Tooltip title="select object">
          <ToggleButton
            disabled={disabled === true}
            sx={{
              backgroundColor: 'white'
            }}
            value="select"
            selected={controlMode === 'select'}
            onChange={handleToggleChange}
          >
            Select
          </ToggleButton>
        </Tooltip>
      </Box>
      {controlMode === 'select' && (
        <Box className="DR-control2">
          <Button
            disabled={disabled === true}
            variant="contained"
            onClick={handleDoneClick}
          >
            Done
          </Button>
          <IconButton
            sx={{ backgroundColor: '#ffffff5c' }}
            aria-label="delete"
            color="error"
            onClick={handleDeleteClick}
          >
            <DeleteIcon />
          </IconButton>
        </Box>
      )}
    </>
  )
}
