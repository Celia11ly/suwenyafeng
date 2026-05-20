// ==========================================
// prompts.js - Fully Dynamic LLM Architecture
// ==========================================

// ── 0. Medical Compliance & Toxic Herb Databases ──
const TOXIC_HERBS = [
    '附子', '半夏', '细辛', '川乌', '草乌', '乌头', '马钱子', '天南星', '甘遂', '大戟', 
    '芫花', '巴豆', '砒石', '斑蝥', '蟾酥', '雷公藤', '雄黄', '朱砂', '轻粉', '红粉', 
    '铅丹', '商陆', '黄药子', '苦杏仁', '苍耳子'
];

function detectToxicHerb(topic) {
    if (!topic) return null;
    for (const herb of TOXIC_HERBS) {
        if (topic.includes(herb)) {
            return herb;
        }
    }
    return null;
}

function applyMedicalComplianceFilter(text) {
    if (!text) return text;
    let safeText = text;
    const replacements = [
        { pattern: /孕妇禁用/g, replace: '特殊体质人群建议咨询医师' },
        { pattern: /孕妇忌用/g, replace: '特殊体质人群建议咨询医师' },
        { pattern: /孕妇禁忌/g, replace: '特殊体质人群建议咨询医师' },
        { pattern: /治愈/g, replace: '辅助调理' },
        { pattern: /治疗/g, replace: '辅助调理' },
        { pattern: /根治/g, replace: '温和调护' },
        { pattern: /特效/g, replace: '温和养护' },
        { pattern: /立刻痊愈/g, replace: '温和改善' },
        { pattern: /速效/g, replace: '渐进调养' },
        { pattern: /抗癌/g, replace: '辅助扶正' },
        { pattern: /防癌/g, replace: '养生防偏' },
        { pattern: /消炎/g, replace: '清热泻火' },
        { pattern: /降血压/g, replace: '辅助平稳气血' },
        { pattern: /降血糖/g, replace: '调理脏腑气机' }
    ];
    replacements.forEach(r => {
        safeText = safeText.replace(r.pattern, r.replace);
    });
    return safeText;
}

