package com.flower.parser.utils;

import java.io.BufferedInputStream;
import java.io.BufferedOutputStream;
import java.io.BufferedReader;
import java.io.File;
import java.io.FileInputStream;
import java.io.FileOutputStream;
import java.io.FileReader;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.StandardCopyOption;

import com.alibaba.fastjson2.JSON;
import com.alibaba.fastjson2.JSONArray;
import com.flower.parser.config.Global;

/**
 * 文件工具类 - 用于处理文件路径生成、文件复制和JSON读取等操作
 */
public class FileUtil {
    
    /**
     * 映射路径
     */
    public static String savefile = "/save";
    
    /**
     * 文件储存真实路径
     */
    public static String uploadRealPath = "./uploads";

    /**
     * 生成文件目录路径
     * @param real 是否为真实路径
     * @param platform 平台名称
     * @param filename 文件名
     * @param favname 收藏名称
     * @param ext 文件扩展名
     * @param index 索引
     * @return 生成的路径
     */
    public static String generateDir(boolean real, String platform, String filename, String favname, String ext, int index) {
        String datepath = DateUtils.getDate("yyyyMM");
        String resdir = "";
        if (real) {
            resdir = resdir + uploadRealPath + System.getProperty("file.separator");
        } else {
            resdir = resdir + savefile + System.getProperty("file.separator");
        }
        // 拼接平台
        resdir = resdir + platform + System.getProperty("file.separator");
        
        // 拼接类型
        resdir = resdir + "graphic" + System.getProperty("file.separator");
        
        if (favname == null) {
            resdir = resdir + datepath + System.getProperty("file.separator");
        } else {
            resdir = resdir + favname + System.getProperty("file.separator");
        }
        if (filename != null) {
            resdir = resdir + filename;
            if (ext != null) {
                resdir = resdir + System.getProperty("file.separator") + filename + "-index-" + index + "." + ext;
            } else {
                resdir = resdir + System.getProperty("file.separator");
            }
        }
        return resdir;
    }
    
    /**
     * 生成文件目录路径
     * @param real 是否为真实路径
     * @param platform 平台名称
     * @param odd 是否为奇数
     * @param filename 文件名
     * @param favname 收藏名称
     * @param ext 文件扩展名
     * @return 生成的路径
     */
    public static String generateDir(boolean real, String platform, boolean odd, String filename, String favname, String ext) {
        String datepath = DateUtils.getDate("yyyyMM");
        String resdir = "";
        if (real) {
            resdir = resdir + uploadRealPath + System.getProperty("file.separator");
        } else {
            resdir = resdir + savefile + System.getProperty("file.separator");
        }
        // 拼接平台
        resdir = resdir + platform + System.getProperty("file.separator");
        
        // 拼接类型
        if (odd) {
            resdir = resdir + "odd" + System.getProperty("file.separator");
        } else {
            resdir = resdir + "collection" + System.getProperty("file.separator");
        }
        if (favname == null) {
            resdir = resdir + datepath + System.getProperty("file.separator");
        } else {
            resdir = resdir + favname + System.getProperty("file.separator");
        }
        if (filename != null) {
            if (Global.getGeneratenfo) {
                if (favname != null) {
                    resdir = resdir + "Season1" + System.getProperty("file.separator") + filename;
                } else {
                    resdir = resdir + filename;
                }
            } else {
                resdir = resdir + filename;
            }
            if (ext != null) {
                resdir = resdir + System.getProperty("file.separator") + filename + "." + ext;
            } else {
                resdir = resdir + System.getProperty("file.separator");
            }
        }
        return resdir;
    }
    
    /**
     * 生成文件目录路径
     * @param down 下载根目录
     * @param platform 平台名称
     * @param odd 是否为奇数
     * @param filename 文件名
     * @param favname 收藏名称
     * @param ext 文件扩展名
     * @return 生成的路径
     */
    public static String generateDir(String down, String platform, boolean odd, String filename, String favname, String ext) {
        String datepath = DateUtils.getDate("yyyyMM") + System.getProperty("file.separator");
        String resdir = "";
        resdir = resdir + down + System.getProperty("file.separator");
        // 拼接平台
        resdir = resdir + platform + System.getProperty("file.separator");
        
        // 拼接类型
        if (odd) {
            resdir = resdir + "odd" + System.getProperty("file.separator");
        } else {
            resdir = resdir + "collection" + System.getProperty("file.separator");
        }
        if (favname == null) {
            resdir = resdir + datepath + System.getProperty("file.separator");
        } else {
            resdir = resdir + favname + System.getProperty("file.separator");
        }
        if (filename != null) {
            resdir = resdir + filename;
            if (ext != null) {
                resdir = resdir + "." + ext;
            } else {
                resdir = resdir + System.getProperty("file.separator");
            }
        }
        return resdir;
    }
    
