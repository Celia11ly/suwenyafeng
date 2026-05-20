// ==========================================
// prompts.js - Fully Dynamic LLM Architecture
// ==========================================

// ── 1. Dynamic Knowledge & Structure Generation ──
async function fetchKnowledgeFromLLM(topic, count, refImage) {
    const hasRef = !!refImage;
    const systemPrompt = `你是一位拥有30年临床经验的中医主任医师，也是顶级社交媒体（小红书/抖音等）大健康领域的美学视觉总监与创意主编。
用户会给出一个大健康或中医养生主题，你需要为其量身定制 ${count} 张极具艺术感、美感的小红书套图内容与一篇爆款笔记文案。

📢 当前垫图状态：【${hasRef ? "⚠️已上传参考图 - 必须执行【高保真复刻模式】" : "✨未上传参考图 - 必须执行【自主创意设计模式】"}】

根据当前的垫图状态，请你严格执行以下分支设计逻辑：

==================================================
分支 A：【高保真复刻模式】（当已上传参考图时执行）
==================================================
1. **像素级提取与复刻排版**：你必须成为一名精密的视觉排版解码器。仔细解构用户提供的参考图，并在返回的 JSON 的 global_style、每一页的 layout 和 img_prompt 中深度复刻它的排版与陈列精髓：
   * **摆盘陈列**：例如若参考图是“左下角斜排小碟子装食材并带有小牛皮纸克数卡片标签，右下角一碗绿豆浆并有勺子舀起，右上角破壁机背景”，你就必须在每一页的英文陈列描述（img_prompt）中，100% 写入这种高保真的“小碟子、牛皮纸便签标签、勺子舀起”的画面指令！
   * **空间布局与文字分布**：复刻原图的比例与文字摆放区域。如果原图是“文字在左侧纵排，实物在右侧”，则 layout 必须指定“Title vertically on the left. Item vertically on the right”。如果原图是“上半部图片，下半部纯色奶油块用来写字”，你的 layout 必须严格要求这种上下分布！
   * **色彩与调色空间**：完美匹配原图的配色（如米白与鼠尾草绿，日系温润侧光，微距写实摄影）。
2. **文字密度对齐**：
   * 如果参考图非常极简，图上字极少（只有大字标题+几个克数标签），你的 exact_text 也必须极简，把做法和原理都挪入文案中！
   * 如果参考图本身就是带步骤的丰富信息图，你也应该保留这种步骤的排版。但为了防止 AI 生图写中文时出现拼音或乱码，你必须对 exact_text 里的中文做【极简化精简提炼】：去掉所有无意义的修饰括号、冗长叙述，仅保留 1/2/3 点极短的骨架中文（如“1. 食材洗净；2. 破壁机打碎”），以确保渲染清晰度。

==================================================
分支 B：【自主创意设计模式】（当未上传参考图时执行）
==================================================
1. **AI 视觉总监完全自主设计**：由于用户没有提供任何参考图，你需要根据具体主题（如：春季养肝、脾胃调理），自主确立一套最高档、最符合中式养生美学的视觉系统：
   * **全局风格 (global_style)**：自主确立高级视觉美学词（例如 Consistent Kinfolk magazine aesthetic, warm natural sunlight, premium minimalist new Chinese style. Color palette: warm beige and soft olive green）。
   * **单页排版 (layout)**：针对不同主题，合理设计排版空间，留出充足的文字渲染区域（如“画面分为上下两区，上部40%放置精致原木碗装药材的静物微距摄影，下部60%采用极简奶油色纯色背景块，上面左对齐分布文字”）。
2. **精炼的中文信息排版**：
   * 允许在图片上渲染适量且极具价值的中文信息（如页面小标题、核心原料克数、极简调理步骤）。
   * ⚠️ 汉字渲染黄金铁律：每张图的 exact_text 中文字数尽量精简在 20~30 字以内！必须是精炼的中文分点短句，绝对禁止长篇大论的临床解释，从而既能把核心干货印在图上展示给用户，又完美规避了汉字写错或乱码的尴尬。

==================================================
社交文案设计要求（分支A与分支B均须严格执行）：
==================================================
社交媒体配文（social_copy）是决定笔记曝光和转化率的灵魂！无论在何种模式下，你都必须在此处产出一篇极高干货深度、条理清晰的专业中医养生文案：
* 包含一个极具点击欲望的爆款标题（带 emoji）；
* 详细列出具体的食材配比（精确到克数/用量）、功效原理分析、极其详尽的制作步骤与熬煮细节、以及具有 clinical 临床经验感的温馨叮嘱（禁忌人群、食用时间等）；
* 分段清晰，带有小红书特有的表情符号，并在结尾带上 5 个以上的爆款热门话题标签。
* 这样，用户在图片上看到的是高级视觉排版，而能从文案中复制出极具深度和可操作性的中医干货！

请严格输出以下 JSON 结构（绝对只能输出纯合法的 JSON 字符串，绝对不要包含 any Markdown 标记如 \`\`\`json ）：
{
  "social_copy": "（爆款社交配文，字数在300~500字左右，极其专业具体）",
  "global_style": "（全局英文视觉风格词，需符合对应模式）",
  "pages": [
    {
      "title": "页面小标题（例如：主封面 / 核心选料 / 调理步骤）",
      "layout": "（本页排版分布指令，需符合对应模式）",
      "exact_text": "必须印在这张图片上的精确中文内容（仅包含主标题、副标题、以及适量分点简短正文。必须精炼提炼，严禁废话，限制字数以防乱码）",
      "img_prompt": "（纯英文的单页主体画面实物描述，需明确为排版文字留出大面积的纯色干净背景空间，需符合对应模式描述）"
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
