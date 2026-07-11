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
  Users,
  Check,
  X
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

  const qIdx = index % 4; // Mỗi môn có 4 câu hỏi phong phú chuẩn chương trình thi THPT lớp 11 (nửa cuối) + cả năm lớp 12

  if (subjectId === 'toan') {
    if (qIdx === 0) {
      question = `[Toán 12 - Giải tích] Tìm số điểm cực trị của hàm số bậc ba y = x³ - 3x² + 2?`;
      options = [`A. 2`, `B. 0`, `C. 1`, `D. 3`];
      correct = 0;
      explanation = `Ta có y' = 3x² - 6x. Phương trình y' = 0 <=> 3x(x - 2) = 0 có 2 nghiệm phân biệt. Vì y' đổi dấu khi đi qua các nghiệm này nên hàm số có 2 điểm cực trị.`;
    } else if (qIdx === 1) {
      question = `[Toán 12 - Giải tích] Đồ thị hàm số y = (2x + 1)/(x - 1) có phương trình đường tiệm cận đứng là gì?`;
      options = [`A. x = 1`, `B. y = 2`, `C. x = -1`, `D. y = 1`];
      correct = 0;
      explanation = `Đường tiệm cận đứng của đồ thị hàm số phân thức bậc nhất trên bậc nhất là nghiệm của mẫu số: x - 1 = 0 => x = 1.`;
    } else if (qIdx === 2) {
      question = `[Toán 11 - Giải tích] Tính đạo hàm của hàm số lượng giác y = sin(2x) tại điểm x = 0?`;
      options = [`A. y'(0) = 2`, `B. y'(0) = 0`, `C. y'(0) = 1`, `D. y'(0) = -2`];
      correct = 0;
      explanation = `Đạo hàm của hàm số là y' = [sin(2x)]' = 2cos(2x). Thay x = 0 vào ta được y'(0) = 2*cos(0) = 2*1 = 2.`;
    } else {
      question = `[Toán 11 - Đại số] Từ một tổ gồm 10 học sinh, có bao nhiêu cách chọn ra một nhóm gồm 3 học sinh để đi làm nhiệm vụ trực nhật?`;
      options = [`A. C_10^3 = 120 cách`, `B. A_10^3 = 720 cách`, `C. 10³ = 1000 cách`, `D. 30 cách`];
      correct = 0;
      explanation = `Chọn ngẫu nhiên 3 học sinh từ 10 học sinh không phân biệt thứ tự là một tổ hợp chập 3 của 10 phần tử: C_10^3 = 10! / (3! * 7!) = 120 cách.`;
    }
  } else if (subjectId === 'van') {
    if (qIdx === 0) {
      question = `[Ngữ văn 12] Hoàn cảnh sáng tác và bối cảnh lịch sử của truyện ngắn "Vợ nhặt" của nhà văn Kim Lân là gì?`;
      options = [
        `A. Nạn đói khủng khiếp năm 1945 tại Việt Nam`,
        `B. Cuộc kháng chiến chống thực dân Pháp xâm lược (1946 - 1954)`,
        `C. Phong trào Đồng khởi ở Bến Tre những năm 1959 - 1960`,
        `D. Giai đoạn xây dựng chủ nghĩa xã hội ở miền Bắc sau năm 1954`
      ];
      correct = 0;
      explanation = `Truyện ngắn "Vợ nhặt" có tiền thân là tiểu thuyết "Xóm ngụ cư", được viết ngay sau Cách mạng tháng Tám nhưng bị mất bản thảo, sau hòa bình lặp lại (1954) tác giả viết lại dựa trên bối cảnh nạn đói khủng khiếp năm 1945.`;
    } else if (qIdx === 1) {
      question = `[Ngữ văn 12] Trong bài thơ "Tây Tiến" của Quang Dũng, vẻ đẹp của hình tượng người lính Tây Tiến được khắc họa như thế nào?`;
      options = [
        `A. Vừa hào hoa, lãng mạn, vừa kiêu hùng, bi tráng thấm đượm tình đồng chí`,
        `B. Khắc khổ, chịu đựng, mộc mạc và chân chất mang dáng dấp nông dân nông thôn`,
        `C. Sang trọng, quý phái, luôn bộc lộ tư tưởng bi quan trước cái chết cận kề`,
        `D. Sôi nổi, ồn ào và mang đậm màu sắc cá nhân chủ nghĩa thời bấy giờ`
      ];
      correct = 0;
      explanation = `Người lính Tây Tiến đa phần là học sinh, sinh viên trí thức Hà Nội, do đó họ mang vẻ đẹp tâm hồn hào hoa, lãng mạn, đồng thời có ý chí kiêu hùng, sẵn sàng hy sinh bi tráng vì Tổ quốc.`;
    } else if (qIdx === 2) {
      question = `[Ngữ văn 11] Khát vọng cốt lõi được thể hiện qua bài thơ "Vội vàng" của nhà thơ Xuân Diệu là gì?`;
      options = [
        `A. Khát vọng sống mãnh liệt, cuồng nhiệt, trân trọng từng phút giây của tuổi trẻ và tình yêu`,
        `B. Khát vọng lánh đời thoát tục, tìm về chốn sơn lâm tĩnh lặng yên bình`,
        `C. Khát vọng đấu tranh giai cấp quyết liệt nhằm lật đổ ách thống trị phong kiến`,
        `D. Niềm hoài cổ tiếc thương những giá trị xưa cũ đang dần mai một trôi qua`
      ];
      correct = 0;
      explanation = `"Vội vàng" là tiếng lòng của một tâm hồn yêu sống, khát khao giao cảm với đời, thể hiện một quan niệm nhân sinh mới mẻ, tích cực về thời gian, tuổi trẻ và hạnh phúc trần thế.`;
    } else {
      question = `[Ngữ văn 11] Bi kịch sâu sắc nhất của nhân vật Chí Phèo trong truyện ngắn cùng tên của nhà văn Nam Cao là gì?`;
      options = [
        `A. Bi kịch bị lưu manh hóa và bị cự tuyệt quyền làm người lương thiện`,
        `B. Bi kịch bị nghèo đói túng quẫn bủa vây không có cơm ăn áo mặc`,
        `C. Bi kịch gia đình tan vỡ và không có người thân thiết bên cạnh`,
        `D. Bi kịch bị bọn cường hào địa chủ cướp đoạt hết ruộng đất canh tác`
      ];
      correct = 0;
      explanation = `Cái chết của Chí Phèo ở cuối tác phẩm là lời tố cáo đanh thép xã hội cũ đã cướp đi nhân hình lẫn nhân tính của người nông dân nghèo, đẩy họ vào con đường lưu manh hóa rồi tước đoạt quyền sống lương thiện của họ.`;
    }
  } else if (['tieng-anh', 'tieng-phap', 'tieng-trung', 'tieng-duc', 'tieng-nhat', 'tieng-nga', 'tieng-han'].includes(subjectId)) {
    if (subjectId === 'tieng-anh') {
      if (qIdx === 0) {
        question = `[Ngoại ngữ - Tiếng Anh 12] He bought a _______ car yesterday.`;
        options = [`A. beautiful new Japanese`, `B. Japanese beautiful new`, `C. new beautiful Japanese`, `D. beautiful Japanese new`];
        correct = 0;
        explanation = `Trật tự tính từ chuẩn trong tiếng Anh: Opinion (beautiful) - Age (new) - Origin (Japanese) -> Công thức OSASCOMP.`;
      } else if (qIdx === 1) {
        question = `[Ngoại ngữ - Tiếng Anh 12] You are coming to the party tonight, _______?`;
        options = [`A. aren't you`, `B. don't you`, `C. won't you`, `D. are you`];
        correct = 0;
        explanation = `Câu hỏi đuôi (Tag question): Mệnh đề chính khẳng định dùng động từ 'to be' là 'are' -> Đuôi phủ định tương ứng là 'aren't you'.`;
      } else if (qIdx === 2) {
        question = `[Ngoại ngữ - Tiếng Anh 11] When we arrived at the cinema, the movie _______ already started.`;
        options = [`A. had`, `B. has`, `C. was`, `D. did`];
        correct = 0;
        explanation = `Thì quá khứ hoàn thành (Past Perfect) dùng diễn tả hành động xảy ra và hoàn thành trước một hành động khác trong quá khứ (arrived).`;
      } else {
        question = `[Ngoại ngữ - Tiếng Anh 11] If I _______ you, I would take that advanced vocabulary course.`;
        options = [`A. were`, `B. am`, `C. had been`, `D. was`];
        correct = 0;
        explanation = `Câu điều kiện loại 2 diễn tả điều kiện trái thực tế ở hiện tại: If + S + V-quá khứ giả định (dùng 'were' cho mọi ngôi).`;
      }
    } else if (subjectId === 'tieng-phap') {
      if (qIdx === 0) {
        question = `[Ngoại ngữ - Tiếng Pháp] Chọn mạo từ thích hợp: "Elle aime _______ chocolat."`;
        options = [`A. le`, `B. la`, `C. de l'`, `D. un`];
        correct = 0;
        explanation = `Sau các động từ chỉ sự yêu thích (aimer, adorer, préférer, détester), ta dùng mạo từ xác định (le, la, les). 'Chocolat' là danh từ giống đực số ít nên dùng 'le'.`;
      } else if (qIdx === 1) {
        question = `[Ngoại ngữ - Tiếng Pháp] Chia động từ "être" ở thì hiện tại với ngôi "nous": "Nous _______ étudiants."`;
        options = [`A. sommes`, `B. êtes`, `C. sont`, `D. suis`];
        correct = 0;
        explanation = `Động từ 'être' ở thì hiện tại chia với ngôi 'nous' là 'nous sommes'.`;
      } else if (qIdx === 2) {
        question = `[Ngoại ngữ - Tiếng Pháp] Tìm từ trái nghĩa với "grand" (to lớn) trong tiếng Pháp?`;
        options = [`A. petit`, `B. mauvais`, `C. jeune`, `D. joli`];
        correct = 0;
        explanation = `'Grand' có nghĩa là to lớn, cao lớn. Từ trái nghĩa của nó là 'petit' (nhỏ bé, lùn).`;
      } else {
        question = `[Ngoại ngữ - Tiếng Pháp] "Comment ça va ?" có nghĩa là gì trong tiếng Việt?`;
        options = [`A. Bạn khỏe không?`, `B. Bạn tên là gì?`, `C. Bạn bao nhiêu tuổi?`, `D. Bạn từ đâu đến?`];
        correct = 0;
        explanation = `'Comment ça va ?' là câu hỏi thăm sức khỏe thông dụng trong tiếng Pháp, tương đương với 'How are you?' trong tiếng Anh.`;
      }
    } else if (subjectId === 'tieng-trung') {
      if (qIdx === 0) {
        question = `[Ngoại ngữ - Tiếng Trung] Đại từ nhân xưng ngôi thứ hai số ít "bạn, anh, chị" trong tiếng Trung viết là gì?`;
        options = [`A. 你 (nǐ)`, `B. 我 (wǒ)`, `C. 他 (tā)`, `D. 们 (men)`];
        correct = 0;
        explanation = `'Liệt kê': '你' (nǐ) có nghĩa là bạn, anh, chị (ngôi thứ hai số ít). '我' là tôi, '他' là anh ấy, '们' là hậu tố số nhiều.`;
      } else if (qIdx === 1) {
        question = `[Ngoại ngữ - Tiếng Trung] Từ nào sau đây có nghĩa là "học tập" trong tiếng Trung?`;
        options = [`A. 学习 (xuéxí)`, `B. 谢谢 (xièxie)`, `C. 老师 (lǎoshī)`, `D. 朋友 (péngyou)`];
        correct = 0;
        explanation = `'学习' (xuéxí) có nghĩa là học tập. '谢谢' là cảm ơn, '老师' là giáo viên, '朋友' là bạn bè.`;
      } else if (qIdx === 2) {
        question = `[Ngoại ngữ - Tiếng Trung] Phiên âm "mǎ" (con ngựa - 马) mang thanh điệu (thanh) thứ mấy?`;
        options = [`A. Thanh 3 (hỏi)`, `B. Thanh 1 (ngang)`, `C. Thanh 2 (sắc)`, `D. Thanh 4 (huyền/nặng)`];
        correct = 0;
        explanation = `Từ 'mǎ' (mã - con ngựa) mang thanh điệu thứ 3 (thanh hỏi), phát âm đi xuống rồi đi lên.`;
      } else {
        question = `[Ngoại ngữ - Tiếng Trung] "早上好" (zǎoshang hǎo) có nghĩa là gì?`;
        options = [`A. Chào buổi sáng`, `B. Tạm biệt`, `C. Chúc ngủ ngon`, `D. Không có chi`];
        correct = 0;
        explanation = `'早上好' (zǎoshang hǎo) là câu chào buổi sáng thông dụng trong tiếng Trung.`;
      }
    } else if (subjectId === 'tieng-duc') {
      if (qIdx === 0) {
        question = `[Ngoại ngữ - Tiếng Đức] Từ nào sau đây là mạo từ xác định giống đực (nominative) trong tiếng Đức?`;
        options = [`A. der`, `B. die`, `C. das`, `D. den`];
        correct = 0;
        explanation = `Trong tiếng Đức, mạo từ xác định giống đực là 'der', giống cái là 'die', và giống trung là 'das' (ở cách 1 nominative).`;
      } else if (qIdx === 1) {
        question = `[Ngoại ngữ - Tiếng Đức] Từ "Guten Tag" có nghĩa là gì trong tiếng Việt?`;
        options = [`A. Chào ngày mới / Chào buổi chiều`, `B. Chúc ngủ ngon`, `C. Tạm biệt`, `D. Cảm ơn`];
        correct = 0;
        explanation = `'Guten Tag' là câu chào xã giao ban ngày (thường từ 11h sáng đến tối muộn) trong tiếng Đức, có nghĩa là 'Chào bạn / Chào ngày mới'.`;
      } else if (qIdx === 2) {
        question = `[Ngoại ngữ - Tiếng Đức] Động từ "sein" (thì, là, ở) chia với ngôi "ich" (tôi) ở hiện tại là gì?`;
        options = [`A. bin`, `B. bist`, `C. ist`, `D. sind`];
        correct = 0;
        explanation = `Động từ bất quy tắc 'sein' chia với ngôi 'ich' ở hiện tại là 'ich bin'.`;
      } else {
        question = `[Ngoại ngữ - Tiếng Đức] Số "mười" (10) trong tiếng Đức được viết là gì?`;
        options = [`A. zehn`, `B. eins`, `C. zwei`, `D. drei`];
        correct = 0;
        explanation = `Số 1 là 'eins', số 2 là 'zwei', số 3 là 'drei', và số 10 trong tiếng Đức là 'zehn'.`;
      }
    } else if (subjectId === 'tieng-nhat') {
      if (qIdx === 0) {
        question = `[Ngoại ngữ - Tiếng Nhật] Chữ cái Hiragana "あ" phát âm là gì?`;
        options = [`A. a`, `B. i`, `C. u`, `D. e`];
        correct = 0;
        explanation = `Chữ 'あ' là chữ cái đầu tiên trong bảng chữ cái tiếng Nhật Hiragana, phát âm là 'a'.`;
      } else if (qIdx === 1) {
        question = `[Ngoại ngữ - Tiếng Nhật] "Arigatou gozaimasu" (ありがとうございます) có nghĩa là gì?`;
        options = [`A. Xin cảm ơn rất nhiều`, `B. Xin lỗi`, `C. Chào buổi sáng`, `D. Tạm biệt`];
        correct = 0;
        explanation = `'ありがとうございます' là lời cảm ơn lịch sự và trang trọng nhất trong tiếng Nhật.`;
      } else if (qIdx === 2) {
        question = `[Ngoại ngữ - Tiếng Nhật] Trợ từ nào thường dùng để đứng sau chủ ngữ chính trong câu tiếng Nhật?`;
        options = [`A. は (phát âm là wa)`, `B. を (wo)`, `C. に (ni)`, `D. で (de)`];
        correct = 0;
        explanation = `Trợ từ 'は' (viết là ha nhưng phát âm là wa) là trợ từ biểu thị chủ đề hoặc chủ ngữ của câu.`;
      } else {
        question = `[Ngoại ngữ - Tiếng Nhật] Từ "Sensei" (せんせい) dùng để gọi ai tôn kính?`;
        options = [`A. Thầy cô giáo / Bác sĩ`, `B. Học sinh / Sinh viên`, `C. Công nhân xây dựng`, `D. Giám đốc điều hành`];
        correct = 0;
        explanation = `'先生' (Sensei) là danh xưng tôn kính dùng để gọi thầy cô giáo, bác sĩ, hoặc những người có học vấn, chuyên môn cao.`;
      }
    } else if (subjectId === 'tieng-nga') {
      if (qIdx === 0) {
        question = `[Ngoại ngữ - Tiếng Nga] Chữ cái thứ nhất trong bảng chữ cái tiếng Nga (Cyrillic) là chữ nào?`;
        options = [`A. А`, `B. Б`, `C. В`, `D. Г`];
        correct = 0;
        explanation = `Bảng chữ cái tiếng Nga bắt đầu bằng chữ 'А' và kết thúc bằng chữ 'Я'.`;
      } else if (qIdx === 1) {
        question = `[Ngoại ngữ - Tiếng Nga] Từ "Спасибо" (Spasibo) có nghĩa là gì trong tiếng Việt?`;
        options = [`A. Cảm ơn`, `B. Xin chào`, `C. Tạm biệt`, `D. Làm ơn`];
        correct = 0;
        explanation = `'Спасибо' (phát âm: Spasibo) là từ cảm ơn thông dụng và phổ biến nhất trong tiếng Nga.`;
      } else if (qIdx === 2) {
        question = `[Ngoại ngữ - Tiếng Nga] Từ chào hỏi trang trọng, lịch sự nhất trong tiếng Nga là gì?`;
        options = [`A. Здравствуйте (Zdravstvuyte)`, `B. Привет (Privet)`, `C. Пока (Poka)`, `D. До свидания (Do svidaniya)`];
        correct = 0;
        explanation = `'Здравствуйте' (Zdravstvuyte) là lời chào lịch sự nhất dùng cho người lớn tuổi, đối tác hoặc người mới gặp. 'Привет' là lời chào thân mật với bạn bè.`;
      } else {
        question = `[Ngoại ngữ - Tiếng Nga] Đại từ nhân xưng ngôi thứ nhất số ít "Tôi" trong tiếng Nga là gì?`;
        options = [`A. Я (Ya)`, `B. Ty (Ty)`, `C. Он (On)`, `D. Мы (My)`];
        correct = 0;
        explanation = `Trong tiếng Nga, 'Я' nghĩa là tôi, 'Ty' là bạn, 'Он' là anh ấy, và 'Мы' là chúng tôi.`;
      }
    } else if (subjectId === 'tieng-han') {
      if (qIdx === 0) {
        question = `[Ngoại ngữ - Tiếng Hàn] Chữ cái phụ âm cơ bản "ㄱ" trong tiếng Hàn (Hangeul) được gọi là gì?`;
        options = [`A. Gi-yeok`, `B. Ni-eun`, `C. Di-geut`, `D. Ri-eul`];
        correct = 0;
        explanation = `Phụ âm đầu tiên trong bảng chữ cái tiếng Hàn là 'ㄱ', được gọi là 'gi-yeok'.`;
      } else if (qIdx === 1) {
        question = `[Ngoại ngữ - Tiếng Hàn] Câu chào hỏi "Xin chào" lịch sự và thông dụng nhất là gì?`;
        options = [`A. 안녕하세요 (Annyeonghaseyo)`, `B. 감사합니다 (Gamsahamnida)`, `C. 사랑해요 (Saranghaeyo)`, `D. 죄송합니다 (Joesonghamnida)`];
        correct = 0;
        explanation = `'안녕하세요' (Annyeonghaseyo) là câu chào xã giao thông dụng, lịch sự và tự nhiên nhất dùng trong mọi tình huống hằng ngày.`;
      } else if (qIdx === 2) {
        question = `[Ngoại ngữ - Tiếng Hàn] Từ "Saranghae" (사랑해) có ý nghĩa là gì?`;
        options = [`A. Tôi yêu bạn / Anh yêu em`, `B. Xin cảm ơn`, `C. Xin lỗi nhé`, `D. Chúc ngủ ngon`];
        correct = 0;
        explanation = `'사랑해' (Saranghae) xuất phát từ động từ '사랑하다' (yêu), có nghĩa là Anh yêu em / Em yêu anh / Tôi yêu bạn.`;
      } else {
        question = `[Ngoại ngữ - Tiếng Hàn] Từ xưng hô "Oppa" (오빠) được sử dụng chính xác khi nào?`;
        options = [
          `A. Khi em gái gọi anh trai (hoặc bạn trai lớn tuổi hơn)`,
          `B. Khi em trai gọi anh trai ruột`,
          `C. Khi em gái gọi chị gái ruột`,
          `D. Khi em trai gọi chị gái ruột`
        ];
        correct = 0;
        explanation = `Trong văn hóa Hàn Quốc, '오빠' (Oppa) chỉ được dùng bởi phái nữ để gọi người đàn ông/anh trai lớn tuổi hơn có mối quan hệ thân thiết.`;
      }
    }
  } else if (subjectId === 'lich-su') {
    if (qIdx === 0) {
      question = `[Lịch sử 12] Ý nghĩa quyết định và vĩ đại nhất của Hội nghị thành lập Đảng Cộng sản Việt Nam (đầu năm 1930) là gì?`;
      options = [
        `A. Chấm dứt thời kỳ khủng hoảng sâu sắc về đường lối và giai cấp lãnh đạo cách mạng Việt Nam`,
        `B. Thành lập Mặt trận dân tộc thống nhất đầu tiên chống đế quốc`,
        `C. Đánh dấu sự thất bại hoàn toàn của thực dân Pháp xâm lược`,
        `D. Khai sinh ra nước Việt Nam Dân chủ Cộng hòa độc lập`
      ];
      correct = 0;
      explanation = `Đảng ra đời đầu năm 1930 với Cương lĩnh chính trị đầu tiên đúng đắn đã giải quyết triệt để tình trạng khủng hoảng đường lối cứu nước kéo dài, đưa cách mạng bước vào giai đoạn phát triển tự giác.`;
    } else if (qIdx === 1) {
      question = `[Lịch sử 12] Thắng lợi quân sự nào của quân và dân ta đã đập tan hoàn toàn kế hoạch Nava của thực dân Pháp, quyết định thắng lợi kháng chiến?`;
      options = [
        `A. Chiến dịch lịch sử Điện Biên Phủ năm 1954`,
        `B. Chiến dịch Biên giới Thu - Đông năm 1950`,
        `C. Chiến dịch Việt Bắc Thu - Đông năm 1947`,
        `D. Cuộc tổng tiến công và nổi dậy Xuân 1975`
      ];
      correct = 0;
      explanation = `Chiến thắng Điện Biên Phủ "lừng lẫy năm châu, chấn động địa cầu" năm 1954 đã giáng đòn quyết định đập tan hoàn toàn kế hoạch Nava, buộc Pháp phải ký Hiệp định Giơ-ne-vơ lập lại hòa bình ở Đông Dương.`;
    } else if (qIdx === 2) {
      question = `[Lịch sử 11] Phong trào Cần Vương chống Pháp cuối thế kỷ XIX bùng nổ trực tiếp sau sự kiện lịch sử nào?`;
      options = [
        `A. Cuộc phản công tại kinh thành Huế của phe chủ chiến và Chiếu Cần Vương được ban dụ năm 1885`,
        `B. Thực dân Pháp nổ súng tấn công bán đảo Sơn Trà (Đà Nẵng) năm 1858`,
        `C. Triều đình nhà Nguyễn ký Hiệp ước Giáp Tuất đầu hàng Pháp năm 1874`,
        `D. Cuộc khởi nghĩa Yên Thế bùng nổ mạnh mẽ tại Bắc Giang năm 1884`
      ];
      correct = 0;
      explanation = `Sau cuộc phản công kinh thành Huế thất bại, Tôn Thất Thuyết đưa vua Hàm Nghi ra Tân Sở (Quảng Trị) và nhân danh nhà vua ban dụ Cần Vương kêu gọi văn thân, sĩ phu và nhân dân giúp vua cứu nước.`;
    } else {
      question = `[Lịch sử 12] Thắng lợi nào đã buộc Mỹ phải tuyên bố ngừng hoàn toàn mọi hoạt động chống phá miền Bắc và ký Hiệp định Paris (1973)?`;
      options = [
        `A. Chiến thắng "Điện Biên Phủ trên không" cuối năm 1972`,
        `B. Cuộc Tổng tiến công và nổi dậy Tết Mậu Thân năm 1968`,
        `C. Cuộc Tiến công chiến lược năm 1972 trên toàn miền Nam`,
        `D. Chiến dịch giải phóng Tây Nguyên mùa xuân năm 1975`
      ];
      correct = 0;
      explanation = `Đập tan cuộc tập kích đường không bằng pháo đài bay B-52 của Mỹ vào Hà Nội, Hải Phòng (12 ngày đêm cuối năm 1972), quân dân ta đã lập nên kỳ tích "Điện Biên Phủ trên không", buộc Mỹ phải ký Hiệp định Paris rút quân về nước.`;
    }
  } else if (subjectId === 'vat-ly') {
    if (qIdx === 0) {
      question = `[Vật lý 12] Một vật dao động điều hòa theo phương trình x = A*cos(ωt + φ). Đại lượng ω được gọi là gì?`;
      options = [`A. Tần số góc của dao động`, `B. Pha ban đầu của dao động`, `C. Chu kỳ của dao động`, `D. Biên độ của dao động`];
      correct = 0;
      explanation = `Trong phương trình dao động điều hòa x = A*cos(ωt + φ), A là biên độ, ω là tần số góc, (ωt + φ) là pha dao động tại thời điểm t, φ là pha ban đầu.`;
    } else if (qIdx === 1) {
      question = `[Vật lý 11] Phát biểu nào sau đây biểu diễn đúng đắn nội dung Định luật Ôm đối với toàn mạch?`;
      options = [
        `A. Cường độ dòng điện tỉ lệ thuận with suất điện động của nguồn và tỉ lệ nghịch với điện trở toàn phần của mạch`,
        `B. Cường độ dòng điện chỉ tỉ lệ nghịch với điện trở trong của nguồn điện`,
        `C. Cường độ dòng điện tỉ lệ nghịch với suất điện động của nguồn điện`,
        `D. Cường độ dòng điện tỉ lệ thuận với điện trở ngoài của mạch kín`
      ];
      correct = 0;
      explanation = `Công thức định luật Ôm toàn mạch: I = ℰ / (R_ngoai + r_trong), nghĩa là cường độ dòng điện tỉ lệ thuận với suất điện động ℰ và tỉ lệ nghịch với điện trở toàn phần.`;
    } else if (qIdx === 2) {
      question = `[Vật lý 12] Trong thí nghiệm giao thoa ánh sáng Young, khoảng cách giữa hai vân sáng liên tiếp (khoảng vân i) được tính bằng công thức nào?`;
      options = [`A. i = λD / a`, `B. i = λa / D`, `C. i = aD / λ`, `D. i = λ / (aD)`];
      correct = 0;
      explanation = `Khoảng vân i là khoảng cách giữa hai vân sáng hoặc hai vân tối liên tiếp trên màn quan sát, có công thức tính là: i = λD/a.`;
    } else {
      question = `[Vật lý 11] Theo định luật cảm ứng điện từ Faraday, độ lớn của suất điện động cảm ứng xuất hiện trong mạch kín tỉ lệ thuận với đại lượng nào?`;
      options = [
        `A. Tốc độ biến thiên từ thông qua mạch kín đó`,
        `B. Độ lớn của từ trường bao quanh mạch kín`,
        `C. Diện tích mặt phẳng của vòng dây dẫn`,
        `D. Điện trở thuần của đoạn dây dẫn làm mạch`
      ];
      correct = 0;
      explanation = `Hệ thức Faraday: |e_c| = |ΔΦ / Δt|, suất điện động cảm ứng tỉ lệ thuận với tốc độ biến thiên từ thông qua mạch kín (ΔΦ/Δt là tốc độ biến thiên từ thông).`;
    }
  } else if (subjectId === 'hoa-hoc') {
    if (qIdx === 0) {
      question = `[Hóa học 12] Chất hữu cơ nào sau đây thuộc nhóm este, có mùi thơm quả chín và có công thức CH₃COOC₂H₅?`;
      options = [`A. Etyl axetat`, `B. Metyl fomat`, `C. Metyl axetat`, `D. Vinyl axetat`];
      correct = 0;
      explanation = `CH₃COOC₂H₅ là công thức của este Etyl axetat, thủy phân tạo ra axit axetic (CH₃COOH) và ancol etylic (C₂H₅OH).`;
    } else if (qIdx === 1) {
      question = `[Hóa học 12] Thí nghiệm nào sau đây dùng để chứng minh glucozơ (C₆H₁₂O₆) có chứa nhóm chức anđehit (-CHO) trong phân tử?`;
      options = [
        `A. Thực hiện phản ứng tráng bạc với dung dịch AgNO₃ trong NH₃`,
        `B. Cho glucozơ phản ứng với kim loại kiềm Natri giải phóng H₂`,
        `C. Đun nóng dung dịch glucozơ với axit sunfuric loãng`,
        `D. Thực hiện phản ứng lên men rượu tạo ra khí cacbonic`
      ];
      correct = 0;
      explanation = `Glucozơ có chứa nhóm chức anđehit (-CHO) ở dạng mạch hở nên có khả năng khử phức bạc amoniac tạo ra kết tủa bạc bám vào thành ống nghiệm (phản ứng tráng bạc).`;
    } else if (qIdx === 2) {
      question = `[Hóa học 11] Axit nitric (HNO₃) đặc, nguội có thể bị thụ động hóa (không phản ứng) với những kim loại nào sau đây?`;
      options = [`A. Al, Fe, Cr`, `B. Cu, Ag, Au`, `C. Na, K, Ca`, `D. Mg, Zn, Pb`];
      correct = 0;
      explanation = `Các kim loại Nhôm (Al), Sắt (Fe) và Crom (Cr) bị thụ động hóa trong dung dịch axit HNO₃ đặc, nguội và H₂SO₄ đặc, nguội do tạo ra màng oxit bền vững bảo vệ bề mặt kim loại.`;
    } else {
      question = `[Hóa học 11] Khi cho ancol etylic (C₂H₅OH) tác dụng trực tiếp với kim loại kiềm Natri (Na) dư, hiện tượng quan sát được là gì?`;
      options = [
        `A. Kim loại Na tan dần và có bọt khí không màu thoát ra mạnh mẽ`,
        `B. Xuất hiện kết tủa màu xanh lam dưới đáy ống nghiệm`,
        `C. Dung dịch chuyển sang màu đỏ sẫm và tỏa nhiều khói đen`,
        `D. Không xảy ra bất kỳ hiện tượng hay phản ứng hóa học nào`
      ];
      correct = 0;
      explanation = `Ancol etylic có nhóm -OH linh động nên phản ứng thế nguyên tử H của nhóm -OH bằng kim loại kiềm giải phóng khí hiđrô: 2C₂H₅OH + 2Na -> 2C₂H₅ONa + H₂↑.`;
    }
  } else if (subjectId === 'sinh-hoc') {
    if (qIdx === 0) {
      question = `[Sinh học 12] Quá trình tự nhân đôi (tái bản) của phân tử ADN kép diễn ra dựa trên những nguyên tắc cốt lõi nào?`;
      options = [
        `A. Nguyên tắc bổ sung và nguyên tắc bán bảo toàn`,
        `B. Nguyên tắc một chiều và nguyên tắc tự do`,
        `C. Nguyên tắc phân ly độc lập và tổ hợp tự do`,
        `D. Nguyên tắc bổ sung và nguyên tắc thoái hóa`
      ];
      correct = 0;
      explanation = `Nhân đôi ADN diễn ra theo nguyên tắc bổ sung (A-T, G-X) và bán bảo toàn (giữ lại một nửa: trong mỗi phân tử ADN con có một mạch của ADN mẹ và một mạch mới tổng hợp).`;
    } else if (qIdx === 1) {
      question = `[Sinh học 12] Theo thuyết tiến hóa hiện đại, nhân tố tiến hóa nào sau đây có vai trò định hướng quá trình tích lũy biến dị có lợi?`;
      options = [`A. Chọn lọc tự nhiên`, `B. Các yếu tố ngẫu nhiên`, `C. Đột biến gen`, `D. Di - nhập gen`];
      correct = 0;
      explanation = `Chọn lọc tự nhiên là nhân tố tiến hóa duy nhất có hướng, giữ lại các kiểu gen thích nghi và đào thải kiểu gen kém thích nghi, định hướng tiến hóa thích nghi.`;
    } else if (qIdx === 2) {
      question = `[Sinh học 11] Vai trò cốt lõi của quá trình quang hợp ở thực vật đối với toàn bộ sự sống trên Trái Đất là gì?`;
      options = [
        `A. Chuyển hóa quang năng thành hóa năng trong chất hữu cơ, cung cấp nguồn thức ăn và O₂ giải phóng ra khí quyển`,
        `B. Chuyển hóa toàn bộ năng lượng ATP thành năng lượng nhiệt tỏa ra không gian`,
        `C. Phân giải các chất hữu cơ phức tạp thành chất vô cơ đơn giản trả lại môi trường`,
        `D. Hấp thụ khí ôxi và giải phóng khí cacbonic duy trì chu trình tuần hoàn khí`
      ];
      correct = 0;
      explanation = `Quang hợp sử dụng năng lượng ánh sáng mặt trời để tổng hợp chất hữu cơ (cacbohiđrat) từ CO₂ và H₂O, đồng thời giải phóng O₂, cung cấp năng lượng và dưỡng khí nuôi sống sinh giới.`;
    } else {
      question = `[Sinh học 11] Ở động vật có hệ tuần hoàn kép (như thú, chim), máu đi nuôi cơ thể là loại máu nào và xuất phát từ đâu?`;
      options = [
        `A. Máu giàu O₂ (đỏ tươi), xuất phát từ tâm thất trái`,
        `B. Máu giàu CO₂ (đỏ thẫm), xuất phát từ tâm nhĩ phải`,
        `C. Máu pha trộn, xuất phát từ tâm thất chung của tim`,
        `D. Máu nghèo dinh dưỡng, xuất phát từ tâm thất phải`
      ];
      correct = 0;
      explanation = `Ở chim và thú, tim có 4 ngăn hoàn chỉnh, máu đi nuôi cơ thể là máu đỏ tươi giàu O₂ đi ra từ tâm thất trái qua động mạch chủ, bảo đảm hiệu suất trao đổi chất cao nhất.`;
    }
  } else if (subjectId === 'dia-ly') {
    if (qIdx === 0) {
      question = `[Địa lý 12] Lãnh thổ nước ta nằm hoàn toàn trong vùng nội chí tuyến bán cầu Bắc nên khí hậu có đặc điểm nào?`;
      options = [
        `A. Tổng bức xạ lớn, cán cân bức xạ luôn dương và nhiệt độ trung bình năm cao`,
        `B. Thường xuyên chịu ảnh hưởng của các khối khí cực lạnh giá từ phương Bắc`,
        `C. Lượng mưa cực kỳ thấp dẫn đến hình thành các hoang mạc cát lớn`,
        `D. Biên độ nhiệt ngày đêm và các mùa trong năm hoàn toàn bằng không`
      ];
      correct = 0;
      explanation = `Nằm trong vùng nội chí tuyến bán cầu Bắc mang lại cho nước ta nguồn nhiệt dồi dào, cán cân bức xạ quanh năm dương và nhiệt độ trung bình năm vượt trên 20°C (trừ vùng núi cao).`;
    } else if (qIdx === 1) {
      question = `[Địa lý 12] Vùng kinh tế nào của nước ta hiện nay đang dẫn đầu về giá trị sản xuất công nghiệp và thu hút vốn đầu tư FDI lớn nhất?`;
      options = [`A. Đông Nam Bộ`, `B. Đồng bằng sông Hồng`, `C. Duyên hải Nam Trung Bộ`, `D. Đồng bằng sông Cửu Long`];
      correct = 0;
      explanation = `Đông Nam Bộ là vùng kinh tế động lực phát triển năng động nhất cả nước, hội tụ đầy đủ thế mạnh về vị trí, hạ tầng, lao động kỹ thuật và chính sách thu hút FDI vượt trội.`;
    } else if (qIdx === 2) {
      question = `[Địa lý 11] Mục tiêu cốt lõi của Hiệp hội các quốc gia Đông Nam Á (ASEAN) khi thành lập và phát triển là gì?`;
      options = [
        `A. Thúc đẩy hòa bình, ổn định, hợp tác kinh tế, văn hóa và phát triển tiến bộ xã hội giữa các nước thành viên`,
        `B. Xây dựng một liên minh quân sự khép kín nhằm đối đầu trực tiếp với các khối ngoài khu vực`,
        `C. Thiết lập một quốc gia liên bang duy nhất sử dụng chung một hiến pháp và đồng tiền`,
        `D. Xóa bỏ hoàn toàn biên giới hành chính quốc gia của tất cả các nước thành viên`
      ];
      correct = 0;
      explanation = `ASEAN được thành lập nhằm thúc đẩy sự tăng trưởng kinh tế, tiến bộ xã hội và phát triển văn hóa trong khu vực thông qua các nỗ lực chung trên tinh thần bình đẳng và hợp tác hữu nghị.`;
    } else {
      question = `[Địa lý 11] Tổ chức liên kết kinh tế - chính trị khu vực nào được đánh giá là thành công và chặt chẽ nhất thế giới hiện nay?`;
      options = [
        `A. Liên minh châu Âu (EU)`,
        `B. Diễn đàn Hợp tác Kinh tế châu Á - Thái Bình Dương (APEC)`,
        `C. Hiệp hội các quốc gia Đông Nam Á (ASEAN)`,
        `D. Tổ chức Thương mại Thế giới (WTO)`
      ];
      correct = 0;
      explanation = `Liên minh châu Âu (EU) là mô hình liên kết toàn diện từ kinh tế, tiền tệ (đồng Euro), pháp luật đến chính trị xã hội, hình thành một thị trường chung tự do lưu thông hàng hóa, dịch vụ, con người và tiền tệ.`;
    }
  } else if (subjectId === 'gdktepl') {
    if (qIdx === 0) {
      question = `[GD Kinh tế & Pháp luật 11] Quy luật kinh tế nào chi phối trực tiếp mối quan hệ giữa người bán và người mua, quyết định giá cả thị trường?`;
      options = [`A. Quy luật cung - cầu`, `B. Quy luật giá trị thặng dư`, `C. Quy luật lưu thông tiền tệ`, `D. Quy luật cạnh tranh độc quyền`];
      correct = 0;
      explanation = `Quy luật cung - cầu điều tiết trực tiếp hành vi kinh doanh của người bán và nhu cầu mua sắm của người mua, từ đó hình thành nên giá cả cân bằng trên thị trường tự do.`;
    } else if (qIdx === 1) {
      question = `[GD Kinh tế & Pháp luật 12] Theo quy định pháp luật, không ai bị bắt nếu không có quyết định của Tòa án hoặc phê chuẩn của Viện kiểm sát thể hiện quyền nào?`;
      options = [
        `A. Quyền bất khả xâm phạm về thân thể của công dân`,
        `B. Quyền được pháp luật bảo hộ về tính mạng, sức khỏe`,
        `C. Quyền tự do cư trú và đi lại hợp pháp của công dân`,
        `D. Quyền bình đẳng trước pháp luật không phân biệt đối xử`
      ];
      correct = 0;
      explanation = `Quyền bất khả xâm phạm về thân thể quy định rõ: không một cơ quan, cá nhân nào được tự ý bắt, giam giữ người nếu không có quyết định phê chuẩn đúng thẩm quyền tố tụng tư pháp pháp luật.`;
    } else if (qIdx === 2) {
      question = `[GD Kinh tế & Pháp luật 12] Quyền dân chủ cơ bản nào giúp công dân từ đủ 18 tuổi trở lên trực tiếp tham gia vào việc thành lập các cơ quan quyền lực nhà nước?`;
      options = [`A. Quyền bầu cử`, `B. Quyền ứng cử tự do`, `C. Quyền khiếu nại, tố cáo`, `D. Quyền tự do ngôn luận`];
      correct = 0;
      explanation = `Quyền bầu cử là quyền dân chủ cơ bản của công dân Việt Nam từ đủ 18 tuổi trở lên, thể hiện ý chí và quyền làm chủ của nhân dân đối với đất nước.`;
    } else {
      question = `[GD Kinh tế & Pháp luật 11] Hiện tượng mức giá chung của các mặt hàng và dịch vụ tăng lên một cách liên tục theo thời gian được gọi là gì?`;
      options = [`A. Lạm phát`, `B. Giảm phát`, `C. Thất nghiệp`, `D. Khủng hoảng kinh tế`];
      correct = 0;
      explanation = `Lạm phát là hiện tượng tăng mức giá chung một cách liên tục của hàng hóa và dịch vụ theo thời gian, làm giảm sức mua của đồng tiền tệ xã hội.`;
    }
  } else if (subjectId === 'tin-hoc') {
    if (qIdx === 0) {
      question = `[Tin học 12] Trong một bảng dữ liệu của hệ CSDL quan hệ, thuộc tính dùng để xác định duy nhất một bản ghi được gọi là gì?`;
      options = [`A. Khóa chính (Primary Key)`, `B. Khóa ngoài (Foreign Key)`, `C. Trường dữ liệu chính`, `D. Chỉ mục liên kết`];
      correct = 0;
      explanation = `Khóa chính (Primary Key) là một hoặc một tập hợp thuộc tính có giá trị không rỗng và duy nhất trong một bảng, dùng để định danh duy nhất cho từng bản ghi (dòng).`;
    } else if (qIdx === 1) {
      question = `[Tin học 12] Hệ quản trị cơ sở dữ liệu quan hệ (RDBMS) là loại phần mềm có chức năng cốt lõi nào?`;
      options = [
        `A. Cung cấp môi trường để tạo lập, lưu trữ, cập nhật và khai thác thông tin từ cơ sở dữ liệu quan hệ`,
        `B. Là hệ điều hành dùng để điều khiển hoạt động của các máy tính thế hệ mới`,
        `C. Dùng để biên dịch các chương trình ngôn ngữ Python sang mã máy trực tiếp`,
        `D. Công cụ thiết kế đồ họa 3D chuyển động chuyên nghiệp cho kỹ sư phần mềm`
      ];
      correct = 0;
      explanation = `Hệ quản trị CSDL quan hệ cung cấp các công cụ khai thác thông tin, bảo mật dữ liệu, xử lý tranh chấp dữ liệu và đảm bảo tính toàn vẹn thông tin một cách tối ưu.`;
    } else if (qIdx === 2) {
      question = `[Tin học 11] Trong ngôn ngữ lập trình Python, vòng lặp "while" được sử dụng tối ưu trong trường hợp nào?`;
      options = [
        `A. Khi số lần lặp của khối lệnh chưa được biết trước và phụ thuộc vào điều kiện kiểm tra`,
        `B. Khi số lần lặp của khối lệnh đã được xác định trước một cách cố định`,
        `C. Khi cần định nghĩa một hàm chức năng mới trong thư viện`,
        `D. Khi cần khai báo danh sách các biến số nguyên cục bộ`
      ];
      correct = 0;
      explanation = `Vòng lặp "while" liên tục thực thi khối lệnh bên trong chừng nào điều kiện kiểm tra còn nhận giá trị True. Phù hợp cho bài toán lặp với số lần chưa biết trước.`;
    } else {
      question = `[Tin học 11] Giao thức chuẩn TCP/IP hoạt động trên mạng Internet giữ vai trò quan trọng nào sau đây?`;
      options = [
        `A. Định nghĩa quy tắc truyền tải, đóng gói dữ liệu và định tuyến gói tin chính xác giữa các thiết bị trên mạng`,
        `B. Tự động nâng cấp cấu hình phần cứng máy tính lên phiên bản mạnh mẽ hơn`,
        `C. Diệt trừ tất cả các mã độc ẩn chứa trong các tệp tin lưu trữ cục bộ`,
        `D. Tạo ra kết nối mạng có tốc độ ánh sáng truyền qua dây dẫn đồng bình thường`
      ];
      correct = 0;
      explanation = `TCP/IP là bộ giao thức truyền thông chuẩn giúp thiết lập quy chuẩn kết nối, truyền tải dữ liệu, phân mảnh và đóng gói các gói tin để chuyển đi chính xác trong mạng toàn cầu.`;
    }
  } else if (subjectId === 'cn-cong-nghiep') {
    if (qIdx === 0) {
      question = `[Công nghệ 11 - Cơ khí] Trong động cơ đốt trong 4 kỳ kì nào là kì duy nhất sinh công lực đẩy pittông chuyển động?`;
      options = [`A. Kỳ cháy - giãn nở (Kỳ nổ)`, `B. Kỳ nạp nhiên liệu`, `C. Kỳ nén hỗn hợp`, `D. Kỳ thải khí sạch`];
      correct = 0;
      explanation = `Chu trình hoạt động của động cơ 4 kỳ gồm: Nạp - Nén - Nổ (cháy giãn nở) - Thải. Trong đó, chỉ có kỳ Nổ là kỳ sinh công lực đẩy pít-tông đi xuống làm quay trục khuỷu.`;
    } else if (qIdx === 1) {
      question = `[Công nghệ 12 - Điện] Linh kiện điện tử bán dẫn có tiếp giáp p-n, chỉ cho dòng điện đi qua một chiều duy nhất là linh kiện nào?`;
      options = [`A. Điốt bán dẫn (Diode)`, `B. Điện trở thuần`, `C. Tụ điện hóa học`, `D. Tranzito bán dẫn`];
      correct = 0;
      explanation = `Điốt bán dẫn cấu tạo từ một lớp tiếp giáp p-n, có đặc tính dẫn điện đơn hướng (chỉ cho dòng điện chạy từ Anốt sang Catốt), thường dùng chỉnh lưu dòng điện xoay chiều.`;
    } else if (qIdx === 2) {
      question = `[Công nghệ 11 - Vẽ kỹ thuật] Trong phương pháp chiếu góc thứ nhất của bản vẽ kỹ thuật, vị trí của hình chiếu bằng được bố trí ở đâu?`;
      options = [
        `A. Ở dưới hình chiếu đứng`,
        `B. Ở trên hình chiếu đứng`,
        `C. Ở bên phải hình chiếu đứng`,
        `D. Ở bên trái hình chiếu đứng`
      ];
      correct = 0;
      explanation = `Tiêu chuẩn vẽ kỹ thuật quy định: trong chiếu góc thứ nhất, hình chiếu bằng nằm dưới hình chiếu đứng, hình chiếu cạnh nằm bên phải hình chiếu đứng.`;
    } else {
      question = `[Công nghệ 12 - Điện] Thiết bị điện tự động đóng ngắt mạch điện khi xảy ra sự cố quá tải hoặc ngắn mạch trong gia đình là?`;
      options = [`A. Aptomat (Cầu dao tự động)`, `B. Công tắc xoay chiều`, `C. Biến áp tự ngẫu`, `D. Rơle thời gian`];
      correct = 0;
      explanation = `Aptomat (MCB/MCCB) là thiết bị bảo vệ tối ưu, tự động ngắt nguồn điện khi phát hiện dòng điện vượt ngưỡng an toàn (quá tải) hoặc có chập mạch (ngắn mạch).`;
    }
  } else {
    if (qIdx === 0) {
      question = `[Công nghệ 10 - Nông nghiệp] Phân bón vô cơ hỗn hợp NPK cung cấp cho cây trồng những nguyên tố dinh dưỡng đa lượng thiết yếu nào?`;
      options = [
        `A. Nitơ (Đạm), Phốtpho (Lân), Kali`,
        `B. Natri, Phốtpho, Canxi`,
        `C. Cacbon, Hiđrô, Ôxi`,
        `D. Sắt, Đồng, Kẽm`
      ];
      correct = 0;
      explanation = `NPK là viết tắt ký hiệu hóa học của Đạm (N), Lân (P) và Kali (K). Đây là ba nguyên tố đa lượng quan trọng nhất thúc đẩy cây sinh trưởng, đẻ nhánh và ra hoa nuôi trái.`;
    } else if (qIdx === 1) {
      question = `[Công nghệ 11 - Nông nghiệp] Ưu điểm lớn nhất của phương pháp giâm cành so với gieo hạt truyền thống trong nhân giống cây trồng là gì?`;
      options = [
        `A. Giữ nguyên vẹn các đặc tính di truyền quý báu của cây mẹ và cho thu hoạch nhanh hơn`,
        `B. Tạo ra nhiều biến dị tổ hợp mới lạ phục vụ chọn giống nâng cao`,
        `C. Cây giống có bộ rễ cọc cắm sâu vào lòng đất chắc chắn hơn`,
        `D. Không cần tốn công tưới nước chăm sóc giai đoạn đầu gieo trồng`
      ];
      correct = 0;
      explanation = `Giâm cành là phương thức sinh sản vô tính, cây con được sinh ra từ tế bào sinh dưỡng của cây mẹ nên bảo tồn hoàn hảo kiểu gen và tính trạng tốt của cây mẹ.`;
    } else if (qIdx === 2) {
      question = `[Công nghệ 10 - Nông nghiệp] Biện pháp đấu tranh sinh học bảo vệ thực vật sử dụng loài sinh vật nào dưới đây để tiêu diệt sâu hại vườn?`;
      options = [
        `A. Các loài thiên địch tự nhiên (như bọ rùa, ong ký sinh, chim ăn sâu)`,
        `B. Các giống sâu bọ có khả năng kháng thuốc trừ sâu hóa học`,
        `C. Các sinh vật ngoại lai có tốc độ sinh sản cực nhanh xâm lấn`,
        `D. Các loài vi khuẩn gây thối rễ hàng loạt trên diện rộng`
      ];
      correct = 0;
      explanation = `Đấu tranh sinh học dùng thiên địch khống chế số lượng sâu hại dưới ngưỡng gây hại, đây là xu hướng nông nghiệp sạch bền vững, không gây ô nhiễm môi trường và nông sản.`;
    } else {
      question = `[Công nghệ 11 - Nông nghiệp] Mô hình canh tác rau sạch trong nhà màng mang lại lợi ích công nghệ nổi bật nào sau đây?`;
      options = [
        `A. Tránh các tác động bất lợi của thời tiết bão gió và ngăn chặn côn trùng phá hoại, giảm tối đa phun thuốc hóa học`,
        `B. Giúp cây trồng phát triển hoàn toàn mà không cần đến ánh sáng mặt trời tự nhiên`,
        `C. Loại bỏ hoàn toàn sự cần thiết của việc bón phân vi sinh định kỳ`,
        `D. Thích hợp cho việc trồng cây đại thụ lâu năm lấy gỗ xuất khẩu`
      ];
      correct = 0;
      explanation = `Nhà màng (nhà kính) tạo ra môi trường vi khí hậu tối ưu, ngăn chặn chim thú và côn trùng phá hoại hiệu quả, giúp sản xuất rau quả hữu cơ sạch, an toàn chất lượng cao.`;
    }
  }

  // Để tránh cảnh báo no-unused-vars khi build
  if (false) {
    _generateQuestion_old(subjectId, index);
  }

  return { question, options, correct, explanation };
}

