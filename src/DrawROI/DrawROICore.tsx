import React, { useCallback, useEffect, useMemo, useRef } from 'react'
import { fabric } from 'fabric'
import { useEventListener } from './hooks'
import { useStore } from './store/useStore'
import shallow from 'zustand/shallow'
import { SelectControl } from './Controls'
import { ROIsToPolygons } from './helpers'
import { PolygonComponent } from './ObjectComponents'

import Box from '@mui/material/Box'

import './DrawROICore.scss'

import '@fontsource/roboto/300.css'
import '@fontsource/roboto/400.css'
import '@fontsource/roboto/500.css'
import '@fontsource/roboto/700.css'

const ImageInitSetting = {
  shadow: new fabric.Shadow({
    color: '#8fa8bf',
    blur: 20,
    offsetX: 8,
    offsetY: 18,
  }),
  selectable: false,
}

export interface DrawROICoreProps {
  imgUrl: string | undefined
  defaultROIs: number[][][]
  onROIsChange?: (newROIs: number[][][]) => void
  children?: React.ReactNode
}

export function DrawROICore({
  imgUrl,
  defaultROIs,
  onROIsChange,
  children,
}: DrawROICoreProps) {
  const {
    fabCanvas,
    polygons,
    // mainImage,
    imgWH,
    // imgWidth,
    // imgHeight,
    setFabCanvas,
    setPolygons,
    // setMainImage,
    setImgWH,
    mouseDownHandler,
    mouseUpHandler,
    mouseMoveHandler,
  } = useStore(
    (state) => ({
      fabCanvas: state.fabCanvas,
      polygons: state.polygons,
      // mainImage: state.mainImage,
      imgWH: state.imgWH,
      setImgWH: state.setImgWH,
      // imgWidth: state.mainImage === undefined ? 0 : state.mainImage.width || 0,
      // imgHeight:
      //   state.mainImage === undefined ? 0 : state.mainImage.height || 0,
      setPolygons: state.setPolygons,
      setFabCanvas: state.setFabCanvas,
      // setMainImage: state.setMainImage,
      mouseDownHandler: state.mouseDownHandler,
      mouseUpHandler: state.mouseUpHandler,
      mouseMoveHandler: state.mouseMoveHandler,
    }),
    shallow
  )
  const appRef = useRef<fabric.Canvas | undefined>(undefined)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const imgRef = useRef<fabric.Image | undefined>(undefined)
  const isDragging = useRef<boolean>(false)
  const lastPosX = useRef<number>(0)
  const lastPosY = useRef<number>(0)

  const handleCanvasWheel = useCallback(
    (opt: fabric.IEvent): void => {
      const evt = opt.e as any
      const delta = evt.deltaY
      let zoom = appRef.current?.getZoom()
      if (zoom) {
        zoom *= 0.999 ** (delta * 2)
        if (zoom > 20) zoom = 20
        if (zoom < 0.05) zoom = 0.05
        appRef.current?.zoomToPoint({ x: evt.offsetX, y: evt.offsetY }, zoom)
        const zoomInverse = 1 / zoom
        appRef.current?.getObjects().forEach((obj) => {
          if (obj.data && obj.data.ignoreZoom === true) {
            obj.scale(zoomInverse)
          }
        })
      }
      opt.e.preventDefault()
      opt.e.stopPropagation()
    },
    [appRef.current]
  )

  //TODO: default control -- selectMove; press space to startPan

  const handleCanvasDown = useCallback(
    (opt: fabric.IEvent): void => {
      if (mouseDownHandler === undefined) {
        startPan(opt)
      } else {
        mouseDownHandler(opt)
      }
    },
    [appRef.current, mouseDownHandler]
  )

  const handleCanvasMove = useCallback(
    (opt: fabric.IEvent): void => {
      if (mouseMoveHandler === undefined) {
        panMoving(opt)
      } else {
        mouseMoveHandler(opt)
      }
    },
    [appRef.current, mouseMoveHandler]
  )

  const handleCanvasUp = useCallback((opt: fabric.IEvent): void => {
    if (mouseUpHandler === undefined) {
      endPan()
    } else {
      mouseUpHandler(opt)
    }
  }, [])

  const startPan = useCallback(
    (opt: fabric.IEvent): void => {
      const evt = opt.e as any
      if (appRef.current) {
        isDragging.current = true
        lastPosX.current = evt.clientX
        lastPosY.current = evt.clientY
      }
    },
    [appRef.current, isDragging.current, lastPosX.current, lastPosY.current]
  )

  const panMoving = useCallback((opt: fabric.IEvent): void => {
    if (isDragging.current && appRef.current) {
      const e = opt.e as any
      const vpt = appRef.current.viewportTransform
      if (vpt) {
        vpt[4] += e.clientX - lastPosX.current
        vpt[5] += e.clientY - lastPosY.current
        appRef.current.requestRenderAll()
      }
      lastPosX.current = e.clientX
      lastPosY.current = e.clientY
    }
  }, [])

  const endPan = useCallback((): void => {
    // on mouse up we want to recalculate new interaction
    // for all objects, so we call setViewportTransform
    if (appRef.current && appRef.current.viewportTransform) {
      appRef.current.setViewportTransform(appRef.current.viewportTransform)
      isDragging.current = false
    }
  }, [])

  useEffect(() => {
    // console.log(`ROIs changed - use Effect`)
    if (imgWH.width > 0 && imgWH.height > 0) {
      const polys = ROIsToPolygons(defaultROIs, imgWH.width, imgWH.height)
      setPolygons(polys)
    }
  }, [setPolygons, defaultROIs, imgWH])

  useEffect(() => {
    // console.log('polygon changed - useEffect')
    if (onROIsChange && imgWH.width > 0 && imgWH.height > 0) {
      const newROIs: number[][][] = polygons.map((poly) => {
        return poly.points.map((pt) => [
          pt.x / imgWH.width,
          pt.y / imgWH.height,
        ])
      })
      onROIsChange(newROIs)
    }
  }, [onROIsChange, polygons, imgWH])

  useEffect(() => {
    // image changed -> update image and regions
    if (
      appRef.current !== undefined &&
      imgUrl !== undefined &&
      imgRef.current
    ) {
      imgRef.current.setSrc(imgUrl, (img: fabric.Image) => {
        img.set({
          ...ImageInitSetting,
          data: {
            type: 'mainImage',
            url: imgUrl,
            name: imgUrl,
          },
        })
        setImgWH(img.width || 0, img.height || 0)
        appRef.current?.requestRenderAll()
      })
    } else if (imgUrl !== undefined && appRef.current !== undefined) {
      fabric.Image.fromURL(imgUrl, (img: fabric.Image) => {
        img.set({
          ...ImageInitSetting,
          data: {
            type: 'mainImage',
            url: imgUrl,
            name: imgUrl,
          },
        })
        imgRef.current = img
        appRef.current?.add(img)
        setImgWH(img.width || 0, img.height || 0)
      })
    }
  }, [imgUrl, setImgWH])

  useEffect(() => {
    // init fabric.canvas
    // console.log('[effect] init fabric.canvas')
    if (canvasRef.current && appRef.current === undefined) {
      if (canvasRef.current?.parentElement) {
        canvasRef.current.parentElement.style.position = 'relative'
      }
      const app = new fabric.Canvas(canvasRef.current, {
        width: canvasRef.current?.parentElement?.clientWidth,
        height: canvasRef.current?.parentElement?.clientHeight,
        fireRightClick: true,
        stopContextMenu: true,
        uniformScaling: false,
        selection: false,
      })
      app.hoverCursor = 'default'
      setFabCanvas(app)
      appRef.current = app

      // init image
      if (imgUrl) {
        fabric.Image.fromURL(imgUrl, (img: fabric.Image) => {
          img.set({
            ...ImageInitSetting,
            data: {
              type: 'mainImage',
              url: imgUrl,
              name: imgUrl,
            },
          })
          imgRef.current = img
          setImgWH(img.width || 0, img.height || 0)
          app.add(img)
        })
      }
    }
    return () => {
      // console.log('[effect] destroy fabric.canvas')
      if (canvasRef.current === null && appRef.current) {
        appRef.current.dispose()
        setFabCanvas(undefined)
      }
    }
  }, [canvasRef.current, setFabCanvas, setImgWH])

  const polygonComponentList = useMemo(() => {
    // console.log(polygons, 296)
    return polygons.map((polygon) => (
      <PolygonComponent key={polygon.id} polygon={polygon} />
    ))
  }, [polygons.length, polygons])

  useEventListener('mouse:wheel', handleCanvasWheel, fabCanvas)
  useEventListener('mouse:down', handleCanvasDown, fabCanvas)
  useEventListener('mouse:move', handleCanvasMove, fabCanvas)
  useEventListener('mouse:up', handleCanvasUp, fabCanvas)

  return (
    <>
      <canvas ref={canvasRef}></canvas>
      <Box className="DR-controls-wrapper">
        {fabCanvas !== undefined && <SelectControl />}
        {fabCanvas !== undefined && children}
      </Box>
      {fabCanvas !== undefined && polygonComponentList}
    </>
  )
}
