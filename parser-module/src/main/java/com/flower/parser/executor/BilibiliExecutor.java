package com.flower.parser.executor;

import java.io.IOException;
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
 * B站解析器 - 用于提取B站视频和图文内容
 */
public class BilibiliExecutor {
    
    private static Logger logger = LoggerFactory.getLogger(BilibiliExecutor.class);
    
    /**
     * 解析B站内容
     * @param url B站URL
     * @throws IOException 可能的IO异常
     */
    public void dataExecutor(String url) throws IOException {
        logger.info("开始处理B站URL: {}", url);
        
        // 提取B站BV号或AV号
        String bvid = extractBvid(url);
        if (bvid == null) {
            logger.error("B站URL解析错误");
            return;
        }
        
        // 生成设备指纹和签名
        String deviceId = SecurityUtil.generateDeviceId();
        String timestamp = SecurityUtil.generateTimestamp();
        String signature = SecurityUtil.generateSign("/video/" + bvid, new HashMap<>(), "", deviceId, timestamp);
        
        // 准备请求头
        HashMap<String, String> header = new HashMap<>();
        header.put("Referer", "https://www.bilibili.com/");
        header.put("User-Agent", SecurityUtil.getRandomUserAgent());
        header.put("Accept", "application/json, text/plain, */*");
        header.put("X-Timestamp", timestamp);
        header.put("X-Device-ID", deviceId);
        header.put("X-Signature", signature);
        
        // 获取页面内容
        String page = HttpUtil.getPage(url, null, "https://www.bilibili.com/");
        logger.info("成功获取B站页面内容，长度: {}", page.length());
        
        // 提取JSON数据
        String jsonFromHtml = extractJsonString(page);
        logger.info("提取JSON字符串，长度: {}", jsonFromHtml != null ? jsonFromHtml.length() : "null");
        
        JSONObject json = null;
        if (jsonFromHtml != null) {
            json = JSONObject.parseObject(jsonFromHtml);
            logger.info("成功解析JSON对象");
        } else {
            logger.warn("未提取到JSON数据，使用HTML解析");
            parseHtml(url, bvid, header);
            return;
        }
        
        // 查找内容数据
        JSONObject contentData = findContentData(json);
        if (contentData == null) {
            logger.warn("未找到有效的内容数据，使用HTML解析");
            parseHtml(url, bvid, header);
            return;
        }
        
        // 提取基本信息
        String title = extractTitle(contentData);
        String desc = extractDescription(contentData);
        String author = extractAuthor(contentData);
        String filename = StringUtil.getFileName(title, bvid);
        
        // B站主要是视频内容，这里直接处理视频
        String videoUrl = extractVideoUrl(contentData);
        String coverUrl = extractCoverUrl(contentData);
        
        if (videoUrl != null && !videoUrl.isEmpty()) {
            // 视频处理
            String storage = FileUtil.generateDir(true, "bilibili", filename, null, null, 0);
            HttpUtil.downloadFileWithOkHttp(videoUrl, filename + ".mp4", storage, header);
            logger.info("B站视频下载完成: {}", videoUrl);
            
            // 下载封面
            if (coverUrl != null && !coverUrl.isEmpty()) {
                String coverStorage = FileUtil.generateDir(true, "bilibili", filename, null, null, 0);
                HttpUtil.downloadFileWithOkHttp(coverUrl, filename + "_cover.jpg", coverStorage, header);
                logger.info("B站视频封面下载完成: {}", coverUrl);
            }
        } else {
            logger.info("未找到有效的视频URL");
        }
        
        logger.info("B站解析完成");
    }
    
    /**
     * 从URL提取B站BV号
     */
    private String extractBvid(String url) {
        // 匹配BV号
        Pattern pattern = Pattern.compile("BV[0-9A-Za-z]+");
        Matcher matcher = pattern.matcher(url);
        if (matcher.find()) {
            return matcher.group(0);
        }
        
        // 匹配AV号
        pattern = Pattern.compile("av(\\d+)");
        matcher = pattern.matcher(url);
        if (matcher.find()) {
            return matcher.group(0);
        }
        
        return null;
    }
    
