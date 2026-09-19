import React, { useState, useEffect } from 'react'
import {
  Coins,
  ShieldCheck,
  CheckCircle2,
  Lock,
  QrCode,
  Smartphone,
  CreditCard,
  Building2,
  ArrowRight,
  Sparkles,
  X,
  Loader2,
  Copy,
  Check,
} from 'lucide-react'
import { getSafeAudioContext } from '../utils/audioContextHelper.js'

const COIN_PACKS = [
  { coins: 10, price: 10, label: '10 Coins', popular: true, tag: 'BEST STARTER' },
  { coins: 50, price: 50, label: '50 Coins', popular: false, tag: '' },
  { coins: 100, price: 100, label: '100 Coins', popular: false, tag: '+10% BONUS' },
  { coins: 500, price: 500, label: '500 Coins', popular: false, tag: '+25% BONUS' },
]

const UPI_APPS = [
  { id: 'gpay', name: 'Google Pay', icon: '⚡', color: '#4285F4' },
  { id: 'phonepe', name: 'PhonePe', icon: '🟣', color: '#5f259f' },
  { id: 'paytm', name: 'Paytm UPI', icon: '🔵', color: '#00b9f5' },
  { id: 'bhim', name: 'BHIM UPI', icon: '🇮🇳', color: '#00833d' },
]

const POPULAR_BANKS = [
  { id: 'sbi', name: 'State Bank of India', code: 'SBI' },
  { id: 'hdfc', name: 'HDFC Bank', code: 'HDFC' },
  { id: 'icici', name: 'ICICI Bank', code: 'ICICI' },
  { id: 'axis', name: 'Axis Bank', code: 'AXIS' },
  { id: 'kotak', name: 'Kotak Mahindra', code: 'KOTAK' },
  { id: 'pnb', name: 'Punjab National Bank', code: 'PNB' },
]

