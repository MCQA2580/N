// Cloudflare Worker 脚本

addEventListener('fetch', event => {
  event.respondWith(handleRequest(event.request));
});

async function handleRequest(request) {
  // 直接返回HTML内容
  const html = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>图片网站</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        body {
            font-family: 'Arial', sans-serif;
            background-color: #f5f5f5;
            color: #333;
        }
        .container {
            max-width: 1200px;
            margin: 0 auto;
            padding: 20px;
        }
        header {
            text-align: center;
            margin-bottom: 30px;
        }
        h1 {
            color: #1890ff;
            margin-bottom: 10px;
        }
        p {
            color: #666;
        }
        .category-container {
            margin-bottom: 30px;
        }
        .category-title {
            font-size: 18px;
            font-weight: bold;
            margin-bottom: 15px;
            color: #333;
        }
        .category-tags {
            display: flex;
            flex-wrap: wrap;
            gap: 10px;
        }
        .category-tag {
            padding: 8px 16px;
            background-color: white;
            border: 1px solid #ddd;
            border-radius: 20px;
            font-size: 14px;
            cursor: pointer;
            transition: all 0.3s ease;
        }
        .category-tag:hover {
            background-color: #1890ff;
            color: white;
            border-color: #1890ff;
        }
        .category-tag.active {
            background-color: #1890ff;
            color: white;
            border-color: #1890ff;
        }
        .image-grid {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
            gap: 20px;
            margin-bottom: 30px;
        }
        .image-item {
            background-color: white;
            border-radius: 8px;
            overflow: hidden;
            box-shadow: 0 2px 8px rgba(0,0,0,0.1);
            transition: transform 0.3s ease;
        }
        .image-item:hover {
            transform: translateY(-5px);
            box-shadow: 0 5px 15px rgba(0,0,0,0.1);
        }
        .image-item img {
            width: 100%;
            height: 200px;
            object-fit: cover;
        }
        .image-info {
            padding: 15px;
        }
        .image-title {
            font-size: 16px;
            font-weight: bold;
            margin-bottom: 5px;
        }
        .image-desc {
            font-size: 14px;
            color: #666;
        }
        .loading {
            text-align: center;
            padding: 40px;
            color: #999;
        }
        .error {
            text-align: center;
            padding: 40px;
            color: #ff4d4f;
        }
        /* 图片放大模态框 */
        .modal {
            display: none;
            position: fixed;
            z-index: 1000;
            left: 0;
            top: 0;
            width: 100%;
            height: 100%;
            background-color: rgba(0,0,0,0.9);
            overflow: auto;
        }
        .modal-content {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            height: 100%;
        }
        .close {
            position: absolute;
            top: 20px;
            right: 30px;
            color: white;
            font-size: 40px;
            font-weight: bold;
            cursor: pointer;
        }
        #modalImage {
            max-width: 90%;
            max-height: 80%;
        }
        #downloadBtn {
            margin-top: 20px;
            padding: 10px 20px;
            background-color: #1890ff;
            color: white;
            border: none;
            border-radius: 4px;
            font-size: 16px;
            cursor: pointer;
        }
    </style>
