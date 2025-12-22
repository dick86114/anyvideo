package com.flower.parser.executor;

import okhttp3.*;
import java.io.IOException;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.util.ArrayList;
import java.util.Date;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Random;
import java.util.concurrent.TimeUnit;
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

public class WeiboExecutor {
	
	private static Logger logger = LoggerFactory.getLogger(WeiboExecutor.class);

    private static final String WEIBO_IMG_DOMAIN = "https://wx4.sinaimg.cn";
    
    private static final String HIGHEST_QUALITY_SUFFIX = "/mw2000";
    
    // 微博ID提取正则表达式
    private static final Pattern WEIBO_ID_PATTERN = Pattern.compile(
        "(?:https?://)?(?:www\\.)?(?:weibo\\.com|weibo\\.cn|m\\.weibo\\.cn)/(?:\\d{10}|status)/(\\w{9}|\\w{16})(?:/|\\?|#.*$|$)");
    
    private static String showDetail = "https://weibo.com/ajax/statuses/show";
    private static OkHttpClient client;
    static {
        client = new OkHttpClient.Builder()
                .connectTimeout(30, TimeUnit.SECONDS)
                .readTimeout(30, TimeUnit.SECONDS)
                .writeTimeout(30, TimeUnit.SECONDS)
                .build();
    }
    
    public void dataExecutor(String weibourl) throws IOException {
    	//校验参数
    	String weibocookie = Global.cookie_manage.getWeibocookie();
    	if(null== weibocookie || weibocookie.equals("")) {
     	logger.error("weibo cookie未设置  当前不执行解析");
     	return;
     }
     String weiboId = extractWeiboId(weibourl);
    	if(weiboId == null) {
     	logger.error("weibo url id 解析错误,请提交对应链接 到issues");
     	return;
     }
     
     // 生成设备指纹和签名
    	String deviceId = SecurityUtil.generateDeviceId();
    	String timestamp = SecurityUtil.generateTimestamp();
    	String signature = SecurityUtil.generateSign("/status/" + weiboId, new HashMap<>(), weibocookie, deviceId, timestamp);
     
    	HashMap<String, String> header = new HashMap<String, String>();
    	header.put("Referer", "https://weibo.com/");
    	header.put("User-Agent", SecurityUtil.getRandomUserAgent());
    	header.put("Accept", "application/json, text/plain, */*");
    	header.put("X-Requested-With", "XMLHttpRequest");
    	header.put("X-Timestamp", timestamp);
    	header.put("X-Device-ID", deviceId);
    	header.put("X-Signature", signature);
    	header.put("Cookie", weibocookie);
     
     // 尝试通过API获取微博详情
    	String fetchWeiboDetail = fetchWeiboDetail(weiboId);
     
    	if (fetchWeiboDetail == null || fetchWeiboDetail.isEmpty()) {
     	logger.warn("API请求失败，尝试使用HTML解析");
     	parseHtml(weibourl, weiboId, header);
     	return;
     }
     
    	JSONObject object = null;
    	try {
     	object = JSONObject.parseObject(fetchWeiboDetail);
     } catch (Exception e) {
     	logger.warn("JSON解析失败，尝试使用HTML解析");
     	parseHtml(weibourl, weiboId, header);
     	return;
     }
     
     // 检查API响应是否成功
    	if (object == null || object.getInteger("ok") != 1) {
     	logger.warn("API响应失败，尝试使用HTML解析");
     	parseHtml(weibourl, weiboId, header);
     	return;
     }
     
     // 提取内容
    	String title = object.getString("text");
    	String text_raw = object.getString("text_raw");
    	String username = object.getJSONObject("user").getString("screen_name");
    	MediaInfo mediaInfo = extractMediaInfo(object);
    	String videoUrl = mediaInfo.getVideoUrl();
    	List<String> imageUrls = mediaInfo.getImageUrls();
     
     // 如果API提取的媒体资源为空，尝试使用HTML解析
    	if ((videoUrl == null || videoUrl.isBlank()) 
     	        && (imageUrls == null || imageUrls.isEmpty())) {
     	logger.info("API未提取到媒体资源，尝试使用HTML解析");
     	parseHtml(weibourl, weiboId, header);
     	return;
     }
     
    	String filename = StringUtil.getFileName(text_raw, weiboId);
    	String markroute = FileUtil.generateDir(true, "weibo", filename, null, null, 0);
     
    	if(mediaInfo.isVideo()) {
     	//视频类型就一个文件
     	String storage = FileUtil.generateDir(true, "weibo", filename, null, null, 0);
     	HttpUtil.downloadFileWithOkHttp(videoUrl, filename + "-index-" + 0 + ".mp4", storage, header);
     	logger.info("微博视频下载完成: {}", videoUrl);
     } else {
     	for(int i = 0; i < imageUrls.size(); i++) {
      	String storage = FileUtil.generateDir(true, "weibo", filename, null, null, i);
      	HttpUtil.downloadFileWithOkHttp(imageUrls.get(i), filename + "-index-" + i + ".jpeg", storage, header);
      	logger.info("微博图片 {} 下载完成: {}", i, imageUrls.get(i));
      }
     }
     
    	logger.info("微博解析完成，共下载 {} 个文件", mediaInfo.hasMedia() ? (mediaInfo.isVideo() ? 1 : mediaInfo.getImageUrls().size()) : 0);
    }
    
