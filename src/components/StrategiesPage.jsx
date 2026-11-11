import React, { useState, useRef, useEffect } from 'react';
import StrategyCard from './StrategyCard';
import SmartTrading from './SmartTrading';
import springAlgoSvg from '../../assets/Web/Springalgo.svg';
import soundSvg from '../../assets/Web/sound.svg';
import chartSvg from '../../assets/Web/trade/chart.svg';
import statusIcon from '../../assets/Web/status.svg';
import infoIcon from '../../assets/Web/margin/Info.svg';
import dropdownIcon from '../../assets/Web/dropdown.svg';
import closeIcon from '../../assets/Web/close.svg';
import './StrategiesPage.css';
import './SmartTrading.css';

/**
 * Helper to convert standard YouTube watch / short URLs into embed iframe URLs
 */
const getYoutubeEmbedUrl = (url) => {
  if (!url) return '';
  if (url.includes('/embed/')) {
    return url.includes('?') ? `${url}&autoplay=1` : `${url}?autoplay=1`;
  }
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
  const match = String(url).match(regExp);
  const videoId = (match && match[2].length === 11) ? match[2] : null;
  if (videoId) {
    return `https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0`;
  }
  return url;
};

const defaultStrategies = [
  {
    id: 'nifty-theta-hedge',
    title: 'Nifty Theta Hedge',
    icon: 'N',
    exchange: 'NSE',
    type: 'Theta Decay',
    assetClass: 'Options',
    trend: 'Bullish',
    tags: ['HEDGED', 'THETA DECAY', 'FIXED STOPLOSS'],
    description: 'The strategy follows the current market trend and takes a short position as soon as the Supertrend.',
    minAmount: '1,80,000',
    minAmountVal: 180000,
    popularity: 95,
    dateAdded: '2026-09-28',
    category: 'strategies',
    runningStatus: 'running',
    isFavourite: false,
    videoUrl: 'https://www.youtube.com/watch?v=Yo2U89a-0D4',
    details: {
      instrument: 'Nifty Options',
      tradingTime: '9:20 AM to 3:15 PM',
      initialPosition: 'The strategy begins by selling an At-the-Money (ATM) Call and Put (short straddle) with the added flexibility of selling an Out-of-The-Money (OTM) Call and Put during high volatility.',
      adjustments: 'When stoploss hits or significant market moves occur, fresh positions are initiated.'
    }
  },
  {
    id: 'nifty-theta',
    title: 'Nifty Theta',
    icon: 'B',
    exchange: 'NSE',
    type: 'Expiry Trading',
    assetClass: 'Options',
    trend: 'Bullish',
    tags: ['SHORT STRADDLE', 'FIXED STOPLOSS', 'THETA DECAY'],
    description: 'The strategy follows the current market trend and takes a short position as soon as the Supertrend.',
    minAmount: '1,10,000',
    minAmountVal: 110000,
    popularity: 88,
    dateAdded: '2026-09-15',
    category: 'strategies',
    runningStatus: 'running',
    isFavourite: true,
    videoUrl: 'https://www.youtube.com/watch?v=Yo2U89a-0D4',
    details: {
      instrument: 'Nifty Options',
      tradingTime: '9:20 AM to 3:15 PM',
      initialPosition: 'Focuses on optimizing premium decay by creating short straddles with dynamic adjustments.',
      adjustments: 'On stoploss or market movements, fresh positions are initiated automatically.'
    }
  },
  {
    id: 'smart-trading',
    title: 'Smart Trading',
    icon: 'S',
    exchange: 'BSE',
    type: 'Intraday',
    assetClass: 'Options',
    trend: 'Neutral',
    tags: ['LOCK PROFIT & TRAIL', 'INTRADAY', 'MULTILEG'],
    description: 'The strategy follows the current market trend and takes a short position as soon as the Supertrend.',
    minAmount: '1,20,000',
    minAmountVal: 120000,
    popularity: 92,
    dateAdded: '2026-09-20',
    category: 'strategies',
    runningStatus: 'running',
    isFavourite: false,
    videoUrl: 'https://www.youtube.com/watch?v=D2-JUtHHGeM',
    details: {
      instrument: 'Index & Stock Options',
      tradingTime: '9:15 AM to 3:30 PM',
      initialPosition: 'Automate trades efficiently by locking & trailing profits.',
      adjustments: 'Dynamic multi-leg trailing stoploss execution.'
    }
  }
];

const defaultCompletedStrategies = [
  {
    id: 'comp-101',
    title: 'Smart Trading',
    status: 'COMPLETED',
    tags: ['LOCK PROFIT & TRAIL', 'INTRADAY', 'MULTILEG'],
    totalPnl: '₹1,000',
    bookedPnl: '₹1,000',
    startTime: '13 Oct 2026 - 03:51PM',
    endTime: '13 Oct 2026 - 03:52PM',
    thresholds: {
      maxLoss: 500,
      maxProfit: 1000,
      whenProfit: 50,
      lockProfit: 50
    },
    items: [
      { id: 'leg-1', name: 'NIFTY 23 JAN 22300 CALL', ltp: 1135.9, price: 1370, lot: 1, lotSize: 75, action: 'BUY', createdDate: '13 Oct 2026 03:51PM', status: 'Executed', refNo: '12345678' },
      { id: 'leg-2', name: 'NIFTY 23 JAN 22300 CALL', ltp: 1135.9, price: 1370, lot: 1, lotSize: 75, action: 'SELL', createdDate: '13 Oct 2026 03:51PM', status: 'Executed', refNo: '12345679' }
    ]
  },
  {
    id: 'comp-102',
    title: 'Nifty Theta',
    status: 'COMPLETED',
    tags: ['RESEARCH BACKED', 'INTRADAY'],
    totalPnl: '₹1,000',
    bookedPnl: '₹1,000',
    startTime: '13 Oct 2026 - 03:50PM',
    endTime: '13 Oct 2026 - 03:50PM',
    lots: 10,
    maxProfit: 500000,
    stoploss: 500000,
    thresholds: {
      maxLoss: 500000,
      maxProfit: 500000,
      whenProfit: null,
      lockProfit: null
    },
    items: [
      { id: 'theta-leg-1', name: 'NIFTY 23 JAN 22000 CE', ltp: 446.5, price: 446.5, lot: 10, lotSize: 50, action: 'SELL', createdDate: '13 Oct 2026 03:50PM', status: 'Executed', refNo: '12345684' },
      { id: 'theta-leg-2', name: 'NIFTY 23 JAN 22000 PE', ltp: 410.2, price: 410.2, lot: 10, lotSize: 50, action: 'SELL', createdDate: '13 Oct 2026 03:50PM', status: 'Executed', refNo: '12345685' }
    ]
  },
  {
    id: 'comp-103',
    title: 'Smart Trading',
    status: 'COMPLETED',
    tags: ['LOCK PROFIT & TRAIL', 'INTRADAY', 'MULTILEG'],
    totalPnl: '₹1,000',
    bookedPnl: '₹1,000',
    startTime: '23 Jan 2025 - 09:27AM',
    endTime: '23 Jan 2025 - 03:15PM',
    thresholds: {
      maxLoss: 500,
      maxProfit: 1000,
      whenProfit: 50,
      lockProfit: 50
    },
    items: [
      { id: 'leg-3', name: 'NIFTY 23 JAN 22300 CALL', ltp: 1135.9, price: 1370, lot: 1, lotSize: 75, action: 'BUY', createdDate: '23 Jan 2025 09:27AM', status: 'Executed', refNo: '12345680' },
      { id: 'leg-4', name: 'NIFTY 23 JAN 22000 CALL', ltp: 1370, price: 1370, lot: 1, lotSize: 75, action: 'BUY', createdDate: '23 Jan 2025 09:27AM', status: 'Executed', refNo: '12345681' },
      { id: 'leg-5', name: 'NIFTY 23 JAN 22000 CALL', ltp: 969.5, price: 969.5, lot: 1, lotSize: 75, action: 'SELL', createdDate: '23 Jan 2025 09:27AM', status: 'Executed', refNo: '12345682' }
    ]
  }
];

const defaultRunningStrategies = [
  {
    id: 'run-101',
    title: 'Smart Trading',
    status: 'RUNNING',
    tags: ['LOCK PROFIT & TRAIL', 'INTRADAY', 'MULTILEG'],
    startTime: '23 Jan 2025 - 09:30AM',
    endTime: '23 Jan 2025 - 03:30PM',
    thresholds: {
      maxLoss: 500,
      maxProfit: 1000,
      whenProfit: 50,
      lockProfit: 50
    },
    items: [
      { id: 'rleg-1', name: 'NIFTY 23 JAN 22300 CALL', ltp: 1135.9, price: 1370, lot: 1, lotSize: 75, action: 'BUY', createdDate: '23 Jan 2025 09:30AM', status: 'Executed', refNo: '12345681' },
      { id: 'rleg-2', name: 'NIFTY 23 JAN 22000 CALL', ltp: 1370, price: 1370, lot: 1, lotSize: 75, action: 'BUY', createdDate: '23 Jan 2025 09:30AM', status: 'Executed', refNo: '12345682' },
      { id: 'rleg-3', name: 'NIFTY 23 JAN 22000 CALL', ltp: 969.5, price: 969.5, lot: 1, lotSize: 75, action: 'SELL', createdDate: '23 Jan 2025 09:30AM', status: 'Executed', refNo: '12345683' }
    ]
  }
];

const sortOptions = [
  { value: 'default', label: 'Research Backed' },
  { value: 'min_capital', label: 'Minimum Capital' },
  { value: 'popular', label: 'Popular' },
  { value: 'latest', label: 'Latest' }
];

