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
    const hasRef = Array.isArray(refImages) ? refImages.length > 0 : !!refImages;
    
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
            styleDirective = "\n\n📢【最高美学指令：指定美学模板优先】\n用户指定了视觉模板：【" + currentTpl.name + "】。\n请你完全打破默认的四大主题分类自动路由，强行在全套 " + count + " 张图的 global_style、页面 layout 和 img_prompt 中彻底执行以下视觉风格规范：\n" + currentTpl.details + "\n请在贯穿该美学模板的基础上，为这 " + count + " 张图分别设计不同节奏的构图版式（第一页精美意境封面，第二页高低落差陈列/步骤，第三页斜向散落配比，第四页治愈捧杯特写/名言），使组图风格高度统一且排版丰富灵活，充满设计天赋！";
        }
    }

    // Module directives based on selected tab
    let moduleDirective = '';
    const toxicHerb = detectToxicHerb(topic);

    if (currentTab === 'herb') {
        moduleDirective = `

📢【本草百科专项设计协议（强制执行）】
你当前的任务是为单味中药【${topic}】定制一整套极其精美的“中草药本草百科科普卡”。
1. **生成内容结构（必须刚好包含 ${count} 个页面）**：
   * 第一页：【本草艺术意境封面】。排版：大面积极简留白(>50%)，中央为一个写意的植物剪影或中式圆窗/圆瓷盘，圆内是写意朦胧的【${topic}】药材单体摄影，左侧或顶部竖排苍劲毛笔书法大字标题，彰显东方雅致。
   * 第二页：【本草原貌干湿/生熟剖析】。排版：非对称双栏分割线。左侧为新鲜/采摘的【${topic}】微距特写，右侧为干燥或炮制后的【${topic}】高清细节，附以精细的性味、归经与产地小标签。
   * 第三页：【本草的核心配伍与功效清单】。排版：精美平铺式陈列网格。以极纤细秀气的引线指引核心配伍药材克数，贴有牛皮纸质感的微型便签。
   * 第四页：【日常冲泡或煮法三部曲】。排版：采用 1 | 2 | 3 竖向时间轴排版。每个步骤序号使用超大但颜色极淡的优雅宋体数字作为底纹，上方重叠黑色步骤小字。
   * 第五页：【千古医药典籍名言收尾】。排版：成品药茶在茶碗中热气腾腾的微距柔焦大片，居中排版《本草纲目》或《神农本草经》的经典记载，排版空灵脱俗。
   * 第六页：【避坑指南与服用禁忌】。排版：极简记事本排版。使用极纤细的小圆圈（○）作为 Checkbox，写明禁忌与注意事项，留白率>40%。

${toxicHerb ? `⚠️【检测到有毒/强限制级中草药 - 启动安全加页机制（生成7张卡片）】
用户输入的主题属于有毒或强限制级中草药：【${toxicHerb}】。
由于其具有药典毒性，卡片总数已由 6 张自动调升至 7 张。
你必须将全套卡片的最后一页（即 Page 7）强行设计为专门的【安全用药与规范炮制说明卡】。
该安全卡页面的具体设计要求：
- title: "安全用药与规范炮制说明"
- exact_text: 必须包含“${toxicHerb}有毒，须遵医嘱”以及关于“规范炮制、煮法（如先煎久煎）、慎用人群”的超精炼警示词，字数控制在 15~20 字以内。
- layout: 采用“上部朱红色粗框警示区，下部浅米色炮制说明”的卡片格式。
- img_prompt: 纯英文描述，画面采用警示或严谨学术风格，包含复古铜耳天平、药碾、以及带有警示框的宣纸标签，画面边缘带有深红色朱砂印章，为文字留出大面积极简纯色空间。
` : ''}

📢【医疗合规与避审过滤协议】
为了确保卡片可以通过社交平台的医疗健康内容审核，你必须强行对所有生成文字（exact_text 和 social_copy）进行安全替换：
- 绝对禁止使用“治愈”、“治疗”、“根治”、“特效”、“立刻痊愈”、“速效”、“抗癌”、“消炎”、“降血压”、“降血糖”等高风险绝对化诊疗词汇。
- “孕妇禁用/忌用/禁忌” 必须强行替换为 “特殊体质人群建议咨询医师”。
- 所有疗效与治愈词汇必须替换为 “辅助改善”、“协同调护”、“温和调理” 等温和养生词汇。
`;
    }

    const systemPrompt = `你是一位拥有30年临床经验的中医主任医师，也是顶级社交媒体（小红书/抖音等）大健康与东方美学领域的视觉创意总监与艺术主编。
用户会给出一个大健康或中医养生主题，你需要为其量身定制 ${count} 张极具艺术感、高档设计感、完全不雷同的小红书系列套图内容与一篇爆款笔记文案。

📢 当前垫图状态：【${hasRef ? "⚠️已上传参考图 - 必须执行【高保真复刻模式】" : "✨未上传参考图 - 必须执行【自主创意设计模式】"}】${styleDirective}${moduleDirective}

根据当前的垫图状态，请你严格执行以下分支设计逻辑，展示你作为顶级艺术总监的极致视觉控制力与卓越设计天赋：

==================================================
分支 A：【高保真复刻模式】（当已上传参考图时执行）
==================================================
1. **像素级提取与复刻排版**：你必须成为一名精密的视觉排版解码器。仔细解构用户提供的一张或多张参考图，并在返回的 JSON 的 global_style、每一页的 layout 和 img_prompt 中深度复刻它的排版与陈列精髓：
   * **智能过滤社交平台截图（如小红书整页截图）**：
     ⚠️【极其重要】：用户上传的参考图往往是直接从小红书、抖音等社交平台上截取的整页浏览器/手机截图。这类的典型特点是：**左半部分是笔记主图，而右半部分是点赞收藏栏、评论区、作者头像、笔记文本等社交 UI 侧边栏**。你必须具备智能视觉过滤能力，**彻底忽略右半部分的社交侧边栏、文字或评论，将注意力 100% 集中在左半部分（或图片主要展示区）的卡片排版上**！提取其斜向碟子、牛皮纸标签、纵向标题等实际图片中的精美陈列，千万不要被右半部分的侧边栏评论所干扰！
   * **排版陈列与构图**：解构并精准复刻参考图的陈列。如果原图是“左下角斜排小碟子装食材并带有小牛皮纸克数卡片标签，右下角一碗绿豆浆并有勺子舀起，右上角破壁机背景”，你就必须在每一页的英文陈列描述（img_prompt）中，100% 写入这种高保真的“小碟子、牛皮纸便签标签、勺子舀起”的画面指令！
   * **多图一对一对应复刻（多图顺序学习）**：当用户上传了多张参考图时，它们代表了整个套图里每一页的排版流。你必须将“第1张参考图的排版与陈列”赋予生成的第一页“Page 1”，“第2张参考图的排版与陈列”对应“Page 2”，以此类推。每一页都深度还原各自对应的参考图排版，使每一张图片都具备独特的设计。
   * **单图输入下的“风格同源，排版多样”延展机制**：
     ⚠️【特别注意】：如果用户只上传了1张参考图，但需要生成 ${count} 张卡片。你绝对不能让这 ${count} 张卡片都长得一模一样！你必须：
     - 将第一页（Page 1）作为**主封面**，高保真复刻该参考图的全部排版。
     - 从第二页（Page 2）开始，你必须提取参考图的“色调、光影、字体风格和特有装饰元素（如牛皮纸签、斜向木碟）”作为全局基调，但是**主动为后续页面变换排版布局**！例如：
       * 第一页复刻参考图的“斜向摆盘+大字标题”；
       * 第二页采用“极简奶油色卡片分栏，左侧放药材静物，右侧纵排小字原料单”；
       * 第三页采用“上下分栏，上部3:4特写煮茶烟雾，下部大白边写步骤”；
       * 第四页采用“居中优雅卡片边框，配以柔焦杯子”。
       这样既保证了同一套图的“风格绝对统一”，又实现了“排版极其丰富、互不雷同，充满了高档设计的呼吸感与专业度”！
2. **文字密度对齐**：
   * 如果参考图非常极简，图上字极少（只有大字标题+几个克数标签），你的 exact_text 也必须极简，把做法和原理都挪入文案中！
   * 必须对 exact_text 里的中文做【极简化精简提炼】：去掉所有无意义的修饰括号、冗长叙述，仅保留极短的骨架中文（如“1. 食材洗净；2. 破壁机打碎”），严格控制在15~20字以内以防乱码。

==================================================
分支 B：【自主创意设计模式】（当未上传参考图时执行）
==================================================
1. **分类美学定制与视觉叙事流程（根据主题，发挥设计天赋，拒绝雷同千篇一律）**：
   你必须像专业视觉设计师一样，根据用户输入的主题进行【辨证施图】，首先将主题归入以下四大维度之一，并采用完全不同的“排版构图变奏”与“视觉故事线”：

   * 🍵 【分类一：二十四节气与季节养生 (Seasonal Regimen)】
     - 视觉色系与光影：春（Sage green/亚麻白）；夏（荷粉/冰玉绿）；秋（麦芽金/陶土褐）；冬（石墨黑/奶油白）。
     - 排版故事线设计：
       * **第1页：【艺术意境封面】**。大面积留白(>50%)，上部写意山水/草本特写，下部大字书法标题。
       * **第2页：【节气作息建议/指南】**。精美细线双栏网格，左侧写时辰，右侧写养生习惯，辅以精致节气小插画。
       * **第3页：【季节食疗茶饮】**。亚麻布背景，斜向摆放精致药材，药材旁用极细指针引出克数便签。
       * **第4页：【养生功法/穴位卡片】**。圆角卡片底板，中央排列 3 条超短步骤。

   * 🍲 【分类二：单一本草食材科普 (Single Herb/Ingredient)】
     - 视觉色系与光影：Aged parchment yellow, natural clay brown, and raw wood tones（古典黄、黏土褐、原木色）。温暖柔和暗调侧光。
     - 排版故事线设计：
       * **第1页：【本草标本大片】**。左侧米黄底色块，右侧单体药材高清棚拍，大字书法标题。
       * **第2页：【生熟/干湿剖析图】**。左右非对称双栏。中间细黑线分割，下方贴克数折角牛皮便签。
       * **第3页：【工艺与浸润步骤】**。动感操作图。药汁注入杯中瞬间，左上角留白写步骤。
       * **第4页：【配伍与衍生方剂】**。极细手绘植物素描边框，中央排列方剂克数。

   * 💤 【分类三：痛点修复与亚健康调理 (Symptom Recovery)】
     - 视觉色系与光影：Serene dusk purple, lavender gray, and clean warm white（暮色紫、薰衣草灰、暖白）。治愈散光。
     - 排版故事线设计：
       * **第1页：【温馨治愈封面】**。右侧碗装热茶微距柔焦，左侧写圆润宋体标题。
       * **第2页：【痛点自测清单】**。记事本排版。使用极细小圆圈（○）作为Checkbox，字距松弛。
       * **第3页：【救急代茶饮方】**。斜向陈列。小碟盛放材料，碟旁贴微型折角克数纸标签。
       * **第4页：【生活作息/收尾卡片】**。居中排列设计典雅的日常叮咛卡片。

   * 🩺 【分类四：传统脏腑调理与经络 (Organ & Meridian Care)】
     - 视觉色系与光影：新中式极简。大面积淡青釉色、米浆白、古宣纸色。
     - 排版故事线设计：
       * **第1页：【中式极简美学封面】**。中央正圆形瓷盘或圆窗，竹影朦胧。圆旁竖排毛笔书法标题。
       * ***第2页：【经络循行与穴位】**。写意身体局部，标出穴位点，用纤细引线标出名称与秒数。
       * **第3页：【日常经络养护三部曲】**。1 | 2 | 3 竖向时间轴排版，超大淡色宋体数字底纹，重叠黑色小字。
       * **第4页：【古籍名言收尾】**。成品特写，居中排版极细名言古籍字样。

2. **同一套组图，风格高度统一原则**：
   每一张图都必须共享由 'global_style' 确立的全局视觉风格与背景色系，形成强烈的系列套图质感！你输出的 'global_style' 必须严格包含：统一的配色、统一的环境材质（例如宣纸/麻布/微粗砂）、统一的采光阴影（如穿透竹帘的晨光）、统一的相机焦段（50mm，中景）。

3. **字体与排版设计美学准则（打造美观富有设计感的版面）**：
   * 大标题：纵向或横向大号“黑色苍劲毛笔书法体 (elegant expressive vertical black ink calligraphy brush font)”。
   * 正文：清透纤细的宋体或思源黑体。
   * **呼吸感留白**：必须保持 **>45% 的干净留白背景空间**。文字区域严禁有杂物堆叠。所有元素内收聚拢在画面中央70%区域，四周边缘留出 **至少 15% 的绝对安全留白边距**！

4. **汉字渲染黄金铁律**：
   每张图的 exact_text 中文字数限制在 **15~20 字以内**！必须是分行短句，绝对禁止任何长句子！标题与正文必须层次分明（例如：大标题 + 2行超短正文），边缘绝对不能贴近图片边缘。

📢【免责声明强制渲染协议】
你必须在每一页卡片的 exact_text 最底部，强制性附带一行极低调的超精炼汉字：『科普说明，内容仅供参考』。

==================================================
社交文案设计要求（分支A与分支B均须严格执行）：
==================================================
无论在何种模式下，你都必须产出一篇极高干货深度、条理清晰的专业自媒体文案：
* 包含一个极具点击欲望的爆款标题（带 emoji）；
* 详细列出具体的食材配比（精确到克数）、功效原理分析、极其详尽的制作步骤、禁忌人群、以及“特殊体质人群建议咨询医师”的温馨提示；
* 分段清晰，带有小红书特有的表情符号，并在结尾带上 5 个以上的爆款热门话题标签。

请严格输出以下 JSON 结构（绝对只能输出纯合法的 JSON 字符串，绝对不要包含 any Markdown 标记如 JSON代码块）：
{
  "social_copy": "（爆款社交配文，字数在300~500字左右，极其专业具体且合规避审）",
  "global_style": "（全局英文视觉风格词，需符合对应模式）",
  "pages": [
    {
      "title": "页面小标题",
      "layout": "（本页排版分布指令，必须指明排版文字与实物的空间分割及位置，体现非雷同的排版节奏）",
      "exact_text": "必须印在这张图片上的精确中文内容（仅包含主标题、极度精炼的分点短词以及强制附带的“科普说明，内容仅供参考”，严格限制在 20 字以内）",
      "img_prompt": "（纯英文的单页主体画面实物描述，为排版留出大面积纯色干净背景空间，明确 15% edge safety margins 和中景 Medium shot 镜头）"
    }
    // ... 必须刚好包含 ${count} 个页面对象
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
            
            const userContent = [];
            
            userContent.push({
                type: "text",
                text: `用户主题：${topic}，当前属于【${currentTab === 'herb' ? '本草百科科普卡' : '经典养生图文卡'}】模块，需要生成 ${count} 张卡片。`
            });

            if (Array.isArray(refImages) && refImages.length > 0) {
                userContent.push({
                    type: "text",
                    text: `⚠️【最高优先级：多张风格参考图已上传】\n用户一共上传了 ${refImages.length} 张参考图。你必须对它们进行一对一的高保真复刻学习！\n请严格遵守以下规则：\n1. 【特别提醒】如果参考图是小红书等社交平台的整页浏览器/手机截图（左边是图片，右边或下边是点赞、评论、用户头像和笔记文字），你必须**彻底忽略右边/下边的所有社交 UI 和文字评论区**，将注意力 100% 聚焦在**左边/主图区域 of 卡片设计上**。深度提取左侧主图中的摆盘陈列、斜向碟子、卡片标签和文字排版精髓！\n2. 将第 1 张参考图的主图布局、摆盘陈列、色调与结构，完美复刻并映射到你生成的第 1 张卡片（Page 1）的 layout 与 img_prompt 中；\n3. 将第 2 张参考图的排版与画面陈列，映射到第 2 张卡片（Page 2）；\n4. 以此类推，实现“参考图 1 决定卡片 1，参考图 2 决定卡片 2...”，让每一张卡片的陈列都与对应的参考图高度吻合。\n5. 如果需要生成的卡片张数（当前为 ${count} 张）大于参考图数量（当前为 ${refImages.length} 张），对于超出的卡片，你可以循环套用参考图的排版风格或在整体风格调性一致的前提下进行创意延展。`
                });
                refImages.forEach((imgUrl, idx) => {
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
            } else if (refImages && typeof refImages === 'string' && refImages.trim() !== '') {
                userContent.push({
                    type: "text",
                    text: `⚠️【最高优先级风格参考图已被上传】\n请仔细分析用户上传的参考图。你必须在此后的 global_style 和每一页的 layout、exact_text 中深度提取并复刻该参考图的排版与风格精髓。\n请确保彻底忽略右半侧的社交界面。`
                });
                userContent.push({
                    type: "image_url",
                    image_url: {
                        url: refImages
                    }
                });
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
你是顶级大健康自媒体主编与专业信息图视觉设计师。
${refLine}

# 全局美学与风格一致性协议（强制传递给每一张图）
- 统一画风锚点：${dynamicData.global_style}
- 尺寸：3:4 竖版 768×1024px
- 装饰：极简留白（>40%），禁止渐变块、3D效果、卡通。

`;

    let pagesText = '';
    dynamicData.pages.forEach((page, i) => {
        pagesText += `## 图${i + 1}：${page.title}
排版指导：${page.layout}
图上精确文字：
${page.exact_text}

`;
    });

    const footer = `# 执行要求
1. 严格按照以上每张图的排版和精确文字生成，必须一字不差地印在图上。
2. 直接调用生图模型逐张生成。
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

        panels.push({
            title: page.title,
            desc: exactText.substring(0, 30).replace(/\n/g, ' ') + '...',
            prompt: `【核心任务】生成一张专业的高级新中式健康养生知识卡片。画幅比例为3:4竖版（高精分辨率：1456x2048像素）。
