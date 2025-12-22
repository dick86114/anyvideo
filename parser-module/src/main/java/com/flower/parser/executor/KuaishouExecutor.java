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
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import com.alibaba.fastjson2.JSONArray;
import com.alibaba.fastjson2.JSONObject;
import com.flower.parser.config.Global;
import com.flower.parser.utils.FileUtil;
import com.flower.parser.utils.HttpUtil;
import com.flower.parser.utils.SecurityUtil;
import com.flower.parser.utils.StringUtil;

/**
 * 快手解析器 - 用于提取快手视频和图文内容
 */
public class KuaishouExecutor {
    
    private static Logger logger = LoggerFactory.getLogger(KuaishouExecutor.class);
    
    /**
     * 解析快手内容
     * @param url 快手URL
     * @throws IOException 可能的IO异常
     */
    public void dataExecutor(String url) throws IOException {
        logger.info("开始处理快手URL: {}", url);
        
        // 提取快手ID
        String kuaishouId = extractKuaishouId(url);
        if (kuaishouId == null) {
            logger.error("快手URL ID解析错误");
            return;
        }
        
        // 生成设备指纹和签名
        String deviceId = SecurityUtil.generateDeviceId();
        String timestamp = SecurityUtil.generateTimestamp();
        String signature = SecurityUtil.generateSign("/short-video/" + kuaishouId, new HashMap<>(), "", deviceId, timestamp);
        
        // 准备请求头
        HashMap<String, String> header = new HashMap<>();
        header.put("Referer", "https://www.kuaishou.com/");
        header.put("User-Agent", SecurityUtil.getRandomUserAgent());
        header.put("Accept", "application/json, text/plain, */*");
        header.put("X-Timestamp", timestamp);
        header.put("X-Device-ID", deviceId);
        header.put("X-Signature", signature);
        
        // 获取页面内容
        String page = HttpUtil.getPage(url, null, "https://www.kuaishou.com/");
        logger.info("成功获取快手页面内容，长度: {}", page.length());
        
        // 提取JSON数据
        String jsonFromHtml = extractJsonString(page);
        logger.info("提取JSON字符串，长度: {}", jsonFromHtml != null ? jsonFromHtml.length() : "null");
        
        JSONObject json = null;
        if (jsonFromHtml != null) {
            json = JSONObject.parseObject(jsonFromHtml);
            logger.info("成功解析JSON对象");
        } else {
            logger.warn("未提取到JSON数据，使用HTML解析");
            parseHtml(url, kuaishouId, header);
            return;
        }
        
        // 查找内容数据
        JSONObject contentData = findContentData(json);
        if (contentData == null) {
            logger.warn("未找到有效的内容数据，使用HTML解析");
            parseHtml(url, kuaishouId, header);
            return;
        }
        
        // 提取基本信息
        String title = extractTitle(contentData);
        String desc = extractDescription(contentData);
        String author = extractAuthor(contentData);
        String filename = StringUtil.getFileName(title, kuaishouId);
        
        // 判断内容类型
        boolean isVideo = isVideoContent(contentData);
        logger.info("内容类型: {}", isVideo ? "视频" : "图文");
        
        // 提取媒体资源
        String videoUrl = isVideo ? extractVideoUrl(contentData) : null;
        List<String> imageUrls = extractImageUrls(contentData);
        
        // 处理内容
        if (isVideo && videoUrl != null && !videoUrl.isEmpty()) {
            // 视频处理
            String storage = FileUtil.generateDir(true, "kuaishou", filename, null, null, 0);
            HttpUtil.downloadFileWithOkHttp(videoUrl, filename + ".mp4", storage, header);
            logger.info("快手视频下载完成: {}", videoUrl);
        } else if (!imageUrls.isEmpty()) {
            // 图文处理
            for (int i = 0; i < imageUrls.size(); i++) {
                String storage = FileUtil.generateDir(true, "kuaishou", filename, null, null, i);
                HttpUtil.downloadFileWithOkHttp(imageUrls.get(i), filename + "-index-" + i + ".jpeg", storage, header);
                logger.info("快手图片 {} 下载完成: {}", i, imageUrls.get(i));
            }
        } else {
            logger.info("未找到有效的媒体资源");
        }
        
        logger.info("快手解析完成");
    }
    
    /**
     * 从URL提取快手ID
     */
    private String extractKuaishouId(String url) {
        Pattern pattern = Pattern.compile("(?:short-video|photo)/(\\w+)");
        Matcher matcher = pattern.matcher(url);
        if (matcher.find()) {
            return matcher.group(1);
        }
        return null;
    }
    
