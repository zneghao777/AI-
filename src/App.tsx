import React, { startTransition, useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Save, Bell, DraftingCompass, Layers, Waves, ChevronDown, ChevronRight, ChevronLeft,
  Home, Bed, Flower, Settings, Cpu, Plus, ZoomIn, ZoomOut, 
  Focus, Lamp, Box, MonitorPlay, Sliders, Sparkles, Info,
  Loader2, CheckCircle2, Download, X, Image as ImageIcon, Volume2, VolumeX
} from 'lucide-react';

const DepthMapPreview3D = React.lazy(() =>
  import('./components/DepthMapPreview3D').then((module) => ({
    default: module.DepthMapPreview3D,
  }))
);

type Point = [number, number];

type RoomDefinition = {
  id: string;
  name: string;
  basePrompt: string;
  labelAnchor: Point;
  areas: Point[][];
};

type StylePreset = {
  id: string;
  name: string;
  description: string;
  prompt: string;
};

const FLOORS = [
  {
    id: 'B1',
    name: '负一层',
    icon: Waves,
    rooms: [
      {
        id: 'b1-card-west',
        name: '棋牌室(西)',
        basePrompt: '一个私密的棋牌室，配置方形自动麻将桌、吸音墙面和温暖有质感的灯光。',
        labelAnchor: [21, 29],
        areas: [
          [[12.5, 20.2], [34.8, 20.2], [34.8, 39.8], [12.5, 39.8]],
        ],
      },
      {
        id: 'b1-card-east',
        name: '棋牌室(东)',
        basePrompt: '一个更精致的第二棋牌室，带舒适座椅、一体化收纳和克制高级的配色。',
        labelAnchor: [61.5, 29],
        areas: [
          [[47.8, 20.2], [72.8, 20.2], [72.8, 39.8], [47.8, 39.8]],
        ],
      },
      {
        id: 'b1-theater',
        name: '影音室',
        basePrompt: '一个舒适的家庭影音室，包含投影主墙、深座沙发、声学处理和影院氛围灯光。',
        labelAnchor: [79.5, 42],
        areas: [
          [[73.5, 30.2], [92.3, 30.2], [92.3, 54.2], [73.5, 54.2]],
        ],
      },
      {
        id: 'b1-billiards',
        name: '台球室',
        basePrompt: '一个宽敞的台球休闲空间，包含主景台球桌、会所式座椅和石材木饰面。',
        labelAnchor: [31, 63],
        areas: [
          [[7.2, 45.0], [50.0, 45.0], [50.0, 56.2], [52.0, 56.2], [52.0, 89.0], [14.0, 89.0], [14.0, 62.0], [7.2, 62.0]],
        ],
      },
      {
        id: 'b1-bar',
        name: '水吧区',
        basePrompt: '一个紧凑精致的水吧区，带吧台座位、柜下灯光、石材台面和展示层架。',
        labelAnchor: [61, 69],
        areas: [
          [[46.5, 60.0], [67.8, 60.0], [67.8, 79.8], [46.5, 79.8]],
        ],
      },
      {
        id: 'b1-tea',
        name: '品茗室',
        basePrompt: '一个安静的品茗室，结合艺术陈设、精致茶台和宁静雅致的接待细节。',
        labelAnchor: [80.5, 63],
        areas: [
          [[67.8, 48.0], [92.5, 48.0], [92.5, 88.5], [67.8, 88.5], [67.8, 61.6], [66.0, 61.6], [66.0, 56.3], [67.8, 56.3]],
        ],
      },
      {
        id: 'b1-dry',
        name: '干区',
        basePrompt: '一个紧凑的卫浴干区，带一体化收纳、石材台面和柔和的间接照明。',
        labelAnchor: [23.5, 50],
        areas: [
          [[16.8, 45.0], [35.5, 45.0], [35.5, 58.3], [16.8, 58.3]],
        ],
      },
      {
        id: 'b1-restroom',
        name: '卫生间',
        basePrompt: '一个配置完善的卫生间，采用耐用石材面、温暖灯光和高品质洁具。',
        labelAnchor: [10.5, 50],
        areas: [
          [[6.2, 45.0], [16.8, 45.0], [16.8, 58.3], [6.2, 58.3]],
        ],
      },
    ]
  },
  {
    id: 'F1',
    name: '一层',
    icon: Home,
    rooms: [
      {
        id: 'f1-elderly',
        name: '老人房',
        basePrompt: '一个舒适的老人房套间，带柔和间接照明、友好支撑家具和温润触感材质。',
        labelAnchor: [18.5, 28],
        areas: [
          [[12.0, 17.0], [33.2, 17.0], [33.2, 41.5], [12.0, 41.5]],
        ],
      },
      {
        id: 'f1-shrine',
        name: '佛堂',
        basePrompt: '一个宁静的佛堂空间，采用低矮坐席、仪式感照明和沉静对称的建筑秩序。',
        labelAnchor: [57.5, 25],
        areas: [
          [[46.8, 15.0], [71.5, 15.0], [71.5, 39.2], [46.8, 39.2]],
        ],
      },
      {
        id: 'f1-kitchen',
        name: '厨房',
        basePrompt: '一个明亮的高端厨房，带中央岛台、展示柜体、高级电器和石材界面。',
        labelAnchor: [81.5, 40],
        areas: [
          [[71.8, 18.2], [93.2, 18.2], [93.2, 56.0], [71.8, 56.0]],
        ],
      },
      {
        id: 'f1-dining',
        name: '餐厅',
        basePrompt: '一个正式餐厅，配置圆形宴会桌、层次灯光和体面的宴请氛围。',
        labelAnchor: [82.5, 67],
        areas: [
          [[71.5, 56.0], [93.0, 56.0], [93.0, 80.0], [71.5, 80.0]],
        ],
      },
      {
        id: 'f1-living',
        name: '客厅',
        basePrompt: '一个大气客厅，拥有雕塑感沙发布局、精致主景墙和面向采光的会客区。',
        labelAnchor: [25.5, 66],
        areas: [
          [[11.2, 54.0], [49.6, 54.0], [49.6, 81.0], [11.2, 81.0]],
        ],
      },
      {
        id: 'f1-foyer',
        name: '玄关厅',
        basePrompt: '一个有仪式感的玄关厅，强调轴线布局、升级材质和迎宾式画廊氛围。',
        labelAnchor: [60.5, 65.5],
        areas: [
          [[46.0, 39.2], [71.8, 39.2], [71.8, 55.0], [74.0, 55.0], [74.0, 79.0], [46.0, 79.0], [46.0, 55.0], [43.8, 55.0], [43.8, 51.0], [46.0, 51.0]],
        ],
      },
      {
        id: 'f1-dry',
        name: '干区',
        basePrompt: '一个酒店感卫浴干区，带定制收纳、石材细节和柔化灯光。',
        labelAnchor: [25.5, 47.5],
        areas: [
          [[16.8, 43.5], [40.0, 43.5], [40.0, 54.0], [16.8, 54.0]],
        ],
      },
      {
        id: 'f1-wet',
        name: '湿区',
        basePrompt: '一个紧凑的卫浴湿区，采用耐用高品质饰面、壁龛整合和易维护细节。',
        labelAnchor: [10.8, 47.5],
        areas: [
          [[6.2, 43.5], [16.8, 43.5], [16.8, 54.0], [6.2, 54.0]],
        ],
      },
    ]
  },
  {
    id: 'F2',
    name: '二层',
    icon: Bed,
    rooms: [
      {
        id: 'f2-kid-west',
        name: '儿童房A',
        basePrompt: '一个兼具童趣与高级感的儿童房，带学习收纳一体设计和耐用材质。',
        labelAnchor: [18.5, 28.5],
        areas: [
          [[12.0, 17.0], [33.2, 17.0], [33.2, 41.0], [12.0, 41.0]],
        ],
      },
      {
        id: 'f2-kid-east',
        name: '儿童房B',
        basePrompt: '第二个儿童房，带安静灯光、学习角和均衡的现代住宅气质。',
        labelAnchor: [58.5, 28.5],
        areas: [
          [[47.8, 17.0], [72.2, 17.0], [72.2, 41.0], [47.8, 41.0]],
        ],
      },
      {
        id: 'f2-terrace',
        name: '露台',
        basePrompt: '一个抬高式户外露台，配置休闲座椅、耐候材料和细腻的夜间照明。',
        labelAnchor: [82.5, 23.5],
        areas: [
          [[73.8, 18.0], [94.8, 18.0], [94.8, 31.5], [73.8, 31.5]],
        ],
      },
      {
        id: 'f2-bath',
        name: '卫生间',
        basePrompt: '一个共享卫生间，采用暖调石材、耐用表面、精致五金和高效洗浴布局。',
        labelAnchor: [82.5, 38.5],
        areas: [
          [[73.8, 31.5], [94.8, 31.5], [94.8, 45.5], [73.8, 45.5]],
        ],
      },
      {
        id: 'f2-closet',
        name: '衣帽间',
        basePrompt: '一个步入式衣帽间，带定制柜体、玻璃展示收纳和精品店式灯光。',
        labelAnchor: [82.5, 50.5],
        areas: [
          [[73.8, 45.5], [94.8, 45.5], [94.8, 57.5], [73.8, 57.5]],
        ],
      },
      {
        id: 'f2-master',
        name: '主卧',
        basePrompt: '一个奢雅主卧套间，带大尺度床头主墙、层次织物和亲密感夜间灯光。',
        labelAnchor: [80.5, 67],
        areas: [
          [[69.5, 57.5], [94.5, 57.5], [94.5, 80.5], [69.5, 80.5]],
        ],
      },
      {
        id: 'f2-multi',
        name: '多功能区',
        basePrompt: '一个灵活的家庭多功能区，带中心岛台元素、交流式座位和画廊式动线。',
        labelAnchor: [56.5, 64.5],
        areas: [
          [[45.2, 51.5], [68.8, 51.5], [68.8, 80.5], [45.2, 80.5]],
        ],
      },
      {
        id: 'f2-kid-south',
        name: '儿童房C',
        basePrompt: '一个面积更大的儿童房，包含阅读角、学习区和活泼但高级的居住氛围。',
        labelAnchor: [22.5, 67],
        areas: [
          [[12.2, 55.0], [43.8, 55.0], [43.8, 80.2], [12.2, 80.2]],
        ],
      },
      {
        id: 'f2-balcony',
        name: '阳台',
        basePrompt: '一个紧凑阳台，带放松座位、户外耐候饰面和轻松的度假感。',
        labelAnchor: [58.5, 86.5],
        areas: [
          [[46.8, 80.5], [70.2, 80.5], [70.2, 94.0], [46.8, 94.0]],
        ],
      },
      {
        id: 'f2-dry',
        name: '干区',
        basePrompt: '一个线条利落的卫浴干区，带镜前一体灯光和精致石材细节。',
        labelAnchor: [25.5, 47.2],
        areas: [
          [[16.8, 43.0], [31.2, 43.0], [31.2, 54.0], [16.8, 54.0]],
        ],
      },
      {
        id: 'f2-wet',
        name: '湿区',
        basePrompt: '一个紧凑的卫浴湿区，采用高耐久饰面和实用而精致的布局。',
        labelAnchor: [10.5, 47.2],
        areas: [
          [[6.2, 43.0], [16.8, 43.0], [16.8, 54.0], [6.2, 54.0]],
        ],
      },
    ]
  },
  {
    id: 'F3',
    name: '三层',
    icon: Flower,
    rooms: [
      {
        id: 'f3-terrace-west',
        name: '花园露台',
        basePrompt: '一个大型屋顶花园露台，包含铺地、种植池、户外餐区和度假式氛围灯光。',
        labelAnchor: [22, 46],
        areas: [
          [[11.5, 16.0], [37.5, 16.0], [37.5, 42.0], [44.2, 42.0], [44.2, 79.5], [16.2, 79.5], [16.2, 62.0], [7.0, 62.0], [7.0, 41.5], [16.2, 41.5], [16.2, 16.0]],
        ],
      },
      {
        id: 'f3-gym',
        name: '健身区',
        basePrompt: '一个明亮的家庭健身区，配置有氧器械、镜面界面和耐磨高品质地面。',
        labelAnchor: [59.2, 30],
        areas: [
          [[48.2, 17.0], [72.8, 17.0], [72.8, 41.5], [48.2, 41.5]],
        ],
      },
      {
        id: 'f3-bath',
        name: '卫生间',
        basePrompt: '一个三层私属卫生间，带高品质洁具、层次灯光和高效干湿分区。',
        labelAnchor: [82.5, 38.5],
        areas: [
          [[73.8, 31.5], [94.8, 31.5], [94.8, 45.2], [73.8, 45.2]],
        ],
      },
      {
        id: 'f3-closet',
        name: '衣帽间',
        basePrompt: '一个更衣衣帽间，带通高衣柜、一体化灯光和精品陈列式收纳。',
        labelAnchor: [82.5, 50.5],
        areas: [
          [[73.8, 45.2], [94.8, 45.2], [94.8, 57.2], [73.8, 57.2]],
        ],
      },
      {
        id: 'f3-master',
        name: '主卧',
        basePrompt: '一个私密主卧，拥有宁静睡眠区、优雅软包和柔和轻奢细节。',
        labelAnchor: [80.5, 67],
        areas: [
          [[69.5, 57.2], [94.5, 57.2], [94.5, 80.5], [69.5, 80.5]],
        ],
      },
      {
        id: 'f3-study',
        name: '书房',
        basePrompt: '一个专注的书房，配置中心书桌、层次书架和克制的材质对比。',
        labelAnchor: [58.5, 66],
        areas: [
          [[48.5, 58.0], [68.2, 58.0], [68.2, 78.5], [48.5, 78.5]],
        ],
      },
      {
        id: 'f3-terrace-south',
        name: '南向露台',
        basePrompt: '一个尺度较小的南向露台，带亲密座位、纹理户外饰面和柔和夜景氛围。',
        labelAnchor: [58.5, 86.5],
        areas: [
          [[46.8, 80.5], [70.2, 80.5], [70.2, 94.0], [46.8, 94.0]],
        ],
      },
    ]
  }
] as Array<{
  id: string;
  name: string;
  icon: React.ComponentType<{ className?: string }>;
  rooms: RoomDefinition[];
}>;

