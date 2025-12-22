package com.flower.parser.utils;

import java.text.ParseException;
import java.text.SimpleDateFormat;
import java.util.Date;

/**
 * 日期工具类 - 用于处理日期格式化和解析
 */
public class DateUtils {
    
    /**
     * 默认日期格式
     */
    public static final String DEFAULT_DATE_FORMAT = "yyyy-MM-dd";
    
    /**
     * 默认时间格式
     */
    public static final String DEFAULT_TIME_FORMAT = "HH:mm:ss";
    
    /**
     * 默认日期时间格式
     */
    public static final String DEFAULT_DATETIME_FORMAT = "yyyy-MM-dd HH:mm:ss";
    
    /**
     * 得到当前日期字符串，使用指定格式
     * @param pattern 日期格式
     * @return 格式化后的日期字符串
     */
    public static String getDate(String pattern) {
        return formatDate(new Date(), pattern);
    }
    
    /**
     * 得到当前日期字符串，使用默认格式（yyyy-MM-dd）
     * @return 格式化后的日期字符串
     */
    public static String getDate() {
        return getDate(DEFAULT_DATE_FORMAT);
    }
    
    /**
     * 格式化日期对象为指定格式的字符串
     * @param date 日期对象
     * @param pattern 日期格式
     * @return 格式化后的日期字符串
     */
    public static String formatDate(Date date, String pattern) {
        if (date == null) {
            return null;
        }
        SimpleDateFormat sdf = new SimpleDateFormat(pattern);
        return sdf.format(date);
    }
    
    /**
     * 格式化日期对象为日期时间字符串，使用默认格式（yyyy-MM-dd HH:mm:ss）
     * @param date 日期对象
     * @return 格式化后的日期时间字符串
     */
    public static String formatDateTime(Date date) {
        return formatDate(date, DEFAULT_DATETIME_FORMAT);
    }
    
    /**
     * 解析日期字符串为日期对象
     * @param dateStr 日期字符串
     * @param pattern 日期格式
     * @return 日期对象，解析失败返回null
     */
    public static Date parseDate(String dateStr, String pattern) {
        if (dateStr == null || dateStr.trim().isEmpty()) {
            return null;
        }
        SimpleDateFormat sdf = new SimpleDateFormat(pattern);
        try {
            return sdf.parse(dateStr);
        } catch (ParseException e) {
            e.printStackTrace();
            return null;
        }
    }
    
    /**
     * 解析日期字符串为日期对象，使用默认格式（yyyy-MM-dd）
     * @param dateStr 日期字符串
     * @return 日期对象，解析失败返回null
     */
    public static Date parseDate(String dateStr) {
        return parseDate(dateStr, DEFAULT_DATE_FORMAT);
    }
    
    /**
     * 得到当前时间字符串，使用默认格式（HH:mm:ss）
     * @return 格式化后的时间字符串
     */
    public static String getTime() {
        return formatDate(new Date(), DEFAULT_TIME_FORMAT);
    }
    
    /**
     * 得到当前日期和时间字符串，使用默认格式（yyyy-MM-dd HH:mm:ss）
     * @return 格式化后的日期时间字符串
     */
    public static String getDateTime() {
        return formatDate(new Date(), DEFAULT_DATETIME_FORMAT);
    }
    
    /**
     * 得到当前年份字符串，格式（yyyy）
     * @return 年份字符串
     */
    public static String getYear() {
        return formatDate(new Date(), "yyyy");
    }
    
    /**
     * 得到当前月份字符串，格式（MM）
     * @return 月份字符串
     */
    public static String getMonth() {
        return formatDate(new Date(), "MM");
    }
    
    /**
     * 得到当天字符串，格式（dd）
     * @return 日期字符串
     */
    public static String getDay() {
        return formatDate(new Date(), "dd");
    }
}