    /**
     * 从HTML解析内容
     */
    private void parseHtml(String url, String kuaishouId, Map<String, String> header) throws IOException {
        logger.info("开始快手HTML解析");
        
        // 获取页面内容
        String page = HttpUtil.getPage(url, null, "https://www.kuaishou.com/");
        Document doc = Jsoup.parse(page);
        
        // 提取标题和描述
        String title = doc.select("title").text().trim();
        if (title == null || title.isEmpty()) {
            title = "快手内容";
        }
        String desc = doc.select(".description").text().trim();
        if (desc == null || desc.isEmpty()) {
            desc = "";
        }
        String author = doc.select(".profile-name").text().trim();
        if (author == null || author.isEmpty()) {
            author = "快手用户";
        }
        
        String filename = StringUtil.getFileName(title, kuaishouId);
        
        // 检测是否为视频
        boolean isVideo = isVideoFromHtml(doc, page);
        logger.info("HTML检测视频: {}", isVideo);
        
        // 提取媒体资源
        if (isVideo) {
            // 提取视频URL
            String videoUrl = extractVideoUrlFromHtml(doc, page);
            if (videoUrl != null && !videoUrl.isEmpty()) {
                String storage = FileUtil.generateDir(true, "kuaishou", filename, null, null, 0);
                HttpUtil.downloadFileWithOkHttp(videoUrl, filename + ".mp4", storage, header);
                logger.info("快手视频下载完成: {}", videoUrl);
            } else {
                logger.info("HTML解析未找到视频URL");
            }
        } else {
            // 提取图片URL
            List<String> imageUrls = extractImageUrlsFromHtml(doc, page);
            if (!imageUrls.isEmpty()) {
                for (int i = 0; i < imageUrls.size(); i++) {
                    String storage = FileUtil.generateDir(true, "kuaishou", filename, null, null, i);
                    HttpUtil.downloadFileWithOkHttp(imageUrls.get(i), filename + "-index-" + i + ".jpeg", storage, header);
                    logger.info("快手图片 {} 下载完成: {}", i, imageUrls.get(i));
                }
            } else {
                logger.info("HTML解析未找到图片URL");
            }
        }
        
        logger.info("快手HTML解析完成");
    }
    
    /**
     * 从HTML检测视频
     */
    private boolean isVideoFromHtml(Document doc, String html) {
        boolean hasVideoTag = doc.select("video").size() > 0;
        boolean hasVideoClass = doc.select(".video").size() > 0;
        boolean hasVideoUrl = html.contains(".mp4") || html.contains(".m3u8");
        
        return hasVideoTag || (hasVideoClass && hasVideoUrl);
    }
    
    /**
     * 从HTML提取视频URL
     */
    private String extractVideoUrlFromHtml(Document doc, String html) {
        // 从video标签提取
        String videoUrl = doc.select("video").attr("src");
        if (videoUrl == null || videoUrl.isEmpty()) {
            videoUrl = doc.select("video").attr("data-src");
        }
        
        // 从脚本中提取
        if (videoUrl == null || videoUrl.isEmpty()) {
            Pattern pattern = Pattern.compile("https?://.*?\\.(mp4|m3u8)");
            Matcher matcher = pattern.matcher(html);
            if (matcher.find()) {
                videoUrl = matcher.group(0);
            }
        }
        
        return videoUrl;
    }
    
    /**
     * 从HTML提取图片URL
     */
    private List<String> extractImageUrlsFromHtml(Document doc, String html) {
        List<String> imageUrls = new ArrayList<>();
        
        // 从img标签提取
        doc.select("img").forEach(img -> {
            String src = img.attr("src");
            if (src != null && !src.isEmpty() && src.startsWith("http")) {
                imageUrls.add(src);
            }
        });
        
        return imageUrls;
    }
    
    /**
     * 从HTML内容中提取JSON字符串
     */
    private String extractJsonString(String htmlContent) {
        // 快手的JSON数据模式
        String[] regexPatterns = {
            "window\\.__INITIAL_STATE__\\s*=\\s*(\\{[\\s\\S]*?\\});\\s*</script>",
            "window\\.__INITIAL_DATA__\\s*=\\s*(\\{[\\s\\S]*?\\});",
            "window\\.initialData\\s*=\\s*(\\{[\\s\\S]*?\\});"
        };
        
        for (String patternStr : regexPatterns) {
            Pattern pattern = Pattern.compile(patternStr, Pattern.DOTALL);
            Matcher matcher = pattern.matcher(htmlContent);
            
            if (matcher.find()) {
                String jsonString = matcher.group(1).trim();
                if (jsonString.endsWith(";")) {
                    jsonString = jsonString.substring(0, jsonString.length() - 1);
                }
                return jsonString;
            }
        }
        
        return null;
    }
    
