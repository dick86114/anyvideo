package com.flower.parser;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import com.flower.parser.config.Global;
import com.flower.parser.executor.BilibiliExecutor;
import com.flower.parser.executor.DouYinExecutor;
import com.flower.parser.executor.HongShuExecutor;
import com.flower.parser.executor.KuaishouExecutor;
import com.flower.parser.executor.WeiboExecutor;
import com.flower.parser.utils.HttpUtil;
import com.flower.parser.utils.StringUtil;

/**
 * 解析管理器 - 作为解析功能的统一入口，协调不同平台的解析活动
 */
public class ParserManager {
    
    private static final Logger logger = LoggerFactory.getLogger(ParserManager.class);
    
    private HongShuExecutor hongShuExecutor;
    private WeiboExecutor weiBoExecutor;
    private DouYinExecutor douYinExecutor;
    private KuaishouExecutor kuaishouExecutor;
    private BilibiliExecutor bilibiliExecutor;
    
    /**
     * 初始化解析管理器
     */
    public void init() {
        logger.info("初始化解析管理器...");
        // 初始化各个平台的解析器
        this.hongShuExecutor = new HongShuExecutor();
        this.weiBoExecutor = new WeiboExecutor();
        this.douYinExecutor = new DouYinExecutor();
        this.kuaishouExecutor = new KuaishouExecutor();
        this.bilibiliExecutor = new BilibiliExecutor();
        logger.info("解析管理器初始化完成");
    }
    
    /**
     * 解析URL
     * @param url 要解析的URL
     * @throws Exception 可能的异常
     */
    public void parseUrl(String url) throws Exception {
        if (StringUtil.isBlank(url)) {
            logger.error("无效的URL: 未提供URL");
            return;
        }
        logger.info("解析开始~原地址: {}", url);
        
        String platform = getPlatform(url);
        String processedUrl = getUrl(url);
        
        // 平台解析器映射
        switch (platform) {
            case "小红书":
                logger.info("检测到小红书平台，开始解析");
                hongShuExecutor.dataExecutor(platform, processedUrl);
                break;
            case "微博":
                logger.info("检测到微博平台，开始解析");
                weiBoExecutor.dataExecutor(processedUrl);
                break;
            case "抖音":
                logger.info("检测到抖音平台，开始解析");
                // 抖音解析需要提取帖子ID
                String postId = extractDouYinPostId(processedUrl);
                if (postId != null) {
                    douYinExecutor.ImageTextExecutor(processedUrl, postId);
                } else {
                    logger.error("无法从抖音URL中提取帖子ID: {}", processedUrl);
                }
                break;
            case "快手":
                logger.info("检测到快手平台，开始解析");
                kuaishouExecutor.dataExecutor(processedUrl);
                break;
            case "B站":
                logger.info("检测到B站平台，开始解析");
                bilibiliExecutor.dataExecutor(processedUrl);
                break;
            default:
                logger.error("不支持的平台: {}", platform);
                break;
        }
        
        logger.info("解析结束~");
    }
    
    /**
     * 检测平台类型
     * @param url 要检测的URL
     * @return 平台名称
     */
    public String getPlatform(String url) {
        if (url.contains("xiaohongshu.com") || url.contains("xhslink.com")) {
            return "小红书";
        } else if (url.contains("weibo.com") || url.contains("weibo.cn")) {
            return "微博";
        } else if (url.contains("douyin.com") || url.contains("tiktok.com")) {
            return "抖音";
        } else if (url.contains("kuaishou.com")) {
            return "快手";
        } else if (url.contains("bilibili.com") || url.contains("b23.tv")) {
            return "B站";
        } else {
            return "未知平台";
        }
    }
    
    /**
     * 提取URL，处理短链接
     * @param url 原始URL
     * @return 处理后的URL
     */
    public String getUrl(String url) {
        return HttpUtil.getRealUrl(url);
    }
    
    /**
     * 从抖音URL中提取帖子ID
     * @param url 抖音URL
     * @return 帖子ID
     */
    private String extractDouYinPostId(String url) {
        // 抖音URL格式示例：https://www.douyin.com/video/6823456789012345678
        try {
            int videoIndex = url.indexOf("/video/");
            if (videoIndex != -1) {
                String postId = url.substring(videoIndex + "/video/".length());
                // 移除可能的查询参数
                if (postId.contains("?")) {
                    postId = postId.substring(0, postId.indexOf("?"));
                }
                return postId;
            }
        } catch (Exception e) {
            logger.error("提取抖音帖子ID失败: {}", e.getMessage());
        }
        return null;
    }
    
    /**
     * 主方法，用于测试解析功能
     * @param args 命令行参数
     */
    public static void main(String[] args) {
        ParserManager manager = new ParserManager();
        manager.init();
        
        try {
            // 测试小红书解析
            manager.parseUrl("https://www.xiaohongshu.com/explore/6682c4b8000000000a03a78e");
            
            // 测试微博解析
            // manager.parseUrl("https://weibo.com/1234567890/O8DM0BLLm");
            
            // 测试抖音解析
            // manager.parseUrl("https://www.douyin.com/video/7345678901234567890");
            
            // 测试快手解析
            // manager.parseUrl("https://www.kuaishou.com/f/XsdfGhIjKlMn");
            
            // 测试B站解析
            // manager.parseUrl("https://www.bilibili.com/video/BV1Xx411Z7xx");
            
            logger.info("测试完成");
        } catch (Exception e) {
            logger.error("测试失败: {}", e.getMessage(), e);
        }
    }
}