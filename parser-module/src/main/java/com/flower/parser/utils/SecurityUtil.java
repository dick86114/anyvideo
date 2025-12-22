package com.flower.parser.utils;

import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.util.Map;
import java.util.Random;
import java.util.StringJoiner;

/**
 * 安全工具类 - 用于处理设备指纹生成、签名生成、MD5哈希计算等安全相关操作
 */
public class SecurityUtil {
    
    // User-Agent池
    private static final String[] USER_AGENTS = {
        "Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.0 Mobile/15E148 Safari/604.1",
        "Mozilla/5.0 (iPad; CPU OS 15_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/15.5 Mobile/15E148 Safari/604.1",
        "Mozilla/5.0 (Android 12; Mobile; rv:109.0) Gecko/113.0 Firefox/113.0",
        "Mozilla/5.0 (Android 13; Mobile; rv:126.0) Gecko/126.0 Firefox/126.0",
        "Mozilla/5.0 (Linux; Android 14; SM-G991B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.6422.165 Mobile Safari/537.36"
    };
    
    // 设备ID池
    private static final String[] DEVICE_IDS = {
        "5c1a8d0e-7b2f-4a3d-8c9a-1b2c3d4e5f6a",
        "a1b2c3d4-e5f6-7g8h-9i0j-1k2l3m4n5o6p",
        "7f8e9d0c-6b5a-4d3c-2b1a-09876543210a",
        "3a4b5c6d-7e8f-9a0b-1c2d-3e4f5a6b7c8d",
        "9z8y7x6w-5v4u-3t2s-1r0q-9p8o7n6m5l4k",
        "b9a8b7c6-d5e4-f3g2-h1i0-j9k8l7m6n5o4",
        "c3d2e1f0-a9b8-c7d6-e5f4-g3h2i1j0k9l8",
        "d7e6f5a4-b3c2-d1e0-f9g8-h7i6j5k4l3m2",
        "e5f4g3h2-i1j0-k9l8-m7n6-o5p4q3r2s1t0",
        "f1e2d3c4-b5a6-7f8e-9d0c-6b5a4d3c2b1a"
    };
    
    // 随机数生成器
    private static final Random RANDOM = new Random();
    
    /**
     * 生成随机User-Agent
     * @return 随机User-Agent字符串
     */
    public static String getRandomUserAgent() {
        return USER_AGENTS[RANDOM.nextInt(USER_AGENTS.length)];
    }
    
    /**
     * 生成设备ID
     * @return 生成的设备ID
     */
    public static String generateDeviceId() {
        // 50%概率从设备ID池获取，50%概率生成新UUID
        if (RANDOM.nextBoolean()) {
            return DEVICE_IDS[RANDOM.nextInt(DEVICE_IDS.length)];
        } else {
            return generateUUID();
        }
    }
    
    /**
     * 生成随机设备ID
     * @return 随机生成的设备ID
     */
    public static String generateRandomDeviceId() {
        StringBuilder sb = new StringBuilder();
        String chars = "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";
        for (int i = 0; i < 36; i++) {
            if (i == 8 || i == 13 || i == 18 || i == 23) {
                sb.append('-');
            } else {
                sb.append(chars.charAt(RANDOM.nextInt(chars.length())));
            }
        }
        return sb.toString();
    }
    
    /**
     * 生成MD5哈希
     * @param input 输入字符串
     * @return MD5哈希结果
     */
    public static String md5(String input) {
        try {
            MessageDigest md = MessageDigest.getInstance("MD5");
            byte[] digest = md.digest(input.getBytes());
            StringBuilder sb = new StringBuilder();
            for (byte b : digest) {
                sb.append(String.format("%02x", b));
            }
            return sb.toString();
        } catch (NoSuchAlgorithmException e) {
            throw new RuntimeException("MD5 algorithm not found", e);
        }
    }
    
    /**
     * 生成签名
     * @param path API路径
     * @param params 请求参数
     * @param cookie Cookie信息
     * @param deviceId 设备ID
     * @param timestamp 时间戳
     * @return 生成的签名
     */
    public static String generateSign(String path, Map<String, String> params, String cookie, String deviceId, String timestamp) {
        StringBuilder signStr = new StringBuilder();
        
        // 组合路径和参数
        signStr.append(path).append("?");
        
        // 添加参数
        if (params != null && !params.isEmpty()) {
            StringJoiner paramJoiner = new StringJoiner("&");
            for (Map.Entry<String, String> entry : params.entrySet()) {
                paramJoiner.add(entry.getKey() + "=" + entry.getValue());
            }
            signStr.append(paramJoiner.toString());
        }
        
        // 添加设备信息和时间戳
        signStr.append("_")
              .append(timestamp)
              .append("_")
              .append(deviceId)
              .append("_")
              .append(cookie);
        
        // 生成MD5哈希
        return md5(signStr.toString());
    }
    
    /**
     * 生成时间戳（秒）
     * @return 当前时间戳（秒）
     */
    public static String generateTimestamp() {
        return String.valueOf(System.currentTimeMillis() / 1000);
    }
    
    /**
     * 生成时间戳（毫秒）
     * @return 当前时间戳（毫秒）
     */
    public static String generateTimestampMs() {
        return String.valueOf(System.currentTimeMillis());
    }
    
    /**
     * 生成随机IP地址（用于请求头）
     * @return 随机IP地址
     */
    public static String generateRandomIp() {
        return RANDOM.nextInt(256) + "." + 
               RANDOM.nextInt(256) + "." + 
               RANDOM.nextInt(256) + "." + 
               RANDOM.nextInt(256);
    }
    
    /**
     * 生成随机UUID
     * @return 随机UUID
     */
    public static String generateUUID() {
        return java.util.UUID.randomUUID().toString();
    }
    
    /**
     * 生成随机字符串
     * @param length 字符串长度
     * @return 随机字符串
     */
    public static String generateRandomString(int length) {
        StringBuilder sb = new StringBuilder(length);
        String chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
        for (int i = 0; i < length; i++) {
            sb.append(chars.charAt(RANDOM.nextInt(chars.length())));
        }
        return sb.toString();
    }
}