const FLOOR_PLAN_IMAGES: Record<string, string> = {
  B1: '/floorplans/b1.png',
  F1: '/floorplans/f1.png',
  F2: '/floorplans/f2.png',
  F3: '/floorplans/f3.png',
};

type RoomBoundingBox = {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
  width: number;
  height: number;
  centerX: number;
  centerY: number;
};

type RoomSegmentation = {
  polygonCount: number;
  coveragePercent: number;
  bbox: RoomBoundingBox;
  maskDataUrl: string;
  cropPreviewDataUrl: string;
  planSliceDataUrl: string;
};

type RoomOverride = {
  areas: Point[][];
  labelAnchor: Point;
};

type GeneratedImage = {
  viewId: string;
  label: string;
  imageUrl: string;
  textResponse?: string;
};

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

type HistoryItem = {
  id: string;
  date: string;
  room: string;
  floor: string;
  status: string;
  resolution: string;
  imageUrl?: string;
  imageCount?: number;
};

const ROOM_OVERRIDE_STORAGE_KEY = 'villa-floorplan-room-overrides-v1';
const GALLERY_STORAGE_KEY = 'villa-gallery-items-v1';
const HISTORY_STORAGE_KEY = 'villa-history-items-v1';
const STYLE_PRESET_STORAGE_KEY = 'villa-style-preset-v1';
const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));
const cloneAreas = (areas: Point[][]): Point[][] => areas.map((area) => area.map(([x, y]) => [x, y] as Point));

const STYLE_PRESETS: StylePreset[] = [
  {
    id: 'modern-minimal',
    name: '现代简约',
    description: '线条克制，空间干净，适合大多数公共区域与卧室。',
    prompt: '整体风格采用现代简约路线，强调干净利落的线条、舒展的留白、克制的中性色、细腻木饰面与哑光石材。呈现写实高端住宅室内摄影效果，必须是人视高度构图，空间具有真实纵深，不允许俯视、鸟瞰、轴测或平面图式画面。三张图保持同一套材质、配色与设计语言。',
  },
  {
    id: 'cream-wood',
    name: '奶油原木',
    description: '柔和温暖，适合家庭向、放松感更强的空间。',
    prompt: '整体风格采用奶油原木，空间基调温暖柔和，以奶油白、浅米色和自然木色为主，搭配圆润家具、细腻布艺和轻松治愈的居住氛围。呈现写实高端住宅室内摄影效果，必须是人视高度构图，空间具有真实纵深，不允许俯视、鸟瞰、轴测或平面图式画面。三张图保持统一的色彩、材质与软装逻辑。',
  },
  {
    id: 'new-chinese',
    name: '新中式',
    description: '东方气质更强，适合茶室、佛堂、玄关等区域。',
    prompt: '整体风格采用新中式，以东方秩序、木质格栅、雅致石材、沉稳配色和留白意境塑造高级居住氛围，避免传统符号的堆砌。呈现写实高端住宅室内摄影效果，必须是人视高度构图，空间具有真实纵深，不允许俯视、鸟瞰、轴测或平面图式画面。三张图保持同一套东方审美与材质体系。',
  },
  {
    id: 'french-elegant',
    name: '轻法式',
    description: '精致柔美，适合卧室、客厅、餐厅等主生活场景。',
    prompt: '整体风格采用轻法式，空间强调柔和线脚、优雅比例、浅暖色调、精致金属与法式软装细节，整体高级但不过分繁复。呈现写实高端住宅室内摄影效果，必须是人视高度构图，空间具有真实纵深，不允许俯视、鸟瞰、轴测或平面图式画面。三张图保持统一的法式细节和色彩氛围。',
  },
  {
    id: 'wabi-sabi',
    name: '侘寂自然',
    description: '材质感更强，适合书房、主卧、露台和休闲空间。',
    prompt: '整体风格采用侘寂自然路线，强调天然肌理、低饱和色彩、微水泥、木材、石材与松弛宁静的光影关系，气质朴素但高级。呈现写实高端住宅室内摄影效果，必须是人视高度构图，空间具有真实纵深，不允许俯视、鸟瞰、轴测或平面图式画面。三张图保持统一的自然材料与安静氛围。',
  },
];

const polygonArea = (points: Point[]) => {
  let area = 0;

  for (let i = 0; i < points.length; i += 1) {
    const [x1, y1] = points[i];
    const [x2, y2] = points[(i + 1) % points.length];
    area += x1 * y2 - x2 * y1;
  }

  return Math.abs(area / 2);
};

const getRoomBoundingBox = (areas: Point[][]): RoomBoundingBox => {
  const flatPoints = areas.flat();
  const xs = flatPoints.map(([x]) => x);
  const ys = flatPoints.map(([, y]) => y);
  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);
  const minY = Math.min(...ys);
  const maxY = Math.max(...ys);

  return {
    minX,
    minY,
    maxX,
    maxY,
    width: maxX - minX,
    height: maxY - minY,
    centerX: (minX + maxX) / 2,
    centerY: (minY + maxY) / 2,
  };
};

const toPolygonPoints = (area: Point[]) => area.map(([x, y]) => `${x},${y}`).join(' ');
const toPathData = (area: Point[]) => area.map(([x, y], index) => `${index === 0 ? 'M' : 'L'} ${x} ${y}`).join(' ') + ' Z';

const makeSvgDataUrl = (svg: string) => `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;

const buildRoomSegmentation = (floorId: string, room?: RoomDefinition | null): RoomSegmentation | null => {
  if (!room) return null;

  const bbox = getRoomBoundingBox(room.areas);
  const polygonMarkup = room.areas.map((area) => `<polygon points="${toPolygonPoints(area)}" />`).join('');
  const polygonPathMarkup = room.areas.map((area) => toPathData(area)).join(' ');
  const coveragePercent = room.areas.reduce((sum, area) => sum + polygonArea(area), 0) / 100;
  const previewPadding = 1.5;
  const previewMinX = Math.max(0, bbox.minX - previewPadding);
  const previewMinY = Math.max(0, bbox.minY - previewPadding);
  const previewMaxX = Math.min(100, bbox.maxX + previewPadding);
  const previewMaxY = Math.min(100, bbox.maxY + previewPadding);
  const previewWidth = Math.max(1, previewMaxX - previewMinX);
  const previewHeight = Math.max(1, previewMaxY - previewMinY);
  const contextPadding = clamp(Math.max(bbox.width, bbox.height) * 0.45, 8, 14);
  const contextMinX = Math.max(0, bbox.minX - contextPadding);
  const contextMinY = Math.max(0, bbox.minY - contextPadding);
  const contextMaxX = Math.min(100, bbox.maxX + contextPadding);
  const contextMaxY = Math.min(100, bbox.maxY + contextPadding);
  const contextWidth = Math.max(1, contextMaxX - contextMinX);
  const contextHeight = Math.max(1, contextMaxY - contextMinY);
  const contextRectPath = `M ${contextMinX} ${contextMinY} H ${contextMaxX} V ${contextMaxY} H ${contextMinX} Z`;

  const maskSvg = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
      <rect width="100" height="100" fill="#0f0f0f" />
      <g fill="#ffffff">
        ${polygonMarkup}
      </g>
    </svg>
  `;

  const cropPreviewSvg = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="${previewMinX} ${previewMinY} ${previewWidth} ${previewHeight}">
      <defs>
        <clipPath id="room-clip" clipPathUnits="userSpaceOnUse">
          ${polygonMarkup}
        </clipPath>
      </defs>
      <rect x="0" y="0" width="100" height="100" fill="#f8f3e7" />
      <image
        href="${FLOOR_PLAN_IMAGES[floorId]}"
        x="0"
        y="0"
        width="100"
        height="100"
        preserveAspectRatio="none"
        clip-path="url(#room-clip)"
      />
      <g fill="none" stroke="#9d7a1d" stroke-width="0.35" vector-effect="non-scaling-stroke">
        ${polygonMarkup}
      </g>
    </svg>
  `;

  const planSliceSvg = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="${contextMinX} ${contextMinY} ${contextWidth} ${contextHeight}">
      <rect x="${contextMinX}" y="${contextMinY}" width="${contextWidth}" height="${contextHeight}" fill="#f8f3e7" />
      <image
        href="${FLOOR_PLAN_IMAGES[floorId]}"
        x="0"
        y="0"
        width="100"
        height="100"
        preserveAspectRatio="none"
      />
      <path
        d="${contextRectPath} ${polygonPathMarkup}"
        fill="#111827"
        fill-opacity="0.16"
        fill-rule="evenodd"
      />
      <g fill="#d7b76d" fill-opacity="0.28" stroke="#b58512" stroke-width="0.45" vector-effect="non-scaling-stroke">
        ${polygonMarkup}
      </g>
      <circle cx="${bbox.centerX}" cy="${bbox.centerY}" r="0.8" fill="#8a5a00" />
    </svg>
  `;

  return {
    polygonCount: room.areas.length,
    coveragePercent,
    bbox,
    maskDataUrl: makeSvgDataUrl(maskSvg),
    cropPreviewDataUrl: makeSvgDataUrl(cropPreviewSvg),
    planSliceDataUrl: makeSvgDataUrl(planSliceSvg),
  };
};

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

