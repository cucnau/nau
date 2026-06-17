import React from 'react';

export interface ChucuPresetAccessory {
  id: string;
  name: string;
  description: string;
  svgContent: () => React.ReactNode;
  previewSvg: React.ReactNode;
}

export const CHUCU_PRESET_ACCESSORIES: ChucuPresetAccessory[] = [
  {
    id: "chucu_acc_crown",
    name: "Vương Miện Hoàng Gia",
    description: "Chiếc vương miện lấp lánh bằng vàng dành riêng cho vị vua Chucu tinh nghịch.",
    svgContent: () => (
      <g>
        <path d="M 38 27 L 33 16 L 42 20 L 50 13 L 58 20 L 67 16 L 62 27 Z" fill="#FFD700" stroke="#3E2723" strokeWidth="2.5" strokeLinejoin="round" />
        <circle cx="33" cy="16" r="2" fill="#E53935" stroke="#3E2723" strokeWidth="0.8" />
        <circle cx="50" cy="13" r="2.5" fill="#1E88E5" stroke="#3E2723" strokeWidth="0.8" />
        <circle cx="67" cy="16" r="2" fill="#E53935" stroke="#3E2723" strokeWidth="0.8" />
      </g>
    ),
    previewSvg: (
      <svg viewBox="0 0 100 100" className="w-12 h-12">
        <path d="M 28 65 L 20 40 L 38 48 L 50 30 L 62 48 L 80 40 L 72 65 Z" fill="#FFD700" stroke="#3E2723" strokeWidth="4" strokeLinejoin="round" />
        <circle cx="20" cy="40" r="5" fill="#E53935" stroke="#3E2723" strokeWidth="1.5" />
        <circle cx="50" cy="30" r="6" fill="#1E88E5" stroke="#3E2723" strokeWidth="1.5" />
        <circle cx="80" cy="40" r="5" fill="#E53935" stroke="#3E2723" strokeWidth="1.5" />
      </svg>
    )
  },
  {
    id: "chucu_acc_sunglasses",
    name: "Kính Râm Cool Ngầu",
    description: "Cặp kính đặc vụ đen láy siêu ngầu cho Chucu sành điệu bước đi.",
    svgContent: () => (
      <g>
        <polygon points="32,41 48,41 46,50 34,50" fill="#212121" stroke="#3E2723" strokeWidth="2.5" />
        <line x1="35" y1="43" x2="39" y2="47" stroke="#FFF" strokeWidth="1.5" strokeLinecap="round" opacity="0.6" />
        <polygon points="52,41 68,41 66,50 54,50" fill="#212121" stroke="#3E2723" strokeWidth="2.5" />
        <line x1="55" y1="43" x2="59" y2="47" stroke="#FFF" strokeWidth="1.5" strokeLinecap="round" opacity="0.6" />
        <line x1="48" y1="43" x2="52" y2="43" stroke="#3E2723" strokeWidth="3" />
        <path d="M 32 41 Q 28 42 26 44" stroke="#3E2723" strokeWidth="2" strokeLinecap="round" fill="none" />
        <path d="M 68 41 Q 72 42 74 44" stroke="#3E2723" strokeWidth="2" strokeLinecap="round" fill="none" />
      </g>
    ),
    previewSvg: (
      <svg viewBox="0 0 100 100" className="w-12 h-12">
        <polygon points="15,45 47,45 43,65 19,65" fill="#212121" stroke="#3E2723" strokeWidth="5" />
        <line x1="21" y1="49" x2="29" y2="58" stroke="#FFF" strokeWidth="3" strokeLinecap="round" opacity="0.6" />
        <polygon points="53,45 85,45 81,65 57,65" fill="#212121" stroke="#3E2723" strokeWidth="5" />
        <line x1="59" y1="49" x2="67" y2="58" stroke="#FFF" strokeWidth="3" strokeLinecap="round" opacity="0.6" />
        <line x1="47" y1="49" x2="53" y2="49" stroke="#3E2723" strokeWidth="6" />
      </svg>
    )
  },
  {
    id: "chucu_acc_halo",
    name: "Hào Quang Thiên Thần",
    description: "Một vòng thánh quang lấp lánh lơ lửng trên đỉnh đầu của em Chucu.",
    svgContent: () => (
      <g>
        <line x1="50" y1="20" x2="50" y2="28" stroke="#3E2723" strokeWidth="1.5" strokeDasharray="1.5,1.5" />
        <ellipse cx="50" cy="16" rx="18" ry="5" stroke="#FFE082" strokeWidth="3.5" fill="none" opacity="0.5" />
        <ellipse cx="50" cy="16" rx="15" ry="3.5" stroke="#FFF" strokeWidth="2" fill="none" />
        <path d="M 31 13 L 33 15 L 31 17 L 29 15 Z" fill="#FFE082" />
        <path d="M 69 13 L 71 15 L 69 17 L 67 15 Z" fill="#FFE082" />
      </g>
    ),
    previewSvg: (
      <svg viewBox="0 0 100 100" className="w-12 h-12">
        <ellipse cx="50" cy="50" rx="40" ry="15" stroke="#FFE082" strokeWidth="10" fill="none" opacity="0.5" />
        <ellipse cx="50" cy="50" rx="35" ry="11" stroke="#FFF" strokeWidth="6" fill="none" />
        <circle cx="15" cy="40" r="4" fill="#FFE082" />
        <circle cx="85" cy="60" r="3" fill="#FFE082" />
      </svg>
    )
  },
  {
    id: "chucu_acc_ribbon",
    name: "Nơ Đỏ Quý Phái",
    description: "Chiếc nơ lụa thắt đỏ duyên dáng, làm bừng sáng nét dễ thương.",
    svgContent: () => (
      <g>
        <path d="M 50 68 Q 40 60 36 67 Q 40 75 50 68" fill="#E53935" stroke="#3E2723" strokeWidth="2.5" />
        <path d="M 50 68 Q 60 60 64 67 Q 60 75 50 68" fill="#E53935" stroke="#3E2723" strokeWidth="2.5" />
        <circle cx="50" cy="68" r="4" fill="#FF8A80" stroke="#3E2723" strokeWidth="2" />
        <path d="M 47 68 L 42 77" stroke="#3E2723" strokeWidth="2.5" strokeLinecap="round" />
        <path d="M 53 68 L 58 77" stroke="#3E2723" strokeWidth="2.5" strokeLinecap="round" />
      </g>
    ),
    previewSvg: (
      <svg viewBox="0 0 100 100" className="w-12 h-12">
        <path d="M 50 50 Q 20 25 15 45 Q 25 70 50 50" fill="#E53935" stroke="#3E2723" strokeWidth="5" />
        <path d="M 50 50 Q 80 25 85 45 Q 75 70 50 50" fill="#E53935" stroke="#3E2723" strokeWidth="5" />
        <circle cx="50" cy="50" r="11" fill="#FF8A80" stroke="#3E2723" strokeWidth="5" />
        <path d="M 43 50 L 30 80" stroke="#3E2723" strokeWidth="5" strokeLinecap="round" />
        <path d="M 57 50 L 70 80" stroke="#3E2723" strokeWidth="5" strokeLinecap="round" />
      </svg>
    )
  },
  {
    id: "chucu_acc_santa",
    name: "Mũ Noel Ấm Áp",
    description: "Nhỏ bé mà ấm cúng, chiếc mũ Noel rực ánh đỏ sưởi ấm mùa đông.",
    svgContent: () => (
      <g>
        <path d="M 28 30 Q 50 9 69 22 L 64 25 Z" fill="#E53935" stroke="#3E2723" strokeWidth="2.5" strokeLinejoin="round" />
        <rect x="25" y="27" width="50" height="7" rx="3.5" fill="#FFF" stroke="#3E2723" strokeWidth="2.5" />
        <circle cx="69" cy="22" r="4.5" fill="#FFF" stroke="#3E2723" strokeWidth="2.5" />
      </g>
    ),
    previewSvg: (
      <svg viewBox="0 0 100 100" className="w-12 h-12">
        <path d="M 15 65 Q 50 10 80 43 L 73 50 Z" fill="#E53935" stroke="#3E2723" strokeWidth="5" />
        <rect x="10" y="55" width="80" height="15" rx="7.5" fill="#FFF" stroke="#3E2723" strokeWidth="4.5" />
        <circle cx="80" cy="42" r="10" fill="#FFF" stroke="#3E2723" strokeWidth="4.5" />
      </svg>
    )
  },
  {
    id: "chucu_acc_chef",
    name: "Mũ Đầu Bếp Nhí",
    description: "Chiếc mũ trắng tơi phồng, giúp Chucu sẵn sàng nhào nặn sô cô la ngọt ngào.",
    svgContent: () => (
      <g>
        <path d="M 32 23 Q 26 12 38 12 Q 50 5 62 12 Q 74 12 68 23 Z" fill="#FFF" stroke="#3E2723" strokeWidth="3" />
        <rect x="34" y="22" width="32" height="7" fill="#FFF" stroke="#3E2723" strokeWidth="2.5" />
      </g>
    ),
    previewSvg: (
      <svg viewBox="0 0 100 100" className="w-12 h-12">
        <path d="M 22 55 Q 10 25 35 25 Q 50 5 65 25 Q 90 25 78 55 Z" fill="#FFF" stroke="#3E2723" strokeWidth="5" />
        <rect x="25" y="52" width="50" height="15" fill="#FFF" stroke="#3E2723" strokeWidth="4.5" />
      </svg>
    )
  },
  {
    id: "chucu_acc_cat_ears",
    name: "Tai Mèo Tinh Nghịch",
    description: "Nhìn vểnh vểnh cực dễ thương với đôi tai mèo nhỏ xíu sô cô la.",
    svgContent: () => (
      <g>
        <polygon points="26,24 22,38 34,33" fill="#5D4037" stroke="#3E2723" strokeWidth="2.5" />
        <polygon points="27,27 25,35 32,32" fill="#FF8A80" />
        <polygon points="74,24 78,38 66,33" fill="#5D4037" stroke="#3E2723" strokeWidth="2.5" />
        <polygon points="73,27 75,35 68,32" fill="#FF8A80" />
      </g>
    ),
    previewSvg: (
      <svg viewBox="0 0 100 100" className="w-12 h-12">
        <polygon points="10,20 5,75 52,50" fill="#5D4037" stroke="#3E2723" strokeWidth="5" />
        <polygon points="20,38 16,68 44,51" fill="#FF8A80" />
        <polygon points="90,20 95,75 48,50" fill="#5D4037" stroke="#3E2723" strokeWidth="5" />
        <polygon points="80,38 84,68 56,51" fill="#FF8A80" />
      </svg>
    )
  },
  {
    id: "chucu_acc_straw_hat",
    name: "Mũ Rơm Đồng Quê",
    description: "Cùng Chucu đi picnic, dạo mát nhẹ nhàng dưới nắng hạ mộc mạc.",
    svgContent: () => (
      <g>
        <path d="M 32 25 C 32 12, 68 12, 68 25" fill="#FFE082" stroke="#3E2723" strokeWidth="2.5" />
        <rect x="32" y="23" width="36" height="3" fill="#E53935" stroke="#3E2723" strokeWidth="1.2" />
        <ellipse cx="50" cy="25" rx="28" ry="4" fill="#FFE082" stroke="#3E2723" strokeWidth="2.5" />
      </g>
    ),
    previewSvg: (
      <svg viewBox="0 0 100 100" className="w-12 h-12">
        <path d="M 22 50 C 22 20, 78 20, 78 50" fill="#FFE082" stroke="#3E2723" strokeWidth="5" />
        <rect x="22" y="45" width="56" height="6" fill="#E53935" stroke="#3E2723" strokeWidth="1.5" />
        <ellipse cx="50" cy="50" rx="45" ry="10" fill="#FFE082" stroke="#3E2723" strokeWidth="5" />
      </svg>
    )
  },
  {
    id: "chucu_acc_apple",
    name: "Quả Táo Đỏ Thăng Bằng",
    description: "Một quả táo nhỏ căng mọng thăng bằng cực kiêu trên đỉnh đầu.",
    svgContent: () => (
      <g>
        <circle cx="50" cy="18" r="7" fill="#E53935" stroke="#3E2723" strokeWidth="2.5" />
        <path d="M 50 11 Q 52 6, 49 3" fill="none" stroke="#3E2723" strokeWidth="1.8" strokeLinecap="round" />
        <path d="M 50 9.5 Q 56 10, 55 7 Q 51.5 8, 50 9.5 Z" fill="#2E7D32" stroke="#3E2723" strokeWidth="1.2" strokeLinejoin="round" />
      </g>
    ),
    previewSvg: (
      <svg viewBox="0 0 100 100" className="w-12 h-12">
        <circle cx="50" cy="55" r="30" fill="#E53935" stroke="#3E2723" strokeWidth="5" />
        <path d="M 50 25 Q 56 12, 48 5" fill="none" stroke="#3E2723" strokeWidth="4.5" strokeLinecap="round" />
        <path d="M 50 21 Q 65 21, 63 12 Q 54 15, 50 21 Z" fill="#2E7D32" stroke="#3E2723" strokeWidth="3" strokeLinejoin="round" />
      </svg>
    )
  }
];

export function getChucuAccessoryPreview(id: string) {
  const matched = CHUCU_PRESET_ACCESSORIES.find(a => a.id === id);
  return matched ? matched.previewSvg : null;
}

export function renderChucuAccessorySvg(id: string) {
  const matched = CHUCU_PRESET_ACCESSORIES.find(a => a.id === id);
  return matched ? matched.svgContent() : null;
}
