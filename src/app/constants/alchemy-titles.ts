export const ALCHEMY_TITLES = [
    // 🟢 الفئة الأولى
    { code: 'researcher', name: 'الباحث الدقيق', icon: '🔍', color: 'text-cyan-600', bg: 'bg-cyan-50', border: 'border-cyan-200', desc: 'شغف بالمعرفة والتزام تام بالتعليمات', cost: { cognitive: 4, discipline: 3 } },
    { code: 'speaker', name: 'المتحدث اللبق', icon: '🗣️', color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-200', desc: 'تواصل إيجابي وثقة عالية بالنفس', cost: { social: 5, emotional: 2 } },
    { code: 'helper', name: 'المساعد النشيط', icon: '🛠️', color: 'text-lime-600', bg: 'bg-lime-50', border: 'border-lime-200', desc: 'الحركة والمبادرة لمساعدة الزملاء', cost: { practical: 4, social: 3 } },
    { code: 'peacemaker', name: 'صانع السلام', icon: '🕊️', color: 'text-sky-600', bg: 'bg-sky-50', border: 'border-sky-200', desc: 'نشر التسامح وحل الخلافات بهدوء', cost: { emotional: 5, discipline: 3 } },
    { code: 'timekeeper', name: 'حارس الوقت', icon: '⏰', color: 'text-zinc-600', bg: 'bg-zinc-50', border: 'border-zinc-200', desc: 'حضور مبكر وتسليم للمهام في وقتها', cost: { discipline: 7 } },
    { code: 'spark', name: 'شرارة الفكرة', icon: '💡', color: 'text-yellow-600', bg: 'bg-yellow-50', border: 'border-yellow-200', desc: 'مبادرة سريعة وإجابات إبداعية', cost: { cognitive: 7 } },
    { code: 'creative', name: 'اللمسة الإبداعية', icon: '🎨', color: 'text-fuchsia-600', bg: 'bg-fuchsia-50', border: 'border-fuchsia-200', desc: 'تحويل الأفكار إلى أعمال فنية ملموسة', cost: { practical: 5, cognitive: 3 } },
    { code: 'loyal_friend', name: 'الصديق الوفي', icon: '🤝', color: 'text-rose-500', bg: 'bg-rose-50', border: 'border-rose-200', desc: 'تعاطف حقيقي وبناء علاقات متينة', cost: { emotional: 4, social: 4 } },

    // 🔵 الفئة الثانية
    { code: 'inventor', name: 'المخترع العبقري', icon: '⚙️', color: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-200', desc: 'دمج التفوق العلمي مع التطبيق العملي', cost: { cognitive: 5, practical: 5, social: 2 } },
    { code: 'entrepreneur', name: 'رائد الأعمال', icon: '💼', color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-200', desc: 'عقلية المبادرة، التخطيط، والقيادة', cost: { practical: 6, social: 5, cognitive: 4 } },
    { code: 'wise', name: 'حكيم الفصل', icon: '🦉', color: 'text-indigo-600', bg: 'bg-indigo-50', border: 'border-indigo-200', desc: 'دمج الذكاء بالهدوء والرزانة', cost: { cognitive: 5, discipline: 5, emotional: 5 } },
    { code: 'shield', name: 'درع الفصل', icon: '🛡️', color: 'text-slate-600', bg: 'bg-slate-50', border: 'border-slate-200', desc: 'التزام مطلق ودفاع عن النظام والزملاء', cost: { discipline: 8, social: 4, emotional: 3 } },
    { code: 'director', name: 'المخرج الإبداعي', icon: '🎭', color: 'text-purple-600', bg: 'bg-purple-50', border: 'border-purple-200', desc: 'قيادة الفرق في الأنشطة والمشاريع', cost: { practical: 6, social: 4, emotional: 2 } },
    { code: 'detective', name: 'المحقق الذكي', icon: '🕵️‍♂️', color: 'text-violet-600', bg: 'bg-violet-50', border: 'border-violet-200', desc: 'قوة الملاحظة وحل المشكلات المعقدة', cost: { cognitive: 6, practical: 4, discipline: 3 } },
    { code: 'solver', name: 'صائد الحلول', icon: '🧩', color: 'text-teal-600', bg: 'bg-teal-50', border: 'border-teal-200', desc: 'إيجاد مخارج عملية وذكية لأي أزمة', cost: { cognitive: 6, practical: 6, discipline: 3 } },
    { code: 'maestro', name: 'المايسترو', icon: '🎼', color: 'text-red-600', bg: 'bg-red-50', border: 'border-red-200', desc: 'تناغم عالي في إدارة المهام المتعددة', cost: { practical: 6, social: 6, cognitive: 4 } },

    // 🟣 الفئة الثالثة
    { code: 'healer', name: 'المُسعف النفسي', icon: '🩺', color: 'text-pink-600', bg: 'bg-pink-50', border: 'border-pink-200', desc: 'ذكاء عاطفي عالي في مواساة الآخرين', cost: { emotional: 10, social: 8 } },
    { code: 'leader', name: 'القائد المحبوب', icon: '👑', color: 'text-rose-600', bg: 'bg-rose-50', border: 'border-rose-200', desc: 'قيادة اجتماعية خالية من التنمر', cost: { social: 10, emotional: 6, discipline: 4 } },
    { code: 'architect', name: 'المهندس المعماري', icon: '🏛️', color: 'text-stone-600', bg: 'bg-stone-50', border: 'border-stone-200', desc: 'التخطيط الدقيق للمشاريع والتنفيذ المثالي', cost: { practical: 10, cognitive: 8, discipline: 4 } },
    { code: 'mastermind', name: 'العقل المدبر', icon: '🧠', color: 'text-cyan-700', bg: 'bg-cyan-100', border: 'border-cyan-300', desc: 'العبقرية الاستراتيجية في الدراسة', cost: { cognitive: 12, discipline: 6, practical: 4 } },
    { code: 'superstar', name: 'النجم اللامع', icon: '🌟', color: 'text-yellow-500', bg: 'bg-yellow-100', border: 'border-yellow-300', desc: 'الطالب الذي يخطف الأنظار في الأنشطة', cost: { social: 10, practical: 8, cognitive: 4 } },
    { code: 'safety_valve', name: 'صمام الأمان', icon: '⚓', color: 'text-slate-700', bg: 'bg-slate-100', border: 'border-slate-300', desc: 'يُعتمد عليه تماماً في غياب المعلم', cost: { discipline: 10, emotional: 8, social: 4 } },
    { code: 'ambassador', name: 'سفير النوايا', icon: '🌍', color: 'text-orange-600', bg: 'bg-orange-50', border: 'border-orange-200', desc: 'أعلى درجات التعاون والأخلاق العالية', cost: { emotional: 12, social: 10 } },
    { code: 'compass', name: 'البوصلة', icon: '🧭', color: 'text-emerald-700', bg: 'bg-emerald-100', border: 'border-emerald-300', desc: 'يوجه زملائه دائماً للطريق الصحيح', cost: { cognitive: 8, emotional: 8, discipline: 8 } },

    // 🟡 الفئة الرابعة (الأسطورية)
    { code: 'rare_gem', name: 'الجوهرة النادرة', icon: '💎', color: 'text-sky-500', bg: 'bg-sky-100', border: 'border-sky-300', desc: 'أقصى درجات الذكاء العقلي والعاطفي معاً', cost: { cognitive: 15, emotional: 15, social: 5 } },
    { code: 'noble_knight', name: 'الفارس النبيل', icon: '⚔️', color: 'text-zinc-700', bg: 'bg-zinc-100', border: 'border-zinc-300', desc: 'الانضباط المطلق الممزوج بالشجاعة', cost: { discipline: 20, social: 10, emotional: 5 } },
    { code: 'grand_magus', name: 'الساحر الأعظم', icon: '🧙‍♂️', color: 'text-violet-700', bg: 'bg-violet-100', border: 'border-violet-300', desc: 'قدرة خارقة على تحويل النظريات لواقع', cost: { practical: 20, cognitive: 10, social: 5 } },
    { code: 'galaxy_guardian', name: 'حارس المجرة', icon: '🌌', color: 'text-indigo-800', bg: 'bg-indigo-100', border: 'border-indigo-300', desc: 'مكرس بالكامل لحماية النظام ومساعدة غيره', cost: { discipline: 25, social: 20 } },
    { code: 'school_pride', name: 'فخر المدرسة', icon: '🏆', color: 'text-amber-500', bg: 'bg-amber-100', border: 'border-amber-300', desc: 'لقب لا يحصل عليه إلا النخبة', cost: { cognitive: 10, social: 10, discipline: 10, emotional: 10, practical: 10 } },
    { code: 'legend', name: 'الأسطورة المتوازنة', icon: '🏅', color: 'text-fuchsia-700', bg: 'bg-fuchsia-100', border: 'border-fuchsia-300', desc: 'إثبات الكمال في جميع المهارات بلا استثناء!', cost: { cognitive: 15, social: 15, discipline: 15, emotional: 15, practical: 15 } }
];