function _generateQuestion_old(subjectId: string, index: number) {
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

  const [completedMap, setCompletedMap] = useState<Record<string, number[]>>(() => {
    const map: Record<string, number[]> = {};
    SUBJECTS.forEach(sub => {
      try {
        const savedCompleted = localStorage.getItem(`user_completed_questions_${sub.id}`);
        if (savedCompleted) {
          map[sub.id] = JSON.parse(savedCompleted);
        } else {
          // Fallback lấy từ answeredMap (những câu đúng đã làm trước đó)
          const savedAnswered = localStorage.getItem(`user_answered_questions_${sub.id}`);
          map[sub.id] = savedAnswered ? JSON.parse(savedAnswered) : [];
        }
      } catch {
        map[sub.id] = [];
      }
    });
    return map;
  });

  const [attemptsMap, setAttemptsMap] = useState<Record<string, number>>(() => {
    const map: Record<string, number> = {};
    SUBJECTS.forEach(sub => {
      try {
        const saved = localStorage.getItem(`user_attempts_${sub.id}`);
        map[sub.id] = saved ? Number(saved) : 0;
      } catch {
        map[sub.id] = 0;
      }
    });
    return map;
  });

  const [currentQuestionIndex, setCurrentQuestionIndex] = useState<number>(0);
  const [selectedAns, setSelectedAns] = useState<number | null>(null);
  const [hasAnswered, setHasAnswered] = useState(false);
  const [examScore, setExamScore] = useState(() => Number(localStorage.getItem('user_exam_score') || '0'));
  const [leaderboard, setLeaderboard] = useState<any[]>([]);

  // Lắng nghe thay đổi completedMap và selectedSubject để cập nhật câu hỏi chưa làm tiếp theo
  useEffect(() => {
    const completed = completedMap[selectedSubject] || [];
    let foundIndex = -1;
    for (let i = 0; i < 50; i++) {
      if (!completed.includes(i)) {
        foundIndex = i;
        break;
      }
    }
    setCurrentQuestionIndex(foundIndex);
    setSelectedAns(null);
    setHasAnswered(false);
  }, [selectedSubject, completedMap]);

  // Đồng bộ điểm lên Firestore
  useEffect(() => {
    if (isLoggedIn && uid) {
      const userRef = doc(db, 'exam_leaderboard', uid);
      setDoc(userRef, {
        uid,
        displayName: displayName || "Sĩ tử ẩn danh",
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
      
      list.sort((a, b) => b.score - a.score);
      setLeaderboard(list.slice(0, 10));
    }, (err) => {
      console.error("Error loading leaderboard:", err);
      setLeaderboard([]);
    });

    return () => unsubscribe();
  }, []);

  const handleAnswerClick = (index: number) => {
    if (hasAnswered || currentQuestionIndex === -1) return;
    setSelectedAns(index);
    setHasAnswered(true);
    
    // Đánh dấu câu hỏi này đã hoàn thành (dù đúng hay sai)
    const currentCompleted = completedMap[selectedSubject] || [];
    if (!currentCompleted.includes(currentQuestionIndex)) {
      const updatedCompleted = [...currentCompleted, currentQuestionIndex];
      const newCompletedMap = {
        ...completedMap,
        [selectedSubject]: updatedCompleted
      };
      setCompletedMap(newCompletedMap);
      localStorage.setItem(`user_completed_questions_${selectedSubject}`, JSON.stringify(updatedCompleted));
    }

    // Tăng tổng số câu đã làm của môn này lên 1
    const currentAttempts = attemptsMap[selectedSubject] || 0;
    const newAttempts = currentAttempts + 1;
    const updatedAttemptsMap = {
      ...attemptsMap,
      [selectedSubject]: newAttempts
    };
    setAttemptsMap(updatedAttemptsMap);
    localStorage.setItem(`user_attempts_${selectedSubject}`, String(newAttempts));

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
    const completed = completedMap[selectedSubject] || [];
    let foundIndex = -1;
    for (let i = 0; i < 50; i++) {
      if (!completed.includes(i)) {
        foundIndex = i;
        break;
      }
    }
    setCurrentQuestionIndex(foundIndex);
  };

  const handleResetSubject = () => {
    const newCompletedMap = {
      ...completedMap,
      [selectedSubject]: []
    };
    setCompletedMap(newCompletedMap);
    localStorage.setItem(`user_completed_questions_${selectedSubject}`, JSON.stringify([]));

    const newMap = {
      ...answeredMap,
      [selectedSubject]: []
    };
    setAnsweredMap(newMap);
    localStorage.setItem(`user_answered_questions_${selectedSubject}`, JSON.stringify([]));

    const newAttemptsMap = {
      ...attemptsMap,
      [selectedSubject]: 0
    };
    setAttemptsMap(newAttemptsMap);
    localStorage.setItem(`user_attempts_${selectedSubject}`, '0');

    setCurrentQuestionIndex(0);
    setSelectedAns(null);
    setHasAnswered(false);
  };

  // 4. Biến động điểm số của sĩ tử tự học ở các môn ÔN THI ĐẠI HỌC
  const mainSubjectsList = [
    { id: 'toan', code: 'TOÁN', name: 'Môn Toán' },
    { id: 'van', code: 'VĂN', name: 'Ngữ văn' },
    { id: 'tieng-anh', code: 'ANH', name: 'Tiếng Anh' },
    { id: 'lich-su', code: 'SỬ', name: 'Lịch sử' },
    { id: 'vat-ly', code: 'LÝ', name: 'Vật lý' },
    { id: 'hoa-hoc', code: 'HÓA', name: 'Hóa học' },
    { id: 'sinh-hoc', code: 'SINH', name: 'Sinh học' },
    { id: 'dia-ly', code: 'ĐỊA', name: 'Địa lý' },
  ];

  const [forecastTrends, setForecastTrends] = useState<Record<string, number>>({
    toan: 1.2,
    van: 0.5,
    'tieng-anh': 2.1,
    'lich-su': 1.0,
    'vat-ly': -0.8,
    'hoa-hoc': 1.5,
    'sinh-hoc': 0.8,
    'dia-ly': 1.1,
  });

  const updateMarketPrice = () => {
    setForecastTrends(prev => {
      const next: Record<string, number> = {};
      mainSubjectsList.forEach(sub => {
        const delta = parseFloat((Math.random() * 5 - 2.3).toFixed(1)); // -2.3% đến +2.7%
        next[sub.id] = parseFloat((Math.min(Math.max((prev[sub.id] || 0) + delta, -15), 15)).toFixed(1));
      });
      return next;
    });
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

  // Tính toán chỉ số đúng sai cho môn học đang chọn
  const selectedSubjectCorrect = (answeredMap[selectedSubject] || []).length;
  const selectedSubjectCompleted = (completedMap[selectedSubject] || []).length;
  const selectedSubjectAttempts = Math.max(attemptsMap[selectedSubject] || 0, selectedSubjectCompleted);
  const selectedSubjectWrong = Math.max(0, selectedSubjectAttempts - selectedSubjectCorrect);
  const selectedSubjectRate = selectedSubjectAttempts > 0 ? parseFloat(((selectedSubjectCorrect / selectedSubjectAttempts) * 100).toFixed(1)) : 0.0;
  const selectedSubjectWrongRate = selectedSubjectAttempts > 0 ? parseFloat((100 - selectedSubjectRate).toFixed(1)) : 0.0;

  // Tính tổng quan tất cả các môn
  let totalAllCorrect = 0;
  let totalAllCompleted = 0;
  let totalAllAttempts = 0;
  SUBJECTS.forEach(sub => {
    const subCorrect = (answeredMap[sub.id] || []).length;
    const subCompleted = (completedMap[sub.id] || []).length;
    const subAttempts = Math.max(attemptsMap[sub.id] || 0, subCompleted);

    totalAllCorrect += subCorrect;
    totalAllCompleted += subCompleted;
    totalAllAttempts += subAttempts;
  });
  const totalAllRate = totalAllAttempts > 0 ? parseFloat(((totalAllCorrect / totalAllAttempts) * 100).toFixed(1)) : 0.0;

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
                <span className="hidden md:inline">Đọc sách gốc</span>
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
            
            {/* INDICATORS CARD -> CHỈ SỐ ĐÚNG SAI */}
            <div className="border border-[#2D3D54]/30 bg-[#151C28] p-4 rounded-xl relative shadow-lg text-[#ECEFF4]">
              <div className="absolute top-1 right-2 p-1 text-[#A2B6CD]/20 font-alegreya text-2xl font-bold select-none pointer-events-none">
                {selectedSubjectRate}%
              </div>
              <h2 className="text-xs font-lora tracking-widest text-[#A2B6CD] uppercase border-b border-[#2D3D54]/40 pb-2 mb-4 flex items-center gap-2 font-bold">
                <BarChart2 className="w-3.5 h-3.5 text-[#A2B6CD]" /> CHỈ SỐ ĐÚNG SAI
              </h2>
              
              <div className="flex flex-col gap-3">
                <div className="flex flex-col gap-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-[#ECEFF4]/70 font-lora font-semibold">Môn đang chọn: {SUBJECTS.find(s => s.id === selectedSubject)?.name}</span>
                  </div>
                  <div className="flex items-center justify-between mt-1 text-[11px]">
                    <span className="text-[#ECEFF4]/60">Đã làm: {selectedSubjectAttempts} câu</span>
                    <span className="text-[#A2B6CD] font-bold">Tỉ lệ đúng: {selectedSubjectRate}%</span>
                  </div>
                </div>

                {/* Thanh tỉ lệ đúng sai của môn đang chọn */}
                <div className="w-full bg-red-950/40 h-2 rounded-full overflow-hidden flex">
                  <div 
                    className="bg-[#A2B6CD] h-full transition-all duration-500" 
                    style={{ width: `${selectedSubjectRate}%` }} 
                    title={`Đúng: ${selectedSubjectRate}%`}
                  />
                  <div 
                    className="bg-red-500/60 h-full transition-all duration-500" 
                    style={{ width: `${selectedSubjectWrongRate}%` }} 
                    title={`Sai: ${selectedSubjectWrongRate}%`}
                  />
                </div>

                <div className="flex justify-between text-[10px] text-[#ECEFF4]/50 border-b border-[#2D3D54]/20 pb-2">
                  <span className="flex items-center gap-1"><Check className="w-3 h-3 text-[#A2B6CD]" /> Đúng: {selectedSubjectCorrect}</span>
                  <span className="flex items-center gap-1"><X className="w-3 h-3 text-red-400" /> Sai: {selectedSubjectWrong}</span>
                </div>

                {/* Tổng quan toàn bộ các môn */}
                <div className="mt-1 flex flex-col gap-1">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-[#ECEFF4]/70">Tổng kết tất cả các môn:</span>
                    <span className="font-bold text-[#ECEFF4]">{totalAllCorrect} / {totalAllAttempts} câu</span>
                  </div>
                  <div className="flex items-center justify-between text-[10px] text-[#A2B6CD] font-semibold">
                    <span>Độ chính xác toàn khóa:</span>
                    <span>{totalAllRate}%</span>
                  </div>
                </div>
              </div>
            </div>

            {/* COMMERCE / INVESTMENT WATCH (BIẾN ĐỘNG ĐIỂM SỐ CỦA SĨ TỬ) */}
            <div className="border border-[#2D3D54]/30 bg-[#151C28] p-4 rounded-xl relative shadow-lg text-[#ECEFF4]">
              <h2 className="text-xs font-lora tracking-widest text-[#A2B6CD] uppercase border-b border-[#2D3D54]/40 pb-2 mb-3.5 flex items-center gap-2 font-bold">
                <TrendingUp className="w-4 h-4 text-[#A2B6CD]" /> BIẾN ĐỘNG ĐIỂM SỐ
              </h2>

              <div className="flex flex-col gap-3 text-xs">
                {mainSubjectsList.map((item) => {
                  const correct = (answeredMap[item.id] || []).length;
                  const total = attemptsMap[item.id] || 0;
                  const score = total > 0 ? parseFloat(((correct / total) * 10).toFixed(2)) : 0.0;
                  const change = forecastTrends[item.id] || 0.0;
                  
                  // Mô tả dựa trên điểm trung bình
                  let desc = "Chưa tham gia kiểm tra năng lực môn này.";
                  if (total > 0) {
                    if (score < 5.0) {
                      desc = "Cần nỗ lực củng cố kiến thức căn bản gấp!";
                    } else if (score < 8.0) {
                      desc = "Phong độ khá tốt. Hãy rèn luyện thêm phản xạ.";
                    } else {
                      desc = "Tuyệt vời! Đang đạt trình độ của một Thủ Khoa.";
                    }
                  }

                  return (
                    <div key={item.id} className="flex flex-col gap-0.5 border-b border-[#2D3D54]/10 pb-2 last:border-0 last:pb-0">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-[#ECEFF4] font-lora flex items-center gap-1.5">
                          <span className="text-[10px] bg-[#A2B6CD]/10 text-[#A2B6CD] border border-[#A2B6CD]/20 px-1 py-0.1 rounded font-bold">
                            {item.code}
                          </span>
                          {item.name}
                        </span>
                        <span className={`font-bold font-lora text-[11px] ${change >= 0 ? "text-[#A2B6CD]" : "text-red-400"}`}>
                          {score.toFixed(2)} đ ({change >= 0 ? "+" : ""}{change}%)
                        </span>
                      </div>
                      <span className="text-[10px] text-[#ECEFF4]/50 leading-normal">
                        {desc}
                      </span>
                    </div>
                  );
                })}

                <button
                  onClick={updateMarketPrice}
                  className="w-full mt-1.5 py-2 border border-[#2D3D54]/30 hover:border-[#A2B6CD] text-xs font-lora text-[#101622] bg-[#A2B6CD] hover:bg-[#ECEFF4] transition-all rounded uppercase font-bold"
                >
                  Cập nhật xu hướng học tập
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
                <div className="bg-[#101622] border border-[#2D3D54]/30 rounded-lg p-3.5">
                  <h3 className="font-alegreya text-sm font-bold text-[#ECEFF4] mb-2">
                    1. Lê Dung - thụ
                  </h3>
                  <div className="space-y-1 text-[11px] text-[#ECEFF4]/75">
                    <p>Thiên tài sinh học</p>
                    <p>Cao quý lạnh lùng</p>
                    <p>Yêu thích cuộc sống về đêm</p>
                  </div>
                </div>

                {/* Sầm Hào */}
                <div className="bg-[#101622] border border-[#2D3D54]/30 rounded-lg p-3.5">
                  <h3 className="font-alegreya text-sm font-bold text-[#ECEFF4] mb-2">
                    2. Sầm Hào - công
                  </h3>
                  <div className="space-y-1 text-[11px] text-[#ECEFF4]/75">
                    <p>Chó dại cố chấp</p>
                    <p>Ông lớn ẩn giấu thân phận</p>
                    <p>Khuyên vợ phải tiết chế</p>
                  </div>
                </div>
              </div>

              {/* Nút hành động hợp theme Người Đẹp Ốm Yêu */}
              <div className="flex flex-wrap gap-4 w-full justify-center mb-6 pt-5 border-t border-[#2D3D54]/30">
                <button
                  onClick={() => {
                    if (chapters && chapters.length > 0) {
                      const sorted = [...chapters].sort((a, b) => {
                        const orderA = a.order !== undefined ? a.order : 0;
                        const orderB = b.order !== undefined ? b.order : 0;
                        return orderA - orderB;
                      });
                      navigate(`/doc/${story.id}/${sorted[0]?.id}`);
                    }
                  }}
                  className="px-6 py-2.5 rounded-lg bg-[#A2B6CD] text-[#101622] hover:bg-[#ECEFF4] transition-all font-lora font-bold text-xs uppercase tracking-wider flex items-center gap-2 shadow-md"
                >
                  <BookOpen className="w-4 h-4" /> Bắt đầu ôn luyện
                </button>

                <button
                  onClick={() => setShowGiftModal(true)}
                  className="px-6 py-2.5 rounded-lg border border-[#A2B6CD]/40 text-[#A2B6CD] hover:bg-[#A2B6CD]/10 hover:border-[#A2B6CD] transition-all font-lora font-bold text-xs uppercase tracking-wider flex items-center gap-2 shadow-md"
                >
                  <Gift className="w-4 h-4" /> Tiếp sức sĩ tử
                </button>
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
                <Users className="w-4 h-4" /> THẢO LUẬN HIỆP HỘI
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
                      placeholder={isLoggedIn ? "Nhập ý kiến đóng góp cho hiệp hội tại đây..." : "Bạn cần đăng nhập để tham gia thảo luận!"}
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
                      <p className="text-[#ECEFF4]/70 text-xs font-alegreya italic font-bold">Hiệp hội chưa có công văn nào. Hãy là người đầu tiên đặt câu hỏi!</p>
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
                  <span>Tiến độ: {(completedMap[selectedSubject] || []).length}/50 câu</span>
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

      {/* GIFT MODAL (TIẾP SỨC SĨ TỬ) */}
      {showGiftModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 font-sans">
          <div className="bg-[#151C28] border-2 border-[#2D3D54]/50 w-full max-w-md p-6 rounded-2xl shadow-2xl relative text-[#ECEFF4]">
            <div className="absolute top-2 right-2 text-xs text-[#A2B6CD]">✦</div>
            <h3 className="font-alegreya text-[#A2B6CD] text-xl font-bold mb-1 uppercase tracking-wider">Tiếp sức sĩ tử</h3>
            <p className="text-xs text-[#ECEFF4]/70 mb-4 font-lora">
              Mỗi mẩu Choco ngọt ngào sẽ hóa thành nguồn năng lượng tuyệt vời, sưởi ấm tâm hồn và tiếp sức tinh thần bền bỉ cho sĩ tử bứt phá mọi kỳ thi.
            </p>
            
            <div className="flex flex-col gap-4">
              <div>
                <label className="text-[10px] text-[#A2B6CD] font-bold block mb-1 font-lora uppercase tracking-wider">
                  Số lượng Choco gửi tặng (Bạn đang có: {choco} CC)
                </label>
                <input 
                  type="number" 
                  value={giftAmount}
                  onChange={(e) => setGiftAmount(Math.max(1, parseInt(e.target.value) || 0))}
                  className="w-full bg-[#101622] text-[#ECEFF4] border border-[#2D3D54]/40 p-3 rounded-xl text-sm focus:outline-none focus:border-[#A2B6CD] transition-all"
                  min="1"
                />
              </div>

              <div>
                <label className="text-[10px] text-[#A2B6CD] font-bold block mb-1 font-lora uppercase tracking-wider">
                  Lời nhắn tiếp sức học tập
                </label>
                <textarea
                  value={giftMessage}
                  onChange={(e) => setGiftMessage(e.target.value)}
                  placeholder="Gửi gắm lời chúc chân thành, tiếp thêm động lực học tập cho sĩ tử..."
                  rows={3}
                  className="w-full bg-[#101622] text-[#ECEFF4] border border-[#2D3D54]/40 p-3 rounded-xl text-xs focus:outline-none resize-none font-lora italic focus:border-[#A2B6CD] transition-all"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button 
                  onClick={() => setShowGiftModal(false)}
                  className="px-4 py-2 border border-[#2D3D54]/40 text-[#ECEFF4]/70 hover:text-[#ECEFF4] hover:border-[#A2B6CD] rounded-xl text-xs font-bold transition-all cursor-pointer"
                >
                  HUỶ BỎ
                </button>
                <button 
                  onClick={handleGiftSubmit}
                  className="px-4 py-2 bg-[#A2B6CD] text-[#101622] hover:bg-[#ECEFF4] rounded-xl text-xs font-black tracking-wider transition-all cursor-pointer uppercase"
                >
                  GỬI QUÀ TIẾP SỨC
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
