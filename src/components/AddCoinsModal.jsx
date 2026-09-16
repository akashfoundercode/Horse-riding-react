import React, { useState } from 'react'
import {
  Coins,
  CircleDollarSign,
  Gem,
  Crown,
  Zap,
  Sparkles,
  X,
} from 'lucide-react'

const COIN_PACKAGES = [
  { coins: 100, label: 'Starter Pack', bonus: '0%', popular: false, icon: Coins },
  { coins: 500, label: 'Pro Gambler', bonus: '+10%', popular: true, icon: CircleDollarSign },
  { coins: 1000, label: 'High Roller', bonus: '+25%', popular: false, icon: Gem },
  { coins: 2500, label: 'VIP Champion', bonus: '+50%', popular: false, icon: Crown },
]

export default function AddCoinsModal({ isOpen, onClose, onAddCoins }) {
  const [selectedPack, setSelectedPack] = useState(500)
  const [isSuccess, setIsSuccess] = useState(false)

  if (!isOpen) return null

  const handleClaim = () => {
    onAddCoins(selectedPack)
    setIsSuccess(true)
    setTimeout(() => {
      setIsSuccess(false)
      onClose()
    }, 900)
  }
//test
  return (
    <div className="modal-backdrop-generic" onClick={onClose}>
      <div className="add-coins-modal" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="add-coins-header">
          <div className="add-coins-title-wrap">
            <span className="add-coins-icon" style={{ display: 'inline-flex', alignItems: 'center' }}>
              <Coins size={22} className="text-emerald-400" />
            </span>
            <div>
              <h2 className="add-coins-title">COIN WALLET RECHARGE</h2>
              <p className="add-coins-subtitle">Claim free chips & coins instantly to bet on races!</p>
            </div>
          </div>
          <button className="modal-close-btn" onClick={onClose} style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
            <X size={16} />
          </button>
        </div>

        {/* Packages Grid */}
        <div className="coin-packages-grid">
          {COIN_PACKAGES.map((pkg) => {
            const isSelected = selectedPack === pkg.coins
            const PkgIcon = pkg.icon
            return (
              <div
                key={pkg.coins}
                className={`coin-pkg-card ${isSelected ? 'coin-pkg-card--selected' : ''} ${pkg.popular ? 'coin-pkg-card--popular' : ''}`}
                onClick={() => setSelectedPack(pkg.coins)}
              >
                {pkg.popular && <span className="pkg-badge-popular">BEST VALUE</span>}
                <span className="pkg-icon" style={{ display: 'inline-flex', justifyContent: 'center', alignItems: 'center' }}>
                  <PkgIcon size={24} className={pkg.popular ? 'text-amber-400' : 'text-emerald-400'} />
                </span>
                <span className="pkg-amount">+{pkg.coins}</span>
                <span className="pkg-label">{pkg.label}</span>
                <span className="pkg-bonus">Bonus: {pkg.bonus}</span>
              </div>
            )
          })}
        </div>

        {/* Action Button */}
        <div className="add-coins-footer">
          {isSuccess ? (
            <div className="add-coins-success" style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
              <Sparkles size={18} className="text-amber-400" /> +{selectedPack} Coins Added Successfully!
            </div>
          ) : (
            <button className="claim-coins-btn" onClick={handleClaim} style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
              <Zap size={16} className="fill-current text-amber-400" />
              <span>CLAIM +{selectedPack} FREE COINS</span>
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

