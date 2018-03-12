/* eslint-disable */

import {
  EXIF
} from 'exif-js'

const imgReg = /^(?:image\/bmp|image\/cis-cod|image\/gif|image\/ief|image\/jpeg|image\/pipeg|image\/png|image\/svg\+xml|image\/tiff|image\/x-cmu-raster|image\/x-cmx|image\/x-icon|image\/x-portable-anymap|image\/x-portable-bitmap|image\/x-portable-graymap|image\/x-portable-pixmap|image\/x-rgb|image\/x-xbitmap|image\/x-xpixmap|image\/x-xwindowdump)$/i

export function parseImgToDataUrl(file) {
  return new Promise(function(resolve, reject) {
    if (!file.type) return reject(new Error('未知类型的文件'))
    if (!imgReg.test(file.type)) return reject(new Error('请选择图片'))
    const fileReader = new FileReader()
    fileReader.readAsDataURL(file)
    fileReader.onload = function(FREvent) {
      return resolve(FREvent.target.result)
    }
    fileReader.onerror = function() {
      return reject(new Error('读取图片失败'))
    }
  })
}

export function parseDataUrlToBuffer(dataUrl) {
  const byteString = window.atob(dataUrl.split(',')[1])
  const ia = new Uint8Array(byteString.length)
  for (let i = 0; i < byteString.length; i++) {
    ia[i] = byteString.charCodeAt(i)
  }
  return ia
}

export function parseDataUrlWithCanvas(dataUrl, opts = {}) {
  return new Promise(function(resolve, reject) {
    let {
      size = true,
      crop = true,
      width = 600,
      height = 600,
      fixIOS = true,
      imgQuality = 1,
      imgType = ''
    } = opts
    const mimeString = dataUrl.split(',')[0].split(':')[1].split(';')[0]
    const exif = EXIF.readFromBinaryFile(parseDataUrlToBuffer(dataUrl).buffer)
    const img = new Image()
    img.onload = function() {
      let iw = img.width
      let ih = img.height
      if (!size) {
        width = iw
        height = ih
      }
      const canvas = document.createElement('canvas')
      canvas.width = width
      canvas.height = height
      const ctx = canvas.getContext('2d')
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      ctx.save()
      transformCoordinate(canvas, width, height, exif.Orientation || 1)

      if (detectSubsampling(img)) {
        iw /= 2
        ih /= 2
      }
      let translateX = 0
      let translateY = 0
      let scaleWidth = width
      let scaleHeight = height

      if (iw > ih) {
        scaleWidth = (iw / ih) * width
        translateX = (iw - ih) / 2
      } else {
        scaleHeight = (ih / iw) * height
        translateY = (ih - iw) / 2
      }
      if (crop) {
        drawImageIOSFix(ctx, img, detectVerticalSquash(img, iw, ih), translateX, translateY, iw, ih, 0, 0, scaleWidth, scaleHeight)
      } else if (fixIOS) {
        drawImageIOSFix(ctx, img, detectVerticalSquash(img, iw, ih), 0, 0, iw, ih, 0, 0, width, height)
      } else {
        drawImageIOSFix(ctx, img, 1, 0, 0, iw, ih, 0, 0, width, height)
      }
      ctx.restore()
      return resolve(canvas.toDataURL(imgType || mimeString, imgQuality))
    }
    img.onerror = function() {
      return reject(new Error('加载图片数据失败'))
    }
    img.src = dataUrl
  })
}

export function dataURLtoBlob(data) {
  const mimeString = data.split(',')[0].split(':')[1].split(';')[0]
  const ia = parseDataUrlToBuffer(data)
  if (window.BlobBuilder || window.WebKitBlobBuilder || window.MozBlobBuilder) {
    const bb = new(window.BlobBuilder || window.WebKitBlobBuilder || window.MozBlobBuilder)()
    bb.append(ia)
    return bb.getBlob(mimeString)
  } else {
    return new Blob([ia], {
      type: mimeString
    })
  }
}

/**
 * Detect subsampling in loaded image.
 * In iOS, larger images than 2M pixels may be subsampled in rendering.
 */
export function detectSubsampling(img) {
  const iw = img.width
  const ih = img.height
  if (iw * ih > 1048576) { // subsampling may happen over megapixel image
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    canvas.width = canvas.height = 1
    ctx.drawImage(img, -iw + 1, 0)
    // subsampled image becomes half smaller in rendering size.
    // check alpha channel value to confirm image is covering edge pixel or not.
    // if alpha value is 0 image is not covering, hence subsampled.
    return ctx.getImageData(0, 0, 1, 1).data[3] === 0
  } else {
    return false
  }
}

/**
 * Transform canvas coordination according to specified frame size and orientation
 * Orientation value is from EXIF tag
 */
export function transformCoordinate(canvas, width, height, orientation) {
  const ctx = canvas.getContext('2d')
  switch (orientation) {
    case 1:
      // nothing
      break
    case 2:
      // horizontal flip  水平方向翻转
      ctx.translate(width, 0)
      ctx.scale(-1, 1)
      break
    case 3:
      // 180 rotate left  180度向左旋转
      ctx.translate(width, height)
      ctx.rotate(Math.PI)
      break
    case 4:
      // vertical flip    竖直方向旋转
      ctx.translate(0, height)
      ctx.scale(1, -1)
      break
    case 5:
      // vertical flip + 90 rotate right
      ctx.rotate(0.5 * Math.PI)
      ctx.scale(1, -1)
      break
    case 6:
      // 90 rotate right 顺时针旋转90度
      ctx.rotate(0.5 * Math.PI)
      ctx.translate(0, -height)
      break
    case 7:
      // horizontal flip + 90 rotate right
      ctx.rotate(0.5 * Math.PI)
      ctx.translate(width, -height)
      ctx.scale(-1, 1)
      break
    case 8:
      // 90 rotate left   逆时针旋转90度
      ctx.rotate(-0.5 * Math.PI)
      ctx.translate(-width, 0)
      break
    default:
      break
  }
}

/**
 * Detecting vertical squash in loaded image.
 * Fixes a bug which squash image vertically while drawing into canvas for some images.
 */
export function detectVerticalSquash(img, iw, ih) {
  const canvas = document.createElement('canvas')
  canvas.width = 1
  canvas.height = ih
  const ctx = canvas.getContext('2d')
  ctx.drawImage(img, 0, 0)
  const data = ctx.getImageData(0, 0, 1, ih).data
  // search image edge pixel position in case it is squashed vertically.
  let sy = 0
  let ey = ih
  let py = ih
  while (py > sy) {
    let alpha = data[(py - 1) * 4 + 3]
    if (alpha === 0) {
      ey = py
    } else {
      sy = py
    }
    py = (ey + sy) >> 1
  }
  let ratio = py / ih
  return ratio === 0 ? 1 : ratio
}

export function drawImageIOSFix(ctx, img, vertSquashRatio, sx, sy, sw, sh, dx, dy, dw, dh) {
  ctx.drawImage(img, sx * vertSquashRatio, sy * vertSquashRatio,
    sw * vertSquashRatio, sh * vertSquashRatio,
    dx, dy, dw, dh)
}
