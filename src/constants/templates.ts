// ============================================================================
// Script Templates for TikTok/YouTube Shorts
// Layer 1 — Pre-built script templates for quick content creation
// ============================================================================

import { ScriptTemplate } from '@/types/tts.types';

export const SCRIPT_TEMPLATES: ScriptTemplate[] = [
  {
    id: 'story',
    title: 'Kể một câu chuyện',
    description: 'Làm cho nhân vật sống động với lời dẫn truyền cảm',
    category: 'story',
    icon: 'BookOpen',
    gradient: ['#667eea', '#764ba2'],
    content: `Ngày xưa, ở một ngôi làng nhỏ ven sông, có một cậu bé tên là An. Cậu có một giấc mơ lớn - được nhìn thấy biển một lần trong đời.

Mỗi đêm, cậu nằm nghe tiếng sóng trong trí tưởng tượng, và tự hỏi: "Biển có thật sự rộng lớn như người ta nói không?"

<break time="1.0s"/>

Rồi một ngày, cậu quyết định lên đường...`,
  },
  {
    id: 'horror',
    title: 'Kể chuyện ma',
    description: 'Giọng rùng rợn, lôi cuốn người nghe đến phút cuối',
    category: 'story',
    icon: 'Ghost',
    gradient: ['#434343', '#000000'],
    content: `Đêm đó, đồng hồ điểm đúng 3 giờ sáng.

Tôi đang nằm trên giường thì nghe thấy tiếng bước chân ở hành lang. Từng bước... từng bước một... chậm rãi tiến về phía phòng tôi.

<break time="1.5s"/>

Tôi nín thở. Tay nắm chặt chăn.

Rồi tiếng bước chân dừng lại... ngay trước cửa phòng.

<break time="2.0s"/>

Và cánh cửa... từ từ mở ra...`,
  },
  {
    id: 'news',
    title: 'Tin tức drama',
    description: 'Đọc tin nóng hổi với phong cách chuyên nghiệp',
    category: 'news',
    icon: 'Newspaper',
    gradient: ['#f093fb', '#f5576c'],
    content: `NÓNG: Sự việc gây xôn xao cộng đồng mạng trong 24 giờ qua!

Theo nguồn tin xác nhận, sự việc bắt đầu vào lúc 8 giờ sáng ngày hôm nay khi một đoạn video được đăng tải lên mạng xã hội.

<break time="0.5s"/>

Ngay lập tức, hàng triệu lượt xem và hàng nghìn bình luận đã tràn ngập. Nhiều người nổi tiếng cũng đã lên tiếng về vụ việc này.

Chúng tôi sẽ tiếp tục cập nhật diễn biến mới nhất.`,
  },
  {
    id: 'review',
    title: 'Review phim',
    description: 'Tóm tắt và nhận xét phim hay cho video ngắn',
    category: 'review',
    icon: 'Film',
    gradient: ['#a18cd1', '#fbc2eb'],
    content: `Các bạn ơi, hôm nay mình sẽ review một bộ phim mà mình đảm bảo xem xong các bạn sẽ không ngủ được!

<break time="0.5s"/>

Bộ phim kể về một nhân vật bí ẩn, xuất hiện ở một thị trấn nhỏ vào một đêm mưa bão.

Không ai biết anh ta là ai, đến từ đâu. Nhưng kể từ khi anh ta xuất hiện, mọi thứ bắt đầu thay đổi...

<break time="1.0s"/>

Và cái kết thì... mình chỉ nói là: BẤT NGỜ ĐẾN KHÔNG THỞ NỔI!

Đánh giá: 9 trên 10 điểm!`,
  },
  {
    id: 'ad',
    title: 'Ghi âm quảng cáo',
    description: 'Tạo quảng cáo chuyên nghiệp với giọng nói AI chân thực',
    category: 'ad',
    icon: 'Megaphone',
    gradient: ['#ffecd2', '#fcb69f'],
    content: `Bạn đang tìm kiếm một sản phẩm thay đổi cuộc sống?

<break time="0.5s"/>

Giới thiệu đến bạn sản phẩm hoàn toàn mới — được hàng triệu người tin dùng, với công nghệ đột phá chưa từng có.

Ưu đãi đặc biệt: Giảm ngay 50% cho 100 khách hàng đầu tiên!

<break time="0.3s"/>

Đặt hàng ngay hôm nay. Link ở phần mô tả bên dưới!`,
  },
  {
    id: 'joke',
    title: 'Kể một câu đố vui',
    description: 'Nội dung hài hước, giải trí nhẹ nhàng',
    category: 'story',
    icon: 'Smile',
    gradient: ['#43e97b', '#38f9d7'],
    content: `Đố các bạn: Cái gì đi bằng 4 chân buổi sáng, 2 chân buổi trưa, và 3 chân buổi chiều?

<break time="2.0s"/>

Đáp án là: CON NGƯỜI!

Buổi sáng cuộc đời - em bé bò bằng 4 chân.
Buổi trưa cuộc đời - người lớn đi 2 chân.
Buổi chiều cuộc đời - người già chống gậy thành 3 chân.

<break time="0.5s"/>

Hay phải không nào? Follow để xem thêm câu đố vui mỗi ngày nhé!`,
  },
  {
    id: 'podcast',
    title: 'Giới thiệu podcast',
    description: 'Mở đầu podcast chuyên nghiệp và thu hút',
    category: 'podcast',
    icon: 'Mic',
    gradient: ['#fa709a', '#fee140'],
    content: `Xin chào và chào mừng các bạn đến với podcast "Câu Chuyện Cuộc Sống" — nơi chúng ta cùng nhau khám phá những góc nhìn thú vị về thế giới xung quanh.

<break time="0.5s"/>

Mình là host của chương trình. Và hôm nay, chúng ta sẽ nói về một chủ đề mà mình tin rằng ai cũng từng trải qua ít nhất một lần trong đời.

Nếu bạn thấy nội dung hay, đừng quên nhấn subscribe và chia sẻ cho bạn bè nhé!

<break time="1.0s"/>

Bắt đầu thôi nào...`,
  },
  {
    id: 'multilingual',
    title: 'Nói nhiều ngôn ngữ',
    description: 'Demo giọng nói đa ngôn ngữ ấn tượng',
    category: 'story',
    icon: 'Globe',
    gradient: ['#a1c4fd', '#c2e9fb'],
    content: `Xin chào! Tôi có thể nói được nhiều ngôn ngữ khác nhau.

<break time="0.5s"/>

Hello! I can speak multiple languages fluently.

<break time="0.5s"/>

¡Hola! Puedo hablar varios idiomas con fluidez.

<break time="0.5s"/>

Thật tuyệt vời phải không? Công nghệ AI giọng nói đã tiến bộ vượt bậc!`,
  },
  {
    id: 'film-director',
    title: 'Đạo diễn cảnh phim',
    description: 'Hướng dẫn diễn xuất cho cảnh phim ngắn',
    category: 'film',
    icon: 'Clapperboard',
    gradient: ['#667eea', '#764ba2'],
    content: `Cảnh 1: Nội — Phòng khách — Đêm

Nhân vật chính ngồi một mình bên cửa sổ, nhìn ra màn mưa.

<break time="1.0s"/>

"Tôi đã chờ đợi khoảnh khắc này suốt 10 năm..."

<break time="0.5s"/>

Anh ta đứng dậy, bước chậm rãi đến bàn, mở ngăn kéo, lấy ra một bức thư cũ đã ố vàng.

<break time="1.0s"/>

"Và giờ, đã đến lúc..."`,
  },
  {
    id: 'game-voice',
    title: 'Giọng nhân vật game',
    description: 'Lồng tiếng cho nhân vật game với phong cách đa dạng',
    category: 'game',
    icon: 'Gamepad2',
    gradient: ['#f093fb', '#f5576c'],
    content: `"Dừng lại! Ngươi không được phép bước vào vùng đất này!"

<break time="0.5s"/>

"Ta là Người Canh Giữ Cổng Thần. Đã hàng ngàn năm, không ai dám thách thức sức mạnh của ta."

<break time="1.0s"/>

"Nếu ngươi muốn đi qua... hãy chứng minh ngươi xứng đáng!"

<break time="0.5s"/>

"Chuẩn bị chiến đấu!"`,
  },
  {
    id: 'meditation',
    title: 'Hướng dẫn thiền',
    description: 'Giọng nhẹ nhàng cho bài thiền định thư giãn',
    category: 'meditation',
    icon: 'Heart',
    gradient: ['#a8edea', '#fed6e3'],
    content: `Hãy nhắm mắt lại... và hít một hơi thật sâu...

<break time="2.0s"/>

Thở ra... từ từ...

<break time="2.0s"/>

Cảm nhận cơ thể bạn đang thư giãn. Từ đỉnh đầu... xuống vai... xuống cánh tay... và đến những ngón tay.

<break time="1.5s"/>

Bạn đang ở một nơi rất bình yên. Không có lo lắng. Không có áp lực.

<break time="1.0s"/>

Chỉ có sự tĩnh lặng... và bình an...`,
  },
];

/**
 * Get templates by category
 */
export function getTemplatesByCategory(category: string): ScriptTemplate[] {
  return SCRIPT_TEMPLATES.filter(t => t.category === category);
}