    /**
     * 复制文件夹
     * @param oldDir 原来的目录
     * @param newDir 复制到哪个目录
     */
    public static void copyDir(String oldDir, String newDir) {
        File srcDir = new File(oldDir);
        // 判断文件是否不存在或是否不是文件夹
        if (!srcDir.exists() || !srcDir.isDirectory()) {
            throw new IllegalArgumentException("参数错误");
        }
        File destDir = new File(newDir);
        if (!destDir.exists()) {
            // 不存在就创建目录
            if (destDir.mkdirs()) {
                // 列出目录中的文件
                File[] files = srcDir.listFiles();
                for (File f : files) {
                    // 是文件就调用复制文件方法 是目录就继续调用复制目录方法
                    if (f.isFile()) {
                        File file = new File(newDir, f.getName());
                        if (!file.exists()) {
                            copyFile(f, file);
                        }
                    } else if (f.isDirectory()) {
                        copyDir(oldDir + File.separator + f.getName(),
                                newDir + File.separator + f.getName());
                    }
                }
            }
        } else {
            File[] files = srcDir.listFiles();
            for (File f : files) {
                // 是文件就调用复制文件方法 是目录就继续调用复制目录方法
                if (f.isFile()) {
                    File file = new File(newDir, f.getName());
                    if (!file.exists()) {
                        copyFile(f, file);
                    }
                } else if (f.isDirectory()) {
                    copyDir(oldDir + File.separator + f.getName(),
                            newDir + File.separator + f.getName());
                }
            }
        }
    }
    
    /**
     * 复制文件
     * @param oldDir 原来的文件
     * @param newDir 复制到的文件
     */
    public static void copyFile(File oldDir, File newDir) {
        BufferedInputStream bufferedInputStream = null;
        BufferedOutputStream bufferedOutputStream = null;
        byte[] b = new byte[1024];
        try {
            // 将要复制文件输入到缓冲输入流
            bufferedInputStream = new BufferedInputStream(new FileInputStream(oldDir));
            // 将复制的文件定义为缓冲输出流
            bufferedOutputStream = new BufferedOutputStream(new FileOutputStream(newDir));
            // 定义字节数
            int len;
            while ((len = bufferedInputStream.read(b)) > -1) {
                // 写入文件
                bufferedOutputStream.write(b, 0, len);
            }
            // 刷新此缓冲输出流
            bufferedOutputStream.flush();
        } catch (IOException e) {
            e.printStackTrace();
        } finally {
            if (bufferedInputStream != null) {
                try {
                    // 关闭流
                    bufferedInputStream.close();
                } catch (IOException e) {
                    e.printStackTrace();
                }
            }
            if (bufferedOutputStream != null) {
                try {
                    bufferedOutputStream.close();
                } catch (IOException e) {
                    e.printStackTrace();
                }
            }
        }
    }
    
    /**
     * 从文件中读取JSONArray
     * @param filePath 文件路径
     * @return 读取到的JSONArray
     * @throws IOException 可能的IO异常
     */
    public static JSONArray readJsonFromFile(String filePath) throws IOException {
        BufferedReader reader = new BufferedReader(new FileReader(filePath));
        StringBuilder jsonContent = new StringBuilder();
        String line;
        while ((line = reader.readLine()) != null) {
            jsonContent.append(line);
        }
        reader.close();
        return JSON.parseArray(jsonContent.toString());
    }
    
    /**
     * 从文件中读取JSON字符串
     * @param filePath 文件路径
     * @return 读取到的JSON字符串
     * @throws IOException 可能的IO异常
     */
    public static String readJson(String filePath) throws IOException {
        BufferedReader reader = new BufferedReader(new FileReader(filePath));
        StringBuilder jsonContent = new StringBuilder();
        String line;
        while ((line = reader.readLine()) != null) {
            jsonContent.append(line);
        }
        reader.close();
        return jsonContent.toString();
    }
    
    /**
     * 安全移动文件，支持重试
     * @param source 源文件
     * @param target 目标文件
     * @param maxRetries 最大重试次数
     * @param delayMillis 重试延迟时间（毫秒）
     * @return 移动成功返回true，否则返回false
     */
    public static boolean safeMoveFile(File source, File target, int maxRetries, long delayMillis) {
        int attempt = 0;
        while (attempt < maxRetries) {
            try {
                Files.move(source.toPath(), target.toPath(), StandardCopyOption.REPLACE_EXISTING);
                return true;
            } catch (IOException e) {
                attempt++;
                try {
                    Thread.sleep(delayMillis);
                } catch (InterruptedException ignored) {}
            }
        }
        return false;
    }
}