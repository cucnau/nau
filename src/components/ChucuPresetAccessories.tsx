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
  },
  {
    id: "chucu_acc_sprout",
    name: "Băng Đô Mầm Cây Hy Vọng",
    description: "Một mầm cây xanh nhỏ bé tràn đầy sức sống mọc lên từ đỉnh đầu của Chucu.",
    svgContent: () => (
      <g>
        <path d="M 50 30 L 50 16" stroke="#3E2723" strokeWidth="2.5" strokeLinecap="round" />
        <path d="M 50 16 Q 42 12 42 17 Q 46 20 50 16" fill="#81C784" stroke="#3E2723" strokeWidth="1.8" strokeLinejoin="round" />
        <path d="M 50 16 Q 58 12 58 17 Q 54 20 50 16" fill="#81C784" stroke="#3E2723" strokeWidth="1.8" strokeLinejoin="round" />
      </g>
    ),
    previewSvg: (
      <svg viewBox="0 0 100 100" className="w-12 h-12">
        <path d="M 50 75 L 50 35" stroke="#3E2723" strokeWidth="5" strokeLinecap="round" />
        <path d="M 50 35 Q 30 25 30 37 Q 40 45 50 35" fill="#81C784" stroke="#3E2723" strokeWidth="4" strokeLinejoin="round" />
        <path d="M 50 35 Q 70 25 70 37 Q 60 45 50 35" fill="#81C784" stroke="#3E2723" strokeWidth="4" strokeLinejoin="round" />
      </svg>
    )
  },
  {
    id: "chucu_acc_monocle",
    name: "Kính Đơn & Râu Quý Tộc",
    description: "Sự kết hợp giữa chiếc kính đơn hoàng gia vàng óng và bộ ria mép uốn cong lịch lãm.",
    svgContent: () => (
      <g>
        {/* Monocle on right eye (cx=58, cy=46, r=7) */}
        <circle cx="58" cy="46" r="7" fill="none" stroke="#FFD700" strokeWidth="2.2" />
        <line x1="54" y1="42" x2="58" y2="46" stroke="#FFF" strokeWidth="1.2" opacity="0.7" />
        {/* Gold Chain to body */}
        <path d="M 65 46 Q 72 49 70 65" fill="none" stroke="#FFD700" strokeWidth="1.2" strokeLinecap="round" />
        {/* Mustache below mouth */}
        <path d="M 41 58 Q 45 53 50 56 Q 55 53 59 58 Q 55 55 50 55 Q 45 55 41 58 Z" fill="#212121" stroke="#3E2723" strokeWidth="1.2" strokeLinejoin="round" />
      </g>
    ),
    previewSvg: (
      <svg viewBox="0 0 100 100" className="w-12 h-12">
        <circle cx="50" cy="35" r="22" fill="none" stroke="#FFD700" strokeWidth="5" />
        <line x1="38" y1="23" x2="50" y2="35" stroke="#FFF" strokeWidth="3" opacity="0.7" />
        <path d="M 72 35 Q 85 40 80 75" fill="none" stroke="#FFD700" strokeWidth="2.5" strokeLinecap="round" />
        <path d="M 30 68 Q 40 56 50 63 Q 60 56 70 68 Q 60 61 50 61 Q 40 61 30 68 Z" fill="#212121" stroke="#3E2723" strokeWidth="2.5" strokeLinejoin="round" />
      </svg>
    )
  },
  {
    id: "chucu_acc_wizard_hat",
    name: "Mũ Phù Thuỷ Chiêm Tinh",
    description: "Mũ chóp cao màu tím huyền hoặc đính kèm trăng khuyết và sao đêm lấp lánh.",
    svgContent: () => (
      <g>
        <ellipse cx="50" cy="25" rx="22" ry="4.5" fill="#5E35B1" stroke="#3E2723" strokeWidth="2.5" />
        <path d="M 33 24 Q 45 8 40 4 Q 52 8 67 24 Z" fill="#5E35B1" stroke="#3E2723" strokeWidth="2.5" strokeLinejoin="round" />
        <path d="M 35 22 Q 50 18 65 22 L 65.5 24 Q 50 20 34.5 24 Z" fill="#FFB300" stroke="#3E2723" strokeWidth="1" />
        <circle cx="48" cy="12" r="1.5" fill="#FFF" />
        <path d="M 43 9 L 44 11 L 46 11 L 44.5 12 L 45 14 L 43 13 L 41 14 L 41.5 12 L 40 11 L 42 11 Z" fill="#FFEB3B" />
      </g>
    ),
    previewSvg: (
      <svg viewBox="0 0 100 100" className="w-12 h-12">
        <ellipse cx="50" cy="78" rx="42" ry="9" fill="#5E35B1" stroke="#3E2723" strokeWidth="4.5" />
        <path d="M 18 76 Q 40 14 30 6 Q 52 14 82 76 Z" fill="#5E35B1" stroke="#3E2723" strokeWidth="5" strokeLinejoin="round" />
        <path d="M 22 71 Q 50 63 78 71 L 79 77 Q 50 69 21 77 Z" fill="#FFB300" stroke="#3E2723" strokeWidth="2" />
        <path d="M 50 35 L 53 42 L 60 42 L 55 46 L 57 53 L 50 49 L 43 53 L 45 46 L 40 42 L 47 42 Z" fill="#FFEB3B" stroke="#3E2723" strokeWidth="1.5" />
      </svg>
    )
  },
  {
    id: "chucu_acc_headphones",
    name: "Tai Nghe Neon Gaming",
    description: "Bộ tai nghe màu hồng ngọt ngào với đệm mút đen cực chất cho game thủ Chucu.",
    svgContent: () => (
      <g>
        <path d="M 23 53 A 28 28 0 0 1 77 53" fill="none" stroke="#EC407A" strokeWidth="3" />
        <rect x="18" y="44" width="7" height="17" rx="3.5" fill="#212121" stroke="#EC407A" strokeWidth="2" />
        <rect x="75" y="44" width="7" height="17" rx="3.5" fill="#212121" stroke="#EC407A" strokeWidth="2" />
        <circle cx="21.5" cy="52.5" r="2.5" fill="#EC407A" />
        <circle cx="78.5" cy="52.5" r="2.5" fill="#EC407A" />
        <path d="M 20 57 Q 22 68 31 68" fill="none" stroke="#212121" strokeWidth="1.8" strokeLinecap="round" />
        <circle cx="31" cy="68" r="1.5" fill="#EC407A" />
      </g>
    ),
    previewSvg: (
      <svg viewBox="0 0 100 100" className="w-12 h-12">
        <path d="M 12 55 A 38 38 0 0 1 88 55" fill="none" stroke="#EC407A" strokeWidth="6" />
        <rect x="3" y="40" width="15" height="35" rx="7.5" fill="#212121" stroke="#EC407A" strokeWidth="4.5" />
        <rect x="82" y="40" width="15" height="35" rx="7.5" fill="#212121" stroke="#EC407A" strokeWidth="4.5" />
        <path d="M 10 65 Q 15 90 35 90" fill="none" stroke="#212121" strokeWidth="4" strokeLinecap="round" />
        <circle cx="35" cy="90" r="3.5" fill="#EC407A" />
      </svg>
    )
  },
  {
    id: "chucu_acc_round_glasses",
    name: "Kính Tròn Học Thức",
    description: "Đôi kính gọng tròn sẫm màu tri thức, cộng ngay 100 điểm IQ cho thú cưng.",
    svgContent: () => (
      <g>
        <circle cx="41" cy="46" r="7.5" fill="none" stroke="#3E2723" strokeWidth="2.5" />
        <line x1="37" y1="42" x2="41" y2="46" stroke="#FFF" strokeWidth="1.5" opacity="0.7" />
        <circle cx="59" cy="46" r="7.5" fill="none" stroke="#3E2723" strokeWidth="2.5" />
        <line x1="55" y1="42" x2="59" y2="46" stroke="#FFF" strokeWidth="1.5" opacity="0.7" />
        <path d="M 48.5 46 Q 50 44 51.5 46" fill="none" stroke="#3E2723" strokeWidth="2.2" />
        <path d="M 33.5 46 Q 28 47 25 49" fill="none" stroke="#3E2723" strokeWidth="1.8" />
        <path d="M 66.5 46 Q 72 47 75 49" fill="none" stroke="#3E2723" strokeWidth="1.8" />
      </g>
    ),
    previewSvg: (
      <svg viewBox="0 0 100 100" className="w-12 h-12">
        {/* Left lens */}
        <circle cx="35.5" cy="50" r="12" fill="none" stroke="#3E2723" strokeWidth="4.5" />
        <line x1="29.5" y1="44" x2="35.5" y2="50" stroke="#FFF" strokeWidth="2.5" strokeLinecap="round" opacity="0.8" />
        {/* Right lens */}
        <circle cx="64.5" cy="50" r="12" fill="none" stroke="#3E2723" strokeWidth="4.5" />
        <line x1="58.5" y1="44" x2="64.5" y2="50" stroke="#FFF" strokeWidth="2.5" strokeLinecap="round" opacity="0.8" />
        {/* Bridge */}
        <path d="M 47.5 50 Q 50 46 52.5 50" fill="none" stroke="#3E2723" strokeWidth="4" strokeLinecap="round" />
        {/* Left temple */}
        <path d="M 23.5 50 Q 15 51.5 10 55" fill="none" stroke="#3E2723" strokeWidth="3" strokeLinecap="round" />
        {/* Right temple */}
        <path d="M 76.5 50 Q 85 51.5 90 55" fill="none" stroke="#3E2723" strokeWidth="3" strokeLinecap="round" />
      </svg>
    )
  },
  {
    id: "chucu_acc_bunny_ears",
    name: "Tai Thỏ Lém Lỉnh",
    description: "Bộ tai thỏ siêu dài mềm mại thướt tha, biến Chucu thành thỏ ngọc Choco.",
    svgContent: () => (
      <g>
        <path d="M 37 23 Q 29 -2 36 -3 Q 43 -3 43 23 Z" fill="#FFF" stroke="#3E2723" strokeWidth="2.5" strokeLinejoin="round" />
        <path d="M 37 20 Q 32 1.5 36 1.5 Q 40 1.5 40 20 Z" fill="#FF8A80" />
        <path d="M 63 23 Q 71 -2 64 -3 Q 57 -3 57 23 Z" fill="#FFF" stroke="#3E2723" strokeWidth="2.5" strokeLinejoin="round" />
        <path d="M 63 20 Q 68 1.5 64 1.5 Q 60 1.5 60 20 Z" fill="#FF8A80" />
      </g>
    ),
    previewSvg: (
      <svg viewBox="0 0 100 100" className="w-12 h-12">
        <path d="M 35 70 Q 15 5 35 3 Q 55 5 50 70 Z" fill="#FFF" stroke="#3E2723" strokeWidth="5" strokeLinejoin="round" />
        <path d="M 35 63 Q 23 11 34 10 Q 45 11 44 63 Z" fill="#FF8A80" />
        <path d="M 65 70 Q 85 5 65 3 Q 45 5 50 70 Z" fill="#FFF" stroke="#3E2723" strokeWidth="5" strokeLinejoin="round" />
        <path d="M 65 63 Q 77 11 66 10 Q 55 11 56 63 Z" fill="#FF8A80" />
      </svg>
    )
  },
  {
    id: "chucu_acc_detective",
    name: "Mũ Thám Tử Tài Ba",
    description: "Mũ phớt Sherlock Holmes hoạ tiết caro sành điệu chuyên đi phá án của Chucu.",
    svgContent: () => (
      <g>
        <path d="M 28 27 Q 50 20 72 27 Z" fill="#8D6E63" stroke="#3E2723" strokeWidth="2.5" strokeLinejoin="round" />
        <path d="M 31 25 C 30 11, 70 11, 69 25 Z" fill="#8D6E63" stroke="#3E2723" strokeWidth="2.5" strokeLinejoin="round" />
        <line x1="50" y1="12" x2="50" y2="25" stroke="#3E2723" strokeWidth="1.2" opacity="0.4" />
        <line x1="38" y1="18" x2="62" y2="18" stroke="#3E2723" strokeWidth="1.2" opacity="0.4" />
        <circle cx="50" cy="11.5" r="2.2" fill="#5D4037" stroke="#3E2723" strokeWidth="1.5" />
      </g>
    ),
    previewSvg: (
      <svg viewBox="0 0 100 100" className="w-12 h-12">
        <path d="M 12 60 Q 50 45 88 60 Z" fill="#8D6E63" stroke="#3E2723" strokeWidth="5.5" strokeLinejoin="round" />
        <path d="M 18 55 C 16 20, 84 20, 82 55 Z" fill="#8D6E63" stroke="#3E2723" strokeWidth="5.5" strokeLinejoin="round" />
        <line x1="50" y1="23" x2="50" y2="55" stroke="#3E2723" strokeWidth="2.5" opacity="0.4" />
        <line x1="28" y1="39" x2="72" y2="39" stroke="#3E2723" strokeWidth="2.5" opacity="0.4" />
        <circle cx="50" cy="21" r="5" fill="#5D4037" stroke="#3E2723" strokeWidth="2.5" />
      </svg>
    )
  },
  {
    id: "chucu_acc_scarf",
    name: "Khăn Choàng Ấm Áp",
    description: "Chiếc khăn len đỏ viền sọc trắng giữ ấm vào những ngày đông lạnh giá khi đọc truyện.",
    svgContent: () => (
      <g>
        <rect x="36" y="66" width="28" height="7.5" rx="3.5" fill="#E53935" stroke="#3E2723" strokeWidth="2.2" />
        <line x1="43" y1="66" x2="43" y2="73.5" stroke="#FFF" strokeWidth="2" />
        <line x1="50" y1="66" x2="50" y2="73.5" stroke="#FFF" strokeWidth="2" />
        <line x1="57" y1="66" x2="57" y2="73.5" stroke="#FFF" strokeWidth="2" />
        {/* Scarf hanging tail */}
        <path d="M 58 72 L 63 80 Q 64 84 62 84 Q 59 84 57 73 Z" fill="#E53935" stroke="#3E2723" strokeWidth="1.8" strokeLinejoin="round" />
        <line x1="59.5" y1="74" x2="62" y2="79" stroke="#FFF" strokeWidth="1.5" />
      </g>
    ),
    previewSvg: (
      <svg viewBox="0 0 100 100" className="w-12 h-12">
        <rect x="15" y="40" width="70" height="20" rx="10" fill="#E53935" stroke="#3E2723" strokeWidth="5.5" />
        <line x1="30" y1="40" x2="30" y2="60" stroke="#FFF" strokeWidth="5.5" />
        <line x1="50" y1="40" x2="50" y2="60" stroke="#FFF" strokeWidth="5.5" />
        <line x1="70" y1="40" x2="70" y2="60" stroke="#FFF" strokeWidth="5.5" />
        <path d="M 68 55 L 82 85 Q 85 92 80 92 Q 72 92 65 58 Z" fill="#E53935" stroke="#3E2723" strokeWidth="4" strokeLinejoin="round" />
        <line x1="72" y1="63" x2="79" y2="79" stroke="#FFF" strokeWidth="4" />
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
