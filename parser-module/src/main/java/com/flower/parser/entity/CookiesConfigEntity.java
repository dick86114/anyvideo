package com.flower.parser.entity;

import java.io.Serializable;

/**
 * Cookies配置实体类 - 用于存储各平台的Cookies信息
 */
public class CookiesConfigEntity implements Serializable {
    
    private static final long serialVersionUID = 574236590065434047L;
    
    private Integer id;
    
    private String youtubecookies;
    
    private String twittercookies;
    
    private String kuaishouCookie;
    
    private String weibocookie;
    
    private String rednotecookie;

    public Integer getId() {
        return id;
    }

    public void setId(Integer id) {
        this.id = id;
    }

    public String getYoutubecookies() {
        return youtubecookies;
    }

    public void setYoutubecookies(String youtubecookies) {
        this.youtubecookies = youtubecookies;
    }

    public String getTwittercookies() {
        return twittercookies;
    }

    public void setTwittercookies(String twittercookies) {
        this.twittercookies = twittercookies;
    }

    public String getKuaishouCookie() {
        return kuaishouCookie;
    }

    public void setKuaishouCookie(String kuaishouCookie) {
        this.kuaishouCookie = kuaishouCookie;
    }

    public String getWeibocookie() {
        return weibocookie;
    }

    public void setWeibocookie(String weibocookie) {
        this.weibocookie = weibocookie;
    }

    public String getRednotecookie() {
        return rednotecookie;
    }

    public void setRednotecookie(String rednotecookie) {
        this.rednotecookie = rednotecookie;
    }
}