【全局画风与美学色彩】：${d.global_style}。背景必须有干净优雅的大面积极简留白空间，禁止任何3D、卡通或低档色彩。
【单页视觉主题与碗碟陈列】：${page.img_prompt}。
【文字与空间布局排版】：${page.layout}。
【安全构图防裁切强制约束（极其重要）】：
1. ⚠️ 所有视觉元素（包括药材碗碟、斜向碟子、食物、排版文字、牛皮纸克数便签等）必须**内收聚拢在画面中央70%的区域内**！
2. ⚠️ 图片的左、右、上、下边缘必须保留**至少 15% 的绝对安全留白边距**！严禁将任何文字、标签或实物边缘贴近画幅边缘，防止发生视觉截断或出界！
3. ⚠️ 必须使用中远景或中景镜头（Medium shot / Eye-level shot），让所有摆盘与排版文字完整呈现在画面中心，**绝对禁止使用贴脸的特写或极端微距镜头**！
【强制底部免责声明】：必须在卡片最底部正中央，印上一行极其清透纤细、字号极小的淡灰色宋体汉字：“科普说明，内容仅供参考”。这行字应当非常低调，与卡片底边保持10%的安全边距。
【必须清晰印在图上的极简中文文字】：
（核心渲染规则：主标题使用纵向排版的大气优雅黑色毛笔书法字，副标题使用精致的小字书写在标题旁；配料名与克数用极其秀气的细黑字书写在对应碗碟旁的小牛皮纸便签上。严格禁止大段落文字，字数控制在25字内以防乱码，字符边缘清晰，绝对对齐）
${exactText}`
        });
    });
    return panels.slice(0, count);
}
