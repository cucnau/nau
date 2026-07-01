import { useState, useEffect, useRef } from "react";
import { useStore } from "../store";
import {
  ShoppingBag,
  Key,
  Zap,
  Smile,
  Lock,
  Shuffle,
  CalendarCheck,
  Search,
  ChevronLeft,
  ChevronRight,
  Ticket,
  RefreshCw,
} from "lucide-react";
import { cn } from "../components/Layout";
import { db } from "../lib/firebase";
import { collection, query, getDocs, orderBy } from "firebase/firestore";
import { getChucuAccessoryPreview } from "../components/ChucuPresetAccessories";

const PRESET_SHOP_ACCESSORIES = [
  {
    id: "preset_crown",
    name: "Vương Miện Hoàng Gia",
    description: "Chiếc vương miện lấp lánh bằng vàng dành riêng cho vị vua Chucu tinh nghịch.",
    price: 50,
    requiredLevel: 5,
    type: "choco",
    url: "chucu_acc_crown"
  },
  {
    id: "preset_sunglasses",
    name: "Kính Râm Cool Ngầu",
    description: "Cặp kính đặc vụ đen láy siêu ngầu cho Chucu sành điệu bước đi.",
    price: 20,
    requiredLevel: 2,
    type: "choco",
    url: "chucu_acc_sunglasses"
  },
  {
    id: "preset_halo",
    name: "Hào Quang Thiên Thần",
    description: "Một vòng thánh quang lấp lánh lơ lửng trên đỉnh đầu của em Chucu.",
    price: 5,
    requiredLevel: 10,
    type: "golden",
    url: "chucu_acc_halo"
  },
  {
    id: "preset_ribbon",
    name: "Nơ Đỏ Quý Phái",
    description: "Chiếc nơ lụa thắt đỏ duyên dáng, làm bừng sáng nét dễ thương.",
    price: 10,
    requiredLevel: 1,
    type: "choco",
    url: "chucu_acc_ribbon"
  },
  {
    id: "preset_santa",
    name: "Mũ Noel Ấm Áp",
    description: "Nhỏ bé mà ấm cúng, chiếc mũ Noel rực ánh đỏ sưởi ấm mùa đông.",
    price: 15,
    requiredLevel: 1,
    type: "choco",
    url: "chucu_acc_santa"
  },
  {
    id: "preset_chef",
    name: "Mũ Đầu Bếp Nhí",
    description: "Chiếc mũ trắng tơi phồng, giúp Chucu sẵn sàng nhào nặn sô cô la ngọt ngào.",
    price: 25,
    requiredLevel: 3,
    type: "choco",
    url: "chucu_acc_chef"
  },
  {
    id: "preset_cat_ears",
    name: "Tai Mèo Tinh Nghịch",
    description: "Nhìn vểnh vểnh cực dễ thương với đôi tai mèo nhỏ xíu sô cô la.",
    price: 30,
    requiredLevel: 4,
    type: "choco",
    url: "chucu_acc_cat_ears"
  },
  {
    id: "preset_straw_hat",
    name: "Mũ Rơm Đồng Quê",
    description: "Cùng Chucu đi picnic, dạo mát nhẹ nhàng dưới nắng hạ mộc mạc.",
    price: 12,
    requiredLevel: 2,
    type: "choco",
    url: "chucu_acc_straw_hat"
  },
  {
    id: "preset_apple",
    name: "Quả Táo Đỏ Thăng Bằng",
    description: "Một quả táo nhỏ căng mọng thăng bằng cực kiêu trên đỉnh đầu.",
    price: 8,
    requiredLevel: 1,
    type: "choco",
    url: "chucu_acc_apple"
  },
  {
    id: "preset_sprout",
    name: "Băng Đô Mầm Cây Hy Vọng",
    description: "Một mầm cây xanh nhỏ bé tràn đầy sức sống mọc lên từ đỉnh đầu của Chucu.",
    price: 10,
    requiredLevel: 1,
    type: "choco",
    url: "chucu_acc_sprout"
  },
  {
    id: "preset_monocle",
    name: "Kính Đơn & Râu Quý Tộc",
    description: "Sự kết hợp giữa chiếc kính đơn hoàng gia vàng óng và bộ ria mép uốn cong lịch lãm.",
    price: 35,
    requiredLevel: 4,
    type: "choco",
    url: "chucu_acc_monocle"
  },
  {
    id: "preset_wizard_hat",
    name: "Mũ Phù Thuỷ Chiêm Tinh",
    description: "Mũ chóp cao màu tím huyền hoặc đính kèm trăng khuyết và sao đêm lấp lánh.",
    price: 45,
    requiredLevel: 5,
    type: "choco",
    url: "chucu_acc_wizard_hat"
  },
  {
    id: "preset_headphones",
    name: "Tai Nghe Neon Gaming",
    description: "Bộ tai nghe màu hồng ngọt ngào với đệm mút đen cực chất cho game thủ Chucu.",
    price: 4,
    requiredLevel: 8,
    type: "golden",
    url: "chucu_acc_headphones"
  },
  {
    id: "preset_round_glasses",
    name: "Kính Tròn Học Thức",
    description: "Đôi kính gọng tròn sẫm màu tri thức, cộng ngay 100 điểm IQ cho thú cưng.",
    price: 18,
    requiredLevel: 2,
    type: "choco",
    url: "chucu_acc_round_glasses"
  },
  {
    id: "preset_bunny_ears",
    name: "Tai Thỏ Lém Lỉnh",
    description: "Bộ tai thỏ siêu dài mềm mại thướt tha, biến Chucu thành thỏ ngọc Choco.",
    price: 22,
    requiredLevel: 3,
    type: "choco",
    url: "chucu_acc_bunny_ears"
  },
  {
    id: "preset_detective",
    name: "Mũ Thám Tử Tài Ba",
    description: "Mũ phớt Sherlock Holmes hoạ tiết caro sành điệu chuyên đi phá án của Chucu.",
    price: 40,
    requiredLevel: 5,
    type: "choco",
    url: "chucu_acc_detective"
  },
  {
    id: "preset_scarf",
    name: "Khăn Choàng Ấm Áp",
    description: "Chiếc khăn len đỏ viền sọc trắng giữ ấm vào những ngày đông lạnh giá khi đọc truyện.",
    price: 15,
    requiredLevel: 2,
    type: "choco",
    url: "chucu_acc_scarf"
  }
];