export default function AddCoinsModal({ isOpen, onClose, onAddCoins }) {
  const [selectedPack, setSelectedPack] = useState(COIN_PACKS[0]) // Default 10 Coins = ₹10
  const [activeTab, setActiveTab] = useState('upi') // 'upi' | 'qr' | 'card' | 'netbanking'
  const [upiId, setUpiId] = useState('')
  const [selectedUpiApp, setSelectedUpiApp] = useState('gpay')
  const [selectedBank, setSelectedBank] = useState('sbi')
  const [cardData, setCardData] = useState({ number: '', expiry: '', cvv: '', name: '' })

  const [paymentState, setPaymentState] = useState('checkout') // 'checkout' | 'processing' | 'success'
  const [processingStep, setProcessingStep] = useState(0)
  const [copied, setCopied] = useState(false)
  const [txnId, setTxnId] = useState('')

  useEffect(() => {
    if (isOpen) {
      setPaymentState('checkout')
      setProcessingStep(0)
      setSelectedPack(COIN_PACKS[0])
      setTxnId(`TXN_${Date.now().toString().slice(-8)}`)
    }
  }, [isOpen])

  if (!isOpen) return null

  const playSuccessSound = () => {
    try {
      const ctx = getSafeAudioContext()
      if (!ctx) return
      const notes = [523.25, 659.25, 783.99, 1046.50]
      notes.forEach((freq, idx) => {
        const osc = ctx.createOscillator()
        const gain = ctx.createGain()
        osc.type = 'triangle'
        osc.frequency.setValueAtTime(freq, ctx.currentTime + idx * 0.08)
        gain.gain.setValueAtTime(0.35, ctx.currentTime + idx * 0.08)
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + idx * 0.08 + 0.3)
        osc.connect(gain)
        gain.connect(ctx.destination)
        osc.start(ctx.currentTime + idx * 0.08)
        osc.stop(ctx.currentTime + idx * 0.08 + 0.3)
      })
    } catch (_) { }
  }

  const handlePayNow = () => {
    setPaymentState('processing')
    setProcessingStep(1)

    setTimeout(() => {
      setProcessingStep(2)
    }, 900)

    setTimeout(() => {
      setProcessingStep(3)
    }, 1800)

    setTimeout(() => {
      setPaymentState('success')
      playSuccessSound()
      onAddCoins(selectedPack.coins) // Credits exact coins
      setTimeout(() => {
        onClose()
      }, 1600)
    }, 2600)
  }

  const handleCopyVpa = () => {
    navigator.clipboard?.writeText('derbyrace.pay@okaxis')
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="modal-backdrop-generic" onClick={paymentState === 'processing' ? undefined : onClose} style={{ zIndex: 99999 }}>
      <div
        className="add-coins-modal"
        onClick={(e) => e.stopPropagation()}
        style={{
          maxWidth: '480px',
          width: '94%',
          background: 'linear-gradient(180deg, #181d29 0%, #0d1117 100%)',
          border: '1.5px solid rgba(245, 158, 11, 0.45)',
          borderRadius: '16px',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.95), 0 0 35px rgba(245, 158, 11, 0.2)',
          padding: '16px 18px',
          color: '#ffffff',
          maxHeight: '92vh',
          overflowY: 'auto',
        }}
      >
        {/* =========================================================================
            HEADER: PAYMENT GATEWAY BRANDING
            ========================================================================= */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width: '36px',
              height: '36px',
              borderRadius: '10px',
              background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#000000',
              fontWeight: '900',
              boxShadow: '0 2px 10px rgba(245, 158, 11, 0.4)',
            }}>
              <Lock size={18} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <h2 style={{ fontSize: '15px', fontWeight: '900', color: '#ffffff', margin: 0, letterSpacing: '0.5px' }}>
                  SECURE PAYMENT GATEWAY
                </h2>
                <span style={{ background: 'rgba(16, 185, 129, 0.2)', color: '#34d399', border: '1px solid rgba(16, 185, 129, 0.4)', fontSize: '9px', fontWeight: '800', padding: '1px 5px', borderRadius: '4px' }}>
                  256-BIT SSL
                </span>
              </div>
              <p style={{ fontSize: '11px', color: '#94a3b8', margin: '2px 0 0' }}>
                Instant Coin Recharge · UPI / QR / Cards / NetBanking
              </p>
            </div>
          </div>
          {paymentState !== 'processing' && (
            <button className="modal-close-btn" onClick={onClose} style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
              <X size={16} />
            </button>
          )}
        </div>

        {/* =========================================================================
            STATE 1: CHECKOUT SCREEN
            ========================================================================= */}
        {paymentState === 'checkout' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginTop: '12px' }}>

            {/* Select Coin Pack */}
            <div>
              <label style={{ fontSize: '11px', color: '#94a3b8', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px', display: 'block', marginBottom: '6px' }}>
                Select Coin Pack
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '6px' }}>
                {COIN_PACKS.map((pkg) => {
                  const isSelected = selectedPack.coins === pkg.coins
                  return (
                    <div
                      key={pkg.coins}
                      onClick={() => setSelectedPack(pkg)}
                      style={{
                        background: isSelected ? 'linear-gradient(180deg, rgba(245, 158, 11, 0.25) 0%, rgba(217, 119, 6, 0.12) 100%)' : 'rgba(255, 255, 255, 0.04)',
                        border: isSelected ? '1.5px solid #f59e0b' : '1px solid rgba(255, 255, 255, 0.08)',
                        borderRadius: '8px',
                        padding: '8px 4px',
                        textAlign: 'center',
                        cursor: 'pointer',
                        transition: 'all 0.15s ease',
                        boxShadow: isSelected ? '0 0 12px rgba(245, 158, 11, 0.25)' : 'none',
                        position: 'relative',
                      }}
                    >
                      {pkg.tag && (
                        <span style={{
                          position: 'absolute',
                          top: '-6px',
                          left: '50%',
                          transform: 'translateX(-50%)',
                          background: '#f59e0b',
                          color: '#000000',
                          fontSize: '7.5px',
                          fontWeight: '900',
                          padding: '1px 4px',
                          borderRadius: '4px',
                          whiteSpace: 'nowrap',
                        }}>
                          {pkg.tag}
                        </span>
                      )}
                      <div style={{ fontSize: '14px', fontWeight: '900', color: isSelected ? '#ffd700' : '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '2px' }}>
                        <Coins size={13} className="text-amber-400" /> +{pkg.coins}
                      </div>
                      <div style={{ fontSize: '11px', fontWeight: '700', color: isSelected ? '#ffffff' : '#94a3b8', marginTop: '2px' }}>
                        ₹{pkg.price}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Order Summary Strip */}
            <div style={{
              background: 'rgba(0, 0, 0, 0.35)',
              border: '1px solid rgba(255, 255, 255, 0.06)',
              borderRadius: '8px',
              padding: '8px 12px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}>
              <div>
                <span style={{ fontSize: '11px', color: '#94a3b8' }}>Amount to Pay:</span>
                <strong style={{ fontSize: '16px', color: '#34d399', display: 'block', fontWeight: '900' }}>
                  ₹{selectedPack.price}.00
                </strong>
              </div>
              <div style={{ textAlign: 'right' }}>
                <span style={{ fontSize: '11px', color: '#94a3b8' }}>Receiving:</span>
                <strong style={{ fontSize: '15px', color: '#ffd700', display: 'block', fontWeight: '900' }}>
                  +{selectedPack.coins} Coins
                </strong>
              </div>
            </div>

            {/* Payment Method Tabs */}
            <div>
              <label style={{ fontSize: '11px', color: '#94a3b8', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px', display: 'block', marginBottom: '6px' }}>
                Payment Method
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '4px', background: 'rgba(0,0,0,0.4)', padding: '3px', borderRadius: '8px' }}>
                {[
                  { id: 'upi', label: 'UPI Apps', icon: Smartphone },
                  { id: 'qr', label: 'QR Scan', icon: QrCode },
                  { id: 'card', label: 'Card', icon: CreditCard },
                  { id: 'netbanking', label: 'NetBank', icon: Building2 },
                ].map((tab) => {
                  const Icon = tab.icon
                  const isActive = activeTab === tab.id
                  return (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => setActiveTab(tab.id)}
                      style={{
                        background: isActive ? '#f59e0b' : 'transparent',
                        color: isActive ? '#000000' : '#94a3b8',
                        border: 'none',
                        borderRadius: '6px',
                        padding: '6px 2px',
                        fontSize: '11px',
                        fontWeight: '800',
                        cursor: 'pointer',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: '3px',
                        transition: 'all 0.15s ease',
                      }}
                    >
                      <Icon size={14} />
                      {tab.label}
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Tab 1: UPI APPS */}
            {activeTab === 'upi' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px' }}>
                  {UPI_APPS.map((app) => (
                    <div
                      key={app.id}
                      onClick={() => setSelectedUpiApp(app.id)}
                      style={{
                        background: selectedUpiApp === app.id ? 'rgba(245, 158, 11, 0.15)' : 'rgba(255, 255, 255, 0.03)',
                        border: selectedUpiApp === app.id ? '1.5px solid #f59e0b' : '1px solid rgba(255, 255, 255, 0.08)',
                        borderRadius: '8px',
                        padding: '8px 10px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        cursor: 'pointer',
                      }}
                    >
                      <span style={{ fontSize: '18px' }}>{app.icon}</span>
                      <span style={{ fontSize: '12px', fontWeight: '800', color: '#ffffff' }}>{app.name}</span>
                    </div>
                  ))}
                </div>

                <div>
                  <label style={{ fontSize: '11px', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>
                    Or Enter Any UPI ID (e.g. mobile@upi)
                  </label>
                  <input
                    type="text"
                    placeholder="yourname@okaxis / mobile@paytm"
                    value={upiId}
                    onChange={(e) => setUpiId(e.target.value)}
                    style={{
                      width: '100%',
                      background: 'rgba(0, 0, 0, 0.4)',
                      border: '1px solid rgba(255, 255, 255, 0.12)',
                      borderRadius: '8px',
                      padding: '8px 12px',
                      color: '#ffffff',
                      fontSize: '13px',
                      outline: 'none',
                      boxSizing: 'border-box',
                    }}
                  />
                </div>
              </div>
            )}

            {/* Tab 2: QR CODE SCAN & PAY */}
            {activeTab === 'qr' && (
              <div style={{
                background: '#ffffff',
                borderRadius: '12px',
                padding: '14px',
                color: '#000000',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '8px',
                textAlign: 'center',
              }}>
                <div style={{ fontSize: '11px', fontWeight: '800', color: '#00833d', letterSpacing: '0.5px' }}>
                  BHIM UPI QR SCAN & PAY
                </div>

                {/* Simulated High-Res SVG QR Code */}
                <div style={{
                  width: '140px',
                  height: '140px',
                  background: '#ffffff',
                  border: '2px solid #000000',
                  padding: '6px',
                  borderRadius: '8px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  position: 'relative',
                }}>
                  <svg viewBox="0 0 100 100" style={{ width: '100%', height: '100%' }}>
                    {/* Top-Left Finder */}
                    <rect x="5" y="5" width="28" height="28" fill="#000" />
                    <rect x="9" y="9" width="20" height="20" fill="#fff" />
                    <rect x="13" y="13" width="12" height="12" fill="#000" />
                    {/* Top-Right Finder */}
                    <rect x="67" y="5" width="28" height="28" fill="#000" />
                    <rect x="71" y="9" width="20" height="20" fill="#fff" />
                    <rect x="75" y="13" width="12" height="12" fill="#000" />
                    {/* Bottom-Left Finder */}
                    <rect x="5" y="67" width="28" height="28" fill="#000" />
                    <rect x="9" y="71" width="20" height="20" fill="#fff" />
                    <rect x="13" y="75" width="12" height="12" fill="#000" />
                    {/* Data Matrix Dots */}
                    <rect x="38" y="10" width="6" height="6" fill="#000" />
                    <rect x="48" y="10" width="6" height="6" fill="#000" />
                    <rect x="58" y="10" width="6" height="6" fill="#000" />
                    <rect x="38" y="20" width="6" height="6" fill="#000" />
                    <rect x="48" y="25" width="6" height="6" fill="#000" />
                    <rect x="10" y="38" width="6" height="6" fill="#000" />
                    <rect x="20" y="48" width="6" height="6" fill="#000" />
                    <rect x="38" y="38" width="24" height="24" fill="#00833d" rx="4" />
                    <rect x="70" y="45" width="6" height="6" fill="#000" />
                    <rect x="80" y="55" width="6" height="6" fill="#000" />
                    <rect x="45" y="70" width="6" height="6" fill="#000" />
                    <rect x="55" y="78" width="6" height="6" fill="#000" />
                    <rect x="70" y="75" width="6" height="6" fill="#000" />
                    <rect x="80" y="80" width="6" height="6" fill="#000" />
                  </svg>
                  <span style={{
                    position: 'absolute',
                    background: '#00833d',
                    color: '#ffffff',
                    fontSize: '8px',
                    fontWeight: '900',
                    padding: '1px 4px',
                    borderRadius: '3px',
                  }}>
                    UPI ₹{selectedPack.price}
                  </span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', color: '#475569' }}>
                  <span>VPA: <b>derbyrace.pay@okaxis</b></span>
                  <button
                    type="button"
                    onClick={handleCopyVpa}
                    style={{ background: '#e2e8f0', border: 'none', padding: '2px 6px', borderRadius: '4px', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '2px', fontSize: '10px' }}
                  >
                    {copied ? <Check size={11} className="text-green-600" /> : <Copy size={11} />}
                    {copied ? 'Copied' : 'Copy'}
                  </button>
                </div>
                <div style={{ fontSize: '10px', color: '#64748b' }}>
                  Scan with Google Pay, PhonePe, Paytm or any UPI App
                </div>
              </div>
            )}

            {/* Tab 3: CARDS */}
            {activeTab === 'card' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <input
                  type="text"
                  placeholder="Card Number (XXXX XXXX XXXX XXXX)"
                  value={cardData.number}
                  onChange={(e) => setCardData({ ...cardData, number: e.target.value })}
                  style={{
                    width: '100%',
                    background: 'rgba(0, 0, 0, 0.4)',
                    border: '1px solid rgba(255, 255, 255, 0.12)',
                    borderRadius: '8px',
                    padding: '8px 12px',
                    color: '#ffffff',
                    fontSize: '13px',
                    outline: 'none',
                    boxSizing: 'border-box',
                  }}
                />
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                  <input
                    type="text"
                    placeholder="MM / YY"
                    value={cardData.expiry}
                    onChange={(e) => setCardData({ ...cardData, expiry: e.target.value })}
                    style={{
                      background: 'rgba(0, 0, 0, 0.4)',
                      border: '1px solid rgba(255, 255, 255, 0.12)',
                      borderRadius: '8px',
                      padding: '8px 12px',
                      color: '#ffffff',
                      fontSize: '13px',
                      outline: 'none',
                      boxSizing: 'border-box',
                    }}
                  />
                  <input
                    type="password"
                    maxLength={4}
                    placeholder="CVV"
                    value={cardData.cvv}
                    onChange={(e) => setCardData({ ...cardData, cvv: e.target.value })}
                    style={{
                      background: 'rgba(0, 0, 0, 0.4)',
                      border: '1px solid rgba(255, 255, 255, 0.12)',
                      borderRadius: '8px',
                      padding: '8px 12px',
                      color: '#ffffff',
                      fontSize: '13px',
                      outline: 'none',
                      boxSizing: 'border-box',
                    }}
                  />
                </div>
                <div style={{ display: 'flex', gap: '6px', fontSize: '10px', color: '#94a3b8', alignItems: 'center' }}>
                  <span>Supported:</span>
                  <span style={{ fontWeight: '700', color: '#cbd5e1' }}>Visa · Mastercard · RuPay · Maestro</span>
                </div>
              </div>
            )}

            {/* Tab 4: NETBANKING */}
            {activeTab === 'netbanking' && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '6px' }}>
                {POPULAR_BANKS.map((b) => (
                  <div
                    key={b.id}
                    onClick={() => setSelectedBank(b.id)}
                    style={{
                      background: selectedBank === b.id ? 'rgba(245, 158, 11, 0.15)' : 'rgba(255, 255, 255, 0.03)',
                      border: selectedBank === b.id ? '1.5px solid #f59e0b' : '1px solid rgba(255, 255, 255, 0.08)',
                      borderRadius: '8px',
                      padding: '8px',
                      cursor: 'pointer',
                      fontSize: '12px',
                      fontWeight: '700',
                      color: '#ffffff',
                    }}
                  >
                    {b.name}
                  </div>
                ))}
              </div>
            )}

            {/* Pay Now Button */}
            <div style={{ marginTop: '4px' }}>
              <button
                type="button"
                className="claim-coins-btn"
                onClick={handlePayNow}
                style={{
                  width: '100%',
                  background: 'linear-gradient(180deg, #10b981 0%, #047857 100%)',
                  border: '1.5px solid #34d399',
                  borderRadius: '10px',
                  color: '#ffffff',
                  fontWeight: '900',
                  fontSize: '15px',
                  padding: '12px 0',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  boxShadow: '0 4px 15px rgba(16, 185, 129, 0.45)',
                }}
              >
                <Lock size={16} />
                <span>PAY ₹{selectedPack.price}.00 (GET +{selectedPack.coins} COINS)</span>
                <ArrowRight size={16} />
              </button>
            </div>

            {/* Security Guarantee Badge */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', fontSize: '11px', color: '#64748b' }}>
              <ShieldCheck size={14} className="text-emerald-500" />
              <span>PCI-DSS Compliant & RBI Approved Sandbox Gateway</span>
            </div>

          </div>
        )}

        {/* =========================================================================
            STATE 2: PAYMENT PROCESSING SIMULATION
            ========================================================================= */}
        {paymentState === 'processing' && (
          <div style={{ textAlign: 'center', padding: '36px 16px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
            <Loader2 size={44} className="animate-spin text-amber-400" />
            <div>
              <h3 style={{ fontSize: '18px', fontWeight: '900', color: '#ffffff', margin: 0 }}>
                {processingStep === 1 && 'Connecting to Bank / UPI Server...'}
                {processingStep === 2 && 'Awaiting Authorization & Encrypting...'}
                {processingStep === 3 && 'Verifying Transaction Settlement...'}
              </h3>
              <p style={{ fontSize: '12px', color: '#94a3b8', margin: '6px 0 0' }}>
                Please do not press back or refresh the page.
              </p>
            </div>

            <div style={{
              background: 'rgba(0, 0, 0, 0.4)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: '8px',
              padding: '8px 16px',
              fontSize: '12px',
              color: '#cbd5e1',
            }}>
              Order ID: <b style={{ color: '#ffd700' }}>#{txnId}</b> · Amount: <b style={{ color: '#34d399' }}>₹{selectedPack.price}.00</b>
            </div>
          </div>
        )}

        {/* =========================================================================
            STATE 3: PAYMENT SUCCESS & ACCREDITED COINS
            ========================================================================= */}
        {paymentState === 'success' && (
          <div style={{ textAlign: 'center', padding: '24px 16px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '14px' }}>
            <div style={{
              width: '64px',
              height: '64px',
              borderRadius: '50%',
              background: 'rgba(16, 185, 129, 0.2)',
              border: '2px solid #10b981',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#34d399',
              boxShadow: '0 0 30px rgba(16, 185, 129, 0.6)',
            }}>
              <CheckCircle2 size={40} />
            </div>

            <div>
              <span style={{ color: '#34d399', fontSize: '12px', fontWeight: '800', letterSpacing: '1px' }}>
                PAYMENT SUCCESSFUL!
              </span>
              <h2 style={{ fontSize: '26px', fontWeight: '900', color: '#ffd700', margin: '4px 0' }}>
                +{selectedPack.coins} COINS ADDED
              </h2>
              <p style={{ fontSize: '12px', color: '#cbd5e1', margin: 0 }}>
                Transaction ID: #{txnId} · Amount Paid: ₹{selectedPack.price}.00
              </p>
            </div>

            <div style={{
              background: '#10b981',
              color: '#032b13',
              fontWeight: '900',
              fontSize: '14px',
              padding: '10px 20px',
              borderRadius: '8px',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
            }}>
              <Sparkles size={16} /> Credited into Wallet Successfully!
            </div>
          </div>
        )}

      </div>
    </div>
  )
}