    /**
     * 从HTML解析微博内容
     */
    private void parseHtml(String weibourl, String weiboId, Map<String, String> header) throws IOException {
    	logger.info("开始微博HTML解析");
     
    	// 获取页面HTML
    	String page = HttpUtil.getPage(weibourl, Global.cookie_manage.getWeibocookie(), "https://weibo.com/");
    	logger.info("成功获取微博HTML内容，长度: {}", page.length());
     
    	Document doc = Jsoup.parse(page);
     
    	// 提取内容
    	String text_raw = "微博内容";
    	if (doc.select(".WB_text").first() != null) {
        	text_raw = doc.select(".WB_text").first().text().trim();
    	}
    	String username = "微博用户";
    	if (doc.select(".WB_info .W_fb").first() != null) {
        	username = doc.select(".WB_info .W_fb").first().text().trim();
    	}
     
    	String filename = StringUtil.getFileName(text_raw, weiboId);
     
    	// 提取媒体资源
    	MediaInfo mediaInfo = extractMediaInfoFromHtml(doc, page);
    	String videoUrl = mediaInfo.getVideoUrl();
    	List<String> imageUrls = mediaInfo.getImageUrls();
     
    	if ((videoUrl == null || videoUrl.isBlank()) 
     	        && (imageUrls == null || imageUrls.isEmpty())) {
     	logger.info("HTML解析未找到媒体资源");
     	return;
     }
     
    	if(mediaInfo.isVideo()) {
     	//视频类型就一个文件
     	String storage = FileUtil.generateDir(true, "weibo", filename, null, null, 0);
     	HttpUtil.downloadFileWithOkHttp(videoUrl, filename + "-index-" + 0 + ".mp4", storage, header);
     	logger.info("微博视频下载完成: {}", videoUrl);
     } else {
     	for(int i = 0; i < imageUrls.size(); i++) {
      	String storage = FileUtil.generateDir(true, "weibo", filename, null, null, i);
      	HttpUtil.downloadFileWithOkHttp(imageUrls.get(i), filename + "-index-" + i + ".jpeg", storage, header);
      	logger.info("微博图片 {} 下载完成: {}", i, imageUrls.get(i));
      }
     }
     
    	logger.info("微博HTML解析完成，共下载 {} 个文件", mediaInfo.hasMedia() ? (mediaInfo.isVideo() ? 1 : mediaInfo.getImageUrls().size()) : 0);
    }
    
    /**
     * 从HTML提取媒体资源信息
     */
    private MediaInfo extractMediaInfoFromHtml(Document doc, String html) {
    	MediaInfo mediaInfo = new MediaInfo();
    	List<String> imageUrls = new ArrayList<>();
    	String videoUrl = null;
    	boolean isVideo = false;
     
    	// 提取视频URL
    	for (org.jsoup.nodes.Element video : doc.select("video")) {
     	videoUrl = video.attr("src");
     	if (videoUrl == null || videoUrl.isEmpty()) {
      	videoUrl = video.attr("data-src");
     	}
     	if (videoUrl != null && !videoUrl.isEmpty()) {
      	isVideo = true;
      	break;
      }
     }
     
    	// 从脚本中提取视频URL
    	if (videoUrl == null || videoUrl.isEmpty()) {
     	Pattern pattern = Pattern.compile("https?://.*?\\.(mp4|m3u8)");
     	Matcher matcher = pattern.matcher(html);
     	if (matcher.find()) {
      	videoUrl = matcher.group(0);
      	isVideo = true;
      }
     }
     
     // 提取图片URL
    	for (org.jsoup.nodes.Element img : doc.select(".WB_pic img")) {
     	String src = img.attr("src");
     	if (src != null && !src.isEmpty()) {
      	// 替换为高质量图片
      	String highQualityUrl = src.replace("thumbnail", "large");
      	imageUrls.add(highQualityUrl);
      }
     }
     
     // 从脚本中提取图片URL
    	if (imageUrls.isEmpty()) {
     	Pattern pattern = Pattern.compile("https?://wx[1-4]\\.sinaimg\\.cn/(large|mw2000)/.*?");
     	Matcher matcher = pattern.matcher(html);
     	while (matcher.find()) {
      	String imgUrl = matcher.group(0);
      	if (!imageUrls.contains(imgUrl)) {
       	imageUrls.add(imgUrl);
       }
      }
     }
     
     mediaInfo.setImageUrls(imageUrls);
     mediaInfo.setVideoUrl(videoUrl);
     mediaInfo.setVideo(isVideo);
     
    	return mediaInfo;
    }
    
