import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Save, Bell, DraftingCompass, Layers, Waves, ChevronDown, ChevronRight,
  Home, Bed, Flower, Settings, Cpu, Plus, ZoomIn, ZoomOut, 
  Focus, Lamp, Box, MonitorPlay, Sliders, Sparkles, Info,
  Loader2, CheckCircle2, Download, X, Image as ImageIcon
} from 'lucide-react';

const FLOORS = [
  {
    id: 'B1',
    name: '负一层',
    icon: Waves,
    rooms: [
      { id: 'b1-billiard', name: '台球室 & 水吧', basePrompt: 'A spacious basement billiard room with a central pool table, adjacent to a modern wet bar.' },
      { id: 'b1-audio', name: '影音室', basePrompt: 'A cozy home theater room with a large projection screen and plush seating.' },
      { id: 'b1-tea', name: '品茗区', basePrompt: 'A modern tea tasting area with an elegant wooden tea table and a serene atmosphere.' },
      { id: 'b1-card', name: '棋牌室', basePrompt: 'A private card room with a square automatic mahjong table and comfortable chairs.' }
    ]
  },
  {
    id: 'F1',
    name: '一层',
    icon: Home,
    rooms: [
      { id: 'f1-living', name: '客厅', basePrompt: 'A grand living room with a large sofa arrangement, a modern TV wall, and large windows.' },
      { id: 'f1-dining', name: '餐厅 & 岛台', basePrompt: 'A dining room with a large round table, adjacent to an open modern kitchen with a central island.' },
      { id: 'f1-elderly', name: '老人房', basePrompt: 'A comfortable and safe bedroom for the elderly, with soft lighting and accessible design.' },
      { id: 'f1-shrine', name: '佛堂', basePrompt: 'A peaceful and respectful Buddhist shrine room with a traditional altar and meditation space.' }
    ]
  },
  {
    id: 'F2',
    name: '二层',
    icon: Bed,
    rooms: [
      { id: 'f2-master', name: '主卧', basePrompt: 'A luxurious master bedroom with a king-size bed, an elegant headboard, and a seating area.' },
      { id: 'f2-closet', name: '衣帽间', basePrompt: 'A spacious walk-in closet with glass display cabinets, warm lighting, and an island dresser.' },
      { id: 'f2-kids', name: '儿童房', basePrompt: 'A modern children\'s room with a comfortable bed, a study desk, and playful yet elegant decor.' },
      { id: 'f2-multi', name: '多功能区', basePrompt: 'An open multi-function family area with comfortable seating and recreational space.' }
    ]
  },
  {
    id: 'F3',
    name: '三层',
    icon: Flower,
    rooms: [
      { id: 'f3-study', name: '书房', basePrompt: 'A quiet and focused study room with a large executive desk, bookshelves, and a reading chair.' },
      { id: 'f3-gym', name: '健身区', basePrompt: 'A home gym area with a treadmill, exercise bike, and full-length mirrors.' },
      { id: 'f3-terrace', name: '露台', basePrompt: 'An outdoor terrace with comfortable modern outdoor seating, potted plants, and ambient evening lighting.' }
    ]
  }
];

const ROOM_LAYOUTS: Record<string, any[]> = {
  'B1': [
    { id: 'b1-billiard', top: '50%', left: '15%', width: '40%', height: '40%' },
    { id: 'b1-tea', top: '50%', left: '55%', width: '30%', height: '40%' },
    { id: 'b1-audio', top: '25%', left: '70%', width: '15%', height: '25%' },
    { id: 'b1-card', top: '15%', left: '15%', width: '25%', height: '30%' },
  ],
  'F1': [
    { id: 'f1-living', top: '50%', left: '15%', width: '40%', height: '40%' },
    { id: 'f1-dining', top: '40%', left: '60%', width: '25%', height: '50%' },
    { id: 'f1-elderly', top: '15%', left: '15%', width: '25%', height: '30%' },
    { id: 'f1-shrine', top: '15%', left: '55%', width: '20%', height: '25%' },
  ],
  'F2': [
    { id: 'f2-master', top: '50%', left: '60%', width: '25%', height: '40%' },
    { id: 'f2-closet', top: '35%', left: '60%', width: '25%', height: '15%' },
    { id: 'f2-kids', top: '15%', left: '15%', width: '30%', height: '75%' },
    { id: 'f2-multi', top: '50%', left: '45%', width: '15%', height: '40%' },
  ],
  'F3': [
    { id: 'f3-study', top: '50%', left: '50%', width: '35%', height: '40%' },
    { id: 'f3-gym', top: '15%', left: '50%', width: '35%', height: '30%' },
    { id: 'f3-terrace', top: '15%', left: '15%', width: '30%', height: '75%' },
  ]
};

const STYLE_PROMPT = "Light luxury style (轻奢风格), modern elegant, high-end materials, marble, brass accents, neutral color palette with warm lighting, highly detailed, photorealistic, 8k resolution, architectural photography. Consistent visual style.";

