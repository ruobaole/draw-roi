export interface BoxCorners {
  xtl: number
  ytl: number
  xbr: number
  ybr: number
}

export interface CropBoxInput {
  xtl: number
  ytl: number
  xbr: number
  ybr: number
  imgW: number
  imgH: number
}

export function cropBox({
  xtl,
  ytl,
  xbr,
  ybr,
  imgW,
  imgH
}: CropBoxInput): BoxCorners | null {
  const imgOffsetX = 0
  const imgOffsetY = 0
  if (xtl > imgOffsetX + imgW || ytl > imgOffsetY + imgH) {
    return null
  }
  if (xbr < imgOffsetX || ybr < imgOffsetY) {
    return null
  }
  xtl = Math.max(imgOffsetX, xtl)
  ytl = Math.max(imgOffsetX, ytl)
  xbr = Math.min(imgOffsetX + imgW, xbr)
  ybr = Math.min(imgOffsetY + imgH, ybr)
  return { xtl, ytl, xbr, ybr }
}

export function getRegionFromBoxCorner(
  corners: BoxCorners,
  imgW: number,
  imgH: number
): number[] {
  const width = corners.xbr - corners.xtl
  const height = corners.ybr - corners.ytl
  //   return [corners.ytl / imgH, corners.xtl / imgW, width / imgW, height / imgH]
  return [corners.xtl / imgW, corners.ytl / imgH, width / imgW, height / imgH]
}

interface BoxDimension {
  top: number
  left: number
  width: number
  height: number
}

export function getBoxDimensionFromRegion(
  region: number[],
  imgW: number,
  imgH: number
): BoxDimension {
  return {
    top: region[1] * imgH,
    left: region[0] * imgW,
    width: region[2] * imgW,
    height: region[3] * imgH
  }
}
