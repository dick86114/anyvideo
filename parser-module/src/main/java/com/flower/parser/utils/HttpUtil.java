package com.flower.parser.utils;

import java.io.BufferedInputStream;
import java.io.BufferedOutputStream;
import java.io.File;
import java.io.FileOutputStream;
import java.io.IOException;
import java.net.SocketTimeoutException;
import java.nio.charset.Charset;
import java.nio.file.Files;
import java.nio.file.StandardCopyOption;
import java.util.Collections;
import java.util.Map;
import java.util.concurrent.TimeUnit;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import com.flower.parser.config.Global;

import okhttp3.OkHttpClient;
import okhttp3.Protocol;
import okhttp3.Request;
import okhttp3.Response;
import okhttp3.ResponseBody;

/**
 * HTTP工具类 - 用于处理HTTP请求和文件下载
 */
public class HttpUtil {

    private static final Logger logger = LoggerFactory.getLogger(HttpUtil.class);
    
    private static final OkHttpClient client = new OkHttpClient.Builder()
            .protocols(Collections.singletonList(Protocol.HTTP_1_1))
            .connectTimeout(20, TimeUnit.SECONDS)
            .readTimeout(120, TimeUnit.SECONDS) // 增加读取超时，支持大文件下载
            .writeTimeout(120, TimeUnit.SECONDS) // 增加写入超时，支持大文件下载
            .retryOnConnectionFailure(true)
            .build();
    
    // 支持的媒体类型
    private static final Map<String, String[]> SUPPORTED_MEDIA_TYPES = Map.of(
            "image", new String[]{"jpeg", "png", "gif", "webp", "jpg", "bmp", "svg", "tiff"},
            "video", new String[]{"mp4", "mov", "avi", "mkv", "webm", "flv", "m3u8"}
    );
    
    // 媒体文件魔术数字映射
    private static final Map<String, byte[]> MAGIC_NUMBERS = Map.of(
            "jpeg", new byte[]{(byte) 0xFF, (byte) 0xD8, (byte) 0xFF},
            "png", new byte[]{(byte) 0x89, (byte) 0x50, (byte) 0x4E, (byte) 0x47},
            "gif", new byte[]{(byte) 0x47, (byte) 0x49, (byte) 0x46},
            "webp", new byte[]{(byte) 0x52, (byte) 0x49, (byte) 0x46, (byte) 0x46},
            "mp4", new byte[]{(byte) 0x00, (byte) 0x00, (byte) 0x00, (byte) 0x18, (byte) 0x66, (byte) 0x74, (byte) 0x79, (byte) 0x70},
            "avi", new byte[]{(byte) 0x52, (byte) 0x49, (byte) 0x46, (byte) 0x46}
    );

    /**
     * 获取短链接重定向后的真实URL
     * 
     * @param url 短链接URL
     * @return 重定向后的真实URL，获取失败返回原URL
     */
    public static String getRealUrl(String url) {
        // 如果是xhslink短链接，获取重定向后的真实URL
        if (url.contains("xhslink.com")) {
            int maxRetries = 3;
            int retryDelay = 1000; // 1秒
            
            for (int retry = 0; retry < maxRetries; retry++) {
                try {
                    // 配置OkHttpClient以自动跟随重定向
                    OkHttpClient redirectClient = client.newBuilder()
                            .followRedirects(true)
                            .followSslRedirects(true)
                            .build();
                    
                    // 添加User-Agent以模拟浏览器请求
                    Request redirectRequest = new Request.Builder()
                            .url(url)
                            .header("User-Agent", "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/112.0.0.0 Safari/537.36")
                            .header("Accept", "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8")
                            .header("Accept-Language", "zh-CN,zh;q=0.8,zh-TW;q=0.7,zh-HK;q=0.5,en-US;q=0.3,en;q=0.2")
                            .header("Upgrade-Insecure-Requests", "1")
                            .header("Connection", "keep-alive")
                            .header("Cache-Control", "no-cache")
                            .build();
                            
                    try (Response redirectResponse = redirectClient.newCall(redirectRequest).execute()) {
                        // 获取最终的URL，无论响应是否成功
                        String finalUrl = redirectResponse.request().url().toString();
                        logger.info("短链接重定向结果(尝试{}): 原始URL={}, 最终URL={}, 响应状态码={}", 
                                  (retry + 1), url, finalUrl, redirectResponse.code());
                        
                        // 如果响应状态码不是2xx或3xx，继续重试
                        if (redirectResponse.isSuccessful() || redirectResponse.code() >= 300 && redirectResponse.code() < 400) {
                            return finalUrl;
                        }
                    }
                } catch (Exception e) {
                    logger.error("处理短链接重定向失败(尝试{}): {}", (retry + 1), e.getMessage());
                    e.printStackTrace();
                }
                
                // 如果不是最后一次重试，等待后再试
                if (retry < maxRetries - 1) {
                    try {
                        Thread.sleep(retryDelay * (retry + 1)); // 指数退避
                    } catch (InterruptedException e) {
                        logger.error("重试等待被中断: {}", e.getMessage());
                        break;
                    }
                }
            }
            
            logger.error("所有重试都失败了，无法处理短链接: {}", url);
        }
        return url;
    }
    
