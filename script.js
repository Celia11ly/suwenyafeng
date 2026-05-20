// ==========================================
// script.js - App Controller, Queue & Download
// ==========================================

document.addEventListener('DOMContentLoaded', () => {
    const $ = id => document.getElementById(id);
    const topicInput = $('topicInput'), generatePromptBtn = $('generatePromptBtn');
    const step2 = $('step2'), step3 = $('step3');
    const promptContent = $('promptContent'), copyContent = $('copyContent');
    const copyPromptBtn = $('copyPromptBtn'), copyCopyBtn = $('copyCopyBtn');
    const goToStep3Btn = $('goToStep3Btn'), generateImagesBtn = $('generateImagesBtn');
    const imageGallery = $('imageGallery'), customApiSettings = $('customApiSettings');
    const toggleKeyBtn = $('toggleKeyBtn'), toast = $('toast');
    const refUploadZone = $('refUploadZone'), refImageInput = $('refImageInput');
    const uploadPlaceholder = $('uploadPlaceholder'), refImageUrl = $('refImageUrl');
    const progressArea = $('progressArea'), progressLabel = $('progressLabel'), progressFill = $('progressFill');
    const downloadAllBtn = $('downloadAllBtn');

    let currentTopic = '', currentCount = 4, currentStyle = 'xiaohongshu', currentTab = 'classic';
    let refImageDataUrls = [];
    let generatedImages = [];
    let currentDynamicData = null; // Store LLM generated knowledge

    // ── Init saved settings ──
    let saved = JSON.parse(localStorage.getItem('suwen_api') || '{}');
    
    // Auto-fix the cached image model if it's the old invalid one
    if (saved.imageModel === 'doubao-seedream-3-0-t2i-250415') {
        saved.imageModel = 'ep-20260519235613-pxd69';
    }
    
    // Check if there is a magic key in the URL
    const urlParams = new URLSearchParams(window.location.search);
    const magicKey = urlParams.get('k');
    if (magicKey) {
        saved.key = magicKey;
        window.history.replaceState({}, document.title, window.location.pathname);
    }
    
    localStorage.setItem('suwen_api', JSON.stringify(saved));
    
    if (saved.baseUrl) $('apiBaseUrl').value = saved.baseUrl;
    if (saved.textModel) $('apiTextModel').value = saved.textModel;
    if (saved.imageModel) $('apiImageModel').value = saved.imageModel;
    if (saved.key) {
        $('apiKey').value = saved.key;
        const customRadio = document.querySelector('input[name="modelChoice"][value="custom_openai"]');
        if (customRadio) {
            customRadio.checked = true;
            customApiSettings.classList.remove('hidden');
        }
    }

    // ── Workshop Category Tabs switching ──
    const workshopTabs = document.querySelectorAll('.workshop-tab');
    const topicInputLabel = $('topicInputLabel');
    const imageCountRadios = $('imageCountRadios');
    const herbCountBadge = $('herbCountBadge');
    const safetyNotification = $('safetyNotification');
    const safetyNotificationBody = $('safetyNotificationBody');

    workshopTabs.forEach(tab => {
        tab.addEventListener('click', () => {
            workshopTabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            currentTab = tab.dataset.tab;
            
            // Adjust form inputs based on selected tab
            if (currentTab === 'classic') {
                topicInputLabel.textContent = '养生主题';
                topicInput.placeholder = '例如：春季养肝、熬夜修复、脾胃调理';
                imageCountRadios.classList.remove('hidden');
                herbCountBadge.classList.add('hidden');
                safetyNotification.classList.add('hidden');
                // Restore checked count
                const checkedRadio = document.querySelector('input[name="imageCount"]:checked');
                currentCount = checkedRadio ? parseInt(checkedRadio.value) : 4;
            } else if (currentTab === 'herb') {
                topicInputLabel.textContent = '中药/本草名称';
                topicInput.placeholder = '例如：枸杞、生姜、艾草、附子（输入有毒中药自动开启安全说明卡）';
                imageCountRadios.classList.add('hidden');
                herbCountBadge.classList.remove('hidden');
                checkToxicHerbOnInput();
            }
        });
    });

    function checkToxicHerbOnInput() {
        if (currentTab !== 'herb') {
            safetyNotification.classList.add('hidden');
            return;
        }
        const val = topicInput.value.trim();
        const toxicHerb = detectToxicHerb(val);
        if (toxicHerb) {
            safetyNotificationBody.innerHTML = `检测到本草【<b>${toxicHerb}</b>】具有药典毒性或安全限制。系统已自动启动【安全用药加页机制】，在经典 6 张卡片之外，<b>额外增加 1 张专属的《安全用药与规范炮制说明卡》</b>，以确保用药合规与生命安全。卡片总数已由 6 张调整为 <b>7 张</b>！`;
            safetyNotification.classList.remove('hidden');
            currentCount = 7;
        } else {
            safetyNotification.classList.add('hidden');
            currentCount = 6;
        }
    }

    // ── Input validation & Toxic Check ──
    topicInput.addEventListener('input', () => {
        generatePromptBtn.disabled = !topicInput.value.trim();
        if (currentTab === 'herb') {
            checkToxicHerbOnInput();
        }
    });

    // ── Tab switching for Step 2 output tabs ──
    document.querySelectorAll('.tabs').forEach(tg => {
        tg.querySelectorAll('.tab-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const p = btn.closest('.card') || btn.closest('section');
                p.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
                p.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
                btn.classList.add('active');
                $(btn.dataset.tab + 'Tab').classList.add('active');
            });
        });
    });

    // ── Ref image upload ──
    refUploadZone.addEventListener('click', () => refImageInput.click());
    refUploadZone.addEventListener('dragover', e => { e.preventDefault(); refUploadZone.classList.add('drag-over'); });
    refUploadZone.addEventListener('dragleave', () => refUploadZone.classList.remove('drag-over'));
    refUploadZone.addEventListener('drop', e => {
        e.preventDefault();
        refUploadZone.classList.remove('drag-over');
        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            handleRefFiles(e.dataTransfer.files);
        }
    });
    refImageInput.addEventListener('change', () => {
        if (refImageInput.files && refImageInput.files.length > 0) {
            handleRefFiles(refImageInput.files);
        }
    });

    function handleRefFiles(files) {
        const fileList = Array.from(files);
        let loadedCount = 0;
        const imageFiles = fileList.filter(f => f.type.startsWith('image/'));
        
        if (imageFiles.length === 0) return;
        
        imageFiles.forEach(file => {
            const r = new FileReader();
            r.onload = e => {
                refImageDataUrls.push(e.target.result);
                loadedCount++;
                if (loadedCount === imageFiles.length) {
                    renderRefPreviews();
                    refImageInput.value = '';
                }
            };
            r.readAsDataURL(file);
        });
    }

    function renderRefPreviews() {
        const container = $('refPreviewsContainer');
        container.innerHTML = '';
        
        if (refImageDataUrls.length === 0) {
            container.classList.add('hidden');
            uploadPlaceholder.style.display = '';
            return;
        }
        
        container.classList.remove('hidden');
        uploadPlaceholder.style.display = 'none';
        
        refImageDataUrls.forEach((dataUrl, idx) => {
            const item = document.createElement('div');
            item.className = 'ref-preview-item';
            
            const img = document.createElement('img');
            img.src = dataUrl;
            
            const removeBtn = document.createElement('button');
            removeBtn.className = 'remove-preview-btn';
            removeBtn.type = 'button';
            removeBtn.innerHTML = '×';
            removeBtn.title = '删除此图';
            removeBtn.addEventListener('click', e => {
                e.stopPropagation();
                refImageDataUrls.splice(idx, 1);
                renderRefPreviews();
            });
            
            const badge = document.createElement('span');
            badge.className = 'ref-preview-badge';
            badge.textContent = `图 ${idx + 1}`;
            
            item.appendChild(img);
            item.appendChild(removeBtn);
            item.appendChild(badge);
            container.appendChild(item);
        });
    }

    // ── Model choice ──
    document.querySelectorAll('input[name="modelChoice"]').forEach(r => { 
        r.addEventListener('change', () => { 
            customApiSettings.classList.toggle('hidden', r.value !== 'custom_openai'); 
        }); 
    });
    toggleKeyBtn.addEventListener('click', () => { 
        const k = $('apiKey'); 
        k.type = k.type === 'password' ? 'text' : 'password'; 
    });

    // ── Visual Template choice ──
    document.querySelectorAll('input[name="visualTemplate"]').forEach(r => {
        r.addEventListener('change', () => {
            $('customStyleArea').classList.toggle('hidden', r.value !== 'custom');
        });
    });

    // ── STEP 1 → STEP 2 (Async LLM Pre-thinking) ──
    generatePromptBtn.addEventListener('click', async () => {
        currentTopic = topicInput.value.trim(); if (!currentTopic) return;
        currentStyle = document.querySelector('input[name="copyStyle"]:checked').value;

        // Count logic based on selected tab
        if (currentTab === 'herb') {
            currentCount = detectToxicHerb(currentTopic) ? 7 : 6;
        } else {
            currentCount = parseInt(document.querySelector('input[name="imageCount"]:checked').value);
        }

        const templateChoice = document.querySelector('input[name="visualTemplate"]:checked')?.value || 'auto';
        const customStyleDesc = $('customStyleInput')?.value.trim() || '';

        // Gather all reference images (uploaded base64 images + direct URLs)
        const refImages = [...refImageDataUrls];
        const rawUrls = refImageUrl.value.trim();
        if (rawUrls) {
            const urls = rawUrls.split(/[\s,]+/).filter(u => u.trim().startsWith('http'));
            
            // Check if there are webpage links that are not direct image links
            const nonDirectUrls = urls.filter(u => {
                const lower = u.toLowerCase();
                return lower.includes('xiaohongshu.com') || lower.includes('xhslink.com') || lower.includes('weibo.com') || lower.includes('douyin.com') || (!lower.endsWith('.jpg') && !lower.endsWith('.jpeg') && !lower.endsWith('.png') && !lower.endsWith('.webp') && !lower.endsWith('.gif') && !lower.includes('placeholder') && !lower.includes('data:image'));
            });
            
            if (nonDirectUrls.length > 0) {
                const confirmMsg = `⚠️ 检测到您在直链接口输入了社交平台网页链接（如：${nonDirectUrls[0]}）而不是直接的图片直链。\n\n由于浏览器的安全跨域限制和平台防爬虫机制，AI 无法直接爬取并读取链接网页内的多张图片。这会导致 AI 无法看见参考图，从而自动退回到【自主设计模式】。\n\n【推荐的完美复刻秘籍】：\n1. 用手机/电脑打开此链接，将笔记中您喜欢的多张图片直接截图或保存；\n2. 批量将这些截图拖拽上传到上方的『垫图区』；\n3. AI 会自动将“截图 1”复刻给“图 1”，“截图 2”复刻给“图 2”，并自动进行视觉智能裁剪（自动忽略右侧侧边栏、作者信息与评论区，100% 还原左半部分主图排版！）；\n\n您是否仍然要强行提交此链接（若强行提交，AI 将无法看见原图）？`;
                if (!confirm(confirmMsg)) {
                    return; // Stop generation so they can adjust
                }
            }
            refImages.push(...urls);
        }
        const hasRef = refImages.length > 0;

        const modelChoice = document.querySelector('input[name="modelChoice"]:checked').value;
        if (modelChoice === 'custom_openai') {
            localStorage.setItem('suwen_api', JSON.stringify({
                baseUrl: $('apiBaseUrl').value,
                textModel: $('apiTextModel').value,
                imageModel: $('apiImageModel').value,
                key: $('apiKey').value
            }));
        }

        // UI Loading state
        const originalBtnText = generatePromptBtn.querySelector('.btn-text').textContent;
        generatePromptBtn.querySelector('.btn-text').textContent = 'AI中医思考中...';
        generatePromptBtn.disabled = true;
        step2.classList.add('hidden');

        try {
            // 1. Fetch dynamic knowledge from selected LLM engine
            currentDynamicData = await fetchKnowledgeFromLLM(currentTopic, currentCount, refImages, templateChoice, customStyleDesc, currentTab);
            
            // 2. Build Prompts & Copy using dynamic data
            promptContent.textContent = generatePromptFromData(currentTopic, currentCount, hasRef, currentDynamicData);
            copyContent.textContent = generateCopyTextFromData(currentTopic, currentCount, currentStyle, currentDynamicData);
            
            // 3. Render visual card previews
            renderCardPreviews(currentDynamicData, templateChoice);

            // 4. Reset active Step 2 Tab to the visual preview tab
            document.querySelectorAll('#step2Tabs .tab-btn').forEach(b => b.classList.remove('active'));
            document.querySelectorAll('#step2 .tab-content').forEach(c => c.classList.remove('active'));
            
            const defaultTabBtn = document.querySelector('#step2Tabs .tab-btn[data-tab="cardPreview"]');
            if (defaultTabBtn) defaultTabBtn.classList.add('active');
            
            const defaultTabContent = $('cardPreviewTab');
            if (defaultTabContent) defaultTabContent.classList.add('active');

            // 5. Show Step 2
            step2.classList.remove('hidden');
            setTimeout(() => step2.scrollIntoView({ behavior: 'smooth', block: 'start' }), 100);
        } catch (e) {
            alert(e.message);
        } finally {
            generatePromptBtn.querySelector('.btn-text').textContent = originalBtnText;
            generatePromptBtn.disabled = false;
        }
    });

    // ── Copy ──
    copyPromptBtn.addEventListener('click', () => clip(promptContent.textContent));
    copyCopyBtn.addEventListener('click', () => clip(copyContent.textContent));

    // ── STEP 2 → STEP 3 ──
    goToStep3Btn.addEventListener('click', () => { 
        step3.classList.remove('hidden'); 
        setTimeout(() => step3.scrollIntoView({ behavior: 'smooth', block: 'start' }), 100); 
    });

    // ── STEP 3: Sequential Generation Queue ──
    generateImagesBtn.addEventListener('click', async () => {
        if (!currentDynamicData) return alert('请先生成提示词！');
        
        // Dynamically adjust count based on generated page count
        const actualCount = currentDynamicData.pages.length;
        const modelChoice = document.querySelector('input[name="modelChoice"]:checked').value;
        const panels = getImagePanelsFromData(currentTopic, actualCount, currentDynamicData);
        imageGallery.innerHTML = '';
        imageGallery.setAttribute('data-count', actualCount);
        generatedImages = new Array(panels.length).fill(null);
        downloadAllBtn.classList.add('hidden');

        if (modelChoice === 'custom_openai') {
            localStorage.setItem('suwen_api', JSON.stringify({ 
                baseUrl: $('apiBaseUrl').value, 
                textModel: $('apiTextModel').value, 
                imageModel: $('apiImageModel').value, 
                key: $('apiKey').value 
            }));
        }

        // Build gallery items first
        const items = panels.map((panel, i) => {
            const el = createGalleryItem(panel, i);
            imageGallery.appendChild(el);
            return { panel, el, index: i };
        });

        // Show progress
        progressArea.classList.remove('hidden');
        generateImagesBtn.disabled = true;

        // Sequential generation
        for (let i = 0; i < items.length; i++) {
            const { panel, el, index } = items[i];
            updateProgress(i, items.length, panel.title);
            setBadge(el, 'generating', '生成中...');
            await generateSingle(panel, el, index, modelChoice);
        }

        updateProgress(items.length, items.length, '全部完成！');
        generateImagesBtn.disabled = false;
        downloadAllBtn.classList.remove('hidden');
        setTimeout(() => downloadAllBtn.scrollIntoView({ behavior: 'smooth', block: 'nearest' }), 300);
    });

    // ── Download All ──
    downloadAllBtn.addEventListener('click', () => {
        generatedImages.forEach((item, i) => {
            if (!item) return;
            const a = document.createElement('a');
            a.href = item.url; a.download = `${currentTopic}_图${i + 1}_${item.title}.png`;
            document.body.appendChild(a); a.click(); document.body.removeChild(a);
        });
        showToast('开始下载全部图片');
    });

    // ═══════════════════════════════
    // Core Functions
    // ═══════════════════════════════

    function createGalleryItem(panel, index) {
        const div = document.createElement('div');
        div.className = 'gallery-item';
        div.innerHTML = `
            <div class="gallery-img-wrapper"><div class="img-skeleton"></div></div>
            <div class="gallery-caption"><div class="caption-title">图${index + 1}：${panel.title}</div><div>${panel.desc}</div></div>
            <div class="gallery-actions">
                <button class="retry-btn" data-index="${index}" title="重新生成此图">🔄 重新生成</button>
                <button class="download-btn" data-index="${index}" title="下载此图" disabled>⬇ 下载</button>
            </div>`;
        // Retry handler
        div.querySelector('.retry-btn').addEventListener('click', async () => {
            const modelChoice = document.querySelector('input[name="modelChoice"]:checked').value;
            resetGalleryItem(div);
            setBadge(div, 'generating', '重新生成...');
            await generateSingle(panel, div, index, modelChoice);
        });
        // Single download handler
        div.querySelector('.download-btn').addEventListener('click', () => {
            const item = generatedImages[index];
            if (!item) return;
            const a = document.createElement('a');
            a.href = item.url; a.download = `${currentTopic}_图${index + 1}_${item.title}.png`;
            document.body.appendChild(a); a.click(); document.body.removeChild(a);
        });
        return div;
    }

    function resetGalleryItem(el) {
        const wrapper = el.querySelector('.gallery-img-wrapper');
        wrapper.innerHTML = '<div class="img-skeleton"></div>';
        el.querySelector('.download-btn').disabled = true;
    }

    async function generateSingle(panel, el, index, modelChoice) {
        try {
            if (modelChoice === 'pollinations_flux') await genPollinations(panel, el, index);
            else if (modelChoice === 'puter') await genPuter(panel, el, index);
            else if (modelChoice === 'custom_openai') await genCustom(panel, el, index);
            setBadge(el, 'done', '✓ 完成');
            el.querySelector('.download-btn').disabled = false;
        } catch (e) {
            showImgError(el, e.message || '生成失败');
            setBadge(el, 'failed', '✗ 失败');
        }
    }

    function genPollinations(panel, el, index) {
        return new Promise((resolve, reject) => {
            const seed = Math.floor(Math.random() * 1e6);
            const url = `https://image.pollinations.ai/prompt/${encodeURIComponent(panel.prompt)}?width=768&height=1024&nologo=true&seed=${seed}`;
            const img = document.createElement('img');
            img.className = 'gallery-img'; img.alt = panel.title; img.crossOrigin = 'anonymous';
            img.onload = () => {
                img.classList.add('loaded');
                generatedImages[index] = { title: panel.title, url: img.src };
                resolve();
            };
            img.onerror = () => reject(new Error('Pollinations 请求失败'));
            img.src = url;
            el.querySelector('.gallery-img-wrapper').appendChild(img);
        });
    }

    async function genPuter(panel, el, index) {
        const blob = await puter.ai.txt2img(panel.prompt);
        const url = URL.createObjectURL(blob);
        const img = document.createElement('img');
        img.className = 'gallery-img'; img.alt = panel.title; img.src = url;
        img.onload = () => img.classList.add('loaded');
        el.querySelector('.gallery-img-wrapper').appendChild(img);
        generatedImages[index] = { title: panel.title, url };
    }

    async function genCustom(panel, el, index) {
        const baseUrl = ($('apiBaseUrl').value || 'https://api.openai.com/v1').replace(/\/$/, '');
        const model = $('apiImageModel').value || 'doubao-seedream-3-0-t2i-250415';
        const key = $('apiKey').value;
        if (!key) throw new Error('请先填写 API Key');
        
        let size = '1024x1792';
        if (model.includes('doubao') || model.includes('ep-')) size = '1728x2304';  

        const resp = await fetch(`${baseUrl}/images/generations`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${key}` },
            body: JSON.stringify({ model, prompt: panel.prompt, n: 1, size: size, response_format: 'url' })
        });
        if (!resp.ok) { const e = await resp.json().catch(() => ({})); throw new Error(e.error?.message || `HTTP ${resp.status}`); }
        const data = await resp.json();
        const imgUrl = data.data?.[0]?.url || data.data?.[0]?.b64_json;
        if (!imgUrl) throw new Error('API 未返回图片');
        const img = document.createElement('img');
        img.className = 'gallery-img'; img.alt = panel.title;
        img.src = imgUrl.startsWith('http') ? imgUrl : `data:image/png;base64,${imgUrl}`;
        img.onload = () => img.classList.add('loaded');
        el.querySelector('.gallery-img-wrapper').appendChild(img);
        generatedImages[index] = { title: panel.title, url: img.src };
    }

    // ── Helpers ──
    function renderCardPreviews(dynamicData, templateChoice) {
        const container = $('cardPreviewFlow');
        container.innerHTML = '';
        if (!dynamicData || !dynamicData.pages) return;

        // Resolve active theme class
        let themeClass = 'theme-new_chinese'; // default fallback
        if (templateChoice === 'new_chinese' || templateChoice === 'wabi_sabi' || templateChoice === 'parchment' || templateChoice === 'modern_magazine') {
            themeClass = `theme-${templateChoice}`;
        } else if (templateChoice === 'auto') {
            themeClass = currentTab === 'herb' ? 'theme-parchment' : 'theme-new_chinese';
        }

        dynamicData.pages.forEach((page, i) => {
            const wrapper = document.createElement('div');
            wrapper.className = 'mini-card-wrapper';

            const card = document.createElement('div');
            card.className = `mini-card ${themeClass}`;

            // Mini Card Header
            const header = document.createElement('div');
            header.className = 'mini-card-header';
            header.innerHTML = `
                <span class="mini-card-title">图 ${i + 1}：${page.title}</span>
                <span class="mini-card-badge">3:4 竖卡</span>
            `;

            // Mini Card Body
            const body = document.createElement('div');
            body.className = 'mini-card-body';
            
            const textEl = document.createElement('div');
            textEl.className = 'mini-card-text';
            textEl.textContent = page.exact_text || '';
            body.appendChild(textEl);

            // Mini Card Footer
            const footer = document.createElement('div');
            footer.className = 'mini-card-footer';
            footer.textContent = '素问·雅风美学创作工坊';

            card.appendChild(header);
            card.appendChild(body);
            card.appendChild(footer);

            // Details metadata below the card
            const info = document.createElement('div');
            info.className = 'mini-card-info';
            info.innerHTML = `
                <div class="info-label">📐 排版百分比规划:</div>
                <div style="font-size: 11px; margin-bottom: 6px;">${page.layout}</div>
                <div class="info-label">🖼️ 生图英文提示词:</div>
                <div style="font-size: 10px; font-family: monospace; color: var(--text-muted); word-break: break-all; max-height: 70px; overflow-y: auto; background: rgba(90, 125, 89, 0.04); padding: 6px; border: 1px solid var(--border); border-radius: var(--radius-sm);">${page.img_prompt}</div>
            `;

            wrapper.appendChild(card);
            wrapper.appendChild(info);
            container.appendChild(wrapper);
        });
    }

    function setBadge(el, type, text) {
        let badge = el.querySelector('.status-badge');
        if (!badge) { badge = document.createElement('span'); badge.className = 'status-badge'; el.querySelector('.gallery-img-wrapper').appendChild(badge); }
        badge.className = `status-badge ${type}`; badge.textContent = text;
    }

    function showImgError(el, msg) {
        const w = el.querySelector('.gallery-img-wrapper');
        const s = w.querySelector('.img-skeleton'); if (s) s.remove();
        const d = document.createElement('div'); d.className = 'img-error'; d.textContent = msg; w.appendChild(d);
    }

    function updateProgress(current, total, label) {
        progressLabel.textContent = `正在生成第 ${Math.min(current + 1, total)}/${total} 张：${label}`;
        progressFill.style.width = `${(current / total) * 100}%`;
    }

    function clip(text) {
        navigator.clipboard.writeText(text).then(() => showToast()).catch(() => {
            const t = document.createElement('textarea'); t.value = text;
            document.body.appendChild(t); t.select();
            try { document.execCommand('copy'); showToast(); } catch(e) {}
            document.body.removeChild(t);
        });
    }

    function showToast(msg) {
        toast.textContent = msg || '已复制到剪贴板';
        toast.classList.add('show');
        setTimeout(() => toast.classList.remove('show'), 3000);
    }
});
