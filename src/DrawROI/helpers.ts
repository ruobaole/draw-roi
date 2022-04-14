import { Polygon } from './types'

export function getRandomId(): number {
  const min = 99
  const max = 999999
  const random = Math.floor(Math.random() * (max - min + 1)) + min
  return new Date().getTime() + random
}

export function ROIsToPolygons(
  ROIs: number[][][],
  imgWidth: number,
  imgHeight: number
): Polygon[] {
  const polys: Polygon[] = []
  ROIs.forEach((ROI) => {
    const newPoly: Polygon = {
      id: getRandomId(),
      points: ROI.map((pt) => ({
        x: pt[0] * imgWidth,
        y: pt[1] * imgHeight
      }))
    }
    polys.push(newPoly)
  })
  return polys
}
