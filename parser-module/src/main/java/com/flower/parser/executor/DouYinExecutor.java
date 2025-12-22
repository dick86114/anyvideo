package com.flower.parser.executor;

import java.io.IOException;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

import org.jsoup.Jsoup;
import org.jsoup.nodes.Document;
import org.jsoup.nodes.Element;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import com.alibaba.fastjson2.JSONObject;
import com.flower.parser.config.Global;
import com.flower.parser.entity.CookiesConfigEntity;
import com.flower.parser.utils.HttpUtil;
import com.flower.parser.utils.SecurityUtil;
import com.flower.parser.utils.StringUtil;

/**
 * 抖音解析器 - 用于提取抖音视频和图文内容
 */
public class DouYinExecutor {
    
    private static final Logger logger = LoggerFactory.getLogger(DouYinExecutor.class);
    
    /**
     * 检查并初始化cookie_manage
     */
    private void checkCookieManage() {
        if (Global.cookie_manage == null) {
            Global.cookie_manage = new CookiesConfigEntity();
        }
    }
    
    /**
     * 解析抖音内容
     * @param detectedPlatform 检测到的平台
     * @param url 抖音URL
     * @throws IOException 可能的IO异常
     */
    public void ImageTextExecutor(String detectedPlatform, String url) throws IOException {
        // 检查并初始化cookie_manage
        checkCookieManage();
        
        logger.info("开始处理抖音URL: {}", url);
        
        // 发送HTTP请求获取页面内容
        String html = HttpUtil.getPage(url, "", "https://www.douyin.com/");
        logger.info("成功获取抖音页面内容，长度: {}", html.length());
        
        // 提取JSON字符串
        String jsonStr = extractJsonString(html);
        logger.info("提取JSON字符串，长度: {}", jsonStr != null ? jsonStr.length() : "null");
        
        // 解析JSON
        if (jsonStr != null && !jsonStr.isEmpty()) {
            parseJson(jsonStr, url);
        } else {
            logger.warn("未提取到JSON数据，使用HTML解析");
            // 使用HTML解析
            parseHtml(html, url);
        }
    }
    
    /**
     * 从HTML内容中提取JSON字符串
     */
    private String extractJsonString(String htmlContent) {
        // 抖音的JSON数据模式
        String[] regexPatterns = {
            "window.__INITIAL_STATE__ = (\\{[\\s\\S]*?\\});",
            "window.__DATA__ = (\\{[\\s\\S]*?\\});",
            "window.shareData = (\\{[\\s\\S]*?\\});"
        };
        
        for (String patternStr : regexPatterns) {
            try {
                Pattern pattern = Pattern.compile(patternStr, Pattern.DOTALL);
                Matcher matcher = pattern.matcher(htmlContent);
                
                if (matcher.find()) {
                    String jsonString = matcher.group(1).trim();
                    if (jsonString.endsWith(";")) {
                        jsonString = jsonString.substring(0, jsonString.length() - 1);
                    }
                    return jsonString;
                }
            } catch (Exception e) {
                logger.warn("JSON解析失败，尝试下一个模式: {}", e.getMessage());
            }
        }
        
        return null;
    }
    
    /**
     * 解析JSON数据
     */
    private void parseJson(String jsonStr, String url) {
        try {
            JSONObject jsonObject = JSONObject.parseObject(jsonStr);
            // 实现抖音JSON解析逻辑
            logger.info("成功解析抖音JSON数据");
        } catch (Exception e) {
            logger.error("抖音JSON解析失败: {}", e.getMessage(), e);
        }
    }
    
    /**
     * 解析HTML内容
     */
    private void parseHtml(String html, String url) {
        logger.info("开始抖音HTML解析");
        
        try {
            Document doc = Jsoup.parse(html);
            
            // 检测是否为视频
            boolean isVideo = detectVideoFromHtml(html, doc);
            logger.info("HTML检测视频: {}", isVideo);
            
            // 提取标题
            String title = extractTitleFromHtml(doc);
            
            // 提取描述
            String description = extractDescriptionFromHtml(doc);
            
            // 提取作者
            String author = extractAuthorFromHtml(doc);
            
            if (isVideo) {
                // 提取视频URL
                List<String> videoUrls = extractVideoUrlsFromHtml(html, doc);
                logger.info("提取到视频URL: {}", videoUrls);
            } else {
                // 提取图片URL
                List<String> imageUrls = extractImageUrlsFromHtml(html, doc);
                logger.info("提取到图片URL: {}", imageUrls);
            }
            
        } catch (Exception e) {
            logger.error("抖音HTML解析失败: {}", e.getMessage(), e);
        }
    }
    
