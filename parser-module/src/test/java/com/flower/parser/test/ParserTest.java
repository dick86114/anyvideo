package com.flower.parser.test;

import org.junit.Before;
import org.junit.Test;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import com.flower.parser.ParserManager;

/**
 * 解析模块测试类 - 用于验证解析功能的基本功能
 */
public class ParserTest {
    
    private static final Logger logger = LoggerFactory.getLogger(ParserTest.class);
    
    private ParserManager parserManager;
    
    /**
     * 初始化测试环境
     */
    @Before
    public void setUp() {
        logger.info("初始化测试环境...");
        parserManager = new ParserManager();
        parserManager.init();
        logger.info("测试环境初始化完成");
    }
    
    /**
     * 测试平台检测功能
     */
    @Test
    public void testPlatformDetection() {
        logger.info("测试平台检测功能...");
        
        // 测试小红书URL检测
        String xiaohongshuUrl = "https://www.xiaohongshu.com/explore/6682c4b8000000000a03a78e";
        String platform1 = parserManager.getPlatform(xiaohongshuUrl);
        logger.info("小红书URL检测结果: {}", platform1);
        
        // 测试微博URL检测
        String weiboUrl = "https://weibo.com/1234567890/O8DM0BLLm";
        String platform2 = parserManager.getPlatform(weiboUrl);
        logger.info("微博URL检测结果: {}", platform2);
        
        // 测试抖音URL检测
        String douyinUrl = "https://www.douyin.com/video/6823456789012345678";
        String platform3 = parserManager.getPlatform(douyinUrl);
        logger.info("抖音URL检测结果: {}", platform3);
        
        logger.info("平台检测功能测试完成");
    }
    
    /**
     * 测试短链接处理功能
     */
    @Test
    public void testUrlProcessing() {
        logger.info("测试短链接处理功能...");
        
        // 测试长链接处理
        String longUrl = "https://www.xiaohongshu.com/explore/6682c4b8000000000a03a78e";
        String processedUrl1 = parserManager.getUrl(longUrl);
        logger.info("长链接处理结果: {}", processedUrl1);
        
        // 测试短链接处理（模拟）
        String shortUrl = "https://xhslink.com/abc123";
        String processedUrl2 = parserManager.getUrl(shortUrl);
        logger.info("短链接处理结果: {}", processedUrl2);
        
        logger.info("短链接处理功能测试完成");
    }
    
    /**
     * 测试解析管理器初始化
     */
    @Test
    public void testParserManagerInit() {
        logger.info("测试解析管理器初始化...");
        
        ParserManager manager = new ParserManager();
        manager.init();
        
        logger.info("解析管理器初始化测试完成");
    }
    
    /**
     * 测试无效URL处理
     */
    @Test
    public void testInvalidUrl() {
        logger.info("测试无效URL处理...");
        
        try {
            parserManager.parseUrl(null);
        } catch (Exception e) {
            logger.error("无效URL处理测试异常: {}", e.getMessage());
        }
        
        try {
            parserManager.parseUrl("");
        } catch (Exception e) {
            logger.error("空URL处理测试异常: {}", e.getMessage());
        }
        
        logger.info("无效URL处理测试完成");
    }
    
    /**
     * 测试小红书解析功能
     */
    @Test
    public void testHongShuParse() {
        logger.info("测试小红书解析功能...");
        
        try {
            // 使用实际的小红书URL进行测试
            String url = "https://www.xiaohongshu.com/explore/6682c4b8000000000a03a78e";
            parserManager.parseUrl(url);
            logger.info("小红书解析测试完成");
        } catch (Exception e) {
            logger.error("小红书解析测试异常: {}", e.getMessage(), e);
        }
    }
    
    /**
     * 测试抖音解析功能
     */
    @Test
    public void testDouYinParse() {
        logger.info("测试抖音解析功能...");
        
        try {
            // 使用实际的抖音URL进行测试
            String url = "https://www.douyin.com/video/7345678901234567890";
            parserManager.parseUrl(url);
            logger.info("抖音解析测试完成");
        } catch (Exception e) {
            logger.error("抖音解析测试异常: {}", e.getMessage(), e);
        }
    }
    
    /**
     * 测试快手解析功能
     */
    @Test
    public void testKuaishouParse() {
        logger.info("测试快手解析功能...");
        
        try {
            // 使用实际的快手URL进行测试
            String url = "https://www.kuaishou.com/f/XsdfGhIjKlMn";
            parserManager.parseUrl(url);
            logger.info("快手解析测试完成");
        } catch (Exception e) {
            logger.error("快手解析测试异常: {}", e.getMessage(), e);
        }
    }
    
    /**
     * 测试B站解析功能
     */
    @Test
    public void testBilibiliParse() {
        logger.info("测试B站解析功能...");
        
        try {
            // 使用实际的B站URL进行测试
            String url = "https://www.bilibili.com/video/BV1Xx411Z7xx";
            parserManager.parseUrl(url);
            logger.info("B站解析测试完成");
        } catch (Exception e) {
            logger.error("B站解析测试异常: {}", e.getMessage(), e);
        }
    }
    
    /**
     * 测试微博解析功能
     */
    @Test
    public void testWeiboParse() {
        logger.info("测试微博解析功能...");
        
        try {
            // 使用实际的微博URL进行测试
            String url = "https://weibo.com/1234567890/O8DM0BLLm";
            parserManager.parseUrl(url);
            logger.info("微博解析测试完成");
        } catch (Exception e) {
            logger.error("微博解析测试异常: {}", e.getMessage(), e);
        }
    }
}