function TopNavBar({ view, setView }: { view: string, setView: (v: string) => void }) {
  return (
    <header className="fixed top-0 w-full z-50 flex justify-between items-center px-4 md:px-8 h-16 bg-[#FCF9F8] dark:bg-stone-950 font-headline text-sm tracking-tight shadow-none border-b border-surface-container">
      <div className="flex items-center gap-4 md:gap-8 overflow-hidden">
        <div className="flex items-center gap-2 text-primary dark:text-stone-50 shrink-0">
          <DraftingCompass className="w-5 h-5 md:w-6 md:h-6" />
          <h1 className="font-extrabold text-base md:text-lg tracking-widest uppercase hidden sm:block">Lumina<span className="text-tertiary">.</span></h1>
        </div>
        
        <nav className="flex items-center gap-4 md:gap-6 overflow-x-auto no-scrollbar">
          <button onClick={() => setView('project')} className={`font-bold border-b-2 pb-1 transition-colors whitespace-nowrap ${view === 'project' ? 'text-primary dark:text-stone-50 border-tertiary' : 'text-stone-500 dark:text-stone-400 border-transparent hover:text-primary'}`}>项目</button>
          <button onClick={() => setView('gallery')} className={`font-bold border-b-2 pb-1 transition-colors whitespace-nowrap ${view === 'gallery' ? 'text-primary dark:text-stone-50 border-tertiary' : 'text-stone-500 dark:text-stone-400 border-transparent hover:text-primary'}`}>展示图库</button>
          <button onClick={() => setView('history')} className={`font-bold border-b-2 pb-1 transition-colors whitespace-nowrap ${view === 'history' ? 'text-primary dark:text-stone-50 border-tertiary' : 'text-stone-500 dark:text-stone-400 border-transparent hover:text-primary'}`}>历史记录</button>
        </nav>
      </div>
      <div className="flex items-center gap-3 md:gap-4 shrink-0">
        <button className="p-2 text-stone-400 hover:text-primary transition-colors relative hidden sm:block">
          <Bell className="w-4 h-4" />
          <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-tertiary rounded-full"></span>
        </button>
        <button className="hidden sm:flex items-center gap-2 px-4 py-1.5 bg-stone-900 text-stone-50 rounded-full text-xs font-medium hover:bg-stone-800 transition-colors">
          <Save className="w-3.5 h-3.5" />
          保存
        </button>
        <div className="w-7 h-7 md:w-8 md:h-8 rounded-full bg-stone-200 border border-stone-300 overflow-hidden sm:ml-2">
          <img src="https://picsum.photos/seed/avatar/100/100" alt="User" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
        </div>
      </div>
    </header>
  );
}

