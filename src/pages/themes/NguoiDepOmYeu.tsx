import React, { useState, useEffect } from 'react';
import { ThemeProps } from './ThemeProps';
import { format } from 'date-fns';
import { useStore } from '../../store';
import { UserAvatar } from '../../components/UserAvatar';
import { db } from '../../lib/firebase';
import { collection, query, orderBy, limit, setDoc, doc, onSnapshot } from 'firebase/firestore';
import { 
  BookOpen, 
  ExternalLink, 
  Gift, 
  Send, 
  Bookmark, 
  Heart, 
  ArrowLeft, 
  Sparkles, 
  GraduationCap, 
  TrendingUp, 
  Award, 
  Clock, 
  Coffee, 
  CheckSquare, 
  Square,
  AlertCircle,
  Skull,
  BarChart2,
  Calendar,
  Layers,
  ChevronLeft,
  ChevronRight,
  Activity,
  DollarSign,
  Plus,
  RotateCcw,
  User,
  Users
} from 'lucide-react';

interface Subject {
  id: string;
  name: string;
}

const SUBJECTS: Subject[] = [
  { id: 'toan', name: 'Toán' },
  { id: 'van', name: 'Ngữ văn' },
  { id: 'tieng-anh', name: 'Ngoại ngữ (Tiếng Anh)' },
  { id: 'tieng-phap', name: 'Ngoại ngữ (Tiếng Pháp)' },
  { id: 'tieng-trung', name: 'Ngoại ngữ (Tiếng Trung)' },
  { id: 'tieng-duc', name: 'Ngoại ngữ (Tiếng Đức)' },
  { id: 'tieng-nhat', name: 'Ngoại ngữ (Tiếng Nhật)' },
  { id: 'tieng-nga', name: 'Ngoại ngữ (Tiếng Nga)' },
  { id: 'tieng-han', name: 'Ngoại ngữ (Tiếng Hàn)' },
  { id: 'lich-su', name: 'Lịch sử' },
  { id: 'vat-ly', name: 'Vật lí' },
  { id: 'hoa-hoc', name: 'Hóa học' },
  { id: 'sinh-hoc', name: 'Sinh học' },
  { id: 'dia-ly', name: 'Địa lí' },
  { id: 'gdktepl', name: 'Giáo dục Kinh tế và Pháp luật' },
  { id: 'tin-hoc', name: 'Tin học' },
  { id: 'cn-cong-nghiep', name: 'Công nghệ (Công nghiệp)' },
  { id: 'cn-nong-nghiep', name: 'Công nghệ (Nông nghiệp)' },
];

