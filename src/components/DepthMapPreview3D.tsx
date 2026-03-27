import React, { startTransition, useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import {
  Box,
  ChevronDown,
  ChevronUp,
  Maximize2,
  Minimize2,
  RotateCcw,
  X,
} from 'lucide-react';

type GalleryItem = {
  id: string;
  imageUrl: string;
  imageUrls: string[];
  viewLabels: string[];
  createdAt: string;
  floorName: string;
  roomName: string;
  prompt: string;
  coveragePercent: number;
};

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

export function DepthMapPreview3D({
  selectedFloor,
  selectedRoom,
  galleryItems,
}: {
  selectedFloor: any;
  selectedRoom: any;
  galleryItems: GalleryItem[];
}) {
  const roomGalleryItems = galleryItems.filter(
    (item) => item.floorName === selectedFloor?.name && item.roomName === selectedRoom?.name
  );
  const pickerItems = roomGalleryItems.length > 0 ? roomGalleryItems : galleryItems;
  const pickerSignature = pickerItems.map((item) => item.id).join('|');
  const previewRoomKey = `${selectedFloor?.id ?? 'unknown'}-${selectedRoom?.id ?? 'unknown'}`;
  const defaultPreviewItemId = roomGalleryItems[0]?.id ?? galleryItems[0]?.id ?? null;
  const [activeItemId, setActiveItemId] = useState<string | null>(pickerItems[0]?.id ?? null);
  const [isChooserOpen, setIsChooserOpen] = useState(true);
  const [controlsOpen, setControlsOpen] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [tourProgress, setTourProgress] = useState(0);
  const [visualProgress, setVisualProgress] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [pointerGlow, setPointerGlow] = useState({ x: 0, y: 0 });
  const [ambientMotion, setAmbientMotion] = useState({ x: 0, y: 0, scale: 0, glow: 0 });
  const rootRef = useRef<HTMLDivElement | null>(null);
  const progressTargetRef = useRef(0);
  const visualProgressRef = useRef(0);
  const dragStateRef = useRef({
    startX: 0,
    startProgress: 0,
    activePointerId: -1,
  });

  useEffect(() => {
    setActiveItemId(defaultPreviewItemId);
    setIsChooserOpen(true);
    setControlsOpen(false);
    setTourProgress(0);
    setVisualProgress(0);
    setPointerGlow({ x: 0, y: 0 });
    setAmbientMotion({ x: 0, y: 0, scale: 0, glow: 0 });
  }, [defaultPreviewItemId, previewRoomKey]);

  useEffect(() => {
    progressTargetRef.current = tourProgress;
  }, [tourProgress]);

  useEffect(() => {
    visualProgressRef.current = visualProgress;
  }, [visualProgress]);

  useEffect(() => {
    setActiveItemId((current) => {
      if (current && pickerItems.some((item) => item.id === current)) {
        return current;
      }
      return pickerItems[0]?.id ?? null;
    });
  }, [pickerSignature]);

  const activeGalleryItem = pickerItems.find((item) => item.id === activeItemId) ?? null;
  const activeImageUrls =
    activeGalleryItem?.imageUrls?.length ? activeGalleryItem.imageUrls : activeGalleryItem ? [activeGalleryItem.imageUrl] : [];
  const activeViewLabels = activeGalleryItem?.viewLabels?.length ? activeGalleryItem.viewLabels : ['主视角'];
  const tourImages = activeImageUrls.length > 0 ? [activeImageUrls[0]] : [];
  const tourLabels = [activeViewLabels[0] ?? '主视角'];
  const hasDualViews = false;
  const visibleLabel = tourLabels[0] ?? '主视角';
  const backgroundImageUrl = tourImages[0] ?? '';

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(document.fullscreenElement === rootRef.current);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, []);

  useEffect(() => {
    if (!isChooserOpen) {
      rootRef.current?.focus();
    }
  }, [isChooserOpen, activeItemId]);

  useEffect(() => {
    if (isChooserOpen) {
      setAmbientMotion({ x: 0, y: 0, scale: 0, glow: 0 });
      setVisualProgress(tourProgress);
      return undefined;
    }

    let frameId = 0;
    const startedAt = performance.now();

    const animate = (now: number) => {
      const elapsed = (now - startedAt) / 1000;
      const currentVisual = visualProgressRef.current;
      const targetVisual = progressTargetRef.current;
      const easedVisual = currentVisual + (targetVisual - currentVisual) * (isDragging ? 0.34 : 0.12);

      if (Math.abs(easedVisual - currentVisual) > 0.0005) {
        visualProgressRef.current = easedVisual;
        setVisualProgress(easedVisual);
      } else if (currentVisual !== targetVisual) {
        visualProgressRef.current = targetVisual;
        setVisualProgress(targetVisual);
      }

      setAmbientMotion({
        x: Math.sin(elapsed * 0.42) * 10,
        y: Math.cos(elapsed * 0.36) * 7,
        scale: (Math.sin(elapsed * 0.28) + 1) * 0.012,
        glow: (Math.sin(elapsed * 0.52) + 1) * 0.5,
      });

      frameId = window.requestAnimationFrame(animate);
    };

    frameId = window.requestAnimationFrame(animate);

    return () => {
      if (frameId) {
        window.cancelAnimationFrame(frameId);
      }
    };
  }, [isChooserOpen, isDragging, tourProgress]);

  useEffect(() => {
    if (isChooserOpen) return undefined;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (!hasDualViews) {
        if (event.key === 'Escape' && document.fullscreenElement === rootRef.current) {
          void document.exitFullscreen();
        }
        return;
      }

      if (event.key === 'ArrowLeft') {
        event.preventDefault();
        setTourProgress((current) => clamp(current - 0.12, 0, 1));
      } else if (event.key === 'ArrowRight') {
        event.preventDefault();
        setTourProgress((current) => clamp(current + 0.12, 0, 1));
      } else if (event.key === 'Escape' && document.fullscreenElement === rootRef.current) {
        void document.exitFullscreen();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [hasDualViews, isChooserOpen]);

  const resetView = () => {
    setTourProgress(0);
    setPointerGlow({ x: 0, y: 0 });
  };

  const toggleFullscreen = async () => {
    if (!rootRef.current) return;

    if (document.fullscreenElement === rootRef.current) {
      await document.exitFullscreen();
      return;
    }

    await rootRef.current.requestFullscreen();
  };

  const handlePointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!hasDualViews) return;
    setIsDragging(true);
    dragStateRef.current = {
      startX: event.clientX,
      startProgress: tourProgress,
      activePointerId: event.pointerId,
    };
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const handlePointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const normalizedX = clamp((event.clientX - rect.left) / rect.width - 0.5, -0.5, 0.5);
    const normalizedY = clamp((event.clientY - rect.top) / rect.height - 0.5, -0.5, 0.5);
    setPointerGlow({ x: normalizedX * 2, y: normalizedY * 2 });

    if (!hasDualViews || !isDragging) return;

    const deltaX = (event.clientX - dragStateRef.current.startX) / Math.max(rect.width, 1);
    setTourProgress(clamp(dragStateRef.current.startProgress + deltaX * 1.35, 0, 1));
  };

  const handlePointerUp = (event: React.PointerEvent<HTMLDivElement>) => {
    setIsDragging(false);
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
  };

  if (pickerItems.length === 0) {
    return (
      <div className="absolute inset-0 overflow-hidden bg-[#080808]">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_22%,rgba(212,175,55,0.16),transparent_42%),radial-gradient(circle_at_50%_100%,rgba(255,255,255,0.06),transparent_35%)]" />
        <div className="absolute inset-0 flex flex-col items-center justify-center px-8 text-center">
          <div className="rounded-full border border-white/10 bg-white/5 p-5 text-stone-100">
            <Box className="h-8 w-8" />
          </div>
          <h3 className="mt-6 text-2xl font-bold text-white">当前还没有可进入沉浸漫游的结果图</h3>
        </div>
      </div>
    );
  }

  const primaryImageUrl = tourImages[0] ?? '';
  const secondaryImageUrl = tourImages[1] ?? '';
  const primaryLabel = tourLabels[0] ?? '主视角';
  const secondaryLabel = tourLabels[1] ?? '结果图 2';
  const progressPercent = Math.round(tourProgress * 100);
  const displayProgressPercent = Math.round(visualProgress * 100);

  return (
    <div ref={rootRef} tabIndex={0} className="absolute inset-0 overflow-hidden bg-[#050505] text-white outline-none">
      {backgroundImageUrl && (
        <>
          <img
            src={backgroundImageUrl}
            alt={`${activeGalleryItem?.roomName}-背景`}
            className="pointer-events-none absolute inset-[-8%] h-[116%] w-[116%] object-cover opacity-24 blur-3xl"
            style={{
              transform: `translate3d(${pointerGlow.x * -12 + ambientMotion.x * -0.45}px, ${pointerGlow.y * -10 + ambientMotion.y * -0.4}px, 0) scale(${1.05 + ambientMotion.scale * 0.65})`,
            }}
            referrerPolicy="no-referrer"
          />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_48%,transparent_0%,rgba(0,0,0,0.18)_52%,rgba(0,0,0,0.66)_100%)]" />
        </>
      )}

      <div className="absolute inset-x-0 top-0 z-20 flex items-center justify-between gap-3 px-4 py-4 md:px-5">
        <div className="rounded-full border border-white/10 bg-black/45 px-4 py-2 backdrop-blur-md">
          <p className="text-sm font-semibold text-white">{activeGalleryItem?.floorName} / {activeGalleryItem?.roomName}</p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setIsChooserOpen(true)}
            className="rounded-full border border-white/10 bg-black/45 px-4 py-2 text-xs font-semibold text-white backdrop-blur-md transition-colors hover:bg-white/10"
          >
            选择图组
          </button>
          <button
            type="button"
            onClick={resetView}
            className="flex items-center gap-2 rounded-full border border-white/10 bg-black/45 px-4 py-2 text-xs font-semibold text-white backdrop-blur-md transition-colors hover:bg-white/10"
          >
            <RotateCcw className="h-4 w-4" />
            回到主视角
          </button>
          <button
            type="button"
            onClick={() => {
              void toggleFullscreen();
            }}
            className="flex items-center gap-2 rounded-full border border-white/10 bg-black/45 px-4 py-2 text-xs font-semibold text-white backdrop-blur-md transition-colors hover:bg-white/10"
          >
            {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
            {isFullscreen ? '退出全屏' : '全屏'}
          </button>
        </div>
      </div>

      <div
        className={`absolute inset-0 px-2 pt-[4.5rem] md:px-4 ${
          controlsOpen ? 'pb-44 md:pb-48' : 'pb-6 md:pb-8'
        } ${isFullscreen ? 'pt-[4.75rem]' : ''}`}
      >
        <div
          className="relative h-full w-full overflow-hidden rounded-[24px] border border-white/8 bg-black/28 shadow-[0_30px_120px_rgba(0,0,0,0.45)] md:rounded-[28px]"
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
          onPointerLeave={() => {
            setIsDragging(false);
            setPointerGlow({ x: 0, y: 0 });
          }}
        >
          <motion.div
            aria-hidden="true"
            className="pointer-events-none absolute inset-[-12%] opacity-20"
            animate={{
              x: ambientMotion.x * 1.4,
              y: ambientMotion.y * 1.15,
              scale: 1 + ambientMotion.scale,
              opacity: 0.16 + ambientMotion.glow * 0.08,
            }}
            transition={{ duration: isDragging ? 0.08 : 0.35, ease: 'easeOut' }}
            style={{
              background:
                'radial-gradient(circle at 50% 42%, rgba(241,209,136,0.30), transparent 34%), radial-gradient(circle at 68% 58%, rgba(255,255,255,0.12), transparent 28%)',
            }}
          />
          <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(255,255,255,0.04)_0%,rgba(255,255,255,0.00)_18%,rgba(0,0,0,0.00)_76%,rgba(0,0,0,0.24)_100%)]" />

          <div className="absolute inset-0 flex items-center justify-center overflow-hidden p-3 md:p-6">
            <div className="relative h-full w-full" style={{ perspective: '2200px' }}>
              {primaryImageUrl && (
                <motion.img
                  key={`${activeItemId}-primary`}
                  src={primaryImageUrl}
                  alt={`${activeGalleryItem?.roomName}-${primaryLabel}`}
                  className="absolute inset-0 h-full w-full select-none object-contain drop-shadow-[0_36px_80px_rgba(0,0,0,0.3)]"
                  style={{
                    opacity: hasDualViews ? 1 - visualProgress * 0.88 : 1,
                    transform: hasDualViews
                      ? `translate3d(${-visualProgress * 56 + ambientMotion.x * 0.18}px, ${Math.abs(pointerGlow.y) * 4 + ambientMotion.y * 0.16}px, ${visualProgress * -40}px) scale(${1 - visualProgress * 0.04 + ambientMotion.scale * 0.18}) rotateY(${visualProgress * 7}deg)`
                      : `translate3d(${ambientMotion.x * 0.16}px, ${ambientMotion.y * 0.14}px, 0) scale(${1 + ambientMotion.scale * 0.12})`,
                    transition: isDragging ? 'none' : 'transform 220ms ease-out, opacity 220ms ease-out',
                    imageRendering: 'auto',
                  }}
                  animate={{
                    filter: `brightness(${1 + ambientMotion.glow * 0.015}) saturate(${1 + ambientMotion.glow * 0.02})`,
                  }}
                  transition={{ duration: 0.5, ease: 'easeOut' }}
                  draggable={false}
                  referrerPolicy="no-referrer"
                />
              )}

              {secondaryImageUrl && (
                <motion.img
                  key={`${activeItemId}-secondary`}
                  src={secondaryImageUrl}
                  alt={`${activeGalleryItem?.roomName}-${secondaryLabel}`}
                  className="absolute inset-0 h-full w-full select-none object-contain drop-shadow-[0_36px_80px_rgba(0,0,0,0.3)]"
                  style={{
                    opacity: visualProgress,
                    transform: `translate3d(${(1 - visualProgress) * 56 + ambientMotion.x * -0.18}px, ${Math.abs(pointerGlow.y) * -4 + ambientMotion.y * -0.16}px, ${(1 - visualProgress) * -40}px) scale(${0.96 + visualProgress * 0.04 + ambientMotion.scale * 0.18}) rotateY(${(1 - visualProgress) * -7}deg)`,
                    transition: isDragging ? 'none' : 'transform 220ms ease-out, opacity 220ms ease-out',
                    imageRendering: 'auto',
                  }}
                  animate={{
                    filter: `brightness(${1 + ambientMotion.glow * 0.015}) saturate(${1 + ambientMotion.glow * 0.02})`,
                  }}
                  transition={{ duration: 0.5, ease: 'easeOut' }}
                  draggable={false}
                  referrerPolicy="no-referrer"
                />
              )}
            </div>
          </div>

          <div className="pointer-events-none absolute inset-0 border border-white/6" />
          <div
            className="pointer-events-none absolute inset-0"
            style={{
              background: `radial-gradient(circle at 50% 52%, transparent 0%, transparent 46%, rgba(0,0,0,${0.15 + ambientMotion.glow * 0.05}) 70%, rgba(0,0,0,0.46) 100%)`,
            }}
          />
          <div className="pointer-events-none absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-black/36 to-transparent" />
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-black/52 to-transparent" />

          <div className="absolute left-4 top-4 rounded-full border border-white/10 bg-black/48 px-3 py-1.5 text-[11px] font-semibold text-stone-100 backdrop-blur-md">
            {visibleLabel}
          </div>
          <div className="absolute right-4 top-4 rounded-full border border-white/10 bg-black/48 px-3 py-1.5 text-[11px] font-semibold text-stone-100 backdrop-blur-md">
            {hasDualViews ? `漫游进度 ${displayProgressPercent}%` : '单图沉浸'}
          </div>

          <div className="pointer-events-none absolute inset-x-0 bottom-5 flex justify-center px-5">
            <div className="rounded-full border border-white/10 bg-black/48 px-4 py-2 text-[11px] font-medium text-stone-200 backdrop-blur-md">
              {hasDualViews ? '拖动或方向键在多张结果图之间漫游' : '当前沉浸预览基于单张结果图做景深与光感增强'}
            </div>
          </div>
        </div>
      </div>

      <div className="absolute inset-x-0 bottom-0 z-20 flex justify-center px-4 pb-4">
        <div className="w-full max-w-6xl">
          <button
            type="button"
            onClick={() => setControlsOpen((current) => !current)}
            className="mx-auto flex items-center gap-2 rounded-full border border-white/10 bg-black/60 px-4 py-2 text-xs font-semibold text-white backdrop-blur-xl transition-colors hover:bg-white/10"
          >
            {controlsOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
            {controlsOpen ? '收起控制板' : '展开控制板'}
          </button>

          <AnimatePresence>
            {controlsOpen && (
              <motion.div
                initial={{ opacity: 0, y: 28 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 20 }}
                className="mt-3 rounded-[24px] border border-white/10 bg-black/62 px-4 py-4 backdrop-blur-xl"
              >
                {hasDualViews ? (
                  <>
                    <div className="flex flex-wrap items-center gap-3">
                      <button
                        type="button"
                        onClick={() => setTourProgress(0)}
                        className={`rounded-full border px-3 py-1.5 text-[11px] font-medium transition-colors ${
                          tourProgress <= 0.12
                            ? 'border-[#f1d188] bg-[#f1d188]/16 text-white'
                            : 'border-white/10 bg-white/6 text-stone-200 hover:bg-white/10'
                        }`}
                      >
                        {primaryLabel}
                      </button>
                      <button
                        type="button"
                        onClick={() => setTourProgress(1)}
                        className={`rounded-full border px-3 py-1.5 text-[11px] font-medium transition-colors ${
                          tourProgress >= 0.88
                            ? 'border-[#f1d188] bg-[#f1d188]/16 text-white'
                            : 'border-white/10 bg-white/6 text-stone-200 hover:bg-white/10'
                        }`}
                      >
                        {secondaryLabel}
                      </button>
                    </div>

                    <div className="mt-4">
                      <input
                        type="range"
                        min={0}
                        max={100}
                        step={1}
                        value={progressPercent}
                        onChange={(event) => setTourProgress(Number(event.target.value) / 100)}
                        className="h-2 w-full cursor-pointer appearance-none rounded-full bg-white/12 accent-[#f1d188]"
                      />
                      <div className="mt-2 flex items-center justify-between text-[11px] text-stone-400">
                        <span>主视角</span>
                        <span>过渡进度 {progressPercent}%</span>
                        <span>结果图 2</span>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-stone-300">
                    当前沉浸预览使用单张结果图作为主画面，并叠加轻微景深、呼吸感和光晕变化来增强空间代入感。
                  </div>
                )}

                <div className="mt-4 grid gap-3 md:grid-cols-2">
                  {tourImages.map((imageUrl, index) => {
                    const label = tourLabels[index] ?? `视角 ${index + 1}`;
                    const isActive = hasDualViews ? (index === 0 ? tourProgress <= 0.5 : tourProgress > 0.5) : true;

                    return (
                      <button
                        key={`${activeItemId}-${imageUrl}-${index}`}
                        type="button"
                        onClick={() => {
                          if (hasDualViews) {
                            setTourProgress(index === 0 ? 0 : 1);
                          }
                        }}
                        className={`overflow-hidden rounded-2xl border text-left transition-all ${
                          isActive
                            ? 'border-[#f1d188] shadow-[0_0_0_1px_rgba(241,209,136,0.4)]'
                            : 'border-white/10 opacity-80 hover:opacity-100'
                        }`}
                      >
                        <div className="relative aspect-[16/10] overflow-hidden">
                          <img
                            src={imageUrl}
                            alt={`${activeGalleryItem?.roomName}-${label}`}
                            className="h-full w-full object-cover"
                            referrerPolicy="no-referrer"
                          />
                          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent px-3 pb-2 pt-5 text-sm font-medium text-white">
                            {label}
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      <AnimatePresence>
        {isChooserOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-40 overflow-y-auto bg-black/72 p-3 backdrop-blur-sm md:p-6"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.98, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.98, y: 12 }}
              className="mx-auto flex min-h-[calc(100vh-1.5rem)] w-full max-w-6xl flex-col overflow-hidden rounded-[28px] border border-white/10 bg-[#101010]/96 shadow-2xl md:min-h-[calc(100vh-3rem)]"
            >
              <div className="flex shrink-0 items-start justify-between gap-6 border-b border-white/8 px-5 py-5 md:px-6">
                <div>
                  <p className="text-[10px] uppercase tracking-[0.24em] text-stone-500">Preview Source</p>
                  <h3 className="mt-2 text-xl font-bold text-white md:text-2xl">选择已生成结果进入沉浸漫游</h3>
                  <p className="mt-2 text-sm text-stone-400">系统会基于封面结果图构建单图沉浸预览，方便快速感受空间氛围。</p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsChooserOpen(false)}
                  className="rounded-full p-2 text-stone-400 transition-colors hover:bg-white/10 hover:text-white"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5 md:px-6">
                <div className="grid grid-cols-1 gap-4 pb-2 md:grid-cols-2 xl:grid-cols-3">
                  {pickerItems.map((item) => {
                    const imageUrls = item.imageUrls?.length ? item.imageUrls : [item.imageUrl];
                    const previewUrls = imageUrls.length > 0 ? [imageUrls[0]] : [];
                    const isActive = item.id === activeItemId;

                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => {
                          startTransition(() => {
                            setActiveItemId(item.id);
                            resetView();
                            setIsChooserOpen(false);
                          });
                        }}
                        className={`overflow-hidden rounded-[24px] border text-left transition-all ${
                          isActive
                            ? 'border-[#f1d188] bg-[#181512] shadow-[0_18px_40px_rgba(0,0,0,0.28)]'
                            : 'border-white/10 bg-white/[0.03] hover:border-white/20 hover:bg-white/[0.05]'
                        }`}
                      >
                        <div className="relative grid grid-cols-2 gap-px bg-black/30">
                          {previewUrls.map((imageUrl, index) => (
                            <div key={`${item.id}-${imageUrl}-${index}`} className="relative aspect-[4/3] overflow-hidden bg-black">
                              <img
                                src={imageUrl}
                                alt={`${item.roomName}-预览-${index + 1}`}
                                className="h-full w-full object-cover"
                                referrerPolicy="no-referrer"
                              />
                            </div>
                          ))}
                          <div className="pointer-events-none absolute left-4 top-4 rounded-full border border-white/10 bg-black/45 px-3 py-1 text-[10px] font-semibold text-white backdrop-blur-md">
                            单图沉浸
                          </div>
                          <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/82 to-transparent p-4">
                            <p className="text-base font-semibold text-white">{item.roomName}</p>
                            <p className="mt-1 text-xs text-stone-300">{item.floorName}</p>
                          </div>
                        </div>

                        <div className="space-y-3 px-4 py-4">
                          <div className="flex items-center justify-between text-[11px] text-stone-400">
                            <span>{new Date(item.createdAt).toLocaleString()}</span>
                            <span>覆盖 {item.coveragePercent.toFixed(1)}%</span>
                          </div>
                          <p className="line-clamp-2 text-sm leading-relaxed text-stone-300">{item.prompt}</p>
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-medium text-stone-500">{(item.viewLabels ?? []).slice(0, 1).join(' / ') || '单图结果'}</span>
                            <span className="rounded-full border border-white/10 px-3 py-1 text-xs font-semibold text-white">
                              进入漫游
                            </span>
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
