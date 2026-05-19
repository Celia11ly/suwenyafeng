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
    const refPreview = $('refPreview'), removeRefBtn = $('removeRefBtn');
    const uploadPlaceholder = $('uploadPlaceholder'), refImageUrl = $('refImageUrl');
    const progressArea = $('progressArea'), progressLabel = $('progressLabel'), progressFill = $('progressFill');
    const downloadAllBtn = $('downloadAllBtn');

    let currentTopic = '', currentCount = 4, currentStyle = 'xiaohongshu';
    let refImageDataUrl = null;
    let generatedImages = [];
    let currentDynamicData = null; // Store LLM generated knowledge

    // ── Init saved settings ──
    let saved = JSON.parse(localStorage.getItem('suwen_api') || '{}');
    
    // Auto-fix the cached image model if it's the old invalid one
    if (saved.imageModel === 'doubao-seedream-3-0-t2i-250415') {
        saved.imageModel = 'ep-20260519235613-pxd69';
    }
    
    // Check if there is a magic key in the URL (e.g., ?k=019b...)
    const urlParams = new URLSearchParams(window.location.search);
    const magicKey = urlParams.get('k');
    if (magicKey) {
        saved.key = magicKey;
        // Remove it from the URL bar instantly for security/cleanliness
        window.history.replaceState({}, document.title, window.location.pathname);
    }
    
    localStorage.setItem('suwen_api', JSON.stringify(saved));
    
    if (saved.baseUrl) $('apiBaseUrl').value = saved.baseUrl;
    if (saved.textModel) $('apiTextModel').value = saved.textModel;
    if (saved.imageModel) $('apiImageModel').value = saved.imageModel;
    if (saved.key) $('apiKey').value = saved.key;

    // ── Tab switching ──
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

    // ── Input validation ──
    topicInput.addEventListener('input', () => { generatePromptBtn.disabled = !topicInput.value.trim(); });

    // ── Ref image upload ──
    refUploadZone.addEventListener('click', () => refImageInput.click());
    refUploadZone.addEventListener('dragover', e => { e.preventDefault(); refUploadZone.classList.add('drag-over'); });
    refUploadZone.addEventListener('dragleave', () => refUploadZone.classList.remove('drag-over'));
    refUploadZone.addEventListener('drop', e => { e.preventDefault(); refUploadZone.classList.remove('drag-over'); if (e.dataTransfer.files[0]) handleRefFile(e.dataTransfer.files[0]); });
    refImageInput.addEventListener('change', () => { if (refImageInput.files[0]) handleRefFile(refImageInput.files[0]); });
    removeRefBtn.addEventListener('click', e => { e.stopPropagation(); refImageDataUrl = null; refPreview.classList.add('hidden'); removeRefBtn.classList.add('hidden'); uploadPlaceholder.style.display = ''; });
    function handleRefFile(f) { const r = new FileReader(); r.onload = e => { refImageDataUrl = e.target.result; refPreview.src = refImageDataUrl; refPreview.classList.remove('hidden'); removeRefBtn.classList.remove('hidden'); uploadPlaceholder.style.display = 'none'; }; r.readAsDataURL(f); }

    // ── Model choice ──
    document.querySelectorAll('input[name="modelChoice"]').forEach(r => { r.addEventListener('change', () => { customApiSettings.classList.toggle('hidden', r.value !== 'custom_openai'); }); });
    toggleKeyBtn.addEventListener('click', () => { const k = $('apiKey'); k.type = k.type === 'password' ? 'text' : 'password'; });

    // ── STEP 1 → STEP 2 (Async LLM Pre-thinking) ──
    generatePromptBtn.addEventListener('click', async () => {
        currentTopic = topicInput.value.trim(); if (!currentTopic) return;
        currentCount = parseInt(document.querySelector('input[name="imageCount"]:checked').value);
        currentStyle = document.querySelector('input[name="copyStyle"]:checked').value;
        const hasRef = !!(refImageDataUrl || refImageUrl.value.trim());

        // UI Loading state
        const originalBtnText = generatePromptBtn.querySelector('.btn-text').textContent;
        generatePromptBtn.querySelector('.btn-text').textContent = 'AI中医思考中...';
        generatePromptBtn.disabled = true;
        step2.classList.add('hidden');

        try {
            // 1. Fetch dynamic knowledge from Puter.js LLM
            currentDynamicData = await fetchKnowledgeFromLLM(currentTopic);
            
            // 2. Build Prompts & Copy using dynamic data
            promptContent.textContent = generatePromptFromData(currentTopic, currentCount, hasRef, currentDynamicData);
            copyContent.textContent = generateCopyTextFromData(currentTopic, currentCount, currentStyle, currentDynamicData);
            
            // 3. Show Step 2
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
    goToStep3Btn.addEventListener('click', () => { step3.classList.remove('hidden'); setTimeout(() => step3.scrollIntoView({ behavior: 'smooth', block: 'start' }), 100); });

    // ── STEP 3: Sequential Generation Queue ──
    generateImagesBtn.addEventListener('click', async () => {
        if (!currentDynamicData) return alert('请先生成提示词！');
        
        const modelChoice = document.querySelector('input[name="modelChoice"]:checked').value;
        const panels = getImagePanelsFromData(currentTopic, currentCount, currentDynamicData);
        imageGallery.innerHTML = '';
        imageGallery.setAttribute('data-count', currentCount);
        generatedImages = new Array(panels.length).fill(null);
        downloadAllBtn.classList.add('hidden');

        if (modelChoice === 'custom_openai') {
            localStorage.setItem('suwen_api', JSON.stringify({ baseUrl: $('apiBaseUrl').value, textModel: $('apiTextModel').value, imageModel: $('apiImageModel').value, key: $('apiKey').value }));
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
        // 火山引擎新版 Seedream 至少要求 3686400 像素，所以传 2K
        if (model.includes('doubao') || model.includes('ep-')) size = '2K'; 

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