function LeftSidebar({ floors, expandedFloorId, setExpandedFloorId, selectedRoomId, setSelectedRoomId, showLeftPanel, selectedStyleName }: any) {
  return (
    <aside className={`fixed left-0 top-16 h-[calc(100vh-64px)] w-60 xl:w-64 flex flex-col p-4 z-40 bg-[#FCF9F8] dark:bg-stone-950 text-[13px] leading-relaxed border-r border-surface-container transition-transform duration-300 ${showLeftPanel ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0`}>
      <div className="mb-6 px-2">
        <div className="flex items-center gap-3 mb-1">
          <div className="w-8 h-8 bg-primary flex items-center justify-center text-on-primary rounded-sm">
            <DraftingCompass className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-primary leading-none">锦绣前程别墅</h2>
            <p className="text-[11px] text-stone-400">{selectedStyleName}</p>
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
          
          {floors.map((floor: any) => {
            const isExpanded = expandedFloorId === floor.id;
            const Icon = floor.icon;
            return (
              <div key={floor.id} className="mt-2">
                <button 
                  onClick={() => {
                    setExpandedFloorId(isExpanded ? null : floor.id);
                    if (!isExpanded && floor.rooms[0]) {
                      setSelectedRoomId(floor.rooms[0].id);
                    }
                  }}
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

function ImmersivePreview3D({ selectedFloor, selectedRoom, galleryItems }: { selectedFloor: any; selectedRoom: any; galleryItems: GalleryItem[] }) {
  const roomGalleryItems = galleryItems.filter(
    (item) => item.floorName === selectedFloor?.name && item.roomName === selectedRoom?.name
  );
  const pickerItems = roomGalleryItems.length > 0 ? roomGalleryItems : galleryItems;
  const pickerSignature = pickerItems.map((item) => item.id).join('|');
  const previewRoomKey = `${selectedFloor?.id ?? 'unknown'}-${selectedRoom?.id ?? 'unknown'}`;
  const [activeItemId, setActiveItemId] = useState<string | null>(pickerItems[0]?.id ?? null);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [isChooserOpen, setIsChooserOpen] = useState(true);
  const [isImmersiveActive, setIsImmersiveActive] = useState(false);
  const [ambientEnabled, setAmbientEnabled] = useState(false);
  const [pointerTilt, setPointerTilt] = useState({ x: 0, y: 0 });
  const [idleDrift, setIdleDrift] = useState({ x: 0, y: 0, zoom: 0, glow: 0 });
  const animationFrameRef = useRef<number | null>(null);
  const ambientAudioRef = useRef<{ context: AudioContext; cleanup: () => void } | null>(null);

  useEffect(() => {
    setActiveItemId(roomGalleryItems[0]?.id ?? galleryItems[0]?.id ?? null);
    setActiveImageIndex(0);
    setIsChooserOpen(true);
    setIsImmersiveActive(false);
    setAmbientEnabled(false);
    setPointerTilt({ x: 0, y: 0 });
    setIdleDrift({ x: 0, y: 0, zoom: 0, glow: 0 });
  }, [previewRoomKey]);

  useEffect(() => {
    setActiveItemId((current) => {
      if (current && pickerItems.some((item) => item.id === current)) {
        return current;
      }
      return pickerItems[0]?.id ?? null;
    });
  }, [pickerSignature]);

  const activeGalleryItem = pickerItems.find((item) => item.id === activeItemId) ?? null;
  const activeImageUrls = activeGalleryItem?.imageUrls?.length ? activeGalleryItem.imageUrls : activeGalleryItem ? [activeGalleryItem.imageUrl] : [];
  const activeViewLabels = activeGalleryItem?.viewLabels ?? [];
  const safeActiveIndex = activeImageUrls.length > 0 ? Math.min(activeImageIndex, activeImageUrls.length - 1) : 0;
  const centerImageUrl = activeImageUrls[safeActiveIndex] ?? '';
  const leftImageUrl = activeImageUrls.length > 0 ? activeImageUrls[(safeActiveIndex + activeImageUrls.length - 1) % activeImageUrls.length] : '';
  const rightImageUrl = activeImageUrls.length > 0 ? activeImageUrls[(safeActiveIndex + 1) % activeImageUrls.length] : '';
  const centerLabel = activeViewLabels[safeActiveIndex] ?? `视角 ${safeActiveIndex + 1}`;
  const leftLabel = activeViewLabels.length > 0 ? activeViewLabels[(safeActiveIndex + activeViewLabels.length - 1) % activeViewLabels.length] : '左侧视角';
  const rightLabel = activeViewLabels.length > 0 ? activeViewLabels[(safeActiveIndex + 1) % activeViewLabels.length] : '右侧视角';
  const combinedTiltX = pointerTilt.x * 0.92 + idleDrift.x * 0.85;
  const combinedTiltY = pointerTilt.y * 0.92 + idleDrift.y * 0.85;
  const showEntryOverlay = !isChooserOpen && !isImmersiveActive && !!activeGalleryItem;

  const stopAmbientAudio = () => {
    const audio = ambientAudioRef.current;
    ambientAudioRef.current = null;

    if (!audio) return;

    try {
      audio.cleanup();
    } catch (error) {
      console.warn('Failed to stop ambient audio', error);
    }
  };

  useEffect(() => {
    return () => {
      stopAmbientAudio();
      if (animationFrameRef.current !== null) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (animationFrameRef.current !== null) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }

    if (!isImmersiveActive || isChooserOpen || !activeGalleryItem) {
      setIdleDrift({ x: 0, y: 0, zoom: 0, glow: 0 });
      return;
    }

    const startedAt = performance.now();

    const animate = (now: number) => {
      const t = (now - startedAt) / 1000;
      setIdleDrift({
        x: Math.sin(t * 0.33) * 0.34 + Math.sin(t * 0.18) * 0.12,
        y: Math.cos(t * 0.27) * 0.24 + Math.sin(t * 0.41) * 0.08,
        zoom: (Math.sin(t * 0.2) + 1) / 2,
        glow: (Math.sin(t * 0.31) + 1) / 2,
      });
      animationFrameRef.current = requestAnimationFrame(animate);
    };

    animationFrameRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationFrameRef.current !== null) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
    };
  }, [activeGalleryItem, isChooserOpen, isImmersiveActive]);

  useEffect(() => {
    if (!ambientEnabled || !isImmersiveActive || isChooserOpen) {
      stopAmbientAudio();
      return;
    }

    if (typeof window === 'undefined') return;

    const AudioContextCtor =
      window.AudioContext ||
      (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;

    if (!AudioContextCtor) return;

    const context = new AudioContextCtor();
    const masterGain = context.createGain();
    const padGain = context.createGain();
    const lowPass = context.createBiquadFilter();
    const oscillatorA = context.createOscillator();
    const oscillatorB = context.createOscillator();
    const lfo = context.createOscillator();
    const lfoGain = context.createGain();
    const noiseBuffer = context.createBuffer(1, context.sampleRate * 4, context.sampleRate);
    const channel = noiseBuffer.getChannelData(0);

    let lastNoise = 0;
    for (let index = 0; index < channel.length; index += 1) {
      const white = Math.random() * 2 - 1;
      lastNoise = (lastNoise + 0.02 * white) / 1.02;
      channel[index] = lastNoise * 3.5;
    }

    const noiseSource = context.createBufferSource();
    noiseSource.buffer = noiseBuffer;
    noiseSource.loop = true;

    masterGain.gain.value = 0.03;
    padGain.gain.value = 0.02;
    lowPass.type = 'lowpass';
    lowPass.frequency.value = 760;
    oscillatorA.type = 'sine';
    oscillatorA.frequency.value = 174.61;
    oscillatorB.type = 'triangle';
    oscillatorB.frequency.value = 261.63;
    lfo.type = 'sine';
    lfo.frequency.value = 0.08;
    lfoGain.gain.value = 0.006;

    lfo.connect(lfoGain);
    lfoGain.connect(padGain.gain);
    oscillatorA.connect(padGain);
    oscillatorB.connect(padGain);
    padGain.connect(masterGain);
    noiseSource.connect(lowPass);
    lowPass.connect(masterGain);
    masterGain.connect(context.destination);

    oscillatorA.start();
    oscillatorB.start();
    lfo.start();
    noiseSource.start();
    void context.resume().catch(() => undefined);

    ambientAudioRef.current = {
      context,
      cleanup: () => {
        [noiseSource, oscillatorA, oscillatorB, lfo].forEach((node) => {
          try {
            node.stop();
          } catch {
            // ignore repeated stop calls
          }
        });
        [noiseSource, oscillatorA, oscillatorB, lfo, lfoGain, padGain, lowPass, masterGain].forEach((node) => {
          try {
            node.disconnect();
          } catch {
            // ignore disconnect failures
          }
        });
        if (context.state !== 'closed') {
          void context.close().catch(() => undefined);
        }
      },
    };

    return () => {
      stopAmbientAudio();
    };
  }, [ambientEnabled, isChooserOpen, isImmersiveActive]);

  const handlePointerMove = (event: React.MouseEvent<HTMLDivElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const x = ((event.clientX - rect.left) / rect.width - 0.5) * 2;
    const y = ((event.clientY - rect.top) / rect.height - 0.5) * 2;
    setPointerTilt({ x: clamp(x, -1, 1), y: clamp(y, -1, 1) });
  };

  const resetPointerTilt = () => setPointerTilt({ x: 0, y: 0 });

  const goToPreviousImage = () => {
    if (activeImageUrls.length <= 1) return;
    startTransition(() => {
      setActiveImageIndex((current) => (current - 1 + activeImageUrls.length) % activeImageUrls.length);
    });
  };

  const goToNextImage = () => {
    if (activeImageUrls.length <= 1) return;
    startTransition(() => {
      setActiveImageIndex((current) => (current + 1) % activeImageUrls.length);
    });
  };

  if (pickerItems.length === 0) {
    return (
      <div className="absolute inset-0 overflow-hidden bg-[#080808]">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_20%,rgba(212,175,55,0.16),transparent_42%),radial-gradient(circle_at_50%_100%,rgba(255,255,255,0.06),transparent_35%)]" />
        <div className="absolute inset-0 flex flex-col items-center justify-center px-8 text-center">
          <div className="rounded-full border border-white/10 bg-white/5 p-5 text-stone-100">
            <Box className="h-8 w-8" />
          </div>
          <h3 className="mt-6 text-2xl font-bold text-white">当前还没有可进入沉浸漫游的图组</h3>
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-stone-400">
            先为该房间生成一组效果图，系统才能基于三张视角图构建沉浸式预览舞台。
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="absolute inset-0 overflow-hidden bg-[#050505] text-white">
      {centerImageUrl && (
        <>
          <img
            src={centerImageUrl}
            alt={`${centerLabel}氛围背景`}
            className="pointer-events-none absolute inset-[-10%] h-[120%] w-[120%] object-cover opacity-20 blur-3xl"
            style={{
              transform: `translate3d(${combinedTiltX * -26}px, ${combinedTiltY * -18}px, 0) scale(${1.08 + idleDrift.zoom * 0.05})`,
            }}
            referrerPolicy="no-referrer"
          />
          <img
            src={centerImageUrl}
            alt=""
            aria-hidden="true"
            className="pointer-events-none absolute left-[20%] top-[62%] h-[42%] w-[60%] rounded-[36px] object-cover opacity-[0.14] blur-2xl"
            style={{
              transform: `perspective(1200px) rotateX(82deg) translate3d(${combinedTiltX * 12}px, ${combinedTiltY * 8}px, 0)`,
            }}
            referrerPolicy="no-referrer"
          />
        </>
      )}
      {leftImageUrl && (
        <img
          src={leftImageUrl}
          alt=""
          aria-hidden="true"
          className="pointer-events-none absolute left-[-8%] top-[14%] h-[62%] w-[28%] object-cover opacity-[0.12] blur-2xl"
          style={{
            transform: `translate3d(${combinedTiltX * -18}px, ${combinedTiltY * -12}px, 0) scale(${1.04 + idleDrift.zoom * 0.03})`,
          }}
          referrerPolicy="no-referrer"
        />
      )}
      {rightImageUrl && (
        <img
          src={rightImageUrl}
          alt=""
          aria-hidden="true"
          className="pointer-events-none absolute right-[-8%] top-[14%] h-[62%] w-[28%] object-cover opacity-[0.12] blur-2xl"
          style={{
            transform: `translate3d(${combinedTiltX * -10}px, ${combinedTiltY * -12}px, 0) scale(${1.04 + idleDrift.zoom * 0.03})`,
          }}
          referrerPolicy="no-referrer"
        />
      )}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_15%,rgba(215,183,109,0.24),transparent_32%),radial-gradient(circle_at_50%_100%,rgba(255,255,255,0.08),transparent_32%),linear-gradient(180deg,#0a0a0a_0%,#111111_48%,#050505_100%)]" />
      <div className="absolute inset-x-0 top-0 h-40 bg-gradient-to-b from-white/6 to-transparent pointer-events-none" />
      <div className="absolute inset-x-0 bottom-0 h-56 bg-gradient-to-t from-black via-black/80 to-transparent pointer-events-none" />
      <div
        className="pointer-events-none absolute left-1/2 top-[14%] h-56 w-56 -translate-x-1/2 rounded-full blur-3xl"
        style={{ background: `rgba(243, 211, 136, ${0.12 + idleDrift.glow * 0.12})` }}
      />

      <div className="absolute left-6 top-6 z-30 flex flex-wrap items-center gap-3">
        <div className="rounded-full border border-white/10 bg-black/45 px-4 py-2 backdrop-blur-md">
          <p className="text-[10px] uppercase tracking-[0.24em] text-stone-400">Immersive Preview</p>
          <p className="mt-1 text-sm font-semibold text-white">{activeGalleryItem?.floorName} / {activeGalleryItem?.roomName}</p>
        </div>
        <button
          type="button"
          onClick={() => setIsChooserOpen(true)}
          className="rounded-full border border-white/10 bg-white/8 px-4 py-2 text-xs font-semibold text-white backdrop-blur-md transition-colors hover:bg-white/15"
        >
          选择图组
        </button>
        <button
          type="button"
          onClick={() => setAmbientEnabled((current) => !current)}
          className="flex items-center gap-2 rounded-full border border-white/10 bg-white/8 px-4 py-2 text-xs font-semibold text-white backdrop-blur-md transition-colors hover:bg-white/15"
        >
          {ambientEnabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
          {ambientEnabled ? '环境音已开' : '打开环境音'}
        </button>
      </div>

      <div
        className="absolute inset-0 px-8 pb-24 pt-24"
        onMouseMove={handlePointerMove}
        onMouseLeave={resetPointerTilt}
      >
        <div className="relative mx-auto flex h-full w-full max-w-7xl items-center justify-center" style={{ perspective: '2200px' }}>
          <motion.div
            className="relative h-full w-full"
            animate={{
              rotateX: combinedTiltY * -6,
              rotateY: combinedTiltX * 10,
              scale: 1 + idleDrift.zoom * 0.02,
            }}
            transition={{ type: 'spring', stiffness: 120, damping: 18, mass: 0.6 }}
            style={{ transformStyle: 'preserve-3d' }}
          >
            <div
              className="absolute left-[14%] top-[72%] h-28 w-[72%] -translate-x-1/2 rounded-full bg-[#d7b76d]/30 blur-3xl"
              style={{ transform: `translate3d(${combinedTiltX * 8}px, ${combinedTiltY * 8}px, -90px)` }}
            />
            <div
              className="absolute left-[50%] top-[82%] h-32 w-[58%] -translate-x-1/2 rounded-full bg-white/8 blur-3xl"
              style={{ transform: `translate3d(${combinedTiltX * 6}px, ${combinedTiltY * 8}px, -60px)` }}
            />
            <div
              className="absolute left-1/2 top-[16%] h-[66%] w-[44%] -translate-x-1/2 rounded-[40px] border border-white/6 bg-white/[0.03] blur-[1px]"
              style={{
                transform: `translate3d(${combinedTiltX * 8}px, ${combinedTiltY * -4}px, -40px) scale(${1.01 + idleDrift.zoom * 0.01})`,
              }}
            />

            <div
              className="absolute left-[4%] top-[17%] h-[54%] w-[24%] overflow-hidden rounded-[28px] border border-white/12 bg-black/70 shadow-[0_30px_80px_rgba(0,0,0,0.45)]"
              style={{
                transform: `translate3d(${combinedTiltX * 6}px, ${combinedTiltY * 14}px, -180px) rotateY(42deg) rotateX(${combinedTiltY * -2}deg)`,
                transformStyle: 'preserve-3d',
              }}
            >
              {leftImageUrl && <img src={leftImageUrl} alt={leftLabel} className="h-full w-full object-cover opacity-88" referrerPolicy="no-referrer" />}
              <div className="absolute inset-0 bg-gradient-to-t from-black/45 via-transparent to-black/10" />
              <div className="absolute left-4 top-4 rounded-full border border-white/10 bg-black/45 px-3 py-1 text-[10px] font-semibold tracking-[0.18em] text-stone-200 backdrop-blur-md">
                {leftLabel}
              </div>
            </div>

            <div
              className="absolute left-1/2 top-[9%] h-[66%] w-[40%] -translate-x-1/2 overflow-hidden rounded-[34px] border border-white/14 bg-black shadow-[0_40px_120px_rgba(0,0,0,0.55)]"
              style={{
                transform: `translate3d(${combinedTiltX * -3}px, ${combinedTiltY * -14}px, 140px) rotateX(${combinedTiltY * -1.4}deg)`,
                transformStyle: 'preserve-3d',
              }}
            >
              {centerImageUrl && <img src={centerImageUrl} alt={centerLabel} className="h-full w-full object-cover" referrerPolicy="no-referrer" />}
              <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-black/5" />
              <div className="absolute left-5 top-5 rounded-full border border-[#e4c675]/20 bg-[#3c2b07]/65 px-4 py-1.5 text-[11px] font-semibold tracking-[0.18em] text-[#f3d388] backdrop-blur-md">
                当前主屏
              </div>
              <div className="absolute bottom-5 left-5 right-5">
                <div className="rounded-2xl border border-white/10 bg-black/38 px-4 py-3 backdrop-blur-md">
                  <p className="text-[10px] uppercase tracking-[0.2em] text-stone-400">Active View</p>
                  <p className="mt-1 text-base font-semibold text-white">{centerLabel}</p>
                  <p className="mt-2 text-xs leading-relaxed text-stone-300">
                    当前以中屏为主视口，两侧保留其余机位作为空间包裹感，镜头会缓慢前推，鼠标移动可微调透视。
                  </p>
                </div>
              </div>
            </div>

            <div
              className="absolute right-[4%] top-[17%] h-[54%] w-[24%] overflow-hidden rounded-[28px] border border-white/12 bg-black/70 shadow-[0_30px_80px_rgba(0,0,0,0.45)]"
              style={{
                transform: `translate3d(${combinedTiltX * 2}px, ${combinedTiltY * 14}px, -180px) rotateY(-42deg) rotateX(${combinedTiltY * -2}deg)`,
                transformStyle: 'preserve-3d',
              }}
            >
              {rightImageUrl && <img src={rightImageUrl} alt={rightLabel} className="h-full w-full object-cover opacity-88" referrerPolicy="no-referrer" />}
              <div className="absolute inset-0 bg-gradient-to-t from-black/45 via-transparent to-black/10" />
              <div className="absolute right-4 top-4 rounded-full border border-white/10 bg-black/45 px-3 py-1 text-[10px] font-semibold tracking-[0.18em] text-stone-200 backdrop-blur-md">
                {rightLabel}
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      <div className="absolute bottom-6 left-1/2 z-30 flex w-[min(92%,980px)] -translate-x-1/2 items-end justify-between gap-4">
        <div className="rounded-2xl border border-white/10 bg-black/45 px-4 py-3 text-xs leading-relaxed text-stone-300 backdrop-blur-md">
          <p className="font-semibold text-white">沉浸式 2.5D 预览</p>
          <p className="mt-1">当前基于同组渲染图构建三联空间舞台，强化镜头前推、景深包裹和氛围感，适合先做方案感受与机位比对。</p>
        </div>
        <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-black/45 px-4 py-3 backdrop-blur-md">
          <button
            type="button"
            onClick={goToPreviousImage}
            className="rounded-full border border-white/10 bg-white/8 p-2 text-white transition-colors hover:bg-white/16"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <div className="flex items-center gap-2">
            {activeImageUrls.map((imageUrl, index) => (
              <button
                key={`${activeGalleryItem?.id}-${imageUrl}-${index}`}
                type="button"
                onClick={() => {
                  startTransition(() => {
                    setActiveImageIndex(index);
                  });
                }}
                className={`overflow-hidden rounded-xl border transition-all ${
                  index === safeActiveIndex
                    ? 'border-[#f3d388] shadow-[0_0_0_1px_rgba(243,211,136,0.5)]'
                    : 'border-white/10 opacity-80 hover:opacity-100'
                }`}
              >
                <img
                  src={imageUrl}
                  alt={`${activeGalleryItem?.roomName}-3d缩略图-${index + 1}`}
                  className="h-16 w-24 object-cover"
                  referrerPolicy="no-referrer"
                />
              </button>
            ))}
          </div>
          <button
            type="button"
            onClick={goToNextImage}
            className="rounded-full border border-white/10 bg-white/8 p-2 text-white transition-colors hover:bg-white/16"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>
      </div>

      <AnimatePresence>
        {showEntryOverlay && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-40 flex items-center justify-center bg-black/42 p-6 backdrop-blur-sm"
          >
            <motion.div
              initial={{ opacity: 0, y: 24, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 18, scale: 0.98 }}
              className="w-full max-w-2xl rounded-[28px] border border-white/10 bg-[#111111]/92 p-8 text-center shadow-2xl"
            >
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full border border-[#f3d388]/25 bg-[#f3d388]/10 text-[#f3d388]">
                <Sparkles className="h-7 w-7" />
              </div>
              <p className="mt-5 text-[11px] uppercase tracking-[0.32em] text-stone-500">Immersive Entry</p>
              <h3 className="mt-3 text-3xl font-bold text-white">进入沉浸式空间预览</h3>
              <p className="mt-3 text-sm leading-relaxed text-stone-300">
                已选择 {activeGalleryItem?.floorName} / {activeGalleryItem?.roomName} 图组。进入后会启动慢速镜头推进、分层景深和多机位包裹视效，
                用来更直观地感受这组双视角效果图。
              </p>
              <div className="mt-6 flex flex-wrap items-center justify-center gap-3 text-xs text-stone-300">
                <div className="rounded-full border border-white/10 bg-white/[0.04] px-4 py-2">当前图组 {activeImageUrls.length} 张视角</div>
                <button
                  type="button"
                  onClick={() => setAmbientEnabled((current) => !current)}
                  className="flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 transition-colors hover:bg-white/[0.08]"
                >
                  {ambientEnabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
                  {ambientEnabled ? '进入时同时开启环境音' : '进入时保持静音'}
                </button>
              </div>
              <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
                <button
                  type="button"
                  onClick={() => setIsChooserOpen(true)}
                  className="rounded-full border border-white/10 bg-white/[0.04] px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-white/[0.08]"
                >
                  重新选择图组
                </button>
                <button
                  type="button"
                  onClick={() => setIsImmersiveActive(true)}
                  className="rounded-full bg-[#f3d388] px-6 py-3 text-sm font-semibold text-[#241800] transition-transform hover:scale-[1.02]"
                >
                  进入沉浸预览
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isChooserOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-40 flex items-center justify-center bg-black/68 p-6 backdrop-blur-sm"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.98, y: 18 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.98, y: 18 }}
              className="w-full max-w-5xl rounded-[28px] border border-white/10 bg-[#111111]/96 p-6 shadow-2xl"
            >
              <div className="flex items-start justify-between gap-6">
                <div>
                  <p className="text-[10px] uppercase tracking-[0.24em] text-stone-500">Select Preview Set</p>
                  <h3 className="mt-2 text-2xl font-bold text-white">选择已生成图组进入沉浸漫游</h3>
                  <p className="mt-2 max-w-3xl text-sm leading-relaxed text-stone-400">
                    {roomGalleryItems.length > 0
                      ? `当前房间 ${selectedFloor?.name} / ${selectedRoom?.name} 已有 ${roomGalleryItems.length} 组结果，选择其中一组进入沉浸式预览。`
                      : `当前房间 ${selectedFloor?.name} / ${selectedRoom?.name} 还没有已生成结果，先从其它已生成房间中选择一组预览。`}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsChooserOpen(false)}
                  className="rounded-full p-2 text-stone-400 transition-colors hover:bg-white/10 hover:text-white"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="mt-6 grid max-h-[60vh] grid-cols-1 gap-4 overflow-y-auto pr-2 md:grid-cols-2 xl:grid-cols-3">
                {pickerItems.map((item) => {
                  const imageUrls = item.imageUrls?.length ? item.imageUrls : [item.imageUrl];
                  const isActive = item.id === activeItemId;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => {
                        startTransition(() => {
                          setActiveItemId(item.id);
                          setActiveImageIndex(0);
                          setIsImmersiveActive(false);
                          setIsChooserOpen(false);
                        });
                      }}
                      className={`overflow-hidden rounded-2xl border text-left transition-all ${
                        isActive
                          ? 'border-[#f3d388] bg-white/[0.06] shadow-[0_0_0_1px_rgba(243,211,136,0.42)]'
                          : 'border-white/10 bg-white/[0.03] hover:border-white/20 hover:bg-white/[0.05]'
                      }`}
                    >
                      <div className="relative aspect-[16/10] overflow-hidden">
                        <img
                          src={item.imageUrl}
                          alt={`${item.roomName}图组封面`}
                          className="h-full w-full object-cover"
                          referrerPolicy="no-referrer"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/15 to-transparent" />
                        <div className="absolute left-4 top-4 rounded-full border border-white/10 bg-black/45 px-3 py-1 text-[10px] font-semibold tracking-[0.18em] text-white backdrop-blur-md">
                          {imageUrls.length} 视角
                        </div>
                        <div className="absolute bottom-4 left-4 right-4">
                          <p className="text-sm font-semibold text-white">{item.floorName} / {item.roomName}</p>
                          <p className="mt-1 text-xs text-stone-300">{new Date(item.createdAt).toLocaleString('zh-CN')}</p>
                        </div>
                      </div>
                      <div className="px-4 py-4">
                        <p className="text-[11px] text-stone-400">视角组</p>
                        <p className="mt-1 text-sm text-stone-200">{(item.viewLabels ?? []).join(' / ') || '双视角方案'}</p>
                        <p className="mt-3 text-[11px] text-[#f3d388]">点击进入沉浸漫游</p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function MainCanvas({ selectedFloor, selectedRoom, galleryItems, setSelectedRoomId, setShowLeftPanel, setShowRightPanel }: any) {
  const currentFloorPlan = FLOOR_PLAN_IMAGES[selectedFloor?.id];
  const [scale, setScale] = useState(1);
  const [viewMode, setViewMode] = useState<'2d' | '3d' | 'panorama'>('2d');
  const [hoveredRoomId, setHoveredRoomId] = useState<string | null>(null);

  const handleZoomIn = () => setScale(s => Math.min(s + 0.25, 2.5));
  const handleZoomOut = () => setScale(s => Math.max(s - 0.25, 0.5));
  const handleFocus = () => setScale(1);
  const polygonPoints = (area: Point[]) => area.map(([x, y]) => `${x},${y}`).join(' ');

  return (
    <section className="relative flex min-h-0 flex-1 flex-col overflow-hidden bg-surface-container-low w-full lg:ml-60 lg:mr-72 xl:ml-64 xl:mr-[19rem] 2xl:mr-80">
      {/* Mobile Toggle Buttons */}
      <div className="absolute top-4 left-4 right-4 flex justify-between z-30 lg:hidden pointer-events-none">
        <button onClick={() => setShowLeftPanel(true)} className="p-2.5 bg-white text-stone-700 shadow-lg rounded-full pointer-events-auto border border-stone-200">
          <Layers className="w-5 h-5" />
        </button>
        <button onClick={() => setShowRightPanel(true)} className="p-2.5 bg-stone-900 text-stone-100 shadow-lg rounded-full pointer-events-auto border border-stone-700">
          <Sliders className="w-5 h-5" />
        </button>
      </div>

      <div className="relative z-10 shrink-0 px-4 pt-16 lg:px-6 lg:pt-5 xl:px-8">
        <h2 className="text-lg lg:text-2xl font-bold text-primary flex items-center gap-2 lg:gap-3">
          AI 室内设计
          <span className="text-[8px] lg:text-[10px] px-2 py-0.5 bg-tertiary text-on-tertiary rounded-full tracking-wider font-normal">PRO</span>
        </h2>
        <p className="text-stone-500 lg:text-stone-400 text-[10px] lg:text-xs mt-1">当前操作：{selectedFloor?.name} &gt; {selectedRoom?.name}</p>
      </div>
      
      <div className="flex min-h-0 flex-1 items-center justify-center px-4 pb-3 pt-3 lg:px-6 lg:pb-4 xl:px-8">
        <div className="flex h-full w-full items-center justify-center">
          <div className="group relative aspect-[179/168] h-full max-h-full w-auto max-w-full overflow-hidden rounded-lg border border-surface-container bg-white shadow-2xl">
          
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
                  <div className="absolute inset-0 bg-[#f7f5f2]"></div>
                  <div
                    className="absolute inset-0 opacity-40"
                    style={{
                      backgroundImage: 'linear-gradient(#e8e2d8 1px, transparent 1px), linear-gradient(90deg, #e8e2d8 1px, transparent 1px)',
                      backgroundSize: '24px 24px'
                    }}
                  ></div>
                  {currentFloorPlan && (
                    <img
                      src={currentFloorPlan}
                      alt={`${selectedFloor.name}平面图`}
                      className="absolute inset-0 h-full w-full object-cover"
                    />
                  )}
                  <div className="absolute inset-x-0 top-0 h-20 bg-gradient-to-b from-white/50 to-transparent"></div>
                  <div className="absolute right-4 top-4 z-30 rounded-full border border-[#d3c4a1] bg-white/90 px-3 py-1 text-[10px] font-semibold tracking-[0.18em] text-[#8a6a17] shadow-sm backdrop-blur-sm">
                    REAL FLOOR PLAN
                  </div>

                  <div className="absolute inset-0 z-20">
                    <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="h-full w-full">
                      {selectedFloor.rooms.flatMap((room: RoomDefinition, roomIndex: number) => {
                        const isSelected = selectedRoom?.id === room.id;
                        const isHovered = hoveredRoomId === room.id;

                        return room.areas.map((area, areaIndex) => (
                          <motion.polygon
                            key={`${selectedFloor.id}-${room.id}-${areaIndex}`}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ duration: 0.25, delay: roomIndex * 0.025 + areaIndex * 0.02 }}
                            points={polygonPoints(area)}
                            vectorEffect="non-scaling-stroke"
                            fill={isSelected ? 'rgba(214, 184, 103, 0.28)' : isHovered ? 'rgba(214, 184, 103, 0.18)' : 'rgba(255,255,255,0.03)'}
                            stroke={isSelected ? '#8a6a17' : isHovered ? '#b98d24' : 'rgba(87,83,78,0.48)'}
                            strokeWidth={isSelected ? 0.5 : 0.28}
                            style={{ cursor: 'pointer' }}
                            onMouseEnter={() => setHoveredRoomId(room.id)}
                            onMouseLeave={() => setHoveredRoomId((current) => current === room.id ? null : current)}
                            onClick={() => setSelectedRoomId(room.id)}
                          />
                        ));
                      })}
                    </svg>
                  </div>

                  <div className="absolute inset-0 z-30 pointer-events-none">
                    {selectedFloor.rooms
                      .filter((room: RoomDefinition) => room.id === selectedRoom?.id || room.id === hoveredRoomId)
                      .map((room: RoomDefinition) => {
                        const isSelected = selectedRoom?.id === room.id;

                        return (
                          <motion.div
                            key={`label-${room.id}`}
                            initial={{ opacity: 0, y: 6, scale: 0.96 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: 6, scale: 0.96 }}
                            className="absolute"
                            style={{
                              left: `${room.labelAnchor[0]}%`,
                              top: `${room.labelAnchor[1]}%`,
                              transform: 'translate(-50%, -50%)',
                            }}
                          >
                            <div className={`rounded-full px-3 py-1 text-[10px] font-bold tracking-[0.08em] shadow-lg ${isSelected ? 'bg-[#8a6a17] text-white' : 'bg-white/92 text-stone-700'}`}>
                              {room.name}
                            </div>
                            {isSelected && (
                              <div className="mt-1 w-fit rounded-full bg-white/92 px-2 py-0.5 text-[10px] font-medium text-[#8a6a17] shadow-sm">
                                已选中
                              </div>
                            )}
                          </motion.div>
                        );
                      })}
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
                    className="absolute inset-0"
                  >
                    <React.Suspense
                      fallback={
                        <div className="absolute inset-0 flex items-center justify-center bg-[#090909] text-white">
                          <div className="flex flex-col items-center gap-3 text-center">
                            <Loader2 className="h-8 w-8 animate-spin text-[#f1d188]" />
                            <div>
                              <p className="text-sm font-semibold">正在载入沉浸漫游预览</p>
                              <p className="mt-1 text-xs text-stone-400">首次进入会稍慢一些</p>
                            </div>
                          </div>
                        </div>
                      }
                    >
                      <DepthMapPreview3D
                        selectedFloor={selectedFloor}
                        selectedRoom={selectedRoom}
                        galleryItems={galleryItems}
                      />
                    </React.Suspense>
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
                    <span>拖拽以环视整间空间</span>
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
          沉浸漫游
        </button>
      </div>
    </section>
  );
}

function RightSidebar({ selectedFloor, selectedRoom, selectedSegmentation, selectedStyleId, onStyleChange, onGenerate, onOpenEditor, showRightPanel }: any) {
  const [resolution, setResolution] = useState('2k');
  const [customPrompt, setCustomPrompt] = useState('');
  const [naturalLight, setNaturalLight] = useState(75);
  const [indirectLight, setIndirectLight] = useState(42);
  const [rtxEnabled, setRtxEnabled] = useState(true);
  const selectedStyle = STYLE_PRESETS.find((item) => item.id === selectedStyleId) ?? STYLE_PRESETS[0];

  return (
    <aside className={`fixed right-0 top-16 h-[calc(100vh-64px)] w-64 sm:w-72 lg:w-72 xl:w-[19rem] 2xl:w-80 bg-stone-950 text-stone-100 flex flex-col z-40 transition-transform duration-300 ${showRightPanel ? 'translate-x-0' : 'translate-x-full'} lg:translate-x-0`}>
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
              <label className="block text-[10px] lg:text-[11px] font-bold text-stone-500 uppercase mb-3 tracking-widest">设计风格</label>
              <div className="space-y-2">
                {STYLE_PRESETS.map((style) => {
                  const isActive = style.id === selectedStyle.id;
                  return (
                    <button
                      key={style.id}
                      type="button"
                      onClick={() => onStyleChange(style.id)}
                      className={`w-full rounded-sm border px-3 py-3 text-left transition-colors ${
                        isActive
                          ? 'border-[#b58512] bg-[#2b2110] text-white'
                          : 'border-stone-800 bg-stone-900/50 text-stone-300 hover:border-stone-600 hover:bg-stone-900'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-3">
                        <span className="text-xs font-semibold">{style.name}</span>
                        {isActive && <CheckCircle2 className="h-4 w-4 text-[#d8bd7a]" />}
                      </div>
                      <p className={`mt-1 text-[10px] leading-relaxed ${isActive ? 'text-stone-200' : 'text-stone-500'}`}>
                        {style.description}
                      </p>
                    </button>
                  );
                })}
              </div>
            </div>

            {selectedSegmentation && (
              <div>
                <label className="block text-[10px] lg:text-[11px] font-bold text-stone-500 uppercase mb-3 tracking-widest">AI 裁剪区域</label>
                <div className="rounded-sm border border-stone-800 bg-stone-900/60 p-3 space-y-3">
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      type="button"
                      onClick={onOpenEditor}
                      className="rounded-sm border border-stone-800 bg-stone-950/70 p-2 text-left transition-colors hover:border-[#8a6a17] hover:bg-stone-900"
                    >
                      <p className="text-[9px] uppercase tracking-[0.16em] text-stone-500">裁剪预览</p>
                      <img
                        src={selectedSegmentation.cropPreviewDataUrl}
                        alt={`${selectedRoom?.name}裁剪预览`}
                        className="mt-2 aspect-square w-full rounded-sm border border-stone-800 object-contain bg-[#f8f3e7]"
                      />
                      <p className="mt-2 text-[10px] text-[#d8bd7a]">点击进入人工校准</p>
                    </button>
                    <div className="rounded-sm border border-stone-800 bg-stone-950/70 p-2">
                      <p className="text-[9px] uppercase tracking-[0.16em] text-stone-500">定位平面图</p>
                      <img
                        src={selectedSegmentation.planSliceDataUrl}
                        alt={`${selectedRoom?.name}裁剪平面图`}
                        className="mt-2 aspect-square w-full rounded-sm border border-stone-800 object-contain bg-[#f8f3e7]"
                      />
                      <p className="mt-2 text-[10px] text-stone-500">保留周边墙体关系，高亮当前房间位置</p>
                    </div>
                    <div className="rounded-sm border border-stone-800 bg-stone-950/70 p-2">
                      <p className="text-[9px] uppercase tracking-[0.16em] text-stone-500">Mask 预览</p>
                      <img
                        src={selectedSegmentation.maskDataUrl}
                        alt={`${selectedRoom?.name}mask预览`}
                        className="mt-2 aspect-square w-full rounded-sm border border-stone-800 object-contain bg-black"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-[10px] text-stone-300">
                    <div className="rounded-sm bg-stone-950/70 px-2 py-2">
                      <span className="block text-stone-500">楼层</span>
                      <span className="mt-1 block font-medium text-white">{selectedFloor?.name}</span>
                    </div>
                    <div className="rounded-sm bg-stone-950/70 px-2 py-2">
                      <span className="block text-stone-500">多边形数</span>
                      <span className="mt-1 block font-medium text-white">{selectedSegmentation.polygonCount}</span>
                    </div>
                    <div className="rounded-sm bg-stone-950/70 px-2 py-2">
                      <span className="block text-stone-500">覆盖面积</span>
                      <span className="mt-1 block font-medium text-white">{selectedSegmentation.coveragePercent.toFixed(1)}%</span>
                    </div>
                    <div className="rounded-sm bg-stone-950/70 px-2 py-2">
                      <span className="block text-stone-500">边界框</span>
                      <span className="mt-1 block font-medium text-white">
                        {selectedSegmentation.bbox.width.toFixed(1)} x {selectedSegmentation.bbox.height.toFixed(1)}
                      </span>
                    </div>
                  </div>
                  <p className="text-[10px] leading-relaxed text-stone-400">
                    当前裁剪只取内墙线以内的空间，作为后续 AI 精装生成的保守有效区域，不向相邻房间外扩。
                  </p>
                </div>
              </div>
            )}

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
                  onClick={() => setResolution('2k')}
                  className={`px-2 lg:px-3 py-2 lg:py-3 border flex flex-col items-center gap-1 transition-colors rounded-sm ${resolution === '2k' ? 'border-tertiary bg-tertiary/10 text-tertiary-fixed-dim' : 'border-stone-800 bg-stone-900/50 hover:border-stone-600 text-stone-300'}`}
                >
                  <span className="text-[11px] lg:text-xs font-bold">2K</span>
                  <span className={`text-[9px] lg:text-[10px] ${resolution === '2k' ? 'text-tertiary-fixed-dim/70' : 'text-stone-500'}`}>推荐双视角</span>
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
          onClick={() => onGenerate({
            resolution,
            customPrompt,
            naturalLight,
            indirectLight,
            rtxEnabled,
            styleId: selectedStyle.id,
          })}
          whileHover={{ scale: 1.02 }} 
          whileTap={{ scale: 0.98 }} 
          className="w-full py-3 lg:py-4 bg-gradient-to-r from-primary-container to-primary text-white font-headline font-extrabold text-xs lg:text-sm tracking-[0.2em] shadow-2xl hover:shadow-primary/20 transition-all flex items-center justify-center gap-2 lg:gap-3 rounded-sm"
        >
          <Sparkles className="w-4 h-4 lg:w-5 lg:h-5" />
          生成双视角效果图
        </motion.button>
      </div>
    </aside>
  );
}

function CropEditorModal({ isOpen, floor, room, baseRoom, floorImage, onClose, onSave }: any) {
  const editorRef = useRef<HTMLDivElement | null>(null);
  const [draftAreas, setDraftAreas] = useState<Point[][]>([]);
  const [activeHandle, setActiveHandle] = useState<{ areaIndex: number; pointIndex: number } | null>(null);
  const [selectedHandle, setSelectedHandle] = useState<{ areaIndex: number; pointIndex: number } | null>(null);

  useEffect(() => {
    if (isOpen && room) {
      setDraftAreas(cloneAreas(room.areas));
      setActiveHandle(null);
      setSelectedHandle(null);
    }
  }, [isOpen, room]);

  useEffect(() => {
    if (!isOpen) return undefined;

    const handleWindowPointerUp = () => {
      setActiveHandle(null);
    };

    window.addEventListener('pointerup', handleWindowPointerUp);

    return () => {
      window.removeEventListener('pointerup', handleWindowPointerUp);
    };
  }, [isOpen]);

  if (!isOpen || !room || !floor) return null;

  const handlePointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!activeHandle || !editorRef.current) return;

    const rect = editorRef.current.getBoundingClientRect();
    const x = clamp(((event.clientX - rect.left) / rect.width) * 100, 0, 100);
    const y = clamp(((event.clientY - rect.top) / rect.height) * 100, 0, 100);

    setDraftAreas((current) =>
      current.map((area, areaIndex) =>
        areaIndex === activeHandle.areaIndex
          ? area.map((point, pointIndex) => pointIndex === activeHandle.pointIndex ? [x, y] : point)
          : area
      )
    );
  };

  const handleSave = () => {
    const bbox = getRoomBoundingBox(draftAreas);
    onSave(room.id, {
      areas: cloneAreas(draftAreas),
      labelAnchor: [bbox.centerX, bbox.centerY] as Point,
    });
  };

  const insertPointAfterSelected = () => {
    if (!selectedHandle) return;

    setDraftAreas((current) =>
      current.map((area, areaIndex) => {
        if (areaIndex !== selectedHandle.areaIndex) return area;

        const currentPoint = area[selectedHandle.pointIndex];
        const nextPoint = area[(selectedHandle.pointIndex + 1) % area.length];
        const midpoint: Point = [
          Number(((currentPoint[0] + nextPoint[0]) / 2).toFixed(1)),
          Number(((currentPoint[1] + nextPoint[1]) / 2).toFixed(1)),
        ];
        const nextArea = [...area];
        nextArea.splice(selectedHandle.pointIndex + 1, 0, midpoint);
        return nextArea;
      })
    );

    setSelectedHandle((current) =>
      current
        ? { areaIndex: current.areaIndex, pointIndex: current.pointIndex + 1 }
        : current
    );
  };

  const deleteSelectedPoint = () => {
    if (!selectedHandle) return;

    setDraftAreas((current) =>
      current.map((area, areaIndex) => {
        if (areaIndex !== selectedHandle.areaIndex) return area;
        if (area.length <= 3) return area;
        return area.filter((_, pointIndex) => pointIndex !== selectedHandle.pointIndex);
      })
    );

    setSelectedHandle(null);
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[120] flex items-center justify-center bg-stone-950/85 p-3 md:p-6"
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.98, y: 12 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.98, y: 12 }}
          className="flex h-full max-h-[calc(100vh-1.5rem)] w-full max-w-7xl flex-col overflow-hidden rounded-2xl border border-stone-700 bg-[#111111] shadow-2xl md:max-h-[calc(100vh-3rem)]"
        >
          <div className="flex items-center justify-between border-b border-stone-800 px-5 py-4">
            <div>
              <p className="text-[10px] uppercase tracking-[0.22em] text-stone-500">Manual Crop Editor</p>
              <h2 className="mt-1 text-lg font-bold text-white">{floor.name} / {room.name}</h2>
              <p className="mt-1 text-xs text-stone-400">拖拽顶点，把裁剪轮廓压在房间内墙线以内。建议保守处理，不要跨门洞和走廊。</p>
            </div>
            <button onClick={onClose} className="rounded-full p-2 text-stone-400 transition-colors hover:bg-stone-800 hover:text-white">
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="grid min-h-0 flex-1 gap-0 lg:grid-cols-[minmax(0,1fr)_320px]">
            <div className="min-h-0 overflow-auto bg-[#0c0c0c] p-4 md:p-6">
              <div
                ref={editorRef}
                onPointerMove={handlePointerMove}
                onPointerUp={() => setActiveHandle(null)}
                onPointerLeave={() => setActiveHandle(null)}
                className="relative mx-auto aspect-[179/168] w-full max-w-6xl overflow-hidden rounded-xl border border-stone-700 bg-[#f7f5f2] shadow-inner touch-none"
              >
                <img src={floorImage} alt={`${floor.name}平面图`} className="absolute inset-0 h-full w-full object-cover" />
                <div className="absolute inset-0 bg-[linear-gradient(rgba(192,155,72,0.14)_1px,transparent_1px),linear-gradient(90deg,rgba(192,155,72,0.14)_1px,transparent_1px)] bg-[size:24px_24px] opacity-50"></div>
                <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="absolute inset-0 h-full w-full">
                  {draftAreas.map((area: Point[], areaIndex: number) => (
                    <g key={`${room.id}-${areaIndex}`}>
                      <polygon
                        points={toPolygonPoints(area)}
                        fill="rgba(214, 184, 103, 0.24)"
                        stroke="#b98d24"
                        strokeWidth="0.42"
                        vectorEffect="non-scaling-stroke"
                      />
                      {area.map(([x, y], pointIndex) => (
                        <g key={`${room.id}-${areaIndex}-${pointIndex}`}>
                          <circle
                            cx={x}
                            cy={y}
                            r={selectedHandle?.areaIndex === areaIndex && selectedHandle?.pointIndex === pointIndex ? '1.7' : '1.25'}
                            fill={selectedHandle?.areaIndex === areaIndex && selectedHandle?.pointIndex === pointIndex ? '#f4d27d' : '#ffffff'}
                            stroke="#8a6a17"
                            strokeWidth={selectedHandle?.areaIndex === areaIndex && selectedHandle?.pointIndex === pointIndex ? '0.42' : '0.28'}
                            vectorEffect="non-scaling-stroke"
                            style={{ cursor: 'grab' }}
                            onPointerDown={(event) => {
                              event.preventDefault();
                              setActiveHandle({ areaIndex, pointIndex });
                              setSelectedHandle({ areaIndex, pointIndex });
                            }}
                            onClick={() => {
                              setSelectedHandle({ areaIndex, pointIndex });
                            }}
                          />
                          <text
                            x={x + 1.2}
                            y={y - 1.2}
                            fontSize="1.8"
                            fill="#6b5314"
                            stroke="#ffffff"
                            strokeWidth="0.08"
                            paintOrder="stroke"
                          >
                            {pointIndex + 1}
                          </text>
                        </g>
                      ))}
                    </g>
                  ))}
                </svg>
              </div>
            </div>

            <div className="min-h-0 overflow-y-auto border-t border-stone-800 bg-stone-950 p-5 lg:border-l lg:border-t-0">
              <div className="space-y-5">
                <div className="rounded-xl border border-stone-800 bg-stone-900/70 p-4">
                  <p className="text-[10px] uppercase tracking-[0.18em] text-stone-500">校准原则</p>
                  <ul className="mt-3 space-y-2 text-xs leading-relaxed text-stone-300">
                    <li>顶点尽量贴着内墙线，不要压到相邻房间。</li>
                    <li>门洞附近建议内收一点，避免 AI 生成穿帮到过道。</li>
                    <li>如果要保守裁剪，宁可略小，也不要越界。</li>
                  </ul>
                </div>

                <div className="rounded-xl border border-stone-800 bg-stone-900/70 p-4">
                  <p className="text-[10px] uppercase tracking-[0.18em] text-stone-500">当前多边形</p>
                  <div className="mt-3 space-y-3">
                    {draftAreas.map((area: Point[], areaIndex: number) => (
                      <div key={`${room.id}-coords-${areaIndex}`} className="rounded-lg bg-stone-950/80 p-3">
                        <p className="text-[11px] font-semibold text-white">区域 {areaIndex + 1}</p>
                        <p className="mt-2 text-[10px] leading-5 text-stone-400">
                          {area.map(([x, y], pointIndex) => `P${pointIndex + 1}(${x.toFixed(1)}, ${y.toFixed(1)})`).join('  ')}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="rounded-xl border border-stone-800 bg-stone-900/70 p-4">
                  <p className="text-[10px] uppercase tracking-[0.18em] text-stone-500">顶点编辑</p>
                  <div className="mt-3 space-y-3">
                    <div className="rounded-lg bg-stone-950/80 p-3 text-[11px] text-stone-300">
                      {selectedHandle ? (
                        <>
                          <p className="font-semibold text-white">已选中顶点</p>
                          <p className="mt-1">
                            区域 {selectedHandle.areaIndex + 1} / 顶点 {selectedHandle.pointIndex + 1}
                          </p>
                          <p className="mt-1 text-stone-400">
                            先点中一个顶点，再新增或删除。新增会在当前点和下一点之间插入一个中点。
                          </p>
                        </>
                      ) : (
                        <p className="text-stone-400">先在左侧图上点中一个顶点，再进行新增或删除操作。</p>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <button
                        onClick={insertPointAfterSelected}
                        disabled={!selectedHandle}
                        className="rounded-lg border border-stone-700 px-3 py-2 text-sm font-medium text-stone-200 transition-colors enabled:hover:bg-stone-800 disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        新增顶点
                      </button>
                      <button
                        onClick={deleteSelectedPoint}
                        disabled={!selectedHandle || draftAreas[selectedHandle.areaIndex]?.length <= 3}
                        className="rounded-lg border border-stone-700 px-3 py-2 text-sm font-medium text-stone-200 transition-colors enabled:hover:bg-stone-800 disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        删除顶点
                      </button>
                    </div>
                  </div>
                </div>

                <div className="rounded-xl border border-stone-800 bg-stone-900/70 p-4">
                  <p className="text-[10px] uppercase tracking-[0.18em] text-stone-500">实时范围</p>
                  <div className="mt-3 grid grid-cols-2 gap-2 text-[11px] text-stone-300">
                    <div className="rounded-md bg-stone-950/80 px-3 py-2">
                      <span className="block text-stone-500">宽度</span>
                      <span className="mt-1 block font-semibold text-white">{getRoomBoundingBox(draftAreas).width.toFixed(1)}</span>
                    </div>
                    <div className="rounded-md bg-stone-950/80 px-3 py-2">
                      <span className="block text-stone-500">高度</span>
                      <span className="mt-1 block font-semibold text-white">{getRoomBoundingBox(draftAreas).height.toFixed(1)}</span>
                    </div>
                    <div className="rounded-md bg-stone-950/80 px-3 py-2">
                      <span className="block text-stone-500">中心 X</span>
                      <span className="mt-1 block font-semibold text-white">{getRoomBoundingBox(draftAreas).centerX.toFixed(1)}</span>
                    </div>
                    <div className="rounded-md bg-stone-950/80 px-3 py-2">
                      <span className="block text-stone-500">中心 Y</span>
                      <span className="mt-1 block font-semibold text-white">{getRoomBoundingBox(draftAreas).centerY.toFixed(1)}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="sticky bottom-0 mt-6 flex flex-wrap gap-3 border-t border-stone-800 bg-stone-950 pt-4">
                <button
                  onClick={() => {
                    if (!baseRoom) return;
                    setDraftAreas(cloneAreas(baseRoom.areas));
                    setSelectedHandle(null);
                    setActiveHandle(null);
                  }}
                  className="rounded-lg border border-stone-700 px-4 py-2 text-sm font-medium text-stone-300 transition-colors hover:bg-stone-800 hover:text-white"
                >
                  恢复默认轮廓
                </button>
                <button onClick={onClose} className="rounded-lg border border-stone-700 px-4 py-2 text-sm font-medium text-stone-300 transition-colors hover:bg-stone-800 hover:text-white">
                  取消
                </button>
                <button onClick={handleSave} className="rounded-lg bg-[#8a6a17] px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-[#9d7a1d]">
                  保存人工校准
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
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

function GalleryView({ galleryItems }: { galleryItems: GalleryItem[] }) {
  const [activeGalleryItem, setActiveGalleryItem] = useState<GalleryItem | null>(null);
  const [activeImageIndex, setActiveImageIndex] = useState(0);

  const activeImageUrls = activeGalleryItem?.imageUrls ?? (activeGalleryItem ? [activeGalleryItem.imageUrl] : []);
  const activeViewLabels = activeGalleryItem?.viewLabels ?? [];
  const activeImageUrl = activeImageUrls[activeImageIndex] ?? activeGalleryItem?.imageUrl ?? '';
  const activeImageLabel = activeViewLabels[activeImageIndex] ?? `视角 ${activeImageIndex + 1}`;

  useEffect(() => {
    if (!activeGalleryItem) return undefined;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setActiveGalleryItem(null);
        return;
      }

      if (activeImageUrls.length <= 1) return;

      if (event.key === 'ArrowRight') {
        setActiveImageIndex((current) => (current + 1) % activeImageUrls.length);
      }

      if (event.key === 'ArrowLeft') {
        setActiveImageIndex((current) => (current - 1 + activeImageUrls.length) % activeImageUrls.length);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeGalleryItem, activeImageUrls.length]);

  const openGalleryItem = (item: GalleryItem) => {
    setActiveGalleryItem(item);
    setActiveImageIndex(0);
  };

  const goToPreviousImage = () => {
    if (activeImageUrls.length <= 1) return;
    setActiveImageIndex((current) => (current - 1 + activeImageUrls.length) % activeImageUrls.length);
  };

  const goToNextImage = () => {
    if (activeImageUrls.length <= 1) return;
    setActiveImageIndex((current) => (current + 1) % activeImageUrls.length);
  };

  return (
    <>
      <div className="flex-1 p-4 md:p-8 overflow-y-auto bg-surface-container-low w-full">
        <div className="max-w-6xl mx-auto">
        <h2 className="text-xl md:text-2xl font-bold text-primary mb-4 md:mb-6">展示图库</h2>
        {galleryItems.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-stone-300 bg-white/80 px-8 py-16 text-center shadow-sm">
            <h3 className="text-lg font-semibold text-primary">还没有保存的真实渲染结果</h3>
            <p className="mt-2 text-sm text-stone-500">生成成功后会自动写入图库并持久化保存，这里会显示每次真实产图记录。</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
            {galleryItems.map((item, i) => {
              const imageUrls = item.imageUrls ?? [item.imageUrl];
              const viewLabels = item.viewLabels ?? [];

              return (
                <motion.div 
                  key={item.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1 }}
                  className="group relative aspect-[4/3] rounded-lg overflow-hidden shadow-md transition-all hover:shadow-xl"
                >
                  <button
                    type="button"
                    onClick={() => openGalleryItem(item)}
                    className="h-full w-full text-left"
                  >
                    <img src={item.imageUrl} alt={`${item.roomName}设计方案`} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" referrerPolicy="no-referrer" />
                    {imageUrls.length > 1 && (
                      <div className="absolute right-3 top-3 rounded-full bg-black/70 px-2 py-1 text-[10px] font-semibold text-white backdrop-blur-sm">
                        {imageUrls.length} 视角
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-100 flex items-end p-4">
                      <div className="text-white">
                        <div className="font-semibold text-sm">{item.floorName} / {item.roomName}</div>
                        <div className="mt-1 text-xs text-white/80">{new Date(item.createdAt).toLocaleString('zh-CN')}</div>
                        <div className="mt-1 text-[11px] text-white/75">裁剪覆盖 {item.coveragePercent.toFixed(1)}%</div>
                        {viewLabels.length > 0 && (
                          <div className="mt-1 text-[11px] text-white/75">{viewLabels.join(' / ')}</div>
                        )}
                        <div className="mt-2 text-[11px] font-medium text-[#f3d388]">点击浏览整组效果图</div>
                      </div>
                    </div>
                  </button>
                </motion.div>
              );
            })}
          </div>
        )}
        </div>
      </div>
      <AnimatePresence>
        {activeGalleryItem && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[110] flex items-center justify-center bg-stone-950/85 p-4 md:p-8"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.98, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.98, y: 16 }}
              className="flex h-full max-h-[calc(100dvh-2rem)] w-full max-w-6xl flex-col overflow-hidden rounded-2xl border border-stone-700 bg-[#111111] shadow-2xl md:max-h-[calc(100dvh-4rem)]"
            >
              <div className="flex items-center justify-between border-b border-stone-800 px-5 py-4">
                <div>
                  <p className="text-[10px] uppercase tracking-[0.22em] text-stone-500">Gallery Viewer</p>
                  <h3 className="mt-1 text-lg font-bold text-white">{activeGalleryItem.floorName} / {activeGalleryItem.roomName}</h3>
                  <p className="mt-1 text-xs text-stone-400">
                    当前查看 {activeImageIndex + 1} / {activeImageUrls.length} 张，{activeImageLabel}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveGalleryItem(null)}
                  className="rounded-full p-2 text-stone-400 transition-colors hover:bg-stone-800 hover:text-white"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="grid min-h-0 flex-1 gap-0 lg:grid-cols-[minmax(0,1fr)_280px]">
                <div className="relative min-h-0 bg-[#0c0c0c] p-4 md:p-6">
                  <div className="relative flex h-full items-center justify-center overflow-hidden rounded-xl border border-stone-800 bg-black">
                    <img
                      src={activeImageUrl}
                      alt={`${activeGalleryItem.roomName}-${activeImageLabel}`}
                      className="max-h-full max-w-full object-contain"
                      referrerPolicy="no-referrer"
                    />
                    {activeImageUrls.length > 1 && (
                      <>
                        <button
                          type="button"
                          onClick={goToPreviousImage}
                          className="absolute left-4 top-1/2 -translate-y-1/2 rounded-full border border-white/20 bg-black/55 p-3 text-white transition-colors hover:bg-black/75"
                        >
                          <ChevronLeft className="h-5 w-5" />
                        </button>
                        <button
                          type="button"
                          onClick={goToNextImage}
                          className="absolute right-4 top-1/2 -translate-y-1/2 rounded-full border border-white/20 bg-black/55 p-3 text-white transition-colors hover:bg-black/75"
                        >
                          <ChevronRight className="h-5 w-5" />
                        </button>
                      </>
                    )}
                  </div>
                </div>

                <div className="min-h-0 overflow-y-auto border-t border-stone-800 bg-stone-950 p-5 lg:border-l lg:border-t-0">
                  <div className="rounded-xl border border-stone-800 bg-stone-900/70 p-4">
                    <p className="text-[10px] uppercase tracking-[0.18em] text-stone-500">方案信息</p>
                    <div className="mt-3 space-y-2 text-sm text-stone-300">
                      <p><span className="text-stone-500">楼层:</span> {activeGalleryItem.floorName}</p>
                      <p><span className="text-stone-500">区域:</span> {activeGalleryItem.roomName}</p>
                      <p><span className="text-stone-500">时间:</span> {new Date(activeGalleryItem.createdAt).toLocaleString('zh-CN')}</p>
                      <p><span className="text-stone-500">覆盖面积:</span> {activeGalleryItem.coveragePercent.toFixed(1)}%</p>
                    </div>
                  </div>

                  <div className="mt-5 rounded-xl border border-stone-800 bg-stone-900/70 p-4">
                    <p className="text-[10px] uppercase tracking-[0.18em] text-stone-500">双视角结果</p>
                    <div className="mt-3 space-y-3">
                      {activeImageUrls.map((imageUrl, index) => (
                        <button
                          key={`${activeGalleryItem.id}-${imageUrl}-${index}`}
                          type="button"
                          onClick={() => setActiveImageIndex(index)}
                          className={`w-full overflow-hidden rounded-xl border text-left transition-colors ${
                            index === activeImageIndex
                              ? 'border-[#d3a52f] bg-stone-900'
                              : 'border-stone-800 bg-stone-950/70 hover:border-stone-600'
                          }`}
                        >
                          <img
                            src={imageUrl}
                            alt={`${activeGalleryItem.roomName}-视角${index + 1}`}
                            className="aspect-[4/3] w-full object-cover"
                            referrerPolicy="no-referrer"
                          />
                          <div className="px-3 py-2">
                            <p className="text-sm font-medium text-white">{activeViewLabels[index] ?? `视角 ${index + 1}`}</p>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="mt-5 flex gap-3">
                    <a
                      href={activeImageUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-2 rounded-lg border border-stone-700 px-4 py-2 text-sm font-medium text-stone-200 transition-colors hover:bg-stone-800"
                    >
                      <Download className="h-4 w-4" />
                      下载当前视角
                    </a>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

function HistoryView({ historyItems }: { historyItems: HistoryItem[] }) {
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
              {historyItems.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-10 text-center text-sm text-stone-500">
                    还没有真实生成记录。
                  </td>
                </tr>
              ) : historyItems.map((item) => (
                <tr key={item.id} className="hover:bg-stone-50 transition-colors">
                  <td className="px-4 md:px-6 py-3 md:py-4 font-mono text-stone-500">#{item.id.slice(-8).toUpperCase()}</td>
                  <td className="px-4 md:px-6 py-3 md:py-4 text-stone-600">{item.date}</td>
                  <td className="px-4 md:px-6 py-3 md:py-4 font-medium text-primary">{item.floor} / {item.room}</td>
                  <td className="px-4 md:px-6 py-3 md:py-4 text-stone-600">{item.resolution}</td>
                  <td className="px-4 md:px-6 py-3 md:py-4">
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-[10px] font-medium ${
                      item.status === '已完成'
                        ? 'bg-emerald-100 text-emerald-700'
                        : 'bg-rose-100 text-rose-700'
                    }`}>
                      {item.status}
                    </span>
                  </td>
                  <td className="px-4 md:px-6 py-3 md:py-4 text-right">
                    {item.imageUrl ? (
                      <a href={item.imageUrl} target="_blank" rel="noreferrer" className="text-tertiary hover:text-tertiary/80 font-medium transition-colors">
                        查看
                      </a>
                    ) : (
                      <span className="text-stone-300">-</span>
                    )}
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

function BackgroundGenerationDock({ isGenerating, generatedImages, generationContext, generationError, onOpen, onOpenGallery, onClear }: any) {
  if (!generationContext || (generatedImages.length === 0 && !isGenerating && !generationError)) return null;

  const title = isGenerating ? '后台生图中' : generationError ? '本次生成失败' : '本次生成已完成';
  const description = isGenerating
    ? `${generationContext.floorName} / ${generationContext.roomName} 正在后台生成双视角图组，可继续操作页面。`
    : generationError
      ? `${generationContext.floorName} / ${generationContext.roomName} 生成失败，可查看详情后重试。`
      : `${generationContext.floorName} / ${generationContext.roomName} 的双视角结果已保存到图库。`;

  return (
    <div className="fixed bottom-4 right-4 z-[90] w-[320px] max-w-[calc(100vw-2rem)] rounded-2xl border border-stone-800 bg-stone-950/96 p-4 text-stone-100 shadow-2xl backdrop-blur-md">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${
            isGenerating ? 'bg-amber-500/15 text-amber-300' : generationError ? 'bg-rose-500/15 text-rose-300' : 'bg-emerald-500/15 text-emerald-300'
          }`}>
            {isGenerating ? <Loader2 className="h-5 w-5 animate-spin" /> : generationError ? <X className="h-5 w-5" /> : <CheckCircle2 className="h-5 w-5" />}
          </div>
          <div>
            <p className="text-sm font-semibold text-white">{title}</p>
            <p className="mt-1 text-xs leading-relaxed text-stone-400">{description}</p>
          </div>
        </div>
        {!isGenerating && (
          <button
            type="button"
            onClick={onClear}
            className="rounded-full p-1.5 text-stone-500 transition-colors hover:bg-stone-800 hover:text-white"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={onOpen}
          className="rounded-full bg-white px-4 py-2 text-xs font-semibold text-stone-900 transition-colors hover:bg-stone-200"
        >
          {isGenerating ? '查看进度' : generationError ? '查看详情' : '查看结果'}
        </button>
        {!isGenerating && !generationError && (
          <button
            type="button"
            onClick={onOpenGallery}
            className="rounded-full border border-stone-700 px-4 py-2 text-xs font-semibold text-stone-100 transition-colors hover:bg-stone-900"
          >
            前往图库
          </button>
        )}
      </div>
    </div>
  );
}

function GenerationModal({ isOpen, isGenerating, generatedImages, generationContext, generationError, onClose, onReset, onSaveToGallery }: any) {
  if (!isOpen || (!isGenerating && generatedImages.length === 0 && !generationError)) return null;

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
              ) : generationError ? (
                <>
                  <X className="w-4 h-4 md:w-5 md:h-5 text-rose-600" />
                  生成失败
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4 md:w-5 md:h-5 text-emerald-600" />
                  渲染完成
                </>
              )}
            </h2>
            <button onClick={onClose} className="p-1.5 md:p-2 text-stone-400 hover:text-stone-700 hover:bg-stone-200 rounded-full transition-colors">
              <X className="w-4 h-4 md:w-5 md:h-5" />
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-hidden relative bg-stone-100 flex items-center justify-center min-h-[300px] md:min-h-[400px]">
            {isGenerating ? (
              <div className="grid w-full gap-6 p-6 md:grid-cols-[280px_minmax(0,1fr)] md:p-8">
                <div className="rounded-xl border border-stone-200 bg-white p-4 shadow-sm">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-stone-500">精准裁剪区域</p>
                    <span className="rounded-full bg-amber-100 px-2 py-1 text-[10px] font-semibold text-amber-700">后台继续中</span>
                  </div>
                  {generationContext?.segmentation && (
                    <>
                      <img
                        src={generationContext.segmentation.cropPreviewDataUrl}
                        alt={`${generationContext.roomName}裁剪预览`}
                        className="mt-3 aspect-square w-full rounded-lg border border-stone-200 bg-[#f8f3e7] object-cover"
                      />
                      <div className="mt-3 grid grid-cols-2 gap-2 text-[10px] text-stone-600">
                        <div className="rounded-md bg-stone-50 px-2 py-2">
                          <span className="block text-stone-400">楼层</span>
                          <span className="mt-1 block font-semibold text-stone-900">{generationContext.floorName}</span>
                        </div>
                        <div className="rounded-md bg-stone-50 px-2 py-2">
                          <span className="block text-stone-400">区域</span>
                          <span className="mt-1 block font-semibold text-stone-900">{generationContext.roomName}</span>
                        </div>
                        <div className="rounded-md bg-stone-50 px-2 py-2">
                          <span className="block text-stone-400">多边形</span>
                          <span className="mt-1 block font-semibold text-stone-900">{generationContext.segmentation.polygonCount}</span>
                        </div>
                        <div className="rounded-md bg-stone-50 px-2 py-2">
                          <span className="block text-stone-400">覆盖面积</span>
                          <span className="mt-1 block font-semibold text-stone-900">{generationContext.segmentation.coveragePercent.toFixed(1)}%</span>
                        </div>
                      </div>
                    </>
                  )}
                </div>
                <div className="flex flex-col items-center justify-center text-center">
                  <div className="relative mb-8 h-24 w-24">
                    <div className="absolute inset-0 rounded-full border-4 border-tertiary/20"></div>
                    <div className="absolute inset-0 rounded-full border-4 border-tertiary border-t-transparent animate-spin"></div>
                    <Sparkles className="absolute inset-0 m-auto h-8 w-8 animate-pulse text-tertiary" />
                  </div>
                  <div className="w-full max-w-md space-y-3">
                    <div className="h-2 overflow-hidden rounded-full bg-stone-200">
                      <motion.div
                        initial={{ width: '0%' }}
                        animate={{ width: '100%' }}
                        transition={{ duration: 3, ease: 'easeInOut' }}
                        className="h-full bg-tertiary"
                      />
                    </div>
                    <p className="text-sm font-medium text-stone-600">
                      正在生成两张高一致性的室内视角图，完成后可直接进入沉浸漫游。
                    </p>
                    {generationContext && (
                      <p className="text-xs leading-relaxed text-stone-500">
                        当前任务锁定为 {generationContext.floorName} / {generationContext.roomName}，输出规格 {generationContext.resolution.toUpperCase()}。
                      </p>
                    )}
                    <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-left text-xs leading-relaxed text-amber-800">
                      你现在可以直接关闭这个弹窗，任务会继续在后台生成。生成结束后，右下角会出现结果入口，且图片会自动保存到图库。
                    </div>
                  </div>
                </div>
              </div>
            ) : generationError ? (
              <div className="flex w-full max-w-2xl flex-col items-center justify-center gap-4 px-6 text-center">
                <div className="rounded-full bg-rose-100 p-4 text-rose-600">
                  <X className="h-8 w-8" />
                </div>
                <h3 className="text-xl font-bold text-stone-900">当前生成请求没有成功完成</h3>
                <p className="max-w-lg text-sm leading-relaxed text-stone-600">{generationError}</p>
                {generationContext && (
                  <div className="rounded-xl border border-stone-200 bg-white p-4 text-left shadow-sm">
                    <p className="text-xs text-stone-500">请求上下文</p>
                    <p className="mt-2 text-sm text-stone-700">楼层: {generationContext.floorName}</p>
                    <p className="text-sm text-stone-700">房间: {generationContext.roomName}</p>
                    <p className="text-sm text-stone-700">规格: {String(generationContext.resolution).toUpperCase()}</p>
                  </div>
                )}
              </div>
            ) : (
              <motion.div 
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5 }}
                className="grid h-full w-full gap-6 overflow-auto p-6 lg:grid-cols-[minmax(0,1fr)_240px]"
              >
                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                  {generatedImages.map((image: GeneratedImage) => (
                    <div key={image.viewId} className="overflow-hidden rounded-xl border border-stone-200 bg-white shadow-sm">
                      <div className="flex items-center justify-between border-b border-stone-100 px-4 py-3">
                        <div>
                          <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-stone-500">Camera View</p>
                          <h3 className="mt-1 text-sm font-semibold text-stone-900">{image.label}</h3>
                        </div>
                        <a
                          href={image.imageUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 rounded-full border border-stone-200 px-3 py-1 text-[11px] font-medium text-stone-600 transition-colors hover:bg-stone-50"
                        >
                          <Download className="h-3.5 w-3.5" />
                          查看大图
                        </a>
                      </div>
                      <img 
                        src={image.imageUrl} 
                        alt={`${image.label}设计图`} 
                        className="aspect-[4/3] w-full object-cover"
                        referrerPolicy="no-referrer"
                      />
                    </div>
                  ))}
                </div>
                {generationContext?.segmentation && (
                  <div className="h-fit rounded-xl border border-stone-200 bg-white p-4 shadow-sm">
                    <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-stone-500">本次裁剪依据</p>
                    <img
                      src={generationContext.segmentation.cropPreviewDataUrl}
                      alt={`${generationContext.roomName}裁剪预览`}
                      className="mt-3 aspect-square w-full rounded-lg border border-stone-200 bg-[#f8f3e7] object-cover"
                    />
                    <div className="mt-3 space-y-2 text-[11px] text-stone-600">
                      <p><span className="text-stone-400">楼层:</span> {generationContext.floorName}</p>
                      <p><span className="text-stone-400">房间:</span> {generationContext.roomName}</p>
                      <p><span className="text-stone-400">覆盖面积:</span> {generationContext.segmentation.coveragePercent.toFixed(1)}%</p>
                      <p><span className="text-stone-400">多边形:</span> {generationContext.segmentation.polygonCount}</p>
                    </div>
                  </div>
                )}
              </motion.div>
            )}
          </div>

          {/* Footer Actions */}
          {isGenerating ? (
            <div className="px-4 md:px-6 py-3 md:py-4 border-t border-surface-container bg-white flex flex-wrap justify-end gap-2 md:gap-3">
              <button onClick={onClose} className="px-4 md:px-6 py-2 text-xs md:text-sm font-medium text-stone-600 hover:bg-stone-100 rounded-sm transition-colors">
                关闭弹窗，后台继续
              </button>
            </div>
          ) : (
            <div className="px-4 md:px-6 py-3 md:py-4 border-t border-surface-container bg-white flex flex-wrap justify-end gap-2 md:gap-3">
              <button onClick={onReset} className="px-4 md:px-6 py-2 text-xs md:text-sm font-medium text-stone-600 hover:bg-stone-100 rounded-sm transition-colors">
                关闭任务
              </button>
              {!generationError && generatedImages.length > 0 && (
                <button onClick={onSaveToGallery} className="px-4 md:px-6 py-2 text-xs md:text-sm font-bold text-white bg-primary hover:bg-primary/90 rounded-sm transition-colors flex items-center gap-2 shadow-md">
                  <ImageIcon className="w-4 h-4" />
                  前往图库
                </button>
              )}
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
  const [selectedRoomId, setSelectedRoomId] = useState<string | null>('b1-theater');
  const [selectedStyleId, setSelectedStyleId] = useState<string>(() => {
    if (typeof window === 'undefined') return STYLE_PRESETS[0].id;

    try {
      const raw = window.localStorage.getItem(STYLE_PRESET_STORAGE_KEY);
      return STYLE_PRESETS.some((item) => item.id === raw) ? raw as string : STYLE_PRESETS[0].id;
    } catch {
      return STYLE_PRESETS[0].id;
    }
  });
  const [isCropEditorOpen, setIsCropEditorOpen] = useState(false);
  const [roomOverrides, setRoomOverrides] = useState<Record<string, RoomOverride>>(() => {
    if (typeof window === 'undefined') return {};

    try {
      const raw = window.localStorage.getItem(ROOM_OVERRIDE_STORAGE_KEY);
      return raw ? JSON.parse(raw) : {};
    } catch {
      return {};
    }
  });
  
  const [showLeftPanel, setShowLeftPanel] = useState(false);
  const [showRightPanel, setShowRightPanel] = useState(false);
  
  // Generation State
  const [isGenerationModalOpen, setIsGenerationModalOpen] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedImages, setGeneratedImages] = useState<GeneratedImage[]>([]);
  const [generationContext, setGenerationContext] = useState<any>(null);
  const [generationError, setGenerationError] = useState<string | null>(null);
  const [galleryItems, setGalleryItems] = useState<GalleryItem[]>(() => {
    if (typeof window === 'undefined') return [];
    try {
      const raw = window.localStorage.getItem(GALLERY_STORAGE_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  });
  const [historyItems, setHistoryItems] = useState<HistoryItem[]>(() => {
    if (typeof window === 'undefined') return [];
    try {
      const raw = window.localStorage.getItem(HISTORY_STORAGE_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;
    window.localStorage.setItem(ROOM_OVERRIDE_STORAGE_KEY, JSON.stringify(roomOverrides));
  }, [roomOverrides]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    window.localStorage.setItem(STYLE_PRESET_STORAGE_KEY, selectedStyleId);
  }, [selectedStyleId]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    window.localStorage.setItem(GALLERY_STORAGE_KEY, JSON.stringify(galleryItems));
  }, [galleryItems]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    window.localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(historyItems));
  }, [historyItems]);

  useEffect(() => {
    let cancelled = false;

    const loadPersistedCollections = async () => {
      try {
        const [galleryResponse, historyResponse] = await Promise.all([
          fetch('/api/gallery'),
          fetch('/api/history'),
        ]);

        if (!galleryResponse.ok || !historyResponse.ok) {
          return;
        }

        const [galleryPayload, historyPayload] = await Promise.all([
          galleryResponse.json(),
          historyResponse.json(),
        ]);

        if (cancelled) return;

        if (Array.isArray(galleryPayload.items)) {
          setGalleryItems(galleryPayload.items);
        }

        if (Array.isArray(historyPayload.items)) {
          setHistoryItems(historyPayload.items);
        }
      } catch {
        // Keep the local cache as a silent fallback when the backend is unavailable.
      }
    };

    loadPersistedCollections();

    return () => {
      cancelled = true;
    };
  }, []);

  const persistGalleryItem = async (item: GalleryItem) => {
    try {
      const response = await fetch('/api/gallery', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(item),
      });

      if (!response.ok) return null;
      const payload = await response.json();
      return payload.item ?? null;
    } catch {
      return null;
    }
  };

  const persistHistoryItem = async (item: HistoryItem) => {
    try {
      const response = await fetch('/api/history', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(item),
      });

      if (!response.ok) return null;
      const payload = await response.json();
      return payload.item ?? null;
    } catch {
      return null;
    }
  };

  const floors = FLOORS.map((floor) => ({
    ...floor,
    rooms: floor.rooms.map((room) => {
      const override = roomOverrides[room.id];
      return override ? { ...room, ...override } : room;
    }),
  }));
  const selectedStyle = STYLE_PRESETS.find((item) => item.id === selectedStyleId) ?? STYLE_PRESETS[0];

  const clearGenerationTask = () => {
    setIsGenerating(false);
    setGeneratedImages([]);
    setGenerationContext(null);
    setGenerationError(null);
    setIsGenerationModalOpen(false);
  };

  const handleGenerate = async (settings: any) => {
    const segmentation = buildRoomSegmentation(selectedFloor.id, selectedRoom);
    const normalizedResolution = settings.resolution === '1080p' ? '1K' : settings.resolution === '2k' ? '2K' : String(settings.resolution).toUpperCase();
    const prompt = [
      selectedStyle.prompt,
      selectedRoom.basePrompt,
      `自然光强度约为 ${settings.naturalLight}%，让空间明暗关系自然真实。`,
      `间接照明强度约为 ${settings.indirectLight}%，灯带与辅助照明需要和主风格统一。`,
      settings.rtxEnabled ? '开启真实反射、玻璃、金属与石材的高品质材质表现。' : '保持柔和自然的光影，不要出现过强反光和夸张高光。',
      '请基于当前房间平面图裁剪区域，生成两张高一致性的室内效果图。',
      '两张图必须是同一个房间、同一套设计、同一套家具、同一套材质、同一套灯光，只允许镜头位置和朝向不同。',
      '第一张为主视角，完整展示主要功能区；第二张为明显不同的对角或侧向视角，强调空间纵深，但必须一眼看出和第一张是同一个房间。',
      '必须是正常室内建筑摄影视角，禁止俯视、鸟瞰、轴测、全景、鱼眼、拼图、分镜、三联画。',
      '画面保持清晰真实，禁止模糊滤镜、雾化、运动模糊、过强景深。',
      '空间功能必须单一明确，不要重复主景家具，不要混入其他房间的功能元素。',
      settings.customPrompt,
    ].filter(Boolean).join(' ');

    setIsGenerating(true);
    setIsGenerationModalOpen(true);
    setGeneratedImages([]);
    setGenerationError(null);
    setGenerationContext({
      floorId: selectedFloor.id,
      floorName: selectedFloor.name,
      roomId: selectedRoom.id,
      roomName: selectedRoom.name,
      styleName: selectedStyle.name,
      resolution: normalizedResolution,
      customPrompt: settings.customPrompt,
      naturalLight: settings.naturalLight,
      indirectLight: settings.indirectLight,
      rtxEnabled: settings.rtxEnabled,
      segmentation,
      prompt,
    });

    try {
      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          floorId: selectedFloor.id,
          floorName: selectedFloor.name,
          roomId: selectedRoom.id,
          roomName: selectedRoom.name,
          prompt,
          resolution: normalizedResolution,
          polygons: selectedRoom.areas,
        }),
      });

      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload.detail || '图像生成失败，请稍后重试。');
      }

      const images: GeneratedImage[] = Array.isArray(payload.images) && payload.images.length > 0
        ? payload.images
        : payload.imageUrl
          ? [{ viewId: 'view-01', label: '主视角', imageUrl: payload.imageUrl, textResponse: payload.textResponse }]
          : [];

      if (images.length === 0) {
        throw new Error('模型返回成功，但没有拿到有效图片。');
      }

      setGenerationContext((current: any) => current ? { ...current, backend: payload } : current);
      setGeneratedImages(images);
      const createdAt = new Date().toISOString();
      const galleryItem: GalleryItem = {
        id: crypto.randomUUID(),
        imageUrl: images[0].imageUrl,
        imageUrls: images.map((image) => image.imageUrl),
        viewLabels: images.map((image) => image.label),
        createdAt,
        floorName: selectedFloor.name,
        roomName: selectedRoom.name,
        prompt,
        coveragePercent: segmentation?.coveragePercent ?? 0,
      };
      const historyItem: HistoryItem = {
        id: crypto.randomUUID(),
        date: new Date(createdAt).toLocaleString('zh-CN'),
        floor: selectedFloor.name,
        room: selectedRoom.name,
        status: '已完成',
        resolution: normalizedResolution,
        imageUrl: images[0].imageUrl,
        imageCount: images.length,
      };

      setGalleryItems((current) => [galleryItem, ...current]);
      setHistoryItems((current) => [historyItem, ...current]);

      void Promise.all([
        persistGalleryItem(galleryItem),
        persistHistoryItem(historyItem),
      ]);
    } catch (error) {
      const message = error instanceof Error ? error.message : '图像生成失败，请检查后端服务和模型配置。';
      setGenerationError(message);
      const historyItem: HistoryItem = {
        id: crypto.randomUUID(),
        date: new Date().toLocaleString('zh-CN'),
        floor: selectedFloor.name,
        room: selectedRoom.name,
        status: '失败',
        resolution: normalizedResolution,
      };
      setHistoryItems((current) => [historyItem, ...current]);
      void persistHistoryItem(historyItem);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSaveToGallery = () => {
    clearGenerationTask();
    setView('gallery');
  };

  const selectedFloor = floors.find(f => f.rooms.some(r => r.id === selectedRoomId)) || floors[0];
  const selectedRoom = selectedFloor.rooms.find(r => r.id === selectedRoomId) || selectedFloor.rooms[0];
  const selectedSegmentation = buildRoomSegmentation(selectedFloor.id, selectedRoom);

  return (
    <div className="bg-background text-on-background font-body select-none overflow-hidden flex h-[100dvh] flex-col">
      <TopNavBar view={view} setView={setView} />
      <main className="relative mt-16 flex h-[calc(100dvh-64px)] overflow-hidden">
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
              floors={floors}
              expandedFloorId={expandedFloorId} 
              setExpandedFloorId={setExpandedFloorId}
              selectedRoomId={selectedRoomId}
              selectedStyleName={selectedStyle.name}
              setSelectedRoomId={(id: string) => {
                setSelectedRoomId(id);
                if (window.innerWidth < 1024) setShowLeftPanel(false);
              }}
              showLeftPanel={showLeftPanel}
            />
            <MainCanvas 
              selectedFloor={selectedFloor} 
              selectedRoom={selectedRoom} 
              galleryItems={galleryItems}
              setSelectedRoomId={setSelectedRoomId} 
              setShowLeftPanel={setShowLeftPanel}
              setShowRightPanel={setShowRightPanel}
            />
            <RightSidebar 
              selectedFloor={selectedFloor}
              selectedRoom={selectedRoom} 
              selectedSegmentation={selectedSegmentation}
              selectedStyleId={selectedStyle.id}
              onStyleChange={setSelectedStyleId}
              onGenerate={(settings: any) => {
                if (window.innerWidth < 1024) setShowRightPanel(false);
                handleGenerate(settings);
              }} 
              onOpenEditor={() => setIsCropEditorOpen(true)}
              showRightPanel={showRightPanel}
            />
          </>
        )}
        {view === 'gallery' && <GalleryView galleryItems={galleryItems} />}
        {view === 'history' && <HistoryView historyItems={historyItems} />}
      </main>
      {view === 'project' && <OverlayHint />}
      <CropEditorModal
        isOpen={isCropEditorOpen}
        floor={selectedFloor}
        room={selectedRoom}
        baseRoom={FLOORS.find((floor) => floor.id === selectedFloor.id)?.rooms.find((room) => room.id === selectedRoom.id)}
        floorImage={FLOOR_PLAN_IMAGES[selectedFloor.id]}
        onClose={() => setIsCropEditorOpen(false)}
        onSave={(roomId: string, override: RoomOverride) => {
          setRoomOverrides((current) => ({ ...current, [roomId]: override }));
          setIsCropEditorOpen(false);
        }}
      />
      
      <BackgroundGenerationDock
        isGenerating={isGenerating}
        generatedImages={generatedImages}
        generationContext={generationContext}
        generationError={generationError}
        onOpen={() => setIsGenerationModalOpen(true)}
        onOpenGallery={handleSaveToGallery}
        onClear={clearGenerationTask}
      />

      <GenerationModal 
        isOpen={isGenerationModalOpen}
        isGenerating={isGenerating} 
        generatedImages={generatedImages} 
        generationContext={generationContext}
        generationError={generationError}
        onClose={() => setIsGenerationModalOpen(false)}
        onReset={clearGenerationTask}
        onSaveToGallery={handleSaveToGallery}
      />
    </div>
  );
}