    /**
     * 从HTML检测是否为视频
     */
    private boolean detectVideoFromHtml(String html, Document doc) {
        // 检测视频标签
        boolean hasVideoTag = doc.select("video").size() > 0;
        
        // 检测视频相关的类名或ID
        boolean hasVideoClass = doc.select(".video-container, .video-player, #video-player").size() > 0;
        
        // 检测视频URL - 简化的正则表达式
        boolean hasVideoUrl = Pattern.compile("https?://[^\"']+\\.(mp4|m3u8)", Pattern.CASE_INSENSITIVE).matcher(html).find();
        
        return hasVideoTag || hasVideoClass || hasVideoUrl;
    }
    
    /**
     * 从HTML提取标题
     */
    private String extractTitleFromHtml(Document doc) {
        String title = "抖音内容";
        
        // 尝试不同的标题选择器
        String[] titleSelectors = {".video-title", ".title", "h1", "h2", "meta[property='og:title']", "meta[name='title']"};
        
        for (String selector : titleSelectors) {
            Element element = doc.select(selector).first();
            if (element != null) {
                if (selector.startsWith("meta")) {
                    title = element.attr("content");
                } else {
                    title = element.text();
                }
                if (title != null && !title.isEmpty()) {
                    break;
                }
            }
        }
        
        return title.trim();
    }
    
    /**
     * 从HTML提取描述
     */
    private String extractDescriptionFromHtml(Document doc) {
        String description = "";
        
        // 尝试不同的描述选择器
        String[] descSelectors = {".video-desc", ".desc", ".description", "meta[property='og:description']", "meta[name='description']"};
        
        for (String selector : descSelectors) {
            Element element = doc.select(selector).first();
            if (element != null) {
                if (selector.startsWith("meta")) {
                    description = element.attr("content");
                } else {
                    description = element.text();
                }
                if (description != null && !description.isEmpty()) {
                    break;
                }
            }
        }
        
        return description.trim();
    }
    
    /**
     * 从HTML提取作者
     */
    private String extractAuthorFromHtml(Document doc) {
        String author = "抖音作者";
        
        // 尝试不同的作者选择器
        String[] authorSelectors = {".author-name", ".username", ".nickname", ".user-info", "meta[name='author']"};
        
        for (String selector : authorSelectors) {
            Element element = doc.select(selector).first();
            if (element != null) {
                if (selector.startsWith("meta")) {
                    author = element.attr("content");
                } else {
                    author = element.text();
                }
                if (author != null && !author.isEmpty()) {
                    break;
                }
            }
        }
        
        return author.trim();
    }
    
    /**
     * 从HTML提取视频URL
     */
    private List<String> extractVideoUrlsFromHtml(String html, Document doc) {
        List<String> videoUrls = new ArrayList<>();
        
        // 从video标签提取
        Element videoElement = doc.select("video").first();
        if (videoElement != null) {
            String videoUrl = videoElement.attr("src");
            if (videoUrl != null && !videoUrl.isEmpty()) {
                videoUrls.add(videoUrl);
            }
        }
        
        // 从脚本标签提取
        if (videoUrls.isEmpty()) {
            Pattern pattern = Pattern.compile("https?://[^\"']+\\.(mp4|m3u8)", Pattern.CASE_INSENSITIVE);
            Matcher matcher = pattern.matcher(html);
            while (matcher.find()) {
                String videoUrl = matcher.group(0);
                if (videoUrl != null && !videoUrl.isEmpty() && !videoUrls.contains(videoUrl)) {
                    videoUrls.add(videoUrl);
                }
            }
        }
        
        return videoUrls;
    }
    
    /**
     * 从HTML提取图片URL
     */
    private List<String> extractImageUrlsFromHtml(String html, Document doc) {
        List<String> imageUrls = new ArrayList<>();
        
        // 从img标签提取
        doc.select("img").forEach(img -> {
            String imgUrl = img.attr("src");
            if (imgUrl == null || imgUrl.isEmpty()) {
                imgUrl = img.attr("data-src");
            }
            if (imgUrl == null || imgUrl.isEmpty()) {
                imgUrl = img.attr("data-original");
            }
            
            if (imgUrl != null && !imgUrl.isEmpty() && imgUrl.startsWith("http") && !imageUrls.contains(imgUrl)) {
                imageUrls.add(imgUrl);
            }
        });
        
        // 从脚本中提取
        if (imageUrls.isEmpty()) {
            // 简化的正则表达式
            Pattern pattern = Pattern.compile("https?://[^\"']+\\.(jpg|jpeg|png|gif|webp)", Pattern.CASE_INSENSITIVE);
            Matcher matcher = pattern.matcher(html);
            while (matcher.find()) {
                String imgUrl = matcher.group(0);
                if (!imageUrls.contains(imgUrl)) {
                    imageUrls.add(imgUrl);
                }
            }
        }
        
        // 从meta标签提取封面图片
        String ogImage = doc.select("meta[property='og:image']").attr("content");
        if (ogImage != null && !ogImage.isEmpty() && ogImage.startsWith("http") && !imageUrls.contains(ogImage)) {
            imageUrls.add(ogImage);
        }
        
        return imageUrls;
    }
}