function generateQuestion(subjectId: string, index: number) {
  let question = "";
  let options: string[] = [];
  let correct = 0;
  let explanation = "";

  const num = index + 1;

  if (subjectId === 'toan') {
    const cat = index % 10;
    const a = ((index * 3) % 7) + 2;
    const b = ((index * 5) % 9) + 1;
    const c = ((index * 2) % 5) + 3;
    if (cat === 0) {
      question = `Tìm giá trị của x biết: ${a}x - ${b} = ${a * c - b}?`;
      options = [`A. x = ${c}`, `B. x = ${c + 1}`, `C. x = ${c - 1}`, `D. x = ${c + 2}`];
      correct = 0;
      explanation = `Phương trình ${a}x - ${b} = ${a * c - b} <=> ${a}x = ${a * c} <=> x = ${c}.`;
    } else if (cat === 1) {
      const sum = a + b;
      const prod = a * b;
      question = `Tìm nghiệm dương lớn nhất của phương trình: x² - ${sum}x + ${prod} = 0?`;
      const maxRoot = Math.max(a, b);
      const minRoot = Math.min(a, b);
      options = [`A. x = ${maxRoot}`, `B. x = ${minRoot - 1}`, `C. x = ${maxRoot + 2}`, `D. x = ${maxRoot * 2}`];
      correct = 0;
      explanation = `Phương trình có hai nghiệm x = ${a} và x = ${b}. Nghiệm lớn nhất là ${maxRoot}.`;
    } else if (cat === 2) {
      question = `Tính đạo hàm của hàm số: y = ${a}x³ + ${b}x?`;
      options = [
        `A. y' = ${3 * a}x² + ${b}`,
        `B. y' = ${a}x² + ${b}`,
        `C. y' = ${3 * a}x³ + ${b}x`,
        `D. y' = ${a}x²`
      ];
      correct = 0;
      explanation = `Đạo hàm của x³ là 3x², đạo hàm của x là 1. Do đó y' = ${3 * a}x² + ${b}.`;
    } else if (cat === 3) {
      question = `Tính diện tích hình chữ nhật có chiều dài ${a + b} cm và chiều rộng ${a} cm?`;
      const area = (a + b) * a;
      options = [`A. ${area} cm²`, `B. ${area + 5} cm²`, `C. ${area - 3} cm²`, `D. ${area * 2} cm²`];
      correct = 0;
      explanation = `Diện tích hình chữ nhật = chiều dài * chiều rộng = ${(a + b)} * ${a} = ${area} cm².`;
    } else if (cat === 4) {
      const base = 2;
      const power = (index % 4) + 2;
      const val = Math.pow(base, power);
      question = `Giải phương trình logarit: log₂ (x) = ${power}?`;
      options = [`A. x = ${val}`, `B. x = ${val + 2}`, `C. x = ${val - 1}`, `D. x = ${val * 2}`];
      correct = 0;
      explanation = `Từ định nghĩa logarit: log₂ (x) = ${power} => x = 2^${power} = ${val}.`;
    } else if (cat === 5) {
      question = `Cho hai vectơ u = (${a}, ${b}) và v = (${c}, 2). Tính tích vô hướng u.v?`;
      const dot = a * c + b * 2;
      options = [`A. ${dot}`, `B. ${dot + 3}`, `C. ${dot - 2}`, `D. 0`];
      correct = 0;
      explanation = `Tích vô hướng u.v = x1.x2 + y1.y2 = ${a}*${c} + ${b}*2 = ${dot}.`;
    } else if (cat === 6) {
      const safeLimit = Math.max(1, Math.min(5, 6 - c));
      const favorable = 6 - safeLimit;
      const prob = favorable / 6;
      const percent = Math.round(prob * 100);
      question = `Gieo một con xúc xắc 6 mặt cân đối. Xác suất xuất hiện mặt có số chấm lớn hơn ${safeLimit} là?`;
      options = [`A. ${favorable}/6 (~${percent}%)`, `B. 1/6`, `C. 1/2`, `D. 2/3`];
      correct = 0;
      explanation = `Các mặt lớn hơn ${safeLimit} là các mặt từ ${safeLimit + 1} đến 6 (gồm ${favorable} mặt). Xác suất là ${favorable}/6.`;
    } else if (cat === 7) {
      const angles = [
        { label: "30° (π/6)", sin: "1/2", cos: "√3/2" },
        { label: "45° (π/4)", sin: "√2/2", cos: "√2/2" },
        { label: "60° (π/3)", sin: "√3/2", cos: "1/2" },
        { label: "90° (π/2)", sin: "1", cos: "0" }
      ];
      const ang = angles[index % angles.length];
      const isSin = index % 2 === 0;
      question = `Tính giá trị lượng giác của ${isSin ? 'sin' : 'cos'}(${ang.label})?`;
      const ansVal = isSin ? ang.sin : ang.cos;
      const otherVal = isSin ? ang.cos : ang.sin;
      options = [`A. ${ansVal}`, `B. ${otherVal}`, `C. 0`, `D. 1`];
      correct = 0;
      explanation = `Giá trị lượng giác cơ bản: ${isSin ? 'sin' : 'cos'}(${ang.label}) = ${ansVal}.`;
    } else if (cat === 8) {
      question = `Cho cấp số cộng có u₁ = ${a}, công sai d = ${b}. Tìm số hạng thứ ${c}?`;
      const valN = a + (c - 1) * b;
      options = [`A. u_${c} = ${valN}`, `B. u_${c} = ${valN + b}`, `C. u_${c} = ${valN - b}`, `D. u_${c} = 0`];
      correct = 0;
      explanation = `Công thức số hạng tổng quát của cấp số cộng: u_n = u1 + (n-1)*d. Ta có u_${c} = ${a} + (${c}-1)*${b} = ${valN}.`;
    } else {
      question = `Cho số phức z = ${a} + ${b}i. Tìm số phức liên hợp z̄ của z?`;
      options = [`A. z̄ = ${a} - ${b}i`, `B. z̄ = -${a} + ${b}i`, `C. z̄ = ${a} + ${b}i`, `D. z̄ = ${b} + ${a}i`];
      correct = 0;
      explanation = `Số phức liên hợp của z = x + yi là z̄ = x - yi. Vậy z̄ = ${a} - ${b}i.`;
    }
  } else if (subjectId === 'van') {
    const works = [
      { name: "Tây Tiến", author: "Quang Dũng", year: "1948", type: "Thơ", main: "hình tượng người lính kiêu hùng và thiên nhiên Tây Bắc" },
      { name: "Việt Bắc", author: "Tố Hữu", year: "1954", type: "Thơ", main: "tình nghĩa quân dân và nỗi nhớ quê hương cách mạng" },
      { name: "Sóng", author: "Xuân Quỳnh", year: "1967", type: "Thơ", main: "nhịp điệu sóng biển biểu trưng cho tình yêu thiết tha" },
      { name: "Đất Nước", author: "Nguyễn Khoa Điềm", year: "1971", type: "Trích trường ca", main: "tư tưởng Đất Nước của Nhân dân sâu sắc" },
      { name: "Vợ nhặt", author: "Kim Lân", year: "1954", type: "Truyện ngắn", main: "bối cảnh nạn đói năm 1945 và khát vọng sống ấm áp" },
      { name: "Vợ chồng A Phủ", author: "Tô Hoài", year: "1952", type: "Truyện ngắn", main: "sự trỗi dậy của Mị và A Phủ thoát khỏi ách thống trị" },
      { name: "Chiếc thuyền ngoài xa", author: "Nguyễn Minh Châu", year: "1983", type: "Truyện ngắn", main: "bài học về cái nhìn cuộc đời đa chiều và nhân hậu" },
      { name: "Người lái đò sông Đà", author: "Nguyễn Tuân", year: "1960", type: "Tùy bút", main: "con sông Đà dữ dội, trữ tình và người lái đò dũng cảm" },
      { name: "Ai đã đặt tên cho dòng sông?", author: "Hoàng Phủ Ngọc Tường", year: "1981", type: "Bút ký", main: "vẻ đẹp thơ mộng, kỳ vĩ của sông Hương xứ Huế" },
      { name: "Hồn Trương Ba, da hàng thịt", author: "Lưu Quang Vũ", year: "1981", type: "Kịch", main: "xung đột giữa hồn Trương Ba nhân hậu và thể xác hàng thịt phàm phu" }
    ];
    const work = works[Math.floor(index / 5) % works.length];
    const qType = index % 5;
    if (qType === 0) {
      question = `Ai là tác giả của tác phẩm "${work.name}"?`;
      options = [`A. ${work.author}`, `B. Nguyễn Du`, `C. Nam Cao`, `D. Xuân Diệu`];
      correct = 0;
      explanation = `Tác phẩm văn học nổi tiếng "${work.name}" được sáng tác bởi nhà văn/nhà thơ ${work.author}.`;
    } else if (qType === 1) {
      question = `Thể loại chính của tác phẩm "${work.name}" là gì?`;
      options = [`A. ${work.type}`, `B. Tiểu thuyết`, `C. Thơ lục bát`, `D. Kịch bản văn học`];
      correct = 0;
      explanation = `Tác phẩm "${work.name}" được viết theo thể loại "${work.type}".`;
    } else if (qType === 2) {
      question = `Hoàn cảnh ra đời hoặc năm sáng tác tiêu biểu của tác phẩm "${work.name}" là?`;
      options = [`A. Năm ${work.year}`, `B. Năm 1930`, `C. Năm 1945`, `D. Năm 1995`];
      correct = 0;
      explanation = `Tác phẩm "${work.name}" được ra đời/sáng tác vào khoảng năm ${work.year}.`;
    } else if (qType === 3) {
      question = `Đề tài hoặc hình tượng trung tâm nổi bật nhất trong tác phẩm "${work.name}" là gì?`;
      options = [`A. Khắc họa ${work.main}`, `B. Phê phán lối sống cũ của quý tộc phong kiến`, `C. Tả cảnh thiên nhiên mùa xuân tươi đẹp`, `D. Ca ngợi cuộc sống hiện đại thành phố`];
      correct = 0;
      explanation = `Nội dung cốt lõi của tác phẩm "${work.name}" tập trung khắc họa ${work.main}.`;
    } else {
      question = `Giá trị nội dung và tư tưởng tiêu biểu của tác phẩm "${work.name}" mang đậm tinh thần gì?`;
      options = [`A. Tinh thần nhân đạo, yêu nước và khát vọng tự do, hạnh phúc`, `B. Tư tưởng bi quan chán đời`, `C. Phóng đại thực tế một cách vô nghĩa`, `D. Chỉ tập trung miêu tả phong cảnh nông thôn đơn thuần`];
      correct = 0;
      explanation = `Giá trị nghệ thuật và tư tưởng cao đẹp của "${work.name}" luôn ngập tràn tinh thần nhân đạo sâu sắc và lòng yêu quê hương đất nước của dân tộc Việt Nam.`;
    }
  } else if (['tieng-anh', 'tieng-phap', 'tieng-trung', 'tieng-duc', 'tieng-nhat', 'tieng-nga', 'tieng-han'].includes(subjectId)) {
    const langData = {
      'tieng-anh': [
        { en: "apple", vi: "quả táo" }, { en: "banana", vi: "quả chuối" }, { en: "cat", vi: "con mèo" }, { en: "dog", vi: "con chó" }, { en: "house", vi: "ngôi nhà" },
        { en: "teacher", vi: "giáo viên" }, { en: "book", vi: "quyển sách" }, { en: "water", vi: "nước uống" }, { en: "beautiful", vi: "đẹp đẽ" }, { en: "hello", vi: "xin chào" }
      ],
      'tieng-phap': [
        { en: "bonjour", vi: "xin chào" }, { en: "merci", vi: "cảm ơn" }, { en: "ami", vi: "người bạn" }, { en: "livre", vi: "quyển sách" }, { en: "maison", vi: "ngôi nhà" },
        { en: "amour", vi: "tình yêu" }, { en: "pomme", vi: "quả táo" }, { en: "école", vi: "trường học" }, { en: "eau", vi: "nước uống" }, { en: "rouge", vi: "màu đỏ" }
      ],
      'tieng-trung': [
        { en: "你好 (nǐ hǎo)", vi: "xin chào" }, { en: "谢谢 (xièxiè)", vi: "cảm ơn" }, { en: "朋友 (péngyǒu)", vi: "bạn bè" }, { en: "苹果 (píngguǒ)", vi: "quả táo" }, { en: "再见 (zàijiàn)", vi: "tạm biệt" },
        { en: "老师 (lǎoshī)", vi: "giáo viên" }, { en: "书 (shū)", vi: "quyển sách" }, { en: "水 (shuǐ)", vi: "nước uống" }, { en: "红色 (hóngsè)", vi: "màu đỏ" }, { en: "猫 (māo)", vi: "con mèo" }
      ],
      'tieng-duc': [
        { en: "hallo", vi: "xin chào" }, { en: "danke", vi: "cảm ơn" }, { en: "freund", vi: "người bạn" }, { en: "buch", vi: "quyển sách" }, { en: "haus", vi: "ngôi nhà" },
        { en: "wasser", vi: "nước uống" }, { en: "apfel", vi: "quả táo" }, { en: "schule", vi: "trường học" }, { en: "rot", vi: "màu đỏ" }, { en: "auf wiedersehen", vi: "tạm biệt" }
      ],
      'tieng-nhat': [
        { en: "こんにちは (konnichiwa)", vi: "xin chào" }, { en: "ありがとう (arigatou)", vi: "cảm ơn" }, { en: "ともだち (tomodachi)", vi: "bạn bè" }, { en: "ほん (hon)", vi: "quyển sách" }, { en: "いえ (ie)", vi: "ngôi nhà" },
        { en: "みず (mizu)", vi: "nước uống" }, { en: "りんご (ringo)", vi: "quả táo" }, { en: "がっこう (gakkou)", vi: "trường học" }, { en: "あかい (akai)", vi: "màu đỏ" }, { en: "さようなら (sayounara)", vi: "tạm biệt" }
      ],
      'tieng-nga': [
        { en: "привет (privet)", vi: "xin chào" }, { en: "спасибо (spasibo)", vi: "cảm ơn" }, { en: "друг (drug)", vi: "người bạn" }, { en: "книга (kniga)", vi: "quyển sách" }, { en: "дом (dom)", vi: "ngôi nhà" },
        { en: "вода (voda)", vi: "nước uống" }, { en: "яблоко (yabloko)", vi: "quả táo" }, { en: "школа (shkola)", vi: "trường học" }, { en: "красный (krasny)", vi: "màu đỏ" }, { en: "до свидания (do svidaniya)", vi: "tạm biệt" }
      ],
      'tieng-han': [
        { en: "안녕하세요 (annyeonghaseyo)", vi: "xin chào" }, { en: "감사합니다 (kamsahamnida)", vi: "cảm ơn" }, { en: "친구 (chingu)", vi: "bạn bè" }, { en: "책 (chaek)", vi: "quyển sách" }, { en: "집 (jip)", vi: "ngôi nhà" },
        { en: "물 (mul)", vi: "nước uống" }, { en: "사과 (sagwa)", vi: "quả táo" }, { en: "학교 (hakgyo)", vi: "trường học" }, { en: "빨간색 (ppalgansaek)", vi: "màu đỏ" }, { en: "안녕히 계세요 (annyeonghi gyeseyo)", vi: "tạm biệt" }
      ]
    };

    const words = langData[subjectId] || langData['tieng-anh'];
    const item = words[Math.floor(index / 5) % words.length];
    const qType = index % 5;
    const SUBJECTS_LOC = [
      { id: 'tieng-anh', name: 'Tiếng Anh' },
      { id: 'tieng-phap', name: 'Tiếng Pháp' },
      { id: 'tieng-trung', name: 'Tiếng Trung' },
      { id: 'tieng-duc', name: 'Tiếng Đức' },
      { id: 'tieng-nhat', name: 'Tiếng Nhật' },
      { id: 'tieng-nga', name: 'Tiếng Nga' },
      { id: 'tieng-han', name: 'Tiếng Hàn' }
    ];
    const langName = SUBJECTS_LOC.find(s => s.id === subjectId)?.name || "Ngoại ngữ";

    if (qType === 0) {
      question = `Trong môn ${langName}, từ nào có nghĩa là: "${item.vi}"?`;
      options = [`A. ${item.en}`, `B. table / l'ordinateur`, `C. fast / grand`, `D. pen / la chaise`];
      correct = 0;
      explanation = `Trong ${langName}, "${item.en}" tương đương với nghĩa "${item.vi}".`;
    } else if (qType === 1) {
      question = `Dịch từ "${item.en}" từ ${langName} sang Tiếng Việt là gì?`;
      options = [`A. ${item.vi}`, `B. màu xanh dương`, `C. trường đại học`, `D. gia đình ấm áp`];
      correct = 0;
      explanation = `"${item.en}" trong ${langName} có nghĩa tiếng Việt chính xác là "${item.vi}".`;
    } else if (qType === 2) {
      question = `Chọn cách sử dụng đúng ngữ cảnh của từ "${item.en}" trong giao tiếp?`;
      options = [
        `A. Sử dụng rộng rãi để biểu đạt khái niệm "${item.vi}"`,
        `B. Chỉ dùng trong nghiên cứu vũ trụ cổ`,
        `C. Là một từ mang nghĩa phủ định hoàn toàn`,
        `D. Chỉ dùng khi viết công thức hóa học`
      ];
      correct = 0;
      explanation = `Từ "${item.en}" là một từ cơ bản, quen thuộc, biểu thị "${item.vi}".`;
    } else if (qType === 3) {
      question = `Điền từ thích hợp vào chỗ trống để tạo ra câu giao tiếp tự nhiên nhất: "... ${item.en}."`;
      options = [`A. Sử dụng từ "${item.en}" là tối ưu nhất`, `B. run`, `C. complex`, `D. yellow`];
      correct = 0;
      explanation = `Sử dụng từ vựng "${item.en}" giúp hoàn thành câu giao tiếp một cách tự nhiên và chính xác nhất.`;
    } else {
      question = `Vai trò ngữ nghĩa của từ "${item.en}" trong các câu đàm thoại là gì?`;
      options = [
        `A. Biểu thị khái niệm "${item.vi}" một cách chính xác`,
        `B. Là một liên từ nối hai vế độc lập`,
        `C. Là một thán từ chỉ sự bất ngờ lớn`,
        `D. Là một hậu tố phủ định`
      ];
      correct = 0;
      explanation = `"${item.en}" đóng vai trò quan trọng biểu đạt nghĩa "${item.vi}" trong giao tiếp hàng ngày.`;
    }
  } else {
    const dataMap = {
      'lich-su': [
        { c: "Chiến thắng Điện Biên Phủ", p: "1954", h: "Đại tướng Võ Nguyên Giáp", u: "kết thúc thắng lợi cuộc kháng chiến chống thực dân Pháp" },
        { c: "Đại thắng mùa Xuân", p: "1975", h: "Bộ Chính trị và Quân ủy Trung ương", u: "giải phóng hoàn toàn miền Nam, thống nhất đất nước" },
        { c: "Cách mạng tháng Tám", p: "1945", h: "Chủ tịch Hồ Chí Minh", u: "khai sinh ra nước Việt Nam Dân chủ Cộng hòa" },
        { c: "Thành lập Đảng Cộng sản Việt Nam", p: "1930", h: "Lãnh tụ Nguyễn Ái Quốc", u: "mở ra bước ngoặt quyết định cho cách mạng Việt Nam" },
        { c: "Phong trào Cần Vương", p: "cuối thế kỷ XIX", h: "Vua Hàm Nghi và Tôn Thất Thuyết", u: "phong trào yêu nước chống Pháp theo khuynh hướng phong kiến" },
        { c: "Hiệp định Giơ-ne-vơ", p: "1954", h: "Phái đoàn Việt Nam Dân chủ Cộng hòa", u: "được ký kết nhằm lập lại hòa bình ở Đông Dương" },
        { c: "Hiệp định Pa-ri", p: "1973", h: "Đại diện các bên tham gia", u: "buộc Mỹ phải rút quân về nước, tạo thế đi lên cho cách mạng" },
        { c: "Chiến dịch Điện Biên Phủ trên không", p: "1972", h: "Quân và dân thủ đô Hà Nội", u: "đập tan cuộc tập kích chiến lược bằng máy bay B-52 của Mỹ" },
        { c: "Thời kỳ Đổi Mới đất nước", p: "1986", h: "Đại hội đại biểu toàn quốc lần thứ VI của Đảng", u: "đưa đất nước thoát khỏi khủng hoảng kinh tế - xã hội" },
        { c: "Phong trào Xô viết Nghệ - Tĩnh", p: "1930 - 1931", h: "Giai cấp công nhân và nông dân liên minh", u: "là cuộc tổng diễn tập đầu tiên chuẩn bị cho Cách mạng tháng Tám" }
      ],
      'vat-ly': [
        { c: "Dao động điều hòa", f: "x = A*cos(ωt + φ)", u: "chu kỳ", d: "khoảng thời gian để vật thực hiện một dao động toàn phần" },
        { c: "Sóng dừng", f: "l = k*λ/2 (hai đầu cố định)", u: "bước sóng λ", d: "khoảng cách giữa hai nút hoặc hai bụng liên tiếp là λ/2" },
        { c: "Hiện tượng giao thoa ánh sáng", f: "i = λD/a", u: "khoảng vân i", d: "khoảng cách giữa hai vân sáng hoặc hai vân tối liên tiếp" },
        { c: "Hiện tượng quang điện ngoài", f: "hf = A + E_đmax", u: "giới hạn quang điện λ₀", d: "bước sóng ánh sáng kích thích phải nhỏ hơn hoặc bằng λ₀" },
        { c: "Mạch dao động LC", f: "T = 2π√(LC)", u: "chu kỳ T", d: "mạch dao động điện từ tự do gồm một cuộn cảm L và một tụ điện C" },
        { c: "Dòng điện xoay chiều", f: "I = U/Z", u: "cường độ hiệu dụng", d: "đại lượng có giá trị bằng cường độ của dòng điện không đổi tỏa cùng nhiệt lượng" },
        { c: "Phản ứng phân hạch", f: "ΔE = Δm * c²", u: "độ hụt khối", d: "quá trình một hạt nhân rất nặng hấp thụ nơtron và vỡ thành hai hạt nhân trung bình" },
        { c: "Sóng cơ", f: "v = λ*f", u: "tốc độ truyền sóng", d: "sự lan truyền dao động cơ học trong một môi trường vật chất theo thời gian" },
        { c: "Tán sắc ánh sáng", f: "n_đỏ < n_tím", u: "chiết suất", d: "hiện tượng phân tích một chùm ánh sáng phức tạp thành các chùm sáng đơn sắc" },
        { c: "Quang phổ vạch phát xạ", f: "E = hf", u: "vạch sáng màu", d: "hệ thống các vạch sáng riêng lẻ ngăn cách nhau bởi những khoảng tối" }
      ],
      'hoa-hoc': [
        { c: "Este metyl axetat", f: "CH₃COOCH₃", p: "thủy phân tạo ra ancol metylic", u: "dung môi pha sơn" },
        { c: "Glucozơ", f: "C₆H₁₂O₆", p: "phản ứng tráng bạc với AgNO₃/NH₃", u: "thuốc tăng lực trong y tế" },
        { c: "Amino axit Glyxin", f: "H₂N-CH₂-COOH", p: "tính chất lưỡng tính tác dụng cả axit và bazơ", u: "thành phần cấu tạo peptit" },
        { c: "Polime PE (Polietilen)", f: "-(CH₂-CH₂)-_n", p: "được điều chế bằng phản ứng trùng hợp etilen", u: "sản xuất màng mỏng, túi nilon" },
        { c: "Kim loại Natri (Na)", f: "Na", p: "tác dụng mãnh liệt với nước ở nhiệt độ thường", u: "chất trao đổi nhiệt trong lò phản ứng" },
        { c: "Kim loại Nhôm (Al)", f: "Al", p: "tính lưỡng tính của hợp chất Al(OH)₃ và Al₂O₃", u: "chế tạo vỏ máy bay, đồ dùng nhà bếp" },
        { c: "Sắt (Fe)", f: "Fe", p: "bị thụ động hóa trong HNO₃ đặc, nguội", u: "vật liệu xây dựng, hợp kim gang thép" },
        { c: "Thạch cao nung", f: "CaSO₄.H₂O", p: "hút nước hóa cứng khi nhào với nước", u: "đúc tượng, bó bột khi gãy xương" },
        { c: "Phèn chua", f: "KAl(SO₄)₂.12H₂O", p: "tạo kết tủa keo Al(OH)₃ làm trong nước", u: "làm trong nước đục" },
        { c: "Khí cacbonic", f: "CO₂", p: "hiệu ứng nhà kính làm tăng nhiệt độ Trái Đất", u: "sản xuất nước giải khát có ga" }
      ],
      'sinh-hoc': [
        { c: "Quá trình nhân đôi ADN", s: "diễn ra theo nguyên tắc bán bảo toàn và bổ sung", u: "truyền đạt thông tin di truyền qua các thế hệ tế bào" },
        { c: "Phiên mã", s: "tổng hợp mARN từ mạch gốc của gen", u: "chuyển mã thông tin từ ADN sang ARN" },
        { c: "Dịch mã", s: "tổng hợp chuỗi pôlipeptit tại ribôxôm", u: "biểu hiện tính trạng từ thông tin di truyền" },
        { c: "Đột biến gen", s: "những biến đổi trong cấu trúc của gen", u: "tạo ra các alen mới cung cấp nguyên liệu cho tiến hóa" },
        { c: "Quy luật phân ly", s: "mỗi tính trạng do một cặp nhân tố di truyền quy định", u: "dự đoán tỷ lệ kiểu hình ở đời con lai F2" },
        { c: "Quy luật phân ly độc lập", s: "các cặp nhân tố di truyền phân ly độc lập với nhau", u: "tạo ra nguồn biến dị tổ hợp vô cùng phong phú" },
        { c: "Đột biến lệch bội", s: "thay đổi số lượng NST ở một hoặc một số cặp", u: "gây ra các hội chứng di truyền như hội chứng Đao" },
        { c: "Học thuyết tiến hóa hiện đại", s: "chọn lọc tự nhiên là nhân tố định hướng quá trình tiến hóa", u: "giải thích sự hình thành các đặc điểm thích nghi" },
        { c: "Hệ sinh thái", s: "gồm sinh cảnh và quần xã sinh vật", u: "đảm bảo dòng năng lượng và chu trình tuần hoàn vật chất" },
        { c: "Chuỗi thức ăn", s: "gồm many loài sinh vật có quan hệ dinh dưỡng với nhau", u: "mô tả mối quan hệ ăn thịt lẫn nhau trong tự nhiên" }
      ],
      'dia-ly': [
        { c: "Vị trí địa lý Việt Nam", g: "nằm ở rìa phía đông của bán đảo Đông Dương, gần trung tâm khu vực Đông Nam Á", u: "thuận lợi giao lưu phát triển kinh tế" },
        { c: "Khí hậu nước ta", g: "khí hậu nhiệt đới ẩm gió mùa có sự phân hóa đa dạng", u: "ảnh hưởng lớn đến cơ cấu mùa vụ nông nghiệp" },
        { c: "Địa hình đồi núi", g: "đồi núi chiếm 3/4 diện tích lãnh thổ nhưng chủ yếu là đồi núi thấp", u: "thuận lợi trồng cây công nghiệp lâu năm" },
        { c: "Sông ngòi Việt Nam", g: "mạng lưới sông ngòi dày đặc, nhiều nước, giàu phù sa", u: "phát triển giao thông đường thủy và thủy điện" },
        { c: "Dân số nước ta", g: "quy mô dân số đông, cơ cấu dân số vàng", u: "nguồn lao động dồi dào và thị trường tiêu thụ lớn" },
        { c: "Ngành trồng lúa gạo", g: "tập trung chủ yếu ở Đồng bằng sông Cửu Long và Đồng bằng sông Hồng", u: "đảm bảo an ninh lương thực quốc gia và xuất khẩu" },
        { c: "Đông Nam Bộ", g: "là vùng dẫn đầu cả nước về giá trị sản xuất công nghiệp", u: "thu hút vốn đầu tư nước ngoài FDI lớn nhất" },
        { c: "Tây Nguyên", g: "có diện tích đất đỏ bazan tập trung lớn nhất nước ta", u: "vùng chuyên canh cây cà phê lớn nhất Việt Nam" },
        { c: "Biển Đông", g: "vùng biển ấm, giàu tài nguyên khoáng sản và sinh vật biển", u: "phát triển tổng hợp kinh tế biển" },
        { c: "Thiên tai bão lũ", g: "thường xuyên xảy ra ở vùng duyên hải miền Trung nước ta", u: "cần chủ động phòng chống giảm thiểu thiệt hại" }
      ],
      'gdktepl': [
        { c: "Quy luật cung - cầu", p: "mối quan hệ tương tác giữa người mua và người bán", u: "điều tiết giá cả và lượng hàng hóa trên thị trường" },
        { c: "Cạnh tranh kinh tế", p: "sự ganh đua giữa các chủ thể kinh tế nhằm giành lợi thế", u: "thúc đẩy lực lượng sản xuất phát triển" },
        { c: "Lạm phát", p: "sự tăng mức giá chung một cách liên tục của hàng hóa", u: "làm giảm sức mua của đồng tiền trong lưu thông" },
        { c: "Ngân sách nhà nước", p: "toàn bộ các khoản thu, chi của Nhà nước được dự toán", u: "đảm bảo thực hiện các chức năng của Nhà nước" },
        { c: "Vi phạm pháp luật hành chính", p: "hành vi có lỗi vi phạm các quy tắc quản lý nhà nước", u: "bị xử phạt cảnh cáo hoặc phạt tiền" },
        { c: "Vi phạm pháp luật hình sự", p: "hành vi nguy hiểm cho xã hội được quy định trong Bộ luật Hình sự", u: "bị áp dụng các hình phạt nghiêm khắc như tù giam" },
        { c: "Quyền bầu cử và ứng cử", p: "quyền dân chủ cơ bản của công dân trong quản lý nhà nước", u: "thể hiện ý chí và quyền lực của nhân dân" },
        { c: "Bình đẳng giới", p: "nam, nữ có vị trí, vai trò ngang nhau trong xã hội", u: "tạo điều kiện giải phóng và phát triển con người" },
        { c: "Nghĩa vụ nộp thuế", p: "khoản thu nộp bắt buộc của các cá nhân, tổ chức vào ngân sách", u: "đóng góp tài chính cho sự phát triển đất nước" },
        { c: "Quyền bất khả xâm phạm về thân thể", p: "không ai bị bắt nếu không có quyết định của Tòa án", u: "bảo vệ quyền tự do cá nhân thiêng liêng" }
      ],
      'tin-hoc': [
        { c: "Bộ nhớ RAM", t: "bộ nhớ truy cập ngẫu nhiên lưu dữ liệu tạm thời khi máy chạy", u: "dữ liệu sẽ bị mất đi hoàn toàn khi tắt máy" },
        { c: "Hệ điều hành", t: "phần mềm hệ thống quản lý phần cứng và tài nguyên máy tính", u: "làm môi trường trung gian chạy các phần mềm ứng dụng" },
        { c: "Địa chỉ IP", t: "nhãn số được gán cho mỗi thiết bị tham gia mạng máy tính", u: "định danh thiết bị để truyền tải gói tin chính xác" },
        { c: "Mã nhị phân", t: "hệ đếm chỉ sử dụng hai ký tự là 0 và 1", u: "biểu diễn mọi loại thông tin trong máy tính điện tử" },
        { c: "Khóa chính (Primary Key)", t: "trường dữ liệu duy nhất dùng để phân biệt các bản ghi", u: "đảm bảo tính toàn vẹn thực thể trong cơ sở dữ liệu" },
        { en: "Python", t: "ngôn ngữ lập trình bậc cao, cú pháp đơn giản, dễ học", u: "phát triển ứng dụng AI, phân tích dữ liệu, web" },
        { c: "Tường lửa (Firewall)", t: "thiết bị hoặc phần mềm giám sát, lọc lưu lượng mạng", u: "ngăn chặn các truy cập trái phép từ bên ngoài" },
        { c: "Trí tuệ nhân tạo (AI)", t: "công nghệ mô phỏng các quá trình suy nghĩ, học tập của con người", u: "tự động hóa và tối ưu hóa các quy trình thông minh" },
        { c: "Đạo đức mạng", t: "quy tắc ứng xử văn minh và tôn trọng luật bản quyền số", u: "xây dựng môi trường số an toàn, nhân văn" },
        { c: "Vòng lặp for trong Python", t: "câu lệnh điều khiển lặp với số lần biết trước", u: "duyệt qua các phần tử của danh sách hoặc dãy số" }
      ],
      'cn-cong-nghiep': [
        { c: "Khổ giấy A4", i: "kích thước tiêu chuẩn 297 x 210 mm", u: "khổ giấy thông dụng nhất trong in ấn bản vẽ học tập" },
        { c: "Phương pháp chiếu góc thứ nhất", i: "vật thể được đặt giữa người quan sát và mặt phẳng chiếu", u: "bố trí hình chiếu đứng ở trên, hình chiếu bằng ở dưới" },
        { c: "Nhựa PVC", i: "vật liệu phi kim có tính cách điện xuất sắc", u: "làm vỏ bọc dây dẫn điện gia đình" },
        { c: "Phương pháp gia công tiện", i: "phương pháp cắt gọt phôi bằng chuyển động quay tròn của phôi", u: "tạo ra các chi tiết tròn xoay như trục, ren" },
        { c: "Truyền động xích", i: "truyền động ăn khớp gián tiếp qua đĩa xích và xích", u: "sử dụng phổ biến trên xe máy và xe đạp" },
        { c: "Cơ cấu tay quay con trượt", i: "biến chuyển động quay thành chuyển động tịnh tiến", u: "áp dụng trong cơ cấu pittông của động cơ đốt trong" },
        { c: "Aptomat", i: "thiết bị đóng ngắt mạch điện tự động", u: "bảo vệ mạch điện khi xảy ra sự cố quá tải, ngắn mạch" },
        { c: "Động cơ 4 kỳ", i: "hoàn thành chu trình sinh công qua 4 hành trình của pittông", u: "cho hiệu suất cao và giảm ô nhiễm môi trường" },
        { c: "Điốt bán dẫn", i: "linh kiện điện tử chỉ cho dòng điện đi qua theo một chiều", u: "dùng để chỉnh lưu dòng điện xoay chiều thành một chiều" },
        { c: "Cảm biến tiệm cận", i: "phát hiện vật thể ở gần mà không cần tiếp xúc vật lý", u: "ứng dụng trong dây chuyền sản xuất tự động hóa" }
      ],
      'cn-nong-nghiep': [
        { c: "Đất thịt", a: "thành phần cơ giới trung bình giữa đất cát và đất sét", u: "phù hợp trồng hầu hết các loại rau màu, cây ăn quả" },
        { c: "Biện pháp bón vôi", a: "biện pháp cải tạo đất chua bằng cách tăng độ pH", u: "giúp khử chua, diệt khuẩn và giải độc cho đất" },
        { c: "Phân bón NPK", a: "loại phân hỗn hợp chứa ba nguyên tố dinh dưỡng đạm, lân, kali", u: "cung cấp dinh dưỡng toàn diện cho cây phát triển" },
        { c: "Phương pháp giâm cành", a: "cắt một đoạn cành khỏe cắm vào đất ẩm để ra rễ mới", u: "nhân giống cây giữ nguyên đặc tính tốt của cây mẹ" },
        { c: "Biện pháp đấu tranh sinh học", a: "sử dụng thiên địch tự nhiên để tiêu diệt sâu hại", u: "hạn chế dùng hóa chất độc hại, bảo vệ môi trường" },
        { c: "Rừng phòng hộ", a: "rừng được trồng nhằm chắn gió, cát bay, hạn chế lũ lụt", u: "bảo vệ nguồn nước và đất đai vùng hạ lưu" },
        { c: "Nuôi tôm nước lợ", a: "ngành nuôi trồng thủy sản phát triển mạnh ở đồng bằng sông Cửu Long", u: "mang lại giá trị xuất khẩu kinh tế rất cao" },
        { c: "Kỹ thuật tưới nhỏ giọt", a: "tới nước trực tiếp vào sát gốc cây một cách từ từ", u: "tiết kiệm nước tối đa và giữ đất ẩm đều" },
        { c: "Vật nuôi bản địa", a: "các giống gà ri, lợn ỉ mang nguồn gen quý chịu khổ tốt", u: "phục vụ chăn nuôi hữu cơ truyền thống" },
        { c: "Nhà màng công nghệ cao", a: "môi trường trồng cây khép kín có lưới chắn côn trùng", u: "sản xuất rau củ quả sạch quanh năm không sợ thời tiết" }
      ]
    };

    const list = dataMap[subjectId] || dataMap['tin-hoc'];
    const item = list[Math.floor(index / 5) % list.length];
    const qType = index % 5;

    if (subjectId === 'lich-su') {
      if (qType === 0) {
        question = `Sự kiện "${item.c}" diễn ra gắn liền với dấu mốc nào?`;
        options = [`A. Khoảng thời gian: ${item.p}`, `B. Đầu thế kỷ XVII`, `C. Những năm phong kiến xa xưa`, `D. Cuối thế kỷ XX`];
        correct = 0;
        explanation = `Sự kiện "${item.c}" diễn ra nổi bật vào ${item.p}.`;
      } else if (qType === 1) {
        question = `Nhân vật hoặc lực lượng lãnh đạo gắn bó mật thiết với "${item.c}" là?`;
        options = [`A. ${item.h}`, `B. Triều đình phong kiến nhà Thanh`, `C. Các thế lực phong kiến bên ngoài`, `D. Người phương Tây`];
        correct = 0;
        explanation = `"${item.c}" gắn liền với hoạt động lãnh đạo/đóng góp của ${item.h}.`;
      } else if (qType === 2) {
        question = `Ý nghĩa lịch sử quan trọng nhất của sự kiện "${item.c}" đối với đất nước là gì?`;
        options = [`A. Giúp ${item.u}`, `B. Thiết lập một vương triều quân chủ mới`, `C. Chấm dứt hoàn toàn nền nông nghiệp tự cung tự cấp`, `D. Tạo điều kiện giao thương thương mại tự do quốc tế`];
        correct = 0;
        explanation = `Sự kiện "${item.c}" mang ý nghĩa to lớn giúp ${item.u}.`;
      } else if (qType === 3) {
        question = `Sự kiện lịch sử "${item.c}" có tác động trực tiếp như thế nào đến sự phát triển của cách mạng nước nhà?`;
        options = [
          `A. Là mốc son rực rỡ, khẳng định tinh thần yêu nước quyết chiến quyết thắng`,
          `B. Làm suy yếu tiềm lực quân sự và kinh tế của lực lượng ta`,
          `C. Khiến đất nước bị chia cắt lâu dài thêm nhiều thập kỷ`,
          `D. Đưa đất nước bước vào kỷ nguyên phong kiến quân chủ tập quyền`
        ];
        correct = 0;
        explanation = `"${item.c}" đã cổ vũ mãnh liệt phong trào cách mạng, viết nên trang sử vẻ vang hào hùng của dân tộc.`;
      } else {
        question = `Khi tìm hiểu về sự kiện lịch sử tự hào "${item.c}", chúng ta rút ra bài học kinh nghiệm gì sâu sắc?`;
        options = [
          `A. Luôn phát huy khối đại đoàn kết toàn dân tộc và tinh thần tự lực tự cường`,
          `B. Phụ thuộc hoàn toàn vào sự giúp đỡ, viện trợ của quốc tế`,
          `C. Chỉ chú trọng phát triển lực lượng ở thành thị, bỏ qua nông thôn`,
          `D. Tránh né đấu tranh vũ trang dưới mọi hình thức`
        ];
        correct = 0;
        explanation = `Bài học lớn lao từ "${item.c}" là bài học về lòng dân, khối đại đoàn kết dân tộc và sự chỉ đạo tài tình của Đảng, Nhà nước.`;
      }
    } else if (subjectId === 'vat-ly') {
      if (qType === 0) {
        question = `Bản chất vật lý hoặc đặc điểm cốt lõi của khái niệm "${item.c}" là gì?`;
        options = [`A. ${item.d}`, `B. Là chuyển động rơi tự do hoàn toàn trong chân không`, `C. Là sự chuyển đổi tất cả thế năng thành nội năng`, `D. Là hiện tượng khúc xạ qua thấu kính phân kỳ`];
        correct = 0;
        explanation = `Trong Vật lý, "${item.c}" được định nghĩa chính xác là: ${item.d}.`;
      } else if (qType === 1) {
        question = `Công thức toán học đặc trưng mô tả mối quan hệ trong "${item.c}" là?`;
        options = [`A. ${item.f}`, `B. E = mc² + k`, `C. P = UIcosφ`, `D. F = qE`];
        correct = 0;
        explanation = `Công thức liên kết đặc trưng của "${item.c}" là: ${item.f}.`;
      } else if (qType === 2) {
        question = `Trong các ứng dụng thực tế đời sống và kỹ thuật, "${item.c}" đóng vai trò như thế nào?`;
        options = [
          `A. Giúp giải thích, chế tạo và tối ưu hóa các thiết bị kỹ thuật liên quan`,
          `B. Chỉ dùng để biểu diễn các bài tập lý thuyết đơn thuần`,
          `C. Dùng để triệt tiêu hoàn toàn mọi nguồn điện năng lượng`,
          `D. Chế tạo các động cơ vĩnh cửu thế hệ mới`
        ];
        correct = 0;
        explanation = `Hiểu rõ "${item.c}" giúp con người ứng dụng chế tạo nhiều thiết bị phục vụ đắc lực cho đời sống và sản xuất.`;
      } else if (qType === 3) {
        question = `Khi chúng ta tiến hành thay đổi các đại lượng vật lý đặc trưng của "${item.c}" thì?`;
        options = [
          `A. Các thông số liên quan khác sẽ thay đổi theo quy luật hệ thức vật lý xác định`,
          `B. Tất cả đại lượng vật lý khác đều giữ nguyên không đổi`,
          `C. Hệ thống lập tức rơi vào trạng thái dừng hoạt động vĩnh viễn`,
          `D. Trọng lượng của vật thể sẽ tự động tăng lên gấp đôi`
        ];
        correct = 0;
        explanation = `Sự biến đổi của các thông số trong "${item.c}" tuân thủ chặt chẽ các định luật bảo toàn và hệ thức toán lý.`;
      } else {
        question = `Đơn vị đo lường hoặc tính chất vật lý nổi bật gắn liền với đại lượng "${item.u}" của "${item.c}" là?`;
        options = [
          `A. Đơn vị đo chuẩn xác hoặc tính chất đặc trưng được quy định rõ trong SGK và hệ SI`,
          `B. Không có đơn vị đo cụ thể nào`,
          `C. Đo bằng đơn vị Watt (W) hoặc Ampe (A) cho mọi trường hợp`,
          `D. Là một hằng số vũ trụ không bao giờ thay đổi`
        ];
        correct = 0;
        explanation = `Đại lượng "${item.u}" trong "${item.c}" có đơn vị và ý nghĩa vật lý đặc trưng riêng biệt vô cùng rõ ràng.`;
      }
    } else if (subjectId === 'hoa-hoc') {
      if (qType === 0) {
        question = `Công thức hóa học / công thức cấu tạo tiêu biểu biểu diễn cho "${item.c}" là?`;
        options = [`A. ${item.f}`, `B. H₂SO₄`, `C. NaCl`, `D. KHCO₃`];
        correct = 0;
        explanation = `Công thức hóa học chính xác của "${item.c}" là ${item.f}.`;
      } else if (qType === 1) {
        question = `Tính chất hóa học hoặc phản ứng đặc trưng nổi bật nhất của "${item.c}" là gì?`;
        options = [`A. ${item.p}`, `B. Tác dụng với khí oxi tạo ra khí nitơ`, `C. Có tính trơ hóa học tuyệt đối ở nhiệt độ cao`, `D. Bị phân hủy hoàn toàn khi gặp ánh sáng nhẹ`];
        correct = 0;
        explanation = `Một trong những phản ứng/tính chất đặc trưng của "${item.c}" chính là ${item.p}.`;
      } else if (qType === 2) {
        question = `Ứng dụng thực tiễn nổi bật nhất của hợp chất "${item.c}" trong đời sống xã hội là gì?`;
        options = [`A. Dùng làm ${item.u}`, `B. Làm chất đốt thay thế hoàn toàn cho xăng dầu`, `C. Sản xuất kim cương nhân tạo giá rẻ`, `D. Làm sạch các lò phản ứng hạt nhân lớn`];
        correct = 0;
        explanation = `Trong đời sống sản xuất, "${item.c}" được ứng dụng rất rộng rãi, đặc biệt là dùng làm ${item.u}.`;
      } else if (qType === 3) {
        question = `Khi tiến hành các thực nghiệm hóa học liên quan đến "${item.c}", hiện tượng quan sát được thường là?`;
        options = [
          `A. Xảy ra sự biến đổi trạng thái hoặc phản ứng tạo sản phẩm đặc trưng`,
          `B. Không có bất kỳ hiện tượng hay biến đổi nào xảy ra`,
          `C. Dung dịch lập tức chuyển sang màu đen huyền bí`,
          `D. Tỏa ra nhiệt lượng làm nổ tung dụng cụ thí nghiệm`
        ];
        correct = 0;
        explanation = `Các thực nghiệm với "${item.c}" đều có hiện tượng rõ ràng, tuân thủ định luật bảo toàn khối lượng và bản chất các liên kết hóa học.`;
      } else {
        question = `Trong chương trình Hóa học phổ thông, hợp chất "${item.c}" được xếp vào nhóm chất nào?`;
        options = [
          `A. Nhóm chất có hoạt tính và ứng dụng thực tiễn quan trọng`,
          `B. Nhóm khí hiếm không có liên kết hóa học`,
          `C. Nhóm siêu kim loại chuyển tiếp cực kỳ độc hại`,
          `D. Nhóm chất hữu cơ không chứa nguyên tố cacbon`
        ];
        correct = 0;
        explanation = `"${item.c}" có vị trí quan trọng trong sơ đồ phân loại các chất hóa học vô cơ hoặc hữu cơ.`;
      }
    } else if (subjectId === 'sinh-hoc') {
      if (qType === 0) {
        question = `Khái niệm hoặc cơ chế hoạt động cốt lõi của "${item.c}" trong Sinh học là?`;
        options = [`A. ${item.s}`, `B. Là hiện tượng tự thụ phấn bắt buộc qua trăm thế hệ`, `C. Là sự đào thải tất cả các gen lặn có lợi`, `D. Là sự di cư của toàn bộ quần thể động vật`];
        correct = 0;
        explanation = `Cơ sở lý thuyết Sinh học chỉ ra "${item.c}" ${item.s}.`;
      } else if (qType === 1) {
        question = `Ý nghĩa sinh học quan trọng nhất mà "${item.c}" mang lại cho sinh giới là gì?`;
        options = [`A. Giúp ${item.u}`, `B. Ngăn chặn hoàn toàn sự phát triển của đột biến`, `C. Giúp sinh vật không cần trao đổi chất với môi trường`, `D. Đưa quần thể về trạng thái thoái hóa giống`];
        correct = 0;
        explanation = `Cơ chế "${item.c}" đóng vai trò sinh học cực kỳ quan trọng, giúp ${item.u}.`;
      } else if (qType === 2) {
        question = `Đặc điểm biểu hiện tiêu biểu của hiện tượng "${item.c}" trong đời sống sinh vật là gì?`;
        options = [
          `A. Thể hiện sự thích nghi, di truyền và biến dị của sinh vật qua các thế hệ`,
          `B. Chỉ xuất hiện ở các sinh vật đơn bào cổ xưa`,
          `C. Luôn làm giảm khả năng sống sót của tất cả các cá thể`,
          `D. Diễn ra tức thời chỉ trong vòng vài giây ngắn ngủi`
        ];
        correct = 0;
        explanation = `"${item.c}" biểu hiện sống động thông qua các quá trình sinh lý, di truyền và tương tác sinh thái thường nhật.`;
      } else if (qType === 3) {
        question = `Trong nghiên cứu di truyền và sinh thái học, việc nắm rõ quy luật của "${item.c}" giúp con người?`;
        options = [
          `A. Giải thích cơ sở khoa học của các hiện tượng di truyền và tương tác sinh giới`,
          `B. Thay đổi hoàn toàn mã di truyền của loài người chỉ trong một bước`,
          `C. Tạo ra các loài sinh vật mới hoàn toàn từ cát bụi`,
          `D. Ngăn chặn sự nóng lên toàn cầu một cách tuyệt đối`
        ];
        correct = 0;
        explanation = `Hiểu sâu sắc về "${item.c}" cung cấp luận cứ khoa học vững chắc phục vụ chọn giống và bảo vệ môi trường sinh quyển.`;
      } else {
        question = `Biện pháp nào dưới đây áp dụng trực tiếp hiểu biết về "${item.c}" vào thực tiễn sản xuất?`;
        options = [
          `A. Tạo giống năng suất cao, bảo tồn đa dạng sinh học và ứng dụng y học`,
          `B. Chặt phá rừng phòng hộ làm nương rẫy canh tác`,
          `C. Lạm dụng hóa chất diệt cỏ cực mạnh trên diện rộng`,
          `D. Nuôi thả tự do các loài ngoại lai gây hại`
        ];
        correct = 0;
        explanation = `Ứng dụng đúng đắn "${item.c}" giúp phát triển nông nghiệp xanh bền vững và bảo vệ sức khỏe con người.`;
      }
    } else if (subjectId === 'dia-ly') {
      if (qType === 0) {
        question = `Đặc điểm tự nhiên hoặc số liệu địa lý nổi bật của "${item.c}" nước ta là?`;
        options = [`A. Đặc trưng: ${item.g}`, `B. Hoàn toàn là đồi núi cao trên 3000m bao phủ`, `C. Có khí hậu ôn đới lục địa lạnh giá quanh năm`, `D. Không có bất kỳ dòng sông hay nguồn nước ngọt nào`];
        correct = 0;
        explanation = `Về mặt địa lý tự nhiên, nước ta có đặc điểm: "${item.g}".`;
      } else if (qType === 1) {
        question = `Ý nghĩa kinh tế - xã hội hoặc định hướng phát triển của "${item.c}" đối với nước ta là gì?`;
        options = [`A. Giúp ${item.u}`, `B. Biến nước ta thành quốc gia công nghiệp nặng khép kín`, `C. Loại bỏ hoàn toàn vai trò của các ngành dịch vụ`, `D. Chuyển dịch toàn bộ dân cư ra sinh sống ở vùng hải đảo`];
        correct = 0;
        explanation = `Phát triển bền vững gắn với "${item.c}" mang lại hiệu quả to lớn giúp ${item.u}.`;
      } else if (qType === 2) {
        question = `Sự phân bố địa lý tiêu biểu liên quan đến "${item.c}" tập trung nhiều nhất ở khu vực nào của nước ta?`;
        options = [
          `A. Ở những vùng có điều kiện tự nhiên và kinh tế xã hội thuận lợi phù hợp`,
          `B. Duy nhất ở đỉnh núi Phan-xi-păng quanh năm mây mù`,
          `C. Phân bố đều chằn chặn giữa rừng sâu và hải đảo xa xôi`,
          `D. Chỉ xuất hiện tại các khu đô thị cực kỳ đông dân cư`
        ];
        correct = 0;
        explanation = `Sự phân bố địa lý của các đối tượng tự nhiên và kinh tế xã hội luôn gắn liền với quy luật địa đới và phi địa đới sâu sắc.`;
      } else if (qType === 3) {
        question = `Khó khăn lớn nhất hoặc thiên tai thường gặp khi khai thác, phát triển kinh tế gắn với "${item.c}" là gì?`;
        options = [
          `A. Biến đổi khí hậu, thiên tai và vấn đề khai thác quá mức làm suy thoái tài nguyên`,
          `B. Sự biến mất hoàn toàn của lực lượng lao động địa phương`,
          `C. Việc thiếu thốn hoàn toàn các phương tiện liên lạc vệ tinh`,
          `D. Khí hậu trở nên quá lạnh giá xuất hiện tuyết rơi quanh năm`
        ];
        correct = 0;
        explanation = `Phát triển kinh tế luôn phải đi đôi với bảo vệ môi trường, phòng chống thiên tai và ứng phó biến đổi khí hậu một cách chủ động.`;
      } else {
        question = `Giải pháp bền vững nhất để bảo vệ và phát huy tối đa thế mạnh của "${item.c}" ở nước ta là?`;
        options = [
          `A. Kết hợp hài hòa giữa phát triển kinh tế đi đôi với bảo vệ môi trường sinh thái`,
          `B. Ngăn cấm tuyệt đối mọi hoạt động khai thác du lịch và kinh tế`,
          `C. Khai thác triệt để, tối đa tài nguyên trong thời gian ngắn nhất`,
          `D. Nhập khẩu toàn bộ nguồn nguyên liệu thô từ nước ngoài`
        ];
        correct = 0;
        explanation = `Tư duy địa lý hiện đại luôn định hướng phát triển bền vững, giữ gìn tài nguyên thiên nhiên cho các thế hệ tương lai.`;
      }
    } else if (subjectId === 'gdktepl') {
      if (qType === 0) {
        question = `Bản chất hoặc khái niệm kinh tế - pháp luật của thuật ngữ "${item.c}" được hiểu là?`;
        options = [`A. Là ${item.p}`, `B. Là quy định chỉ áp dụng cho người nước ngoài tại Việt Nam`, `C. Là học thuyết kinh tế cổ đại không còn giá trị`, `D. Là mệnh lệnh tuyệt đối từ cá nhân một người đứng đầu`];
        correct = 0;
        explanation = `Theo tài liệu GD Kinh tế & Pháp luật, khái niệm "${item.c}" chỉ: ${item.p}.`;
      } else if (qType === 1) {
        question = `Ý nghĩa thực tiễn hoặc mục tiêu cốt lõi của việc thực hiện "${item.c}" trong đời sống xã hội là gì?`;
        options = [`A. Định hướng giúp ${item.u}`, `B. Nhằm tối đa hóa tiền phạt cho cơ quan quản lý`, `C. Hạn chế quyền tự do kinh doanh chính đáng của công dân`, `D. Tạo ra sự phân biệt đối xử lớn giữa các giai tầng xã hội`];
        correct = 0;
        explanation = `Xây dựng nhà nước pháp quyền và nền kinh tế thị trường định hướng XHCN nhằm ${item.u}.`;
      } else if (qType === 2) {
        question = `Trong thực tiễn, hành động nào dưới đây thể hiện đúng đắn và nghiêm túc tinh thần của "${item.c}"?`;
        options = [
          `A. Tôn trọng hiến pháp, pháp luật và chủ động thực hiện nghĩa vụ công dân`,
          `B. Tìm mọi cách lách luật để tối đa hóa lợi ích ích kỷ cá nhân`,
          `C. Thờ ơ, vô cảm trước các hành vi vi phạm trật tự công cộng`,
          `D. Tự ý ban hành các quy định trái với thẩm quyền của nhà nước`
        ];
        correct = 0;
        explanation = `Thượng tôn pháp luật và tuân thủ các quy luật kinh tế khách quan là biểu hiện của công dân văn minh, trách nhiệm.`;
      } else if (qType === 3) {
        question = `Cá nhân hoặc tổ chức có hành vi vi phạm nghiêm trọng các quy định gắn liền với "${item.c}" sẽ phải?`;
        options = [
          `A. Chịu các hình thức chế tài và trách nhiệm pháp lý tương ứng theo pháp luật quy định`,
          `B. Được miễn trừ hoàn toàn mọi nghĩa vụ pháp lý xã hội`,
          `C. Tự động chuyển đổi quốc tịch sang quốc gia khác`,
          `D. Chỉ bị phê bình nhẹ nhàng trên bảng tin phường xã`
        ];
        correct = 0;
        explanation = `Mọi hành vi vi phạm pháp luật đều bị xử lý công minh, bình đẳng trước pháp luật để bảo vệ trật tự kỷ cương xã hội.`;
      } else {
        question = `Là học sinh trung học phổ thông, chúng ta cần ứng xử như thế nào đối với các kiến thức và quy định về "${item.c}"?`;
        options = [
          `A. Tích cực học tập, chủ động tuân thủ nghiêm túc và tuyên truyền nâng cao ý thức cộng đồng`,
          `B. Coi đó là môn học phụ, chỉ học để đối phó thi cử qua loa`,
          `C. Tự ý phán xét, bài xích các chính sách quản lý kinh tế của nhà nước`,
          `D. Chỉ chấp hành khi có sự giám sát, nhắc nhở trực tiếp từ giáo viên`
        ];
        correct = 0;
        explanation = `Rèn luyện đạo đức, nâng cao hiểu biết kinh tế pháp luật giúp học sinh tự tin vững bước trở thành những công dân hữu ích.`;
      }
    } else if (subjectId === 'tin-hoc') {
      if (qType === 0) {
        question = `Trong khoa học máy tính và công nghệ thông tin, bản chất của "${item.c}" là gì?`;
        options = [`A. ${item.t}`, `B. Là một loại virus máy tính thế hệ mới nhất`, `C. Là phần cứng độc quyền chỉ có trên điện thoại di động`, `D. Là mạng internet chỉ hoạt động ngoại tuyến`];
        correct = 0;
        explanation = `Khái niệm chuẩn xác về "${item.c}" là: ${item.t}.`;
      } else if (qType === 1) {
        question = `Hệ quả kỹ thuật hoặc tính năng nổi bật gắn liền trực tiếp với "${item.c}" là?`;
        options = [`A. Đặc điểm: ${item.u}`, `B. Làm cho toàn bộ máy tính bị quá nhiệt tức thì`, `C. Tự động xóa sạch mọi tập tin hệ thống của người dùng`, `D. Chuyển đổi mọi giao diện hiển thị sang dạng đen trắng`];
        correct = 0;
        explanation = `Đặc trưng nổi bật của "${item.c}" là ${item.u}.`;
      } else if (qType === 2) {
        question = `Ví dụ thực tiễn sinh động nhất về ứng dụng công nghệ "${item.c}" trong thời đại số ngày nay là?`;
        options = [
          `A. Tối ưu hóa hiệu suất xử lý dữ liệu và nâng cao trải nghiệm người dùng trong học tập, công việc`,
          `B. Thay thế hoàn toàn mọi hoạt động lao động chân tay của con người`,
          `C. Tạo ra một hệ thống máy tính không bao giờ cần cắm nguồn điện`,
          `D. Dùng để dự đoán chính xác kết quả xổ số kiến thiết`
        ];
        correct = 0;
        explanation = `Công nghệ "${item.c}" giải quyết các bài toán lưu trữ, truyền tải, xử lý thông tin thông minh và bảo mật dữ liệu hiệu quả.`;
      } else if (qType === 3) {
        question = `Để đảm bảo an toàn tuyệt đối khi tương tác, làm việc với hệ thống có liên quan đến "${item.c}", chúng ta nên?`;
        options = [
          `A. Áp dụng các quy tắc bảo mật mạnh, mật khẩu phức tạp và sử dụng phần mềm chính hãng bản quyền`,
          `B. Chia sẻ công khai mọi mật khẩu và tài khoản lên mạng xã hội`,
          `C. Tắt hoàn toàn mọi chương trình diệt virus và tường lửa hệ thống`,
          `D. Tải xuống các phần mềm bẻ khóa không rõ nguồn gốc từ internet`
        ];
        correct = 0;
        explanation = `An toàn thông tin là ưu tiên hàng đầu khi sử dụng tài nguyên công nghệ thông tin trong môi trường kết nối toàn cầu.`;
      } else {
        question = `Xu hướng công nghệ số hiện đại phát triển gắn liền với giải pháp "${item.c}" đóng góp gì cho cuộc cách mạng 4.0?`;
        options = [
          `A. Thúc đẩy tiến trình chuyển đổi số quốc gia, xây dựng xã hội thông minh và kinh tế số vững mạnh`,
          `B. Buộc con người phải hạn chế sử dụng thiết bị điện tử tối đa`,
          `C. Đưa mọi hoạt động kinh tế quay lại thời kỳ trao đổi hiện vật thủ công`,
          `D. Triệt tiêu hoàn toàn sự cần thiết của lập trình viên và kỹ sư phần mềm`
        ];
        correct = 0;
        explanation = `Sự giao thoa của "${item.c}" và cách mạng công nghiệp 4.0 mở ra kỷ nguyên mới đầy hứa hẹn cho sự phát triển của nhân loại.`;
      }
    } else if (subjectId === 'cn-cong-nghiep') {
      if (qType === 0) {
        question = `Trong vẽ kỹ thuật hoặc cơ khí chế tạo công nghiệp, "${item.c}" được định nghĩa là?`;
        options = [`A. ${item.i}`, `B. Là một loại kim loại lỏng cực kỳ quý hiếm`, `C. Là sơ đồ mạch điện không có điện trở tiêu thụ`, `D. Là phương pháp đo lường kích thước bằng mắt thường`];
        correct = 0;
        explanation = `Đặc chuẩn kỹ thuật quy định rõ về "${item.c}": ${item.i}.`;
      } else if (qType === 1) {
        question = `Chức năng cốt lõi hoặc công dụng thực tế quan trọng nhất của "${item.c}" là gì?`;
        options = [`A. Giúp làm: ${item.u}`, `B. Làm mát tức thì toàn bộ phân xưởng sản xuất`, `C. Thay thế hoàn toàn cho mọi công cụ đo lường kích thước`, `D. Tạo ra năng lượng điện vô hạn từ chân không`];
        correct = 0;
        explanation = `Trong thực tế cơ khí và kỹ thuật, "${item.c}" được ứng dụng đắc lực nhằm ${item.u}.`;
      } else if (qType === 2) {
        question = `Khi vận hành máy móc hoặc thao tác lắp ráp cơ khí liên quan đến "${item.c}", nguyên tắc an toàn lao động là?`;
        options = [
          `A. Tuân thủ nghiêm ngặt quy trình kỹ thuật, mặc trang phục bảo hộ và tắt máy khi cần bảo dưỡng`,
          `B. Thực hiện thao tác càng nhanh càng tốt mà không cần đọc hướng dẫn sử dụng`,
          `C. Dùng tay trần chạm trực tiếp vào các bộ phận chuyển động quay tròn`,
          `D. Để dụng cụ bừa bãi trên lối đi của phân xưởng`
        ];
        correct = 0;
        explanation = `An toàn lao động là sinh mệnh của công nhân và kỹ sư, đòi hỏi việc nghiêm chỉnh chấp hành quy trình kỹ thuật của "${item.c}".`;
      } else if (qType === 3) {
        question = `Nguyên lý hoạt động cơ bản của hệ thống cơ cấu hoặc tiêu chuẩn của "${item.c}" dựa trên nền tảng nào?`;
        options = [
          `A. Tương tác cơ học, vật lý hoặc điện tử có tính chính xác cao và định lượng rõ ràng`,
          `B. Sự biến đổi hóa học ngẫu nhiên không thể kiểm soát được`,
          `C. Các định luật bảo toàn năng lượng bị phủ nhận hoàn toàn`,
          `D. Sự may rủi của quá trình lắp ráp thủ công`
        ];
        correct = 0;
        explanation = `Mọi thiết kế công nghiệp gắn với "${item.c}" đều phải tuân thủ nghiêm ngặt các nguyên lý vật lý, cơ học khách quan.`;
      } else {
        question = `Biện pháp nào dưới đây giúp nâng cao độ bền, độ tin cậy và hiệu suất vận hành của hệ thống gắn liền với "${item.c}"?`;
        options = [
          `A. Định kỳ bảo dưỡng, bôi trơn dầu mỡ đúng loại và vận hành đúng dải công suất thiết kế`,
          `B. Chạy quá tải liên tục 24/7 để tối đa hóa sản lượng bất chấp hao mòn`,
          `C. Để thiết bị ngoài trời mưa nắng không che chắn bảo vệ`,
          `D. Không bao giờ lau chùi bụi bẩn bám trên động cơ`
        ];
        correct = 0;
        explanation = `Bảo dưỡng định kỳ đúng quy chuẩn kỹ thuật là chìa khóa vàng giúp "${item.c}" hoạt động bền bỉ, an toàn.`;
      }
    } else {
      if (qType === 0) {
        question = `Trong canh tác, bón phân hoặc trồng trọt nông nghiệp, thuật ngữ "${item.c}" chỉ khái niệm nào?`;
        options = [`A. ${item.a}`, `B. Là loại thuốc bảo vệ thực vật hóa học cực độc bị cấm`, `C. Là loài sâu bọ chuyên phá hoại rễ lúa nước`, `D. Là phương pháp chăn nuôi thả rông hoàn toàn hoang dã`];
        correct = 0;
        explanation = `Theo kỹ thuật nông nghiệp hiện đại, "${item.c}" biểu thị: ${item.a}.`;
      } else if (qType === 1) {
        question = `Mục đích chính của việc áp dụng quy trình bón phân hoặc chăm sóc kỹ thuật "${item.c}" là gì?`;
        options = [`A. Nhằm mục đích: ${item.u}`, `B. Làm đẹp cho cảnh quan thiên nhiên nông thôn`, `C. Thay thế hoàn toàn vai trò của ánh sáng mặt trời`, `D. Diệt trừ tất cả các loài côn trùng bao gồm cả thiên địch`];
        correct = 0;
        explanation = `Áp dụng đúng kỹ thuật "${item.c}" giúp ${item.u}.`;
      } else if (qType === 2) {
        question = `Lợi ích to lớn nhất của việc phát triển nền nông nghiệp bền vững gắn bó với giải pháp "${item.c}" là?`;
        options = [
          `A. Tăng năng suất vượt trội, đảm bảo nông sản sạch an toàn và gìn giữ môi trường sinh thái`,
          `B. Giảm bớt hoàn toàn diện tích đất trồng trọt cần thiết`,
          `C. Giúp cây trồng lớn nhanh như thổi chỉ sau một đêm`,
          `D. Không cần tưới nước cho cây trong suốt cả năm`
        ];
        correct = 0;
        explanation = `Nông nghiệp công nghệ cao kết hợp bảo vệ môi trường gắn với "${item.c}" là xu thế tất yếu của thời đại mới.`;
      } else if (qType === 3) {
        question = `Thách thức hoặc khó khăn lớn nhất thường gặp đối với quy trình sản xuất gắn liền với "${item.c}" là gì?`;
        options = [
          `A. Yếu tố thời tiết thất thường, sâu bệnh hại bùng phát và yêu cầu kỹ thuật chăm sóc tỉ mỉ`,
          `B. Việc thiếu thốn hoàn toàn các nguồn phân bón hữu cơ truyền thống`,
          `C. Gặp phải sự phản đối mạnh mẽ từ phía người tiêu dùng`,
          `D. Chi phí mua hạt giống quá cao không thể tiếp cận được`
        ];
        correct = 0;
        explanation = `Người nông dân cần linh hoạt áp dụng tiến bộ kỹ thuật cùng kinh nghiệm dân gian để chế ngự khó khăn khi vận hành "${item.c}".`;
      } else {
        question = `Xuương hướng nông nghiệp thông minh, tuần hoàn ngày nay định hướng ứng dụng "${item.c}" hướng tới mục tiêu nào?`;
        options = [
          `A. Tối ưu hóa tài nguyên nước, đất, giảm phát thải khí nhà kính và tăng giá trị xuất khẩu`,
          `B. Tăng cường sử dụng tối đa các loại thuốc trừ sâu hóa học đậm đặc`,
          `C. Quay lại phương thức canh tác chọc lỗ bỏ hạt thô sơ thời nguyên thủy`,
          `D. Thay thế toàn bộ cây lương thực bằng các giống cây hoa trang trí`
        ];
        correct = 0;
        explanation = `Phát triển bền vững, thân thiện với môi trường là tôn chỉ cốt lõi khi con người ứng dụng công nghệ cao "${item.c}" vào nông nghiệp.`;
      }
    }
  }

  return { question, options, correct, explanation };
}
export function NguoiDepOmYeuTheme(props: ThemeProps) {
  const {
    story,
    actualStoryId,
    chapters,
    comments,
    activeTab,
    setActiveTab,
    chapterPage,
    setChapterPage,
    chapterSortDesc,
    setChapterSortDesc,
    CHAPTERS_PER_PAGE,
    showGiftModal,
    setShowGiftModal,
    giftAmount,
    setGiftAmount,
    giftMessage,
    setGiftMessage,
    handleGiftSubmit,
    commentText,
    setCommentText,
    submittingComment,
    handleSendComment,
    replyingToId,
    setReplyingToId,
    replyText,
    setReplyText,
    submittingReply,
    handleSendReply,
    profilesCache,
    isLoggedIn,
    savedStories,
    toggleSaveStory,
    handleSaveToggle,
    choco,
    uid,
    displayName,
    avatarUrl,
    unlockedPassChapters,
    unlockedEarlyAccessChapters,
    navigate,
  } = props;

  // 1. Easter Egg States for Sickly Beauty Theme (Chỉ giữ lại các chỉ số sức khoẻ cơ bản)
  const [heartRate, setHeartRate] = useState(72);
  const [bodyTemp, setBodyTemp] = useState(35.8);
  const [isDescExpanded, setIsDescExpanded] = useState(false);
  const [isCompactMode, setIsCompactMode] = useState(true);

  useEffect(() => {
    // Biến động nhịp tim ngẫu nhiên nhẹ nhàng để tạo hiệu ứng sinh động
    const interval = setInterval(() => {
      setHeartRate(prev => {
        const delta = Math.random() > 0.5 ? 1 : -1;
        const next = prev + delta;
        return next < 60 ? 60 : next > 82 ? 82 : next;
      });
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  // 2. Lịch trình ôn thi lớp 12 thực tế ngoài đời vô cùng hiệu quả
  const [schedule, setSchedule] = useState([
    { id: 1, time: "05:30 - 06:30", text: "Thức dậy sớm, ôn tập lý thuyết, học từ vựng (Anh/Văn) khi trí não minh mẫn nhất.", completed: false },
    { id: 2, time: "08:00 - 11:30", text: "Tập trung giải đề thi thử các môn tự nhiên (Toán/Lý/Hóa) nâng cao tư duy phản xạ.", completed: false },
    { id: 3, time: "14:00 - 17:00", text: "Hệ thống hóa kiến thức bằng sơ đồ tư duy, rèn luyện kỹ năng viết văn nghị luận xã hội.", completed: false },
    { id: 4, time: "19:30 - 22:00", text: "Luyện giải đề chính thức các năm trước dưới áp lực thời gian thật để phân bổ thời gian hợp lý.", completed: false },
    { id: 5, time: "22:00 - 22:30", text: "Review và ghi chép lại các lỗi sai thường gặp vào sổ tay cá nhân để rút kinh nghiệm sâu sắc.", completed: false },
    { id: 6, time: "22:30 - 23:00", text: "Thư giãn nhẹ nhàng, thả lỏng tinh thần, chuẩn bị đi ngủ sớm trước 23:00 để phục hồi não bộ.", completed: false }
  ]);

  const toggleTask = (id: number) => {
    setSchedule(prev => prev.map(item => {
      if (item.id === id) {
        return { ...item, completed: !item.completed };
      }
      return item;
    }));
  };

  // 3. Câu hỏi ôn thi đại học tương tác thực tế cho độc giả tích điểm
  const [selectedSubject, setSelectedSubject] = useState('toan');
  const [answeredMap, setAnsweredMap] = useState<Record<string, number[]>>(() => {
    const map: Record<string, number[]> = {};
    SUBJECTS.forEach(sub => {
      try {
        const saved = localStorage.getItem(`user_answered_questions_${sub.id}`);
        map[sub.id] = saved ? JSON.parse(saved) : [];
      } catch {
        map[sub.id] = [];
      }
    });
    return map;
  });

  const [currentQuestionIndex, setCurrentQuestionIndex] = useState<number>(0);
  const [selectedAns, setSelectedAns] = useState<number | null>(null);
  const [hasAnswered, setHasAnswered] = useState(false);
  const [examScore, setExamScore] = useState(() => Number(localStorage.getItem('user_exam_score') || '0'));
  const [leaderboard, setLeaderboard] = useState<any[]>([]);

  // Lắng nghe thay đổi answeredMap và selectedSubject để cập nhật câu hỏi chưa làm tiếp theo
  useEffect(() => {
    const answered = answeredMap[selectedSubject] || [];
    let foundIndex = -1;
    for (let i = 0; i < 50; i++) {
      if (!answered.includes(i)) {
        foundIndex = i;
        break;
      }
    }
    setCurrentQuestionIndex(foundIndex);
    setSelectedAns(null);
    setHasAnswered(false);
  }, [selectedSubject, answeredMap]);

  // Đồng bộ điểm lên Firestore
  useEffect(() => {
    if (isLoggedIn && uid) {
      const userRef = doc(db, 'exam_leaderboard', uid);
      setDoc(userRef, {
        uid,
        displayName: displayName || "Học bá ẩn danh",
        avatarUrl: avatarUrl || "",
        score: examScore,
        updatedAt: new Date()
      }, { merge: true }).catch(err => console.error("Error saving score to firestore:", err));
    }
  }, [examScore, isLoggedIn, uid, displayName, avatarUrl]);

  // Lắng nghe bảng xếp hạng thực tế
  useEffect(() => {
    const q = query(collection(db, 'exam_leaderboard'), orderBy('score', 'desc'), limit(10));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const list: any[] = [];
      snapshot.forEach((docSnap) => {
        list.push(docSnap.data());
      });
      
      const mockData = [
        { displayName: "Hạ Thiên (Học Bá)", score: 480, avatarUrl: "" },
        { displayName: "Mộ Dung Tuyết (Hội Trưởng)", score: 450, avatarUrl: "" },
        { displayName: "Lâm Nhất (Thủ Khoa)", score: 420, avatarUrl: "" },
        { displayName: "Diệp Giao (Lớp Trưởng)", score: 390, avatarUrl: "" },
        { displayName: "Chucu đáng yêu", score: 300, avatarUrl: "" }
      ];

      const merged = [...list];
      mockData.forEach(mock => {
        if (!merged.some(m => m.displayName === mock.displayName || m.uid === mock.displayName)) {
          merged.push(mock);
        }
      });

      merged.sort((a, b) => b.score - a.score);
      setLeaderboard(merged.slice(0, 5));
    }, (err) => {
      console.error("Error loading leaderboard:", err);
      const mockData = [
        { displayName: "Hạ Thiên (Học Bá)", score: 480, avatarUrl: "" },
        { displayName: "Mộ Dung Tuyết (Hội Trưởng)", score: 450, avatarUrl: "" },
        { displayName: "Lâm Nhất (Thủ Khoa)", score: 420, avatarUrl: "" },
        { displayName: "Diệp Giao (Lớp Trưởng)", score: 390, avatarUrl: "" },
        { displayName: "Chucu đáng yêu", score: 300, avatarUrl: "" }
      ];
      setLeaderboard(mockData);
    });

    return () => unsubscribe();
  }, []);

  const handleAnswerClick = (index: number) => {
    if (hasAnswered || currentQuestionIndex === -1) return;
    setSelectedAns(index);
    setHasAnswered(true);
    
    const currentQ = generateQuestion(selectedSubject, currentQuestionIndex);
    if (index === currentQ.correct) {
      const newScore = examScore + 10;
      setExamScore(newScore);
      localStorage.setItem('user_exam_score', String(newScore));

      const updatedAnswered = [...(answeredMap[selectedSubject] || []), currentQuestionIndex];
      const newMap = {
        ...answeredMap,
        [selectedSubject]: updatedAnswered
      };
      setAnsweredMap(newMap);
      localStorage.setItem(`user_answered_questions_${selectedSubject}`, JSON.stringify(updatedAnswered));
    }
  };

  const handleNextQuestion = () => {
    setSelectedAns(null);
    setHasAnswered(false);
    const answered = answeredMap[selectedSubject] || [];
    let foundIndex = -1;
    for (let i = 0; i < 50; i++) {
      if (!answered.includes(i)) {
        foundIndex = i;
        break;
      }
    }
    setCurrentQuestionIndex(foundIndex);
  };

  const handleResetSubject = () => {
    const newMap = {
      ...answeredMap,
      [selectedSubject]: []
    };
    setAnsweredMap(newMap);
    localStorage.setItem(`user_answered_questions_${selectedSubject}`, JSON.stringify([]));
    setCurrentQuestionIndex(0);
    setSelectedAns(null);
    setHasAnswered(false);
  };

  // 4. Giả lập thị trường tài chính đơn giản cho sĩ tử tự học
  const [marketPrices, setMarketPrices] = useState([
    { code: "HBA", name: "Chỉ số Học Bá", price: 15.20, change: 3.5, desc: "Đo lường mức độ tiếp thu kiến thức và luyện đề của bạn." },
    { code: "SKH", name: "Chỉ số Sức Khỏe", price: 12.80, change: 1.2, desc: "Đo lường chế độ sinh hoạt và mức độ cân bằng thể chất." },
    { code: "TLY", name: "Tâm Lý Sĩ Tử", price: 10.50, change: -0.5, desc: "Đo lường mức độ vững vàng trước áp lực thi cử lớp 12." }
  ]);

  const updateMarketPrice = () => {
    setMarketPrices(prev => prev.map(stock => {
      const deltaPercent = (Math.random() * 6 - 2.8); // -2.8% to +3.2%
      const newChange = parseFloat((stock.change + deltaPercent / 1.5).toFixed(1));
      const newPrice = parseFloat((stock.price * (1 + deltaPercent / 100)).toFixed(2));
      return {
        ...stock,
        price: newPrice < 1 ? 1.00 : newPrice,
        change: newChange
      };
    }));
  };

  // 5. Gom cụm chương cho danh sách chương cực kỳ nhiều
  const GROUP_SIZE = 50;
  const numGroups = Math.ceil(chapters.length / GROUP_SIZE);
  const [selectedGroup, setSelectedGroup] = useState(0);
  const [searchChapterNum, setSearchChapterNum] = useState('');

  // Sắp xếp chương
  const sortedChapters = [...chapters].sort((a, b) => {
    const orderA = a.order !== undefined ? a.order : 0;
    const orderB = b.order !== undefined ? b.order : 0;
    return chapterSortDesc ? orderB - orderA : orderA - orderB;
  });

  // Lấy danh sách chương hiển thị (hỗ trợ tìm kiếm nhanh & gom cụm)
  const displayedChapters = searchChapterNum.trim()
    ? sortedChapters.filter(chap => chap.title?.toLowerCase().includes(searchChapterNum.trim().toLowerCase()))
    : sortedChapters.slice(selectedGroup * GROUP_SIZE, (selectedGroup + 1) * GROUP_SIZE);

  return (
    <div className="w-full min-h-screen bg-[#0D121D] text-[#ECEFF4] font-lora selection:bg-[#A2B6CD]/30 selection:text-[#ECEFF4] relative overflow-hidden pb-16">
      
      {/* Abstract elegant background design with subtle lines */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-[#233145]/20 via-transparent to-transparent pointer-events-none" />
      <div className="absolute inset-x-0 top-0 h-[1px] bg-gradient-to-r from-transparent via-[#A2B6CD]/20 to-transparent" />
      
      {/* 1. TOP HEADER WITH STATS SUMMARY */}
      <header className="border-b border-[#2D3D54]/40 bg-[#121824]/95 backdrop-blur-md sticky top-0 z-50 text-[#ECEFF4]">
        <div className="max-w-[1400px] mx-auto px-4 py-3 flex flex-wrap items-center justify-between gap-4">
          
          <div className="flex items-center gap-3">
            <button 
              onClick={() => navigate('/')}
              className="p-1.5 rounded-lg border border-[#2D3D54]/50 hover:border-[#A2B6CD] text-[#A2B6CD] hover:text-[#101622] hover:bg-[#A2B6CD] transition-all bg-[#151C28]"
              title="Quay lại Trang chủ"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <div>
              <h1 className="font-alegreya text-lg font-bold text-[#ECEFF4] leading-tight">
                {story?.title || "Người Đẹp Ốm Yếu Không Giãy Giụa Nữa"}
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-4 text-xs">
            {/* Save story button */}
            <button
              onClick={handleSaveToggle}
              className={`px-3 py-1.5 rounded-md flex items-center gap-1.5 transition-all font-medium text-xs border ${
                savedStories.includes(story.id)
                  ? 'bg-[#A2B6CD] border-[#A2B6CD] text-[#101622] font-bold'
                  : 'border-[#2D3D54]/40 text-[#A2B6CD] hover:bg-[#A2B6CD] hover:text-[#101622]'
              }`}
            >
              <Bookmark className="w-3.5 h-3.5 fill-current" />
              <span>{savedStories.includes(story.id) ? 'Đang lưu trữ' : 'Lưu tủ sách'}</span>
            </button>

            {story.externalUrl && (
              <a
                href={story.externalUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="px-3 py-1.5 rounded-md flex items-center gap-1.5 bg-[#233145] text-[#ECEFF4] border border-[#233145] hover:bg-[#A2B6CD] hover:text-[#101622] transition-all font-medium text-xs"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span className="hidden md:inline">Đọc bản gốc</span>
              </a>
            )}
          </div>
        </div>
      </header>

      {/* 2. THREE-COLUMN CORE DESK LAYOUT */}
      <main className="max-w-[1400px] mx-auto px-4 mt-6 md:mt-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* ================= COLUMN 1: SICKLY BEAUTY HEALTH CABINET & REVENGE SYSTEM (LG: 3/12) ================= */}
          <section className="lg:col-span-3 flex flex-col gap-6 lg:sticky lg:top-[74px]">
            
            {/* NOVEL COVER CARD */}
            {story?.coverUrl && (
              <div className="border border-[#2D3D54]/30 bg-[#151C28] p-4 rounded-xl relative shadow-lg flex flex-col items-center">
                <div className="absolute top-2 right-2 border border-[#2D3D54]/40 text-[#A2B6CD] text-[8px] font-lora px-1.5 py-0.5 uppercase tracking-widest bg-black/40">
                  MẪU BÌA CHÍNH THỨC
                </div>
                <div className="w-full aspect-[2/3] overflow-hidden rounded-lg border border-[#2D3D54]/20 shadow-inner relative group">
                  <img 
                    src={story.coverUrl} 
                    alt={story.title} 
                    className="w-full h-full object-cover rounded-lg shadow-[2px_2px_0_0_#233145] group-hover:shadow-[4px_4px_0_0_#A2B6CD] transition-all duration-300" 
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#151C28] via-transparent to-transparent opacity-60" />
                </div>
                  {/* No admission header */}
              </div>
            )}
            
            {/* INDICATORS CARD */}
            <div className="border border-[#2D3D54]/30 bg-[#151C28] p-4 rounded-xl relative shadow-lg text-[#ECEFF4]">
              <div className="absolute top-1 right-2 p-1 text-[#A2B6CD]/20 font-alegreya text-3xl font-bold select-none pointer-events-none">
                35.8°C
              </div>
              <h2 className="text-xs font-lora tracking-widest text-[#A2B6CD] uppercase border-b border-[#2D3D54]/40 pb-2 mb-4 flex items-center gap-2 font-bold">
                <Heart className="w-3.5 h-3.5 text-[#A2B6CD] animate-pulse" /> CHỈ SỐ SỨC KHỎE
              </h2>
              
              <div className="flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-[#ECEFF4]/70 font-lora">Nhịp tim (Heart Rate):</span>
                  <span className="text-sm font-lora font-bold text-[#ECEFF4] flex items-center gap-1">
                    <Activity className="w-3.5 h-3.5 text-[#A2B6CD] animate-pulse" />
                    {heartRate} BPM
                  </span>
                </div>
                <div className="w-full bg-[#101622]/40 h-1.5 rounded-full overflow-hidden">
                  <div 
                    className="bg-[#A2B6CD] h-full transition-all duration-1000" 
                    style={{ width: `${Math.min(Math.max((heartRate - 50) * 3, 20), 100)}%` }} 
                  />
                </div>

                <div className="flex items-center justify-between mt-1">
                  <span className="text-xs text-[#ECEFF4]/70 font-lora">Thân nhiệt (Body Temp):</span>
                  <span className="text-xs font-lora font-bold text-[#ECEFF4]">{bodyTemp.toFixed(1)}°C</span>
                </div>

                <div className="flex items-center justify-between mt-1">
                  <span className="text-xs text-[#ECEFF4]/70 font-lora">Thể trạng:</span>
                  <span className="text-xs font-lora font-bold text-[#A2B6CD]">Duy trì ổn định</span>
                </div>
              </div>
            </div>

            {/* COMMERCE / INVESTMENT WATCH (THƯƠNG TRƯỜNG BIẾN ĐỘNG CỦA SĨ TỬ) */}
            <div className="border border-[#2D3D54]/30 bg-[#151C28] p-4 rounded-xl relative shadow-lg text-[#ECEFF4]">
              <h2 className="text-xs font-lora tracking-widest text-[#A2B6CD] uppercase border-b border-[#2D3D54]/40 pb-2 mb-3.5 flex items-center gap-2 font-bold">
                <TrendingUp className="w-4 h-4 text-[#A2B6CD]" /> THƯƠNG TRƯỜNG BIẾN ĐỘNG
              </h2>

              <div className="flex flex-col gap-3 text-xs">
                {marketPrices.map((stock) => (
                  <div key={stock.code} className="flex flex-col gap-0.5 border-b border-[#2D3D54]/10 pb-2 last:border-0 last:pb-0">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-[#ECEFF4] font-lora flex items-center gap-1.5">
                        <span className="text-[10px] bg-[#A2B6CD]/10 text-[#A2B6CD] border border-[#A2B6CD]/20 px-1 py-0.1 rounded font-bold">
                          {stock.code}
                        </span>
                        {stock.name}
                      </span>
                      <span className={`font-bold font-lora text-[11px] ${stock.change >= 0 ? "text-[#A2B6CD]" : "text-red-400"}`}>
                        {stock.price.toFixed(2)} ({stock.change >= 0 ? "+" : ""}{stock.change}%)
                      </span>
                    </div>
                    <span className="text-[10px] text-[#ECEFF4]/50 leading-normal">
                      {stock.desc}
                    </span>
                  </div>
                ))}

                <button
                  onClick={updateMarketPrice}
                  className="w-full mt-1.5 py-2 border border-[#2D3D54]/30 hover:border-[#A2B6CD] text-xs font-lora text-[#101622] bg-[#A2B6CD] hover:bg-[#ECEFF4] transition-all rounded uppercase font-bold"
                >
                  Cập nhật các chỉ số tự học
                </button>
              </div>
            </div>

            {/* REVENGE CHECKLIST CARD -> CHUYỂN THÀNH 4 CHƯƠNG MỚI NHẤT */}
            <div className="border border-[#2D3D54]/30 bg-[#151C28] p-4 rounded-xl relative shadow-lg text-[#ECEFF4]">
              <h2 className="text-xs font-lora tracking-widest text-[#A2B6CD] uppercase border-b border-[#2D3D54]/40 pb-2 mb-3 flex items-center gap-2 font-bold">
                <BookOpen className="w-3.5 h-3.5 text-[#A2B6CD]" /> SỔ TAY PHỤC THÙ
              </h2>
              
              <div className="flex flex-col gap-2.5">
                {[...chapters]
                  .sort((a, b) => {
                    const orderA = a.order !== undefined ? a.order : 0;
                    const orderB = b.order !== undefined ? b.order : 0;
                    return orderB - orderA;
                  })
                  .slice(0, 4)
                  .map(ch => (
                    <button
                      key={ch.id}
                      onClick={() => navigate(`/doc/${story.id}/${ch.id}`)}
                      className="w-full text-left p-2 rounded border border-[#2D3D54]/20 hover:border-[#A2B6CD]/60 bg-[#233145]/10 hover:bg-[#233145]/30 transition-all text-xs flex flex-col gap-0.5"
                    >
                      <span className="font-bold text-[#ECEFF4] line-clamp-1 group-hover:text-[#A2B6CD]">
                        {ch.title}
                      </span>
                      <span className="text-[10px] text-[#A2B6CD] flex items-center gap-1">
                        Đọc ngay &rarr;
                      </span>
                    </button>
                  ))}
                {chapters.length === 0 && (
                  <p className="text-xs text-[#ECEFF4]/50 italic">Chưa có chương mới nào.</p>
                )}
              </div>
            </div>

            {/* REAL-TIME LOG -> CHUYỂN THÀNH 4 COMMENT MỚI NHẤT */}
            <div className="border border-[#2D3D54]/30 bg-[#151C28] p-3 rounded-lg text-[11px] font-lora text-[#ECEFF4]">
              <div className="flex items-center gap-1.5 text-[#A2B6CD] font-bold mb-2.5 uppercase text-[9px] tracking-wider border-b border-[#2D3D54]/30 pb-1.5">
                <span className="w-1.5 h-1.5 bg-[#A2B6CD] rounded-full animate-ping" />
                DÒNG THỜI GIAN HÀNH ĐỘNG
              </div>
              <div className="flex flex-col gap-2.5 max-h-[220px] overflow-y-auto pr-1">
                {[...comments]
                  .sort((a, b) => {
                    const getCommentTime = (c: any) => {
                      if (!c.createdAt) return 0;
                      if (c.createdAt.seconds) return c.createdAt.seconds * 1000;
                      if (typeof c.createdAt.toMillis === 'function') return c.createdAt.toMillis();
                      return new Date(c.createdAt).getTime();
                    };
                    return getCommentTime(b) - getCommentTime(a);
                  })
                  .slice(0, 4)
                  .map((c, i) => (
                    <div key={c.id || i} className="border-l border-[#A2B6CD]/30 pl-2 pb-1 last:pb-0">
                      <p className="font-bold text-[#A2B6CD] text-[10px] leading-tight">
                        {c.displayName || c.authorName || "Độc giả ẩn danh"}
                      </p>
                      <p className="text-[10px] text-[#ECEFF4]/85 leading-normal mt-0.5 line-clamp-2">
                        {c.content || c.text}
                      </p>
                    </div>
                  ))}
                {comments.length === 0 && (
                  <p className="text-[10px] text-[#ECEFF4]/40 italic">Chưa có bình luận nào thảo luận.</p>
                )}
              </div>
            </div>

          </section>

          {/* ================= COLUMN 2: PRIMARY INTERACTIVE BODY (LG: 6/12) ================= */}
          <section className="lg:col-span-6 flex flex-col gap-6">
            
            {/* NOVEL BANNER & ADMISSIONS COVER */}
            <div className="relative border border-[#2D3D54]/30 bg-[#151C28] p-6 md:p-8 rounded-xl overflow-hidden shadow-2xl flex flex-col items-center text-center text-[#ECEFF4]">
              {/* Ribbon removed */}

              {/* Delicate lace-like corners */}
              <div className="absolute top-4 left-4 w-4 h-4 border-t border-l border-[#2D3D54]/30" />
              <div className="absolute bottom-4 right-4 w-4 h-4 border-b border-r border-[#2D3D54]/30" />

              {/* Subtitle badge removed */}

              <h2 className="font-alegreya text-2xl md:text-3xl lg:text-4xl font-bold text-[#ECEFF4] tracking-tight leading-tight mb-4">
                {story?.title || "NGƯỜI ĐẸP ỐM YẾU KHÔNG GIẠY GIỤA NỮA"}
              </h2>

              {(() => {
                const desc = story?.description || story?.summary || "Đời trước bị cha ruột hãm hại, chị kế cướp đoạt sản nghiệp, chết thảm trong bệnh viện. Quay lại năm 17 tuổi, cầm trên tay bản kế hoạch báo thù tối mật cùng trí tuệ siêu việt, ta sẽ lấy lại tất cả những gì vốn thuộc về mình!";
                const needsTruncate = desc.length > 200;
                const displayText = (needsTruncate && !isDescExpanded) 
                  ? `${desc.slice(0, 200).trim()}...` 
                  : desc;
                
                // Tách đoạn thông minh
                let paragraphs = [displayText];
                if (displayText.includes('\n')) {
                  paragraphs = displayText.split('\n').map(p => p.trim()).filter(Boolean);
                } else {
                  const sentences = displayText.match(/[^.!?]+[.!?]+(\s|$)/g) || [displayText];
                  const tempParas: string[] = [];
                  let currentPara = "";
                  sentences.forEach((sentence, idx) => {
                    currentPara += sentence;
                    if ((idx + 1) % 2 === 0 || idx === sentences.length - 1) {
                      tempParas.push(currentPara.trim());
                      currentPara = "";
                    }
                  });
                  paragraphs = tempParas;
                }

                return (
                  <>
                    <div className="text-xs text-[#ECEFF4]/80 max-w-lg mb-4 leading-relaxed text-left w-full transition-all duration-300">
                      {paragraphs.map((p, index) => (
                        <p key={index} className="mb-2.5 last:mb-0">
                          {p}
                        </p>
                      ))}
                    </div>
                    {needsTruncate && (
                      <button
                        onClick={() => setIsDescExpanded(!isDescExpanded)}
                        className="text-[10px] text-[#A2B6CD] font-bold uppercase tracking-wider hover:text-[#ECEFF4] hover:underline mb-4 transition-colors flex items-center gap-1 focus:outline-none"
                      >
                        {isDescExpanded ? "Thu gọn giới thiệu ↑" : "Xem thêm giới thiệu ↓"}
                      </button>
                    )}
                  </>
                );
              })()}

              {/* Thông tin nhân vật */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full mb-6 pt-5 border-t border-[#2D3D54]/30 text-left">
                {/* Lê Dung */}
                <div className="bg-[#101622] border border-[#2D3D54]/30 rounded-lg p-3.5 relative overflow-hidden group hover:border-[#A2B6CD]/30 transition-all duration-300">
                  <div className="absolute top-0 right-0 bg-[#A2B6CD]/10 text-[#A2B6CD] text-[9px] uppercase tracking-wider px-2 py-0.5 rounded-bl font-mono">
                    Thụ
                  </div>
                  <h3 className="font-alegreya text-sm font-bold text-[#ECEFF4] mb-2 flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#A2B6CD] animate-pulse"></span>
                    Lê Dung
                  </h3>
                  <ul className="space-y-1 text-[11px] text-[#ECEFF4]/75">
                    <li className="flex items-start gap-1">
                      <span className="text-[#A2B6CD]/60 font-mono select-none">✦</span>
                      <span>Thiên tài sinh học</span>
                    </li>
                    <li className="flex items-start gap-1">
                      <span className="text-[#A2B6CD]/60 font-mono select-none">✦</span>
                      <span>Cao quý lạnh lùng</span>
                    </li>
                    <li className="flex items-start gap-1">
                      <span className="text-[#A2B6CD]/60 font-mono select-none">✦</span>
                      <span>Yêu thích cuộc sống về đêm</span>
                    </li>
                  </ul>
                </div>

                {/* Sầm Hào */}
                <div className="bg-[#101622] border border-[#2D3D54]/30 rounded-lg p-3.5 relative overflow-hidden group hover:border-red-400/20 transition-all duration-300">
                  <div className="absolute top-0 right-0 bg-red-950/20 text-red-400/70 border-l border-b border-red-950/30 text-[9px] uppercase tracking-wider px-2 py-0.5 rounded-bl font-mono">
                    Công
                  </div>
                  <h3 className="font-alegreya text-sm font-bold text-[#ECEFF4] mb-2 flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-red-400/50"></span>
                    Sầm Hào
                  </h3>
                  <ul className="space-y-1 text-[11px] text-[#ECEFF4]/75">
                    <li className="flex items-start gap-1">
                      <span className="text-red-400/40 font-mono select-none">✦</span>
                      <span>Chó dại cố chấp</span>
                    </li>
                    <li className="flex items-start gap-1">
                      <span className="text-red-400/40 font-mono select-none">✦</span>
                      <span>Ông lớn ẩn giấu thân phận</span>
                    </li>
                    <li className="flex items-start gap-1">
                      <span className="text-red-400/40 font-mono select-none">✦</span>
                      <span>Khuyên vợ phải tiết chế</span>
                    </li>
                  </ul>
                </div>
              </div>

              {/* Author and stats metadata row */}
              <div className="grid grid-cols-2 gap-4 w-full pt-4 border-t border-[#2D3D54]/40 text-xs text-center">
                <div>
                  <span className="block text-[#ECEFF4]/50 text-[10px] uppercase font-lora mb-1">Tác giả</span>
                  <span className="font-bold text-[#A2B6CD]">{story?.author || "Đang cập nhật"}</span>
                </div>
                <div>
                  <span className="block text-[#ECEFF4]/50 text-[10px] uppercase font-lora mb-1">Số chương</span>
                  <span className="font-bold text-[#ECEFF4]">{chapters.length} chương</span>
                </div>
              </div>
            </div>

            {/* TAB SELECTOR: CHAPTERS OR COMMENTS */}
            <div className="flex border-b border-[#151C28] gap-1">
              <button
                onClick={() => setActiveTab('chapters')}
                className={`flex-1 py-3 text-center text-xs font-lora tracking-widest uppercase transition-all border-b-2 font-bold flex items-center justify-center gap-2 rounded-t-lg ${
                  activeTab === 'chapters'
                    ? 'border-[#A2B6CD] text-[#A2B6CD] bg-[#151C28]'
                    : 'border-transparent text-[#ECEFF4]/70 hover:text-[#A2B6CD] hover:bg-[#151C28]/50'
                }`}
              >
                <BookOpen className="w-4 h-4" /> ĐỀ THI ÔN LUYỆN
              </button>
              <button
                onClick={() => setActiveTab('comments')}
                className={`flex-1 py-3 text-center text-xs font-lora tracking-widest uppercase transition-all border-b-2 font-bold flex items-center justify-center gap-2 rounded-t-lg ${
                  activeTab === 'comments'
                    ? 'border-[#A2B6CD] text-[#A2B6CD] bg-[#151C28]'
                    : 'border-transparent text-[#ECEFF4]/70 hover:text-[#A2B6CD] hover:bg-[#151C28]/50'
                }`}
              >
                <Users className="w-4 h-4" /> THẢO LUẬN THƯƠNG HỘI
              </button>
            </div>

            {/* ================= TAB 1: CHAPTERS LISTING ================= */}
            {activeTab === 'chapters' && (
              <div className="flex flex-col gap-4">
                
                {/* Search & Sort & Group Selection Row */}
                <div className="flex flex-col gap-3 bg-[#151C28] p-3 border border-[#2D3D54]/30 rounded-lg text-[#ECEFF4]">
                  <div className="flex items-center justify-between gap-4 flex-wrap">
                    <div className="text-xs text-[#ECEFF4]/80 font-lora pl-1">
                      Tổng số: <strong className="text-[#A2B6CD]">{chapters.length}</strong> bài ôn luyện
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setIsCompactMode(!isCompactMode)}
                        className={`px-3 py-1.5 text-[10px] font-lora uppercase border rounded transition-colors font-bold ${
                          isCompactMode 
                            ? "bg-[#A2B6CD] text-[#101622] border-[#A2B6CD]" 
                            : "bg-[#233145]/30 border-[#2D3D54]/30 text-[#A2B6CD] hover:bg-[#A2B6CD] hover:text-[#101622]"
                        }`}
                        title={isCompactMode ? "Chuyển sang dạng card đầy đủ thông tin" : "Chuyển sang dạng danh sách đề thi siêu gọn"}
                      >
                        {isCompactMode ? "Bản siêu gọn ✓" : "Bản đầy đủ"}
                      </button>

                      <button
                        onClick={() => setChapterSortDesc(!chapterSortDesc)}
                        className="px-3 py-1.5 text-[10px] font-lora uppercase bg-[#233145]/30 border border-[#2D3D54]/30 text-[#A2B6CD] rounded hover:bg-[#A2B6CD] hover:text-[#101622] transition-colors font-bold"
                      >
                        {chapterSortDesc ? "Mới nhất" : "Cũ nhất"}
                      </button>
                    </div>
                  </div>

                  {/* Thanh tìm kiếm nhanh chương */}
                  <div className="w-full relative mt-1">
                    <input
                      type="text"
                      placeholder="Tìm nhanh theo số chương hoặc tiêu đề (ví dụ: 'Chương 42', '42')..."
                      value={searchChapterNum}
                      onChange={(e) => setSearchChapterNum(e.target.value)}
                      className="w-full px-3 py-2 bg-black/35 border border-[#2D3D54]/30 focus:border-[#A2B6CD] rounded text-xs text-[#ECEFF4] placeholder-[#4B5E78] focus:outline-none transition-all"
                    />
                  </div>

                  {/* Chọn cụm chương gom gọn (Ví dụ: Cụm 50 chương) */}
                  {!searchChapterNum.trim() && numGroups > 1 && (
                    <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-thin scrollbar-thumb-[#2D3D54]/50 scrollbar-track-transparent mt-1">
                      {Array.from({ length: numGroups }).map((_, idx) => {
                        const start = idx * GROUP_SIZE + 1;
                        const end = Math.min((idx + 1) * GROUP_SIZE, chapters.length);
                        return (
                          <button
                            key={idx}
                            onClick={() => setSelectedGroup(idx)}
                            className={`px-3 py-1.5 rounded text-[10px] font-semibold whitespace-nowrap border transition-all ${
                              selectedGroup === idx
                                ? 'bg-[#A2B6CD] text-[#101622] border-[#A2B6CD] font-bold'
                                : 'border-[#2D3D54]/25 text-[#A2B6CD] hover:bg-[#233145]/30 bg-[#233145]/10'
                            }`}
                          >
                            Chương {start} - {end}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Chapter list layout */}
                {displayedChapters.length === 0 ? (
                  <div className="text-center py-12 border border-dashed border-[#2D3D54]/30 rounded-xl bg-[#151C28]">
                    <p className="text-[#ECEFF4]/70 text-sm font-alegreya italic">Không tìm thấy bài ôn thi nào phù hợp với yêu cầu tìm kiếm của bạn...</p>
                  </div>
                ) : isCompactMode ? (
                  /* COMPACT MODE: Giao diện siêu gọn tiết kiệm diện tích */
                  <div className="max-h-[340px] overflow-y-auto pr-1.5 scrollbar-thin scrollbar-thumb-[#A2B6CD]/30 scrollbar-track-transparent">
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 md:gap-2.5">
                      {displayedChapters.map((chap) => {
                        const absoluteIndex = chapters.findIndex(c => c.id === chap.id) + 1;
                        const isLocked = chap.isLocked && !unlockedPassChapters.includes(chap.id);
                        const isEarly = chap.isEarlyAccess && !unlockedEarlyAccessChapters.includes(chap.id);
                        
                        return (
                          <button
                            key={chap.id}
                            onClick={() => navigate(`/doc/${story.id}/${chap.id}`)}
                            className="group text-left p-2.5 rounded-lg border border-[#2D3D54]/15 hover:border-[#A2B6CD]/80 bg-[#151C28] hover:bg-[#233145]/20 transition-all flex flex-col justify-between h-[66px] relative overflow-hidden shadow-sm"
                            title={chap.title}
                          >
                            <div className="flex justify-between items-center w-full">
                              <span className="text-[8px] md:text-[9px] font-mono text-[#A2B6CD]/80 font-bold tracking-wider">
                                MÃ ĐỀ {absoluteIndex.toString().padStart(2, '0')}
                              </span>
                              {isLocked ? (
                                <span className="text-[8px] bg-red-900/30 px-1 rounded text-red-300 scale-90 origin-right">KHÓA</span>
                              ) : isEarly ? (
                                <span className="text-[8px] bg-[#A2B6CD]/20 px-1 rounded text-[#A2B6CD] scale-90 origin-right">SỚM</span>
                              ) : null}
                            </div>

                            <div className="text-[11px] md:text-xs font-alegreya font-bold text-[#ECEFF4] group-hover:text-[#A2B6CD] transition-colors truncate mt-1 leading-tight w-full">
                              {chap.title}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ) : (
                  /* FULL MODE: Giao diện card đầy đủ thông tin */
                  <div className="max-h-[340px] overflow-y-auto pr-1.5 scrollbar-thin scrollbar-thumb-[#A2B6CD]/30 scrollbar-track-transparent">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                      {displayedChapters.map((chap) => {
                        const absoluteIndex = chapters.findIndex(c => c.id === chap.id) + 1;
                        const isLocked = chap.isLocked && !unlockedPassChapters.includes(chap.id);
                        const isEarly = chap.isEarlyAccess && !unlockedEarlyAccessChapters.includes(chap.id);
                        
                        return (
                          <button
                            key={chap.id}
                            onClick={() => navigate(`/doc/${story.id}/${chap.id}`)}
                            className="group text-left p-4 rounded-xl border border-[#2D3D54]/15 hover:border-[#A2B6CD]/80 bg-gradient-to-br from-[#151C28] to-[#151C28]/90 hover:from-[#233145]/40 hover:to-[#151C28] transition-all shadow hover:shadow-xl flex flex-col justify-between h-[120px] relative overflow-hidden"
                          >
                            {/* Top Tag row */}
                            <div className="flex justify-between items-start w-full gap-2 z-10">
                              <span className="text-[9px] font-lora text-[#A2B6CD] tracking-wider uppercase">
                                MÃ ĐỀ LUYỆN {absoluteIndex.toString().padStart(2, '0')}
                              </span>
                              
                              {isLocked ? (
                                <span className="text-[9px] font-lora px-1.5 py-0.5 rounded bg-[#233145]/50 border border-[#233145] text-[#ECEFF4]/70">
                                  CHƯA PHÊ DUYỆT
                                </span>
                              ) : isEarly ? (
                                <span className="text-[9px] font-lora px-1.5 py-0.5 rounded bg-[#A2B6CD]/20 border border-[#A2B6CD]/30 text-[#A2B6CD]">
                                  ĐỌC SỚM
                                </span>
                              ) : null}
                            </div>

                            {/* Chapter Title */}
                            <div className="my-2 z-10">
                              <h3 className="font-alegreya text-sm font-bold text-[#ECEFF4] group-hover:text-[#A2B6CD] transition-colors line-clamp-2">
                                {chap.title}
                              </h3>
                            </div>

                            {/* Foot detail */}
                            <div className="flex justify-between items-center w-full z-10">
                              <span className="text-[10px] text-[#ECEFF4]/60 font-lora">
                                {chap.createdAt ? format(new Date(chap.createdAt), 'dd/MM/yyyy') : "09/07/2026"}
                              </span>
                              
                              <span className="text-[10px] text-[#A2B6CD] font-semibold flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                                Luyện đề <ChevronRight className="w-3.5 h-3.5" />
                              </span>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Phân trang footer nếu đang tìm kiếm hoặc khi số chương hiển thị dài */}
                {searchChapterNum.trim() && displayedChapters.length > 20 && (
                  <div className="text-center py-2 text-[10px] text-[#ECEFF4]/50 italic">
                    Hiển thị tối đa {displayedChapters.length} kết quả tìm kiếm thích hợp
                  </div>
                )}

              </div>
            )}

            {/* ================= TAB 2: COMMENTS ================= */}
            {activeTab === 'comments' && (
              <div className="flex flex-col gap-6">
                
                {/* COMMENT BOX */}
                <div className="border border-[#2D3D54]/30 bg-[#151C28] p-4 rounded-xl relative text-[#ECEFF4]">
                  <h3 className="text-xs font-lora tracking-widest text-[#A2B6CD] uppercase mb-3 flex items-center gap-1.5 font-bold">
                    <Send className="w-3.5 h-3.5" /> Gửi Công Văn Thảo Luận
                  </h3>

                  <form onSubmit={handleSendComment} className="flex flex-col gap-3">
                    <textarea
                      value={commentText}
                      onChange={(e) => setCommentText(e.target.value)}
                      placeholder={isLoggedIn ? "Nhập ý kiến đóng góp cho thương hội tại đây..." : "Bạn cần đăng nhập để tham gia thảo luận!"}
                      rows={3}
                      disabled={!isLoggedIn}
                      className="w-full p-3 border border-[#2D3D54]/40 bg-black/25 text-[#ECEFF4] placeholder-[#4B5E78] focus:outline-none focus:border-[#A2B6CD] rounded-lg text-xs sm:text-sm resize-none transition-all disabled:opacity-40"
                    />
                    
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] font-lora text-[#ECEFF4]/60">
                        {isLoggedIn ? `Đang đăng nhập: ${displayName || "Thành viên"}` : "Kênh ngoại tuyến"}
                      </span>
                      <button
                        type="submit"
                        disabled={submittingComment || !commentText.trim() || !isLoggedIn}
                        className="px-5 py-2 rounded font-bold font-lora tracking-wider bg-[#A2B6CD] text-[#101622] hover:bg-[#ECEFF4] transition-colors text-xs uppercase disabled:opacity-40 disabled:cursor-not-allowed"
                      >
                        {submittingComment ? "Đang gửi..." : "Trình duyệt ý kiến"}
                      </button>
                    </div>
                  </form>
                </div>

                {/* DISCUSSION THREAD LIST */}
                <div className="flex flex-col gap-4">
                  {comments.length === 0 ? (
                    <div className="text-center py-10 border border-dashed border-[#2D3D54]/30 rounded-xl bg-[#151C28]">
                      <p className="text-[#ECEFF4]/70 text-xs font-alegreya italic font-bold">Thương hội chưa có công văn nào. Hãy là người đầu tiên đặt câu hỏi!</p>
                    </div>
                  ) : (
                    <div className="flex flex-col gap-4">
                      {comments.map((comm) => {
                        const cacheUser = profilesCache[comm.uid] || {};
                        const avatar = cacheUser.avatarUrl || comm.avatarUrl || '';
                        return (
                          <div key={comm.id} className="p-4 border border-[#2D3D54]/20 bg-[#151C28] text-[#ECEFF4] rounded-xl relative shadow">
                            
                            <div className="flex justify-between items-start gap-4 mb-2">
                              <div className="flex items-center gap-2.5">
                                <UserAvatar 
                                  avatarUrl={avatar}
                                  equippedAccessory={cacheUser.equippedAccessory || comm.equippedAccessory}
                                  accessoryPosition={cacheUser.accessoryPosition || comm.accessoryPosition}
                                  className="w-8 h-8 rounded-full border border-[#2D3D54]/40"
                                />
                                <div>
                                  <h4 className="text-xs font-bold text-[#A2B6CD]">
                                    {comm.displayName || comm.authorName || "Nhà lữ hành ẩn danh"}
                                  </h4>
                                  <span className="text-[9px] font-lora text-[#ECEFF4]/50">
                                    {comm.createdAt ? format(new Date(comm.createdAt?.seconds ? comm.createdAt.seconds * 1000 : (comm.createdAt?.toMillis ? comm.createdAt.toMillis() : comm.createdAt)), 'dd/MM/yyyy HH:mm') : "Đang cập nhật"}
                                  </span>
                                </div>
                              </div>

                              <span className="text-[9px] font-lora text-[#ECEFF4]/40 tracking-widest uppercase">
                                #{comm.id?.slice(-4) || "MSG"}
                              </span>
                            </div>

                            <p className="text-xs leading-relaxed text-[#ECEFF4] pl-11">
                              {comm.content || comm.text}
                            </p>

                            {/* REPLIES CONTAINER */}
                            {comm.replies && comm.replies.length > 0 && (
                              <div className="mt-3.5 pl-11 flex flex-col gap-3 border-l border-[#2D3D54]/40 ml-3.5">
                                {comm.replies.map((rep: any, idx: number) => {
                                  const cacheRepUser = profilesCache[rep.uid] || {};
                                  const repAvatar = cacheRepUser.avatarUrl || rep.avatarUrl || '';
                                  return (
                                    <div key={rep.id || idx} className="text-xs">
                                      <div className="flex items-center gap-2 mb-1">
                                        <UserAvatar 
                                          avatarUrl={repAvatar}
                                          equippedAccessory={cacheRepUser.equippedAccessory || rep.equippedAccessory}
                                          accessoryPosition={cacheRepUser.accessoryPosition || rep.accessoryPosition}
                                          className="w-5 h-5 rounded-full border border-[#2D3D54]/40"
                                        />
                                        <span className="font-bold text-[#A2B6CD] text-[11px]">{rep.displayName || rep.authorName || "Cố vấn ẩn danh"}</span>
                                        <span className="text-[9px] font-lora text-[#ECEFF4]/50">
                                          {rep.createdAt ? format(new Date(rep.createdAt?.seconds ? rep.createdAt.seconds * 1000 : (rep.createdAt?.toMillis ? rep.createdAt.toMillis() : rep.createdAt)), 'dd/MM HH:mm') : ""}
                                        </span>
                                      </div>
                                      <p className="text-[#ECEFF4]/85 pl-6 leading-relaxed">
                                        {rep.content || rep.text}
                                      </p>
                                    </div>
                                  );
                                })}
                              </div>
                            )}

                            {/* Inline reply action */}
                            <div className="mt-2.5 pl-11 flex justify-end">
                              {replyingToId === comm.id ? (
                                <div className="w-full flex flex-col gap-2 bg-black/25 p-2 rounded-lg border border-[#2D3D54]/30">
                                  <textarea
                                    value={replyText}
                                    onChange={(e) => setReplyText(e.target.value)}
                                    placeholder="Nhập phản hồi cố vấn..."
                                    rows={2}
                                    className="w-full p-2 bg-[#151C28]/80 text-xs text-[#ECEFF4] placeholder-[#4B5E78] focus:outline-none focus:border-[#A2B6CD] border border-[#2D3D54]/40 rounded"
                                  />
                                  <div className="flex justify-end gap-2 text-[10px]">
                                    <button
                                      onClick={() => setReplyingToId(null)}
                                      className="px-2 py-1 text-[#ECEFF4]/50 hover:text-[#ECEFF4]"
                                    >
                                      Hủy
                                    </button>
                                    <button
                                      onClick={() => handleSendReply(comm)}
                                      disabled={submittingReply || !replyText.trim()}
                                      className="px-3 py-1 bg-[#A2B6CD] text-[#101622] font-bold uppercase rounded disabled:opacity-40"
                                    >
                                      Gửi cố vấn
                                    </button>
                                  </div>
                                </div>
                              ) : (
                                <button
                                  onClick={() => {
                                    if (!isLoggedIn) return;
                                    setReplyingToId(comm.id);
                                  }}
                                  className="text-[10px] font-lora text-[#A2B6CD] hover:text-[#ECEFF4] flex items-center gap-1"
                                >
                                  Phản hồi cố vấn <Send className="w-3 h-3" />
                                </button>
                              )}
                            </div>

                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

              </div>
            )}

          </section>

          {/* ================= COLUMN 3: ACADEMIC GRADES & STOCK MARKET LEDGER (LG: 3/12) ================= */}
          <section className="lg:col-span-3 flex flex-col gap-6 lg:sticky lg:top-[74px]">
            
            {/* EXAM REVISION BOARD (CÂU HỎI ÔN THI ĐẠI HỌC THEO MÔN) */}
            <div className="border border-[#2D3D54]/30 bg-[#151C28] p-4 rounded-xl relative shadow-lg text-[#ECEFF4]">
              <div className="flex justify-between items-center border-b border-[#2D3D54]/40 pb-2 mb-3">
                <h2 className="text-xs font-lora tracking-widest text-[#A2B6CD] uppercase flex items-center gap-2 font-bold">
                  <GraduationCap className="w-4 h-4 text-[#A2B6CD]" /> ÔN THI ĐẠI HỌC
                </h2>
                <span className="text-[10px] font-lora text-[#A2B6CD] bg-[#A2B6CD]/10 px-2 py-0.5 rounded font-bold">
                  {examScore} Điểm
                </span>
              </div>

              {/* Lựa chọn môn học */}
              <div className="mb-3">
                <label className="block text-[10px] text-[#ECEFF4]/60 uppercase font-lora mb-1 font-bold">Chọn môn ôn tập:</label>
                <select
                  value={selectedSubject}
                  onChange={(e) => setSelectedSubject(e.target.value)}
                  className="w-full bg-[#101622] border border-[#2D3D54]/40 hover:border-[#A2B6CD]/50 rounded px-2.5 py-1.5 text-xs text-[#ECEFF4] focus:outline-none focus:border-[#A2B6CD] transition-all cursor-pointer font-medium"
                >
                  {SUBJECTS.map(sub => (
                    <option key={sub.id} value={sub.id} className="bg-[#151C28] text-xs">
                      {sub.name}
                    </option>
                  ))}
                </select>
                <div className="flex justify-between items-center mt-1.5 text-[9px] text-[#A2B6CD] font-medium font-lora">
                  <span>Tiến độ: {(answeredMap[selectedSubject] || []).length}/50 câu</span>
                  <button 
                    onClick={handleResetSubject}
                    className="hover:underline text-red-400 hover:text-red-300 flex items-center gap-0.5"
                    title="Làm lại tất cả câu hỏi của môn này"
                  >
                    <RotateCcw className="w-2.5 h-2.5" /> Làm lại môn này
                  </button>
                </div>
              </div>

              <div className="flex flex-col gap-3 text-xs border-t border-[#2D3D54]/20 pt-3">
                {currentQuestionIndex === -1 ? (
                  <div className="text-center py-4 bg-[#A2B6CD]/5 border border-[#A2B6CD]/25 rounded p-3">
                    <p className="font-bold text-[#A2B6CD] text-xs mb-1">🎉 Xuất Sắc Hoàn Thành!</p>
                    <p className="text-[10px] text-[#ECEFF4]/80 leading-relaxed">
                      Bạn đã chinh phục toàn bộ 50 câu hỏi ôn tập của môn <strong className="text-[#A2B6CD]">{SUBJECTS.find(s => s.id === selectedSubject)?.name}</strong>! Hãy tiếp tục thử thách bản thân với các môn thi khác nhé.
                    </p>
                  </div>
                ) : (() => {
                  const currentQ = generateQuestion(selectedSubject, currentQuestionIndex);
                  return (
                    <>
                      {/* Câu hỏi */}
                      <p className="font-bold text-[#ECEFF4] leading-relaxed mb-1">
                        Câu {currentQuestionIndex + 1}: {currentQ.question}
                      </p>

                      {/* Các đáp án */}
                      <div className="flex flex-col gap-2">
                        {currentQ.options.map((opt, idx) => {
                          let btnStyle = "border-[#2D3D54]/30 bg-[#233145]/10 text-[#ECEFF4]/90 hover:bg-[#233145]/30 hover:border-[#A2B6CD]/50";
                          if (hasAnswered) {
                            if (idx === currentQ.correct) {
                              btnStyle = "bg-[#A2B6CD]/20 border-[#A2B6CD] text-[#A2B6CD] font-semibold";
                            } else if (selectedAns === idx) {
                              btnStyle = "bg-red-950/20 border-red-500/40 text-red-300";
                            } else {
                              btnStyle = "opacity-40 border-[#2D3D54]/10 bg-[#233145]/5 text-[#ECEFF4]/60";
                            }
                          }

                          return (
                            <button
                              key={idx}
                              disabled={hasAnswered}
                              onClick={() => handleAnswerClick(idx)}
                              className={`w-full text-left p-2.5 rounded border transition-all text-[11px] leading-snug ${btnStyle}`}
                            >
                              {opt}
                            </button>
                          );
                        })}
                      </div>

                      {/* Giải thích câu hỏi */}
                      {hasAnswered && (
                        <div className="mt-2 p-2.5 bg-black/35 border border-[#2D3D54]/35 rounded text-[10px] text-[#ECEFF4]/80 leading-relaxed animate-fade-in">
                          <p className="text-[#A2B6CD] font-bold mb-0.5 uppercase tracking-wider text-[9px]">Lý giải đáp án:</p>
                          <p className="italic">{currentQ.explanation}</p>
                        </div>
                      )}

                      {/* Nút câu tiếp theo */}
                      {hasAnswered && (
                        <button
                          onClick={handleNextQuestion}
                          className="w-full mt-1.5 py-1.5 border border-[#A2B6CD]/40 hover:border-[#A2B6CD] text-[10px] font-lora text-[#A2B6CD] hover:bg-[#A2B6CD] hover:text-[#101622] bg-[#A2B6CD]/5 transition-all rounded uppercase font-bold"
                        >
                          Luyện câu hỏi tiếp theo &rarr;
                        </button>
                      )}
                    </>
                  );
                })()}
              </div>
            </div>

            {/* BẢNG XẾP HẠNG THÍ SINH (RANKING) */}
            <div className="border border-[#2D3D54]/30 bg-[#151C28] p-4 rounded-xl relative shadow-lg text-[#ECEFF4]">
              <h2 className="text-xs font-lora tracking-widest text-[#A2B6CD] uppercase border-b border-[#2D3D54]/40 pb-2 mb-3.5 flex items-center gap-2 font-bold">
                <Users className="w-4 h-4 text-[#A2B6CD]" /> BẢNG XẾP HẠNG THÍ SINH
              </h2>

              <div className="flex flex-col gap-2.5">
                {leaderboard.map((user, idx) => {
                  let badge = "";
                  let rankColor = "text-[#ECEFF4]/70";
                  if (idx === 0) {
                    badge = "🥇";
                    rankColor = "text-yellow-400 font-bold";
                  } else if (idx === 1) {
                    badge = "🥈";
                    rankColor = "text-slate-300 font-bold";
                  } else if (idx === 2) {
                    badge = "🥉";
                    rankColor = "text-amber-600 font-bold";
                  } else {
                    badge = `${idx + 1}.`;
                  }

                  return (
                    <div 
                      key={user.uid || idx} 
                      className={`flex items-center justify-between p-2 rounded border border-[#2D3D54]/15 bg-[#121824]/40 text-xs ${
                        user.uid === uid ? 'border-[#A2B6CD]/50 bg-[#A2B6CD]/5' : ''
                      }`}
                    >
                      <div className="flex items-center gap-2 overflow-hidden">
                        <span className={`w-5 text-center text-xs ${rankColor}`}>
                          {badge}
                        </span>
                        {user.avatarUrl ? (
                          <img src={user.avatarUrl} alt="" className="w-5 h-5 rounded-full object-cover border border-[#2D3D54]/30" referrerPolicy="no-referrer" />
                        ) : (
                          <div className="w-5 h-5 rounded-full bg-[#233145] text-[9px] flex items-center justify-center text-[#A2B6CD] font-bold">
                            {user.displayName?.charAt(0).toUpperCase()}
                          </div>
                        )}
                        <span className={`truncate font-medium ${user.uid === uid ? 'text-[#A2B6CD] font-bold' : 'text-[#ECEFF4]/90'}`}>
                          {user.displayName} {user.uid === uid && "(Bạn)"}
                        </span>
                      </div>
                      <span className="font-bold text-[#A2B6CD] font-lora text-[11px] whitespace-nowrap">
                        {user.score} đ
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* INTERACTIVE STUDY SCHEDULE */}
            <div className="border border-[#2D3D54]/30 bg-[#151C28] p-4 rounded-xl relative shadow-lg text-[#ECEFF4]">
              <h2 className="text-xs font-lora tracking-widest text-[#A2B6CD] uppercase border-b border-[#2D3D54]/40 pb-2 mb-3 flex items-center gap-2 font-bold">
                <Calendar className="w-3.5 h-3.5 text-[#A2B6CD]" /> LỊCH TRÌNH ÔN THI HIỆU QUẢ
              </h2>

              <div className="flex flex-col gap-2">
                {schedule.map(item => (
                  <button
                    key={item.id}
                    onClick={() => toggleTask(item.id)}
                    className="w-full text-left flex items-start gap-2.5 p-2 rounded hover:bg-[#233145]/20 transition-all text-xs"
                  >
                    <span className="mt-0.5 text-[#A2B6CD]">
                      {item.completed ? (
                        <CheckSquare className="w-4 h-4 text-[#A2B6CD]" />
                      ) : (
                        <Square className="w-4 h-4 text-[#233145]" />
                      )}
                    </span>
                    <div className="flex-1">
                      <div className="flex items-center gap-1.5 mb-0.5">
                        <span className="font-lora text-[9px] px-1 py-0.1 bg-black/30 text-[#A2B6CD] rounded">
                          {item.time}
                        </span>
                      </div>
                      <p className={`leading-relaxed text-xs ${item.completed ? 'line-through text-[#ECEFF4]/50' : 'text-[#ECEFF4]'}`}>
                        {item.text}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            </div>

          </section>

        </div>
      </main>

    </div>
  );
}