    public static String getPage(String url, String cookie, String referer) {
    	// 处理短链接重定向
    	String finalUrl = url;
    	// 如果是xhslink短链接，先获取重定向后的真实URL
    	if (url.contains("xhslink.com")) {
    		finalUrl = getRealUrl(url);
    	}
    	
    	Request.Builder requestBuilder = new Request.Builder().url(finalUrl);
    	if(null != cookie && !"/".equals(cookie)) {
        	requestBuilder.addHeader("Cookie", cookie);
    	}
    	if(null != referer && !"/".equals(referer)) {
        	requestBuilder.addHeader("referer", referer);
    	}
    	requestBuilder.addHeader("User-Agent", Global.useragent != null ? Global.useragent : "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/112.0.0.0 Safari/537.36");
    	Request request = requestBuilder.build();
    	try (Response response = client.newCall(request).execute()) {
    		String responseBody = response.body().string();
            return responseBody;
    	} catch (Exception e) {
    		logger.error("获取页面内容失败: {}", e.getMessage(), e);
        } finally {
           
        }
	 return null;
    }

    /**
     * 使用OkHttp下载文件
     * @param urlStr 下载URL
     * @param fileName 文件名
     * @param savePath 保存路径
     * @param headers 请求头
     * @return 成功返回"0"，失败返回"1"
     * @throws IOException 可能的IO异常
     */
    public static String downloadFileWithOkHttp(String urlStr, String fileName, String savePath, Map<String, String> headers) throws IOException {
        if (urlStr == null || urlStr.isEmpty() || fileName == null || fileName.isEmpty() || savePath == null || savePath.isEmpty()) {
            logger.info("----------------打印调试参数-------------------");
            logger.info(urlStr);
            logger.info(fileName);
            logger.info("----------------打印调试参数-------------------");
            throw new IllegalArgumentException("urlStr, fileName, savePath 不能为空");
        }
        
        // 检查文件扩展名，确定媒体类型
        String fileExt = fileName.toLowerCase().contains(".") ? 
                        fileName.toLowerCase().substring(fileName.lastIndexOf(".") + 1) : "";
        String mediaType = "";
        for (Map.Entry<String, String[]> entry : SUPPORTED_MEDIA_TYPES.entrySet()) {
            if (java.util.Arrays.asList(entry.getValue()).contains(fileExt)) {
                mediaType = entry.getKey();
                break;
            }
        }
        
        // 尝试使用分块下载
        String result = downloadLargeFileWithChunks(urlStr, fileName, savePath, headers, 5 * 1024 * 1024, 3);
        
        // 如果分块下载失败，尝试使用普通下载
        if ("1".equals(result)) {
            logger.info("分块下载失败，尝试使用普通下载");
            
            int maxRetries = 3;
            int retryCount = 0;
            long retryDelay = 5000;

            while (retryCount < maxRetries) {
                File saveDir = new File(savePath);
                File finalFile = new File(saveDir, fileName);
                File tmpFile = new File(saveDir, fileName + ".downloading");

                long downloaded = 0;
                boolean needRetry = false;

                try {
                    if (!saveDir.exists()) {
                        saveDir.mkdirs();
                    }

                    Request.Builder requestBuilder = new Request.Builder()
                            .url(urlStr)
                            .addHeader("Connection", "keep-alive");

                    if (headers != null) {
                        for (Map.Entry<String, String> entry : headers.entrySet()) {
                            requestBuilder.addHeader(entry.getKey(), entry.getValue());
                        }
                    }

                    try (Response response = client.newCall(requestBuilder.build()).execute()) {
                        if (!response.isSuccessful()) {
                            logger.info("下载失败: " + response.code());
                            logger.info("----------------打印调试参数-------------------");
                            logger.info(urlStr);
                            logger.info(fileName);
                            logger.info("----------------打印调试参数-------------------");
                            return "1";
                        }

                        long fileLength = response.body().contentLength();
                        if (finalFile.exists() && fileLength > 0 && finalFile.length() == fileLength) {
                            logger.info("文件已存在且大小相同,跳过下载: {}", fileName);
                            return "0";
                        }

                        long startTime = System.currentTimeMillis();
                        long lastProgressTime = startTime;
                        long lastBytesRead = 0;

                        boolean downloadSuccess = false;

                        try (BufferedInputStream bis = new BufferedInputStream(response.body().byteStream());
                             BufferedOutputStream bos = new BufferedOutputStream(new FileOutputStream(tmpFile))) {

                            byte[] buffer = new byte[16 * 1024];
                            int len;

                            while ((len = bis.read(buffer)) != -1) {
                                bos.write(buffer, 0, len);
                                downloaded += len;

                                long currentTime = System.currentTimeMillis();

                                if (fileLength > 0 && currentTime - lastProgressTime >= 15000) {
                                    int progress = (int) (downloaded * 100 / fileLength);
                                    double averageSpeed = (downloaded / 1024.0) / Math.max(1, (currentTime - startTime) / 1000.0);
                                    double instantSpeed = ((downloaded - lastBytesRead) / 1024.0) / Math.max(1, (currentTime - lastProgressTime) / 1000.0);
                                    long remainingBytes = fileLength - downloaded;
                                    long remainingTime = averageSpeed > 0 ? (long) (remainingBytes / (averageSpeed * 1024)) : 0;

                                    logger.info("下载进度: {}%, 平均速度: {} KB/s, 实时速度: {} KB/s, 剩余时间: {} 秒, 文件: {}",
                                            progress,
                                            String.format("%.2f", averageSpeed),
                                            String.format("%.2f", instantSpeed),
                                            remainingTime,
                                            fileName);

                                    lastProgressTime = currentTime;
                                    lastBytesRead = downloaded;
                                }
                            }

                            bos.flush();
                            if (fileLength > 0 && tmpFile.length() != fileLength) {
                                logger.info("文件下载不完整");
                                return "1";
                            }

                            downloadSuccess = true;
                        }

                        // 下载成功，关闭流之后执行重命名
                        if (downloadSuccess) {
                        	Files.move(tmpFile.toPath(), finalFile.toPath(), StandardCopyOption.REPLACE_EXISTING);
                            logger.info("文件下载完成: {}", fileName);
                            
                            // 验证媒体文件
                            if (!mediaType.isEmpty()) {
                                if (validateMediaFile(finalFile, mediaType)) {
                                    logger.info("媒体文件验证通过: {}", fileName);
                                } else {
                                    logger.error("媒体文件验证失败，删除文件: {}", fileName);
                                    finalFile.delete();
                                    return "1";
                                }
                            }
                            
                            return "0";
                        }

                    }
                } catch (SocketTimeoutException e) {
                    logger.warn("下载超时(第 {} 次重试): {}", retryCount + 1, fileName);
                    needRetry = true;
                } catch (IOException  e) {
                    logger.error("下载出错: {}", e.getMessage(), e);
                    logger.info("----------------打印调试参数-------------------");
                    logger.info(urlStr);
                    logger.info(fileName);
                    logger.info("----------------打印调试参数-------------------");
                    return "1";
                } finally {
                    if (needRetry && tmpFile.exists()) {
                        tmpFile.delete();
                    }
                }

                retryCount++;
                if (retryCount < maxRetries) {
                    try {
                        Thread.sleep(retryDelay);
                    } catch (InterruptedException ignored) {
                    }
                }
            }

            logger.info("----------------打印调试参数-------------------");
            logger.info(urlStr);
            logger.info(fileName);
            logger.info("----------------打印调试参数-------------------");
            logger.error("下载失败，已重试多次: " + fileName);
            return "1";
        }
        
        // 验证媒体文件
        if (!mediaType.isEmpty()) {
            File finalFile = new File(savePath, fileName);
            if (validateMediaFile(finalFile, mediaType)) {
                logger.info("媒体文件验证通过: {}", fileName);
            } else {
                logger.error("媒体文件验证失败，删除文件: {}", fileName);
                finalFile.delete();
                return "1";
            }
        }
        
        return result;
    }
    