// ── 1. Dynamic Knowledge & Structure Generation ──
async function fetchKnowledgeFromLLM(topic, count, refImages, templateChoice = 'auto', customStyleDesc = '', currentTab = 'classic') {
    // Robust refImages validation to prevent empty URL arrays in LLM calls
    const validRefImages = (Array.isArray(refImages) ? refImages : [refImages])
        .filter(u => typeof u === 'string' && u.trim().startsWith('http') || u.trim().startsWith('data:image'));
    const hasRef = validRefImages.length > 0;
    
    let styleDirective = '';
    if (templateChoice === 'custom' && customStyleDesc) {
        styleDirective = "\n\n📢【最高美学指令：自定义视觉风格优先】\n用户特别指定了自定义风格描述：'" + customStyleDesc + "'。\n请你完全打破默认的分类推荐，强行在此套 " + count + " 张图的设计中，100% 融合并贯彻该自定义美学风格（如全局色系、环境材质、采光调性、字体与排版修饰）。\n同时，每一页的构图与实物陈列依旧要在该风格基调下进行多样化的排版变奏（如：封面页、步骤页、清单页、收尾名言页具有完全不同的视觉版式），绝对避免千篇一律！";
    } else if (templateChoice !== 'auto') {
        const templates = {
            'new_chinese': {
                name: '新中式写意风 (New Chinese Minimalism)',
                details: '以大面积的淡青釉色、米浆白、古宣纸色为主调，搭配清晨穿透竹帘的条纹柔和光影，营造禅意雅致。字体采用纵向或横向大号“黑色苍劲毛笔书法体”配合“清透纤细的宋体”；背景干净留白（>50%），以写意竹影、圆窗、完美的正圆形瓷盘或圆格取景作为视觉锚点。'
            },
            'wabi_sabi': {
                name: '日式侘寂风 (Wabi-Sabi Aesthetic)',
                details: '自然粗粝的陶器、黏土色、原木色调、粗砂材质或略带岁月的微瑕器皿。采用温暖柔和的暗调侧光 (Moody side light)，营造静谧、素朴、返璞归真 的自然质感。大面积使用粗麻布、斑驳灰墙作为背景纹理，排版呼吸感极高，偏心对焦。'
            },
            'parchment': {
                name: '古籍本草风 (Antique Herbalist)',
                details: '古老羊皮纸黄、天然黏土褐、原木色、黄铜色泽。充满历史厚重感、中草药典籍拼贴画的美学调性。画面多采用干燥植物标本微距摄影、草本植物花草素描细线边框、以及牛皮纸质感的克数便签。光影微暗，带有古典医药局的侧向焦度。'
            },
            'modern_magazine': {
                name: '现代极简杂志风 (Modern Minimalist Magazine)',
                details: '采用莫兰迪色系、冷淡黑白灰或柔和奶油色的微纹理底色。使用极其纤细秀气的现代黑体或思源宋体。排版上采用极富几何感的双栏不对称分割线、大字无底线排版、大比例清凉留白（>50%）、以及圆角卡片分栏。配以极为干净的浅色大理石或石膏背景。'
            }
        };
        const currentTpl = templates[templateChoice];
        if (currentTpl) {
            styleDirective = "\n\n📢【最高美学指令：指定美学模板优先】\n用户指定了视觉模板：【" + currentTpl.name + "】。\n请你完全打破默认的四大主题分类自动路由，强行在全套 " + count + " 张图的 global_style、页面 layout 和 img_prompt 中彻底执行以下视觉风格规范：\n" + currentTpl.details + "\n请在贯穿该美学模板的基础上，为这 " + count + " 张图分别设计不同节奏的构图版式，使组图风格高度统一且排版丰富灵活，充满设计天赋！";
        }
    }

    let moduleDirective = '';
    const toxicHerb = detectToxicHerb(topic);

    if (currentTab === 'herb') {
        moduleDirective = `

📢【本草百科专项设计协议（双轨·专属模板轨道）】
你当前的任务是为单味中药【${topic}】定制一整套极其精美的“中草药本草百科科普卡”。
你必须扮演中医药权威专家大数据库，在生成 JSON 的每一页前，首先在后台对该本草进行一次硬核、学术级的药典级数据校对，调取其真实的《中国药典》记载：
- 真实的性味与归经（如：辛、甘，微温。归肾、膀胱经）；
- 真实的采收季节与月份范围（明确具体月份，如：夏秋二季采收，即6-9月）；
- 核心道地产区（如：宁夏中宁、吉林长白山等）；
- 原植物形态学描述（蔷薇科悬钩子属、长椭圆形叶片、果实成熟时鲜红色等 botanical 细节）；
- 干燥饮片药材外观描述（圆锥形、灰绿色至黄绿色、干缩皱褶、质硬）；
- 经典配伍（包含配伍药材与真实的克数，例如“${topic} 10g + 菟丝子 10g + 五味子 5g”）；
- 科学日常冲泡煎煮三部曲（明确的水温、器皿、步骤细节参数）。

你生成的页面对象数组（pages）必须刚好包含 ${count} 个页面，严格执行“总图 + 分图”的故事线与构图变奏：
- 图 1：【总图】中草药完整知识图谱（封面主图）
  - layout: "画面为竖版新中式信息图谱。顶部15%区域为朱红毛笔书法大字标题 + 功效金色横幅；20%来源制作区左右对称布局（原植物精细插画+3步采收）；25%性味归经区（淡墨线描经络循行图+金色虚线标注路径）；25%核心配伍区（平铺小木盘+配伍连线网）；15%服用禁忌与底部低调的免责科普说明。"
  - exact_text: "「${topic}」完整图谱\\n功效与配伍详解\\n科普说明，内容仅供参考"
  - img_prompt: "A comprehensive traditional Chinese medicine infographic chart scroll. High-end New Chinese style, antique beige hand-made paper scroll. [Top 15%]: A vertical soft beige column containing red expressive vertical calligraphy brush font of '${topic}'. [Upper-middle 20%]: Botanical illustration of fresh ${topic} plant alongside raw dried medicine, labeled with tiny flags. [Lower-middle 25%]: An ink-wash line drawing sketch of a human body silhouette outline, displaying three specific meridian lines as subtle glowing golden dashed trails. [Bottom-middle 25%]: Three vintage small wooden dishes displaying pairing herbs with tiny kraft labels. [Bottom 15%]: A dark red border area at the very bottom containing clean sans-serif text. Labeled with elegant thin black characters. Highly-detailed watercolor illustrations, extremely elegant, high information density, over 40% empty breathing space, eye-level medium shot."

- 图 2：【分图】来源采收与道地产区
  - layout: "左右非对称分栏。左侧40%为新鲜原植物植物学水彩特写，右侧60%展示干燥药材实物陈列与3步采摘制作工艺。文字优雅印在牛皮纸克数便签纸上。"
  - exact_text: "来源与采收制作\\n道地：[真实道地产区]\\n[真实采收月份及3步简短制作步骤]\\n科普说明，内容仅供参考"
  - img_prompt: "A detailed split-card focusing on botanical source. High-end New Chinese aesthetic, cream beige paper texture. Left 40%: exquisite watercolor botanical illustration of fresh growing green ${topic} plant with detailed leaves and fresh colorful fruits. Right 60%: micro-shot of dried ${topic} herbal pieces displayed in a clean shallow sandy-clay pot, next to a folded kraft paper tag with delicate thin handwriting of harvesting steps. Pure warm side lighting, medium-shot, clear edge margins, massive blank space."

- 图 3：【分图】性味归经与经络系统
  - layout: "极简对称排版。左侧展现精细淡墨线描的人体经络轮廓图，三条主要归经以金色虚线精确标出循行路径。右侧竖向排列4个朱红色的圆形功效小图标与物理绑定文字。"
  - exact_text: "性味：[药典性味]\\n归经：[药典归经]\\n核心功效：\\n[4个核心功效词]\\n科普说明，内容仅供参考"
  - img_prompt: "An elegant TCM meridian chart. Light beige parchment paper background. Left side: an artistic ink-line hand-drawn human body torso silhouette, with three active meridian lines glowing as subtle golden dotted light paths. Right side: four vintage circular red wooden seal-like icons containing abstract symbols representing functions of ${topic}. Very clean minimalist presentation, thin fine lines, balanced asymmetric layout, over 50% breathing empty space."

- 图 4：【分图】经典配伍与食疗衍生对药
  - layout: "画面为精美平铺陈列网格。背景为朴素雅致的亚麻布背景。画面中散落陈列着3组经典的配伍中草药药材，每组材料盛放在一个精致的小木碟中，碟旁贴有一张微型的、带折角的克数牛皮纸标签纸，上面印有准确的药名和克数。"
  - exact_text: "经典配伍与克数配比\\n[配方1名称与克数]\\n[配方2名称与克数]\\n[配方3名称与克数]\\n科普说明，内容仅供参考"
  - img_prompt: "A beautiful herbal pairing layout. Raw coarse linen fabric backdrop with neutral rustic textures. Three vintage tiny round wooden dishes are artistically scattered on the surface, each holding a different combination of dry raw pairing herbs. Next to each wooden dish, there is a miniature folded kraft paper tag with delicate thin handwriting of herb names and weights in grams. Labeled clearly. Warm moody side shadow, elegant high-end design, extremely detailed."

- 图 5：【分图】科学冲泡或煎煮三部曲（代茶饮特写）
  - layout: "画面上方60%展现特写茶饮陈列（精致茶具中澄澈的茶水，散发着袅袅热气）。画面下方40%为干净宣纸底色块的留白背景，居中印着3步科学日常冲泡或煎煮步骤。茶碗旁必须自然散落散发当前药材特征的主体物。"
  - exact_text: "日常代茶饮冲泡法\\n[步骤1：配量与90度水温]\\n[步骤2：闷泡/煎煮时间]\\n[步骤3：温服饮用频次]\\n科普说明，内容仅供参考"
  - img_prompt: "A cozy hot herbal tea preparation scene. Warm moody side lighting. On the upper 60%: A delicate transparent glass cup or blue-and-white porcelain Gaiwan filled with clear hot [特定茶汤颜色，如红褐色/淡黄绿色] tea, gentle wisps of steam floating upward. Next to the tea set, a few fresh and raw dried pieces of '${topic}' (like its botanical morphology fruits/slices) are naturally scattered on the dark wooden tray. Lower 40%: perfectly clean blank beige paper banner for text. Medium shot, elegant premium aesthetic, no clutter."

- 图 6：【分图】避坑指南与服用注意事项
  - layout: "极简古典信笺排版。四周有一圈极细的暗金色中式纹样细线边框。页面中央是干净的淡米黄色宣纸，使用极纤细小巧的圆圈（○）作为 Checkbox 排列4条精练的忌服注意事项。禁忌文字采用深朱红色。"
  - exact_text: "忌服与注意事项\\n[禁忌1：不适人群]\\n[禁忌2：饮食禁忌]\\n[禁忌3：合理用量]\\n科普说明，内容仅供参考"
  - img_prompt: "An elegant minimalist notice card. Aged light yellow rice-paper sheet framed by a very thin antique golden border. At the center, neat rows of text in vertical or horizontal alignments, featuring small elegant circular bullet points (○). Extremely minimalist layout, breathing aesthetic, massive blank background space, very clean and clinical."

${toxicHerb ? `⚠️ 有毒中药安全加页 Page 7:
- title: "安全用药与规范炮制说明"
- layout: "上部深朱红色粗边框警示区，下部浅米色炮制用量说明。"
- exact_text: "安全用药与规范炮制说明\\n${toxicHerb}有毒，须遵医嘱\\n[规范炮制及先煎久煎步骤]\\n科普说明，内容仅供参考"
- img_prompt: "A rigorous clinical caution notice card. A dark red vintage border enclosing an elegant beige parchment. An antique herbalist scale and a brass medicine mortar are placed on a rustic wooden desk, with an open pharmaceutical scroll displaying clear calligraphy labels. Strict formal layout, red clay seal stamp, clean space for text, over 45% white space."` : ''}
`;
    } else {
        moduleDirective = `

📢【经典养生图文卡专项设计协议（双轨·美学与排版策略精髓轨道）】
你当前的任务是生成一套关于【${topic}】的精美养生科普图文卡（共 ${count} 张图）。
你绝对不能生搬硬套任何中药的归经、采收和药典学术层，但你必须**全盘汲取 PDF 方法论的视觉排版与提示词策略精髓**，彻底升级经典卡的干货和视觉档次：
1. **干货内容极致具体化（拒绝空话）**：经典卡不再输出泛泛的“规律作息、合理饮食”等废话，而是根据分类美学（节气养生/脏腑调理/痛点修复/经络养护），规划出包含**具体养生食材克数（如百合 10g + 莲子 15g）、具体的身体穴位名称、具体的作息时辰以及具体的调理步骤**。
2. **百分比几何分割与构图变奏**：绝不允许每一页的排版千篇一律。在 \`layout\` 中精确设计版面分割（如：图1封面大面积极简留白与圆格取景；图2自测清单采用记事本复古排版与细引线；图3食疗配方左右非对称双栏，下部贴折角牛皮纸克数便签；图4养生步骤采用 1|2|3 竖排时间轴与超大半透明宋体底纹数字）。
3. **文字与视觉实体的空间对齐物理绑定（Label-Mapping）**：在 \`layout\` 和 \`img_prompt\` 中，明确把具体的中文文字（如“三阴交穴 揉按3分钟”）物理绑定在画面中的“折角牛皮纸克数便签”、“小木牌吊坠”、“青花瓷瓷签”或“淡墨印痕宣纸条”上，指挥生图模型把字精准印在上面。
4. **强效防漂移锚定物**：在每一页的生图 Prompt 中强行锁定当期养生主题的核心具体实物（如“春季养肝”的\`热气腾腾绿豆百合粥，旁边散落着鲜绿的绿豆与白色百合片\`），在 prompt 最前端强力加上 \`[Universal Subject Anchor: \${topic}]\`，杜绝任何生成画面的漂移崩溃。
5. **放宽字数限制与多行 \`\\n\` 优雅折排**：exact_text 字数放宽至 **35~45字**。禁止大长句，必须使用 \`\\n\` 进行多行折行（每行 8~12 字以内），呈规整优雅的几何板块，与图片中的便签或横幅物理融合。
`;
    }

    const systemPrompt = `你是一位拥有30年临床经验的中医主任医师，也是顶级社交媒体（小红书/抖音等）大健康与东方美学领域的视觉创意总监与艺术主编。
用户会给出一个大健康或中药主题，你需要为其量身定制 \${count} 张极具艺术感、高档设计感、完全不雷同的小红书系列套图内容与一篇爆款笔记文案。

📢 当前垫图状态：【\${hasRef ? "⚠️已上传参考图 - 必须执行【高保真复刻模式】" : "✨未上传参考图 - 必须执行【自主创意设计模式】"}】\${styleDirective}\${moduleDirective}

根据当前的垫图状态，请你严格执行以下分支设计逻辑，展示你作为顶级艺术总监 of 视觉控制力与卓越设计天赋：

==================================================
分支 A：【高保真复刻模式】（当已上传参考图时执行）
==================================================
1. **像素级提取与复刻排版**：你必须成为一名精密的视觉排版解码器。仔细解构用户提供的一张或多张参考图，并在返回的 JSON 的 global_style、每一页的 layout 和 img_prompt 中深度复刻它的排版与陈列精髓：
   * **智能过滤社交平台截图（如小红书整页截图）**：
     ⚠️【极其重要】：用户上传的参考图往往是直接从小红书、抖音等社交平台上截取的整页浏览器/手机截图。这类的典型特点是：左半部分是笔记主图，而右半部分是点赞收藏栏、评论区、作者头像、笔记文本等社交 UI 侧边栏。你必须具备智能视觉过滤能力，彻底忽略右半部分的社交侧边栏、文字或评论，将注意力 100% 集中在左半部分（或图片主要展示区）的卡片排版上！提取其斜向碟子、牛皮纸标签、纵向标题等实际图片中的精美陈列，千万不要被右半部分的侧边栏评论所干扰！
   * **排版陈列与构图**：解构并精准复刻参考图的陈列。例如，如果原图是“左下角斜排小碟子装食材并带有小牛皮纸克数卡片标签，右下角一碗绿豆浆并有勺子舀起”，你就必须在每一页的英文陈列描述（img_prompt）中，100% 写入这种高保真的“小碟子、牛皮纸便签标签、勺子舀起”的画面指令！
   * **多图一对一对应复刻（多图顺序学习）**：当用户上传了多张参考图时，它们代表了整个套图里每一页的排版流。你必须将“第1张参考图的排版与陈列”赋予生成的第一页“Page 1”，“第2张参考图的排版与陈列”对应“Page 2”，以此类推。每一页都深度还原各自对应的参考图排版。
   * **单图输入下的“风格同源，排版多样”延展机制**：
     ⚠️【特别注意】：如果用户只上传了1张参考图，但需要生成 \${count} 张卡片。你绝对不能让这 \${count} 张卡片都长得一模一样！你必须将第一页（Page 1）作为主封面，高保真复刻该参考图的全部排版。从第二页（Page 2）开始，你必须提取参考图的“色调、光影、字体风格和特有装饰元素（如牛皮纸签、斜向木碟）”作为全局基调，但是主动为后续页面变换排版布局（例如 Page 2 极简奶油色卡片分栏，Page 3 上下分栏，Page 4 居中卡片框），既保证了同一套图的“风格绝对统一”，又实现了“排版极其丰富、呼吸感高、档次高”。
2. **文字密度对齐**：
   * 如果参考图非常极简，图上字极少，你的 exact_text 也必须极简，把做法和原理都入文案！
   * 必须对 exact_text 里的中文做极简化精简提炼，使用 \\n 进行优雅换行折排，放宽字数限制至 35~45 字。

==================================================
分支 B：【自主创意设计模式】（当未上传参考图时执行）
==================================================
1. **分类美学定制与视觉叙事流程（根据主题，发挥设计天赋，拒绝雷同千篇一律）**：
   你必须像专业视觉设计师一样，根据用户输入的主题进行辨证施图，首先将主题归入以下四大维度之一，并采用完全不同的“排版构图变奏”与“视觉故事线”：
   * 🍵 【分类一：二十四节气与季节养生 (Seasonal Regimen)】
     - 视觉色系与光影：春（Sage green/亚麻白）；夏（荷粉/冰玉绿）；秋（麦芽金/陶土褐）；冬（石墨黑/奶油白）。
     - 排版故事线：第1页艺术意境封面大面积留白；第2页节气指南细线双栏网格；第3页食疗茶饮斜向碟子+牛皮纸折角便签；第4页养生功法卡片。
   * 🍲 【分类二：单一本草食材科普 (Single Herb/Ingredient)】
     - 视觉色系与光影：Aged parchment yellow, natural clay brown, and raw wood tones。温暖柔和暗调侧光。
     - 排版故事线：按照【本草百科专项设计协议】的 6+1 故事线严密生成。
   * 💤 【分类三：痛点修复与亚健康调理 (Symptom Recovery)】
     - 视觉色系与光影：Serene dusk purple, lavender gray, and clean warm white。治愈散光。
     - 排版故事线：第1页温馨治愈大碗茶封面；第2页Checkbox痛点自测清单；第3页救急代茶饮方平铺碟子旁的小牛皮标签；第4页日常温馨叮咛。
   * 🩺 【分类四：传统脏腑调理与经络 (Organ & Meridian Care)】
     - 视觉色系与光影：新中式极简。大面积淡青釉色、米浆白、古宣纸色。
     - 排版故事线：第1页极简圆瓷盘/圆格取景与毛笔字；第2页经络循行淡墨轮廓金色虚线图；第3页养护三部曲1|2|3竖排时间轴；第4页成品茶盏与古籍名言收尾。

2. **同一套组图，风格高度统一原则**：
   每一张图都必须共享由 'global_style' 确立的全局视觉风格与背景色系，形成强烈的系列套图质感！必须保证统一配色、统一材质（如宣纸/麻布/微粗砂）、统一采光阴影（如穿透竹帘的晨光）、统一相机焦段（50mm）。

3. **字体与排版设计美学准则（打造美观富有设计感的版面）**：
   * 大标题：纵向或横向大号“黑色苍劲毛笔书法体 (elegant expressive vertical black ink calligraphy brush font)”。
   * 正文：清透纤细的宋体或思源黑体，折行排列。
   * 呼吸感留白：必须保持 >45% 的干净留白背景空间。所有元素内收聚拢在画面中央70%区域，四周边缘留出至少 15% 的绝对安全留白边距！

4. **汉字渲染黄金铁律**：
   每张图的 exact_text 中文字数放宽至 35~45 字，但必须使用 \\n 进行多行折行，每行小整齐，边缘绝对不能贴近图片边缘。

📢【免责声明强制渲染协议】
你必须在每一页卡片的 exact_text 最底部，强制性附带一行极低调的超精炼汉字，并用 \\n 隔开：『科普说明，内容仅供参考』。

==================================================
社交文案设计要求（分支A与分支B均须严格执行）：
==================================================
无论在何种模式下，你都必须产出一篇极高干货深度、条理清晰的专业自媒体文案：
* 包含一个极具点击欲望的爆款标题（带 emoji）；
* 详细列出具体的食材配比（精确到克数）、功效原理分析、极其详尽的制作步骤、禁忌人群、以及“特殊体质人群建议咨询医师”的温馨提示；
* 分段清晰，带有小红书特有的表情符号，并在结尾带上 5 个以上的爆款热门话题标签。

请严格输出以下 JSON 结构（绝对只能输出纯合法的 JSON 字符串，绝对不要包含 any Markdown 标记如 JSON代码块，且 exact_text 等字段中的换行请以双反斜杠 \\n 逃逸）：
{
  "social_copy": "（爆款社交配文，字数在300~500字左右，极其专业具体且合规避审）",
  "global_style": "（全局英文视觉风格词，需符合对应模式）",
  "pages": [
    {
      "title": "页面小标题",
      "layout": "（本页排版分布指令，必须指明排版文字与实物的空间分割及位置，体现非雷同的排版节奏）",
      "exact_text": "必须印在这张图片上的精确中文内容（包含主标题、多行以 \\n 折行的精炼对药/步骤文字，以及强制附带的“科普说明，内容仅供参考”，控制在 45 字以内，使用 \\n 换行）",
      "img_prompt": "（纯英文的单页主体画面实物描述，为排版留出大面积纯色干净背景空间，明确 15% edge safety margins 和中景 Medium shot 镜头）"
    }
    // ... 必须刚好包含 count 个页面对象
  ]
}`;

    const modelChoice = document.querySelector('input[name="modelChoice"]:checked')?.value;
    const apiKey = document.getElementById('apiKey')?.value;

    if (modelChoice === 'custom_openai') {
        if (!apiKey || apiKey.trim() === '' || apiKey.includes('sk-xxxx')) {
            throw new Error('您已选择“自定义 API”，但未填写 API Key。请在第一步中填写您的 API Key。');
        }
        try {
            const baseUrl = (document.getElementById('apiBaseUrl')?.value || 'https://api.openai.com/v1').replace(/\/$/, '');
            let textModel = document.getElementById('apiTextModel')?.value || 'doubao-seed-2-0-lite-260428';
            
            let userContent;
            if (hasRef) {
                userContent = [];
                userContent.push({
                    type: "text",
                    text: `用户主题：${topic}，当前属于【${currentTab === 'herb' ? '本草百科科普卡' : '经典养生图文卡'}】模块，需要生成 ${count} 张卡片。`
                });

                userContent.push({
                    type: "text",
                    text: `⚠️【最高优先级：多张风格参考图已上传】\n用户一共上传了 ${validRefImages.length} 张参考图。你必须对它们进行一对一的高保真复刻学习！\n请严格遵守以下规则：\n1. 【特别提醒】如果参考图是小红书等社交平台的整页浏览器/手机截图（左边是图片，右边或下边是点赞、评论、用户头像和笔记文字），你必须**彻底忽略右边/下边的所有社交 UI 和文字评论区**，将注意力 100% 聚焦在**左边/主图区域 of 卡片设计上**。深度提取左侧主图中的摆盘陈列、斜向碟子、卡片标签 and 文字排版精髓！\n2. 将第 1 张参考图的主图布局、摆盘陈列、色调与结构，完美复刻并映射到你生成的第 1 张卡片（Page 1） of layout 与 img_prompt 中；\n3. 将第 2 张参考图的排版与画面陈列，映射到第 2 张卡片（Page 2）；\n4. 以此类推，实现“参考图 1 决定卡片 1，参考图 2 决定卡片 2...”，让每一张卡片的陈列都与对应的参考图高度吻合。\n5. 如果需要生成的卡片张数（当前为 ${count} 张）大于参考图数量（当前为 ${validRefImages.length} 张），对于超出的卡片，你可以循环套用参考图的排版风格或在整体风格调性一致的前提下进行创意延展。`
                });
                validRefImages.forEach((imgUrl, idx) => {
                    userContent.push({
                        type: "text",
                        text: `以下是参考图 ${idx + 1}（深度分析它的构图、摆盘、色彩和标签，并将其完美映射复刻至 Page ${idx + 1}）：`
                    });
                    userContent.push({
                        type: "image_url",
                        image_url: {
                            url: imgUrl
                        }
                    });
                });
            } else {
                userContent = `用户主题：${topic}，当前属于【${currentTab === 'herb' ? '本草百科科普卡' : '经典养生图文卡'}】模块，需要生成 ${count} 张卡片。`;
            }

            const response = await fetch(`${baseUrl}/chat/completions`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${apiKey}`
                },
                body: JSON.stringify({
                    model: textModel,
                    messages: [
                        { role: "system", content: systemPrompt },
                        { role: "user", content: userContent }
                    ],
                    temperature: 0.7
                })
            });

            if (!response.ok) {
                const errData = await response.json().catch(() => ({}));
                throw new Error(errData.error?.message || `HTTP 错误 ${response.status}`);
            }
            const data = await response.json();
            let rawContent = data.choices[0].message.content;
            const cleanJson = rawContent.replace(/\`\`\`json/gi, '').replace(/\`\`\`/g, '').trim();
            let parsed = JSON.parse(cleanJson);
            
            // Clean sensitive words dynamically at runtime
            if (parsed.social_copy) parsed.social_copy = applyMedicalComplianceFilter(parsed.social_copy);
            if (parsed.pages) {
                parsed.pages.forEach(p => {
                    if (p.exact_text) p.exact_text = applyMedicalComplianceFilter(p.exact_text);
                });
            }
            return parsed;
        } catch (e) {
            console.error("Custom API Text Generation Failed:", e);
            throw new Error(`自定义 API 文本生成失败: ${e.message}。请检查您的 API Key、Base URL 或网络连接。`);
        }
    }

    // Default to free Puter.js AI
    try {
        const puterPromise = puter.ai.chat(systemPrompt + `\n\n用户主题：${topic}，当前属于【${currentTab === 'herb' ? '本草百科科普卡' : '经典养生图文卡'}】模块，需要生成 ${count} 张卡片。`);
        const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error("Puter AI Timeout")), 15000));
        
        const response = await Promise.race([puterPromise, timeoutPromise]);
        const cleanJson = response.replace(/\`\`\`json/gi, '').replace(/\`\`\`/g, '').trim();
        let parsed = JSON.parse(cleanJson);
        
        // Clean sensitive words dynamically at runtime
        if (parsed.social_copy) parsed.social_copy = applyMedicalComplianceFilter(parsed.social_copy);
        if (parsed.pages) {
            parsed.pages.forEach(p => {
                if (p.exact_text) p.exact_text = applyMedicalComplianceFilter(p.exact_text);
            });
        }
        return parsed;
    } catch (e) {
        console.error("LLM Pre-thinking failed:", e);
        throw new Error(e.message.includes('Timeout') ? "AI思考超时：Puter可能需要您登录授权，或者您可以选择自定义 API 并填入您的 API Key！" : "AI 中医知识思考失败，请检查网络或选择自定义 API 并配置 API Key。");
    }
}

// ── 2. Build Prompts from Dynamic Pages ──
function generatePromptFromData(topic, count, hasRefImage, dynamicData) {
    const refLine = hasRefImage
        ? '⚠️【垫图最高优先级】已上传参考图：深度分析其留白比例、排版风格，严格复刻并进行内容替换。'
        : '提示：上传一张排版参考图可完美复刻排版。';

    let header = `====================== 提示词开始 ======================
# 角色
开拓性的顶级大健康自媒体主编与东方美学视觉设计师。
${refLine}

# 全局美学与风格一致性协议（强制传递给每一张图）
- 统一画风锚点：${dynamicData.global_style}
- 尺寸：3:4 竖版 768×1024px
- 装饰：极简留白（>45%），禁止渐变块、3D效果、卡通。
- 相机：50mm 中景镜头，聚拢于中心70%区域，四周留出 15% 安全边距。

`;

    let pagesText = '';
    dynamicData.pages.forEach((page, i) => {
        pagesText += `## 图${i + 1}：${page.title}
画面主题及实物陈列：${page.img_prompt}
排版划分与实体绑定描述：${page.layout}
图上必须印刻的精确文字（多行折排）：
${page.exact_text}

`;
    });

    const footer = `# 执行要求
1. 严格按照以上每张图的排版、画面描述与多行精确中文文字渲染。
2. 每一个字词必须严格对准它在排版和画面里绑定的位置（印在特定纸签、木牌或横幅上）。
3. 直接调用生图模型逐张生成。
====================== 提示词结束 ======================`;

    return header + pagesText + footer;
}

// ── 3. Copy Text Generator ──
function generateCopyTextFromData(topic, count, style, d) {
    return d.social_copy || "暂无配文";
}

// ── 4. Image Panels (for Gallery Queue) ──
function getImagePanelsFromData(topic, count, d) {
    const panels = [];
    d.pages.forEach((page, i) => {
        // Enforce disclaimer and compliance filter
        let exactText = page.exact_text || "";
        if (!exactText.includes("科普说明") && !exactText.includes("仅供参考")) {
            exactText = exactText.trim() + "\n科普说明，内容仅供参考";
        }
        exactText = applyMedicalComplianceFilter(exactText);

        // Advanced local queue generation prompt assembling
        panels.push({
            title: page.title,
            desc: exactText.substring(0, 30).replace(/\n/g, ' ') + '...',
            prompt: `[Universal Subject Anchor: ${topic}]
【核心任务】：生成一张专业的高档新中式健康养生视觉信息图科普卡片。画幅比例为3:4竖版（高精分辨率：1456x2048像素）。
【全局视觉美学画风】：${d.global_style}。背景必须是干净高档的大面极纯色留白空间（留白率超过50%），严禁任何3D渐变块、卡通插画或低俗色彩。
【画面主体实物描述】：${page.img_prompt}。
【版面划分与实体排版描述】：${page.layout}。
【安全构图防裁切强制约束（极其重要）】：
1. ⚠️ 所有实物和图形元素（药材碗碟、原植物、牛皮纸克数便签等）以及渲染文字必须【高度聚拢收缩在画面中央 70% 的区域内】。
2. ⚠️ 图片的左、右、上、下边缘必须保留【至少 15% 的绝对安全极极简背景边距】，绝对禁止实物或字迹贴近边缘，以防发生视觉截断。
3. ⚠️ 镜头必须使用中远景或中景（Medium shot），绝不允许贴脸的特写或极端微距。
【强制底部低调免责】：必须在整张卡片底部正中央，印上一行极纤细小巧、淡灰色、几乎与背景融为一体的宋体汉字：“科普说明，内容仅供参考”，这行字应当非常低调，与卡片底边保持10%的安全间距。
【Flux级中文渲染与物理实体绑定协议】：
你必须将以下中文文字，一字不差地、极其精细清晰地印制上述画面描述所提到的“纸签”、“折角牛皮标签纸”、“横幅”或“宣纸色块区”上面。绝对禁止杂乱渲染，字迹边缘清晰锐利，严格遵循显式折行布局规则：
${exactText}`
        });
    });
    return panels.slice(0, count);
}