    /**
     * 从HTML解析内容
     */
    private void parseHtml(String url, String bvid, Map<String, String> header) throws IOException {
        logger.info("开始B站HTML解析");
        
        // 获取页面内容
        String page = HttpUtil.getPage(url, null, "https://www.bilibili.com/");
        Document doc = Jsoup.parse(page);
        
        // 提取标题
        String title = doc.select("title").text().trim();
        if (title == null || title.isEmpty()) {
            title = "B站内容";
        }
        
        String filename = StringUtil.getFileName(title, bvid);
        
        // 提取视频URL
        String videoUrl = extractVideoUrlFromHtml(doc, page);
        if (videoUrl != null && !videoUrl.isEmpty()) {
            String storage = FileUtil.generateDir(true, "bilibili", filename, null, null, 0);
            HttpUtil.downloadFileWithOkHttp(videoUrl, filename + ".mp4", storage, header);
            logger.info("B站视频下载完成: {}", videoUrl);
        } else {
            logger.info("HTML解析未找到视频URL");
        }
        
        logger.info("B站HTML解析完成");
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
            Pattern pattern = Pattern.compile("https?://.*?\\.(mp4|flv|m3u8)");
            Matcher matcher = pattern.matcher(html);
            if (matcher.find()) {
                videoUrl = matcher.group(0);
            }
        }
        
        return videoUrl;
    }
    
    /**
     * 从HTML内容中提取JSON字符串
     */
    private String extractJsonString(String htmlContent) {
        // B站的JSON数据模式
        String[] regexPatterns = {
            "window\\.__INITIAL_STATE__\\s*=\\s*(\\{[\\s\\S]*?\\});\\s*</script>",
            "window\\.__INITIAL_DATA__\\s*=\\s*(\\{[\\s\\S]*?\\});",
            "window\\.__PLAYLIST__\\s*=\\s*(\\{[\\s\\S]*?\\});",
            "window\\.__NEPTUNE_IS_MY_WAIFU__\\s*=\\s*(\\{[\\s\\S]*?\\});"
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
            "videoData",
            "playinfo",
            "data",
            "state.videoData",
            "props.pageProps.videoData",
            "__NEXT_DATA__.props.pageProps.videoData"
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
        String title = contentData.getString("title");
        if (title == null || title.isEmpty()) {
            title = contentData.getString("short_title");
        }
        if (title == null || title.isEmpty()) {
            title = "B站内容";
        }
        return title;
    }
    
    /**
     * 提取描述
     */
    private String extractDescription(JSONObject contentData) {
        String desc = contentData.getString("desc");
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
        if (contentData.containsKey("owner")) {
            JSONObject owner = contentData.getJSONObject("owner");
            author = owner.getString("name");
        }
        if (author == null || author.isEmpty()) {
            author = "B站UP主";
        }
        return author;
    }
    
    /**
     * 提取视频URL
     */
    private String extractVideoUrl(JSONObject contentData) {
        String videoUrl = null;
        
        // 尝试从dash字段提取
        if (contentData.containsKey("dash")) {
            JSONObject dash = contentData.getJSONObject("dash");
            JSONArray videoList = dash.getJSONArray("video");
            if (videoList != null && videoList.size() > 0) {
                JSONObject video = videoList.getJSONObject(0);
                videoUrl = video.getString("baseUrl");
            }
        }
        
        // 尝试从durl字段提取
        if (videoUrl == null && contentData.containsKey("durl")) {
            JSONArray durlList = contentData.getJSONArray("durl");
            if (durlList != null && durlList.size() > 0) {
                JSONObject durl = durlList.getJSONObject(0);
                videoUrl = durl.getString("url");
            }
        }
        
        return videoUrl;
    }
    
    /**
     * 提取封面URL
     */
    private String extractCoverUrl(JSONObject contentData) {
        String coverUrl = contentData.getString("pic");
        if (coverUrl == null || coverUrl.isEmpty()) {
            coverUrl = contentData.getString("cover");
        }
        return coverUrl;
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