    /**
     * 检查文件是否为支持的媒体类型
     * @param contentType Content-Type头信息
     * @return 是否为支持的媒体类型
     */
    public static boolean isSupportedMediaType(String contentType) {
        if (contentType == null || contentType.isEmpty()) {
            return false;
        }
        
        String[] typeParts = contentType.split("/");
        if (typeParts.length != 2) {
            return false;
        }
        
        String mainType = typeParts[0];
        String subType = typeParts[1].split(";")[0];
        
        return SUPPORTED_MEDIA_TYPES.containsKey(mainType) && 
               java.util.Arrays.asList(SUPPORTED_MEDIA_TYPES.get(mainType)).contains(subType);
    }
    
    /**
     * 检查文件魔术数字，验证文件类型
     * @param file 文件对象
     * @param expectedType 期望的媒体类型（image/video）
     * @return 验证结果
     */
    public static boolean validateMediaFile(File file, String expectedType) {
        try {
            // 检查文件是否存在
            if (!file.exists() || file.length() == 0) {
                logger.error("文件不存在或为空: {}", file.getAbsolutePath());
                return false;
            }
            
            // 检查文件大小是否合理
            if (file.length() < 100) {
                logger.error("文件太小，不是有效的媒体文件: {}", file.getAbsolutePath());
                return false;
            }
            
            // 读取文件开头的几个字节
            byte[] buffer = new byte[16];
            try (java.io.FileInputStream fis = new java.io.FileInputStream(file)) {
                fis.read(buffer);
            }
            
            // 检查魔术数字
            boolean validMagicNumber = false;
            for (Map.Entry<String, byte[]> entry : MAGIC_NUMBERS.entrySet()) {
                byte[] magicNumber = entry.getValue();
                if (buffer.length >= magicNumber.length) {
                    boolean match = true;
                    for (int i = 0; i < magicNumber.length; i++) {
                        if (buffer[i] != magicNumber[i]) {
                            match = false;
                            break;
                        }
                    }
                    if (match) {
                        validMagicNumber = true;
                        break;
                    }
                }
            }
            
            // 如果没有匹配到魔术数字，尝试检查文件扩展名
            if (!validMagicNumber) {
                String fileName = file.getName().toLowerCase();
                boolean validExtension = false;
                for (String[] extensions : SUPPORTED_MEDIA_TYPES.values()) {
                    for (String ext : extensions) {
                        if (fileName.endsWith("." + ext)) {
                            validExtension = true;
                            break;
                        }
                    }
                    if (validExtension) break;
                }
                
                if (!validExtension) {
                    logger.error("文件扩展名或魔术数字不匹配任何支持的媒体类型: {}", file.getAbsolutePath());
                    return false;
                }
            }
            
            return true;
        } catch (IOException e) {
            logger.error("验证媒体文件失败: {}", e.getMessage(), e);
            return false;
        }
    }
    
