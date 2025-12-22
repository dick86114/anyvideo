package com.flower.parser.utils;

import java.util.regex.Matcher;
import java.util.regex.Pattern;

import org.apache.commons.lang3.StringUtils;

/**
 * 字符串工具类 - 用于处理字符串验证、文件名生成和字符串简化等操作
 */
public class StringUtil {

    /**
     * 判断是否是有效的字符串
     * @param str 要判断的字符串
     * @return 有效返回true，否则返回false
     */
    public static boolean isString(String str) {
        if (null == str || str.trim().equals("")) {
            return false;
        }
        return true;
    }

    /**
     * 处理特殊字符串并返回安全的文件名
     * 
     * @param obj 原始文件名
     * @param aid 备用ID
     * @return 处理后的文件名
     */
    public static String getFileName(String obj, String aid) {
        try {
            if (obj == null || obj.trim().isEmpty()) {
                return aid;
            }

            // 限制长度
            if (obj.length() > 64) {
                obj = obj.substring(0, 64);
            }

            // 替换所有非中文、数字、字母为点号
            String result = obj.replaceAll("[^A-Za-z0-9\\u4e00-\\u9fa5]+", ".");

            // 合并多个点号为一个
            result = result.replaceAll("\\.+", ".");
            

            // 去除首尾点号
            result = result.replaceAll("^\\.|\\.$", "");

            // 去除孤立的点号（即两个点号之间无字符的情况）
            result = result.replaceAll("(?<=\\.)\\.(?=\\.)", "");

            // 再次去除首尾点号，防止中间清理后新产生的
            result = result.replaceAll("^\\.|\\.$", "");

            result = result.replace(".", "");
            
            // 如果结果为空，使用备用ID
            if (result.isEmpty()) {
                return aid;
            }

            // 文件名不能以数字开头
            if (result.matches("^[0-9].*")) {
                result = "ep" + result;
            }

            return result;
        } catch (Exception e) {
            return aid;
        }
    }

    /**
     * 简化标题，保留前3个有效词
     * @param originalTitle 原始标题
     * @return 简化后的标题
     */
    public static String simplifyTitle(String originalTitle) {
        if (originalTitle == null || originalTitle.trim().isEmpty()) {
            return "未知标题";
        }
        String cleaned = originalTitle.replaceAll("#[^_#\\s]+", "");
        cleaned = cleaned.replaceAll("_+", "_");
        cleaned = cleaned.replaceAll("^_+|_+$", "");
        String[] parts = cleaned.split("_");
        StringBuilder simplified = new StringBuilder();
        int count = 0;
        for (String part : parts) {
            part = part.trim();
            if (!part.isEmpty()) {
                simplified.append(part);
                count++;
                if (count >= 3) break; // 最多保留前3个有效词
            }
        }
        return simplified.length() > 0 ? simplified.toString() : "未知标题";
    }

    /**
     * 判断字符串是否为空
     * @param cs 要判断的字符序列
     * @return 为空返回true，否则返回false
     */
    public static boolean isBlank(final CharSequence cs) {
        int strLen;
        if (cs == null || (strLen = cs.length()) == 0) {
            return true;
        }
        for (int i = 0; i < strLen; i++) {
            if (!Character.isWhitespace(cs.charAt(i))) {
                return false;
            }
        }
        return true;
    }
    
    /**
     * 判断字符串是否不为空白
     * @param cs 要判断的字符序列
     * @return 不为空白返回true，否则返回false
     */
    public static boolean isNotBlank(final CharSequence cs) {
        return !isBlank(cs);
    }
    
    /**
     * 从文本中提取更新状态
     * @param text 原始文本
     * @return 格式化后的更新状态
     */
    public static String getUpdateStatus(String text) {
        Pattern currentVersionPattern = Pattern.compile("Current version: ([^ ]+)"); 
        Pattern latestVersionPattern = Pattern.compile("Latest version: ([^ ]+)"); 
        Pattern upToDatePattern = Pattern.compile("yt-dlp is up to date \\(([^\\)]+)\\)"); 
        if (text.contains("yt-dlp is up to date")) {
            Matcher upToDateMatcher = upToDatePattern.matcher(text);
            if (upToDateMatcher.find()) {
                String latestVersion = upToDateMatcher.group(1);
                return "当前已是最新版本 版本号:" + latestVersion;
            }
        }
        Matcher currentVersionMatcher = currentVersionPattern.matcher(text);
        Matcher latestVersionMatcher = latestVersionPattern.matcher(text);
        if (currentVersionMatcher.find() && latestVersionMatcher.find()) {
            String currentVersion = currentVersionMatcher.group(1);
            String latestVersion = latestVersionMatcher.group(1);
            if (currentVersion.equals(latestVersion)) {
                return "当前已是最新版本 版本号:" + latestVersion;
            } else {
                return "已经成功更新yt-dlp 由 " + currentVersion + " 更新至 " + latestVersion;
            }
        }
        return "无法获取版本信息";
    }
}