export default function StrategiesPage() {
  const [strategiesList, setStrategiesList] = useState(defaultStrategies);
  const [activeTab, setActiveTab] = useState('strategies'); // 'strategies' | 'favourites' | 'running' | 'completed' | 'saved'
  const [viewMode, setViewMode] = useState('grid'); // 'grid' | 'list'

  // Top Banner & Notice state
  const [hasWebinar, setHasWebinar] = useState(true);
  const [isAnnouncementPaused, setIsAnnouncementPaused] = useState(false);

  // Sort state
  const [selectedSort, setSelectedSort] = useState('default');
  const [isSortOpen, setIsSortOpen] = useState(false);

  // Applied Filter states
  const [selectedExchanges, setSelectedExchanges] = useState([]);
  const [selectedTypes, setSelectedTypes] = useState([]);
  const [selectedAssetClasses, setSelectedAssetClasses] = useState([]);
  const [selectedTrends, setSelectedTrends] = useState([]);
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  // Draft Filter states (while popover is open before clicking Apply)
  const [draftExchanges, setDraftExchanges] = useState([]);
  const [draftTypes, setDraftTypes] = useState([]);
  const [draftAssetClasses, setDraftAssetClasses] = useState([]);
  const [draftTrends, setDraftTrends] = useState([]);

  // Modals & Toast
  const [activeModal, setActiveModal] = useState(null);
  const [selectedStrategy, setSelectedStrategy] = useState(null);
  const [activeTradeStrategy, setActiveTradeStrategy] = useState(null);
  const [toastMessage, setToastMessage] = useState('');
  const [lots, setLots] = useState(1);
  const [tradeConfirmed, setTradeConfirmed] = useState(false);
  const [openRunningMenuId, setOpenRunningMenuId] = useState(null);
  const [isTradesModalOpen, setIsTradesModalOpen] = useState(false);
  const [selectedTradesStrategy, setSelectedTradesStrategy] = useState(null);
  const [isPositionModalOpen, setIsPositionModalOpen] = useState(false);
  const [selectedPositionStrategy, setSelectedPositionStrategy] = useState(null);
  const [isStopModalOpen, setIsStopModalOpen] = useState(false);
  const [selectedStopStrategy, setSelectedStopStrategy] = useState(null);
  const [runningStrategies, setRunningStrategies] = useState(defaultRunningStrategies);
  const [completedStrategies, setCompletedStrategies] = useState(defaultCompletedStrategies);
  const [restartConfirmStrategy, setRestartConfirmStrategy] = useState(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedDeleteStrategy, setSelectedDeleteStrategy] = useState(null);

  // View Report Modal State
  const [isViewReportModalOpen, setIsViewReportModalOpen] = useState(false);
  const [reportStrategy, setReportStrategy] = useState(null);
  const [selectedReportPeriod, setSelectedReportPeriod] = useState(null);
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');

  // Video Tutorial Modal state
  const [videoModal, setVideoModal] = useState({
    isOpen: false,
    title: '',
    url: ''
  });

  const handleOpenVideo = (title, url) => {
    setVideoModal({
      isOpen: true,
      title: title || 'Video Tutorial',
      url: url || 'https://www.youtube.com/watch?v=Yo2U89a-0D4'
    });
  };

  const handleCloseVideo = () => {
    setVideoModal({
      isOpen: false,
      title: '',
      url: ''
    });
  };

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && videoModal.isOpen) {
        handleCloseVideo();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [videoModal.isOpen]);

  // Outside click refs
  const sortRef = useRef(null);
  const filterRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (sortRef.current && !sortRef.current.contains(e.target)) {
        setIsSortOpen(false);
      }
      if (filterRef.current && !filterRef.current.contains(e.target)) {
        setIsFilterOpen(false);
      }
      if (!e.target.closest('.running-more-wrapper')) {
        setOpenRunningMenuId(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const openFilterPopover = () => {
    setDraftExchanges([...selectedExchanges]);
    setDraftTypes([...selectedTypes]);
    setDraftAssetClasses([...selectedAssetClasses]);
    setDraftTrends([...selectedTrends]);
    setIsFilterOpen(!isFilterOpen);
    setIsSortOpen(false);
  };

  const applyFilters = () => {
    setSelectedExchanges([...draftExchanges]);
    setSelectedTypes([...draftTypes]);
    setSelectedAssetClasses([...draftAssetClasses]);
    setSelectedTrends([...draftTrends]);
    setIsFilterOpen(false);
    showToast('Filters applied successfully');
  };

  const clearAllFilters = () => {
    setDraftExchanges([]);
    setDraftTypes([]);
    setDraftAssetClasses([]);
    setDraftTrends([]);
    setSelectedExchanges([]);
    setSelectedTypes([]);
    setSelectedAssetClasses([]);
    setSelectedTrends([]);
    setSelectedSort('default');
    setIsFilterOpen(false);
    showToast('All filters cleared');
  };

  const toggleDraftExchange = (ex) => {
    setDraftExchanges((prev) =>
      prev.includes(ex) ? prev.filter((item) => item !== ex) : [...prev, ex]
    );
  };

  const toggleDraftType = (t) => {
    setDraftTypes((prev) =>
      prev.includes(t) ? prev.filter((item) => item !== t) : [...prev, t]
    );
  };

  const toggleDraftAssetClass = (ac) => {
    setDraftAssetClasses((prev) =>
      prev.includes(ac) ? prev.filter((item) => item !== ac) : [...prev, ac]
    );
  };

  const toggleDraftTrend = (tr) => {
    setDraftTrends((prev) =>
      prev.includes(tr) ? prev.filter((item) => item !== tr) : [...prev, tr]
    );
  };

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage('');
    }, 3000);
  };

  const handleToggleBookmark = (strategyId) => {
    setStrategiesList((prev) =>
      prev.map((s) => (s.id === strategyId ? { ...s, isFavourite: !s.isFavourite } : s))
    );
    const target = strategiesList.find((s) => s.id === strategyId);
    if (target) {
      const newFavState = !target.isFavourite;
      showToast(newFavState ? `Added "${target.title}" to Favourites` : `Removed "${target.title}" from Favourites`);
    }
  };

  const handleNiftyThetaTrade = (strategy) => {
    setActiveTradeStrategy({
      ...strategy,
      isCloned: false,
      items: []
    });
    closeModal();
  };

  const handleTrade = (strategy) => {
    if (
      strategy.id === 'smart-trading' ||
      strategy.title.toLowerCase().includes('smart') ||
      strategy.id.toLowerCase().includes('theta') ||
      strategy.title.toLowerCase().includes('theta')
    ) {
      setActiveTradeStrategy({
        ...strategy,
        isCloned: false,
        items: []
      });
      closeModal();
    } else {
      setSelectedStrategy(strategy);
      setLots(1);
      setTradeConfirmed(false);
      setActiveModal('trade');
    }
  };

  const handleKnowMore = (strategy) => {
    setSelectedStrategy(strategy);
    setActiveModal('knowMore');
  };

  const handlePlay = (strategy) => {
    const isTheta = strategy?.id?.includes('theta') || (strategy?.title && strategy.title.toLowerCase().includes('theta'));
    const videoUrl = strategy?.videoUrl || (isTheta
      ? 'https://www.youtube.com/watch?v=Yo2U89a-0D4'
      : (strategy?.id === 'smart-trading' ? 'https://www.youtube.com/watch?v=D2-JUtHHGeM' : 'https://www.youtube.com/watch?v=Yo2U89a-0D4'));
    handleOpenVideo(
      strategy?.title ? `${strategy.title} - Video Tutorial` : 'Video Tutorial',
      videoUrl
    );
  };

  const handleCloneToSmartTrade = (item, actionType = 'replicate') => {
    const clonedItems = (item.items && item.items.length > 0)
      ? item.items.map((it, idx) => ({
        id: `cloned-${Date.now()}-${idx}-${Math.floor(Math.random() * 1000)}`,
        name: it.name || 'NIFTY 23 JAN 22300 CALL',
        ltp: it.ltp !== undefined ? it.ltp : 1135.9,
        price: it.price !== undefined ? it.price : (it.ltp || 1370),
        lot: it.lot !== undefined ? it.lot : 1,
        lotSize: it.lotSize !== undefined ? it.lotSize : 75,
        action: (it.action || 'BUY').toUpperCase()
      }))
      : [
        { id: `c-1-${Date.now()}`, name: 'NIFTY 23 JAN 22300 CALL', ltp: 1135.9, price: 1370, lot: 1, lotSize: 75, action: 'BUY' },
        { id: `c-2-${Date.now()}`, name: 'NIFTY 23 JAN 22000 CALL', ltp: 1370, price: 1370, lot: 1, lotSize: 75, action: 'BUY' },
        { id: `c-3-${Date.now()}`, name: 'NIFTY 23 JAN 22000 CALL', ltp: 969.5, price: 969.5, lot: 1, lotSize: 75, action: 'SELL' }
      ];

    const cleanTitle = (item.title || 'Smart Trading')
      .replace(/\s*-\s*MultiLeg/gi, '')
      .replace(/\s*MultiLeg/gi, '')
      .replace(/\s*\(Clone\)/gi, '')
      .replace(/\s*Clone/gi, '')
      .trim() || 'Smart Trading';

    const cleanTags = (item.tags || ['LOCK PROFIT & TRAIL', 'INTRADAY', 'MULTILEG'])
      .filter(t => !/multileg/i.test(t) && !/clone/i.test(t));

    const clonedStrategy = {
      ...item,
      id: 'smart-trading',
      title: cleanTitle,
      runName: '',
      clonedFrom: item.id,
      isCloned: true,
      actionOrigin: actionType, // 'replicate' or 'restart'
      items: clonedItems,
      tags: cleanTags.length > 0 ? cleanTags.slice(0, 2) : ['LOCK PROFIT & TRAIL', 'INTRADAY', 'MULTILEG'],
      thresholds: item.thresholds || {
        maxLoss: 500,
        maxProfit: 1000,
        whenProfit: 50,
        lockProfit: 50
      }
    };

    setOpenRunningMenuId(null);
    setActiveTradeStrategy(clonedStrategy);
    showToast(
      actionType === 'restart'
        ? `Restarting "${cleanTitle}". Switched to Smart Trade.`
        : `Replicating "${cleanTitle}". Switched to Smart Trade.`
    );
  };

  const handleRestartCompletedStrategy = (item) => {
    setOpenRunningMenuId(null);
    const isTheta = Boolean(item.id?.toLowerCase().includes('theta') || item.title?.toLowerCase().includes('theta'));

    let items;
    if (item.items && item.items.length > 0) {
      items = item.items.map((it, idx) => ({
        id: it.id || `restart-leg-${Date.now()}-${idx}`,
        name: it.name,
        ltp: it.ltp !== undefined ? it.ltp : (isTheta ? 446.50 : 1135.90),
        price: it.price !== undefined ? it.price : (it.ltp || (isTheta ? 446.50 : 1370)),
        lot: it.lot !== undefined ? it.lot : (isTheta ? (item.lots || 10) : 1),
        lotSize: it.lotSize !== undefined ? it.lotSize : (isTheta ? 50 : 75),
        action: (it.action || 'BUY').toUpperCase()
      }));
    } else if (isTheta) {
      items = [
        { id: `theta-leg-1-${Date.now()}`, name: 'NIFTY 23 JAN 22000 CE', ltp: 446.50, price: 446.50, lot: item.lots || 10, lotSize: 50, action: 'SELL' },
        { id: `theta-leg-2-${Date.now()}`, name: 'NIFTY 23 JAN 22000 PE', ltp: 410.20, price: 410.20, lot: item.lots || 10, lotSize: 50, action: 'SELL' }
      ];
    } else {
      items = [
        { id: `smart-leg-1-${Date.now()}`, name: 'NIFTY 23 JAN 22300 CALL', ltp: 1135.90, price: 1370, lot: 1, lotSize: 75, action: 'BUY' },
        { id: `smart-leg-2-${Date.now()}`, name: 'NIFTY 23 JAN 22300 CALL', ltp: 1135.90, price: 1370, lot: 1, lotSize: 75, action: 'SELL' }
      ];
    }

    const thresholds = item.thresholds || {
      maxLoss: isTheta ? 500000 : 500,
      maxProfit: isTheta ? 500000 : 1000,
      whenProfit: isTheta ? null : 50,
      lockProfit: isTheta ? null : 50
    };

    setRestartConfirmStrategy({
      ...item,
      isTheta,
      restartItems: items,
      thresholds,
      lots: item.lots || (isTheta ? 10 : 1),
      maxProfit: item.maxProfit || (isTheta ? 500000 : 1000),
      stoploss: item.stoploss || (isTheta ? 500000 : 500)
    });
  };

  const handleRestartItemPriceChange = (itemId, delta) => {
    setRestartConfirmStrategy(prev => {
      if (!prev) return null;
      return {
        ...prev,
        restartItems: prev.restartItems.map(it => {
          if (it.id === itemId) {
            const currentPrice = typeof it.price === 'number' ? it.price : parseFloat(it.price) || 0;
            return { ...it, price: Math.max(0, parseFloat((currentPrice + delta).toFixed(2))) };
          }
          return it;
        })
      };
    });
  };

  const handleConfirmRestartStrategy = () => {
    if (!restartConfirmStrategy) return;

    const now = new Date();
    const dateStr = now.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
    const timeStr = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
    const createdDateFormatted = `${dateStr} ${timeStr}`;

    const isTheta = Boolean(restartConfirmStrategy.isTheta);

    const itemsToStart = restartConfirmStrategy.restartItems && restartConfirmStrategy.restartItems.length > 0
      ? restartConfirmStrategy.restartItems.map((item, idx) => ({
        ...item,
        createdDate: createdDateFormatted,
        status: 'Executed',
        refNo: (12345678 + idx).toString()
      }))
      : isTheta ? [
        { id: `leg-theta-1-${Date.now()}`, name: 'NIFTY 23 JAN 22000 CE', action: 'SELL', ltp: 446.50, price: 446.50, lot: restartConfirmStrategy.lots || 10, lotSize: 50, createdDate: createdDateFormatted, status: 'Executed', refNo: '12345684' },
        { id: `leg-theta-2-${Date.now()}`, name: 'NIFTY 23 JAN 22000 PE', action: 'SELL', ltp: 410.20, price: 410.20, lot: restartConfirmStrategy.lots || 10, lotSize: 50, createdDate: createdDateFormatted, status: 'Executed', refNo: '12345685' }
      ] : [
        { id: `leg-def-1-${Date.now()}`, name: 'NIFTY 23 JAN 22300 CALL', action: 'BUY', ltp: 1135.9, price: 1370, lot: 1, lotSize: 75, createdDate: createdDateFormatted, status: 'Executed', refNo: '12345678' },
        { id: `leg-def-2-${Date.now()}`, name: 'NIFTY 23 JAN 22300 CALL', action: 'SELL', ltp: 1135.9, price: 1370, lot: 1, lotSize: 75, createdDate: createdDateFormatted, status: 'Executed', refNo: '12345679' }
      ];

    const strategyTitle = restartConfirmStrategy.title || (isTheta ? 'Nifty Theta' : 'Smart Trading');
    const cleanTags = (restartConfirmStrategy.tags || (isTheta ? ['RESEARCH BACKED', 'INTRADAY'] : ['LOCK PROFIT & TRAIL', 'INTRADAY', 'MULTILEG']))
      .filter(t => !/multileg/i.test(t) && !/clone/i.test(t));

    const newRunningStrategy = {
      id: 'run-' + Date.now(),
      title: strategyTitle,
      startTime: `${dateStr} - ${timeStr}`,
      endTime: `${dateStr} - 03:30PM`,
      tags: cleanTags.length > 0 ? cleanTags.slice(0, 2) : (isTheta ? ['RESEARCH BACKED', 'INTRADAY'] : ['LOCK PROFIT & TRAIL', 'INTRADAY', 'MULTILEG']),
      totalPnl: isTheta ? '₹1,000' : undefined,
      bookedPnl: isTheta ? '₹1,000' : undefined,
      items: itemsToStart,
      itemCount: itemsToStart.length,
      lots: restartConfirmStrategy.lots || (isTheta ? 10 : 1),
      maxProfit: restartConfirmStrategy.maxProfit || 500000,
      stoploss: restartConfirmStrategy.stoploss || 500000,
      thresholds: restartConfirmStrategy.thresholds || {
        maxLoss: isTheta ? 500000 : 500,
        maxProfit: isTheta ? 500000 : 1000,
        whenProfit: isTheta ? null : 50,
        lockProfit: isTheta ? null : 50
      }
    };

    setCompletedStrategies(prev => prev.filter(s => s.id !== restartConfirmStrategy.id));
    setRunningStrategies(prev => [newRunningStrategy, ...prev]);
    setRestartConfirmStrategy(null);
    setActiveTab('running');

    showToast(`Your order for ${strategyTitle} has been placed successfully. To know more visit your Running Strategy`);
  };

  const handleDeleteCompletedStrategy = (item) => {
    setSelectedDeleteStrategy(item);
    setIsDeleteModalOpen(true);
    setOpenRunningMenuId(null);
  };

  const handleConfirmDeleteStrategy = () => {
    if (!selectedDeleteStrategy) return;
    const deletedTitle = selectedDeleteStrategy.title || 'Strategy';
    setCompletedStrategies((prev) => prev.filter((s) => s.id !== selectedDeleteStrategy.id));
    showToast(`Deleted strategy "${deletedTitle}"`);
    setIsDeleteModalOpen(false);
    setSelectedDeleteStrategy(null);
  };

  const closeModal = () => {
    setActiveModal(null);
    setSelectedStrategy(null);
    setTradeConfirmed(false);
  };

  const totalActiveFilters =
    selectedExchanges.length +
    selectedTypes.length +
    selectedAssetClasses.length +
    selectedTrends.length;

  // Filter & Sort computation
  const filteredStrategies = strategiesList
    .filter((strategy) => {
      // 1. Tab filter
      if (activeTab === 'favourites') {
        if (!strategy.isFavourite) return false;
      } else if (activeTab !== 'strategies') {
        return false;
      }


      // 2. Exchange filter
      if (selectedExchanges.length > 0) {
        if (!selectedExchanges.includes(strategy.exchange)) return false;
      }

      // 3. Type filter
      if (selectedTypes.length > 0) {
        if (!selectedTypes.includes(strategy.type)) return false;
      }

      // 4. Asset Class filter
      if (selectedAssetClasses.length > 0) {
        if (!selectedAssetClasses.includes(strategy.assetClass)) return false;
      }

      // 5. Trend filter
      if (selectedTrends.length > 0) {
        if (!selectedTrends.includes(strategy.trend)) return false;
      }

      return true;
    })
    .sort((a, b) => {
      if (selectedSort === 'min_capital') {
        return a.minAmountVal - b.minAmountVal;
      }
      if (selectedSort === 'popular') {
        return b.popularity - a.popularity;
      }
      if (selectedSort === 'latest') {
        return new Date(b.dateAdded) - new Date(a.dateAdded);
      }
      return 0;
    });

  if (activeTradeStrategy) {
    return (
      <SmartTrading
        strategy={activeTradeStrategy}
        onBack={() => setActiveTradeStrategy(null)}
        onStartSuccess={(newRunningStrategy) => {
          if (newRunningStrategy) {
            setRunningStrategies(prev => [newRunningStrategy, ...prev]);
            if (activeTradeStrategy?.actionOrigin === 'restart' && activeTradeStrategy?.clonedFrom) {
              setCompletedStrategies(prev => prev.filter(s => s.id !== activeTradeStrategy.clonedFrom));
            }
          }
          setActiveTradeStrategy(null);
          setActiveTab('running');
          const strategyName = activeTradeStrategy?.title || 'Smart Trade';
          showToast(`Your order for ${strategyName} has been placed successfully. To know more visit your Running Strategy`);
        }}
      />
    );
  }

  return (
    <div className="strategies-page">
      {/* Top Announcement Ticker Bar */}
      <div className="top-announcement-bar">
        <div className="announcement-text">
          Now, you can use Shares as Margin facility for trading in Margin Plus also. With Shares as Margin, you can create limits from your existing stock holdings and capitalize market
        </div>

      </div>

      {/* Top Banners Section (Spring - Algo Trading & Upcoming Webinars) */}
      <div className="top-banners-container">
        {/* Spring Algo Trading Card */}
        <div className={`banner-card spring-algo-card ${!hasWebinar ? 'banner-card--full' : ''}`}>
          <div className="banner-card-content">
            <h2 className="banner-card-title">Spring - Algo Trading</h2>
            <p className="banner-card-desc">
              <strong>Research-driven hedge strategies</strong> platform supported by <strong>ICICI Research,</strong> featuring <strong>stop-loss mechanisms</strong> and <strong>real-time Profit and Loss</strong>
            </p>
          </div>
          <div
            className="banner-card-media banner-card-media--clickable"
            onClick={() => handleOpenVideo('Learn the Art of Algorithmic Trading', 'https://www.youtube.com/watch?v=D2-JUtHHGeM')}
            title="Watch Video: Learn the Art of Algorithmic Trading"
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                handleOpenVideo('Learn the Art of Algorithmic Trading', 'https://www.youtube.com/watch?v=D2-JUtHHGeM');
              }
            }}
          >
            <img src={springAlgoSvg} alt="Learn the Art of Algorithmic Trading" className="spring-algo-svg" />
            <div className="banner-media-play-overlay">
              <span className="banner-media-play-badge">
                <svg width="12" height="14" viewBox="0 0 14 18" fill="#FFFFFF" xmlns="http://www.w3.org/2000/svg">
                  <path d="M0.75 15.2108V2.28867C0.75 0.947598 2.66217 0.250658 3.83794 1.16319L12.1628 7.62428C12.9457 8.23192 12.9457 9.26759 12.1628 9.87523L3.83793 16.3363C2.66217 17.2489 0.75 16.5519 0.75 15.2108Z" fill="#FFFFFF" stroke="#FFFFFF" strokeWidth="0.5" />
                </svg>
                <span>Watch</span>
              </span>
            </div>
          </div>
        </div>

        {/* Upcoming Webinars Card (Conditional - shown if hasWebinar is true) */}
        {hasWebinar && (
          <div className="banner-card webinar-card">
            <div className="webinar-card-header">
              <div className="webinar-title-container">
                <span className="webinar-icon">
                  <img src={soundSvg} alt="Webinar" />
                </span>
                <h3 className="webinar-title">Upcoming Webinars</h3>
              </div>
              <button className="webinar-register-btn" onClick={() => showToast('Webinar registration opened!')}>
                Register Now
              </button>
            </div>
            <div className="webinar-content">
              <p className="webinar-desc">
                Webinar description lorum ipsum scrisvr lorum ipsum.
              </p>
              <div className="webinar-footer">
                Date: 20 Sept 2025 | Time: 1pm onwards
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Main Strategies Section (Separate White Card Container) */}
      <div className="strategies-main-card">

        {/* Top Header Control Bar (Single Row matching user screenshot) */}
        <div className="strategies-header-bar">
          {/* Left Tabs */}
          <div className="strategies-tabs">
            <button
              className={`tab-btn ${activeTab === 'strategies' ? 'tab-btn--active' : ''}`}
              onClick={() => setActiveTab('strategies')}
            >
              Strategies
            </button>

            <button
              className={`tab-btn ${activeTab === 'favourites' ? 'tab-btn--active' : ''}`}
              onClick={() => setActiveTab('favourites')}
            >
              My Favourites
            </button>

            <button
              className={`tab-btn ${activeTab === 'running' ? 'tab-btn--active' : ''}`}
              onClick={() => setActiveTab('running')}
            >
              Running Strategies <span className="tab-badge">{runningStrategies.length}</span>
            </button>

            <button
              className={`tab-btn ${activeTab === 'completed' ? 'tab-btn--active' : ''}`}
              onClick={() => setActiveTab('completed')}
            >
              Completed Strategies <span className="tab-badge">{completedStrategies.length}</span>
            </button>
          </div>

          {/* Right Tool Controls (Grid/List Toggle, Sort By, Filter) */}
          <div className="strategies-controls">
            {/* View Mode Toggle (Grid vs List) */}
            <div className="view-toggle">
              <button
                className={`toggle-btn ${viewMode === 'grid' ? 'active' : ''}`}
                onClick={() => setViewMode('grid')}
                title="Grid View"
                aria-label="Grid View"
              >
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <rect x="2.5" y="2.5" width="4.5" height="4.5" rx="1.2" stroke="currentColor" strokeWidth="1.2" />
                  <rect x="9" y="2.5" width="4.5" height="4.5" rx="1.2" stroke="currentColor" strokeWidth="1.2" />
                  <rect x="2.5" y="9" width="4.5" height="4.5" rx="1.2" stroke="currentColor" strokeWidth="1.2" />
                  <rect x="9" y="9" width="4.5" height="4.5" rx="1.2" stroke="currentColor" strokeWidth="1.2" />
                </svg>
              </button>
              <button
                className={`toggle-btn ${viewMode === 'list' ? 'active' : ''}`}
                onClick={() => setViewMode('list')}
                title="List View"
                aria-label="List View"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M4 6C4 5.46957 4.21071 4.96086 4.58579 4.58579C4.96086 4.21071 5.46957 4 6 4H18C18.5304 4 19.0391 4.21071 19.4142 4.58579C19.7893 4.96086 20 5.46957 20 6V8C20 8.53043 19.7893 9.03914 19.4142 9.41421C19.0391 9.78929 18.5304 10 18 10H6C5.46957 10 4.96086 9.78929 4.58579 9.41421C4.21071 9.03914 4 8.53043 4 8V6Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M4 16C4 15.4696 4.21071 14.9609 4.58579 14.5858C4.96086 14.2107 5.46957 14 6 14H18C18.5304 14 19.0391 14.2107 19.4142 14.5858C19.7893 14.9609 20 15.4696 20 16V18C20 18.5304 19.7893 19.0391 19.4142 19.4142C19.0391 19.7893 18.5304 20 18 20H6C5.46957 20 4.96086 19.7893 4.58579 19.4142C4.21071 19.0391 4 18.5304 4 18V16Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
            </div>

            {/* Sort By Dropdown */}
            <div className="dropdown-wrapper" ref={sortRef}>
              <button
                className={`control-dropdown-btn sort-dropdown-btn ${isSortOpen ? 'active' : ''}`}
                onClick={() => {
                  setIsSortOpen(!isSortOpen);
                  setIsFilterOpen(false);
                }}
              >
                <span className="sort-btn-text">
                  Sort by: {sortOptions.find((o) => o.value === selectedSort)?.label}
                </span>
                <img
                  src={dropdownIcon}
                  alt="dropdown"
                  className={`chevron-icon ${isSortOpen ? 'rotated' : ''}`}
                />
              </button>

              {isSortOpen && (
                <div className="dropdown-menu sort-menu">
                  {sortOptions.map((opt) => (
                    <div
                      key={opt.value}
                      className={`radio-option ${selectedSort === opt.value ? 'selected' : ''}`}
                      onClick={() => {
                        setSelectedSort(opt.value);
                        setIsSortOpen(false);
                      }}
                    >
                      <span className={`radio-circle ${selectedSort === opt.value ? 'checked' : ''}`}>
                        {selectedSort === opt.value && <span className="radio-inner-dot" />}
                      </span>
                      <span className="radio-label">{opt.label}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Filter Dropdown */}
            <div className="dropdown-wrapper" ref={filterRef}>
              <button
                className={`control-dropdown-btn filter-dropdown-btn ${isFilterOpen || totalActiveFilters > 0 ? 'active' : ''}`}
                onClick={openFilterPopover}
              >
                <svg width="18" height="18" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="2" y1="4" x2="18" y2="4" />
                  <circle cx="13" cy="4" r="2.2" fill="#ffffff" stroke="currentColor" strokeWidth="1.6" />
                  <line x1="2" y1="10" x2="18" y2="10" />
                  <circle cx="7" cy="10" r="2.2" fill="#ffffff" stroke="currentColor" strokeWidth="1.6" />
                  <line x1="2" y1="16" x2="18" y2="16" />
                  <circle cx="14" cy="16" r="2.2" fill="#ffffff" stroke="currentColor" strokeWidth="1.6" />
                </svg>
                <span>Filter</span>
                {totalActiveFilters > 0 && <span className="filter-badge-dot">{totalActiveFilters}</span>}
              </button>

              {isFilterOpen && (
                <div className="dropdown-menu filter-menu">
                  <div className="filter-header">
                    <span className="filter-title">Filters</span>
                    <button className="clear-all-btn" onClick={clearAllFilters}>
                      Clear All
                    </button>
                  </div>

                  <div className="filter-content">
                    {/* Exchange Section */}
                    <div className="filter-section">
                      <div className="filter-section-title">Exchange</div>
                      <div className="checkbox-group">
                        {['NSE', 'BSE'].map((ex) => (
                          <label key={ex} className="checkbox-option">
                            <input
                              type="checkbox"
                              checked={draftExchanges.includes(ex)}
                              onChange={() => toggleDraftExchange(ex)}
                            />
                            <span className="custom-checkbox"></span>
                            <span className="checkbox-label">{ex}</span>
                          </label>
                        ))}
                      </div>
                    </div>

                    <div className="filter-divider" />

                    {/* Type Section */}
                    <div className="filter-section">
                      <div className="filter-section-title">Type</div>
                      <div className="checkbox-group">
                        {[
                          'Intraday',
                          'High Frequency',
                          'Expiry Trading',
                          'Theta Decay'
                        ].map((t) => (
                          <label key={t} className="checkbox-option">
                            <input
                              type="checkbox"
                              checked={draftTypes.includes(t)}
                              onChange={() => toggleDraftType(t)}
                            />
                            <span className="custom-checkbox"></span>
                            <span className="checkbox-label">{t}</span>
                          </label>
                        ))}
                      </div>
                    </div>

                    <div className="filter-divider" />

                    {/* Asset Class Section */}
                    <div className="filter-section">
                      <div className="filter-section-title">Asset Class</div>
                      <div className="checkbox-group">
                        {['Options', 'Futures', 'Stocks'].map((ac) => (
                          <label key={ac} className="checkbox-option">
                            <input
                              type="checkbox"
                              checked={draftAssetClasses.includes(ac)}
                              onChange={() => toggleDraftAssetClass(ac)}
                            />
                            <span className="custom-checkbox"></span>
                            <span className="checkbox-label">{ac}</span>
                          </label>
                        ))}
                      </div>
                    </div>

                    <div className="filter-divider" />

                    {/* Trend Section */}
                    <div className="filter-section">
                      <div className="filter-section-title">Trend</div>
                      <div className="checkbox-group">
                        {['Bullish', 'Bearish', 'Neutral'].map((tr) => (
                          <label key={tr} className="checkbox-option">
                            <input
                              type="checkbox"
                              checked={draftTrends.includes(tr)}
                              onChange={() => toggleDraftTrend(tr)}
                            />
                            <span className="custom-checkbox"></span>
                            <span className="checkbox-label">{tr}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Apply Button */}
                  <div className="filter-footer">
                    <button className="filter-apply-btn" onClick={applyFilters}>
                      Apply
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Main Content: Running Tab vs Completed Tab vs Filtered Strategies Grid */}
        {activeTab === 'running' ? (
          <div className="running-tab-content">
            {/* Day's P&L Card */}
            <div className="days-pnl-card">
              <span className="days-pnl-label">Day's P&L</span>
              <span className="days-pnl-val">+1,000</span>
            </div>

            {/* Running Strategies List */}
            <div className="running-strategies-list">
              {runningStrategies.length === 0 ? (
                <div className="empty-state">
                  <div className="empty-icon">⚡</div>
                  <h3>No Running Strategies</h3>
                  <p>You have no strategies currently running. Go to Strategies tab and start a Smart Trade.</p>
                </div>
              ) : (
                runningStrategies.map((item) => (
                  <div key={item.id} className="running-strategy-card">
                    <div className="running-card-left">
                      <div className="running-title-row">
                        <h4 className="running-card-title">{item.title}</h4>
                        {!(item.title && item.title.toLowerCase().includes('theta')) && (
                          <span className="running-status-badge">RUNNING</span>
                        )}
                      </div>
                      <div className="running-card-tags">
                        {(item.tags || []).map((tag, idx) => (
                          <span
                            key={idx}
                            className={`running-tag ${idx === 0 ? 'running-tag--orange' : 'running-tag--gray'}`}
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>

                    {item.title && item.title.toLowerCase().includes('theta') ? (
                      <div className="running-card-pnl">
                        <div className="pnl-row-item">
                          <span className="pnl-label">Total P&L</span>
                          <span className="pnl-val">{item.totalPnl || '₹1,000'}</span>
                        </div>
                        <div className="pnl-row-item">
                          <span className="pnl-label">Booked/ Realised P&L</span>
                          <span className="pnl-val">{item.bookedPnl || '₹1,000'}</span>
                        </div>
                      </div>
                    ) : (
                      <div className="running-card-mid">
                        <div className="running-notice-pill">
                          Orders will be placed automatically once order criteria are satisfied.
                        </div>
                      </div>
                    )}

                    <div className="running-card-right">
                      <div className="running-timings">
                        <div className="timing-item">
                          <span className="timing-label">Start Time</span>
                          <span className="timing-val">{item.startTime}</span>
                        </div>
                        <div className="timing-item">
                          <span className="timing-label">End Time</span>
                          <span className="timing-val">{item.endTime}</span>
                        </div>
                      </div>
                      <div className="running-actions">
                        <button
                          className="btn-running-action btn-trades"
                          onClick={() => {
                            setSelectedTradesStrategy(item);
                            setIsTradesModalOpen(true);
                          }}
                        >
                          Trades
                        </button>
                        <button
                          className="btn-running-action btn-stop"
                          onClick={() => {
                            setSelectedStopStrategy(item);
                            setIsStopModalOpen(true);
                          }}
                        >
                          Stop
                        </button>
                        <div className="running-more-wrapper">
                          <button
                            className={`btn-running-more ${openRunningMenuId === item.id ? 'active' : ''}`}
                            onClick={(e) => {
                              e.stopPropagation();
                              setOpenRunningMenuId(openRunningMenuId === item.id ? null : item.id);
                            }}
                            title="More options"
                          >
                            ⋮
                          </button>
                          {openRunningMenuId === item.id && (
                            <div className="running-more-menu" onClick={(e) => e.stopPropagation()}>
                              <div className="running-menu-item" onClick={() => handleCloneToSmartTrade(item, 'replicate')}>
                                Replicate
                              </div>
                              <div className="running-menu-divider" />
                              <div
                                className="running-menu-item"
                                onClick={() => {
                                  setSelectedPositionStrategy(item);
                                  setIsPositionModalOpen(true);
                                  setOpenRunningMenuId(null);
                                }}
                              >
                                Position
                              </div>
                              <div className="running-menu-divider" />
                              <div className="running-menu-item" onClick={() => { showToast(`Viewing performance for ${item.title}`); setOpenRunningMenuId(null); }}>
                                Performance
                              </div>
                              <div className="running-menu-divider" />
                              <div
                                className="running-menu-item"
                                onClick={() => {
                                  setSelectedTradesStrategy(item);
                                  setIsTradesModalOpen(true);
                                  setOpenRunningMenuId(null);
                                }}
                              >
                                Trades
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        ) : activeTab === 'completed' ? (
          <div className="completed-tab-content">
            <div className="completed-strategies-list">
              {completedStrategies.length === 0 ? (
                <div className="empty-state">
                  <div className="empty-icon">✅</div>
                  <h3>No Completed Strategies</h3>
                  <p>You have no completed strategies yet.</p>
                </div>
              ) : (
                completedStrategies.map((item) => (
                  <div key={item.id} className="completed-strategy-card">
                    <div className="completed-card-left">
                      <div className="completed-title-row">
                        <h4 className="completed-card-title">{item.title}</h4>
                        <span className="completed-status-badge">COMPLETED</span>
                      </div>
                      <div className="completed-card-tags">
                        {(item.tags || []).map((tag, idx) => (
                          <span
                            key={idx}
                            className={`completed-tag ${idx === 0 ? 'completed-tag--orange' : 'completed-tag--gray'}`}
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="completed-card-pnl">
                      <div className="pnl-row-item">
                        <span className="pnl-label">Total P&L</span>
                        <span className="pnl-val">{item.totalPnl || '₹1,000'}</span>
                      </div>
                      <div className="pnl-row-item">
                        <span className="pnl-label">Booked/ Realised P&L</span>
                        <span className="pnl-val">{item.bookedPnl || '₹1,000'}</span>
                      </div>
                    </div>

                    <div className="completed-card-timings">
                      <div className="timing-row-item">
                        <span className="completed-timing-label">Start Time</span>
                        <span className="completed-timing-val">{item.startTime}</span>
                      </div>
                      <div className="timing-row-item">
                        <span className="completed-timing-label">End Time</span>
                        <span className="completed-timing-val">{item.endTime}</span>
                      </div>
                    </div>

                    <div className="completed-card-right">
                      <button
                        className="btn-completed-action btn-trades"
                        onClick={() => {
                          setSelectedTradesStrategy(item);
                          setIsTradesModalOpen(true);
                        }}
                      >
                        Trades
                      </button>
                      <button
                        className="btn-completed-action"
                        onClick={() => handleCloneToSmartTrade(item, 'replicate')}
                      >
                        Replicate
                      </button>

                      <div className="running-more-wrapper">
                        <button
                          className={`completed-more-btn ${openRunningMenuId === item.id ? 'active' : ''}`}
                          onClick={(e) => {
                            e.stopPropagation();
                            setOpenRunningMenuId(openRunningMenuId === item.id ? null : item.id);
                          }}
                          title="More options"
                        >
                          ⋮
                        </button>
                        {openRunningMenuId === item.id && (
                          <div className="running-more-menu" onClick={(e) => e.stopPropagation()}>
                            <div
                              className="running-menu-item"
                              onClick={() => {
                                showToast(`Viewing performance for ${item.title}`);
                                setOpenRunningMenuId(null);
                              }}
                            >
                              Performance
                            </div>
                            <div className="running-menu-divider" />
                            <div
                              className="running-menu-item"
                              onClick={() => handleRestartCompletedStrategy(item)}
                            >
                              Restart
                            </div>
                            <div className="running-menu-divider" />
                            <div
                              className="running-menu-item"
                              onClick={() => handleDeleteCompletedStrategy(item)}
                            >
                              Delete
                            </div>
                            <div className="running-menu-divider" />
                            <div
                              className="running-menu-item"
                              onClick={() => {
                                setSelectedTradesStrategy(item);
                                setIsTradesModalOpen(true);
                                setOpenRunningMenuId(null);
                              }}
                            >
                              Trades
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        ) : filteredStrategies.length > 0 ? (
          <div className={viewMode === 'grid' ? 'strategies-grid' : 'strategies-list'}>
            {filteredStrategies.map((strategy) => (
              <StrategyCard
                key={strategy.id}
                strategy={strategy}
                viewMode={viewMode}
                onTrade={handleTrade}
                onNiftyThetaTrade={handleNiftyThetaTrade}
                onKnowMore={handleKnowMore}
                onPlay={handlePlay}
                onToggleBookmark={handleToggleBookmark}
              />
            ))}
          </div>
        ) : (
          <div className="empty-state">
            <div className="empty-icon">🔍</div>
            <h3>No Strategies Found</h3>
            <p>Try adjusting your search query, filters, or active tab.</p>
            <button className="modal-btn-primary" style={{ marginTop: '12px' }} onClick={clearAllFilters}>
              Clear All Filters
            </button>
          </div>
        )}
      </div>

      {/* Toast Notification */}
      {toastMessage && (
        <div className="smart-toast-notification" id="app-toast-notification">
          <img src={statusIcon} alt="status" className="toast-status-icon" />
          <div className="toast-text-content">
            {toastMessage.includes('Your order for') ? (
              <>
                <span>
                  Your order for {toastMessage.includes('Nifty Theta') ? 'Nifty Theta' : (toastMessage.match(/Your order for (.*?) has been placed/)?.[1] || 'Smart Trade')} has been placed
                </span>
                <span>successfully. To know more visit your Running</span>
                <span>Strategy</span>
              </>
            ) : (
              <span>{toastMessage}</span>
            )}
          </div>
        </div>
      )}

      {/* "Know More" Backtester Modal */}
      {activeModal === 'knowMore' && selectedStrategy && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-container know-more-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">{selectedStrategy.title}</h3>
              <div className="modal-header-actions">
                <button
                  className="play-video-btn"
                  onClick={() => handlePlay(selectedStrategy)}
                >
                  <svg width="16" height="16" viewBox="0 0 14 18" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M0.75 15.2108V2.28867C0.75 0.947598 2.66217 0.250658 3.83794 1.16319L12.1628 7.62428C12.9457 8.23192 12.9457 9.26759 12.1628 9.87523L3.83793 16.3363C2.66217 17.2489 0.75 16.5519 0.75 15.2108Z" stroke="#E3530F" strokeWidth="1.5" />
                  </svg>
                  <span>Play Video</span>
                </button>
                <button className="modal-close-btn" onClick={closeModal} title="Close" aria-label="Close">
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M1.5 1.5L12.5 12.5M12.5 1.5L1.5 12.5" stroke="#353535" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </button>
              </div>
            </div>

            <div className="modal-body">
              <h4 className="modal-section-title">Description</h4>
              <p className="modal-text">
                This strategy enables automated trade management using parameters like Lock Profit, Max Profit, and Max Loss. It helps manage risk and preserve gains by exiting trades when predefined thresholds are met.
              </p>

              <div className="modal-meta-list">
                <p className="modal-meta-item">
                  <strong>Trading Time: </strong>
                  <span>{selectedStrategy.details?.tradingTime || '9:15 AM to 3:20 PM'}</span>
                </p>
                <p className="modal-meta-item">
                  <strong>Exit Mechanism: </strong>
                  <span>{selectedStrategy.details?.adjustments || 'Auto-square-off based on user-defined thresholds'}</span>
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
              {Boolean(
                selectedStrategy.id === 'smart-trading' ||
                selectedStrategy.title?.toLowerCase().includes('smart')
              ) ? (
                <button
                  className="modal-btn-trade"
                  onClick={() => {
                    const strat = selectedStrategy;
                    closeModal();
                    handleTrade(strat);
                  }}
                >
                  Trade
                </button>
              ) : (
                <>
                  <button className="modal-btn-cancel" onClick={closeModal}>
                    Cancel
                  </button>
                  <button
                    className="modal-btn-test"
                    onClick={() => {
                      const strat = selectedStrategy;
                      closeModal();
                      setReportStrategy(strat);
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

      {/* "Trade" Order Modal */}
      {activeModal === 'trade' && selectedStrategy && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-container" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">
                {!tradeConfirmed ? `${selectedStrategy.title}` : 'Order Confirmation'}
              </h3>
              <button className="modal-close-btn" onClick={closeModal}>✕</button>
            </div>

            <div className="modal-body">
              {!tradeConfirmed ? (
                <>
                  <div className="strategy-card__tags" style={{ marginBottom: '16px' }}>
                    {selectedStrategy.tags.map((tag, idx) => (
                      <span key={idx} className={`strategy-tag ${idx === 0 ? 'strategy-tag--orange' : 'strategy-tag--default'}`}>
                        {tag}
                      </span>
                    ))}
                  </div>

                  <h4 className="modal-section-title">Description</h4>
                  <p className="modal-text" style={{ marginBottom: '20px' }}>
                    {selectedStrategy.description}
                  </p>

                  <div style={{ background: '#f8f9fa', padding: '16px', borderRadius: '8px', border: '1px solid #e2e8f0', marginBottom: '20px' }}>
                    <label style={{ fontSize: '13px', fontWeight: '600', color: '#1e293b', display: 'block', marginBottom: '8px' }}>
                      Lots
                    </label>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <button
                        style={{ width: '32px', height: '32px', border: '1px solid #cbd5e1', borderRadius: '4px', background: '#fff', cursor: 'pointer', fontWeight: 'bold' }}
                        onClick={() => setLots(Math.max(1, lots - 1))}
                      >
                        -
                      </button>
                      <span style={{ fontSize: '16px', fontWeight: '600', width: '40px', textAlign: 'center' }}>{lots}</span>
                      <button
                        style={{ width: '32px', height: '32px', border: '1px solid #cbd5e1', borderRadius: '4px', background: '#fff', cursor: 'pointer', fontWeight: 'bold' }}
                        onClick={() => setLots(lots + 1)}
                      >
                        +
                      </button>
                    </div>
                  </div>

                  <div className="modal-detail-row">
                    <span className="modal-detail-label">Exchange</span>
                    <span className="modal-detail-value">{selectedStrategy.exchange}</span>
                  </div>
                  <div className="modal-detail-row">
                    <span className="modal-detail-label">Max. Margin</span>
                    <span className="modal-detail-value">₹{selectedStrategy.minAmount}</span>
                  </div>
                  <div className="modal-detail-row">
                    <span className="modal-detail-label">Initial Margin ({lots} lot{lots > 1 ? 's' : ''})</span>
                    <span className="modal-detail-value">
                      ₹{(parseInt(selectedStrategy.minAmount.replace(/,/g, ''), 10) * 0.65 * lots).toLocaleString('en-IN')}
                    </span>
                  </div>
                </>
              ) : (
                <div style={{ textAlign: 'center', padding: '20px 0' }}>
                  <div style={{ fontSize: '48px', marginBottom: '12px' }}>✅</div>
                  <h3 style={{ fontSize: '18px', fontWeight: '700', color: '#1e293b', marginBottom: '8px' }}>
                    Strategy Started!
                  </h3>
                  <p className="modal-text">
                    Your automated trading order for <strong>{selectedStrategy.title}</strong> ({lots} Lot{lots > 1 ? 's' : ''}) has been successfully submitted.
                  </p>
                </div>
              )}
            </div>

            <div className="modal-footer">
              {!tradeConfirmed ? (
                <>
                  <button className="modal-btn-secondary" onClick={closeModal}>Cancel</button>
                  <button
                    className="modal-btn-primary"
                    onClick={() => setTradeConfirmed(true)}
                  >
                    Proceed
                  </button>
                </>
              ) : (
                <button
                  className="modal-btn-primary"
                  onClick={() => {
                    if (selectedStrategy) {
                      const now = new Date();
                      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
                      const day = String(now.getDate()).padStart(2, '0');
                      const month = months[now.getMonth()];
                      const year = now.getFullYear();
                      let hours = now.getHours();
                      const minutes = String(now.getMinutes()).padStart(2, '0');
                      const ampm = hours >= 12 ? 'PM' : 'AM';
                      hours = hours % 12 || 12;
                      const timeStr = `${String(hours).padStart(2, '0')}:${minutes}${ampm}`;
                      const formattedStartTime = `${day} ${month} ${year} - ${timeStr}`;

                      const newRunningStrategy = {
                        id: 'run-' + Date.now(),
                        title: selectedStrategy.title,
                        startTime: formattedStartTime,
                        endTime: `${day} ${month} ${year} - 03:30PM`,
                        tags: selectedStrategy.tags && selectedStrategy.tags.length > 0
                          ? selectedStrategy.tags
                          : ['RESEARCH BACKED', 'INTRADAY'],
                        items: [
                          { id: 't1', name: `${selectedStrategy.title} OPTION`, action: 'BUY', ltp: 446.50, price: 446.50, lot: lots, createdDate: `${day} ${month} ${year} ${timeStr}`, status: 'Executed', refNo: '12345678' }
                        ]
                      };
                      setRunningStrategies(prev => [newRunningStrategy, ...prev]);
                    }
                    closeModal();
                    setActiveTab('running');
                    showToast(`${selectedStrategy?.title || 'Strategy'} started and added to Running Strategies`);
                  }}
                >
                  Close
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Trades Popup Modal */}
      {isTradesModalOpen && selectedTradesStrategy && (
        <div className="modal-overlay" onClick={() => setIsTradesModalOpen(false)}>
          <div className="trades-modal-container" onClick={(e) => e.stopPropagation()}>
            <div className="trades-modal-header">
              <h2 className="trades-modal-title">Trades {selectedTradesStrategy.title}</h2>
              <button className="trades-modal-close" onClick={() => setIsTradesModalOpen(false)} aria-label="Close">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
            </div>

            <div className="trades-modal-body">
              <div className="trades-table-container">
                <div className="trades-table-header">
                  <div className="trades-col-date">Created Date</div>
                  <div className="trades-header-contract">Symbol/Contract</div>
                  <div className="trades-col-qty">Qty</div>
                  <div className="trades-col-price">Traded Price</div>
                  <div className="trades-col-trigger">Trigger Price</div>
                  <div className="trades-col-status">Status</div>
                  <div className="trades-col-ref">Order ref no</div>
                </div>

                <div className="trades-table-body">
                  {selectedTradesStrategy.items && selectedTradesStrategy.items.length > 0 ? (
                    selectedTradesStrategy.items.map((tradeItem, index) => (
                      <div key={tradeItem.id || index} className="trades-table-row">
                        <div className="trades-col-date">
                          {tradeItem.createdDate || selectedTradesStrategy.startTime}
                        </div>

                        <div className="trades-col-contract">
                          <span className={`trades-action-badge ${tradeItem.action ? tradeItem.action.toLowerCase() : 'buy'}`}>
                            {tradeItem.action || 'BUY'}
                          </span>
                          <span className="trades-contract-name">{tradeItem.name}</span>
                          <span className="trades-contract-type">OPTION</span>
                        </div>

                        <div className="trades-col-qty">
                          {tradeItem.lot ? `${tradeItem.lot * 50}/${tradeItem.lot * 50}` : '50/50'}
                        </div>

                        <div className="trades-col-price">
                          {typeof tradeItem.price === 'number' ? tradeItem.price.toFixed(2) : (tradeItem.price || tradeItem.ltp || '446.50')}
                        </div>

                        <div className="trades-col-trigger">
                          {typeof tradeItem.price === 'number' ? tradeItem.price.toFixed(2) : (tradeItem.price || tradeItem.ltp || '446.50')}
                        </div>

                        <div className="trades-col-status">
                          <span className={`trades-status-tag ${tradeItem.status ? tradeItem.status.toLowerCase() : 'executed'}`}>
                            {tradeItem.status || 'Executed'}
                          </span>
                        </div>

                        <div className="trades-col-ref">
                          {tradeItem.refNo || (12345678 + index).toString()}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="trades-table-row">
                      <div className="trades-col-date">{selectedTradesStrategy.startTime}</div>
                      <div className="trades-col-contract">
                        <span className="trades-action-badge buy">BUY</span>
                        <span className="trades-contract-name">NIFTY 23 April 22100 CE</span>
                        <span className="trades-contract-type">OPTION</span>
                      </div>
                      <div className="trades-col-qty">50/50</div>
                      <div className="trades-col-price">446.50</div>
                      <div className="trades-col-trigger">446.50</div>
                      <div className="trades-col-status">
                        <span className="trades-status-tag executed">Executed</span>
                      </div>
                      <div className="trades-col-ref">12345678</div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Stop Strategy Confirmation Modal */}
      {isStopModalOpen && selectedStopStrategy && (
        <div className="modal-overlay" onClick={() => setIsStopModalOpen(false)}>
          <div className="stop-modal-container" onClick={(e) => e.stopPropagation()}>
            <div className="stop-modal-header">
              <h2 className="stop-modal-title">Stop {selectedStopStrategy.title}</h2>
              <button className="stop-modal-close" onClick={() => setIsStopModalOpen(false)} aria-label="Close">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
            </div>

            <div className="stop-modal-body">
              <p className="stop-modal-text">
                Are you sure you want to <strong>Stop</strong> {selectedStopStrategy.title} strategy
              </p>
              <p className="stop-modal-text">
                All your position create in this strategy will be squared-off immediately.
              </p>
            </div>

            <div className="stop-modal-footer">
              <button className="btn-stop-cancel" onClick={() => setIsStopModalOpen(false)}>
                Cancel
              </button>
              <button
                className="btn-stop-confirm"
                onClick={() => {
                  if (selectedStopStrategy) {
                    const now = new Date();
                    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
                    const day = String(now.getDate()).padStart(2, '0');
                    const month = months[now.getMonth()];
                    const year = now.getFullYear();
                    let hours = now.getHours();
                    const minutes = String(now.getMinutes()).padStart(2, '0');
                    const ampm = hours >= 12 ? 'PM' : 'AM';
                    hours = hours % 12 || 12;
                    const timeStr = `${String(hours).padStart(2, '0')}:${minutes}${ampm}`;
                    const formattedEndTime = `${day} ${month} ${year} - ${timeStr}`;

                    const stoppedCompletedItem = {
                      id: `comp-${Date.now()}`,
                      title: selectedStopStrategy.title,
                      status: 'COMPLETED',
                      tags: selectedStopStrategy.tags && selectedStopStrategy.tags.length > 0
                        ? selectedStopStrategy.tags
                        : ['RESEARCH BACKED', 'INTRADAY'],
                      totalPnl: '₹1,000',
                      bookedPnl: '₹1,000',
                      startTime: selectedStopStrategy.startTime || '09 Jan 2025 - 09:27AM',
                      endTime: formattedEndTime,
                      items: selectedStopStrategy.items || []
                    };

                    setCompletedStrategies(prev => [stoppedCompletedItem, ...prev]);
                    setRunningStrategies(prev => prev.filter(s => s.id !== selectedStopStrategy.id));
                    setIsStopModalOpen(false);
                    setActiveTab('completed');

                  }
                }}
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Strategy Confirmation Modal */}
      {isDeleteModalOpen && selectedDeleteStrategy && (
        <div className="modal-overlay" onClick={() => setIsDeleteModalOpen(false)}>
          <div className="delete-confirm-modal-container" onClick={(e) => e.stopPropagation()}>
            <div className="delete-confirm-modal-header">
              <h2 className="delete-confirm-modal-title">Delete {selectedDeleteStrategy.title}</h2>
              <button
                className="delete-confirm-modal-close"
                onClick={() => setIsDeleteModalOpen(false)}
                aria-label="Close"
              >
                <img src={closeIcon} alt="Close" className="delete-confirm-modal-close-icon" />
              </button>
            </div>

            <div className="delete-confirm-modal-body">
              <p className="delete-confirm-modal-text primary-desc">
                This will remove all the files related to your Algo. Please make sure you Booked have downloaded the files before deleting, in case you need them later.
              </p>
              <p className="delete-confirm-modal-text">
                Are you sure?
              </p>
            </div>

            <div className="delete-confirm-modal-footer">
              <button
                className="btn-delete-cancel"
                onClick={() => setIsDeleteModalOpen(false)}
              >
                Cancel
              </button>
              <button
                className="btn-delete-confirm"
                onClick={handleConfirmDeleteStrategy}
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Position Popup Modal */}
      {isPositionModalOpen && selectedPositionStrategy && (
        <div className="modal-overlay" onClick={() => setIsPositionModalOpen(false)}>
          <div className="position-modal-container" onClick={(e) => e.stopPropagation()}>
            <div className="position-modal-header">
              <h2 className="position-modal-title">Position {selectedPositionStrategy.title}</h2>
              <button className="position-modal-close" onClick={() => setIsPositionModalOpen(false)} aria-label="Close">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
            </div>

            <div className="position-modal-body">
              <div className="position-table-container">
                <div className="position-table-header">
                  <div className="position-col-contract">Symbol/ Contract</div>
                  <div className="position-col-qty">Quantity</div>
                  <div className="position-col-price">Last Price</div>
                  <div className="position-col-unrealised">Unrealised P&L</div>
                  <div className="position-col-realised">Realised P&L</div>
                </div>

                <div className="position-table-body">
                  {selectedPositionStrategy.items && selectedPositionStrategy.items.length > 0 ? (
                    selectedPositionStrategy.items.map((posItem, index) => (
                      <div key={posItem.id || index} className="position-table-row">
                        <div className="position-col-contract">
                          <span className={`position-action-badge ${posItem.action ? posItem.action.toLowerCase() : 'buy'}`}>
                            {posItem.action || 'BUY'}
                          </span>
                          <span className="position-contract-name">{posItem.name || 'NIFTY 23 April 22100 CE'}</span>
                          <span className="position-contract-type">OPTION</span>
                        </div>

                        <div className="position-col-qty">
                          {posItem.lot ? `${posItem.lot * 50}/${posItem.lot * 50}` : '50/50'}
                        </div>

                        <div className="position-col-price">
                          {typeof posItem.price === 'number' ? posItem.price.toFixed(2) : (posItem.price || posItem.ltp || '446.50')}
                        </div>

                        <div className="position-col-unrealised">
                          {posItem.unrealisedPnl || (typeof posItem.price === 'number' ? posItem.price.toFixed(2) : '446.50')}
                        </div>

                        <div className="position-col-realised">
                          {posItem.realisedPnl || (typeof posItem.price === 'number' ? posItem.price.toFixed(2) : '446.50')}
                        </div>
                      </div>
                    ))
                  ) : (
                    <>
                      <div className="position-table-row">
                        <div className="position-col-contract">
                          <span className="position-action-badge buy">BUY</span>
                          <span className="position-contract-name">NIFTY 23 April 22100 CE</span>
                          <span className="position-contract-type">OPTION</span>
                        </div>
                        <div className="position-col-qty">50/50</div>
                        <div className="position-col-price">446.50</div>
                        <div className="position-col-unrealised">446.50</div>
                        <div className="position-col-realised">446.50</div>
                      </div>
                      <div className="position-table-row">
                        <div className="position-col-contract">
                          <span className="position-action-badge buy">BUY</span>
                          <span className="position-contract-name">NIFTY 23 April 22100 CE</span>
                          <span className="position-contract-type">OPTION</span>
                        </div>
                        <div className="position-col-qty">50/50</div>
                        <div className="position-col-price">446.50</div>
                        <div className="position-col-unrealised">446.50</div>
                        <div className="position-col-realised">446.50</div>
                      </div>
                      <div className="position-table-row">
                        <div className="position-col-contract">
                          <span className="position-action-badge sell">SELL</span>
                          <span className="position-contract-name">NIFTY 23 April 22100 CE</span>
                          <span className="position-contract-type">OPTION</span>
                        </div>
                        <div className="position-col-qty">50/50</div>
                        <div className="position-col-price">446.50</div>
                        <div className="position-col-unrealised">446.50</div>
                        <div className="position-col-realised">446.50</div>
                      </div>
                      <div className="position-table-row">
                        <div className="position-col-contract">
                          <span className="position-action-badge buy">BUY</span>
                          <span className="position-contract-name">NIFTY 23 April 22100 CE</span>
                          <span className="position-contract-type">OPTION</span>
                        </div>
                        <div className="position-col-qty">50/50</div>
                        <div className="position-col-price">446.50</div>
                        <div className="position-col-unrealised">446.50</div>
                        <div className="position-col-realised">446.50</div>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* Order Confirmation Popup Modal for Restarted Smart Trading */}
      {restartConfirmStrategy && !restartConfirmStrategy.isTheta && (
        <div className="confirm-modal-overlay" onClick={() => setRestartConfirmStrategy(null)}>
          <div className="confirm-modal-container" onClick={(e) => e.stopPropagation()}>
            <div className="confirm-modal-header">
              <h2 className="confirm-modal-title">Order Confirmation</h2>
              <button
                className="confirm-modal-close"
                onClick={() => setRestartConfirmStrategy(null)}
                aria-label="Close"
              >
                ✕
              </button>
            </div>

            <div className="confirm-modal-body">
              <h3 className="confirm-section-title">{restartConfirmStrategy.title || 'Smart Trading'}</h3>

              <div className="confirm-table-container">
                <div className="confirm-table-header">
                  <span>Contract Name</span>
                  <span style={{ textAlign: 'center' }}>LTP</span>
                  <span style={{ textAlign: 'center' }}>Price</span>
                  <span style={{ textAlign: 'center' }}>Lot</span>
                </div>

                <div className="confirm-table-body">
                  {restartConfirmStrategy.restartItems.map((legItem) => (
                    <div key={legItem.id} className="confirm-table-row">
                      <div className="confirm-contract-cell">
                        <span className="confirm-item-name">{legItem.name}</span>
                        <span className={`confirm-action-badge ${legItem.action.toLowerCase()}`}>
                          {legItem.action}
                        </span>
                      </div>
                      <div className="col-ltp">{typeof legItem.ltp === 'number' ? legItem.ltp.toFixed(1) : legItem.ltp}</div>
                      <div className="col-center">
                        <div className="basket-stepper-box confirm-stepper">
                          <button
                            className="stepper-btn"
                            onClick={() => handleRestartItemPriceChange(legItem.id, -5)}
                          >
                            —
                          </button>
                          <input
                            type="text"
                            className="stepper-input"
                            value={legItem.price}
                            onChange={(e) => {
                              const val = parseFloat(e.target.value) || 0;
                              setRestartConfirmStrategy(prev => ({
                                ...prev,
                                restartItems: prev.restartItems.map(it => it.id === legItem.id ? { ...it, price: val } : it)
                              }));
                            }}
                          />
                          <button
                            className="stepper-btn"
                            onClick={() => handleRestartItemPriceChange(legItem.id, 5)}
                          >
                            +
                          </button>
                        </div>
                      </div>
                      <div className="confirm-lot-val">{(legItem.lot || 1) * (legItem.lotSize || 75)}</div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="confirm-summary-grid">
                <div className="confirm-summary-row">
                  <div className="confirm-summary-item">
                    <span className="confirm-summary-label">
                      Max Loss <img src={infoIcon} alt="info" className="info-icon" />
                    </span>
                    <span className="confirm-summary-val">{restartConfirmStrategy.thresholds?.maxLoss || 500}</span>
                  </div>
                  <div className="confirm-summary-item">
                    <span className="confirm-summary-label">
                      Max Profit <img src={infoIcon} alt="info" className="info-icon" />
                    </span>
                    <span className="confirm-summary-val">{restartConfirmStrategy.thresholds?.maxProfit || 1000}</span>
                  </div>
                  <div className="confirm-summary-item">
                    <span className="confirm-summary-label">
                      Start Time <img src={infoIcon} alt="info" className="info-icon" />
                    </span>
                    <span className="confirm-summary-val">9: 15</span>
                  </div>
                  <div className="confirm-summary-item">
                    <span className="confirm-summary-label">
                      End Time <img src={infoIcon} alt="info" className="info-icon" />
                    </span>
                    <span className="confirm-summary-val">15: 20</span>
                  </div>
                </div>

                <div className="confirm-summary-row">
                  <div className="confirm-summary-item">
                    <span className="confirm-summary-label">
                      Max. Margin <img src={infoIcon} alt="info" className="info-icon" />
                    </span>
                    <span className="confirm-summary-val">₹5,00,000</span>
                  </div>
                  <div className="confirm-summary-item">
                    <span className="confirm-summary-label">
                      Initial Margin <img src={infoIcon} alt="info" className="info-icon" />
                    </span>
                    <span className="confirm-summary-val">₹3794.50</span>
                  </div>
                  <div className="confirm-summary-item">
                    <span className="confirm-summary-label">
                      Available Limit <img src={infoIcon} alt="info" className="info-icon" />
                    </span>
                    <span className="confirm-summary-val">₹5600.00</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="confirm-modal-footer">
              <button
                className="btn-confirm-cancel"
                onClick={() => setRestartConfirmStrategy(null)}
              >
                Cancel
              </button>
              <button
                className="btn-confirm-start"
                onClick={handleConfirmRestartStrategy}
              >
                Start Strategy
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Order Confirmation Popup Modal for Restarted Nifty Theta */}
      {restartConfirmStrategy && restartConfirmStrategy.isTheta && (
        <div className="theta-confirm-modal-overlay" onClick={() => setRestartConfirmStrategy(null)}>
          <div className="theta-confirm-modal-container" onClick={(e) => e.stopPropagation()}>
            <div className="theta-confirm-modal-header">
              <h2 className="theta-confirm-modal-title">Order Confirmation</h2>
              <button
                className="theta-confirm-modal-close"
                onClick={() => setRestartConfirmStrategy(null)}
                aria-label="Close"
              >
                ✕
              </button>
            </div>

            <div className="theta-confirm-modal-body">
              <h3 className="theta-confirm-strategy-title">{restartConfirmStrategy.title || 'Nifty Theta'}</h3>

              <div className="theta-confirm-grid">
                <div className="theta-confirm-cell">
                  <span className="theta-confirm-label">
                    Lots
                    <svg className="theta-info-icon" width="13" height="13" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <circle cx="8" cy="8" r="7" stroke="#767676" strokeWidth="1.2" />
                      <path d="M8 7V11.5M8 4.75V5" stroke="#767676" strokeWidth="1.4" strokeLinecap="round" />
                    </svg>
                  </span>
                  <span className="theta-confirm-val">{restartConfirmStrategy.lots ? restartConfirmStrategy.lots * 50 : 500}</span>
                </div>

                <div className="theta-confirm-cell">
                  <span className="theta-confirm-label">
                    Max Profit
                    <svg className="theta-info-icon" width="13" height="13" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <circle cx="8" cy="8" r="7" stroke="#767676" strokeWidth="1.2" />
                      <path d="M8 7V11.5M8 4.75V5" stroke="#767676" strokeWidth="1.4" strokeLinecap="round" />
                    </svg>
                  </span>
                  <span className="theta-confirm-val">
                    {restartConfirmStrategy.maxProfit ? `₹${Number(restartConfirmStrategy.maxProfit).toLocaleString('en-IN')}` : '₹5,00,000'}
                  </span>
                </div>

                <div className="theta-confirm-cell">
                  <span className="theta-confirm-label">
                    Stoploss
                    <svg className="theta-info-icon" width="13" height="13" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <circle cx="8" cy="8" r="7" stroke="#767676" strokeWidth="1.2" />
                      <path d="M8 7V11.5M8 4.75V5" stroke="#767676" strokeWidth="1.4" strokeLinecap="round" />
                    </svg>
                  </span>
                  <span className="theta-confirm-val">
                    {restartConfirmStrategy.stoploss ? `₹${Number(restartConfirmStrategy.stoploss).toLocaleString('en-IN')}` : '₹5,00,000'}
                  </span>
                </div>

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

            <div className="theta-confirm-modal-footer">
              <button
                className="theta-btn-confirm-cancel"
                onClick={() => setRestartConfirmStrategy(null)}
              >
                Cancel
              </button>
              <button
                className="theta-btn-confirm-start"
                onClick={handleConfirmRestartStrategy}
              >
                Start Strategy
              </button>
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
                  {reportStrategy?.title
                    ? (reportStrategy.title.toLowerCase().includes('theta') ? 'Nifty Thetha report.' : `${reportStrategy.title} report.`)
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
                    showToast(
                      `Report generated for ${selectedReportPeriod} (${reportStrategy?.title || 'Nifty Theta'})`
                    );
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

      {/* Video Modal with YouTube iframe */}
      {videoModal.isOpen && (
        <div className="modal-overlay video-modal-overlay" onClick={handleCloseVideo}>
          <div className="modal-container video-iframe-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header video-modal-header">
              <div className="video-modal-title-wrap">
                <div className="video-modal-icon-badge">
                  <svg width="14" height="16" viewBox="0 0 14 18" fill="#E3530F" xmlns="http://www.w3.org/2000/svg">
                    <path d="M0.75 15.2108V2.28867C0.75 0.947598 2.66217 0.250658 3.83794 1.16319L12.1628 7.62428C12.9457 8.23192 12.9457 9.26759 12.1628 9.87523L3.83793 16.3363C2.66217 17.2489 0.75 16.5519 0.75 15.2108Z" fill="#E3530F" />
                  </svg>
                </div>
                <h3 className="modal-title video-modal-title">{videoModal.title}</h3>
              </div>
              <button className="modal-close-btn" onClick={handleCloseVideo} title="Close" aria-label="Close">
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M1.5 1.5L12.5 12.5M12.5 1.5L1.5 12.5" stroke="#353535" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
            </div>
            <div className="video-iframe-body">
              <div className="video-iframe-wrapper">
                <iframe
                  src={getYoutubeEmbedUrl(videoModal.url)}
                  title={videoModal.title}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  allowFullScreen
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