    /**
     * 生成随机User-Agent
     */
    private String getRandomUserAgent() {
        String[] userAgents = {
            "Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.0 Mobile/15E148 Safari/604.1",
            "Mozilla/5.0 (iPad; CPU OS 15_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/15.5 Mobile/15E148 Safari/604.1",
            "Mozilla/5.0 (Android 12; Mobile; rv:109.0) Gecko/113.0 Firefox/113.0",
            "Mozilla/5.0 (Android 13; Mobile; rv:126.0) Gecko/126.0 Firefox/126.0",
            "Mozilla/5.0 (Linux; Android 14; SM-G991B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.6422.165 Mobile Safari/537.36"
        };
        return userAgents[new Random().nextInt(userAgents.length)];
    }
    
    /**
     * 生成设备ID
     */
    private String generateDeviceId() {
        String[] deviceIds = {
            "5c1a8d0e-7b2f-4a3d-8c9a-1b2c3d4e5f6a",
            "a1b2c3d4-e5f6-7g8h-9i0j-1k2l3m4n5o6p",
            "7f8e9d0c-6b5a-4d3c-2b1a-09876543210a",
            "3a4b5c6d-7e8f-9a0b-1c2d-3e4f5a6b7c8d",
            "9z8y7x6w-5v4u-3t2s-1r0q-9p8o7n6m5l4k"
        };
        return deviceIds[new Random().nextInt(deviceIds.length)];
    }
    
    /**
     * 生成签名
     */
    private String generateSign(String path, Map<String, String> params, String cookie, String deviceId, String timestamp) {
        try {
            // 组合签名字符串
            StringBuilder signStr = new StringBuilder();
            signStr.append(path).append("?");
            for (Map.Entry<String, String> entry : params.entrySet()) {
                signStr.append(entry.getKey()).append("=");
                signStr.append(entry.getValue()).append("&");
            }
            if (params.size() > 0) {
                signStr.deleteCharAt(signStr.length() - 1);
            }
            signStr.append("_")
                  .append(timestamp)
                  .append("_")
                  .append(deviceId)
                  .append("_")
                  .append(cookie);
            
            // 生成MD5哈希
            MessageDigest md = MessageDigest.getInstance("MD5");
            byte[] digest = md.digest(signStr.toString().getBytes());
            StringBuilder sb = new StringBuilder();
            for (byte b : digest) {
                sb.append(String.format("%02x", b));
            }
            return sb.toString();
        } catch (NoSuchAlgorithmException e) {
            logger.error("生成签名失败: {}", e.getMessage(), e);
            return "";
        }
    }
    
    public static String extractWeiboId(String url) {
        if (url == null || url.trim().isEmpty()) {
            return null;
        }
        
        Matcher matcher = WEIBO_ID_PATTERN.matcher(url);
        if (matcher.find()) {
            return matcher.group(1);
        }
        
        return null;
    }
    
