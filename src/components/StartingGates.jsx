import React from 'react'

/**
 * Clean Vertically Aligned 8 Starting Gate Stalls:
 * - All 8 stalls are aligned straight (ek barabar) along the vertical start line.
 * - Each stall has its green partition walls, open swing gate doors, and number badge (1 to 8).
 * - All horses start at the exact same starting line.
 */
function StartingGates() {
  return (
    <div className="starting-gates-layer" aria-hidden="true">
      <img src="/sprites/image.png" alt="Starting gates" className="starting-gates-image" />
    </div>
  )
}

export default React.memo(StartingGates)
