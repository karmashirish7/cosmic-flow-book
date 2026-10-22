const TITLE_BAND = 34

/**
 * Renders an inline SVG to a PNG at `scale`× and downloads it. A `title` is
 * drawn in a band above the image, so the file says which chart it is.
 */
export async function downloadSvgAsPng(svg: SVGSVGElement, filename: string, title?: string, scale = 3): Promise<void> {
  const { width, height: bodyHeight } = svg.viewBox.baseVal
  const body = svg.cloneNode(true) as SVGSVGElement
  body.setAttribute('width', String(width))
  body.setAttribute('height', String(bodyHeight))
  body.removeAttribute('style')

  const band = title ? TITLE_BAND : 0
  const height = bodyHeight + band
  const escape = (t: string) => t.replace(/[&<>]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' })[c]!)
  const xml = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">`
    + `<rect width="${width}" height="${height}" fill="#FFFFFF"/>`
    + (title ? `<text x="${width / 2}" y="22" text-anchor="middle" font-family="Cinzel, Georgia, serif" font-size="15" font-weight="700" fill="#8B1E1E">${escape(title)}</text>` : '')
    + `<g transform="translate(0,${band})">${new XMLSerializer().serializeToString(body)}</g></svg>`
  const img = new Image()
  img.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(xml)}`
  await img.decode()

  const canvas = document.createElement('canvas')
  canvas.width = width * scale
  canvas.height = height * scale
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Canvas is not available in this browser')
  ctx.drawImage(img, 0, 0, canvas.width, canvas.height)

  const blob = await new Promise<Blob | null>(resolve => canvas.toBlob(resolve, 'image/png'))
  if (!blob) throw new Error('Could not create the image')
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

/** Filename-safe slug, e.g. "Ram Bahadur" → "ram-bahadur". */
export const slugify = (s: string) =>
  s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'chart'
