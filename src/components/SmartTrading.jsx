import React, { useState, useEffect, useMemo } from 'react';
import './SmartTrading.css';
import infoIcon from '../../assets/Web/margin/Info.svg';
import deleteIcon from '../../assets/Web/bin delete.svg';
import arrowIcon from '../../assets/Web/arrow.svg';
import statusIcon from '../../assets/Web/status.svg';
import chartSvg from '../../assets/Web/trade/chart.svg';
import closeIcon from '../../assets/Web/close.svg';
import { loadMastersScrips, searchMastersSymbols } from '../services/mastersService';

const SAMPLE_SYMBOLS = [
  { id: 1, name: 'NIFTY 13 JAN 24000 CALL', type: 'Options', ltp: 1135.9 },
  { id: 2, name: 'NIFTY 13 JAN 24500 CALL', type: 'Options', ltp: 1370 },
  { id: 3, name: 'NIFTY 13 JAN 24600 CALL', type: 'Options', ltp: 969.5 },
  { id: 4, name: 'NIFTY 13 JAN 24650 CALL', type: 'Options', ltp: 850.0 },
  { id: 5, name: 'NIFTY 13 JAN 24700 CALL', type: 'Options', ltp: 720.5 },
  { id: 6, name: 'NIFTY 13 JAN 24750 CALL', type: 'Options', ltp: 610.0 },
  { id: 7, name: 'NIFTY 13 JAN 24800 CALL', type: 'Options', ltp: 515.0 },
  { id: 8, name: 'NIFTY 13 JAN 24900 CALL', type: 'Options', ltp: 410.0 },
  { id: 9, name: 'NIFTY 13 JAN 24950 CALL', type: 'Options', ltp: 320.0 },
  { id: 10, name: 'NIFTY 13 JAN 25000 CALL', type: 'Options', ltp: 245.0 },
];

const DEFAULT_IMAGE_BASKET_ITEMS = [
  { id: 'leg-1', name: 'NIFTY 23 JAN 22300 CALL', ltp: 1135.9, price: 1370, lot: 1, lotSize: 75, action: 'BUY' },
  { id: 'leg-2', name: 'NIFTY 23 JAN 22000 CALL', ltp: 1370, price: 1370, lot: 1, lotSize: 75, action: 'BUY' },
  { id: 'leg-3', name: 'NIFTY 23 JAN 22000 CALL', ltp: 969.5, price: 969.5, lot: 1, lotSize: 75, action: 'SELL' },
];

