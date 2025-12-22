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

import com.alibaba.fastjson2.JSONArray;
import com.alibaba.fastjson2.JSONObject;
import com.flower.parser.config.Global;
import com.flower.parser.entity.CookiesConfigEntity;
import com.flower.parser.utils.HttpUtil;
import com.flower.parser.utils.SecurityUtil;
import com.flower.parser.utils.StringUtil;

/**
 * 小红书解析器 - 用于提取小红书视频和图文内容
 */
public class HongShuExecutor {
    
    private static final Logger logger = LoggerFactory.getLogger(HongShuExecutor.class);
    
    /**
     * 检查并初始化cookie_manage
     */
    private void checkCookieManage() {
        if (Global.cookie_manage == null) {
            Global.cookie_manage = new CookiesConfigEntity();
        }
    }
    
    /**
     * 解析小红书内容
     * @param detectedPlatform 检测到的平台
     * @param url 小红书URL
     * @throws IOException 可能的IO异常
     */
    public void dataExecutor(String detectedPlatform, String url) throws IOException {
        // 检查并初始化cookie_manage
        checkCookieManage();
        
        logger.info("开始处理小红书URL: {}", url);
        
        // 生成设备指纹和签名
        String deviceId = SecurityUtil.generateDeviceId();
        String timestamp = SecurityUtil.generateTimestamp();
        String signature = SecurityUtil.generateSign("/explore", new HashMap<>(), Global.cookie_manage.getRednotecookie(), deviceId, timestamp);
        
        HashMap<String, String> header = new HashMap<>();
        header.put("Referer", "https://www.xiaohongshu.com/");
        header.put("User-Agent", SecurityUtil.getRandomUserAgent());
        header.put("Accept", "application/json, text/plain, */*");
        header.put("x-t", timestamp);
        header.put("x-s", signature);
        header.put("x-device-id", deviceId);
        header.put("x-requested-with", "XMLHttpRequest");
        
        if (Global.cookie_manage.getRednotecookie() != null && !Global.cookie_manage.getRednotecookie().isEmpty()) {
            header.put("Cookie", Global.cookie_manage.getRednotecookie());
        }
        
        logger.info("发送HTTP请求获取页面内容");
        String page = HttpUtil.getPage(url, Global.cookie_manage.getRednotecookie(), "https://www.xiaohongshu.com/");
        logger.info("成功获取页面内容，长度: {}", page.length());
        
        // 尝试从HTML中提取JSON数据
        JSONObject jsonData = extractJsonData(page);
        
        // 提取内容信息
        String title = "小红书内容";
        String author = "小红书作者";
        String description = "";
        String contentId = extractContentIdFromUrl(url);
        boolean isVideo = false;
        List<String> videoUrls = new ArrayList<>();
        List<String> imageUrls = new ArrayList<>();
        String coverUrl = null;
        
        if (jsonData != null) {
            logger.info("使用JSON数据解析内容");
            // 从JSON数据提取内容
            Map<String, Object> contentInfo = extractContentFromJson(jsonData);
            title = (String) contentInfo.get("title");
            author = (String) contentInfo.get("author");
            description = (String) contentInfo.get("description");
            isVideo = (Boolean) contentInfo.get("isVideo");
            videoUrls = (List<String>) contentInfo.get("videoUrls");
            imageUrls = (List<String>) contentInfo.get("imageUrls");
            coverUrl = (String) contentInfo.get("coverUrl");
            String extractedContentId = (String) contentInfo.get("contentId");
            if (extractedContentId != null && !extractedContentId.isEmpty()) {
                contentId = extractedContentId;
            }
        } else {
            logger.info("JSON数据提取失败，使用HTML解析");
            // 从HTML提取内容
            Map<String, Object> contentInfo = extractContentFromHtml(page, url);
            title = (String) contentInfo.get("title");
            author = (String) contentInfo.get("author");
            description = (String) contentInfo.get("description");
            isVideo = (Boolean) contentInfo.get("isVideo");
            videoUrls = (List<String>) contentInfo.get("videoUrls");
            imageUrls = (List<String>) contentInfo.get("imageUrls");
            coverUrl = (String) contentInfo.get("coverUrl");
        }
        
        logger.info("内容解析结果: 标题='{}', 作者='{}', 类型={}, 视频数量={}, 图片数量={}", 
                title, author, isVideo ? "视频" : "图文", videoUrls.size(), imageUrls.size());
    }
    