    /**
     * 大文件分块下载
     * @param urlStr 下载URL
     * @param fileName 文件名
     * @param savePath 保存路径
     * @param headers 请求头
     * @param chunkSize 分块大小（字节）
     * @param maxConcurrentChunks 最大并发分块数
     * @return 成功返回"0"，失败返回"1"
     * @throws IOException 可能的IO异常
     */
    public static String downloadLargeFileWithChunks(String urlStr, String fileName, String savePath, 
                                                   Map<String, String> headers, long chunkSize, int maxConcurrentChunks) throws IOException {
        if (urlStr == null || urlStr.isEmpty() || fileName == null || fileName.isEmpty() || savePath == null || savePath.isEmpty()) {
            throw new IllegalArgumentException("urlStr, fileName, savePath 不能为空");
        }
        
        // 默认值
        if (chunkSize <= 0) {
            chunkSize = 5 * 1024 * 1024; // 默认5MB
        }
        if (maxConcurrentChunks <= 0) {
            maxConcurrentChunks = 3; // 默认3个并发
        }
        
        logger.info("开始分块下载，URL: {}, 文件名: {}, 保存路径: {}, 分块大小: {}MB, 最大并发: {}",
                   urlStr, fileName, savePath, chunkSize / (1024 * 1024), maxConcurrentChunks);
        
        // 首先获取文件大小
        long fileSize = getFileSize(urlStr, headers);
        if (fileSize <= 0) {
            logger.error("无法获取文件大小: {}", urlStr);
            return "1";
        }
        
        // 如果文件较小，使用普通下载
        if (fileSize < chunkSize) {
            logger.info("文件较小，使用普通下载方式");
            return downloadFileWithOkHttp(urlStr, fileName, savePath, headers);
        }
        
        // 计算分块数量
        long totalChunks = (fileSize + chunkSize - 1) / chunkSize;
        logger.info("文件大小: {}MB, 总块数: {}", fileSize / (1024 * 1024), totalChunks);
        
        File saveDir = new File(savePath);
        if (!saveDir.exists()) {
            saveDir.mkdirs();
        }
        File finalFile = new File(saveDir, fileName);
        
        // 创建随机访问文件，用于分块写入
        try (java.io.RandomAccessFile raf = new java.io.RandomAccessFile(finalFile, "rw")) {
            // 设置文件大小
            raf.setLength(fileSize);
            
            // 创建分块任务列表
            java.util.List<java.util.concurrent.Future<Boolean>> futures = new java.util.ArrayList<>();
            java.util.concurrent.ExecutorService executor = java.util.concurrent.Executors.newFixedThreadPool(maxConcurrentChunks);
            
            long startTime = System.currentTimeMillis();
            
            // 提交分块下载任务
            for (long i = 0; i < totalChunks; i++) {
                final long chunkIndex = i;
                long start = i * chunkSize;
                long end = Math.min((i + 1) * chunkSize - 1, fileSize - 1);
                
                futures.add(executor.submit(() -> {
                    return downloadChunk(urlStr, headers, raf, start, end, chunkIndex, totalChunks);
                }));
            }
            
            // 等待所有任务完成
            boolean allSuccess = true;
            for (java.util.concurrent.Future<Boolean> future : futures) {
                try {
                    allSuccess &= future.get();
                } catch (Exception e) {
                    logger.error("获取分块下载结果失败: {}", e.getMessage(), e);
                    allSuccess = false;
                }
            }
            
            executor.shutdown();
            
            long endTime = System.currentTimeMillis();
            
            if (allSuccess) {
                logger.info("分块下载完成，文件: {}, 耗时: {}秒, 平均速度: {}MB/s",
                           fileName, (endTime - startTime) / 1000, 
                           (fileSize / (1024 * 1024.0)) / Math.max(1, (endTime - startTime) / 1000.0));
                return "0";
            } else {
                logger.error("分块下载失败，部分分块下载出错");
                return "1";
            }
        } catch (Exception e) {
            logger.error("分块下载异常: {}", e.getMessage(), e);
            return "1";
        }
    }
    