export default function SmartTrading({ strategy, onBack, onStartSuccess }) {
  const [isAnnouncementPaused, setIsAnnouncementPaused] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isBookmarked, setIsBookmarked] = useState(strategy?.isFavourite || false);

  // Theta specific state
  const isTheta = Boolean(strategy?.id?.toLowerCase().includes('theta') || strategy?.title?.toLowerCase().includes('theta'));
  const [thetaLots, setThetaLots] = useState(1);
  const [takeProfit, setTakeProfit] = useState('');
  const [stoploss, setStoploss] = useState('');

  // Run name state
  const [runName, setRunName] = useState(() => strategy?.runName || '');
  const [isEditingRunName, setIsEditingRunName] = useState(false);

  // Modal State & Multi-selection
  const [isSymbolModalOpen, setIsSymbolModalOpen] = useState(false);
  const [isOrderConfirmModalOpen, setIsOrderConfirmModalOpen] = useState(false);
  const [isThetaOrderConfirmModalOpen, setIsThetaOrderConfirmModalOpen] = useState(false);
  const [isKnowMoreModalOpen, setIsKnowMoreModalOpen] = useState(false);
  const [isViewReportModalOpen, setIsViewReportModalOpen] = useState(false);
  const [selectedReportPeriod, setSelectedReportPeriod] = useState(null);
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');
  const [modalSearchQuery, setModalSearchQuery] = useState('');
  const [selectedSymbolIds, setSelectedSymbolIds] = useState([]);

  // Masters.mf database state (OFISType = 2)
  const [mastersSymbols, setMastersSymbols] = useState([]);
  const [isMastersLoading, setIsMastersLoading] = useState(false);
  const [mastersStatusText, setMastersStatusText] = useState('');

  useEffect(() => {
    let isMounted = true;
    setIsMastersLoading(true);

    loadMastersScrips((statusInfo) => {
      if (!isMounted) return;
      if (statusInfo.status === 'checking_date') setMastersStatusText('Checking master date...');
      if (statusInfo.status === 'downloading') setMastersStatusText('Downloading Masters.mf...');
      if (statusInfo.status === 'parsing') setMastersStatusText('Extracting options contracts (OFISType 2 & 4)...');
      if (statusInfo.status === 'ready') setMastersStatusText(`Loaded ${statusInfo.count} contracts`);
    })
      .then((symbols) => {
        if (isMounted) {
          if (symbols && symbols.length > 0) {
            setMastersSymbols(symbols);
          }
          setIsMastersLoading(false);
        }
      })
      .catch((err) => {
        console.error('[SmartTrading] Masters load error:', err);
        if (isMounted) setIsMastersLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  // Basket Items State (populated with cloned items ONLY on Replicate/Restart; empty for regular Trade)
  const [basketItems, setBasketItems] = useState(() => {
    if (strategy?.isCloned && strategy?.items && strategy.items.length > 0) {
      return strategy.items.map((it, idx) => ({
        id: it.id ? `clone-${it.id}-${Date.now()}` : `item-${Date.now()}-${idx}`,
        name: it.name,
        ltp: it.ltp !== undefined ? it.ltp : 1135.9,
        price: it.price !== undefined ? it.price : (it.ltp || 1370),
        lot: it.lot !== undefined ? it.lot : 1,
        lotSize: it.lotSize !== undefined ? it.lotSize : 75,
        action: (it.action || 'BUY').toUpperCase()
      }));
    }
    return [];
  });
  const [showToast, setShowToast] = useState(false);

  // Thresholds State
  const [maxLossEnabled, setMaxLossEnabled] = useState(() => {
    return strategy?.thresholds?.maxLoss !== undefined ? strategy.thresholds.maxLoss !== null : true;
  });
  const [maxLossValue, setMaxLossValue] = useState(() => {
    return strategy?.thresholds?.maxLoss ?? 500;
  });

  const [maxProfitEnabled, setMaxProfitEnabled] = useState(() => {
    return strategy?.thresholds?.maxProfit !== undefined ? strategy.thresholds.maxProfit !== null : true;
  });
  const [maxProfitValue, setMaxProfitValue] = useState(() => {
    return strategy?.thresholds?.maxProfit ?? 1000;
  });

  const [whenProfitEnabled, setWhenProfitEnabled] = useState(() => {
    return !!strategy?.thresholds?.whenProfit;
  });
  const [whenProfitValue, setWhenProfitValue] = useState(() => {
    return strategy?.thresholds?.whenProfit ?? 50;
  });

  const [lockProfitEnabled, setLockProfitEnabled] = useState(() => {
    return !!strategy?.thresholds?.lockProfit;
  });
  const [lockProfitValue, setLockProfitValue] = useState(() => {
    return strategy?.thresholds?.lockProfit ?? 50;
  });

  // Sync state if strategy prop changes
  useEffect(() => {
    if (strategy?.isCloned && strategy?.items && strategy.items.length > 0) {
      setBasketItems(
        strategy.items.map((it, idx) => ({
          id: it.id ? `clone-${it.id}-${Date.now()}` : `item-${Date.now()}-${idx}`,
          name: it.name,
          ltp: it.ltp !== undefined ? it.ltp : 1135.9,
          price: it.price !== undefined ? it.price : (it.ltp || 1370),
          lot: it.lot !== undefined ? it.lot : 1,
          lotSize: it.lotSize !== undefined ? it.lotSize : 75,
          action: (it.action || 'BUY').toUpperCase()
        }))
      );
    } else {
      setBasketItems([]);
    }
    if (strategy?.thresholds) {
      if (strategy.thresholds.maxLoss !== undefined) {
        setMaxLossEnabled(strategy.thresholds.maxLoss !== null);
        if (strategy.thresholds.maxLoss) setMaxLossValue(strategy.thresholds.maxLoss);
      }
      if (strategy.thresholds.maxProfit !== undefined) {
        setMaxProfitEnabled(strategy.thresholds.maxProfit !== null);
        if (strategy.thresholds.maxProfit) setMaxProfitValue(strategy.thresholds.maxProfit);
      }
      if (strategy.thresholds.whenProfit !== undefined) {
        setWhenProfitEnabled(!!strategy.thresholds.whenProfit);
        if (strategy.thresholds.whenProfit) setWhenProfitValue(strategy.thresholds.whenProfit);
      }
      if (strategy.thresholds.lockProfit !== undefined) {
        setLockProfitEnabled(!!strategy.thresholds.lockProfit);
        if (strategy.thresholds.lockProfit) setLockProfitValue(strategy.thresholds.lockProfit);
      }
    }
    setRunName(strategy?.runName || '');
  }, [strategy]);

  const openSymbolModal = (initialQuery = '') => {
    setModalSearchQuery(initialQuery !== undefined ? initialQuery : (searchQuery || ''));
    setSelectedSymbolIds([]);
    setIsSymbolModalOpen(true);
  };

  const closeSymbolModal = () => {
    setIsSymbolModalOpen(false);
  };

  const toggleSelectSymbolInModal = (id) => {
    setSelectedSymbolIds(prev =>
      prev.includes(id) ? prev.filter(itemId => itemId !== id) : [...prev, id]
    );
  };

  const handleDoneSymbolModal = () => {
    const pool = mastersSymbols.length > 0 ? mastersSymbols : SAMPLE_SYMBOLS;
    const newlySelected = pool.filter(s => selectedSymbolIds.includes(s.id));
    const newItems = newlySelected.map(s => ({
      id: `${s.id}-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      name: s.name,
      symbol: s.symbol || s.name,
      ltp: typeof s.ltp === 'number' ? s.ltp : (s.strike ? Number((s.strike * 0.02 + 15).toFixed(2)) : 1135.9),
      price: typeof s.ltp === 'number' ? s.ltp : (s.strike ? Number((s.strike * 0.02 + 15).toFixed(2)) : 1370),
      lot: 1,
      lotSize: s.lotSize || 75,
      action: s.cpType === 'PUT' ? 'SELL' : 'BUY'
    }));

    if (newItems.length > 0) {
      setBasketItems(prev => [...prev, ...newItems]);
    }
    setIsSymbolModalOpen(false);
  };

  const handleDeleteItem = (id) => {
    setBasketItems(prev => prev.filter(item => item.id !== id));
  };

  const handleToggleAction = (id, newAction) => {
    setBasketItems(prev => prev.map(item => item.id === id ? { ...item, action: newAction } : item));
  };

  const handlePriceChange = (id, delta) => {
    setBasketItems(prev => prev.map(item => {
      if (item.id === id) {
        const newPrice = Math.max(0, parseFloat((item.price + delta).toFixed(1)));
        return { ...item, price: newPrice };
      }
      return item;
    }));
  };

  const handleLotChange = (id, delta) => {
    setBasketItems(prev => prev.map(item => {
      if (item.id === id) {
        const newLot = Math.max(1, item.lot + delta);
        return { ...item, lot: newLot };
      }
      return item;
    }));
  };

  const handleStartStrategy = () => {
    setIsOrderConfirmModalOpen(false);

    const now = new Date();
    const dateStr = now.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
    const hours = now.getHours();
    const minutes = now.getMinutes().toString().padStart(2, '0');
    const ampm = hours >= 12 ? 'PM' : 'AM';
    const formattedHours = (hours % 12 || 12).toString().padStart(2, '0');
    const timeStr = `${formattedHours}:${minutes}${ampm}`;

    const createdDateFormatted = `${now.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })} ${timeStr}`;

    if (isTheta) {
      const thetaItems = [
        {
          id: 'theta-leg-1',
          name: 'NIFTY 23 JAN 22000 CE',
          action: 'SELL',
          ltp: 446.50,
          price: 446.50,
          lot: thetaLots,
          lotSize: 50,
          createdDate: createdDateFormatted,
          status: 'Executed',
          refNo: '12345678'
        },
        {
          id: 'theta-leg-2',
          name: 'NIFTY 23 JAN 22000 PE',
          action: 'SELL',
          ltp: 410.20,
          price: 410.20,
          lot: thetaLots,
          lotSize: 50,
          createdDate: createdDateFormatted,
          status: 'Executed',
          refNo: '12345679'
        }
      ];

      const newRunningStrategy = {
        id: 'run-' + Date.now(),
        title: runName || strategy?.title || 'Nifty Theta',
        startTime: `${dateStr} - ${timeStr}`,
        endTime: `${dateStr} - 03:30PM`,
        tags: ['RESEARCH BACKED', 'INTRADAY'],
        totalPnl: '₹1,000',
        bookedPnl: '₹1,000',
        items: thetaItems,
        itemCount: thetaItems.length,
        lots: thetaLots,
        takeProfit: takeProfit,
        stoploss: stoploss,
        thresholds: {
          maxLoss: stoploss ? parseFloat(stoploss) : 500,
          maxProfit: takeProfit ? parseFloat(takeProfit) : 1000,
        }
      };

      if (onStartSuccess) {
        onStartSuccess(newRunningStrategy);
      }
      return;
    }

    const itemsToStart = basketItems.length > 0 ? basketItems.map((item, idx) => ({
      ...item,
      createdDate: createdDateFormatted,
      status: 'Executed',
      refNo: (12345678 + idx).toString()
    })) : [
      { id: 'def-1', name: 'NIFTY 23 April 22100 CE', action: 'BUY', ltp: 446.50, price: 446.50, lot: 1, createdDate: createdDateFormatted, status: 'Executed', refNo: '12345678' }
    ];

    const rawTitle = runName || strategy?.runName || strategy?.title || 'Smart Trading';
    const strategyTitle = rawTitle
      .replace(/\s*-\s*MultiLeg/gi, '')
      .replace(/\s*MultiLeg/gi, '')
      .replace(/\s*\(Clone\)/gi, '')
      .replace(/\s*Clone/gi, '')
      .trim() || 'Smart Trading';

    const cleanTags = (strategy?.tags || ['LOCK PROFIT & TRAIL', 'INTRADAY'])
      .filter(t => !/multileg/i.test(t) && !/clone/i.test(t));

    const newRunningStrategy = {
      id: 'run-' + Date.now(),
      title: strategyTitle,
      startTime: `${dateStr} - ${timeStr}`,
      endTime: `${dateStr} - 03:30PM`,
      tags: cleanTags.length > 0 ? cleanTags.slice(0, 2) : ['LOCK PROFIT & TRAIL', 'INTRADAY'],
      items: itemsToStart,
      itemCount: itemsToStart.length,
      thresholds: {
        maxLoss: maxLossEnabled ? maxLossValue : null,
        maxProfit: maxProfitEnabled ? maxProfitValue : null,
        whenProfit: whenProfitEnabled ? whenProfitValue : null,
        lockProfit: lockProfitEnabled ? lockProfitValue : null
      }
    };

    setBasketItems([]);
    setMaxLossEnabled(true);
    setMaxLossValue(500);
    setMaxProfitEnabled(true);
    setMaxProfitValue(1000);
    setWhenProfitEnabled(false);
    setWhenProfitValue(50);
    setLockProfitEnabled(false);
    setLockProfitValue(50);

    if (onStartSuccess) {
      onStartSuccess(newRunningStrategy);
    }
  };

  const filteredSymbols = useMemo(() => {
    const pool = mastersSymbols.length > 0 ? mastersSymbols : SAMPLE_SYMBOLS;
    return searchMastersSymbols(pool, modalSearchQuery, 80);
  }, [mastersSymbols, modalSearchQuery]);

  return (
    <div className="smart-trading-page">
      {/* Main Page Container */}
      <div className={`smart-trading-container ${basketItems.length > 0 || isTheta ? 'has-items' : ''} ${isTheta ? 'is-theta' : ''}`}>
        {/* Toast Notification */}
        {showToast && (
          <div className="smart-toast-notification">
            <img src={statusIcon} alt="status" className="toast-status-icon" />
            <div className="toast-text-content">
              <span>Your order for {isTheta ? 'Nifty Theta' : 'Smart Trade'} has been placed</span>
              <span>successfully. To know more visit your Running</span>
              <span>Strategy</span>
            </div>
          </div>
        )}
        {isTheta ? (
          <div className="theta-content-top">
            {/* Top Header Row */}
            <div className="smart-trading-header theta-header">
              <div className="header-left">
                <button className="back-btn theta-back-btn" id="theta-back-btn" onClick={onBack} title="Back to Strategies" aria-label="Back">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M19 12H5M5 12L12 19M5 12L12 5" stroke="#1E1E1E" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </button>
                <h1 className="header-title theta-title">{strategy?.title || 'Nifty Theta'}</h1>
                {isEditingRunName ? (
                  <input
                    type="text"
                    className="run-name-input theta-run-input"
                    value={runName}
                    onChange={(e) => setRunName(e.target.value)}
                    onBlur={() => setIsEditingRunName(false)}
                    onKeyDown={(e) => e.key === 'Enter' && setIsEditingRunName(false)}
                    autoFocus
                  />
                ) : runName ? (
                  <span
                    className="run-name-display theta-run-name"
                    onClick={() => setIsEditingRunName(true)}
                    title="Click to edit run name"
                  >
                    {runName}
                  </span>
                ) : (
                  <button
                    className="add-run-name-btn theta-add-run-name"
                    id="theta-add-run-name-btn"
                    onClick={() => {
                      setRunName('Nifty Theta Run 1');
                      setIsEditingRunName(true);
                    }}
                  >
                    Add run name
                  </button>
                )}
              </div>

              <div className="header-right">
                <button className="header-icon-btn theta-play-btn" id="theta-play-btn" title="Play Video" aria-label="Play Video">
                  <svg width="15" height="18" viewBox="0 0 15 18" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M1.5 2.2C1.5 1.2 2.6 0.6 3.5 1.1L13.1 7.4C13.9 7.9 13.9 9.1 13.1 9.6L3.5 15.9C2.6 16.4 1.5 15.8 1.5 14.8V2.2Z" stroke="#E3530F" strokeWidth="1.6" strokeLinejoin="round" />
                  </svg>
                </button>
                <button
                  className={`header-icon-btn theta-bookmark-btn ${isBookmarked ? 'is-active' : ''}`}
                  id="theta-bookmark-btn"
                  onClick={() => setIsBookmarked(!isBookmarked)}
                  title={isBookmarked ? "Remove Bookmark" : "Bookmark Strategy"}
                  aria-label="Bookmark Strategy"
                >
                  <svg width="14" height="18" viewBox="0 0 14 18" fill={isBookmarked ? "#E3530F" : "none"} xmlns="http://www.w3.org/2000/svg">
                    <path d="M1 2.5C1 1.67157 1.67157 1 2.5 1H11.5C12.3284 1 13 1.67157 13 2.5V16.5L7 12.8L1 16.5V2.5Z" stroke="#E3530F" strokeWidth="1.6" strokeLinejoin="round" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Tags Row */}
            <div className="smart-trading-tags theta-tags">
              <span className="strategy-tag strategy-tag--orange theta-tag-orange">RESEARCH BACKED</span>
              <span className="strategy-tag strategy-tag--default theta-tag-default">THETH DECAY</span>
              <span className="strategy-tag strategy-tag--default theta-tag-default">FIXED STOPLOSS</span>
            </div>

            {/* Description Subheader */}
            <p className="smart-trading-description theta-description">
              Nifty Theta strategy allows user to trade smartly by defining their Max Profits, Lock-profits and Max Loss. It enables automatic exit when these thresholds are hit. <span className="read-more-link theta-read-more" onClick={() => setIsKnowMoreModalOpen(true)}>Know more</span>
            </p>

            {/* Main Parameters Box */}
            <div className="theta-config-card" id="theta-config-card">
              {/* Lots column */}
              <div className="theta-field-col">
                <label className="theta-field-label">
                  Lots
                  <svg className="theta-info-icon" width="13" height="13" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <circle cx="8" cy="8" r="7" stroke="#767676" strokeWidth="1.2" />
                    <path d="M8 7V11.5M8 4.75V5" stroke="#767676" strokeWidth="1.4" strokeLinecap="round" />
                  </svg>
                </label>
                <div className="basket-stepper-box theta-stepper">
                  <button className="stepper-btn" onClick={() => setThetaLots(prev => Math.max(1, (parseInt(prev) || 1) - 1))}>—</button>
                  <input
                    type="text"
                    className="stepper-input"
                    value={thetaLots}
                    onChange={(e) => {
                      const val = e.target.value.replace(/[^0-9]/g, '');
                      setThetaLots(val === '' ? '' : parseInt(val));
                    }}
                    onBlur={() => {
                      if (!thetaLots || thetaLots < 1) setThetaLots(1);
                    }}
                  />
                  <button className="stepper-btn" onClick={() => setThetaLots(prev => (parseInt(prev) || 0) + 1)}>+</button>
                </div>
              </div>

              {/* Take Profit column */}
              <div className="theta-field-col">
                <label className="theta-field-label">
                  Take Profit
                  <svg className="theta-info-icon" width="13" height="13" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <circle cx="8" cy="8" r="7" stroke="#767676" strokeWidth="1.2" />
                    <path d="M8 7V11.5M8 4.75V5" stroke="#767676" strokeWidth="1.4" strokeLinecap="round" />
                  </svg>
                </label>
                <div className="basket-stepper-box theta-stepper">
                  <button className="stepper-btn" onClick={() => setTakeProfit(prev => (prev === '' || parseInt(prev) <= 0 ? '' : String(Math.max(0, parseInt(prev) - 100))))}>—</button>
                  <input
                    type="text"
                    className="stepper-input"
                    placeholder=""
                    value={takeProfit}
                    onChange={(e) => setTakeProfit(e.target.value.replace(/[^0-9]/g, ''))}
                  />
                  <button className="stepper-btn" onClick={() => setTakeProfit(prev => (prev === '' ? '100' : String((parseInt(prev) || 0) + 100)))}>+</button>
                </div>
              </div>

              {/* Stoploss column */}
              <div className="theta-field-col">
                <label className="theta-field-label">
                  Stoploss
                  <svg className="theta-info-icon" width="13" height="13" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <circle cx="8" cy="8" r="7" stroke="#767676" strokeWidth="1.2" />
                    <path d="M8 7V11.5M8 4.75V5" stroke="#767676" strokeWidth="1.4" strokeLinecap="round" />
                  </svg>
                </label>
                <div className="basket-stepper-box theta-stepper">
                  <button className="stepper-btn" onClick={() => setStoploss(prev => (prev === '' || parseInt(prev) <= 0 ? '' : String(Math.max(0, parseInt(prev) - 50))))}>—</button>
                  <input
                    type="text"
                    className="stepper-input"
                    placeholder=""
                    value={stoploss}
                    onChange={(e) => setStoploss(e.target.value.replace(/[^0-9]/g, ''))}
                  />
                  <button className="stepper-btn" onClick={() => setStoploss(prev => (prev === '' ? '50' : String((parseInt(prev) || 0) + 50)))}>+</button>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <>
            {/* Top Header Row */}
            <div className="smart-trading-header">
              <div className="header-left">
                <button className="back-btn" onClick={onBack} title="Back to Strategies" aria-label="Back">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M19 12H5M5 12L12 19M5 12L12 5" stroke="#353535" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </button>
                <h1 className="header-title">Smart Trade</h1>
                {isEditingRunName ? (
                  <input
                    type="text"
                    className="run-name-input"
                    value={runName}
                    onChange={(e) => setRunName(e.target.value)}
                    onBlur={() => setIsEditingRunName(false)}
                    onKeyDown={(e) => e.key === 'Enter' && setIsEditingRunName(false)}
                    autoFocus
                  />
                ) : runName ? (
                  <span
                    className="run-name-display"
                    onClick={() => setIsEditingRunName(true)}
                    title="Click to edit run name"
                  >
                    {runName}
                  </span>
                ) : (
                  <button
                    className="add-run-name-btn"
                    onClick={() => {
                      setRunName('Smart Trade Run 1');
                      setIsEditingRunName(true);
                    }}
                  >
                    Add run name
                  </button>
                )}
              </div>

              <div className="header-right">
                <button className="header-icon-btn" title="Play Video" aria-label="Play Video">
                  <svg width="14" height="18" viewBox="0 0 14 18" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M0.75 15.2108V2.28867C0.75 0.947598 2.66217 0.250658 3.83794 1.16319L12.1628 7.62428C12.9457 8.23192 12.9457 9.26759 12.1628 9.87523L3.83793 16.3363C2.66217 17.2489 0.75 16.5519 0.75 15.2108Z" stroke="#E3530F" strokeWidth="1.5" />
                  </svg>
                </button>
                <button
                  className={`header-icon-btn ${isBookmarked ? 'is-active' : ''}`}
                  onClick={() => setIsBookmarked(!isBookmarked)}
                  title={isBookmarked ? "Remove Bookmark" : "Bookmark Strategy"}
                  aria-label="Bookmark Strategy"
                >
                  <svg width="14" height="17" viewBox="0 0 14 17" fill={isBookmarked ? "#E3530F" : "none"} xmlns="http://www.w3.org/2000/svg">
                    <path d="M1 2.5C1 1.67157 1.67157 1 2.5 1H11.5C12.3284 1 13 1.67157 13 2.5V16L7 12.5L1 16V2.5Z" stroke="#E3530F" strokeWidth="1.5" strokeLinejoin="round" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Tags Row */}
            <div className="smart-trading-tags">
              <span className="strategy-tag strategy-tag--orange">LOCK PROFIT AND TRAIL</span>
              <span className="strategy-tag strategy-tag--default">INTRADAY</span>
              <span className="strategy-tag strategy-tag--default">MULTILEG</span>
            </div>

            {/* Description Subheader */}
            <p className="smart-trading-description">
              Smart Trading strategy allows user to trade smartly by defining their Max Profits, Lock-profits and Max Loss. It enables automatic exit when these thresholds are hit. <span className="read-more-link" onClick={() => setIsKnowMoreModalOpen(true)}>Know more</span>
            </p>
            <div className={`smart-trading-basket-card ${basketItems.length > 0 ? 'has-items' : ''}`}>
              <div className="basket-card-header">
                <div
                  className="basket-search-wrapper"
                  onClick={() => openSymbolModal(searchQuery)}
                >
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#777" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="basket-search-icon">
                    <circle cx="11" cy="11" r="8"></circle>
                    <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                  </svg>
                  <input
                    type="text"
                    placeholder="Search for contract"
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                      openSymbolModal(e.target.value);
                    }}
                    onFocus={() => openSymbolModal(searchQuery)}
                    className="basket-search-input"
                  />
                </div>
              </div>

              {/* Conditional Rendering: Basket Table or Empty State */}
              {basketItems.length > 0 ? (
                <>
                  {/* Basket Table */}
                  <div className="basket-table-container">
                    <div className="basket-table-header">
                      <span>Contract Name</span>
                      <span style={{ textAlign: 'center' }}>LTP</span>
                      <span style={{ textAlign: 'center' }}>Price</span>
                      <span style={{ textAlign: 'center' }}>Lot</span>
                      <span style={{ textAlign: 'center' }}>Lot Size</span>
                      <span style={{ textAlign: 'center' }}>Action</span>
                      <span></span>
                    </div>

                    {basketItems.map(item => (
                      <div key={item.id} className="basket-table-row">
                        <div className="col-contract">{item.name}</div>
                        <div className="col-ltp">{item.ltp}</div>

                        {/* Price Stepper */}
                        <div className="col-center">
                          <div className="basket-stepper-box price-stepper">
                            <button className="stepper-btn" onClick={() => handlePriceChange(item.id, -5)}>—</button>
                            <input
                              type="text"
                              className="stepper-input"
                              value={item.price}
                              onChange={(e) => {
                                const val = parseFloat(e.target.value) || 0;
                                setBasketItems(prev => prev.map(i => i.id === item.id ? { ...i, price: val } : i));
                              }}
                            />
                            <button className="stepper-btn" onClick={() => handlePriceChange(item.id, 5)}>+</button>
                          </div>
                        </div>

                        {/* Lot Stepper */}
                        <div className="col-center">
                          <div className="basket-stepper-box lot-stepper">
                            <button className="stepper-btn" onClick={() => handleLotChange(item.id, -1)}>—</button>
                            <input
                              type="text"
                              className="stepper-input"
                              value={item.lot}
                              onChange={(e) => {
                                const val = parseInt(e.target.value) || 1;
                                setBasketItems(prev => prev.map(i => i.id === item.id ? { ...i, lot: val } : i));
                              }}
                            />
                            <button className="stepper-btn" onClick={() => handleLotChange(item.id, 1)}>+</button>
                          </div>
                        </div>

                        {/* Lot Size */}
                        <div className="col-text-center">{item.lotSize}</div>

                        {/* Action Toggle */}
                        <div className="col-center">
                          <div className="action-toggle-pill">
                            <button
                              className={`action-btn buy ${item.action === 'BUY' ? 'active' : ''}`}
                              onClick={() => handleToggleAction(item.id, 'BUY')}
                            >
                              Buy
                            </button>
                            <button
                              className={`action-btn sell ${item.action === 'SELL' ? 'active' : ''}`}
                              onClick={() => handleToggleAction(item.id, 'SELL')}
                            >
                              Sell
                            </button>
                          </div>
                        </div>

                        {/* Delete Icon */}
                        <div className="col-delete">
                          <button className="basket-delete-btn" onClick={() => handleDeleteItem(item.id)} title="Delete item">
                            <img src={deleteIcon} alt="Delete" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Threshold Controls Row */}
                  <div className="basket-thresholds-container">
                    <div className="thresholds-left">
                      {/* Max Loss */}
                      <div className="threshold-column">
                        <div className="threshold-header">
                          <input
                            type="checkbox"
                            id="maxLoss"
                            className="threshold-checkbox"
                            checked={maxLossEnabled}
                            onChange={(e) => setMaxLossEnabled(e.target.checked)}
                          />
                          <label htmlFor="maxLoss" className="threshold-label">
                            Max Loss (₹) <img src={infoIcon} alt="info" className="info-icon" />
                          </label>
                        </div>
                        <div className={`basket-stepper-box ${!maxLossEnabled ? 'disabled' : ''}`}>
                          <button className="stepper-btn" disabled={!maxLossEnabled} onClick={() => setMaxLossValue(prev => Math.max(0, prev - 50))}>—</button>
                          <input
                            type="text"
                            className="stepper-input"
                            disabled={!maxLossEnabled}
                            value={maxLossValue}
                            onChange={(e) => setMaxLossValue(parseInt(e.target.value) || 0)}
                          />
                          <button className="stepper-btn" disabled={!maxLossEnabled} onClick={() => setMaxLossValue(prev => prev + 50)}>+</button>
                        </div>
                      </div>

                      {/* Max Profit */}
                      <div className="threshold-column">
                        <div className="threshold-header">
                          <input
                            type="checkbox"
                            id="maxProfit"
                            className="threshold-checkbox"
                            checked={maxProfitEnabled}
                            onChange={(e) => setMaxProfitEnabled(e.target.checked)}
                          />
                          <label htmlFor="maxProfit" className="threshold-label">
                            Max Profit (in ₹) <img src={infoIcon} alt="info" className="info-icon" />
                          </label>
                        </div>
                        <div className={`basket-stepper-box ${!maxProfitEnabled ? 'disabled' : ''}`}>
                          <button className="stepper-btn" disabled={!maxProfitEnabled} onClick={() => setMaxProfitValue(prev => Math.max(0, prev - 100))}>—</button>
                          <input
                            type="text"
                            className="stepper-input"
                            disabled={!maxProfitEnabled}
                            value={maxProfitValue}
                            onChange={(e) => setMaxProfitValue(parseInt(e.target.value) || 0)}
                          />
                          <button className="stepper-btn" disabled={!maxProfitEnabled} onClick={() => setMaxProfitValue(prev => prev + 100)}>+</button>
                        </div>
                      </div>

                      {/* When Profit Reaches */}
                      <div className="threshold-column">
                        <div className="threshold-header">
                          <input
                            type="checkbox"
                            id="whenProfit"
                            className="threshold-checkbox"
                            checked={whenProfitEnabled}
                            onChange={(e) => setWhenProfitEnabled(e.target.checked)}
                          />
                          <label htmlFor="whenProfit" className="threshold-label">
                            When Profit Reaches (₹) <img src={infoIcon} alt="info" className="info-icon" />
                          </label>
                        </div>
                        <div className={`basket-stepper-box ${!whenProfitEnabled ? 'disabled' : ''}`}>
                          <button className="stepper-btn" disabled={!whenProfitEnabled} onClick={() => setWhenProfitValue(prev => Math.max(0, prev - 10))}>—</button>
                          <input
                            type="text"
                            className="stepper-input"
                            disabled={!whenProfitEnabled}
                            value={whenProfitValue}
                            onChange={(e) => setWhenProfitValue(parseInt(e.target.value) || 0)}
                          />
                          <button className="stepper-btn" disabled={!whenProfitEnabled} onClick={() => setWhenProfitValue(prev => prev + 10)}>+</button>
                        </div>
                      </div>

                      {/* Lock Profit at & Trail */}
                      <div className="threshold-column">
                        <div className="threshold-header">
                          <input
                            type="checkbox"
                            id="lockProfit"
                            className="threshold-checkbox"
                            checked={lockProfitEnabled}
                            onChange={(e) => setLockProfitEnabled(e.target.checked)}
                          />
                          <label htmlFor="lockProfit" className="threshold-label">
                            Lock Profit at & Trail (₹) <img src={infoIcon} alt="info" className="info-icon" />
                          </label>
                        </div>
                        <div className={`basket-stepper-box ${!lockProfitEnabled ? 'disabled' : ''}`}>
                          <button className="stepper-btn" disabled={!lockProfitEnabled} onClick={() => setLockProfitValue(prev => Math.max(0, prev - 10))}>—</button>
                          <input
                            type="text"
                            className="stepper-input"
                            disabled={!lockProfitEnabled}
                            value={lockProfitValue}
                            onChange={(e) => setLockProfitValue(parseInt(e.target.value) || 0)}
                          />
                          <button className="stepper-btn" disabled={!lockProfitEnabled} onClick={() => setLockProfitValue(prev => prev + 10)}>+</button>
                        </div>
                      </div>
                    </div>

                    {/* Advanced Link */}
                    <div className="threshold-advanced-col">
                      <span className="advanced-link">
                        Advanced
                        <div className="advanced-arrow-circle">
                          <img src={arrowIcon} alt="arrow" className="advanced-arrow-icon" />
                        </div>
                      </span>
                    </div>
                  </div>
                </>
              ) : (
                <div className="basket-empty-state">
                  {/* <div className="select-contracts-box" onClick={() => openSymbolModal('')}>
                    <div className="select-contracts-label">
                      Select Contracts
                      <img src={infoIcon} alt="info" className="info-icon" style={{ marginLeft: '6px', width: '13px', height: '13px' }} />
                    </div>
                    <div className="select-contracts-input-row">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#777" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="11" cy="11" r="8"></circle>
                        <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                      </svg>
                      <input
                        type="text"
                        placeholder="Start typing here.."
                        readOnly
                        className="select-contracts-input"
                      />
                    </div>
                  </div> */}
                  <p className="empty-basket-title" style={{ marginTop: '12px' }}>No items in basket</p>
                  <button className="btn-add-items" onClick={() => openSymbolModal()}>Add items</button>
                </div>
              )}
            </div>
          </>
        )}

        {/* Footer Action & Margin Bar */}
        <div className="smart-trading-footer-bar" id="smart-trading-footer-bar">
          <div className="footer-note-section">
            <p className="note-title">Note</p>
            <p className="note-main">Please log-in every day and ensure you click the trade button to avoid trade rejections.</p>
            <p className="note-sub">You may visit to order placement page to understand the brokerage and statutory charges to be levied for orders other than Algo orders.</p>
          </div>

          <div className="footer-actions-section">
            <div className="margin-column">
              <span className="margin-label">
                Max. Margin
                <svg className="theta-info-icon" width="13" height="13" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <circle cx="8" cy="8" r="7" stroke="#767676" strokeWidth="1.2" />
                  <path d="M8 7V11.5M8 4.75V5" stroke="#767676" strokeWidth="1.4" strokeLinecap="round" />
                </svg>
              </span>
              <span className="margin-value">₹5,00,000</span>
            </div>
            <div className="margin-column">
              <span className="margin-label">
                Initial Margin
                <svg className="theta-info-icon" width="13" height="13" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <circle cx="8" cy="8" r="7" stroke="#767676" strokeWidth="1.2" />
                  <path d="M8 7V11.5M8 4.75V5" stroke="#767676" strokeWidth="1.4" strokeLinecap="round" />
                </svg>
              </span>
              <span className="margin-value">₹3794.50</span>
            </div>
            <div className="margin-column">
              <span className="margin-label">
                Available Limit
                <svg className="theta-info-icon" width="13" height="13" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <circle cx="8" cy="8" r="7" stroke="#767676" strokeWidth="1.2" />
                  <path d="M8 7V11.5M8 4.75V5" stroke="#767676" strokeWidth="1.4" strokeLinecap="round" />
                </svg>
              </span>
              <span className="margin-value">₹5600.00</span>
            </div>
            <button
              id={isTheta ? 'theta-btn-proceed' : 'btn-proceed'}
              className="btn-proceed"
              onClick={() => {
                if (isTheta) {
                  setIsThetaOrderConfirmModalOpen(true);
                } else {
                  setIsOrderConfirmModalOpen(true);
                }
              }}
            >
              Proceed
            </button>
          </div>
        </div>
      </div>

      {/* Symbol Selection Popup Modal */}
      {isSymbolModalOpen && (
        <div className="symbol-modal-overlay" onClick={closeSymbolModal}>
          <div className="symbol-modal-container" onClick={(e) => e.stopPropagation()}>
            {/* Modal Header */}
            <div className="symbol-modal-header">
              <h2 className="symbol-modal-title">Symbol Selection</h2>
              <button className="symbol-modal-close" onClick={closeSymbolModal} aria-label="Close">
                ✕
              </button>
            </div>

            {/* Modal Body */}
            <div className="symbol-modal-body">
              {/* Search Bar */}
              <div className="symbol-search-box">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="11" cy="11" r="8"></circle>
                  <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                </svg>
                <input
                  type="text"
                  placeholder="Search symbol"
                  value={modalSearchQuery}
                  onChange={(e) => setModalSearchQuery(e.target.value)}
                  autoFocus
                />
              </div>

              {/* Category Pill Tag */}
              <div className="symbol-category-bar">
                <button type="button" className="symbol-category-pill active">
                  Options
                </button>
                {isMastersLoading && (
                  <span className="masters-status-badge">
                    <span className="spinner-dot"></span> {mastersStatusText || 'Loading Masters.mf (Options)...'}
                  </span>
                )}
                {!isMastersLoading && mastersSymbols.length > 0 && (
                  <span className="masters-count-badge">
                    {mastersSymbols.length.toLocaleString('en-IN')} scrips loaded
                  </span>
                )}
              </div>

              {/* Symbol List */}
              <div className="symbol-list-container">
                {filteredSymbols.length > 0 ? (
                  filteredSymbols.map((item) => (
                    <div
                      key={item.id}
                      className={`symbol-list-item ${selectedSymbolIds.includes(item.id) ? 'is-selected' : ''}`}
                      onClick={() => toggleSelectSymbolInModal(item.id)}
                    >
                      <div className="symbol-item-left">
                        <span className="symbol-name">{item.name}</span>
                        {item.subtype && <span className="symbol-subtype-tag">{item.subtype}</span>}
                      </div>
                      <span className={`symbol-type-badge ${item.type === 'Stock' ? 'stock-badge' : (item.cpType === 'CALL' ? 'call-badge' : (item.cpType === 'PUT' ? 'put-badge' : ''))}`}>
                        {item.type === 'Stock' ? 'EQUITY' : (item.cpType ? item.cpType : 'OPTIONS')}
                      </span>
                    </div>
                  ))
                ) : (
                  <div style={{ padding: '24px', textAlign: 'center', color: '#888', fontSize: '14px' }}>
                    {isMastersLoading ? (mastersStatusText || 'Loading contracts from Masters.mf...') : 'No matching contract symbols found'}
                  </div>
                )}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="symbol-modal-footer">
              <button className="btn-done" onClick={handleDoneSymbolModal}>
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Order Confirmation Popup Modal */}
      {isOrderConfirmModalOpen && (
        <div className="confirm-modal-overlay" onClick={() => setIsOrderConfirmModalOpen(false)}>
          <div className="confirm-modal-container" onClick={(e) => e.stopPropagation()}>
            {/* Modal Header */}
            <div className="confirm-modal-header">
              <h2 className="confirm-modal-title">Order Confirmation</h2>
              <button className="confirm-modal-close" onClick={() => setIsOrderConfirmModalOpen(false)} aria-label="Close">
                ✕
              </button>
            </div>

            {/* Modal Body */}
            <div className="confirm-modal-body">
              <h3 className="confirm-section-title">Smart Trading</h3>

              {/* Confirmation Table */}
              <div className="confirm-table-container">
                <div className="confirm-table-header">
                  <span>Contract Name</span>
                  <span style={{ textAlign: 'center' }}>LTP</span>
                  <span style={{ textAlign: 'center' }}>Price</span>
                  <span style={{ textAlign: 'center' }}>Lot</span>
                </div>

                <div className="confirm-table-body">
                  {isTheta ? (
                    <>
                      <div className="confirm-table-row">
                        <div className="confirm-contract-cell">
                          <span className="confirm-item-name">NIFTY 23 JAN 22000 CE</span>
                          <span className="confirm-action-badge sell">SELL</span>
                        </div>
                        <div className="col-ltp">446.50</div>
                        <div className="col-center">
                          <div className="basket-stepper-box confirm-stepper">
                            <button className="stepper-btn">—</button>
                            <input type="text" className="stepper-input" value="446.50" readOnly />
                            <button className="stepper-btn">+</button>
                          </div>
                        </div>
                        <div className="confirm-lot-val">{thetaLots * 50}</div>
                      </div>
                      <div className="confirm-table-row">
                        <div className="confirm-contract-cell">
                          <span className="confirm-item-name">NIFTY 23 JAN 22000 PE</span>
                          <span className="confirm-action-badge sell">SELL</span>
                        </div>
                        <div className="col-ltp">410.20</div>
                        <div className="col-center">
                          <div className="basket-stepper-box confirm-stepper">
                            <button className="stepper-btn">—</button>
                            <input type="text" className="stepper-input" value="410.20" readOnly />
                            <button className="stepper-btn">+</button>
                          </div>
                        </div>
                        <div className="confirm-lot-val">{thetaLots * 50}</div>
                      </div>
                    </>
                  ) : basketItems.length > 0 ? (
                    basketItems.map((item) => (
                      <div key={item.id} className="confirm-table-row">
                        <div className="confirm-contract-cell">
                          <span className="confirm-item-name">{item.name}</span>
                          <span className={`confirm-action-badge ${item.action.toLowerCase()}`}>
                            {item.action}
                          </span>
                        </div>
                        <div className="col-ltp">{item.ltp}</div>
                        <div className="col-center">
                          <div className="basket-stepper-box confirm-stepper">
                            <button className="stepper-btn" onClick={() => handlePriceChange(item.id, -5)}>—</button>
                            <input
                              type="text"
                              className="stepper-input"
                              value={item.price}
                              onChange={(e) => {
                                const val = parseFloat(e.target.value) || 0;
                                setBasketItems(prev => prev.map(i => i.id === item.id ? { ...i, price: val } : i));
                              }}
                            />
                            <button className="stepper-btn" onClick={() => handlePriceChange(item.id, 5)}>+</button>
                          </div>
                        </div>
                        <div className="confirm-lot-val">{item.lot * 75}</div>
                      </div>
                    ))
                  ) : (
                    <>
                      <div className="confirm-table-row">
                        <div className="confirm-contract-cell">
                          <span className="confirm-item-name">NIFTY 23 JAN 22300 CALL</span>
                          <span className="confirm-action-badge buy">BUY</span>
                        </div>
                        <div className="col-ltp">1135.9</div>
                        <div className="col-center">
                          <div className="basket-stepper-box confirm-stepper">
                            <button className="stepper-btn">—</button>
                            <input type="text" className="stepper-input" value="1370" readOnly />
                            <button className="stepper-btn">+</button>
                          </div>
                        </div>
                        <div className="confirm-lot-val">75</div>
                      </div>
                      <div className="confirm-table-row">
                        <div className="confirm-contract-cell">
                          <span className="confirm-item-name">NIFTY 23 JAN 22300 CALL</span>
                          <span className="confirm-action-badge sell">SELL</span>
                        </div>
                        <div className="col-ltp">1135.9</div>
                        <div className="col-center">
                          <div className="basket-stepper-box confirm-stepper">
                            <button className="stepper-btn">—</button>
                            <input type="text" className="stepper-input" value="1370" readOnly />
                            <button className="stepper-btn">+</button>
                          </div>
                        </div>
                        <div className="confirm-lot-val">75</div>
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* Thresholds & Margins Summary */}
              <div className="confirm-summary-grid">
                <div className="confirm-summary-row">
                  <div className="confirm-summary-item">
                    <span className="confirm-summary-label">{isTheta ? 'Stoploss' : 'Max Loss'} <img src={infoIcon} alt="info" className="info-icon" /></span>
                    <span className="confirm-summary-val">{isTheta ? (stoploss || '—') : (maxLossEnabled ? maxLossValue : '—')}</span>
                  </div>
                  <div className="confirm-summary-item">
                    <span className="confirm-summary-label">{isTheta ? 'Take Profit' : 'Max Profit'} <img src={infoIcon} alt="info" className="info-icon" /></span>
                    <span className="confirm-summary-val">{isTheta ? (takeProfit || '—') : (maxProfitEnabled ? maxProfitValue : '—')}</span>
                  </div>
                  <div className="confirm-summary-item">
                    <span className="confirm-summary-label">Start Time <img src={infoIcon} alt="info" className="info-icon" /></span>
                    <span className="confirm-summary-val">9: 15</span>
                  </div>
                  <div className="confirm-summary-item">
                    <span className="confirm-summary-label">End Time <img src={infoIcon} alt="info" className="info-icon" /></span>
                    <span className="confirm-summary-val">15: 20</span>
                  </div>
                </div>

                <div className="confirm-summary-row">
                  <div className="confirm-summary-item">
                    <span className="confirm-summary-label">Max. Margin <img src={infoIcon} alt="info" className="info-icon" /></span>
                    <span className="confirm-summary-val">₹5,00,000</span>
                  </div>
                  <div className="confirm-summary-item">
                    <span className="confirm-summary-label">Initial Margin <img src={infoIcon} alt="info" className="info-icon" /></span>
                    <span className="confirm-summary-val">₹3794.50</span>
                  </div>
                  <div className="confirm-summary-item">
                    <span className="confirm-summary-label">Available Limit <img src={infoIcon} alt="info" className="info-icon" /></span>
                    <span className="confirm-summary-val">₹5600.00</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="confirm-modal-footer">
              <button className="btn-confirm-cancel" onClick={() => setIsOrderConfirmModalOpen(false)}>
                Cancel
              </button>
              <button className="btn-confirm-start" onClick={handleStartStrategy}>
                Start Strategy
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Nifty Theta Dedicated Order Confirmation Popup Modal (Image 2) */}
      {isThetaOrderConfirmModalOpen && (
        <div className="theta-confirm-modal-overlay" id="theta-confirm-modal-overlay" onClick={() => setIsThetaOrderConfirmModalOpen(false)}>
          <div className="theta-confirm-modal-container" id="theta-confirm-modal-container" onClick={(e) => e.stopPropagation()}>
            {/* Modal Header */}
            <div className="theta-confirm-modal-header">
              <h2 className="theta-confirm-modal-title">Order Confirmation</h2>
              <button
                className="theta-confirm-modal-close"
                id="theta-confirm-modal-close"
                onClick={() => setIsThetaOrderConfirmModalOpen(false)}
                aria-label="Close"
              >
                ✕
              </button>
            </div>

            {/* Modal Body */}
            <div className="theta-confirm-modal-body">
              <h3 className="theta-confirm-strategy-title">Nifty Theta</h3>

              {/* 2x3 Grid */}
              <div className="theta-confirm-grid">
                {/* Row 1 */}
                <div className="theta-confirm-cell">
                  <span className="theta-confirm-label">
                    Lots
                    <svg className="theta-info-icon" width="13" height="13" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <circle cx="8" cy="8" r="7" stroke="#767676" strokeWidth="1.2" />
                      <path d="M8 7V11.5M8 4.75V5" stroke="#767676" strokeWidth="1.4" strokeLinecap="round" />
                    </svg>
                  </span>
                  <span className="theta-confirm-val">{thetaLots && thetaLots > 1 ? thetaLots * 500 : 500}</span>
                </div>

                <div className="theta-confirm-cell">
                  <span className="theta-confirm-label">
                    Max Profit
                    <svg className="theta-info-icon" width="13" height="13" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <circle cx="8" cy="8" r="7" stroke="#767676" strokeWidth="1.2" />
                      <path d="M8 7V11.5M8 4.75V5" stroke="#767676" strokeWidth="1.4" strokeLinecap="round" />
                    </svg>
                  </span>
                  <span className="theta-confirm-val">{takeProfit ? `₹${takeProfit}` : '₹5,00,000'}</span>
                </div>

                <div className="theta-confirm-cell">
                  <span className="theta-confirm-label">
                    Stoploss
                    <svg className="theta-info-icon" width="13" height="13" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <circle cx="8" cy="8" r="7" stroke="#767676" strokeWidth="1.2" />
                      <path d="M8 7V11.5M8 4.75V5" stroke="#767676" strokeWidth="1.4" strokeLinecap="round" />
                    </svg>
                  </span>
                  <span className="theta-confirm-val">{stoploss ? `₹${stoploss}` : '₹5,00,000'}</span>
                </div>

                {/* Row 2 */}
                <div className="theta-confirm-cell">
                  <span className="theta-confirm-label">
                    Max. Margin
                    <svg className="theta-info-icon" width="13" height="13" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <circle cx="8" cy="8" r="7" stroke="#767676" strokeWidth="1.2" />
                      <path d="M8 7V11.5M8 4.75V5" stroke="#767676" strokeWidth="1.4" strokeLinecap="round" />
                    </svg>
                  </span>
                  <span className="theta-confirm-val">₹5,00,000</span>
                </div>

                <div className="theta-confirm-cell">
                  <span className="theta-confirm-label">
                    Initial Margin
                    <svg className="theta-info-icon" width="13" height="13" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <circle cx="8" cy="8" r="7" stroke="#767676" strokeWidth="1.2" />
                      <path d="M8 7V11.5M8 4.75V5" stroke="#767676" strokeWidth="1.4" strokeLinecap="round" />
                    </svg>
                  </span>
                  <span className="theta-confirm-val">₹3794.50</span>
                </div>

                <div className="theta-confirm-cell">
                  <span className="theta-confirm-label">
                    Available Limit
                    <svg className="theta-info-icon" width="13" height="13" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <circle cx="8" cy="8" r="7" stroke="#767676" strokeWidth="1.2" />
                      <path d="M8 7V11.5M8 4.75V5" stroke="#767676" strokeWidth="1.4" strokeLinecap="round" />
                    </svg>
                  </span>
                  <span className="theta-confirm-val">₹5600.00</span>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="theta-confirm-modal-footer">
              <button
                className="theta-btn-confirm-cancel"
                id="theta-btn-confirm-cancel"
                onClick={() => setIsThetaOrderConfirmModalOpen(false)}
              >
                Cancel
              </button>
              <button
                className="theta-btn-confirm-start"
                id="theta-btn-confirm-start"
                onClick={() => {
                  setIsThetaOrderConfirmModalOpen(false);
                  handleStartStrategy();
                }}
              >
                Start Strategy
              </button>
            </div>
          </div>
        </div>
      )}

      {/* "Know More" Backtester Modal */}
      {isKnowMoreModalOpen && (
        <div className="modal-overlay" onClick={() => setIsKnowMoreModalOpen(false)}>
          <div className="modal-container know-more-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">{strategy?.title || (isTheta ? 'Nifty Theta' : 'Smart Trading')}</h3>
              <div className="modal-header-actions">
                <button
                  className="play-video-btn"
                  onClick={() => alert(`Playing video for ${strategy?.title || (isTheta ? 'Nifty Theta' : 'Smart Trading')}`)}
                >
                  <svg width="16" height="16" viewBox="0 0 14 18" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M0.75 15.2108V2.28867C0.75 0.947598 2.66217 0.250658 3.83794 1.16319L12.1628 7.62428C12.9457 8.23192 12.9457 9.26759 12.1628 9.87523L3.83793 16.3363C2.66217 17.2489 0.75 16.5519 0.75 15.2108Z" stroke="#E3530F" strokeWidth="1.5" />
                  </svg>
                  <span>Play Video</span>
                </button>
                <button className="modal-close-btn" onClick={() => setIsKnowMoreModalOpen(false)} title="Close" aria-label="Close">
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M1.5 1.5L12.5 12.5M12.5 1.5L1.5 12.5" stroke="#353535" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </button>
              </div>
            </div>

            <div className="modal-body">
              <h4 className="modal-section-title">Description</h4>
              <p className="modal-text">
                {strategy?.details?.initialPosition || 'This strategy enables automated trade management using parameters like Lock Profit, Max Profit, and Max Loss. It helps manage risk and preserve gains by exiting trades when predefined thresholds are met.'}
              </p>

              <div className="modal-meta-list">
                <p className="modal-meta-item">
                  <strong>Trading Time: </strong>
                  <span>{strategy?.details?.tradingTime || '9:15 AM to 3:20 PM'}</span>
                </p>
                <p className="modal-meta-item">
                  <strong>Exit Mechanism: </strong>
                  <span>{strategy?.details?.adjustments || 'Auto-square-off based on user-defined thresholds'}</span>
                </p>
              </div>

              <div className="modal-how-it-works-container">
                <h4 className="modal-section-title">How It Works</h4>

                <div className="modal-work-section">
                  <p className="modal-work-subtitle">Profit Locking:</p>
                  <ul className="modal-bullet-list">
                    <li>The locked profit trails the market upward but does not reduce if profits fall</li>
                    <li>Trade exits if profit falls back to the locked level or if Max Profit or Max Loss is hit</li>
                  </ul>

                  <p className="modal-work-subtitle">Auto-Trailing</p>
                  <ul className="modal-bullet-list">
                    <li>When your profit hits a specified value (e.g., ₹1,400), a part of it (e.g., ₹500) is locked in</li>
                    <li>If the profit doubles (e.g., to ₹2,800), the locked profit also doubles (₹1,000)</li>
                    <li>This continues with each doubling of profit (₹5,600 → ₹2,000, etc.)</li>
                  </ul>
                </div>
              </div>

              <h4 className="modal-section-title modal-example-title">Example:</h4>

              <div className="modal-example-container">
                <div className="modal-example-left">
                  <p className="modal-example-text">You’ve set up a basket with these limits:</p>
                  <ul className="modal-bullet-list">
                    <li><strong>Maximum Loss:</strong> ₹1,500</li>
                    <li><strong>Maximum Profit:</strong> ₹10,000</li>
                  </ul>

                  <p className="modal-example-text" style={{ marginTop: '12px' }}>You’ve also added a profit-lock & trail feature:</p>
                  <ul className="modal-bullet-list">
                    <li>When your profit hits <strong>₹2,000</strong>, the system will lock in a <strong>minimum profit</strong> of <strong>₹1,500</strong>.</li>
                    <li>If the profit triples to the <strong>₹6,000</strong>, the locked profit will <strong>move up</strong> to <strong>₹4,000</strong>.</li>
                    <li>Once the profit hits max profit of <strong>₹10,000</strong>, the position will automatically square off</li>
                  </ul>
                </div>

                <div className="modal-example-right">
                  <img src={chartSvg} alt="Trading Chart" className="modal-example-chart" />
                </div>
              </div>

              <h4 className="modal-section-title modal-note-title">Note</h4>
              <p className="modal-note-text">
                Slight execution differences may occur due to market volatility and order placement delay
              </p>

              <div className="modal-parameters-section">
                <h4 className="modal-section-title modal-param-title">Strategy Parameters</h4>
                <div className="modal-parameters-list">
                  <div className="modal-parameter-item">
                    <div className="param-badge">1</div>
                    <div className="param-label">Max Loss:</div>
                    <div className="param-desc">Set the maximum amount of loss you're willing to take. The strategy will automatically exit if this amount is hit</div>
                  </div>
                  <div className="modal-parameter-item">
                    <div className="param-badge">2</div>
                    <div className="param-label">Max Profit:</div>
                    <div className="param-desc">Define the Max Profit post which it will square off and exit</div>
                  </div>
                  <div className="modal-parameter-item">
                    <div className="param-badge">3</div>
                    <div className="param-label">When Profit Reaches:</div>
                    <div className="param-desc">Define the point where you want to Lock the minimum Profit for this strategy</div>
                  </div>
                  <div className="modal-parameter-item">
                    <div className="param-badge">4</div>
                    <div className="param-label">Lock Profit at & Trail:</div>
                    <div className="param-desc">Define the minimum Profit & trailing point for this strategy</div>
                  </div>
                </div>
              </div>
            </div>

            <div className="modal-footer">
              {!isTheta ? (
                <button
                  className="modal-btn-trade"
                  onClick={() => {
                    setIsKnowMoreModalOpen(false);
                  }}
                >
                  Trade
                </button>
              ) : (
                <>
                  <button className="modal-btn-cancel" onClick={() => setIsKnowMoreModalOpen(false)}>
                    Cancel
                  </button>
                  <button
                    className="modal-btn-test"
                    onClick={() => {
                      setIsKnowMoreModalOpen(false);
                      setSelectedReportPeriod(null);
                      setCustomStartDate('');
                      setCustomEndDate('');
                      setIsViewReportModalOpen(true);
                    }}
                  >
                    Test Strategy
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* View Report Period Selection Modal */}
      {isViewReportModalOpen && (
        <div className="modal-overlay" onClick={() => setIsViewReportModalOpen(false)}>
          <div className="modal-container view-report-modal" onClick={(e) => e.stopPropagation()}>
            <div className="view-report-header">
              <h3 className="view-report-title">View Report</h3>
              <button
                className="modal-close-btn"
                onClick={() => setIsViewReportModalOpen(false)}
                title="Close"
                aria-label="Close"
              >
                <img src={closeIcon} alt="Close" width="16" height="16" />
              </button>
            </div>

            <div className="view-report-body">
              <p className="view-report-desc">
                Please select the time period for which you want to see the{' '}
                <span className="view-report-target">
                  {strategy?.title
                    ? (strategy.title.toLowerCase().includes('theta') ? 'Nifty Thetha report.' : `${strategy.title} report.`)
                    : 'Nifty Thetha report.'}
                </span>
              </p>

              <div className="view-report-period-grid">
                {['3 Months', '6 Months', '12 Months'].map((period) => (
                  <button
                    key={period}
                    type="button"
                    className={`period-pill-btn ${selectedReportPeriod === period ? 'active' : ''}`}
                    onClick={() => setSelectedReportPeriod(period)}
                  >
                    {period}
                  </button>
                ))}
              </div>

              <div className="view-report-footer">
                <button
                  type="button"
                  className={`btn-view-report-submit ${selectedReportPeriod ? 'active' : 'disabled'}`}
                  disabled={!selectedReportPeriod}
                  onClick={() => {
                    if (!selectedReportPeriod) return;
                    setShowToast(true);
                    setTimeout(() => setShowToast(false), 3000);
                    setIsViewReportModalOpen(false);
                  }}
                >
                  View Report
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