    /**
     * 从HTML内容中提取JSON数据
     * @param htmlContent HTML内容
     * @return 提取到的JSON对象，提取失败返回null
     */
    private JSONObject extractJsonData(String htmlContent) {
        // 简化的正则表达式模式，避免复杂转义
        String[] regexPatterns = {
            "window.__INITIAL_STATE__ = (\\{.*?\\});",
            "window.__INITIAL_DATA__ = (\\{.*?\\});",
            "window.INITIAL_STATE = (\\{.*?\\});",
            "__INITIAL_STATE__ = (\\{.*?\\});",
            "window.__NOTE_DATA__ = (\\{.*?\\});",
            "window.$NOTE_DATA = (\\{.*?\\});",
            "window.__PAGE_DATA__ = (\\{.*?\\});",
            "__NOTE_DATA__ = (\\{.*?\\});",
            "window.$REDUX_STATE = (\\{.*?\\});",
            "window.$STORE = (\\{.*?\\});",
            "window.store = (\\{.*?\\});",
            "window.__data__ = (\\{.*?\\});",
            "window.$REQUIRED_FIELDS = (\\{.*?\\});",
            "window.data = (\\{.*?\\});",
            "window.__APP_INITIAL_STATE__ = (\\{.*?\\});",
            "window.appData = (\\{.*?\\});",
            "window.initialData = (\\{.*?\\});",
            "<script[^>]*>.*?(\\{.*?\\}).*?</script>",
            "<script[^>]*>.*?window.__NEXT_DATA__ = (\\{.*?\\});.*?</script>",
            "<script[^>]*>.*?__INITIAL_STATE__ = (\\{.*?\\});.*?</script>",
            "<script[^>]*>.*?window.global_data = (\\{.*?\\});.*?</script>",
            "<script[^>]*>.*?window.FE_APP_DATA = (\\{.*?\\});.*?</script>",
            "<script[^>]*>.*?window.XHS_DATA = (\\{.*?\\});.*?</script>",
            "<script[^>]*>.*?window.noteData = (\\{.*?\\});.*?</script>"
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
                    return JSONObject.parseObject(jsonString);
                }
            } catch (Exception e) {
                logger.warn("JSON解析失败，尝试下一个模式: {}", e.getMessage());
            }
        }
        
        return null;
    }
    
    /**
     * 从JSON数据提取内容信息
     * @param jsonData JSON数据
     * @return 内容信息映射
     */
    private Map<String, Object> extractContentFromJson(JSONObject jsonData) {
        Map<String, Object> result = new HashMap<>();
        
        try {
            // 增强的内容数据提取 - 支持多种JSON数据结构
            JSONObject contentData = findContentData(jsonData);
            if (contentData == null) {
                logger.warn("未找到有效的内容数据");
                return result;
            }
            
            // 提取基本信息
            String title = extractTitle(contentData);
            String author = extractAuthor(contentData);
            String description = extractDescription(contentData);
            String contentId = extractContentId(contentData);
            boolean isVideo = isVideoContent(contentData);
            
            // 提取视频URL
            List<String> videoUrls = new ArrayList<>();
            if (isVideo) {
                videoUrls = extractVideoUrls(contentData);
            }
            
            // 提取图片URL
            List<String> imageUrls = extractImageUrls(contentData);
            
            // 提取封面URL
            String coverUrl = extractCoverUrl(contentData, imageUrls);
            
            // 验证并过滤URL
            List<String> validImageUrls = validateAndFilterUrls(imageUrls);
            List<String> validVideoUrls = validateAndFilterUrls(videoUrls);
            
            // 为视频内容只保留封面图
            if (isVideo && !validImageUrls.isEmpty()) {
                validImageUrls = new ArrayList<>(List.of(validImageUrls.get(0)));
            }
            
            result.put("title", title);
            result.put("author", author);
            result.put("description", description);
            result.put("contentId", contentId);
            result.put("isVideo", isVideo);
            result.put("videoUrls", validVideoUrls);
            result.put("imageUrls", validImageUrls);
            result.put("coverUrl", coverUrl);
            
        } catch (Exception e) {
            logger.error("从JSON提取内容失败: {}", e.getMessage(), e);
        }
        
        return result;
    }
    
    /**
     * 从JSON中查找内容数据
     * @param json JSON对象
     * @return 内容数据对象
     */
    private JSONObject findContentData(JSONObject json) {
        JSONObject contentData = null;
        
        try {
            // 增强的内容数据提取 - 支持多种JSON数据结构
            contentData = json.getJSONArray("notes") != null && json.getJSONArray("notes").size() > 0 ? json.getJSONArray("notes").getJSONObject(0) : null;
            if (contentData == null) contentData = json.getJSONObject("note");
            if (contentData == null) contentData = json.getJSONObject("data") != null ? json.getJSONObject("data").getJSONObject("note") : null;
            if (contentData == null) contentData = json.getJSONObject("state") != null ? json.getJSONObject("state").getJSONObject("note") : null;
            if (contentData == null) contentData = json.getJSONObject("data") != null && json.getJSONObject("data").getJSONArray("contents") != null && json.getJSONObject("data").getJSONArray("contents").size() > 0 ? json.getJSONObject("data").getJSONArray("contents").getJSONObject(0) : null;
            if (contentData == null) contentData = json.getJSONObject("props") != null ? json.getJSONObject("props").getJSONObject("pageProps").getJSONObject("note") : null;
            if (contentData == null) contentData = json.getJSONObject("__NEXT_DATA__") != null ? json.getJSONObject("__NEXT_DATA__").getJSONObject("props").getJSONObject("pageProps").getJSONObject("note") : null;
            if (contentData == null) contentData = json.getJSONObject("data") != null ? json.getJSONObject("data").getJSONObject("noteDetail") : null;
            if (contentData == null) contentData = json.getJSONObject("detail") != null ? json.getJSONObject("detail").getJSONObject("note") : null;
            if (contentData == null) contentData = json.getJSONObject("fe_data") != null ? json.getJSONObject("fe_data").getJSONObject("note") : null;
            if (contentData == null) contentData = json.getJSONObject("data") != null && json.getJSONObject("data").getJSONObject("detail") != null ? json.getJSONObject("data").getJSONObject("detail").getJSONObject("note") : null;
            if (contentData == null) contentData = json.getJSONObject("state") != null && json.getJSONObject("state").getJSONObject("detail") != null ? json.getJSONObject("state").getJSONObject("detail").getJSONObject("note") : null;
            if (contentData == null) contentData = json.getJSONObject("__data__") != null ? json.getJSONObject("__data__").getJSONObject("note") : null;
            if (contentData == null) contentData = json.getJSONObject("note_data");
            if (contentData == null) contentData = json.getJSONObject("data") != null && json.getJSONObject("data").getJSONArray("contents") != null && json.getJSONObject("data").getJSONArray("contents").size() > 0 ? json.getJSONObject("data").getJSONArray("contents").getJSONObject(0).getJSONObject("content") : null;
            if (contentData == null) contentData = json.getJSONObject("data") != null ? json.getJSONObject("data").getJSONObject("content") : null;
            if (contentData == null) contentData = json.getJSONObject("content");
            if (contentData == null) contentData = json.getJSONObject("noteDetail") != null ? json.getJSONObject("noteDetail").getJSONObject("note") : null;
            if (contentData == null) contentData = json.getJSONObject("fe_page") != null ? json.getJSONObject("fe_page").getJSONObject("note") : null;
            if (contentData == null) contentData = json.getJSONObject("pageData") != null ? json.getJSONObject("pageData").getJSONObject("note") : null;
            if (contentData == null) contentData = json.getJSONObject("entryData") != null && json.getJSONObject("entryData").getJSONObject("note") != null ? json.getJSONObject("entryData").getJSONObject("note").getJSONObject("noteData") : null;
            if (contentData == null) contentData = json.getJSONObject("initialData") != null ? json.getJSONObject("initialData").getJSONObject("note") : null;
            if (contentData == null) contentData = json.getJSONObject("feed") != null && json.getJSONObject("feed").getJSONArray("items") != null && json.getJSONObject("feed").getJSONArray("items").size() > 0 ? json.getJSONObject("feed").getJSONArray("items").getJSONObject(0).getJSONObject("note") : null;
            if (contentData == null) contentData = json.getJSONObject("contentData") != null ? json.getJSONObject("contentData").getJSONObject("note") : null;
        } catch (Exception e) {
            logger.error("提取内容数据失败: {}", e.getMessage(), e);
        }
        
        return contentData;
    }
    
    /**
     * 从HTML提取内容信息
     * @param html HTML内容
     * @param url 原始URL
     * @return 内容信息映射
     */
    private Map<String, Object> extractContentFromHtml(String html, String url) {
        Map<String, Object> result = new HashMap<>();
        
        try {
            Document doc = Jsoup.parse(html);
            
            // 提取标题
            String title = extractTitleFromHtml(doc);
            
            // 提取作者
            String author = extractAuthorFromHtml(doc);
            
            // 提取描述
            String description = extractDescriptionFromHtml(doc);
            
            // 提取内容ID
            String contentId = extractContentIdFromUrl(url);
            
            // 检测是否为视频
            boolean isVideo = detectVideoFromHtml(html, doc);
            
            // 提取视频URL
            List<String> videoUrls = new ArrayList<>();
            if (isVideo) {
                videoUrls = extractVideoUrlsFromHtml(html, doc);
            }
            
            // 提取图片URL
            List<String> imageUrls = extractImageUrlsFromHtml(doc);
            
            // 提取封面URL
            String coverUrl = extractCoverUrlFromHtml(doc, imageUrls);
            
            // 验证并过滤URL
            List<String> validImageUrls = validateAndFilterUrls(imageUrls);
            List<String> validVideoUrls = validateAndFilterUrls(videoUrls);
            
            // 为视频内容只保留封面图
            if (isVideo && !validImageUrls.isEmpty()) {
                validImageUrls = new ArrayList<>(List.of(validImageUrls.get(0)));
            }
            
            result.put("title", title);
            result.put("author", author);
            result.put("description", description);
            result.put("contentId", contentId);
            result.put("isVideo", isVideo);
            result.put("videoUrls", validVideoUrls);
            result.put("imageUrls", validImageUrls);
            result.put("coverUrl", coverUrl);
            
        } catch (Exception e) {
            logger.error("从HTML提取内容失败: {}", e.getMessage(), e);
        }
        
        return result;
    }
    
    /**
     * 从JSON提取标题
     * @param contentData 内容数据
     * @return 标题
     */
    private String extractTitle(JSONObject contentData) {
        String title = contentData.getString("title");
        if (title == null || title.isEmpty()) {
            title = "小红书内容";
        }
        return title.trim();
    }
    
    /**
     * 从HTML提取标题
     * @param doc HTML文档
     * @return 标题
     */
    private String extractTitleFromHtml(Document doc) {
        // 尝试不同的选择器
        String[] selectors = {".note-title", "h1", ".title", ".rich-text", ".content-title", ".article-title", ".post-title", ".main-title"};
        
        for (String selector : selectors) {
            Element element = doc.select(selector).first();
            if (element != null) {
                String title = element.text().trim();
                if (!title.isEmpty()) {
                    return title;
                }
            }
        }
        
        // 尝试从meta标签提取
        Element metaTitle = doc.select("meta[name='title']").first();
        if (metaTitle != null) {
            String title = metaTitle.attr("content");
            if (title != null && !title.isEmpty()) {
                return title.trim();
            }
        }
        
        return "小红书内容";
    }
    
    /**
     * 从JSON提取作者
     * @param contentData 内容数据
     * @return 作者
     */
    private String extractAuthor(JSONObject contentData) {
        String author = "小红书作者";
        
        try {
            if (contentData.containsKey("user")) {
                JSONObject user = contentData.getJSONObject("user");
                author = user.getString("nickname") != null ? user.getString("nickname") : author;
            }
        } catch (Exception e) {
            logger.error("提取作者信息失败: {}", e.getMessage(), e);
        }
        
        return author.trim();
    }
    
    /**
     * 从HTML提取作者
     * @param doc HTML文档
     * @return 作者
     */
    private String extractAuthorFromHtml(Document doc) {
        // 尝试不同的选择器
        String[] selectors = {".author-name", ".user-name", ".nickname", ".name", ".author", ".creator-name", ".publisher-name", ".note-author"};
        
        for (String selector : selectors) {
            Element element = doc.select(selector).first();
            if (element != null) {
                String author = element.text().trim();
                if (!author.isEmpty()) {
                    return author;
                }
            }
        }
        
        // 尝试从meta标签提取
        Element metaAuthor = doc.select("meta[name='author']").first();
        if (metaAuthor != null) {
            String author = metaAuthor.attr("content");
            if (author != null && !author.isEmpty()) {
                return author.trim();
            }
        }
        
        Element ogSiteName = doc.select("meta[property='og:site_name']").first();
        if (ogSiteName != null) {
            String author = ogSiteName.attr("content");
            if (author != null && !author.isEmpty()) {
                return author.trim();
            }
        }
        
        return "小红书作者";
    }
    
    /**
     * 从JSON提取描述
     * @param contentData 内容数据
     * @return 描述
     */
    private String extractDescription(JSONObject contentData) {
        String description = "";
        
        try {
            // 尝试从多个字段提取描述
            description = contentData.getString("desc") != null ? contentData.getString("desc") : description;
            if (description.isEmpty()) description = contentData.getString("description") != null ? contentData.getString("description") : description;
            if (description.isEmpty()) description = contentData.getString("content") != null ? contentData.getString("content") : description;
            if (description.isEmpty()) description = contentData.getString("text") != null ? contentData.getString("text") : description;
            if (description.isEmpty()) description = contentData.getString("body") != null ? contentData.getString("body") : description;
            if (description.isEmpty()) description = contentData.getString("intro") != null ? contentData.getString("intro") : description;
            if (description.isEmpty()) description = contentData.getString("summary") != null ? contentData.getString("summary") : description;
            if (description.isEmpty()) description = contentData.getString("noteContent") != null ? contentData.getString("noteContent") : description;
            if (description.isEmpty()) description = contentData.getString("detail") != null ? contentData.getString("detail") : description;
        } catch (Exception e) {
            logger.error("提取描述信息失败: {}", e.getMessage(), e);
        }
        
        // 清理描述
        description = description.replaceAll("\\s+", " ").trim();
        // 限制描述长度
        if (description.length() > 500) {
            description = description.substring(0, 500) + "...";
        }
        
        return description;
    }
    
    /**
     * 从HTML提取描述
     * @param doc HTML文档
     * @return 描述
     */
    private String extractDescriptionFromHtml(Document doc) {
        // 尝试不同的选择器
        String[] selectors = {".note-content", ".note-desc", ".content", ".rich-text", ".description", ".content-text", ".main-content", ".article-content", ".post-content", ".note-detail-content", ".detail-content", ".note-main", ".text-content"};
        
        for (String selector : selectors) {
            Element element = doc.select(selector).first();
            if (element != null) {
                String description = element.text().trim();
                if (!description.isEmpty()) {
                    // 清理描述
                    description = description.replaceAll("\\s+", " ").trim();
                    // 限制描述长度
                    if (description.length() > 500) {
                        description = description.substring(0, 500) + "...";
                    }
                    return description;
                }
            }
        }
        
        // 尝试从meta标签提取
        Element metaDesc = doc.select("meta[name='description']").first();
        if (metaDesc != null) {
            String description = metaDesc.attr("content");
            if (description != null && !description.isEmpty()) {
                return description.trim();
            }
        }
        
        Element ogDesc = doc.select("meta[property='og:description']").first();
        if (ogDesc != null) {
            String description = ogDesc.attr("content");
            if (description != null && !description.isEmpty()) {
                return description.trim();
            }
        }
        
        return "";
    }
    
    /**
     * 从JSON提取内容ID
     * @param contentData 内容数据
     * @return 内容ID
     */
    private String extractContentId(JSONObject contentData) {
        String contentId = null;
        
        try {
            contentId = contentData.getString("id");
            if (contentId == null || contentId.isEmpty()) {
                contentId = contentData.getString("note_id");
            }
        } catch (Exception e) {
            logger.error("提取内容ID失败: {}", e.getMessage(), e);
        }
        
        return contentId;
    }
    
    /**
     * 从URL提取内容ID
     * @param url URL
     * @return 内容ID
     */
    private String extractContentIdFromUrl(String url) {
        try {
            Pattern pattern = Pattern.compile("(?:explore|note)/(\\w+)");
            Matcher matcher = pattern.matcher(url);
            if (matcher.find()) {
                return matcher.group(1);
            }
        } catch (Exception e) {
            logger.error("从URL提取内容ID失败: {}", e.getMessage(), e);
        }
        
        return "xiaohongshu_" + System.currentTimeMillis();
    }
    
    /**
     * 判断是否为视频内容
     * @param contentData 内容数据
     * @return 是否为视频
     */
    private boolean isVideoContent(JSONObject contentData) {
        try {
            String type = contentData.getString("type");
            return "video".equals(type);
        } catch (Exception e) {
            logger.error("判断内容类型失败: {}", e.getMessage(), e);
        }
        
        return false;
    }
    
    /**
     * 从HTML检测是否为视频
     * @param html HTML内容
     * @param doc HTML文档
     * @return 是否为视频
     */
    private boolean detectVideoFromHtml(String html, Document doc) {
        // 多种视频检测方式
        boolean hasVideoTag = doc.select("video").size() > 0;
        boolean hasVideoAttribute = doc.select("[data-type='video']").size() > 0;
        boolean hasVideoClass = doc.select("[class*='video']").size() > 0;
        boolean hasVideoContent = html.contains("\"type\":\"video\"") || html.contains("\"mediaType\":\"video\"") || html.contains("video:");
        boolean hasVideoUrl = Pattern.compile("https?://.*?\\.(mp4|m3u8)", Pattern.CASE_INSENSITIVE).matcher(html).find();
        
        return hasVideoTag || (hasVideoAttribute && hasVideoUrl) || (hasVideoClass && hasVideoUrl) || (hasVideoContent && hasVideoUrl);
    }
    
    /**
     * 从JSON提取视频URL
     * @param contentData 内容数据
     * @return 视频URL列表
     */
    private List<String> extractVideoUrls(JSONObject contentData) {
        List<String> videoUrls = new ArrayList<>();
        
        try {
            if (contentData.containsKey("video")) {
                JSONObject videoData = contentData.getJSONObject("video");
                
                // 增强的视频URL提取 - 支持多种视频数据结构
                String videoUrl = null;
                
                // 从stream.h264提取
                if (videoData.containsKey("stream")) {
                    JSONArray h264Data = videoData.getJSONObject("stream").getJSONArray("h264");
                    if (h264Data != null && h264Data.size() > 0) {
                        JSONObject h264Item = h264Data.getJSONObject(0);
                        videoUrl = h264Item.getString("masterUrl");
                    }
                }
                
                // 从其他字段提取
                if (videoUrl == null || videoUrl.isEmpty()) videoUrl = videoData.getString("url");
                if (videoUrl == null || videoUrl.isEmpty()) videoUrl = videoData.getString("h264_url");
                if (videoUrl == null || videoUrl.isEmpty()) videoUrl = videoData.getString("h265_url");
                if (videoUrl == null || videoUrl.isEmpty()) videoUrl = videoData.getString("m3u8_url");
                if (videoUrl == null || videoUrl.isEmpty()) videoUrl = videoData.getString("play_addr_url");
                if (videoUrl == null || videoUrl.isEmpty()) videoUrl = videoData.getString("play_url");
                if (videoUrl == null || videoUrl.isEmpty()) videoUrl = videoData.getString("video_url");
                if (videoUrl == null || videoUrl.isEmpty()) videoUrl = videoData.getString("video_src");
                if (videoUrl == null || videoUrl.isEmpty()) videoUrl = videoData.getString("src");
                if (videoUrl == null || videoUrl.isEmpty()) videoUrl = videoData.getString("original_url");
                if (videoUrl == null || videoUrl.isEmpty()) videoUrl = videoData.getString("full_url");
                if (videoUrl == null || videoUrl.isEmpty()) videoUrl = videoData.getString("download_url");
                if (videoUrl == null || videoUrl.isEmpty()) videoUrl = videoData.getString("hls_url");
                if (videoUrl == null || videoUrl.isEmpty()) videoUrl = videoData.getString("stream_url");
                if (videoUrl == null || videoUrl.isEmpty()) videoUrl = videoData.getString("main_url");
                
                // 从play_list提取
                if (videoUrl == null || videoUrl.isEmpty() && videoData.containsKey("play_list")) {
                    JSONArray playList = videoData.getJSONArray("play_list");
                    if (playList != null && playList.size() > 0) {
                        videoUrl = playList.getJSONObject(0).getString("url");
                    }
                }
                
                // 从quality_list提取
                if (videoUrl == null || videoUrl.isEmpty() && videoData.containsKey("quality_list")) {
                    JSONArray qualityList = videoData.getJSONArray("quality_list");
                    if (qualityList != null && qualityList.size() > 0) {
                        videoUrl = qualityList.getJSONObject(0).getString("url");
                    }
                }
                
                // 尝试从contentData直接提取
                if (videoUrl == null || videoUrl.isEmpty()) videoUrl = contentData.getString("videoUrl");
                if (videoUrl == null || videoUrl.isEmpty()) videoUrl = contentData.getString("playUrl");
                if (videoUrl == null || videoUrl.isEmpty()) videoUrl = contentData.getString("downloadUrl");
                
                // 从multi-media structures提取
                if (videoUrl == null || videoUrl.isEmpty() && contentData.containsKey("medias")) {
                    JSONArray medias = contentData.getJSONArray("medias");
                    if (medias != null && medias.size() > 0) {
                        for (int i = 0; i < medias.size(); i++) {
                            JSONObject media = medias.getJSONObject(i);
                            if ("video".equals(media.getString("type"))) {
                                videoUrl = media.getString("url");
                                break;
                            }
                        }
                    }
                }
                
                // 从content blocks提取
                if (videoUrl == null || videoUrl.isEmpty() && contentData.containsKey("contents")) {
                    JSONArray contents = contentData.getJSONArray("contents");
                    if (contents != null && contents.size() > 0) {
                        for (int i = 0; i < contents.size(); i++) {
                            JSONObject content = contents.getJSONObject(i);
                            if ("video".equals(content.getString("type")) && content.containsKey("data")) {
                                videoUrl = content.getJSONObject("data").getString("url");
                                break;
                            }
                        }
                    }
                }
                
                if (videoUrl != null && !videoUrl.isEmpty()) {
                    videoUrls.add(videoUrl);
                }
            }
        } catch (Exception e) {
            logger.error("提取视频URL失败: {}", e.getMessage(), e);
        }
        
        return videoUrls;
    }
    
    /**
     * 从HTML提取视频URL
     * @param html HTML内容
     * @param doc HTML文档
     * @return 视频URL列表
     */
    private List<String> extractVideoUrlsFromHtml(String html, Document doc) {
        List<String> videoUrls = new ArrayList<>();
        
        try {
            // 从video标签提取
            Element videoElement = doc.select("video").first();
            if (videoElement != null) {
                String videoUrl = videoElement.attr("src") != null ? videoElement.attr("src") : "";
                if (videoUrl.isEmpty()) videoUrl = videoElement.attr("data-src") != null ? videoElement.attr("data-src") : "";
                if (videoUrl.isEmpty()) videoUrl = videoElement.attr("data-video-url") != null ? videoElement.attr("data-video-url") : "";
                if (videoUrl.isEmpty()) videoUrl = videoElement.attr("data-original") != null ? videoElement.attr("data-original") : "";
                if (videoUrl.isEmpty()) videoUrl = videoElement.attr("data-play-url") != null ? videoElement.attr("data-play-url") : "";
                if (videoUrl.isEmpty()) videoUrl = videoElement.attr("data-playlist") != null ? videoElement.attr("data-playlist") : "";
                if (videoUrl.isEmpty()) videoUrl = videoElement.attr("data-video") != null ? videoElement.attr("data-video") : "";
                
                // 从source标签提取
                if (videoUrl.isEmpty()) {
                    Element sourceElement = videoElement.select("source").first();
                    if (sourceElement != null) {
                        videoUrl = sourceElement.attr("src") != null ? sourceElement.attr("src") : "";
                        if (videoUrl.isEmpty()) videoUrl = sourceElement.attr("data-src") != null ? sourceElement.attr("data-src") : "";
                    }
                }
                
                if (!videoUrl.isEmpty()) {
                    videoUrls.add(videoUrl);
                }
            }
            
            // 从脚本标签提取
            if (videoUrls.isEmpty()) {
                for (Element script : doc.select("script")) {
                    String content = script.html();
                    if (content != null && (content.contains("video") || content.contains("Video") || content.contains("note"))) {
                        // 简化的视频URL提取模式
                        String[] patterns = {
                            "https?://.*?\\.(mp4|m3u8|avi|mov)",
                            "url\\s*:\\s*([^,\\}]+)",
                            "'url'\\s*:\\s*'([^']+)'"
                        };
                        
                        for (String patternStr : patterns) {
                            Pattern pattern = Pattern.compile(patternStr, Pattern.CASE_INSENSITIVE);
                            Matcher matcher = pattern.matcher(content);
                            while (matcher.find()) {
                                String foundUrl = matcher.group(1) != null ? matcher.group(1) : matcher.group(0);
                                // 清理URL
                                foundUrl = foundUrl.trim().replaceAll("['\\\"\\\\]", "");
                                if ((foundUrl.contains(".mp4") || foundUrl.contains(".m3u8")) && !videoUrls.contains(foundUrl)) {
                                    videoUrls.add(foundUrl);
                                }
                            }
                        }
                        
                        if (!videoUrls.isEmpty()) {
                            break;
                        }
                    }
                }
            }
            
            // 从数据属性提取
            if (videoUrls.isEmpty()) {
                Element videoContainer = doc.select("[data-video], [data-video-url], [data-play-url]").first();
                if (videoContainer != null) {
                    String videoUrl = videoContainer.attr("data-video") != null ? videoContainer.attr("data-video") : "";
                    if (videoUrl.isEmpty()) videoUrl = videoContainer.attr("data-video-url") != null ? videoContainer.attr("data-video-url") : "";
                    if (videoUrl.isEmpty()) videoUrl = videoContainer.attr("data-play-url") != null ? videoContainer.attr("data-play-url") : "";
                    
                    if (!videoUrl.isEmpty()) {
                        videoUrls.add(videoUrl);
                    }
                }
            }
        } catch (Exception e) {
            logger.error("从HTML提取视频URL失败: {}", e.getMessage(), e);
        }
        
        return videoUrls;
    }
    
    /**
     * 从JSON提取图片URL
     * @param contentData 内容数据
     * @return 图片URL列表
     */
    private List<String> extractImageUrls(JSONObject contentData) {
        List<String> imageUrls = new ArrayList<>();
        
        try {
            // 从images数组提取
            JSONArray imageList = contentData.getJSONArray("images");
            if (imageList != null && imageList.size() > 0) {
                for (int i = 0; i < imageList.size(); i++) {
                    JSONObject imageObj = imageList.getJSONObject(i);
                    
                    // 增强的图片URL提取 - 支持不同质量的图片
                    String imgUrl = null;
                    
                    // 高清图片URL
                    if (imageObj.containsKey("large")) {
                        imgUrl = imageObj.getJSONObject("large").getString("url");
                    }
                    // 原始图片URL
                    if (imgUrl == null || imgUrl.isEmpty()) imgUrl = imageObj.getString("origin_url");
                    if (imgUrl == null || imgUrl.isEmpty()) imgUrl = imageObj.getString("original_url");
                    // 普通质量图片URL
                    if (imgUrl == null || imgUrl.isEmpty()) imgUrl = imageObj.getString("url");
                    if (imgUrl == null || imgUrl.isEmpty()) imgUrl = imageObj.containsKey("middle") ? imageObj.getJSONObject("middle").getString("url") : null;
                    // 缩略图URL
                    if (imgUrl == null || imgUrl.isEmpty()) imgUrl = imageObj.getString("thumb_url");
                    if (imgUrl == null || imgUrl.isEmpty()) imgUrl = imageObj.getString("thumbnail_url");
                    
                    // 处理实况图片
                    if (imageObj.containsKey("live_photo")) {
                        JSONObject livePhoto = imageObj.getJSONObject("live_photo");
                        if (livePhoto.containsKey("image_url")) {
                            imageUrls.add(livePhoto.getString("image_url"));
                        }
                        if (livePhoto.containsKey("video_url")) {
                            imageUrls.add(livePhoto.getString("video_url"));
                        }
                    } else if (imgUrl != null && !imgUrl.isEmpty()) {
                        imageUrls.add(imgUrl);
                    }
                }
            }
            
            // 从image_list提取（另一种数据结构）
            if (imageUrls.isEmpty()) {
                imageList = contentData.getJSONArray("image_list");
                if (imageList != null && imageList.size() > 0) {
                    for (int i = 0; i < imageList.size(); i++) {
                        JSONObject imageObj = imageList.getJSONObject(i);
                        String imgUrl = null;
                        if (imageObj.containsKey("large")) {
                            imgUrl = imageObj.getJSONObject("large").getString("url");
                        }
                        if (imgUrl == null || imgUrl.isEmpty()) imgUrl = imageObj.getString("url");
                        if (imgUrl == null || imgUrl.isEmpty()) imgUrl = imageObj.containsKey("middle") ? imageObj.getJSONObject("middle").getString("url") : null;
                        if (imgUrl == null || imgUrl.isEmpty()) imgUrl = imageObj.containsKey("small") ? imageObj.getJSONObject("small").getString("url") : null;
                        if (imgUrl == null || imgUrl.isEmpty()) imgUrl = imageObj.getString("origin_url");
                        
                        if (imgUrl != null && !imgUrl.isEmpty()) {
                            imageUrls.add(imgUrl);
                        }
                    }
                }
            }
            
            // 从contents提取（内容块结构）
            if (imageUrls.isEmpty()) {
                JSONArray contents = contentData.getJSONArray("contents");
                if (contents != null && contents.size() > 0) {
                    for (int i = 0; i < contents.size(); i++) {
                        JSONObject contentItem = contents.getJSONObject(i);
                        if ("image".equals(contentItem.getString("type")) && contentItem.containsKey("data")) {
                            JSONObject imageData = contentItem.getJSONObject("data");
                            String imgUrl = imageData.getString("url");
                            if (imgUrl != null && !imgUrl.isEmpty()) {
                                imageUrls.add(imgUrl);
                            }
                        }
                        // 处理实况图片内容块
                        else if ("live_photo".equals(contentItem.getString("type")) && contentItem.containsKey("data")) {
                            JSONObject livePhotoData = contentItem.getJSONObject("data");
                            if (livePhotoData.containsKey("image_url")) {
                                imageUrls.add(livePhotoData.getString("image_url"));
                            }
                            if (livePhotoData.containsKey("video_url")) {
                                imageUrls.add(livePhotoData.getString("video_url"));
                            }
                        }
                    }
                }
            }
        } catch (Exception e) {
            logger.error("提取图片URL失败: {}", e.getMessage(), e);
        }
        
        return imageUrls;
    }
    
    /**
     * 从HTML提取图片URL
     * @param doc HTML文档
     * @return 图片URL列表
     */
    private List<String> extractImageUrlsFromHtml(Document doc) {
        List<String> imageUrls = new ArrayList<>();
        
        try {
            // 从img标签提取
            for (Element img : doc.select("img")) {
                // 跳过无关图片
                String classNames = img.attr("class") != null ? img.attr("class") : "";
                String id = img.attr("id") != null ? img.attr("id") : "";
                String src = img.attr("src") != null ? img.attr("src") : "";
                
                boolean isIrrelevant = classNames.contains("avatar") || classNames.contains("icon") || classNames.contains("ad") || 
                                      classNames.contains("logo") || classNames.contains("badge") || id.contains("avatar") || 
                                      id.contains("icon") || id.contains("ad") || src.contains("avatar") || src.contains("icon") || 
                                      src.contains("ad") || src.contains("logo") || src.contains("badge") || src.contains("placeholder") || 
                                      src.contains("loading");
                
                if (isIrrelevant) {
                    continue;
                }
                
                // 尝试不同的图片URL属性
                String imgUrl = src;
                if (imgUrl == null || imgUrl.isEmpty()) imgUrl = img.attr("data-src") != null ? img.attr("data-src") : "";
                if (imgUrl == null || imgUrl.isEmpty()) imgUrl = img.attr("data-original") != null ? img.attr("data-original") : "";
                if (imgUrl == null || imgUrl.isEmpty()) imgUrl = img.attr("data-img-url") != null ? img.attr("data-img-url") : "";
                if (imgUrl == null || imgUrl.isEmpty()) imgUrl = img.attr("data-lazy-src") != null ? img.attr("data-lazy-src") : "";
                if (imgUrl == null || imgUrl.isEmpty()) imgUrl = img.attr("data-lazyload-src") != null ? img.attr("data-lazyload-src") : "";
                if (imgUrl == null || imgUrl.isEmpty()) imgUrl = img.attr("data-real-src") != null ? img.attr("data-real-src") : "";
                if (imgUrl == null || imgUrl.isEmpty()) imgUrl = img.attr("data-actual-src") != null ? img.attr("data-actual-src") : "";
                
                if (imgUrl != null && !imgUrl.isEmpty() && imgUrl.startsWith("http") && !imageUrls.contains(imgUrl)) {
                    imageUrls.add(imgUrl);
                }
            }
            
            // 从meta标签提取封面图片
            Element ogImage = doc.select("meta[property='og:image']").first();
            if (ogImage != null) {
                String imgUrl = ogImage.attr("content");
                if (imgUrl != null && !imgUrl.isEmpty() && imgUrl.startsWith("http") && !imageUrls.contains(imgUrl)) {
                    imageUrls.add(imgUrl);
                }
            }
            
            // 从link标签提取预加载图片
            for (Element link : doc.select("link[rel='preload'][as='image']")) {
                String imgUrl = link.attr("href");
                if (imgUrl != null && !imgUrl.isEmpty() && imgUrl.startsWith("http") && !imageUrls.contains(imgUrl)) {
                    imageUrls.add(imgUrl);
                }
            }
            
            // 从脚本标签提取图片URL
            for (Element script : doc.select("script")) {
                String content = script.html();
                if (content != null && (content.contains("image") || content.contains("img"))) {
                    Pattern pattern = Pattern.compile("https?://.*?\\.(jpg|jpeg|png|gif|webp)", Pattern.CASE_INSENSITIVE);
                    Matcher matcher = pattern.matcher(content);
                    while (matcher.find()) {
                        String imgUrl = matcher.group(0);
                        if (imgUrl != null && !imgUrl.isEmpty() && !imageUrls.contains(imgUrl)) {
                            imageUrls.add(imgUrl);
                        }
                    }
                }
            }
        } catch (Exception e) {
            logger.error("从HTML提取图片URL失败: {}", e.getMessage(), e);
        }
        
        return imageUrls;
    }
    
    /**
     * 从JSON提取封面URL
     * @param contentData 内容数据
     * @param imageUrls 图片URL列表
     * @return 封面URL
     */
    private String extractCoverUrl(JSONObject contentData, List<String> imageUrls) {
        String coverUrl = null;
        
        try {
            if (contentData.containsKey("cover")) {
                JSONObject cover = contentData.getJSONObject("cover");
                coverUrl = cover.getString("url");
                if (coverUrl == null || coverUrl.isEmpty()) coverUrl = cover.getJSONObject("large") != null ? cover.getJSONObject("large").getString("url") : null;
                if (coverUrl == null || coverUrl.isEmpty()) coverUrl = cover.getJSONObject("middle") != null ? cover.getJSONObject("middle").getString("url") : null;
                if (coverUrl == null || coverUrl.isEmpty()) coverUrl = cover.getJSONObject("small") != null ? cover.getJSONObject("small").getString("url") : null;
                if (coverUrl == null || coverUrl.isEmpty()) coverUrl = cover.getString("origin_url");
            }
            
            if (coverUrl == null || coverUrl.isEmpty()) {
                coverUrl = contentData.getString("cover_url");
            }
            
            // 从图片列表中获取第一张图片作为封面
            if (coverUrl == null || coverUrl.isEmpty() && !imageUrls.isEmpty()) {
                coverUrl = imageUrls.get(0);
            }
        } catch (Exception e) {
            logger.error("提取封面URL失败: {}", e.getMessage(), e);
        }
        
        return coverUrl;
    }
    
    /**
     * 从HTML提取封面URL
     * @param doc HTML文档
     * @param imageUrls 图片URL列表
     * @return 封面URL
     */
    private String extractCoverUrlFromHtml(Document doc, List<String> imageUrls) {
        String coverUrl = null;
        
        try {
            // 从meta标签提取
            Element ogImage = doc.select("meta[property='og:image']").first();
            if (ogImage != null) {
                coverUrl = ogImage.attr("content");
            }
            
            // 从图片列表中获取第一张图片作为封面
            if (coverUrl == null || coverUrl.isEmpty() && !imageUrls.isEmpty()) {
                coverUrl = imageUrls.get(0);
            }
        } catch (Exception e) {
            logger.error("提取封面URL失败: {}", e.getMessage(), e);
        }
        
        return coverUrl;
    }
    
    /**
     * 验证并过滤URL
     * @param urls URL列表
     * @return 验证后的URL列表
     */
    private List<String> validateAndFilterUrls(List<String> urls) {
        List<String> validUrls = new ArrayList<>();
        
        for (String url : urls) {
            if (url != null && !url.isEmpty() && url.startsWith("http") && !validUrls.contains(url)) {
                validUrls.add(url);
            }
        }
        
        return validUrls;
    }
}