</head>
<body>
    <div class="container">
        <header>
            <h1>图片网站</h1>
            <p>高清图片资源库，提供各类精美图片下载</p>
        </header>
        
        <div class="category-container">
            <h2 class="category-title">图片分类</h2>
            <div class="category-tags">
                <span class="category-tag active" data-category="anime">二次元动漫</span>
            </div>
        </div>
        
        <div class="image-grid" id="imageGrid">
            <!-- 图片将通过JavaScript动态生成 -->
        </div>
    </div>
    
    <!-- 图片放大模态框 -->
    <div id="imageModal" class="modal">
        <div class="modal-content">
            <span class="close">&times;</span>
            <img id="modalImage">
            <button id="downloadBtn">下载图片</button>
        </div>
    </div>
    
    <script>
        // 添加全局错误处理
        window.onerror = function(message, source, lineno, colno, error) {
            console.error('Global error:', message, 'at', source, ':', lineno, ':', colno);
            if (error) {
                console.error('Error object:', error);
            }
            return true;
        };
        
        // 全局变量
        let currentCategory = 'anime';
        let imageList = [];
        let currentImageUrl = '';
        
        // DOM元素
        const imageGrid = document.getElementById('imageGrid');
        const categoryTags = document.querySelectorAll('.category-tag');
        const imageModal = document.getElementById('imageModal');
        const modalImage = document.getElementById('modalImage');
        const closeModal = document.querySelector('.close');
        const downloadBtn = document.getElementById('downloadBtn');
        
        console.log('DOM elements loaded:', {
            imageGrid: imageGrid,
            categoryTags: categoryTags.length,
            imageModal: imageModal,
            modalImage: modalImage,
            closeModal: closeModal,
            downloadBtn: downloadBtn
        });
        
        // 初始化
        function init() {
            console.log('Initializing application...');
            // 加载默认图片
            loadImages();
            
            // 事件监听
            setupEventListeners();
        }
        
        // 加载图片
        function loadImages() {
            console.log('Loading images...');
            // 显示加载状态
            imageGrid.innerHTML = '<div class="loading">加载中...</div>';
            
            // 转换分类为对应API
            const categoryToApi = {
                anime: 'https://api.mtyqx.cn/api/random.php'
            };
            
            const apiUrl = categoryToApi[currentCategory] || 'https://api.mtyqx.cn/api/random.php';
            console.log('Using API URL:', apiUrl);
            
            // 分批加载图片，每次加载20张
            const batchSize = 20;
            const totalImages = 100;
            
            // 清空图片列表
            imageList = [];
            
            try {
                // 开始分批加载
                loadBatch(0, batchSize, totalImages, apiUrl);
            } catch (error) {
                console.error('Error in loadImages:', error);
                imageGrid.innerHTML = '<div class="error">加载图片时发生错误</div>';
            }
        }
        
        // 分批加载图片
        function loadBatch(start, batchSize, totalImages, apiUrl) {
            console.log('Loading batch:', start, 'to', Math.min(start + batchSize, totalImages));
            try {
                const end = Math.min(start + batchSize, totalImages);
                const imagePromises = [];
                const imageUrls = new Set(); // 用于去重
                
                for (let i = start; i < end; i++) {
                    // 生成唯一的图片URL，使用更随机的参数
                    const randomParam = Math.random().toString(36).substring(2, 15);
                    const imageUrl = apiUrl + "?t=" + (Date.now() + i) + "&r=" + randomParam;
                    imageUrls.add(imageUrl);
                }
                
                console.log('Generated URLs:', imageUrls.size);
                
                // 转换为数组并创建请求
                Array.from(imageUrls).forEach(url => {
                    // 添加超时处理
                    const fetchWithTimeout = (url, timeout = 5000) => {
                        return Promise.race([
                            fetch(url),
                            new Promise((_, reject) => setTimeout(() => reject(new Error('Request timeout')), timeout))
                        ]);
                    };
                    imagePromises.push(fetchWithTimeout(url).catch(error => {
                        console.error('Fetch error:', error);
                        return null; // 允许个别请求失败
                    }));
                });
                
                console.log('Created fetch promises:', imagePromises.length);
                
                Promise.all(imagePromises)
                    .then(responses => {
                        console.log('Received responses:', responses.length);
                        // 过滤掉失败的响应
                        const successfulResponses = responses.filter(response => response !== null);
                        console.log('Successful responses:', successfulResponses.length);
                        
                        // 转换为图片列表并添加到总列表
                        const batchImages = [];
                        let currentId = start + 1;
                        const existingUrls = new Set(imageList.map(img => img.url)); // 用于快速去重
                        
                        successfulResponses.forEach((response, index) => {
                            // 生成唯一的图片URL，使用更随机的参数
                            const randomParam = Math.random().toString(36).substring(2, 15);
                            const imageUrl = apiUrl + "?t=" + (Date.now() + start + index) + "&r=" + randomParam;
                            
                            // 检查是否已经存在相同的URL
                            if (!existingUrls.has(imageUrl)) {
                                existingUrls.add(imageUrl);
                                batchImages.push({
                                    id: currentId++,
                                    title: '二次元动漫图片 ' + (currentId - 1),
                                    desc: '这是一张精美的二次元动漫图片，分辨率高清，适合各种用途。',
                                    category: currentCategory,
                                    url: imageUrl,
                                    photographer: '网络摄影师',
                                    photographerUrl: '#'
                                });
                            }
                        });
                        
                        console.log('Created batch images:', batchImages.length);
                        
                        // 添加到总列表
                        imageList = [...imageList, ...batchImages];
                        
                        // 渲染当前批次的图片
                        if (start === 0) {
                            // 第一次加载，清空加载状态并开始渲染
                            imageGrid.innerHTML = '';
                        }
                        
                        // 渲染当前批次的图片
                        renderBatch(batchImages);
                        
                        // 继续加载下一批
                        if (end < totalImages) {
                            // 短暂延迟后加载下一批，避免请求过于密集
                            setTimeout(() => {
                                loadBatch(end, batchSize, totalImages, apiUrl);
                            }, 500);
                        } else {
                            console.log('All batches loaded');
                        }
                    })
                    .catch(error => {
                        console.error('获取图片失败:', error);
                        imageGrid.innerHTML = '<div class="error">获取图片失败，请检查网络连接</div>';
                    });
            } catch (error) {
                console.error('Error in loadBatch:', error);
                imageGrid.innerHTML = '<div class="error">加载过程中发生错误</div>';
            }
        }
        
        // 渲染批次图片
        function renderBatch(images) {
            console.log('Rendering batch:', images.length, 'images');
            if (images.length === 0) {
                console.log('No images to render');
                return;
            }
            
            images.forEach((image, index) => {
                console.log('Rendering image', index + 1, ':', image.url);
                
                try {
                    const imageItem = document.createElement('div');
                    imageItem.className = 'image-item';
                    
                    // 创建图片元素
                    const img = document.createElement('img');
                    img.src = image.url;
                    img.alt = image.title;
                    img.loading = 'lazy';
                    
                    // 添加图片加载失败处理
                    img.onerror = function() {
                        console.error('Image load failed:', this.src);
                        // 加载失败时使用占位符图片
                        this.src = 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=二次元动漫%20占位符&image_size=landscape_16_9';
                        console.log('Using placeholder image:', this.src);
                        // 添加重试机制
                        this.onerror = function() {
                            console.error('Placeholder image also failed');
                            // 显示错误信息
                            this.alt = '图片加载失败';
                            this.onerror = null; // 防止无限重试
                        };
                    };
                    
                    // 创建信息元素
                    const infoDiv = document.createElement('div');
                    infoDiv.className = 'image-info';
                    infoDiv.innerHTML = "<div class=\"image-title\">" + image.title + "</div><div class=\"image-desc\">" + image.desc + "</div>";
                    
                    // 组装图片项
                    imageItem.appendChild(img);
                    imageItem.appendChild(infoDiv);
                    
                    // 添加点击事件
                    imageItem.addEventListener('click', () => {
                        openModal(image.url);
                    });
                    
                    imageGrid.appendChild(imageItem);
                    console.log('Image rendered successfully');
                } catch (error) {
                    console.error('Error rendering image:', error);
                }
            });
        }
        
        // 打开图片模态框
        function openModal(imageUrl) {
            currentImageUrl = imageUrl;
            modalImage.src = imageUrl;
            imageModal.style.display = 'block';
        }
        
        // 下载图片
        function downloadImage() {
            if (!currentImageUrl) return;
            
            // 创建一个临时链接
            const link = document.createElement('a');
            link.href = currentImageUrl;
            link.download = 'anime_' + Date.now() + '.jpg';
            link.click();
        }
        
        // 获取分类名称
        function getCategoryName(category) {
            const categoryNames = {
                anime: '二次元动漫'
            };
            return categoryNames[category] || '二次元动漫';
        }
        
        // 设置事件监听
        function setupEventListeners() {
            // 分类标签
            categoryTags.forEach(tag => {
                tag.addEventListener('click', () => {
                    // 更新分类状态
                    categoryTags.forEach(t => t.classList.remove('active'));
                    tag.classList.add('active');
                    
                    // 更新当前分类
                    currentCategory = tag.dataset.category;
                    
                    // 加载对应分类的图片
                    loadImages();
                });
            });
            
            // 关闭模态框
            closeModal.addEventListener('click', () => {
                imageModal.style.display = 'none';
            });
            
            // 点击模态框外部关闭
            window.addEventListener('click', (e) => {
                if (e.target === imageModal) {
                    imageModal.style.display = 'none';
                }
            });
            
            // 下载按钮点击
            downloadBtn.addEventListener('click', downloadImage);
        }
        
        // 初始化应用
        init();
    </script>
</body>
</html>`;
  
  return new Response(html, {
    headers: {
      'content-type': 'text/html;charset=UTF-8',
    },
  });
}
