// ==========================================
// prompts.js - Fully Dynamic LLM Architecture
// ==========================================

// ── 1. Dynamic Knowledge & Structure Generation ──
async function fetchKnowledgeFromLLM(topic, count, refImage) {
    const systemPrompt = `你是一位拥有30年临床经验的中医主任医师，同时也是顶级视觉信息图策划师。
用户会给出一个大健康或中医主题。你需要根据这个具体主题，量身定制 ${count} 张图文卡片的内容。

⚠️ 核心要求：
1. **拒绝套路化**：不要每次都机械地用“症状自测”、“君臣佐使”、“日常打卡”。请根据具体的主题，灵活决定每一页的结构。例如：
   - 讲某种“药材”：可以是【功效解析】、【搭配禁忌】、【炮制方法】。
   - 讲某种“疾病/症状”：可以是【成因分析】、【误区纠正】、【食疗方】。
   - 讲某个“节气”：可以是【气候特点】、【起居调整】、【当季养生菜】。
2. **极度专业且具体**：药材必须有具体的克数（如“生姜15g”），动作必须有具体的步骤。绝对不允许出现“请补充”、“适量”等占位符。
3. 只能输出纯合法的 JSON 字符串，绝对不要包含任何 Markdown 格式（如 \`\`\`json ）。

请严格输出以下 JSON 结构：
{
  "social_copy": "一段非常吸引人的社交媒体配文（小红书风格，带emoji，分段清晰，结尾带标签）",
  "global_style": "极其重要的纯英文视觉锚点指令！定义这一整套图的统一视觉媒介、光影、质感、色彩空间（例如：Consistent Kinfolk magazine aesthetic, soft natural window lighting, macro photography on cream linen texture, elegant minimalist zen style. Color palette: Cream and Sage Green）。这个指令将被强制附加到每一张图生图请求中，以保证4张图的画风完全一致。",
  "pages": [
    {
      "title": "页面小标题，例如：核心功效 / 历史渊源 / 禁忌人群",
      "layout": "极其详细的排版与空间分布指令（例如：画面分为上下两区，上部35%放置主体图案，下部65%采用左对齐排版文字；标题居中等）。",
      "exact_text": "必须印在这张图片上的精确中文内容。必须包含主标题、副标题、以及分点正文。务必带精准数据/药材克数。",
      "img_prompt": "纯英文的单页主体画面提示词，仅描述本页独特的画面内容，必须给文字留出空间（例如：A wooden spoon with fresh lotus seeds placed in the bottom right corner）"
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
            prompt: `【核心任务】生成一张专业的高级中文养生知识海报。画幅比例要求为3:4竖版。
【全局统一画风强制指令】（保证套图风格完全一致）：${d.global_style}。背景必须有大面积留白（>40%），禁止3D或卡通。
【本张卡片主视觉】：${page.img_prompt}。图案必须精致且居于合理位置，务必为文字留出足够的排版空间。
【空间排版布局】：${page.layout}。请严格遵循此空间划分进行构图。
【必须印在图上的中文文字】：（请使用高级优雅的中文字体：大标题使用宋体/明朝体，正文使用黑体/无衬线体。字迹必须清晰、排版必须对齐，绝对禁止火星文或拼音乱码）
${page.exact_text}`
        });
    });
    return panels.slice(0, count);
}