    /**
     * 下载单个分块
     * @param urlStr URL地址
     * @param headers 请求头
     * @param raf 随机访问文件
     * @param start 分块开始位置
     * @param end 分块结束位置
     * @param chunkIndex 分块索引
     * @param totalChunks 总块数
     * @return 下载是否成功
     */
    private static boolean downloadChunk(String urlStr, Map<String, String> headers, 
                                        java.io.RandomAccessFile raf, long start, long end, 
                                        long chunkIndex, long totalChunks) {
        try {
            logger.info("开始下载分块 {}/{}, 范围: {}-{}", chunkIndex + 1, totalChunks, start, end);
            
            // 构建请求头
            Request.Builder requestBuilder = new Request.Builder()
                    .url(urlStr)
                    .header("Range", "bytes=" + start + "-" + end);
            
            if (headers != null) {
                for (Map.Entry<String, String> entry : headers.entrySet()) {
                    requestBuilder.addHeader(entry.getKey(), entry.getValue());
                }
            }
            
            Request request = requestBuilder.build();
            
            try (Response response = client.newCall(request).execute()) {
                if (!response.isSuccessful() && response.code() != 206) {
                    logger.error("分块下载失败，状态码: {}, URL: {}", response.code(), urlStr);
                    return false;
                }
                
                try (ResponseBody responseBody = response.body()) {
                    if (responseBody == null) {
                        logger.error("分块响应体为空");
                        return false;
                    }
                    
                    try (java.io.InputStream inputStream = responseBody.byteStream()) {
                        byte[] buffer = new byte[16 * 1024];
                        int len;
                        long downloaded = 0;
                        long chunkSize = end - start + 1;
                        
                        // 定位到分块开始位置
                        raf.seek(start);
                        
                        // 读取并写入分块数据
                        while ((len = inputStream.read(buffer)) != -1) {
                            raf.write(buffer, 0, len);
                            downloaded += len;
                        }
                        
                        if (downloaded != chunkSize) {
                            logger.error("分块下载不完整，期望: {}字节, 实际: {}字节", chunkSize, downloaded);
                            return false;
                        }
                        
                        logger.info("分块 {}/{} 下载完成，大小: {}KB", 
                                  chunkIndex + 1, totalChunks, downloaded / 1024);
                        return true;
                    }
                }
            }
        } catch (Exception e) {
            logger.error("分块下载异常，分块 {}/{}, 错误: {}", chunkIndex + 1, totalChunks, e.getMessage(), e);
            return false;
        }
    }
    