    /**
     * 使用OkHttp和cookies发送微博详情请求
     * @param weiboId 微博ID
     * @return 微博详情JSON字符串，失败返回null
     */
    public String fetchWeiboDetail(String weiboId) {
        try {
            // 构建请求URL
            HttpUrl.Builder urlBuilder = HttpUrl.parse(showDetail).newBuilder();
            urlBuilder.addQueryParameter("id", weiboId);
            urlBuilder.addQueryParameter("locale", "zh-CN");
            String url = urlBuilder.build().toString();
            // 构建请求
            Request request = new Request.Builder()
                    .url(url)
                    .addHeader("Cookie", Global.cookie_manage.getWeibocookie())
                    .addHeader("User-Agent", "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/112.0.0.0 Safari/537.36")
                    .addHeader("Accept", "application/json, text/plain, */*")
                    .addHeader("Accept-Language", "zh-CN,zh;q=0.9,en;q=0.8")
                    .addHeader("Referer", "https://weibo.com/")
                    .addHeader("X-Requested-With", "XMLHttpRequest")
                    .get()
                    .build();
            
            // 执行请求
            try (Response response = client.newCall(request).execute()) {
                if (response.isSuccessful()) {
                    String responseBody = response.body().string();
                    return responseBody;
                } else {
                    System.err.println("请求失败，状态码: " + response.code());
                    System.err.println("错误信息: " + response.message());
                    if (response.body() != null) {
                        System.err.println("响应内容: " + response.body().string());
                    }
                    return null;
                }
            }
            
        } catch (IOException e) {
            System.err.println("网络请求异常: " + e.getMessage());
            e.printStackTrace();
            return null;
        } catch (Exception e) {
            System.err.println("请求微博详情时发生未知错误: " + e.getMessage());
            e.printStackTrace();
            return null;
        }
    }
    
    /**
     * 关闭HTTP客户端资源
     */
    public static void shutdown() {
        if (client != null) {
            client.dispatcher().executorService().shutdown();
            client.connectionPool().evictAll();
            System.out.println("HTTP客户端资源已释放");
        }
    }
    
    /**
     * 从微博详情JSON中提取媒体资源信息
     * @param weiboDetailJson 微博详情的JSON对象
     * @return 媒体资源信息对象
     */
    public static MediaInfo extractMediaInfo(JSONObject weiboDetailJson) {
        logger.info("开始提取微博媒体资源信息");
        
        MediaInfo mediaInfo = new MediaInfo();
        
        try {
            // 提取图片URL列表
            List<String> imageUrls = extractHighestQualityImages(weiboDetailJson);
            mediaInfo.setImageUrls(imageUrls);
            logger.info("成功提取图片数量: " + imageUrls.size());
            
            // 提取视频URL
            String videoUrl = extractHighestQualityVideo(weiboDetailJson);
            if (videoUrl != null && !videoUrl.isEmpty()) {
                mediaInfo.setVideoUrl(videoUrl);
                logger.info("成功提取视频URL: " + videoUrl);
            }
            
            // 判断是否为视频微博
            boolean isVideo = isVideoWeibo(weiboDetailJson);
            mediaInfo.setVideo(isVideo);
            
        } catch (Exception e) {
            logger.error("提取媒体资源时发生错误: " + e.getMessage());
            e.printStackTrace();
        }
        
        return mediaInfo;
    }
    
    /**
     * 提取最高清晰度的图片URL列表
     * @param weiboJson 微博JSON对象
     * @return 图片URL列表
     */
    private static List<String> extractHighestQualityImages(JSONObject weiboJson) {
        List<String> imageUrls = new ArrayList<>();
        try {
            JSONArray picIds = weiboJson.getJSONArray("pic_ids");
            if (picIds != null && picIds.size() > 0) {
                logger.info("发现图片ID数量: " + picIds.size());
                for (int i = 0; i < picIds.size(); i++) {
                    String picId = picIds.getString(i);
                    if (picId != null && !picId.trim().isEmpty()) {
                        // 构建最高清晰度图片URL
                        String imageUrl = buildHighestQualityImageUrl(picId);
                        imageUrls.add(imageUrl);
                        logger.info("构建图片URL: " + imageUrl);
                    }
                }
            }
        } catch (Exception e) {
            logger.error("提取图片URL时发生错误: " + e.getMessage());
        }
        return imageUrls;
    }
    
    /**
     * 构建最高清晰度图片URL
     * @param picId 图片ID
     * @return 完整的图片URL
     */
    private static String buildHighestQualityImageUrl(String picId) {
        // 根据微博API规则构建URL: 域名 + 清晰度后缀 + 图片ID
        return WEIBO_IMG_DOMAIN + HIGHEST_QUALITY_SUFFIX + "/" + picId;
    }
    