    /**
     * 从JSON中查找内容数据
     */
    private JSONObject findContentData(JSONObject json) {
        JSONObject contentData = null;
        
        // 支持多种数据结构路径
        String[] paths = {
            "photo",
            "video",
            "data.photo",
            "data.video",
            "state.photo",
            "state.video",
            "props.pageProps.photo",
            "props.pageProps.video"
        };
        
        for (String path : paths) {
            contentData = getValueByPath(json, path);
            if (contentData != null) {
                logger.info("从路径 {} 找到内容数据", path);
                break;
            }
        }
        
        return contentData;
    }
    
    /**
     * 提取标题
     */
    private String extractTitle(JSONObject contentData) {
        String title = contentData.getString("caption");
        if (title == null || title.isEmpty()) {
            title = contentData.getString("title");
        }
        if (title == null || title.isEmpty()) {
            title = "快手内容";
        }
        return title;
    }
    
    /**
     * 提取描述
     */
    private String extractDescription(JSONObject contentData) {
        String desc = contentData.getString("caption");
        if (desc == null || desc.isEmpty()) {
            desc = contentData.getString("description");
        }
        if (desc == null || desc.isEmpty()) {
            desc = "";
        }
        return desc;
    }
    
    /**
     * 提取作者
     */
    private String extractAuthor(JSONObject contentData) {
        String author = null;
        if (contentData.containsKey("user")) {
            JSONObject user = contentData.getJSONObject("user");
            author = user.getString("name");
            if (author == null || author.isEmpty()) {
                author = user.getString("nickname");
            }
        }
        if (author == null || author.isEmpty()) {
            author = "快手作者";
        }
        return author;
    }
    
    /**
     * 判断是否为视频内容
     */
    private boolean isVideoContent(JSONObject contentData) {
        return contentData.containsKey("video") || 
               "video".equals(contentData.getString("type")) ||
               contentData.containsKey("playUrl");
    }
    
    /**
     * 提取视频URL
     */
    private String extractVideoUrl(JSONObject contentData) {
        String videoUrl = null;
        
        // 尝试从video字段提取
        if (contentData.containsKey("video")) {
            JSONObject video = contentData.getJSONObject("video");
            videoUrl = video.getString("playUrl");
            if (videoUrl == null || videoUrl.isEmpty()) {
                videoUrl = video.getString("url");
            }
        }
        
        // 尝试直接从contentData提取
        if (videoUrl == null || videoUrl.isEmpty()) {
            videoUrl = contentData.getString("playUrl");
        }
        if (videoUrl == null || videoUrl.isEmpty()) {
            videoUrl = contentData.getString("url");
        }
        
        return videoUrl;
    }
    
    /**
     * 提取图片URL列表
     */
    private List<String> extractImageUrls(JSONObject contentData) {
        List<String> imageUrls = new ArrayList<>();
        
        // 尝试从imageList提取
        JSONArray imageList = contentData.getJSONArray("imageList");
        if (imageList != null) {
            for (int i = 0; i < imageList.size(); i++) {
                JSONObject image = imageList.getJSONObject(i);
                String url = image.getString("url");
                if (url != null && !url.isEmpty()) {
                    imageUrls.add(url);
                }
            }
        }
        
        // 尝试从images提取
        if (imageUrls.isEmpty()) {
            JSONArray images = contentData.getJSONArray("images");
            if (images != null) {
                for (int i = 0; i < images.size(); i++) {
                    JSONObject image = images.getJSONObject(i);
                    String url = image.getString("url");
                    if (url != null && !url.isEmpty()) {
                        imageUrls.add(url);
                    }
                }
            }
        }
        
        return imageUrls;
    }
    
    /**
     * 获取指定路径的JSON值
     */
    private JSONObject getValueByPath(JSONObject jsonObject, String path) {
        if (jsonObject == null || path == null || path.isEmpty()) {
            return null;
        }
        
        String[] keys = path.split("\\.");
        Object current = jsonObject;
        
        for (String key : keys) {
            if (current instanceof JSONObject) {
                current = ((JSONObject) current).get(key);
            } else if (current instanceof JSONArray && key.matches("\\d+")) {
                int index = Integer.parseInt(key);
                JSONArray array = (JSONArray) current;
                if (index >= 0 && index < array.size()) {
                    current = array.get(index);
                } else {
                    return null;
                }
            } else {
                return null;
            }
        }
        
        return current instanceof JSONObject ? (JSONObject) current : null;
    }
}