    /**
     * 获取文件大小
     * @param urlStr URL地址
     * @param headers 请求头
     * @return 文件大小（字节），失败返回-1
     */
    private static long getFileSize(String urlStr, Map<String, String> headers) {
        try {
            Request.Builder requestBuilder = new Request.Builder()
                    .url(urlStr)
                    .method("HEAD", null);
            
            if (headers != null) {
                for (Map.Entry<String, String> entry : headers.entrySet()) {
                    requestBuilder.addHeader(entry.getKey(), entry.getValue());
                }
            }
            
            Request request = requestBuilder.build();
            
            try (Response response = client.newCall(request).execute()) {
                if (!response.isSuccessful()) {
                    logger.error("获取文件大小失败，状态码: {}, URL: {}", response.code(), urlStr);
                    return -1;
                }
                
                long fileSize = response.body().contentLength();
                logger.info("获取文件大小成功，URL: {}, 大小: {}MB", urlStr, fileSize / (1024 * 1024));
                return fileSize;
            }
        } catch (Exception e) {
            logger.error("获取文件大小异常: {}", e.getMessage(), e);
            return -1;
        }
    }
    
    /**
     * 获取OKHttpClient实例
     * @return OkHttpClient实例
     */
    public static OkHttpClient getClient() {
        return client;
    }
}