    /**
     * 提取最高清晰度的视频URL
     * @param weiboJson 微博JSON对象
     * @return 最高清晰度视频URL，如果没有视频则返回null
     */
    private static String extractHighestQualityVideo(JSONObject weiboJson) {
        try {
            if (!isVideoWeibo(weiboJson)) {
                return null;
            }
            JSONObject pageInfo = weiboJson.getJSONObject("page_info");
            if (pageInfo == null) {
                return null;
            }
            JSONObject mediaInfo = pageInfo.getJSONObject("media_info");
            if (mediaInfo == null) {
                return null;
            }
           
            JSONArray playbackList = mediaInfo.getJSONArray("playback_list");
            if (playbackList == null || playbackList.size() == 0) {
                return null;
            }
            String highestQualityUrl = null;
            int maxBitrate = 0;
            
            for (int i = 0; i < playbackList.size(); i++) {
                JSONObject playbackItem = playbackList.getJSONObject(i);
                if (playbackItem != null) {
                    JSONObject playInfo = playbackItem.getJSONObject("play_info");
                    if (playInfo != null) {
                        int bitrate = playInfo.getIntValue("bitrate");
                        String url = playInfo.getString("url");
                        if (url != null && bitrate > maxBitrate) {
                            maxBitrate = bitrate;
                            highestQualityUrl = url;
                        }
                    }
                }
            }
            if (highestQualityUrl != null) {
                logger.info("找到最高码率视频: " + maxBitrate + "kbps");
            }
            
            return highestQualityUrl;
            
        } catch (Exception e) {
            logger.error("提取视频URL时发生错误: " + e.getMessage());
            return null;
        }
    }
    
    /**
     * 判断是否为视频微博
     * @param weiboJson 微博JSON对象
     * @return 如果是视频微博返回true，否则返回false
     */
    private static boolean isVideoWeibo(JSONObject weiboJson) {
        try {
            JSONObject pageInfo = weiboJson.getJSONObject("page_info");
            if (pageInfo != null) {
                // 检查type字段，值为11表示视频 (对应Python中的 $.page_info.type)
                Object type = pageInfo.get("type");
                Object object_type = pageInfo.get("object_type");
                if(object_type != null) {
                 String objectTypeStr = object_type.toString();
                 return "video".equals(objectTypeStr);
                }
                if (type != null) {
                    String typeStr = type.toString();
                    return "11".equals(typeStr) || "5".equals(typeStr) ;
                }  
            }
        } catch (Exception e) {
            logger.error("判断视频类型时发生错误: " + e.getMessage());
        }
        return false;
    }
    
    /**
     * 媒体资源信息类
     */
    public static class MediaInfo {
        private List<String> imageUrls = new ArrayList<>();
        private String videoUrl;
        private boolean isVideo;
        
        public List<String> getImageUrls() {
            return imageUrls;
        }
        
        public void setImageUrls(List<String> imageUrls) {
            this.imageUrls = imageUrls != null ? imageUrls : new ArrayList<>();
        }
        
        public String getVideoUrl() {
            return videoUrl;
        }
        
        public void setVideoUrl(String videoUrl) {
            this.videoUrl = videoUrl;
        }
        
        public boolean isVideo() {
            return isVideo;
        }
        
        public void setVideo(boolean video) {
            isVideo = video;
        }
        
        /**
         * 获取所有媒体URL（图片+视频）
         * @return 所有媒体URL列表
         */
        public List<String> getAllMediaUrls() {
            List<String> allUrls = new ArrayList<>(imageUrls);
            if (videoUrl != null && !videoUrl.isEmpty()) {
                allUrls.add(videoUrl);
            }
            return allUrls;
        }
        
        /**
         * 检查是否包含媒体资源
         * @return 如果包含图片或视频返回true
         */
        public boolean hasMedia() {
            return (!imageUrls.isEmpty()) || (videoUrl != null && !videoUrl.isEmpty());
        }
        
        @Override
        public String toString() {
            return "MediaInfo{" +
                    "图片数量=" + imageUrls.size() +
                    ", 视频URL='" + videoUrl + "'" +
                    ", 是否为视频=" + isVideo +
                    '}';
        }
    }
    
    public static void main(String[] args) {
     WeiboExecutor executor = new WeiboExecutor();
     String result = executor.fetchWeiboDetail("O8DM0BLLm");
     JSONObject weiboJson = JSONObject.parseObject(result);
        MediaInfo mediaInfo = extractMediaInfo(weiboJson);
        System.out.println("提取结果: " + mediaInfo);
        System.out.println("图片URLs: " + mediaInfo.getImageUrls());
        System.out.println("视频URL: " + mediaInfo.getVideoUrl());
    }
}