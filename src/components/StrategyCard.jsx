import React from 'react';
import './StrategyCard.css';

/**
 * Reusable Strategy Card Component for Algorithmic Trading Strategies
 * Supports both 'grid' and 'list' layout modes.
 */
export default function StrategyCard({ strategy, onTrade, onNiftyThetaTrade, onKnowMore, onPlay, onToggleBookmark, viewMode = 'grid' }) {
  const isBookmarked = strategy.isFavourite;
  const isNiftyTheta = strategy.id === 'nifty-theta' || strategy.title === 'Nifty Theta';

  const handleBookmark = (e) => {
    e.stopPropagation();
    if (onToggleBookmark) {
      onToggleBookmark(strategy.id);
    }
  };

  const handleTradeClick = (e) => {
    e.stopPropagation();
    if (onTrade) {
      onTrade(strategy);
    }
  };

  const handleThetaTradeClick = (e) => {
    e.stopPropagation();
    if (onNiftyThetaTrade) {
      onNiftyThetaTrade(strategy);
    } else if (onTrade) {
      onTrade(strategy);
    }
  };

  const handleKnowMoreClick = (e) => {
    e.stopPropagation();
    if (onKnowMore) {
      onKnowMore(strategy);
    }
  };

  const handlePlayClick = (e) => {
    e.stopPropagation();
    if (onPlay) {
      onPlay(strategy);
    }
  };

  if (viewMode === 'list') {
    return (
      <div className="strategy-card strategy-card--list">
        <div className="strategy-card__list-header">
          <div className="strategy-card__list-header-left">
            <div className="strategy-card__avatar">
              {strategy.icon || strategy.title.charAt(0)}
            </div>
            <h3 className="strategy-card__title">{strategy.title}</h3>
            
            <div className="strategy-card__tags strategy-card__tags--inline">
              {strategy.tags && strategy.tags.map((tag, index) => (
                <span 
                  key={index} 
                  className={`strategy-tag ${index === 0 ? 'strategy-tag--orange' : 'strategy-tag--default'}`}
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>

          <div className="strategy-card__actions">
            <button 
              className="strategy-card__icon-btn" 
              onClick={handlePlayClick}
              title="Play Strategy"
              aria-label="Play Strategy"
            >
              <svg width="12" height="16" viewBox="0 0 14 18" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M0.75 15.2108V2.28867C0.75 0.947598 2.66217 0.250658 3.83794 1.16319L12.1628 7.62428C12.9457 8.23192 12.9457 9.26759 12.1628 9.87523L3.83793 16.3363C2.66217 17.2489 0.75 16.5519 0.75 15.2108Z" stroke="#E3530F" strokeWidth="1.5"/>
              </svg>
            </button>

            <button 
              className={`strategy-card__icon-btn ${isBookmarked ? 'is-active' : ''}`}
              onClick={handleBookmark}
              title={isBookmarked ? 'Remove Bookmark' : 'Bookmark Strategy'}
              aria-label="Bookmark Strategy"
            >
              {isBookmarked ? (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="#E3530F" xmlns="http://www.w3.org/2000/svg">
                  <path d="M15.9725 3.74731H8.01946C6.26221 3.74731 4.83496 5.18281 4.83496 6.93181V18.5561C4.83496 20.0411 5.89921 20.6681 7.20271 19.9503L11.2287 17.7146C11.6577 17.4753 12.3507 17.4753 12.7715 17.7146L16.7975 19.9503C18.101 20.6763 19.1652 20.0493 19.1652 18.5561V6.93181C19.157 5.18281 17.7297 3.74731 15.9725 3.74731Z" stroke="#E3530F" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              ) : (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M15.9725 3.74731H8.01946C6.26221 3.74731 4.83496 5.18281 4.83496 6.93181V18.5561C4.83496 20.0411 5.89921 20.6681 7.20271 19.9503L11.2287 17.7146C11.6577 17.4753 12.3507 17.4753 12.7715 17.7146L16.7975 19.9503C18.101 20.6763 19.1652 20.0493 19.1652 18.5561V6.93181C19.157 5.18281 17.7297 3.74731 15.9725 3.74731Z" stroke="#E3530F" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              )}
            </button>
          </div>
        </div>

        <div className="strategy-card__list-body">
          <p className="strategy-card__description strategy-card__description--list">
            {strategy.description}{' '}
            <button className="strategy-card__know-more" onClick={handleKnowMoreClick}>
              Know more
            </button>
          </p>

          <div className="strategy-card__list-footer">
            <div className="strategy-card__amount-container strategy-card__amount-container--list">
              <span className="strategy-card__amount-label">Min. Amount</span>
              <span className="strategy-card__amount-value">{strategy.minAmount}</span>
            </div>

            {isNiftyTheta ? (
              <div id="nifty-theta-trade-container-list" className="nifty-theta-trade-container">
                <button
                  id="btn-trade-nifty-theta-list"
                  className="strategy-card__trade-btn nifty-theta-trade-btn"
                  onClick={handleThetaTradeClick}
                  data-strategy-id={strategy.id}
                  title="Trade Nifty Theta"
                >
                  Trade
                </button>
              </div>
            ) : (
              <div id={`trade-container-list-${strategy.id}`} className="strategy-card__trade-container">
                <button
                  id={`btn-trade-list-${strategy.id}`}
                  className="strategy-card__trade-btn"
                  onClick={handleTradeClick}
                  data-strategy-id={strategy.id}
                >
                  Trade
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Grid view (Default)
  return (
    <div className="strategy-card strategy-card--grid">
      <div>
        {/* Top Header */}
        <div className="strategy-card__header">
          <div className="strategy-card__title-container">
            <div className="strategy-card__avatar">
              {strategy.icon || strategy.title.charAt(0)}
            </div>
            <h3 className="strategy-card__title">{strategy.title}</h3>
          </div>

          <div className="strategy-card__actions">
            <button 
              className="strategy-card__icon-btn" 
              onClick={handlePlayClick}
              title="Play Strategy"
              aria-label="Play Strategy"
            >
              <svg width="12" height="16" viewBox="0 0 14 18" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M0.75 15.2108V2.28867C0.75 0.947598 2.66217 0.250658 3.83794 1.16319L12.1628 7.62428C12.9457 8.23192 12.9457 9.26759 12.1628 9.87523L3.83793 16.3363C2.66217 17.2489 0.75 16.5519 0.75 15.2108Z" stroke="#E3530F" strokeWidth="1.5"/>
              </svg>
            </button>

            <button 
              className={`strategy-card__icon-btn ${isBookmarked ? 'is-active' : ''}`}
              onClick={handleBookmark}
              title={isBookmarked ? 'Remove Bookmark' : 'Bookmark Strategy'}
              aria-label="Bookmark Strategy"
            >
              {isBookmarked ? (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="#E3530F" xmlns="http://www.w3.org/2000/svg">
                  <path d="M15.9725 3.74731H8.01946C6.26221 3.74731 4.83496 5.18281 4.83496 6.93181V18.5561C4.83496 20.0411 5.89921 20.6681 7.20271 19.9503L11.2287 17.7146C11.6577 17.4753 12.3507 17.4753 12.7715 17.7146L16.7975 19.9503C18.101 20.6763 19.1652 20.0493 19.1652 18.5561V6.93181C19.157 5.18281 17.7297 3.74731 15.9725 3.74731Z" stroke="#E3530F" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              ) : (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M15.9725 3.74731H8.01946C6.26221 3.74731 4.83496 5.18281 4.83496 6.93181V18.5561C4.83496 20.0411 5.89921 20.6681 7.20271 19.9503L11.2287 17.7146C11.6577 17.4753 12.3507 17.4753 12.7715 17.7146L16.7975 19.9503C18.101 20.6763 19.1652 20.0493 19.1652 18.5561V6.93181C19.157 5.18281 17.7297 3.74731 15.9725 3.74731Z" stroke="#E3530F" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              )}
            </button>
          </div>
        </div>

        {/* Tags */}
        <div className="strategy-card__tags">
          {strategy.tags && strategy.tags.map((tag, index) => (
            <span 
              key={index} 
              className={`strategy-tag ${index === 0 ? 'strategy-tag--orange' : 'strategy-tag--default'}`}
            >
              {tag}
            </span>
          ))}
        </div>

        {/* Description */}
        <p className="strategy-card__description">
          {strategy.description}{' '}
          <button className="strategy-card__know-more" onClick={handleKnowMoreClick}>
            Know more
          </button>
        </p>
      </div>

      {/* Bottom Footer */}
      <div className="strategy-card__footer">
        <div className="strategy-card__amount-container">
          <span className="strategy-card__amount-label">Min. Amount</span>
          <span className="strategy-card__amount-value">{strategy.minAmount}</span>
        </div>

        {isNiftyTheta ? (
          <div id="nifty-theta-trade-container" className="nifty-theta-trade-container">
            <button
              id="btn-trade-nifty-theta"
              className="strategy-card__trade-btn nifty-theta-trade-btn"
              onClick={handleThetaTradeClick}
              data-strategy-id={strategy.id}
              title="Trade Nifty Theta"
            >
              Trade
            </button>
          </div>
        ) : (
          <div id={`trade-container-${strategy.id}`} className="strategy-card__trade-container">
            <button
              id={`btn-trade-${strategy.id}`}
              className="strategy-card__trade-btn"
              onClick={handleTradeClick}
              data-strategy-id={strategy.id}
            >
              Trade
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

