import React, { useLayoutEffect, useRef } from 'react'

/**
 * Single large crisp running horse component with ground shadow and kicking dust puffs.
 * Supports instant, layout-shift-free GIF frame freezing on finish line snapshot without leg animation continuing.
 */
export default function Horse({
  img = '/HORSES/horse_jockey_6mb.gif',
  hue = 0,
  saturate = 1,
  brightness = 1,
  running = true,
  isFreeze = false,
}) {
  const imgRef = useRef(null)
  const canvasRef = useRef(null)

  useLayoutEffect(() => {
    if (isFreeze && imgRef.current && canvasRef.current) {
      try {
        const imgEl = imgRef.current
        const canvas = canvasRef.current
        const width = imgEl.naturalWidth || imgEl.clientWidth || 400
        const height = imgEl.naturalHeight || imgEl.clientHeight || 300
        if (canvas.width !== width) canvas.width = width
        if (canvas.height !== height) canvas.height = height
        const ctx = canvas.getContext('2d', { willReadFrequently: true })
        if (ctx) {
          ctx.clearRect(0, 0, width, height)
          ctx.drawImage(imgEl, 0, 0, width, height)
        }
      } catch (err) {
        console.warn('GIF freeze frame draw error:', err)
      }
    }
  }, [isFreeze])

  return (
    <div className="horse-container-outer" aria-hidden="true">
      {running && (
        <div
          className="horse-dust-puff"
          style={{
            opacity: isFreeze ? 0 : 1,
            pointerEvents: 'none',
          }}
        >
          <span className="dust-particle dp-b1" />
          <span className="dust-particle dp-b2" />
          <span className="dust-particle dp-b3" />
          <span className="dust-particle dp-b4" />
          <span className="dust-particle dp-b5" />
          <span className="dust-particle dp-f1" />
          <span className="dust-particle dp-f2" />
          <span className="dust-particle dp-f3" />
          <span className="dust-particle dp-s1" />
          <span className="dust-particle dp-s2" />
          <span className="dust-particle dp-s3" />
        </div>
      )}

      <div className="horse-viewport" style={{ position: 'relative' }}>
        <img
          ref={imgRef}
          src={img}
          alt="Horse Jockey"
          className="horse-gif-img"
          draggable="false"
          style={{
            visibility: isFreeze ? 'hidden' : 'visible',
            width: '100%',
            height: '100%',
            display: 'block',
          }}
        />
        <canvas
          ref={canvasRef}
          className="horse-gif-img"
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            pointerEvents: 'none',
            visibility: isFreeze ? 'visible' : 'hidden',
          }}
        />
      </div>

      {/* Shadow below horse */}
      <div
        className="horse-ground-shadow"
        style={{
          animationPlayState: isFreeze ? 'paused' : 'running',
        }}
      />
    </div>
  )
}