export function Store() {
  const {
    choco,
    goldenChoco,
    spendChoco,
    spendGoldenChoco,
    addGoldenChoco,
    isLoggedIn,
    email,
    buyTicket,
    updateUserDoc,
    ownedStickers,
    addOwnedSticker,
    equipSticker,
    firebaseUser,
    ownedAccessories,
    addOwnedAccessory,
    equipAccessory,
    ownedChucuAccessories,
    addOwnedChucuAccessory,
    equipChucuAccessory,
    chucuLevel,
    chucuGameFragments,
    gachaFragments = 0,
    ownedGachaTickets,
    ownedGachaTicketsLimited,
  } = useStore();
  const [storeStickers, setStoreStickers] = useState<any[]>([]);
  const [storeAccessories, setStoreAccessories] = useState<any[]>([]);
  const [storeChucuAccessories, setStoreChucuAccessories] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<
    "items" | "stickers" | "accessories" | "chucu_accessories"
  >("items");
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Scroll window and root elements
    window.scrollTo({ top: 0, behavior: "smooth" });
    document.documentElement.scrollTo({ top: 0, behavior: "smooth" });
    document.body.scrollTo({ top: 0, behavior: "smooth" });

    // Traverse upwards from current container to scroll any scrollable elements (e.g. Modals)
    if (containerRef.current) {
      let parent = containerRef.current.parentElement;
      while (parent) {
        if (parent.scrollHeight > parent.clientHeight) {
          parent.scrollTo({ top: 0, behavior: "smooth" });
        }
        parent = parent.parentElement;
      }
    }
  }, [currentPage]);

  useEffect(() => {
    const fetchStickers = async () => {
      try {
        const q = query(
          collection(db, "store_stickers"),
          orderBy("createdAt", "desc"),
        );
        const snap = await getDocs(q);
        const data = snap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));

        // Resolve "item-" URLs from gacha_items
        const gachaQ = query(collection(db, "gacha_items"));
        const gachaSnap = await getDocs(gachaQ);
        const gachaMap: Record<string, string> = {};
        gachaSnap.docs.forEach((d) => {
          const item = d.data();
          if (item.id && item.image) {
            gachaMap[item.id] = item.image;
          }
        });

        const resolvedData = data.map((st: any) => {
          if (st.url && st.url.startsWith("item-") && gachaMap[st.url]) {
            return { ...st, url: gachaMap[st.url] };
          }
          return st;
        });

        setStoreStickers(resolvedData);
      } catch (err) {
        console.error("Lỗi khi tải danh sách sticker:", err);
      }
    };
    const fetchAccessories = async () => {
      try {
        const q = query(
          collection(db, "store_accessories"),
          orderBy("createdAt", "desc"),
        );
        const snap = await getDocs(q);
        const data = snap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));

        const gachaQ = query(collection(db, "gacha_items"));
        const gachaSnap = await getDocs(gachaQ);
        const gachaMap: Record<string, string> = {};
        gachaSnap.docs.forEach((d) => {
          const item = d.data();
          if (item.id && item.image) {
            gachaMap[item.id] = item.image;
          }
        });

        const resolvedData = data.map((st: any) => {
          if (st.url && st.url.startsWith("item-") && gachaMap[st.url]) {
            return { ...st, url: gachaMap[st.url] };
          }
          return st;
        });

        setStoreAccessories(resolvedData);
      } catch (err) {
        console.error("Lỗi khi tải danh sách phụ kiện:", err);
      }
    };
    const fetchChucuAccessories = async () => {
      try {
        const q = query(
          collection(db, "store_chucu_accessories"),
          orderBy("createdAt", "desc"),
        );
        const snap = await getDocs(q);
        const fbAccessories = snap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
        
        const gachaQ = query(collection(db, "gacha_items"));
        const gachaSnap = await getDocs(gachaQ);
        const gachaMap: Record<string, string> = {};
        gachaSnap.docs.forEach((d) => {
          const item = d.data();
          if (item.id && item.image) {
            gachaMap[item.id] = item.image;
          }
        });

        const resolvedFbAccessories = fbAccessories.map((st: any) => {
          if (st.url && st.url.startsWith("item-") && gachaMap[st.url]) {
            return { ...st, url: gachaMap[st.url] };
          }
          return st;
        });

        // Merge with preset ones, filtering out duplicates by url/id
        const fbUrls = resolvedFbAccessories.map((a: any) => a.url);
        const missingPresets = PRESET_SHOP_ACCESSORIES.filter(p => !fbUrls.includes(p.url));
        
        const combined = [
          ...resolvedFbAccessories,
          ...missingPresets
        ];

        // Sort by requiredLevel ascending (lowest level required first)
        combined.sort((a: any, b: any) => {
          const lvA = Number(a.requiredLevel !== undefined ? a.requiredLevel : 1);
          const lvB = Number(b.requiredLevel !== undefined ? b.requiredLevel : 1);
          return lvA - lvB;
        });

        setStoreChucuAccessories(combined);
      } catch (err) {
        console.error("Lỗi khi tải danh sách phụ kiện chucu:", err);
      }
    };
    fetchStickers();
    fetchAccessories();
    fetchChucuAccessories();
  }, []);

  const handleExchange = () => {
    if (!isLoggedIn) {
      alert("Vui lòng đăng nhập!");
      return;
    }
    const input = prompt(
      "Nhập số lượng Gchoco muốn đổi (3 Choco = 1 Gchoco):",
      "1",
    );
    if (input === null) return;
    const amount = parseInt(input, 10);
    if (isNaN(amount) || amount <= 0) {
      alert("Số lượng không hợp lệ!");
      return;
    }
    const cost = amount * 3;
    if (spendChoco(cost, `Đổi sang ${amount} GChoco`)) {
      addGoldenChoco(amount, `Đổi từ ${cost} Choco`);
      alert(`Đổi thành công ${amount} Gchoco!`);
    } else {
      alert(`Không đủ Choco (Cần ${cost} Choco để đổi ${amount} Gchoco)!`);
    }
  };

  const handleExchangeGachaFragmentsToGachaTicket = (type: 'normal' | 'limited') => {
    if (!isLoggedIn) {
      alert("Vui lòng đăng nhập!");
      return;
    }
    const currentGachaFragments = gachaFragments || 0;
    if (currentGachaFragments < 100) {
      alert(`Bạn không đủ Mảnh Choco Gacha (Bạn có: ${currentGachaFragments}, cần ít nhất 100 mảnh)!`);
      return;
    }
    const maxTickets = Math.floor(currentGachaFragments / 100);
    const typeLabel = type === 'normal' ? 'Vé Gacha Banner Thường' : 'Vé Gacha Banner Giới Hạn';
    const input = prompt(`Nhập số ${typeLabel} muốn đổi (100 Mảnh Choco Gacha = 1 Vé). Tối đa bạn đổi được ${maxTickets} vé:`, "1");
    if (input === null) return;
    const qty = parseInt(input, 10);
    if (isNaN(qty) || qty <= 0) {
      alert("Số lượng đổi không hợp lệ!");
      return;
    }
    const cost = qty * 100;
    if (currentGachaFragments >= cost) {
      if (type === 'normal') {
        updateUserDoc({
          gachaFragments: currentGachaFragments - cost,
          ownedGachaTickets: (ownedGachaTickets || 0) + qty
        });
      } else {
        updateUserDoc({
          gachaFragments: currentGachaFragments - cost,
          ownedGachaTicketsLimited: (ownedGachaTicketsLimited || 0) + qty
        });
      }
      alert(`Đổi thành công ${qty} ${typeLabel} từ ${cost} Mảnh Choco Gacha!`);
    } else {
      alert(`Bạn không đủ Mảnh Choco Gacha (Cần ${cost} Mảnh)!`);
    }
  };

  const handleExchangeGChocoToGachaTicket = (type: 'normal' | 'limited') => {
    if (!isLoggedIn) {
      alert("Vui lòng đăng nhập!");
      return;
    }
    const currentGChoco = goldenChoco || 0;
    if (currentGChoco < 2) {
      alert(`Bạn không đủ Gchoco (Bạn có: ${currentGChoco}, cần ít nhất 2 Gchoco)!`);
      return;
    }
    const maxTickets = Math.floor(currentGChoco / 2);
    const typeLabel = type === 'normal' ? 'Vé Gacha Banner Thường' : 'Vé Gacha Banner Giới Hạn';
    const input = prompt(`Nhập số ${typeLabel} muốn đổi từ Gchoco (2 Gchoco = 1 Vé). Tối đa bạn đổi được ${maxTickets} vé:`, "1");
    if (input === null) return;
    const qty = parseInt(input, 10);
    if (isNaN(qty) || qty <= 0) {
      alert("Số lượng đổi không hợp lệ!");
      return;
    }
    const cost = qty * 2;
    if (spendGoldenChoco(cost, `Đổi sang ${qty} ${typeLabel}`)) {
      if (type === 'normal') {
        updateUserDoc({
          ownedGachaTickets: (ownedGachaTickets || 0) + qty
        });
      } else {
        updateUserDoc({
          ownedGachaTicketsLimited: (ownedGachaTicketsLimited || 0) + qty
        });
      }
      alert(`Đổi thành công ${qty} ${typeLabel} từ ${cost} Gchoco!`);
    } else {
      alert(`Bạn không đủ Gchoco (Cần ${cost} Gchoco)!`);
    }
  };

  const buyTicketWithQuantity = (
    name: string,
    pricePerUnit: number,
    currencyType: "choco" | "golden",
    ticketType: "pass" | "priority" | "streak" | "gacha",
  ) => {
    if (!isLoggedIn) {
      alert("Vui lòng đăng nhập!");
      return;
    }
    const input = prompt(`Nhập số lượng ${name} muốn mua:`, "1");
    if (input === null) return;
    const qty = parseInt(input, 10);
    if (isNaN(qty) || qty <= 0) {
      alert("Số lượng mua không hợp lệ!");
      return;
    }
    const totalPrice = pricePerUnit * qty;
    if (currencyType === "choco") {
      if (spendChoco(totalPrice, `Mua ${qty} ${name}`)) {
        if (ticketType === "gacha") {
          updateUserDoc({
            ownedGachaTickets: (ownedGachaTickets || 0) + qty,
          });
        } else {
          buyTicket(ticketType, qty);
        }
        alert(`Đã mua thành công ${qty} ${name}!`);
      } else {
        alert(`Không đủ Choco (Cần ${totalPrice} Choco để mua ${qty} vé)`);
      }
    } else {
      if (spendGoldenChoco(totalPrice, `Mua ${qty} ${name}`)) {
        if (ticketType === "gacha") {
          updateUserDoc({
            ownedGachaTickets: (ownedGachaTickets || 0) + qty,
          });
        } else {
          buyTicket(ticketType, qty);
        }
        alert(`Đã mua thành công ${qty} ${name}!`);
      } else {
        alert(`Không đủ Gchoco (Cần ${totalPrice} Gchoco để mua ${qty} vé)`);
      }
    }
  };

  const handleBuyItem = (
    name: string,
    price: number,
    type: "choco" | "golden",
    effect?: () => void,
  ) => {
    if (!isLoggedIn) {
      alert("Vui lòng đăng nhập!");
      return;
    }

    if (type === "choco") {
      if (spendChoco(price, `Mua ${name}`)) {
        if (effect) effect();
        alert(`Đã mua ${name}!`);
      } else alert(`Không đủ Choco (Cần ${price})`);
    } else {
      if (spendGoldenChoco(price, `Mua ${name}`)) {
        if (effect) effect();
        alert(`Đã mua ${name}!`);
      } else alert(`Không đủ Gchoco (Cần ${price})`);
    }
  };

  const buySticker = (sticker: any) => {
    if (!sticker.url) {
      alert("Sticker này chưa có ảnh.");
      return;
    }

    if (ownedStickers?.includes(sticker.url)) {
      alert("Bạn đã sở hữu sticker này rồi!");
      return;
    }

    handleBuyItem(sticker.name, sticker.price, sticker.type, () => {
      addOwnedSticker(sticker.url);
      equipSticker(sticker.type as any, sticker.url);
      alert(`Bạn đã mua và tự động trang bị ${sticker.name}!`);
    });
  };

  const buyAccessory = (accessory: any) => {
    if (!accessory.url) {
      alert("Phụ kiện này chưa có ảnh.");
      return;
    }

    if (ownedAccessories?.includes(accessory.url)) {
      alert("Bạn đã sở hữu phụ kiện này rồi!");
      return;
    }

    handleBuyItem(accessory.name, accessory.price, accessory.type, () => {
      addOwnedAccessory(accessory.url);
      equipAccessory(accessory.url);
      alert(`Bạn đã mua và tự động trang bị ${accessory.name}!`);
    });
  };

  const buyChucuAccessory = (accessory: any) => {
    if (!accessory.url) {
      alert("Phụ kiện này chưa có ảnh.");
      return;
    }

    const reqLevel = accessory.requiredLevel || 1;
    if (chucuLevel < reqLevel) {
      alert(`Chucu của bạn cần đạt cấp độ ${reqLevel} để mua phụ kiện này!`);
      return;
    }

    if (ownedChucuAccessories?.includes(accessory.url)) {
      alert("Bạn đã sở hữu phụ kiện này rồi!");
      return;
    }

    handleBuyItem(accessory.name, accessory.price, accessory.type, () => {
      addOwnedChucuAccessory(accessory.url);
      equipChucuAccessory(accessory.url);
      alert(`Bạn đã mua và tự động trang bị ${accessory.name} cho Chucu!`);
    });
  };

  const filteredItems =
    activeTab === "stickers"
      ? storeStickers.filter((sticker) =>
          (sticker.name || "")
            .toLowerCase()
            .includes(searchQuery.toLowerCase()),
        )
      : activeTab === "accessories"
        ? storeAccessories.filter((acc) =>
            (acc.name || "").toLowerCase().includes(searchQuery.toLowerCase()),
          )
        : activeTab === "chucu_accessories"
          ? storeChucuAccessories.filter((acc) =>
              (acc.name || "")
                .toLowerCase()
                .includes(searchQuery.toLowerCase()),
            )
          : [];

  const ITEMS_PER_PAGE = 12;
  const totalPages = Math.ceil(filteredItems.length / ITEMS_PER_PAGE);
  const displayedItems = filteredItems.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE,
  );

  return (
    <div
      ref={containerRef}
      className="p-4 sm:p-6 lg:p-10 max-w-5xl mx-auto w-full flex flex-col gap-8"
    >
      <div className="bg-[#3E2723] text-[#FDF6EC] p-6 rounded-3xl flex flex-col sm:flex-row items-center justify-between gap-4 shadow-[1.5px_1.5px_0_0_#1A1412] border-2 border-[#1A1412]">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold mb-1 flex items-center gap-2 uppercase tracking-tighter">
            <ShoppingBag className="w-6 h-6" /> Cửa Hàng
          </h1>
          <p className="opacity-80 italic text-sm">
            Sử dụng Choco và Gchoco để mua vật phẩm.
          </p>
        </div>
        <div className="flex items-center gap-3 bg-[#2D1B19] p-3 rounded-xl border border-[#5D4037]">
          <div className="flex flex-col items-center px-3">
            <span className="text-[10px] uppercase font-bold tracking-widest opacity-80 mb-1 text-[#FDF6EC]">
              Choco
            </span>
            <span className="text-sm font-bold bg-[#FDF6EC] text-[#3E2723] px-3 py-1 rounded-full border border-[#8D6E63]">
              {choco}
            </span>
          </div>
          <div className="w-px h-8 bg-[#8D6E63]"></div>
          <div className="flex flex-col items-center px-3">
            <span className="text-[10px] font-bold tracking-widest opacity-80 mb-1 text-[#D4AF37]">
              Gchoco
            </span>
            <span className="text-sm font-bold bg-[#D4AF37]/20 text-[#D4AF37] px-3 py-1 rounded-full border border-[#D4AF37]/50">
              {goldenChoco}
            </span>
          </div>
        </div>
      </div>

      <div className="w-full overflow-x-auto no-scrollbar py-2 -mx-2 px-2 sm:mx-0 sm:px-0 flex justify-start md:justify-center">
        <div className="inline-flex bg-[#FDF6EC] dark:bg-[#1A1412] border-[3px] border-[#3E2723] p-1.5 rounded-2xl font-black uppercase text-xs tracking-wide shadow-[1.5px_1.5px_0_0_#3E2723] min-w-max my-1">
          <button
            onClick={() => {
              setActiveTab("items");
              setCurrentPage(1);
            }}
            className={cn(
              "px-4 py-2 rounded-xl transition-all flex items-center justify-center gap-2 font-black text-xs uppercase tracking-wide",
              activeTab === "items"
                ? "bg-[#E6D4BF] dark:bg-[#C29D70] border-2 border-[#3E2723] dark:border-[#4E342E] text-[#3E2723] dark:text-[#181311] shadow-inner"
                : "text-[#8D6E63] dark:text-stone-400 hover:bg-[#FFFDF9] dark:hover:bg-[#2C221D] hover:text-[#5D4037] dark:hover:text-[#ECE5DC]",
            )}
          >
            <ShoppingBag className="w-4 h-4" /> Vật Phẩm
          </button>
          <button
            onClick={() => {
              setActiveTab("stickers");
              setCurrentPage(1);
            }}
            className={cn(
              "px-4 py-2 rounded-xl transition-all flex items-center justify-center gap-2 font-black text-xs uppercase tracking-wide",
              activeTab === "stickers"
                ? "bg-[#E6D4BF] dark:bg-[#C29D70] border-2 border-[#3E2723] dark:border-[#4E342E] text-[#3E2723] dark:text-[#181311] shadow-inner"
                : "text-[#8D6E63] dark:text-stone-400 hover:bg-[#FFFDF9] dark:hover:bg-[#2C221D] hover:text-[#5D4037] dark:hover:text-[#ECE5DC]",
            )}
          >
            <Smile className="w-4 h-4" /> Sticker
          </button>
          <button
            onClick={() => {
              setActiveTab("accessories");
              setCurrentPage(1);
            }}
            className={cn(
              "px-4 py-2 rounded-xl transition-all flex items-center justify-center gap-2 font-black text-xs uppercase tracking-wide",
              activeTab === "accessories"
                ? "bg-[#E6D4BF] dark:bg-[#C29D70] border-2 border-[#3E2723] dark:border-[#4E342E] text-[#3E2723] dark:text-[#181311] shadow-inner"
                : "text-[#8D6E63] dark:text-stone-400 hover:bg-[#FFFDF9] dark:hover:bg-[#2C221D] hover:text-[#5D4037] dark:hover:text-[#ECE5DC]",
            )}
          >
            <Smile className="w-4 h-4" /> Phụ kiện Avatar
          </button>
          <button
            onClick={() => {
              setActiveTab("chucu_accessories");
              setCurrentPage(1);
            }}
            className={cn(
              "px-4 py-2 rounded-xl transition-all flex items-center justify-center gap-2 font-black text-xs uppercase tracking-wide",
              activeTab === "chucu_accessories"
                ? "bg-[#E6D4BF] dark:bg-[#C29D70] border-2 border-[#3E2723] dark:border-[#4E342E] text-[#3E2723] dark:text-[#181311] shadow-inner"
                : "text-[#8D6E63] dark:text-stone-400 hover:bg-[#FFFDF9] dark:hover:bg-[#2C221D] hover:text-[#5D4037] dark:hover:text-[#ECE5DC]",
            )}
          >
            <ShoppingBag className="w-4 h-4" /> Phụ kiện Chucu
          </button>
        </div>
      </div>

      {activeTab === "items" && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-6">
          {/* Exchange Card */}
          <div className="bg-[#FFFDF9] dark:bg-[#1A1412] border-[3px] border-[#3E2723] rounded-3xl p-5 flex flex-col items-center text-center shadow-[1px_1px_0_0_#3E2723] relative overflow-hidden group hover:-translate-y-1 hover:shadow-[1.5px_1.5px_0_0_#3E2723] transition-all">
            <div className="absolute top-0 right-0 bg-[#3E2723] text-[#FDF6EC] text-[8px] sm:text-[10px] uppercase font-bold tracking-widest px-2 sm:px-3 py-1 rounded-bl-xl shadow-sm">
              Quy đổi
            </div>
            <Shuffle className="w-8 h-8 sm:w-10 sm:h-10 text-[#8D6E63] mt-2 mb-2 sm:mb-4 group-hover:rotate-180 transition-transform duration-500" />
            <h3 className="text-sm sm:text-base font-bold mb-1 sm:mb-2 text-[#3E2723]">
              Đổi Gchoco
            </h3>
            <p className="text-stone-500 text-[10px] sm:text-xs mb-3 sm:mb-6 italic">
              3 Choco = 1 Gchoco.
            </p>
            <button
              onClick={handleExchange}
              className="bg-[#FDF6EC] text-[#3E2723] border border-[#8D6E63] p-2 sm:px-4 sm:py-2.5 rounded-xl font-bold hover:bg-[#3E2723] hover:text-[#FDF6EC] transition-colors w-full mt-auto uppercase text-[10px] sm:text-xs tracking-widest"
            >
              Đổi
            </button>
          </div>

          <div className="bg-[#FFFDF9] dark:bg-[#1A1412] border-[3px] border-[#3E2723] rounded-3xl p-5 flex flex-col items-center text-center shadow-[1px_1px_0_0_#3E2723] relative overflow-hidden group hover:-translate-y-1 hover:shadow-[1.5px_1.5px_0_0_#3E2723] transition-all">
            <Lock className="w-8 h-8 sm:w-10 sm:h-10 text-[#D4AF37] mb-2 sm:mb-4 group-hover:-translate-y-1 transition-transform" />
            <h3 className="text-sm sm:text-base font-black mb-1 sm:mb-2 uppercase text-[#3E2723]">
              Vé Pass Truyện
            </h3>
            <p className="text-stone-500 text-[10px] sm:text-xs mb-3 sm:mb-6 italic">
              Mở khoá 1 chương truyện bị đặt password.
            </p>
            <button
              onClick={() =>
                buyTicketWithQuantity("Vé Pass Truyện", 5, "golden", "pass")
              }
              className="bg-[#D4AF37] text-[#3E2723] p-2 sm:px-4 sm:py-2.5 rounded-2xl font-black border-2 border-[#3E2723] shadow-[1px_1px_0_0_#3E2723] active:translate-y-[2px] active:shadow-none hover:bg-[#B5952F] transition-all w-full mt-auto flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-1 uppercase text-[10px] sm:text-xs tracking-widest"
            >
              <span>Mua</span>{" "}
              <span className="bg-black/10 px-2 py-0.5 rounded-full text-[9px] sm:text-[10px] whitespace-nowrap">
                5 Gchoco
              </span>
            </button>
          </div>

          <div className="bg-[#FFFDF9] dark:bg-[#1A1412] border-[3px] border-[#3E2723] rounded-3xl p-5 flex flex-col items-center text-center shadow-[1px_1px_0_0_#3E2723] relative overflow-hidden group hover:-translate-y-1 hover:shadow-[1.5px_1.5px_0_0_#3E2723] transition-all">
            <Zap className="w-8 h-8 sm:w-10 sm:h-10 text-[#D4AF37] mb-2 sm:mb-4 group-hover:scale-110 transition-transform" />
            <h3 className="text-sm sm:text-base font-black mb-1 sm:mb-2 uppercase text-[#3E2723]">
              Vé Ưu Tiên
            </h3>
            <p className="text-stone-500 text-[10px] sm:text-xs mb-3 sm:mb-6 italic">
              Đọc sớm các chương truyện vừa đăng.
            </p>
            <button
              onClick={() =>
                buyTicketWithQuantity("Vé Ưu Tiên", 3, "golden", "priority")
              }
              className="bg-[#D4AF37] text-[#3E2723] p-2 sm:px-4 sm:py-2.5 rounded-2xl font-black border-2 border-[#3E2723] shadow-[1px_1px_0_0_#3E2723] active:translate-y-[2px] active:shadow-none hover:bg-[#B5952F] transition-all w-full mt-auto flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-1 uppercase text-[10px] sm:text-xs tracking-widest"
            >
              <span>Mua</span>{" "}
              <span className="bg-black/10 px-2 py-0.5 rounded-full text-[9px] sm:text-[10px] whitespace-nowrap">
                3 Gchoco
              </span>
            </button>
          </div>

          <div className="bg-[#FFFDF9] dark:bg-[#1A1412] border-[3px] border-[#3E2723] rounded-3xl p-5 flex flex-col items-center text-center shadow-[1px_1px_0_0_#3E2723] relative overflow-hidden group hover:-translate-y-1 hover:shadow-[1.5px_1.5px_0_0_#3E2723] transition-all">
            <CalendarCheck className="w-8 h-8 sm:w-10 sm:h-10 text-[#8D6E63] mb-2 sm:mb-4 group-hover:-translate-y-1 transition-transform" />
            <h3 className="text-sm sm:text-base font-black mb-1 sm:mb-2 uppercase text-[#3E2723]">
              Vé Giữ Chuỗi
            </h3>
            <p className="text-stone-500 text-[10px] sm:text-xs mb-3 sm:mb-6 italic">
              Tự động tiêu hao để bảo vệ chuỗi khi quên điểm danh.
            </p>
            <button
              onClick={() =>
                buyTicketWithQuantity("Vé Giữ Chuỗi", 5, "choco", "streak")
              }
              className="bg-[#3E2723] text-[#FDF6EC] p-2 sm:px-4 sm:py-2.5 rounded-2xl font-black border-2 border-[#1A1412] shadow-[1px_1px_0_0_#1A1412] active:translate-y-[2px] active:shadow-none hover:bg-[#2D1B19] transition-all w-full mt-auto flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-1 uppercase text-[10px] sm:text-xs tracking-widest"
            >
              <span>Mua</span>{" "}
              <span className="bg-[#FDF6EC]/20 px-2 py-0.5 rounded-full text-[9px] sm:text-[10px] whitespace-nowrap">
                5 Choco
              </span>
            </button>
          </div>

          {/* Vé Gacha Thường đổi từ Mảnh Choco Gacha */}
          <div className="bg-[#FFFDF9] dark:bg-[#1A1412] border-[3px] border-[#3E2723] rounded-3xl p-5 flex flex-col items-center text-center shadow-[1px_1px_0_0_#3E2723] relative overflow-hidden group hover:-translate-y-1 hover:shadow-[1.5px_1.5px_0_0_#3E2723] transition-all">
            <div className="absolute top-0 right-0 bg-pink-600 text-[#FDF6EC] text-[8px] sm:text-[10px] uppercase font-bold tracking-widest px-2 sm:px-3 py-1 rounded-bl-xl shadow-sm">
              Đổi Mảnh • Thường
            </div>
            <RefreshCw className="w-8 h-8 sm:w-10 sm:h-10 text-pink-500 mt-2 mb-2 sm:mb-4 group-hover:rotate-180 transition-transform duration-500" />
            <h3 className="text-sm sm:text-base font-black mb-1 sm:mb-2 uppercase text-[#3E2723] dark:text-[#ECE5DC]">
              Vé Gacha Thường
            </h3>
            <p className="text-stone-500 text-[10px] sm:text-xs mb-3 sm:mb-6 italic">
              100 Mảnh Choco Gacha = 1 Vé Thường. Bạn có: {gachaFragments || 0} mảnh.
            </p>
            <button
              onClick={() => handleExchangeGachaFragmentsToGachaTicket('normal')}
              className="bg-pink-600 text-[#FDF6EC] border border-pink-700 p-2 sm:px-4 sm:py-2.5 rounded-xl font-bold hover:bg-pink-700 transition-colors w-full mt-auto uppercase text-[10px] sm:text-xs tracking-widest cursor-pointer"
            >
              Đổi vé thường
            </button>
          </div>

          {/* Vé Gacha Giới Hạn đổi từ Mảnh Choco Gacha */}
          <div className="bg-[#FFFDF9] dark:bg-[#1A1412] border-[3px] border-[#3E2723] rounded-3xl p-5 flex flex-col items-center text-center shadow-[1px_1px_0_0_#3E2723] relative overflow-hidden group hover:-translate-y-1 hover:shadow-[1.5px_1.5px_0_0_#3E2723] transition-all">
            <div className="absolute top-0 right-0 bg-teal-600 text-[#FDF6EC] text-[8px] sm:text-[10px] uppercase font-bold tracking-widest px-2 sm:px-3 py-1 rounded-bl-xl shadow-sm">
              Đổi Mảnh • Giới Hạn
            </div>
            <RefreshCw className="w-8 h-8 sm:w-10 sm:h-10 text-teal-500 mt-2 mb-2 sm:mb-4 group-hover:rotate-180 transition-transform duration-500" />
            <h3 className="text-sm sm:text-base font-black mb-1 sm:mb-2 uppercase text-[#3E2723] dark:text-[#ECE5DC]">
              Vé Gacha Giới Hạn
            </h3>
            <p className="text-stone-500 text-[10px] sm:text-xs mb-3 sm:mb-6 italic">
              100 Mảnh Choco Gacha = 1 Vé Giới Hạn. Bạn có: {gachaFragments || 0} mảnh.
            </p>
            <button
              onClick={() => handleExchangeGachaFragmentsToGachaTicket('limited')}
              className="bg-teal-600 text-[#FDF6EC] border border-teal-700 p-2 sm:px-4 sm:py-2.5 rounded-xl font-bold hover:bg-teal-700 transition-colors w-full mt-auto uppercase text-[10px] sm:text-xs tracking-widest cursor-pointer"
            >
              Đổi vé giới hạn
            </button>
          </div>

          {/* Vé Gacha Thường đổi từ Gchoco */}
          <div className="bg-[#FFFDF9] dark:bg-[#1A1412] border-[3px] border-[#3E2723] rounded-3xl p-5 flex flex-col items-center text-center shadow-[1px_1px_0_0_#3E2723] relative overflow-hidden group hover:-translate-y-1 hover:shadow-[1.5px_1.5px_0_0_#3E2723] transition-all">
            <div className="absolute top-0 right-0 bg-[#D4AF37] text-black text-[8px] sm:text-[10px] uppercase font-bold tracking-widest px-2 sm:px-3 py-1 rounded-bl-xl shadow-sm">
              Đổi Gchoco • Thường
            </div>
            <Ticket className="w-8 h-8 sm:w-10 sm:h-10 text-[#D4AF37] mt-2 mb-2 sm:mb-4 group-hover:scale-110 transition-transform duration-300" />
            <h3 className="text-sm sm:text-base font-black mb-1 sm:mb-2 uppercase text-[#3E2723] dark:text-[#ECE5DC]">
              Gchoco lấy Vé Thường
            </h3>
            <p className="text-stone-500 text-[10px] sm:text-xs mb-3 sm:mb-6 italic">
              2 Gchoco = 1 Vé Gacha Thường. Bạn có: {goldenChoco || 0} Gchoco.
            </p>
            <button
              onClick={() => handleExchangeGChocoToGachaTicket('normal')}
              className="bg-[#D4AF37] text-slate-950 p-2 sm:px-4 sm:py-2.5 rounded-xl font-black border-2 border-[#3E2723] shadow-[1px_1px_0_0_#3E2723] hover:bg-[#B5952F] transition-all w-full mt-auto uppercase text-[10px] sm:text-xs tracking-widest cursor-pointer"
            >
              Đổi vé thường
            </button>
          </div>

          {/* Vé Gacha Giới Hạn đổi từ Gchoco */}
          <div className="bg-[#FFFDF9] dark:bg-[#1A1412] border-[3px] border-[#3E2723] rounded-3xl p-5 flex flex-col items-center text-center shadow-[1px_1px_0_0_#3E2723] relative overflow-hidden group hover:-translate-y-1 hover:shadow-[1.5px_1.5px_0_0_#3E2723] transition-all">
            <div className="absolute top-0 right-0 bg-[#E07A5F] text-[#FDF6EC] text-[8px] sm:text-[10px] uppercase font-bold tracking-widest px-2 sm:px-3 py-1 rounded-bl-xl shadow-sm">
              Đổi Gchoco • Giới Hạn
            </div>
            <Ticket className="w-8 h-8 sm:w-10 sm:h-10 text-[#E07A5F] mt-2 mb-2 sm:mb-4 group-hover:scale-110 transition-transform duration-300" />
            <h3 className="text-sm sm:text-base font-black mb-1 sm:mb-2 uppercase text-[#3E2723] dark:text-[#ECE5DC]">
              Gchoco lấy Vé Hạn Giờ
            </h3>
            <p className="text-stone-500 text-[10px] sm:text-xs mb-3 sm:mb-6 italic">
              2 Gchoco = 1 Vé Gacha Giới Hạn. Bạn có: {goldenChoco || 0} Gchoco.
            </p>
            <button
              onClick={() => handleExchangeGChocoToGachaTicket('limited')}
              className="bg-[#E07A5F] text-[#FDF6EC] p-2 sm:px-4 sm:py-2.5 rounded-xl font-bold border-2 border-[#3E2723] shadow-[1px_1px_0_0_#3E2723] hover:bg-[#C9644A] transition-all w-full mt-auto uppercase text-[10px] sm:text-xs tracking-widest cursor-pointer"
            >
              Đổi vé giới hạn
            </button>
          </div>

        </div>
      )}

      {activeTab === "stickers" && (
        <div className="flex flex-col gap-6 w-full">
          <div className="relative w-full max-w-md self-center sm:self-start">
            <input
              type="text"
              placeholder="Tìm kiếm sticker theo tên..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full pl-10 pr-4 py-2 border-2 border-[#D7CCC8] dark:border-[#5D4037] rounded-xl bg-white dark:bg-[#1A1412] text-[#3E2723] dark:text-[#ECE5DC] focus:outline-none focus:border-[#8D6E63] transition-colors font-medium"
            />
            <Search className="w-4 h-4 text-stone-400 absolute left-3 top-3" />
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-6">
            {displayedItems.length === 0 && (
              <div className="col-span-full text-center text-stone-500 py-8 italic border border-dashed border-[#D7CCC8] rounded-2xl bg-white/50 dark:bg-black/20">
                {searchQuery
                  ? "Không tìm thấy sticker nào phù hợp từ khóa tìm kiếm."
                  : "Cửa hàng hiện chưa có sticker nào."}
              </div>
            )}
            {displayedItems.map((sticker) => (
              <div
                key={sticker.id}
                className="bg-[#FFFDF9] dark:bg-[#1A1412] border-[3px] border-[#3E2723] rounded-3xl p-5 flex flex-col items-center text-center shadow-[1px_1px_0_0_#3E2723] relative overflow-hidden group hover:-translate-y-1 hover:shadow-[1.5px_1.5px_0_0_#3E2723] transition-all"
              >
                <div className="w-12 h-12 sm:w-14 sm:h-14 relative mb-2 sm:mb-4 p-1 sm:p-2 bg-stone-50 rounded-xl border border-stone-100 flex items-center justify-center shrink-0">
                  {sticker.url ? (
                    <img
                      src={sticker.url}
                      alt="Sticker"
                      className="w-10 h-10 sm:w-12 sm:h-12 object-contain pointer-events-none"
                    />
                  ) : (
                    <Smile className="w-6 h-6 sm:w-8 sm:h-8 text-[#A1887F]" />
                  )}
                </div>
                <h3 className="text-sm sm:text-base font-black mb-1 sm:mb-2 uppercase text-[#3E2723]">
                  {sticker.name}
                </h3>
                <p className="text-stone-500 text-[10px] sm:text-xs mb-3 sm:mb-6 italic">
                  {sticker.description}
                </p>
                {ownedStickers?.includes(sticker.url) ? (
                  <button
                    disabled
                    className="p-2 sm:px-4 sm:py-2.5 rounded-xl font-bold w-full mt-auto flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2 uppercase text-[10px] sm:text-xs tracking-widest bg-stone-300 text-stone-500 cursor-not-allowed"
                  >
                    Đã có
                  </button>
                ) : (
                  <button
                    onClick={() => buySticker(sticker)}
                    className={cn(
                      "p-2 sm:px-4 sm:py-2.5 rounded-2xl font-black border-2 border-[#3E2723] shadow-[1px_1px_0_0_#3E2723] active:translate-y-[2px] active:shadow-none transition-all w-full mt-auto flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-1 uppercase text-[10px] sm:text-xs tracking-widest",
                      sticker.type === "golden"
                        ? "bg-[#D4AF37] text-[#3E2723]"
                        : "bg-[#3E2723] text-[#FDF6EC]",
                    )}
                  >
                    <span>Mua</span>{" "}
                    <span
                      className={cn(
                        "px-2 py-0.5 rounded-full text-[9px] sm:text-[10px] whitespace-nowrap",
                        sticker.type === "golden"
                          ? "bg-black/10"
                          : "bg-[#FDF6EC]/20",
                      )}
                    >
                      {sticker.price}{" "}
                      {sticker.type === "golden" ? "GChoco" : "Choco"}
                    </span>
                  </button>
                )}
              </div>
            ))}
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-1.5 sm:gap-2 mt-4 self-center select-none">
              <button
                disabled={currentPage === 1}
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                className="p-2 rounded-xl border border-[#D7CCC8] dark:border-[#5D4037] bg-white dark:bg-[#1A1412] text-[#3E2723] dark:text-[#ECE5DC] disabled:opacity-40 disabled:cursor-not-allowed hover:bg-stone-50 dark:hover:bg-[#2C221D] transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((pg) => (
                <button
                  key={pg}
                  onClick={() => setCurrentPage(pg)}
                  className={cn(
                    "w-8 h-8 rounded-xl font-bold text-xs transition-colors border",
                    currentPage === pg
                      ? "bg-[#3E2723] dark:bg-[#C29D70] border-[#3E2723] dark:border-[#C29D70] text-[#FDF6EC] dark:text-[#181311]"
                      : "bg-white dark:bg-[#1A1412] border-[#D7CCC8] dark:border-[#5D4037] text-[#3E2723] dark:text-[#ECE5DC] hover:bg-stone-50 dark:hover:bg-[#2C221D]",
                  )}
                >
                  {pg}
                </button>
              ))}
              <button
                disabled={currentPage === totalPages}
                onClick={() =>
                  setCurrentPage((p) => Math.min(totalPages, p + 1))
                }
                className="p-2 rounded-xl border border-[#D7CCC8] dark:border-[#5D4037] bg-white dark:bg-[#1A1412] text-[#3E2723] dark:text-[#ECE5DC] disabled:opacity-40 disabled:cursor-not-allowed hover:bg-stone-50 dark:hover:bg-[#2C221D] transition-colors"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      )}

      {activeTab === "accessories" && (
        <div className="flex flex-col gap-6 w-full">
          <div className="relative w-full max-w-md self-center sm:self-start">
            <input
              type="text"
              placeholder="Tìm kiếm phụ kiện theo tên..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full pl-10 pr-4 py-2 border-2 border-[#D7CCC8] dark:border-[#5D4037] rounded-xl bg-white dark:bg-[#1A1412] text-[#3E2723] dark:text-[#ECE5DC] focus:outline-none focus:border-[#8D6E63] transition-colors font-medium"
            />
            <Search className="w-4 h-4 text-stone-400 absolute left-3 top-3" />
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-6">
            {displayedItems.length === 0 && (
              <div className="col-span-full text-center text-stone-500 py-8 italic border border-dashed border-[#D7CCC8] rounded-2xl bg-white/50 dark:bg-black/20">
                {searchQuery
                  ? "Không tìm thấy phụ kiện nào phù hợp từ khóa tìm kiếm."
                  : "Cửa hàng hiện chưa có phụ kiện nào."}
              </div>
            )}
            {displayedItems.map((accessory) => (
              <div
                key={accessory.id}
                className="bg-[#FFFDF9] dark:bg-[#1A1412] border-[3px] border-[#3E2723] rounded-3xl p-5 flex flex-col items-center text-center shadow-[1px_1px_0_0_#3E2723] relative overflow-hidden group hover:-translate-y-1 hover:shadow-[1.5px_1.5px_0_0_#3E2723] transition-all"
              >
                <div className="w-12 h-12 sm:w-14 sm:h-14 relative mb-2 sm:mb-4 p-1 sm:p-2 bg-stone-50 rounded-xl border border-stone-100 flex items-center justify-center shrink-0">
                  {accessory.url ? (
                    <img
                      src={accessory.url}
                      alt="Accessory"
                      className="w-10 h-10 sm:w-12 sm:h-12 object-contain pointer-events-none"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <Smile className="w-6 h-6 sm:w-8 sm:h-8 text-[#A1887F]" />
                  )}
                </div>
                <h3 className="text-sm sm:text-base font-black mb-1 sm:mb-2 uppercase text-[#3E2723]">
                  {accessory.name}
                </h3>
                <p className="text-stone-500 text-[10px] sm:text-xs mb-3 sm:mb-6 italic">
                  {accessory.description}
                </p>

                {accessory.requiredLevel > 1 && (
                  <div
                    className={cn(
                      "text-[9px] sm:text-[10px] font-bold mb-3 px-2 py-0.5 rounded-full uppercase tracking-wider",
                      chucuLevel >= accessory.requiredLevel
                        ? "bg-[#E6D4BF] dark:bg-[#C29D70] text-[#5D4037] dark:text-[#181311]"
                        : "bg-red-100 dark:bg-red-950/40 text-red-600 dark:text-red-400",
                    )}
                  >
                    Yêu cầu Chucu Lv.{accessory.requiredLevel}
                  </div>
                )}

                {ownedAccessories?.includes(accessory.url) ? (
                  <button
                    disabled
                    className="p-2 sm:px-4 sm:py-2.5 rounded-xl font-bold w-full mt-auto flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2 uppercase text-[10px] sm:text-xs tracking-widest bg-stone-300 text-stone-500 cursor-not-allowed"
                  >
                    Đã sở hữu
                  </button>
                ) : (
                  <button
                    onClick={() => buyAccessory(accessory)}
                    className={cn(
                      "p-2 sm:px-4 sm:py-2.5 rounded-xl font-bold transition-colors w-full mt-auto flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2 uppercase text-[10px] sm:text-xs tracking-widest shadow-md",
                      accessory.type === "golden"
                        ? "bg-[#D4AF37] text-white hover:bg-[#B5952F]"
                        : "bg-[#3E2723] text-[#FDF6EC] hover:bg-[#2D1B19]",
                    )}
                  >
                    <span>Mua</span>{" "}
                    <span
                      className={cn(
                        "px-2 py-0.5 rounded-full text-[9px] sm:text-[10px] whitespace-nowrap",
                        accessory.type === "golden"
                          ? "bg-black/10"
                          : "bg-[#FDF6EC]/20",
                      )}
                    >
                      {accessory.price}{" "}
                      {accessory.type === "golden" ? "GChoco" : "Choco"}
                    </span>
                  </button>
                )}
              </div>
            ))}
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-1.5 sm:gap-2 mt-4 self-center select-none">
              <button
                disabled={currentPage === 1}
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                className="p-2 rounded-xl border border-[#D7CCC8] dark:border-[#5D4037] bg-white dark:bg-[#1A1412] text-[#3E2723] dark:text-[#ECE5DC] disabled:opacity-40 disabled:cursor-not-allowed hover:bg-stone-50 dark:hover:bg-[#2C221D] transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((pg) => (
                <button
                  key={pg}
                  onClick={() => setCurrentPage(pg)}
                  className={cn(
                    "w-8 h-8 rounded-xl font-bold text-xs transition-colors border",
                    currentPage === pg
                      ? "bg-[#3E2723] dark:bg-[#C29D70] border-[#3E2723] dark:border-[#C29D70] text-[#FDF6EC] dark:text-[#181311]"
                      : "bg-white dark:bg-[#1A1412] border-[#D7CCC8] dark:border-[#5D4037] text-[#3E2723] dark:text-[#ECE5DC] hover:bg-stone-50 dark:hover:bg-[#2C221D]",
                  )}
                >
                  {pg}
                </button>
              ))}
              <button
                disabled={currentPage === totalPages}
                onClick={() =>
                  setCurrentPage((p) => Math.min(totalPages, p + 1))
                }
                className="p-2 rounded-xl border border-[#D7CCC8] dark:border-[#5D4037] bg-white dark:bg-[#1A1412] text-[#3E2723] dark:text-[#ECE5DC] disabled:opacity-40 disabled:cursor-not-allowed hover:bg-stone-50 dark:hover:bg-[#2C221D] transition-colors"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      )}

      {activeTab === "chucu_accessories" && (
        <div className="flex flex-col gap-6 w-full">
          <div className="relative w-full max-w-md self-center sm:self-start">
            <input
              type="text"
              placeholder="Tìm kiếm phụ kiện Chucu..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full pl-10 pr-4 py-2 border-2 border-[#D7CCC8] dark:border-[#5D4037] rounded-xl bg-white dark:bg-[#1A1412] text-[#3E2723] dark:text-[#ECE5DC] focus:outline-none focus:border-[#8D6E63] transition-colors font-medium"
            />
            <Search className="w-4 h-4 text-stone-400 absolute left-3 top-3" />
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-6">
            {displayedItems.length === 0 && (
              <div className="col-span-full text-center text-stone-500 py-8 italic border border-dashed border-[#D7CCC8] rounded-2xl bg-white/50 dark:bg-black/20">
                {searchQuery
                  ? "Không tìm thấy phụ kiện nào."
                  : "Cửa hàng hiện chưa có phụ kiện Chucu nào."}
              </div>
            )}
            {displayedItems.map((accessory) => (
              <div
                key={accessory.id}
                className="bg-[#FFFDF9] dark:bg-[#1A1412] border-[3px] border-[#3E2723] rounded-3xl p-5 flex flex-col items-center text-center shadow-[1px_1px_0_0_#3E2723] relative overflow-hidden group hover:-translate-y-1 hover:shadow-[1.5px_1.5px_0_0_#3E2723] transition-all"
              >
                <div className="w-12 h-12 sm:w-14 sm:h-14 relative mb-2 sm:mb-4 p-1 sm:p-2 bg-stone-50 rounded-xl border border-stone-100 flex items-center justify-center shrink-0">
                  {accessory.url ? (
                    accessory.url.startsWith("chucu_acc_") ? (
                      getChucuAccessoryPreview(accessory.url)
                    ) : (
                      <img
                        src={accessory.url}
                        alt="Accessory"
                        className="w-10 h-10 sm:w-12 sm:h-12 object-contain pointer-events-none"
                        referrerPolicy="no-referrer"
                      />
                    )
                  ) : (
                    <Smile className="w-6 h-6 sm:w-8 sm:h-8 text-[#A1887F]" />
                  )}
                </div>
                <h3 className="text-sm sm:text-base font-black mb-1 sm:mb-2 uppercase text-[#3E2723]">
                  {accessory.name}
                </h3>
                <p className="text-stone-500 text-[10px] sm:text-xs mb-3 sm:mb-6 italic">
                  {accessory.description}
                </p>

                {accessory.requiredLevel > 1 && (
                  <div
                    className={cn(
                      "text-[9px] sm:text-[10px] font-bold mb-3 px-2 py-0.5 rounded-full uppercase tracking-wider",
                      chucuLevel >= accessory.requiredLevel
                        ? "bg-[#E6D4BF] dark:bg-[#C29D70] text-[#5D4037] dark:text-[#181311]"
                        : "bg-red-100 dark:bg-red-950/40 text-red-600 dark:text-red-400",
                    )}
                  >
                    Yêu cầu Chucu Lv.{accessory.requiredLevel}
                  </div>
                )}

                {ownedChucuAccessories?.includes(accessory.url) ? (
                  <button
                    disabled
                    className="p-2 sm:px-4 sm:py-2.5 rounded-xl font-bold w-full mt-auto flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2 uppercase text-[10px] sm:text-xs tracking-widest bg-stone-300 text-stone-500 cursor-not-allowed"
                  >
                    Đã sở hữu
                  </button>
                ) : (
                  <button
                    onClick={() => buyChucuAccessory(accessory)}
                    className={cn(
                      "p-2 sm:px-4 sm:py-2.5 rounded-xl font-bold transition-colors w-full mt-auto flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2 uppercase text-[10px] sm:text-xs tracking-widest shadow-md",
                      accessory.type === "golden"
                        ? "bg-[#D4AF37] text-white hover:bg-[#B5952F]"
                        : "bg-[#3E2723] text-[#FDF6EC] hover:bg-[#2D1B19]",
                    )}
                  >
                    <span>Mua</span>{" "}
                    <span
                      className={cn(
                        "px-2 py-0.5 rounded-full text-[9px] sm:text-[10px] whitespace-nowrap",
                        accessory.type === "golden"
                          ? "bg-black/10"
                          : "bg-[#FDF6EC]/20",
                      )}
                    >
                      {accessory.price}{" "}
                      {accessory.type === "golden" ? "GChoco" : "Choco"}
                    </span>
                  </button>
                )}
              </div>
            ))}
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-1.5 sm:gap-2 mt-4 self-center select-none">
              <button
                disabled={currentPage === 1}
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                className="p-2 rounded-xl border border-[#D7CCC8] dark:border-[#5D4037] bg-white dark:bg-[#1A1412] text-[#3E2723] dark:text-[#ECE5DC] disabled:opacity-40 disabled:cursor-not-allowed hover:bg-stone-50 dark:hover:bg-[#2C221D] transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((pg) => (
                <button
                  key={pg}
                  onClick={() => setCurrentPage(pg)}
                  className={cn(
                    "w-8 h-8 rounded-xl font-bold text-xs transition-colors border",
                    currentPage === pg
                      ? "bg-[#3E2723] dark:bg-[#C29D70] border-[#3E2723] dark:border-[#C29D70] text-[#FDF6EC] dark:text-[#181311]"
                      : "bg-white dark:bg-[#1A1412] border-[#D7CCC8] dark:border-[#5D4037] text-[#3E2723] dark:text-[#ECE5DC] hover:bg-stone-50 dark:hover:bg-[#2C221D]",
                  )}
                >
                  {pg}
                </button>
              ))}
              <button
                disabled={currentPage === totalPages}
                onClick={() =>
                  setCurrentPage((p) => Math.min(totalPages, p + 1))
                }
                className="p-2 rounded-xl border border-[#D7CCC8] dark:border-[#5D4037] bg-white dark:bg-[#1A1412] text-[#3E2723] dark:text-[#ECE5DC] disabled:opacity-40 disabled:cursor-not-allowed hover:bg-stone-50 dark:hover:bg-[#2C221D] transition-colors"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