function LeftSidebar({ expandedFloorId, setExpandedFloorId, selectedRoomId, setSelectedRoomId, showLeftPanel }: any) {
  return (
    <aside className={`fixed left-0 top-16 h-[calc(100vh-64px)] w-64 flex flex-col p-4 z-40 bg-[#FCF9F8] dark:bg-stone-950 text-[13px] leading-relaxed border-r border-surface-container transition-transform duration-300 ${showLeftPanel ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0`}>
      <div className="mb-6 px-2">
        <div className="flex items-center gap-3 mb-1">
          <div className="w-8 h-8 bg-primary flex items-center justify-center text-on-primary rounded-sm">
            <DraftingCompass className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-primary leading-none">天玺一号别墅</h2>
            <p className="text-[11px] text-stone-400">现代轻奢风格</p>
          </div>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto custom-scrollbar">
        <div className="space-y-1">
          <div className="px-2 py-1 text-[11px] font-bold text-stone-400 uppercase tracking-widest mb-2">层级视图</div>
          
          <button className="w-full flex items-center gap-3 px-3 py-2 text-stone-500 hover:bg-stone-50 transition-transform duration-300 hover:translate-x-1 rounded-sm">
            <Layers className="w-5 h-5" />
            <span>楼层概览</span>
          </button>
          
          {FLOORS.map((floor) => {
            const isExpanded = expandedFloorId === floor.id;
            const Icon = floor.icon;
            return (
              <div key={floor.id} className="mt-2">
                <button 
                  onClick={() => setExpandedFloorId(isExpanded ? null : floor.id)}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-sm transition-colors ${
                    isExpanded ? 'bg-stone-100 text-tertiary font-medium' : 'text-stone-500 hover:bg-stone-50'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon className="w-5 h-5" />
                    <span>{floor.name}</span>
                  </div>
                  {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                </button>
                <AnimatePresence initial={false}>
                  {isExpanded && (
                    <motion.div 
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3, ease: 'easeInOut' }}
                      className="overflow-hidden"
                    >
                      <div className="ml-9 mt-1 space-y-1 border-l border-surface-container">
                        {floor.rooms.map((room) => {
                          const isSelected = selectedRoomId === room.id;
                          return (
                            <button 
                              key={room.id}
                              onClick={() => setSelectedRoomId(room.id)}
                              className={`w-full text-left px-3 py-1.5 transition-colors relative ${
                                isSelected 
                                  ? 'text-tertiary font-bold bg-stone-50' 
                                  : 'text-stone-600 hover:text-primary'
                              }`}
                            >
                              {isSelected && (
                                <motion.div 
                                  layoutId="activeRoomLeft"
                                  className="absolute left-0 top-0 bottom-0 w-[2px] bg-tertiary" 
                                />
                              )}
                              {room.name}
                            </button>
                          );
                        })}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      </div>
      
      <div className="mt-auto pt-4 border-t border-surface-container space-y-1">
        <button className="w-full flex items-center gap-3 px-3 py-2 text-stone-500 hover:bg-stone-50 rounded-sm">
          <Settings className="w-5 h-5" />
          <span>系统设置</span>
        </button>
        <div className="px-3 py-2 flex items-center justify-between text-stone-400">
          <div className="flex items-center gap-3">
            <Cpu className="w-5 h-5" />
            <span>GPU 状态</span>
          </div>
          <span className="text-[10px] bg-emerald-100 text-emerald-700 px-1.5 rounded">稳定</span>
        </div>
        <button className="w-full mt-4 py-2 bg-primary text-on-primary text-xs font-medium flex items-center justify-center gap-2 hover:opacity-90 active:scale-95 transition-all rounded-sm">
          <Plus className="w-4 h-4" />
          <span>新增区域</span>
        </button>
      </div>
    </aside>
  );
}

function MainCanvas({ selectedFloor, selectedRoom, setSelectedRoomId, setShowLeftPanel, setShowRightPanel }: any) {
  const currentLayout = ROOM_LAYOUTS[selectedFloor?.id] || [];
  const [scale, setScale] = useState(1);
  const [viewMode, setViewMode] = useState<'2d' | '3d' | 'panorama'>('2d');

  const handleZoomIn = () => setScale(s => Math.min(s + 0.25, 2.5));
  const handleZoomOut = () => setScale(s => Math.max(s - 0.25, 0.5));
  const handleFocus = () => setScale(1);

  return (
    <section className="flex-1 relative bg-surface-container-low overflow-hidden flex flex-col lg:ml-64 lg:mr-80 w-full">
      {/* Mobile Toggle Buttons */}
      <div className="absolute top-4 left-4 right-4 flex justify-between z-30 lg:hidden pointer-events-none">
        <button onClick={() => setShowLeftPanel(true)} className="p-2.5 bg-white text-stone-700 shadow-lg rounded-full pointer-events-auto border border-stone-200">
          <Layers className="w-5 h-5" />
        </button>
        <button onClick={() => setShowRightPanel(true)} className="p-2.5 bg-stone-900 text-stone-100 shadow-lg rounded-full pointer-events-auto border border-stone-700">
          <Sliders className="w-5 h-5" />
        </button>
      </div>

      <div className="absolute top-16 lg:top-6 left-4 lg:left-8 z-10 pointer-events-none">
        <h2 className="text-lg lg:text-2xl font-bold text-primary flex items-center gap-2 lg:gap-3">
          AI 室内设计
          <span className="text-[8px] lg:text-[10px] px-2 py-0.5 bg-tertiary text-on-tertiary rounded-full tracking-wider font-normal">PRO</span>
        </h2>
        <p className="text-stone-500 lg:text-stone-400 text-[10px] lg:text-xs mt-1">当前操作：{selectedFloor?.name} &gt; {selectedRoom?.name}</p>
      </div>
      
      <div className="flex-1 flex items-center justify-center p-4 lg:p-12 mt-12 lg:mt-0">
        <div className="relative w-full max-w-4xl aspect-[4/3] bg-white shadow-2xl overflow-hidden group border border-surface-container rounded-lg">
          
          <motion.div 
            className="w-full h-full origin-center relative"
            animate={{ scale }}
            transition={{ type: 'spring', bounce: 0, duration: 0.4 }}
          >
            <AnimatePresence mode="wait">
              {viewMode === '2d' && (
                <motion.div 
                  key="2d"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.3 }}
                  className="absolute inset-0"
                >
                  {/* Background grid to simulate blueprint paper */}
                  <div className="absolute inset-0" style={{
                    backgroundImage: 'linear-gradient(#f0eded 1px, transparent 1px), linear-gradient(90deg, #f0eded 1px, transparent 1px)',
                    backgroundSize: '20px 20px'
                  }}></div>

                  {/* Interactive Room Zones */}
                  <div className="absolute inset-0 z-20">
                    <AnimatePresence>
                      {currentLayout.map((layout, index) => {
                        const roomData = selectedFloor.rooms.find((r: any) => r.id === layout.id);
                        if (!roomData) return null;
                        
                        const isSelected = selectedRoom?.id === layout.id;
                        
                        return (
                          <motion.div 
                            key={`${selectedFloor.id}-${layout.id}`}
                            initial={{ opacity: 0, scale: 0.9, y: 10 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: -10 }}
                            transition={{ duration: 0.4, delay: index * 0.05, type: "spring", bounce: 0.3 }}
                            onClick={() => setSelectedRoomId(layout.id)}
                            className={`absolute border-2 transition-colors duration-300 cursor-pointer flex items-center justify-center
                              ${isSelected 
                                ? 'border-tertiary bg-tertiary/10 shadow-[0_0_20px_rgba(115,92,0,0.15)] z-30' 
                                : 'border-stone-300 bg-white/60 hover:border-primary hover:bg-white/80 z-20'
                              }
                            `}
                            style={{
                              top: layout.top,
                              left: layout.left,
                              width: layout.width,
                              height: layout.height,
                            }}
                          >
                            <motion.div 
                              animate={{ scale: isSelected ? 1.1 : 1 }}
                              className="text-center p-2 flex flex-col items-center gap-1"
                            >
                              <div className={`text-sm font-bold ${isSelected ? 'text-tertiary' : 'text-stone-600'}`}>
                                {roomData.name}
                              </div>
                              <AnimatePresence>
                                {isSelected && (
                                  <motion.div 
                                    initial={{ opacity: 0, y: 5 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: 5 }}
                                    className="text-[10px] text-tertiary bg-white/90 px-2 py-0.5 rounded-full shadow-sm"
                                  >
                                    已选中
                                  </motion.div>
                                )}
                              </AnimatePresence>
                            </motion.div>
                          </motion.div>
                        );
                      })}
                    </AnimatePresence>
                  </div>
                </motion.div>
              )}

              {viewMode === '3d' && (
                <motion.div 
                  key="3d"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.3 }}
                  className="absolute inset-0 bg-stone-100 flex items-center justify-center"
                >
                  <img src="https://picsum.photos/seed/isometric-floorplan/1200/900" alt="3D Preview" className="w-full h-full object-cover opacity-90" referrerPolicy="no-referrer" />
                  <div className="absolute inset-0 bg-gradient-to-t from-stone-900/40 to-transparent pointer-events-none"></div>
                  <div className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-white/90 backdrop-blur-sm px-4 py-2 rounded-full shadow-lg flex items-center gap-2 text-xs font-medium text-stone-700">
                    <Box className="w-4 h-4 text-tertiary" />
                    <span>轴测图预览 (白模渲染中...)</span>
                  </div>
                </motion.div>
              )}

              {viewMode === 'panorama' && (
                <motion.div 
                  key="panorama"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.3 }}
                  className="absolute inset-0 bg-stone-900 flex items-center justify-center overflow-hidden"
                >
                  <img src="https://picsum.photos/seed/panorama-interior/1600/600" alt="Panorama" className="w-full h-full object-cover opacity-70 scale-110" referrerPolicy="no-referrer" />
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div className="w-16 h-16 border-2 border-white/30 rounded-full flex items-center justify-center">
                      <div className="w-2 h-2 bg-tertiary rounded-full animate-ping"></div>
                    </div>
                  </div>
                  <div className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-stone-800/90 backdrop-blur-sm px-4 py-2 rounded-full shadow-lg flex items-center gap-2 text-xs font-medium text-stone-300 border border-stone-700">
                    <MonitorPlay className="w-4 h-4 text-tertiary" />
                    <span>拖拽以环视四周 (VR 模式)</span>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
          
          <div className="absolute bottom-6 right-6 flex flex-col gap-2 z-30">
            <button onClick={handleZoomIn} className="p-3 bg-white shadow-lg text-primary hover:bg-stone-50 transition-colors rounded-sm">
              <ZoomIn className="w-5 h-5" />
            </button>
            <button onClick={handleZoomOut} className="p-3 bg-white shadow-lg text-primary hover:bg-stone-50 transition-colors rounded-sm">
              <ZoomOut className="w-5 h-5" />
            </button>
            <button onClick={handleFocus} className="p-3 bg-white shadow-lg text-primary hover:bg-stone-50 transition-colors rounded-sm">
              <Focus className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
      
      <div className="h-12 border-t border-surface-container bg-white flex items-center justify-center gap-4 md:gap-8 px-4 md:px-8 z-30 relative overflow-x-auto no-scrollbar shrink-0">
        <button 
          onClick={() => setViewMode('2d')} 
          className={`text-[10px] md:text-xs font-bold flex items-center gap-1.5 md:gap-2 transition-colors whitespace-nowrap ${viewMode === '2d' ? 'text-tertiary' : 'text-stone-400 hover:text-primary'}`}
        >
          <Lamp className="w-3.5 h-3.5 md:w-4 md:h-4" />
          平面布局
        </button>
        <button 
          onClick={() => setViewMode('3d')} 
          className={`text-[10px] md:text-xs font-bold flex items-center gap-1.5 md:gap-2 transition-colors whitespace-nowrap ${viewMode === '3d' ? 'text-tertiary' : 'text-stone-400 hover:text-primary'}`}
        >
          <Box className="w-3.5 h-3.5 md:w-4 md:h-4" />
          3D 预览
        </button>
        <button 
          onClick={() => setViewMode('panorama')} 
          className={`text-[10px] md:text-xs font-bold flex items-center gap-1.5 md:gap-2 transition-colors whitespace-nowrap ${viewMode === 'panorama' ? 'text-tertiary' : 'text-stone-400 hover:text-primary'}`}
        >
          <MonitorPlay className="w-3.5 h-3.5 md:w-4 md:h-4" />
          全景漫游
        </button>
      </div>
    </section>
  );
}

function RightSidebar({ selectedRoom, onGenerate, showRightPanel }: any) {
  const [resolution, setResolution] = useState('4k');
  const [customPrompt, setCustomPrompt] = useState('');
  const [naturalLight, setNaturalLight] = useState(75);
  const [indirectLight, setIndirectLight] = useState(42);
  const [rtxEnabled, setRtxEnabled] = useState(true);

  return (
    <aside className={`fixed right-0 top-16 h-[calc(100vh-64px)] w-64 sm:w-72 lg:w-80 bg-stone-950 text-stone-100 flex flex-col z-40 transition-transform duration-300 ${showRightPanel ? 'translate-x-0' : 'translate-x-full'} lg:translate-x-0`}>
      <div className="p-4 lg:p-6 border-b border-stone-800">
        <div className="flex items-center justify-between mb-3 lg:mb-4">
          <h3 className="font-headline font-bold text-xs lg:text-sm tracking-widest text-tertiary-fixed-dim">渲染参数面板</h3>
          <Sliders className="w-4 h-4 lg:w-5 lg:h-5 text-stone-500 cursor-pointer" />
        </div>
        <div className="bg-stone-900 p-3 lg:p-4 rounded-sm border-l-2 border-tertiary mb-2">
          <p className="text-[10px] text-stone-500 font-bold uppercase mb-1 tracking-tighter">当前区域</p>
          <h4 className="text-base lg:text-lg font-headline font-bold text-white mb-1 lg:mb-2">{selectedRoom?.name}</h4>
          <p className="text-[10px] lg:text-[12px] text-stone-400 leading-relaxed line-clamp-2 lg:line-clamp-none">
            {selectedRoom?.basePrompt}
          </p>
        </div>
      </div>
      
      <div className="flex-1 overflow-y-auto custom-scrollbar p-4 lg:p-6">
        <AnimatePresence mode="wait">
          <motion.div 
            key={selectedRoom?.id || 'empty'}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="space-y-6 lg:space-y-8"
          >
            <div>
              <label className="block text-[10px] lg:text-[11px] font-bold text-stone-500 uppercase mb-3 lg:mb-4 tracking-widest">输出规格</label>
              <div className="grid grid-cols-2 gap-2">
                <button 
                  onClick={() => setResolution('1080p')}
                  className={`px-2 lg:px-3 py-2 lg:py-3 border flex flex-col items-center gap-1 transition-colors rounded-sm ${resolution === '1080p' ? 'border-tertiary bg-tertiary/10 text-tertiary-fixed-dim' : 'border-stone-800 bg-stone-900/50 hover:border-stone-600 text-stone-300'}`}
                >
                  <span className="text-[11px] lg:text-xs font-bold">1080P</span>
                  <span className={`text-[9px] lg:text-[10px] ${resolution === '1080p' ? 'text-tertiary-fixed-dim/70' : 'text-stone-500'}`}>高清预览</span>
                </button>
                <button 
                  onClick={() => setResolution('4k')}
                  className={`px-2 lg:px-3 py-2 lg:py-3 border flex flex-col items-center gap-1 transition-colors rounded-sm ${resolution === '4k' ? 'border-tertiary bg-tertiary/10 text-tertiary-fixed-dim' : 'border-stone-800 bg-stone-900/50 hover:border-stone-600 text-stone-300'}`}
                >
                  <span className="text-[11px] lg:text-xs font-bold">4K ULTRA</span>
                  <span className={`text-[9px] lg:text-[10px] ${resolution === '4k' ? 'text-tertiary-fixed-dim/70' : 'text-stone-500'}`}>极致渲染</span>
                </button>
              </div>
            </div>
        
        <div>
          <label className="block text-[10px] lg:text-[11px] font-bold text-stone-500 uppercase mb-3 lg:mb-4 tracking-widest">补充细节 (选填)</label>
          <textarea
            value={customPrompt}
            onChange={(e) => setCustomPrompt(e.target.value)}
            placeholder="例如：希望加入更多绿植，或者使用胡桃木家具..."
            className="w-full h-20 lg:h-24 bg-stone-900/50 border border-stone-800 rounded-sm p-2 lg:p-3 text-[11px] lg:text-xs text-stone-300 placeholder:text-stone-600 focus:outline-none focus:border-tertiary transition-colors resize-none custom-scrollbar"
          />
        </div>
        
        <div>
          <label className="block text-[10px] lg:text-[11px] font-bold text-stone-500 uppercase mb-3 lg:mb-4 tracking-widest">光影细节调节</label>
          <div className="space-y-4 lg:space-y-6">
            <div className="space-y-2">
              <div className="flex justify-between text-[10px] lg:text-[11px]">
                <span className="text-stone-300">自然光对比度</span>
                <span className="text-tertiary-fixed-dim">{naturalLight}%</span>
              </div>
              <div className="relative h-2 lg:h-3 flex items-center group">
                <input type="range" min="0" max="100" value={naturalLight} onChange={(e) => setNaturalLight(Number(e.target.value))} className="absolute w-full h-full opacity-0 cursor-pointer z-10" />
                <div className="h-1 w-full bg-stone-800 rounded-full overflow-hidden">
                  <div className="h-full bg-tertiary rounded-full" style={{ width: `${naturalLight}%` }}></div>
                </div>
                <div className="absolute w-2.5 h-2.5 lg:w-3 lg:h-3 bg-white rounded-full shadow-lg pointer-events-none group-active:scale-125 transition-transform" style={{ left: `calc(${naturalLight}% - 6px)` }}></div>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-[10px] lg:text-[11px]">
                <span className="text-stone-300">间接照明强度</span>
                <span className="text-tertiary-fixed-dim">{indirectLight}%</span>
              </div>
              <div className="relative h-2 lg:h-3 flex items-center group">
                <input type="range" min="0" max="100" value={indirectLight} onChange={(e) => setIndirectLight(Number(e.target.value))} className="absolute w-full h-full opacity-0 cursor-pointer z-10" />
                <div className="h-1 w-full bg-stone-800 rounded-full overflow-hidden">
                  <div className="h-full bg-tertiary rounded-full" style={{ width: `${indirectLight}%` }}></div>
                </div>
                <div className="absolute w-2.5 h-2.5 lg:w-3 lg:h-3 bg-white rounded-full shadow-lg pointer-events-none group-active:scale-125 transition-transform" style={{ left: `calc(${indirectLight}% - 6px)` }}></div>
              </div>
            </div>
          </div>
        </div>
        
        <div className="pt-3 lg:pt-4 border-t border-stone-800">
          <label className="flex items-center justify-between cursor-pointer group" onClick={(e) => { e.preventDefault(); setRtxEnabled(!rtxEnabled); }}>
            <span className="text-[11px] lg:text-[12px] text-stone-300 group-hover:text-white transition-colors">实时光线追踪 (RTX)</span>
            <div className={`w-7 h-3.5 lg:w-8 lg:h-4 rounded-full relative transition-colors ${rtxEnabled ? 'bg-tertiary' : 'bg-stone-700'}`}>
              <motion.div layout className={`absolute top-0.5 w-2.5 h-2.5 lg:w-3 lg:h-3 bg-white rounded-full ${rtxEnabled ? 'right-0.5' : 'left-0.5'}`}></motion.div>
            </div>
          </label>
        </div>
          </motion.div>
        </AnimatePresence>
      </div>
      
      <div className="p-4 lg:p-6 bg-stone-900/50 backdrop-blur-md">
        <motion.button 
          onClick={onGenerate}
          whileHover={{ scale: 1.02 }} 
          whileTap={{ scale: 0.98 }} 
          className="w-full py-3 lg:py-4 bg-gradient-to-r from-primary-container to-primary text-white font-headline font-extrabold text-xs lg:text-sm tracking-[0.2em] shadow-2xl hover:shadow-primary/20 transition-all flex items-center justify-center gap-2 lg:gap-3 rounded-sm"
        >
          <Sparkles className="w-4 h-4 lg:w-5 lg:h-5" />
          生成设计图
        </motion.button>
      </div>
    </aside>
  );
}

function OverlayHint() {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false);
    }, 5000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div 
          initial={{ opacity: 0, y: 20, x: '-50%' }}
          animate={{ opacity: 1, y: 0, x: '-50%' }}
          exit={{ opacity: 0, y: 20, x: '-50%' }}
          transition={{ delay: 1, duration: 0.5, type: 'spring' }}
          className="fixed bottom-6 left-1/2 px-4 py-2 bg-surface/80 backdrop-blur-md border border-surface-container shadow-xl z-50 text-[11px] text-stone-600 flex items-center gap-3 rounded-full pointer-events-none"
        >
          <Info className="w-4 h-4" />
          使用鼠标滚轮缩放图纸，点击区域进行精细化设置
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function GalleryView() {
  const images = [
    "https://picsum.photos/seed/interior-living/800/600",
    "https://picsum.photos/seed/interior-bedroom/800/600",
    "https://picsum.photos/seed/interior-kitchen/800/600",
    "https://picsum.photos/seed/interior-bathroom/800/600",
    "https://picsum.photos/seed/interior-study/800/600",
    "https://picsum.photos/seed/interior-dining/800/600",
  ];

  return (
    <div className="flex-1 p-4 md:p-8 overflow-y-auto bg-surface-container-low w-full">
      <div className="max-w-6xl mx-auto">
        <h2 className="text-xl md:text-2xl font-bold text-primary mb-4 md:mb-6">展示图库</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
          {images.map((src, i) => (
            <motion.div 
              key={i}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="group relative aspect-[4/3] rounded-lg overflow-hidden shadow-md hover:shadow-xl transition-all"
            >
              <img src={src} alt={`Gallery image ${i + 1}`} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" referrerPolicy="no-referrer" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-4">
                <span className="text-white font-medium text-sm">设计方案 {i + 1}</span>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}

function HistoryView() {
  const history = [
    { id: 1, date: '2026-03-20 10:30', room: '客厅', status: '已完成', resolution: '4K ULTRA' },
    { id: 2, date: '2026-03-19 15:45', room: '主卧', status: '已完成', resolution: '1080P' },
    { id: 3, date: '2026-03-18 09:20', room: '餐厅 & 岛台', status: '已完成', resolution: '4K ULTRA' },
    { id: 4, date: '2026-03-17 14:10', room: '书房', status: '已完成', resolution: '1080P' },
  ];

  return (
    <div className="flex-1 p-4 md:p-8 overflow-y-auto bg-surface-container-low w-full">
      <div className="max-w-4xl mx-auto">
        <h2 className="text-xl md:text-2xl font-bold text-primary mb-4 md:mb-6">渲染历史记录</h2>
        <div className="bg-white rounded-lg shadow-sm border border-surface-container overflow-hidden overflow-x-auto">
          <table className="w-full text-left text-xs md:text-sm whitespace-nowrap">
            <thead className="bg-stone-50 border-b border-surface-container text-stone-500">
              <tr>
                <th className="px-4 md:px-6 py-3 md:py-4 font-medium">任务 ID</th>
                <th className="px-4 md:px-6 py-3 md:py-4 font-medium">时间</th>
                <th className="px-4 md:px-6 py-3 md:py-4 font-medium">区域</th>
                <th className="px-4 md:px-6 py-3 md:py-4 font-medium">规格</th>
                <th className="px-4 md:px-6 py-3 md:py-4 font-medium">状态</th>
                <th className="px-4 md:px-6 py-3 md:py-4 font-medium text-right">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-container">
              {history.map((item) => (
                <tr key={item.id} className="hover:bg-stone-50 transition-colors">
                  <td className="px-4 md:px-6 py-3 md:py-4 font-mono text-stone-500">#{item.id.toString().padStart(4, '0')}</td>
                  <td className="px-4 md:px-6 py-3 md:py-4 text-stone-600">{item.date}</td>
                  <td className="px-4 md:px-6 py-3 md:py-4 font-medium text-primary">{item.room}</td>
                  <td className="px-4 md:px-6 py-3 md:py-4 text-stone-600">{item.resolution}</td>
                  <td className="px-4 md:px-6 py-3 md:py-4">
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-[10px] font-medium bg-emerald-100 text-emerald-700">
                      {item.status}
                    </span>
                  </td>
                  <td className="px-4 md:px-6 py-3 md:py-4 text-right">
                    <button className="text-tertiary hover:text-tertiary/80 font-medium transition-colors">查看</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function GenerationModal({ isGenerating, generatedImage, onClose, onSaveToGallery }: any) {
  if (!isGenerating && !generatedImage) return null;

  return (
    <AnimatePresence>
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] flex items-center justify-center bg-stone-950/80 backdrop-blur-sm p-4 md:p-12"
      >
        <motion.div 
          initial={{ scale: 0.95, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.95, opacity: 0, y: 20 }}
          transition={{ type: "spring", duration: 0.5, bounce: 0 }}
          className="w-full max-w-5xl bg-surface rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-full border border-surface-container"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 md:px-6 py-3 md:py-4 border-b border-surface-container bg-stone-50">
            <h2 className="text-base md:text-lg font-bold text-primary flex items-center gap-2">
              {isGenerating ? (
                <>
                  <Loader2 className="w-4 h-4 md:w-5 md:h-5 animate-spin text-tertiary" />
                  AI 正在为您渲染设计方案...
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4 md:w-5 md:h-5 text-emerald-600" />
                  渲染完成
                </>
              )}
            </h2>
            {!isGenerating && (
              <button onClick={onClose} className="p-1.5 md:p-2 text-stone-400 hover:text-stone-700 hover:bg-stone-200 rounded-full transition-colors">
                <X className="w-4 h-4 md:w-5 md:h-5" />
              </button>
            )}
          </div>

          {/* Content */}
          <div className="flex-1 overflow-hidden relative bg-stone-100 flex items-center justify-center min-h-[300px] md:min-h-[400px]">
            {isGenerating ? (
              <div className="flex flex-col items-center max-w-md text-center">
                <div className="relative w-24 h-24 mb-8">
                  <div className="absolute inset-0 border-4 border-tertiary/20 rounded-full"></div>
                  <div className="absolute inset-0 border-4 border-tertiary rounded-full border-t-transparent animate-spin"></div>
                  <Sparkles className="absolute inset-0 m-auto w-8 h-8 text-tertiary animate-pulse" />
                </div>
                <div className="space-y-3 w-full">
                  <div className="h-2 bg-stone-200 rounded-full overflow-hidden">
                    <motion.div 
                      initial={{ width: "0%" }}
                      animate={{ width: "100%" }}
                      transition={{ duration: 3, ease: "easeInOut" }}
                      className="h-full bg-tertiary"
                    />
                  </div>
                  <p className="text-sm text-stone-500 font-medium animate-pulse">
                    正在解析空间结构与材质细节...
                  </p>
                </div>
              </div>
            ) : (
              <motion.div 
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5 }}
                className="w-full h-full p-6 flex items-center justify-center"
              >
                <img 
                  src={generatedImage} 
                  alt="Generated Design" 
                  className="max-w-full max-h-full object-contain rounded-lg shadow-lg border border-stone-200"
                  referrerPolicy="no-referrer"
                />
              </motion.div>
            )}
          </div>

          {/* Footer Actions */}
          {!isGenerating && (
            <div className="px-4 md:px-6 py-3 md:py-4 border-t border-surface-container bg-white flex flex-wrap justify-end gap-2 md:gap-3">
              <button onClick={onClose} className="px-4 md:px-6 py-2 text-xs md:text-sm font-medium text-stone-600 hover:bg-stone-100 rounded-sm transition-colors">
                返回编辑
              </button>
              <button className="px-4 md:px-6 py-2 text-xs md:text-sm font-medium text-stone-600 border border-stone-200 hover:bg-stone-50 rounded-sm transition-colors flex items-center gap-2">
                <Download className="w-4 h-4" />
                <span className="hidden sm:inline">下载原图</span>
              </button>
              <button onClick={onSaveToGallery} className="px-4 md:px-6 py-2 text-xs md:text-sm font-bold text-white bg-primary hover:bg-primary/90 rounded-sm transition-colors flex items-center gap-2 shadow-md">
                <ImageIcon className="w-4 h-4" />
                保存到图库
              </button>
            </div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

export default function App() {
  const [view, setView] = useState('project'); // 'project', 'gallery', 'history'
  const [expandedFloorId, setExpandedFloorId] = useState<string | null>('B1');
  const [selectedRoomId, setSelectedRoomId] = useState<string | null>('b1-audio');
  
  const [showLeftPanel, setShowLeftPanel] = useState(false);
  const [showRightPanel, setShowRightPanel] = useState(false);
  
  // Generation State
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);

  const handleGenerate = () => {
    setIsGenerating(true);
    setGeneratedImage(null);
    
    // Simulate AI Generation process
    setTimeout(() => {
      setIsGenerating(false);
      // Use a high-quality interior placeholder
      setGeneratedImage("https://picsum.photos/seed/luxury-interior-render/1920/1080");
    }, 3000);
  };

  const handleSaveToGallery = () => {
    // In a real app, this would save to the backend.
    // For now, we just close the modal and switch to gallery view.
    setGeneratedImage(null);
    setView('gallery');
  };

  const selectedFloor = FLOORS.find(f => f.rooms.some(r => r.id === selectedRoomId)) || FLOORS[0];
  const selectedRoom = selectedFloor.rooms.find(r => r.id === selectedRoomId) || selectedFloor.rooms[0];

  return (
    <div className="bg-background text-on-background font-body select-none overflow-hidden h-screen flex flex-col">
      <TopNavBar view={view} setView={setView} />
      <main className="flex flex-1 pt-16 h-full overflow-hidden relative">
        {view === 'project' && (
          <>
            {/* Mobile Overlay */}
            {(showLeftPanel || showRightPanel) && (
              <div 
                className="fixed inset-0 bg-stone-900/50 backdrop-blur-sm z-30 lg:hidden" 
                onClick={() => { setShowLeftPanel(false); setShowRightPanel(false); }}
              />
            )}
            
            <LeftSidebar 
              expandedFloorId={expandedFloorId} 
              setExpandedFloorId={setExpandedFloorId}
              selectedRoomId={selectedRoomId}
              setSelectedRoomId={(id: string) => {
                setSelectedRoomId(id);
                if (window.innerWidth < 1024) setShowLeftPanel(false);
              }}
              showLeftPanel={showLeftPanel}
            />
            <MainCanvas 
              selectedFloor={selectedFloor} 
              selectedRoom={selectedRoom} 
              setSelectedRoomId={setSelectedRoomId} 
              setShowLeftPanel={setShowLeftPanel}
              setShowRightPanel={setShowRightPanel}
            />
            <RightSidebar 
              selectedRoom={selectedRoom} 
              onGenerate={() => {
                if (window.innerWidth < 1024) setShowRightPanel(false);
                handleGenerate();
              }} 
              showRightPanel={showRightPanel}
            />
          </>
        )}
        {view === 'gallery' && <GalleryView />}
        {view === 'history' && <HistoryView />}
      </main>
      {view === 'project' && <OverlayHint />}
      
      <GenerationModal 
        isGenerating={isGenerating} 
        generatedImage={generatedImage} 
        onClose={() => setGeneratedImage(null)} 
        onSaveToGallery={handleSaveToGallery}
      />
    </div>
  );
}
