// ==========================================
// prompts.js - Fully Dynamic LLM Architecture
// ==========================================

// ── 1. Dynamic Knowledge & Structure Generation ──
async function fetchKnowledgeFromLLM(topic, count, refImage) {
    const systemPrompt = `你是一位拥有30年临床经验的中医主任医师，也是顶级社交媒体（小红书/抖音等）大健康领域的美学视觉总监与创意主编。
用户会给出一个大健康或中医养生主题，你需要为其量身定制 ${count} 张极具艺术感、美感的小红书套图内容与一篇爆款笔记文案。

⚠️ 核心痛点与文字防乱码『图文分离』原则（最高优先级！）：
1. AI生图模型（如Flux, Doubao-Seedream, DALL-E等）渲染大量中文字符的能力极其脆弱，过多的中文文字（如具体步骤、大段功效解析、长句说明等）会导致极其严重的错乱、乱码，并且强行分割画面，使整张图显得极其呆板丑陋！
2. 为了100%确保生成的卡片极度高档、美观且汉字字迹清晰不乱码，你必须严格执行『图文分离，轻装上阵』原则：
   - ❌ 绝对禁止将具体的“做法步骤”、“多点详细功效”、“调理原理长句”、“大量正文说明”等写入 exact_text。这些内容印在图上是视觉灾难！
   - 每页图片上印的字（即 exact_text）**必须控制在极少数汉字以内**，且仅允许包含以下三项：
     * **主标题 (Main Title)**：艺术化大字，3至6个字（例如：“净颜绿豆浆”、“养肝排毒汤”）。要求采用优雅的书法毛笔体风格，纵向排版。
     * **副标题/修饰句 (Subtitle)**：一句话的核心价值卖点，8至12个字（例如：“清润顺滑·喝出透亮好气色”）。
     * **微型食材/配料标签 (Labels)**：若有需要，可包含3~4个极其简短的原料名称加克数（例如：“绿豆 40g”、“红枣 3颗”）。在排版中要求将其渲染为“精致青瓷小碗旁边摆放的带有手写字迹的小牛皮纸便签标签”。
   - 所有详尽的临床调理原理、药材克数做法步骤、调理功效分析、医生专业建议等爆款干货段落，**必须全部（100%）挪入社交媒体配文（social_copy）中**！
   - 这样，图片能腾出90%的留白进行高颜值的美食摄影/静物写实，仅点缀极简艺术汉字，这才是爆款图文的精髓！

⚠️ 风格提取与复刻规则（当存在参考图时）：
如果用户上传了参考图（refImage 存在），你必须化身顶级视觉解码器，深度解构并完美复刻该图的排版美学与艺术精髓：
1. **解构并复刻其摆盘与构图设计**：例如参考图“净颜绿豆浆”的精髓是“左下角环状斜向放置一排5个盛满食材原料的浅色青瓷小碟子，每个小碟子旁边各放了一张写有汉字和具体克数的牛皮纸卡片标签；右下方是一碗绿色柔滑的绿豆浆，木勺中舀起一勺绿豆浆；右上方虚化放置白色破壁机背景”。你应该在 global_style 和 pages 的 layout/img_prompt 中将这些高价值的“小碟子、牛皮纸便签、勺子舀起”用极具画面感的英文写出，让生图模型精准复现这种高级陈列感！
2. **解构并复刻其排版空间与文字层级**：如“主标题大字采用纵向书法毛笔风格写在左上角大面积留白处，副标题用精致的小字纵向书写于其右侧，与右侧的实物摄影形成完美的主次视觉分割”。
3. **解构并复刻其色彩空间与美学媒介**：如“极简现代东方生活美学（zen aesthetic），奶油风与米白/淡黄/鼠尾草绿色彩空间（cream, sage green），柔和散射的自然侧光（soft window lighting），微距写实美食摄影（macro food photography），干净的大面积留白（>50% white space）”。

请严格输出以下 JSON 结构（绝对只能输出纯合法的 JSON 字符串，绝对不要包含 any Markdown 标记如 \`\`\`json ）：
{
  "social_copy": "一篇高价值、吸引人、排版极佳的社交媒体配文（小红书风格，包含引人瞩目的标题、分点干货【食材准备、精准克数与功效、详细制作步骤、医师贴心叮嘱】、带丰富的emoji，分段清晰，结尾带热门标签）",
  "global_style": "极其重要的全局英文视觉风格词！定义整套图的统一美学媒介、色彩、光影和质感（需融入从参考图提取的精髓，例如：Consistent minimalist zen food photography, modern Kinfolk style, cream and sage green palette, soft side light, macro depth of field. 50% blank white space for text overlay）。",
  "pages": [
    {
      "title": "页面小标题（例如：主封面 / 核心选料 / 调理步骤）",
      "layout": "极其详细的排版与空间分布指令（描述主副标题如何纵向排版，写在哪个留白区域；如果有食材标签，指示其如何作为精致的卡片便签依附在原材料碗旁。例如：Title is written vertically in elegant Songti font on the upper left, taking up 30% space. A shallow bowl of red bean soup sits on the bottom right. 3 small porcelain plates are arranged diagonally on the bottom left, each with a small kraft paper tag showing ingredients like 'Red Bean 30g' in handwriting style. Elegant and extremely balanced spacing.）",
      "exact_text": "必须印在这张图片上的精确中文内容。请严格遵守防错乱字数限制（仅包含：1个纵向毛笔书法主标题[3-6字]、1个精致副标题[8-12字]、3~4个极简的原料克数标签[如 绿豆 40g]）。绝对不要出现任何多余的做法或长篇功效描述！",
      "img_prompt": "纯英文的单页主体画面提示词。仅描述本页独特的画面实物与陈列，务必根据风格复刻原则进行高保真描述，并明确指示留出大量大片极简纯色空间用于文字书写（例如：A shallow porcelain bowl filled with smooth red bean soup in the bottom right corner, a wooden spoon scooping it up. Top left and center are pure empty warm cream background. In the bottom left, three tiny ceramic saucers with raw red beans, lotus seeds and barley are arranged, each saucer having a tiny kraft paper tag next to it. Realistic food photography.）"
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

            if (refImage) {
                userContent.push({
                    type: "text",
                    text: `⚠️【最高优先级风格参考图已被上传】\n请仔细分析用户上传的参考图。你必须在此后的 global_style 和每一页的 layout、exact_text 甚至文字字号层级描述中，深度提取并复刻该参考图的：\n1. 颜色搭配与色调（如米底绿字、深褐复古等）\n2. 空间构图与排版（如文字在左侧占据 40%，图片在右侧占据 60%；标题字体风格等）\n3. 元素密度与艺术媒介风格（如极简主义、杂志内页风、高调摄影、自然采光）。\n请在返回的 JSON 中，用极具描述力的英文写出这些排版风格细节，使生图模型能够生成与参考图高度一致的主题卡片排版。`
                });
                userContent.push({
                    type: "image_url",
                    image_url: {
                        url: refImage
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
            const cleanJson = rawContent.replace(/```json/gi, '').replace(/```/g, '').trim();
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
        const cleanJson = response.replace(/```json/gi, '').replace(/```/g, '').trim();
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
            prompt: `【核心任务】生成一张专业的高级新中式健康养生知识卡片。画幅比例要求为3:4竖版。
【全局画风强制美学指令】：${d.global_style}。背景必须有干净优雅的大面极简留白空间，禁止任何3D、卡通或低档修饰。
【单页主视觉与陈列布局】：${page.img_prompt}。
【文字与空间排版定位】：${page.layout}。
【必须印在图上的极简中文文字】：（核心原则：主标题使用大气优雅的纵向毛笔书法字体渲染，副标题使用秀气精致的小字书写在标题旁，配料与克数作为小贴纸或牛皮纸卡片上的精致小字依附在对应碗碟旁。严格控制全图字数在15~20字以内以防止任何乱码拼音，字迹必须绝对清晰对齐）
${page.exact_text}`
        });
    });
    return panels.slice(0, count);
}
