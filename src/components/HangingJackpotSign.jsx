import React from 'react'

function HangingJackpotSign({
  jackpotDisplay = 'N',
  jackpotMultiplier = 1,
  isJackpotSpinning = false,
  className = '',
}) {
  const isBoost = jackpotMultiplier > 1
  const displayVal = jackpotDisplay || (isBoost ? `${jackpotMultiplier}X` : 'N')

  return (
    <div
      className={`race-hanging-jackpot ${isJackpotSpinning ? 'race-hanging-jackpot--spinning' : ''} ${isBoost ? 'race-hanging-jackpot--boost' : ''} ${className}`}
      title="Dynamic Race Jackpot Multiplier (N, 2X, 3X, 4X)"
    >
      {/* Authentic Golden Hanging Sign Asset uploaded by User */}
      <img
        src="/sprites/jackpot (2).png"
        alt="Jackpot Sign"
        className="hanging-jackpot-img"
        draggable="false"
      />

      {/* Screen / Cutout Box for high-speed dynamic Multiplier */}
      <div className="hanging-jackpot-screen">
        <div
          className={`hanging-jackpot-number ${isJackpotSpinning ? 'hanging-jackpot-number--spin' : ''
            } ${isBoost && !isJackpotSpinning ? 'hanging-jackpot-number--gold' : ''}`}
        >
          {displayVal}
        </div>
        {isBoost && !isJackpotSpinning && (
          <div className="hanging-jackpot-win-glow" />
        )}
      </div>
    </div>
  )
}

export default React.memo(HangingJackpotSign)

