// 计算Base64数据大小
function getBase64FileSize(base64String) {
    // Base64编码的字符串大小计算: (长度 * 3) / 4 - 填充字符数
    const padding = (base64String.endsWith('==') ? 2 : base64String.endsWith('=') ? 1 : 0);
    const fileSizeInBytes = (base64String.length * 3 / 4) - padding;
    return Math.round(fileSizeInBytes);
}

// 压缩图片
function compressImage(originalImageData, quality, format) {
    return new Promise((resolve, reject) => {
        try {
            // 创建ImageBitmap对象
            createImageBitmap(
                fetch(originalImageData.base64)
                    .then(response => response.blob())
            ).then(imageBitmap => {
                // 创建canvas元素
                const canvas = new OffscreenCanvas(imageBitmap.width, imageBitmap.height);
                const ctx = canvas.getContext('2d');
                
                // 设置初始尺寸为原图尺寸
                let width = imageBitmap.width;
                let height = imageBitmap.height;
                
                // 首次压缩尝试
                canvas.width = width;
                canvas.height = height;
                ctx.drawImage(imageBitmap, 0, 0, width, height);
                
                // 根据格式获取Base64数据
                let base64Data;
                if (format === 'jpeg') {
                    base64Data = canvas.convertToBlob({ type: 'image/jpeg', quality: quality })
                        .then(blob => new Promise(resolve => {
                            const reader = new FileReader();
                            reader.onloadend = () => resolve(reader.result);
                            reader.readAsDataURL(blob);
                        }));
                } else if (format === 'webp') {
                    base64Data = canvas.convertToBlob({ type: 'image/webp', quality: quality })
                        .then(blob => new Promise(resolve => {
                            const reader = new FileReader();
                            reader.onloadend = () => resolve(reader.result);
                            reader.readAsDataURL(blob);
                        }));
                } else { // png
                    // PNG格式不支持quality参数，我们需要通过其他方式压缩
                    base64Data = canvas.convertToBlob({ type: 'image/png' })
                        .then(blob => new Promise(resolve => {
                            const reader = new FileReader();
                            reader.onloadend = () => resolve(reader.result);
                            reader.readAsDataURL(blob);
                        }));
                }
                
                base64Data.then(data => {
                    // 计算压缩后大小
                    let compressedSize = getBase64FileSize(data.split(',')[1]);
                    
                    // 强制确保压缩后大小小于原图大小
                    let iterations = 0;
                    const maxIterations = 20; // 防止无限循环
                    
                    // 如果压缩后的大小仍然大于原图，继续压缩
                    const compressLoop = () => {
                        if (compressedSize < originalImageData.size || iterations >= maxIterations) {
                            // 存储压缩后的图片数据
                            const compressedImageData = {
                                base64: data,
                                width: width,
                                height: height,
                                size: compressedSize,
                                format: format
                            };
                            
                            resolve(compressedImageData);
                            return;
                        }
                        
                        iterations++;
                        
                        // 每次迭代减小10%的尺寸
                        width = Math.round(width * 0.9);
                        height = Math.round(height * 0.9);
                        
                        // 确保尺寸不会过小
                        if (width < 10 || height < 10) {
                            // 存储压缩后的图片数据
                            const compressedImageData = {
                                base64: data,
                                width: width,
                                height: height,
                                size: compressedSize,
                                format: format
                            };
                            
                            resolve(compressedImageData);
                            return;
                        }
                        
                        // 重新绘制并压缩
                        canvas.width = width;
                        canvas.height = height;
                        ctx.drawImage(imageBitmap, 0, 0, width, height);
                        
                        let newBase64Data;
                        if (format === 'jpeg') {
                            newBase64Data = canvas.convertToBlob({ 
                                type: 'image/jpeg', 
                                quality: Math.max(0.1, quality - (iterations * 0.1)) 
                            }).then(blob => new Promise(resolve => {
                                const reader = new FileReader();
                                reader.onloadend = () => resolve(reader.result);
                                reader.readAsDataURL(blob);
                            }));
                        } else if (format === 'webp') {
                            newBase64Data = canvas.convertToBlob({ 
                                type: 'image/webp', 
                                quality: Math.max(0.1, quality - (iterations * 0.1)) 
                            }).then(blob => new Promise(resolve => {
                                const reader = new FileReader();
                                reader.onloadend = () => resolve(reader.result);
                                reader.readAsDataURL(blob);
                            }));
                        } else { // png
                            // 对于PNG，我们通过减小尺寸来压缩
                            newBase64Data = canvas.convertToBlob({ type: 'image/png' })
                                .then(blob => new Promise(resolve => {
                                    const reader = new FileReader();
                                    reader.onloadend = () => resolve(reader.result);
                                    reader.readAsDataURL(blob);
                                }));
                        }
                        
                        newBase64Data.then(newData => {
                            data = newData;
                            compressedSize = getBase64FileSize(data.split(',')[1]);
                            compressLoop();
                        });
                    };
                    
                    compressLoop();
                });
            }).catch(error => {
                reject(error);
            });
        } catch (error) {
            reject(error);
        }
    });
}

// 监听主线程消息
self.addEventListener('message', function(e) {
    const { action, originalImageData, quality, format } = e.data;
    
    if (action === 'compress') {
        compressImage(originalImageData, quality, format)
            .then(compressedImageData => {
                self.postMessage({
                    action: 'compressComplete',
                    compressedImageData: compressedImageData
                });
            })
            .catch(error => {
                self.postMessage({
                    action: 'compressError',
                    error: error.message
                });
            });
    }
});
