import React from 'react'

export default function ObstacleField({ running = false }) {
    return (
        <div className={`obstacle-field ${running ? 'obstacle-field--running' : ''}`} aria-hidden="true">
            {/* Seamless Repeating Panorama Banner of top123.png */}
            <div className="top123-panorama-track">
                <div className="top123-panorama-panel">
                    <img src="/top/top123.png" alt="Scenery" className="top123-img" draggable="false" />
                </div>
                <div className="top123-panorama-panel" aria-hidden="true">
                    <img src="/top/top123.png" alt="Scenery" className="top123-img" draggable="false" />
                </div>
                <div className="top123-panorama-panel" aria-hidden="true">
                    <img src="/top/top123.png" alt="Scenery" className="top123-img" draggable="false" />
                </div>
            </div>
        </div>
    )
}