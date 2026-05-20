// ==========================================
// prompts.js - Fully Dynamic LLM Architecture
// ==========================================

// ── 1. Dynamic Knowledge & Structure Generation ──
async function fetchKnowledgeFromLLM(topic, count, refImages) {
    const hasRef = Array.isArray(refImages) ? refImages.length > 0 : !!refImages;
    const systemPrompt = `你是一位拥有30年临床经验的中医主任医师，也是顶级社交媒体（小红书/抖音等）大健康与东方美学领域的视觉创意总监与艺术主编。
用户会给出一个大健康或中医养生主题，你需要为其量身定制 ${count} 张极具艺术感、高档设计感、完全不雷同的小红书系列套图内容与一篇爆款笔记文案。

📢 当前垫图状态：【${hasRef ? "⚠️已上传参考图 - 必须执行【高保真复刻模式】" : "✨未上传参考图 - 必须执行【自主创意设计模式】"}】

根据当前的垫图状态，请你严格执行以下分支设计逻辑，展示你作为顶级艺术总监的极致视觉控制力与卓越设计天赋：

==================================================
分支 A：【高保真复刻模式】（当已上传参考图时执行）
==================================================
1. **像素级提取与复刻排版**：你必须成为一名精密的视觉排版解码器。仔细解构用户提供的一张或多张参考图，并在返回的 JSON 的 global_style、每一页的 layout 和 img_prompt 中深度复刻它的排版与陈列精髓：
   * **智能过滤社交平台截图（如小红书整页截图）**：
     ⚠️【极其重要】：用户上传的参考图往往是直接从小红书、抖音等社交平台上截取的整页浏览器/手机截图。这类截图的典型特点是：**左半部分是笔记主图，而右半部分是点赞收藏栏、评论区、作者头像、笔记文本等社交 UI 侧边栏**。你必须具备智能视觉过滤能力，**彻底忽略右半部分的社交侧边栏、文字或评论，将注意力 100% 集中在左半部分（或图片主要展示区）的卡片排版上**！提取其斜向碟子、牛皮纸标签、纵向标题等实际图片中的精美陈列，千万不要被右半部分的侧边栏评论所干扰！用户不需要手动裁剪，你应当前置完成视觉过滤！
   * **排版陈列与构图**：解构并精准复刻参考图的陈列。如果原图是“左下角斜排小碟子装食材并带有小牛皮纸克数卡片标签，右下角一碗绿豆浆并有勺子舀起，右上角破壁机背景”，你就必须在每一页的英文陈列描述（img_prompt）中，100% 写入这种高保真的“小碟子、牛皮纸便签标签、勺子舀起”的画面指令！
   * **多图一对一对应复刻（多图顺序学习）**：当用户上传了多张参考图时，它们代表了整个套图里每一页的排版流。你必须将“第1张参考图的排版与陈列”赋予生成的第一页“Page 1”，“第2张参考图的排版与陈列”对应“Page 2”，以此类推。每一页都深度还原各自对应的参考图排版（“参考图 1 决定卡片 1，参考图 2 决定卡片 2”），使每一张图片都具备独特的设计。
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
   * 必须对 exact_text 里的中文做【极简化精简提炼】：去掉所有无意义的修饰括号、冗长叙述，仅保留极短 of 骨架中文（如“1. 食材洗净；2. 破壁机打碎”），严格控制在15~20字以内以防乱码。

==================================================
分支 B：【自主创意设计模式】（当未上传参考图时执行）
==================================================
1. **分类美学定制与视觉叙事流程（根据主题，发挥设计天赋，拒绝雷同千篇一律）**：
   你必须像专业视觉设计师一样，根据用户输入的主题进行【辨证施图】，首先将主题归入以下四大维度之一，并采用完全不同的“排版构图变奏”与“视觉故事线”：

   * 🍵 【分类一：二十四节气与季节养生 (Seasonal Regimen)】
     - **适用主题**：春季养肝、秋季补肺、冬令进补、清明祛湿等季节或气候主题。
     - **视觉色系与光影**：
       * 春：Sage green and warm linen white (草绿与亚麻白)，柔和朝阳晨光。
       * 夏：Pale lotus pink and cool jade green (荷粉与冰玉绿)，明亮晴空漫射光。
       * 秋：Honey oat beige and soft clay brown (麦芽金与陶土褐)，温暖黄昏逆光。
       * 冬：Serene charcoal black and creamy plaster white (石墨黑与奶油白)，静谧冬日天光。
     - **排版故事线设计 (Storytelling Layouts)**：
       * **第1页：【艺术意境封面】**。排版：大面积留白(>50%)，上部70%为轻烟缭绕的雾气山水或一枝带露水的草本植物特写，下部30%使用淡奶油色色块，居中排列大字毛笔书法标题与极小秀气英文。
       * **第2页：【节气作息建议/指南】**。排版：采用精美细线双栏表格网格(Grid Table)，左栏书写时辰(如“子时、晨起”)，右栏书写极简养生习惯，边缘辅以精致的圆形二十四节气篆刻印章小插图。
       * **第3页：【季节食疗茶饮】**。排版：平铺式草本陈列。浅色亚麻布背景上，斜向摆放几款精致药材，每款药材旁用极纤细的指针引出微小手写感克数标签。
       * **第4页：【养生功法/穴位卡片】**。排版：优雅温润的圆角卡片底板，背景为精美的草本凸压印暗纹，居中排版 3 条清透短小步骤。

   * 🍲 【分类二：单一本草食材科普 (Single Herb/Ingredient)】
     - **适用主题**：生姜养生、人参妙用、枸杞补益、陈皮时间等特定药食同源食材主题。
     - **视觉色系与光影**：Aged parchment yellow, natural clay brown, and raw wood tones (古老羊皮纸黄、黏土褐、原木色)。温暖柔和的暗调侧光(Moody side light)，营造历史厚重感与传统本草本源美学。
     - **排版故事线设计 (Storytelling Layouts)**：
       * **第1页：【本草标本大片】**。排版：左侧45%为干净的米黄色纹理背景块，右侧55%为单体药材的极高清微距棚拍摄影（如一颗带霜的陈皮或饱满的枸杞）。文字：左侧纵向排版的大字繁体书法标题，极具典籍感。
       * **第2页：【生熟/干湿剖析图】**。排版：左右非对称双栏分割。左半边是新鲜/生药材，右半边是炮制后/熟药材的精细微距摄影，中间用一条极细的高级黑线分割，药材下方贴有牛皮纸质感的微型便签。
       * **第3页：【工艺与浸润步骤】**。排版：动感操作图。画面右下角70%为药材在沸水中舒展或药汁注入杯中的瞬间特写，左上角30%留出纯白背景块用作写步骤。
       * **第4页：【配伍与衍生方剂】**。排版：手绘风卡片边框。四周有一圈极细的植物花草素描边框，中央为浅米色，排版经典的君臣佐使方剂克数。

   * 💤 【分类三：痛点修复与亚健康调理 (Symptom Recovery)】
     - **适用主题**：熬夜修复、脾胃调理、防脱发、抗疲劳、痛经调理等健康痛点。
     - **视觉色系与光影**：Serene dusk purple, lavender gray, and clean warm white (静谧暮色紫、薰衣草灰、极简暖白)。温暖治愈的卧室柔焦散光，营造抚平焦虑、温馨舒缓的安全感。
     - **排版故事线设计 (Storytelling Layouts)**：
       * **第1页：【温馨治愈封面】**。排版：偏心构图。右侧放置一碗冒着微热白气的粗陶药茶（微距对焦，背景为阳光窗台），左侧留白写粗体圆润的宋体标题，充满生活气息与治愈感。
       * **第2页：【痛点自测清单】**。排版：极简现代记事本排版。使用极纤细的小圆圈（○）作为Checkbox，右侧书写4个极简痛点特征（如“○ 面色发黄、○ 晨起口苦”），字行距松弛，留白率>40%。
       * **第3页：【救急代茶饮方】**。排版：斜向陈列。左下角斜排三个小碟子分别盛放材料，右上角一碗泡好的茶水，碟子旁贴有微型纸质折角克数标签。
       * **第4页：【生活作息/伸展操卡片】**。排版：浅色背景上，居中排列一张设计典雅的日常叮咛卡片，四角带有复古铜耳卡扣暗纹。

   * 🩺 【分类四：传统脏腑调理与经络 (Organ & Meridian Care)】
     - **适用主题**：脾胃虚弱、心火旺盛、肺气不足、肾虚调理等五脏六腑或经络经穴主题。
     - **视觉色系与光影**：Kinfolk new Chinese minimalism (新中式极简杂志风)。以大面积的淡青釉色、米浆白、古宣纸色为主调，搭配清晨穿透竹帘的条纹柔和光影。
     - **排版故事线设计 (Storytelling Layouts)**：
       * **第1页：【中式极简美学封面】**。排版：画面中央为一个完美的正圆形瓷盘或圆窗取景，圆内是雾气朦胧的写意竹影，圆形外部为大面积纯宣纸白。标题以极具张力的竖排黑色毛笔字纵向排列在圆盘左侧。
       * **第2页：【经络循行与穴位】**。排版：极简写意的人物侧影或局部（如手腕/足部），标出关键穴位点，用纤细引线标出穴位名称与点按秒数，画面极其干净，充满现代医学设计感。
       * **第3页：【日常经络养护三部曲】**。排版：采用 1 | 2 | 3 竖向时间轴排版，每个步骤序号使用非常大但颜色极淡的优雅宋体数字作为底纹背景，上方重叠黑色正文小字。
       * **第4页：【黄帝内经名言收尾】**。排版：成品特写（如双手捧着温热的粗陶茶杯，微距柔焦，背景极简），居中排版一句经典古籍名言，字号细小，高雅脱俗。

2. **同一套组图，风格高度统一原则**：
   对于一套包含 ${count} 张图的完整作品，每一张图都必须共享由 'global_style' 确立的全局视觉风格与背景色系，形成强烈的系列套图质感！你输出的 'global_style' 必须严格包含以下关键信息，并且每一页的 'img_prompt' 都必须将其作为开篇第一句话引入：
   - 统一的色调与配色体系 (Consistent color scheme with exactly 3 matched colors).
   - 统一的环境材质（例如：rough textured linen, vintage clay pottery, coarse handmade paper background）.
   - 统一的采光与阴影条件（例如：serene diffused morning side light with delicate bamboo blinds shadow）.
   - 统一的相机视角与焦段（例如：50mm lens, eye-level angle, medium shot, consistent soft depth of field）。

3. **字体与排版设计美学准则（打造美观富有设计感的版面）**：
   排版与字体的空间配合是高端设计的核心，请在 'layout' 中精确指示设计参数：
   * **汉字字体渲染层次**：
     - **大标题**：采用纵向或横向大号“黑色苍劲毛笔书法体 (elegant expressive vertical black ink calligraphy brush font)”。
     - **正文与步骤**：采用“清透纤细的宋体或思源黑体 (thin minimalist Songti or Source Han Sans font)”。
     - **数值与标签**：采用“极纤细秀气的数字配以微型卡片标签 (extremely delicate labels with clean fine text)”。
   * **非对称排版与呼吸感留白**：
     - 每张图片必须保持 **>45% 的干净留白背景空间**。
     - 文字和药材陈列必须形成完美的虚实对比，**文字所在的区域背景必须是绝对纯色或无杂物的微纹理底色**，严禁药材、器具叠在文字上方影响阅读。
     - 每张图的画面元素必须在视觉上**内收聚拢在画面中央70%的区域内**，四周边缘留出 **至少 15% 的绝对安全留白边距**，绝对禁止文字贴边。

4. **汉字渲染黄金铁律**：
   每张图的 exact_text 中文字数限制在 **15~20 字以内**！必须是分行短句，绝对禁止任何长句子！标题与正文必须层次分明（例如：大标题 + 2行超短正文），边缘绝对不能贴近图片边缘。

==================================================
社交文案设计要求（分支A与分支B均须严格执行）：
==================================================
社交媒体配文（social_copy）是决定笔记曝光和转化率的灵魂！无论在何种模式下，你都必须在此处产出一篇极高干货深度、条理清晰的专业中医养生文案：
* 包含一个极具点击欲望的爆款标题（带 emoji）；
* 详细列出具体的食材配比（精确到克数/用量）、功效原理分析、极其详尽的制作步骤与熬煮细节、以及具有 clinical 临床经验感的温馨叮嘱（禁忌人群、食用时间等）；
* 分段清晰，带有小红书特有的表情符号，并在结尾带上 5 个以上的爆款热门话题标签。

请严格输出以下 JSON 结构（绝对只能输出纯合法的 JSON 字符串，绝对不要包含 any Markdown 标记如 JSON代码块）：
{
  "social_copy": "（爆款社交配文，字数在300~500字左右，极其专业具体）",
  "global_style": "（全局英文视觉风格词，需符合对应模式）",
  "pages": [
    {
      "title": "页面小标题（例如：主封面 / 核心选料 / 调理步骤）",
      "layout": "（本页排版分布指令，必须指明排版文字与实物的空间分割及位置，体现非雷同的排版节奏）",
      "exact_text": "必须印在这张图片上的精确中文内容（仅包含主标题、以及极度精炼的分点短词。字数限制在 15~20 字内，禁止冗长叙述）",
      "img_prompt": "（纯英文的单页主体画面实物描述，必须明确指明为排版留出大面积的纯色干净背景空间，不得有乱物遮挡文字，并结合该页的布局进行场景陈列描述，务必指定 15% edge safety margins 和中景 Medium shot 镜头）"
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
            
            // Build multimodal or standard messages
            const userContent = [];
            
            userContent.push({
                type: "text",
                text: `用户主题：${topic}，需要生成 ${count} 张卡片。`
            });

            if (Array.isArray(refImages) && refImages.length > 0) {
                userContent.push({
                    type: "text",
                    text: `⚠️【最高优先级：多张风格参考图已上传】\n用户一共上传了 ${refImages.length} 张参考图。你必须对它们进行一对一的高保真复刻学习！\n请严格遵守以下规则：\n1. 【特别提醒】如果参考图是小红书等社交平台的整页浏览器/手机截图（左边是图片，右边或下边是点赞、评论、用户头像和笔记文字），你必须**彻底忽略右边/下边的所有社交 UI 和文字评论区**，将注意力 100% 聚焦在**左边/主图区域的卡片设计上**。深度提取左侧主图中的摆盘陈列、斜向碟子、卡片标签和文字排版精髓！用户不需要手动裁剪截图，你应当智能识别主图并高保真复刻！\n2. 将第 1 张参考图的主图布局、摆盘陈列、色调与结构，完美复刻并映射到你生成的第 1 张卡片（Page 1）的 layout 与 img_prompt 中；\n3. 将第 2 张参考图的排版与画面陈列，映射到第 2 张卡片（Page 2）；\n4. 以此类推，实现“参考图 1 决定卡片 1，参考图 2 决定卡片 2...”，让每一张卡片的陈列（斜向碟子、卡片克数便签、纵向标题等）都与对应的参考图高度吻合，生成活泼富有层次的变化套图，而不是让所有卡片都拥有一模一样的背景排版。\n5. 如果需要生成的卡片张数（当前为 ${count} 张）大于参考图数量（当前为 ${refImages.length} 张），对于超出的卡片，你可以循环套用参考图的排版风格或在整体风格调性一致的前提下进行合乎主题 of 养生美学的创意延展。`
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
            } else if (refImages) {
                // Fallback for single image input
                userContent.push({
                    type: "text",
                    text: `⚠️【最高优先级风格参考图已被上传】\n请仔细分析用户上传的参考图。你必须在此后的 global_style 和每一页的 layout、exact_text 甚至文字字号层级描述中，深度提取并复刻该参考图的排版与风格精髓。\n请严格遵守以下规则：\n1. 【特别提醒】如果参考图是小红书等社交平台的整页浏览器/手机截图（左边是图片，右边或下边是点赞、评论、用户头像和笔记文字），你必须**彻底忽略右边/下边的所有社交 UI 和文字评论区**，将注意力 100% 聚焦在**左边/主图区域的卡片设计上**。深度提取左侧主图中的摆盘陈列、斜向碟子、卡片标签和文字排版精髓！用户不需要手动裁剪截图，你应当智能识别主图并高保真复刻！\n2. 深度提取并复刻该参考图主图的：\n   - 颜色搭配与色调（如米底绿字、深褐复古等）\n   - 空间构图与排版（如文字在左侧占据 40%，图片在右侧占据 60%；斜向碟子、卡片克数便签、纵向毛笔标题等）\n   - 元素密度与艺术媒介风格（如极简主义、杂志内页风、高调摄影、自然采光）。\n请在返回的 JSON 中，用极具描述力的英文写出这些排版风格细节，使生图模型能够生成与参考图高度一致的主题卡片排版。`
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
            return JSON.parse(cleanJson);
        } catch (e) {
            console.error("Custom API Text Generation Failed:", e);
            throw new Error(`自定义 API 文本生成失败: ${e.message}。请检查您的 API Key、Base URL 或网络连接。`);
        }
    }

    // Default to free Puter.js AI
    try {
        const puterPromise = puter.ai.chat(systemPrompt + `\n\n用户主题：${topic}，需要生成 ${count} 张卡片。`);
        const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error("Puter AI Timeout - 可能弹出了授权窗口，请留意浏览器拦截提示")), 15000));
        
        const response = await Promise.race([puterPromise, timeoutPromise]);
        const cleanJson = response.replace(/\`\`\`json/gi, '').replace(/\`\`\`/g, '').trim();
        return JSON.parse(cleanJson);
    } catch (e) {
        console.error("LLM Pre-thinking failed:", e);
        throw new Error(e.message.includes('Timeout') ? "AI思考超时：Puter可能需要您登录授权，或者您可以选择自定义 API 并填入您的 API Key！" : "AI 中医知识思考失败，请检查网络或选择自定义 API 并配置 API Key。");
    }
}

// ── 2. Build Prompts from Dynamic Pages ──
function generatePromptFromData(topic, count, hasRefImage, dynamicData) {
    const refLine = hasRefImage
        ? '⚠️【垫图最高优先级】已上传参考图：深度分析其留白比例、字体层级、元素密度，严格复刻其排版风格，仅替换文字内容和主题元素。'
        : '建议：上传一张您喜欢的排版参考图（小红书截图或杂志内页），AI 会完整复刻其风格。';

    let header = `====================== 提示词开始 ======================
# 角色
你是顶级大健康自媒体主编与专业信息图视觉设计师。
${refLine}

# 全局美学与风格一致性协议（强制传递给每一张图）
- 统一画风锚点：${dynamicData.global_style}
- 尺寸：3:4 竖版 768×1024px
- 装饰：极简留白（>40%），禁止渐变块、3D效果、卡通元素。

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
2. 直接调用 DALL-E 3 / GPT-Image 逐张生成。
====================== 提示词结束 ======================`;

    return header + pagesText + footer;
}

// ── 3. Copy Text Generator ──
function generateCopyTextFromData(topic, count, style, d) {
    // We now just use the highly contextual social copy generated by the LLM
    return d.social_copy || "暂无配文";
}

// ── 4. Image Panels (for Gallery Queue) ──
function getImagePanelsFromData(topic, count, d) {
    const panels = [];
    d.pages.forEach((page, i) => {
        panels.push({
            title: page.title,
            desc: page.exact_text.substring(0, 20).replace(/\n/g, ' ') + '...',
            prompt: `【核心任务】生成一张专业的高级新中式健康养生知识卡片。画幅比例为3:4竖版（高精分辨率：1456x2048像素）。
【全局画风与美学色彩】：${d.global_style}。背景必须有干净优雅的大面积极简留白空间，禁止任何3D、卡通或低档色彩。
【单页视觉主题与碗碟陈列】：${page.img_prompt}。
【文字与空间布局排版】：${page.layout}。
【安全构图防裁切强制约束（极其重要）】：
1. ⚠️ 所有视觉元素（包括药材碗碟、斜向碟子、食物、排版文字、牛皮纸克数便签等）必须**内收聚拢在画面中央70%的区域内**！
2. ⚠️ 图片的左、右、上、下边缘必须保留**至少 15% 的绝对安全留白边距**！严禁将任何文字、标签或实物边缘贴近画幅边缘，防止发生视觉截断或出界！
3. ⚠️ 必须使用中远景或中景镜头（Medium shot / Eye-level shot），让所有摆盘与排版文字完整呈现在画面中心，**绝对禁止使用贴脸的特写或极端微距镜头**！
【必须清晰印在图上的极简中文文字】：
（核心渲染规则：主标题使用纵向排版的大气优雅黑色毛笔书法字，副标题使用精致的小字书写在标题旁；配料名与克数用极其秀气的细黑字书写在对应碗碟旁的小牛皮纸便签上。严格禁止大段落文字，字数控制在15~20字内以防乱码，字符边缘清晰，绝对对齐）
${page.exact_text}`
        });
    });
    return panels.slice(0, count);
}
