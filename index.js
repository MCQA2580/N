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
        </div>
    </div>
    
    <script>
        // 全局变量
        var currentCategory = 'anime';
        var imageList = [];
        var currentImageUrl = '';
        
        // DOM元素
        var imageGrid = document.getElementById('imageGrid');
        var categoryTags = document.querySelectorAll('.category-tag');
        var imageModal = document.getElementById('imageModal');
        var modalImage = document.getElementById('modalImage');
        var closeModal = document.querySelector('.close');
        
        // 初始化
        function init() {
            // 加载默认图片
            loadImages();
            
            // 事件监听
            setupEventListeners();
        }
        
        // 加载图片
        function loadImages() {
            // 显示加载状态
            imageGrid.innerHTML = '<div class="loading">加载中...</div>';
            
            // 转换分类为对应API
            var categoryToApi = {
                anime: 'https://api.mtyqx.cn/api/random.php'
            };
            
            var apiUrl = categoryToApi[currentCategory] || 'https://api.mtyqx.cn/api/random.php';
            console.log('Using API URL:', apiUrl);
            
            // 生成图片，每次生成20张
            var batchSize = 20;
            var totalImages = 100;
            
            // 清空图片列表
            imageList = [];
            
            // 开始生成图片
            generateImages(0, batchSize, totalImages, apiUrl);
        }
        
        // 生成图片
        function generateImages(start, batchSize, totalImages, apiUrl) {
            console.log('Generating images:', start, 'to', Math.min(start + batchSize, totalImages));
            try {
                var end = Math.min(start + batchSize, totalImages);
                var batchImages = [];
                var currentId = start + 1;
                var existingUrls = new Set(imageList.map(function(img) {
                    return img.url;
                })); // 用于快速去重
                
                for (var i = start; i < end; i++) {
                    // 生成唯一的图片URL，使用更多随机参数
                    var randomParam1 = Math.random().toString(36).substring(2, 15);
                    var randomParam2 = Math.random().toString(36).substring(2, 15);
                    var timestamp = Date.now() + i;
                    var imageUrl = apiUrl + '?t=' + timestamp + '&r=' + randomParam1 + '&s=' + randomParam2;
                    
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
                }
                
                console.log('Created batch images:', batchImages.length);
                
                // 添加到总列表
                imageList = imageList.concat(batchImages);
                
                // 渲染当前批次的图片
                if (start === 0) {
                    // 第一次加载，清空加载状态并开始渲染
                    imageGrid.innerHTML = '';
                }
                
                // 渲染当前批次的图片
                renderBatch(batchImages);
                
                // 继续生成下一批
                if (end < totalImages) {
                    // 短暂延迟后生成下一批，避免请求过于密集
                    setTimeout(function() {
                        generateImages(end, batchSize, totalImages, apiUrl);
                    }, 500);
                } else {
                    console.log('All images generated');
                }
            } catch (error) {
                console.error('Error in generateImages:', error);
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
            
            for (var i = 0; i < images.length; i++) {
                var currentImage = images[i];
                console.log('Rendering image', i + 1, ':', currentImage.url);
                
                try {
                    var imageItem = document.createElement('div');
                    imageItem.className = 'image-item';
                    
                    // 存储原始图片 URL
                    imageItem.dataset.imageUrl = currentImage.url;
                    
                    // 创建图片元素
                    var img = document.createElement('img');
                    img.src = currentImage.url;
                    img.alt = currentImage.title;
                    img.loading = 'lazy';
                    
                    // 当图片加载完成后，更新存储的 URL 为实际的图片 URL（重定向后的 URL）
                    img.onload = function() {
                        // 检查图片的实际 URL 是否与存储的 URL 不同
                        var parentItem = this.parentElement;
                        if (parentItem) {
                            console.log('Thumbnail onload - Current src:', this.src);
                            console.log('Thumbnail onload - Stored URL:', parentItem.dataset.imageUrl);
                            if (this.src !== parentItem.dataset.imageUrl) {
                                console.log('Thumbnail redirected to:', this.src);
                                // 更新存储的 URL 为实际的图片 URL
                                parentItem.dataset.imageUrl = this.src;
                                console.log('Thumbnail onload - Updated stored URL:', parentItem.dataset.imageUrl);
                            } else {
                                console.log('Thumbnail onload - No redirect, src matches stored URL');
                            }
                        } else {
                            console.error('Thumbnail onload - No parent element found');
                        }
                    };
                    
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
                    var infoDiv = document.createElement('div');
                    infoDiv.className = 'image-info';
                    infoDiv.innerHTML = '<div class="image-title">' + currentImage.title + '</div><div class="image-desc">' + currentImage.desc + '</div>';
                    
                    // 组装图片项
                    imageItem.appendChild(img);
                    imageItem.appendChild(infoDiv);
                    
                    // 添加点击事件
                    imageItem.onclick = function() {
                        // 使用缩略图当前的 src 属性，而不是存储的 URL
                        // 这样可以确保放大时使用的是缩略图实际加载的图片 URL，而不是原始的 API URL
                        var imgElement = this.querySelector('img');
                        var actualImageUrl = imgElement ? imgElement.src : this.dataset.imageUrl;
                        console.log('Image item clicked - Actual URL:', actualImageUrl);
                        if (actualImageUrl) {
                            openModal(actualImageUrl);
                        }
                    };
                    
                    imageGrid.appendChild(imageItem);
                    console.log('Image rendered successfully');
                } catch (error) {
                    console.error('Error rendering image:', error);
                }
            }
        }
        
        // 打开图片模态框
        function openModal(imageUrl) {
            console.log('Opening modal with URL:', imageUrl);
            // 确保使用原始图片 URL
            currentImageUrl = imageUrl;
            console.log('Set currentImageUrl to:', currentImageUrl);
            // 设置模态框图片的 src
            modalImage.src = imageUrl;
            console.log('Set modalImage.src to:', modalImage.src);
            
            // 当图片加载完成后，获取实际的图片 URL（重定向后的 URL）
            modalImage.onload = function() {
                console.log('Modal image onload - Current src:', this.src);
                console.log('Modal image onload - currentImageUrl:', currentImageUrl);
                // 检查图片的实际 URL 是否与原始 URL 不同
                if (this.src !== currentImageUrl) {
                    console.log('Modal image redirected to:', this.src);
                    // 更新 currentImageUrl 为实际的图片 URL
                    currentImageUrl = this.src;
                    console.log('Updated currentImageUrl to:', currentImageUrl);
                } else {
                    console.log('Modal image onload - No redirect, src matches currentImageUrl');
                }
            };
            
            // 防止模态框图片加载失败时修改 currentImageUrl
            modalImage.onerror = function() {
                console.error('Modal image load failed:', this.src);
                // 加载失败时使用占位符图片，但不修改 currentImageUrl
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
            imageModal.style.display = 'block';
            console.log('Modal displayed');
        }
        

        
        // 获取分类名称
        function getCategoryName(category) {
            var categoryNames = {
                anime: '二次元动漫'
            };
            return categoryNames[category] || '二次元动漫';
        }
        
        // 设置事件监听
        function setupEventListeners() {
            // 分类标签
            categoryTags.forEach(function(tag) {
                tag.addEventListener('click', function() {
                    // 更新分类状态
                    categoryTags.forEach(function(t) {
                        t.classList.remove('active');
                    });
                    tag.classList.add('active');
                    
                    // 更新当前分类
                    currentCategory = tag.dataset.category;
                    
                    // 加载对应分类的图片
                    loadImages();
                });
            });
            
            // 关闭模态框
            closeModal.addEventListener('click', function() {
                imageModal.style.display = 'none';
            });
            
            // 点击模态框外部关闭
            window.addEventListener('click', function(e) {
                if (e.target === imageModal) {
                    imageModal.style.display = 'none';
                }
            });
            

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
