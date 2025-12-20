## 问题分析

仪表盘平台分布饼图在鼠标悬停时，tooltip没有显示数值。通过代码分析发现：

1. 当前配置中缺少tooltip交互类型
2. tooltip配置可能需要调整以确保正确显示

## 解决方案

修改Dashboard.jsx文件中的pieConfig配置，添加tooltip交互类型并调整tooltip配置。

## 修复步骤

1. 修改`/frontend/src/pages/Dashboard.jsx`文件
2. 在`pieConfig`的`interactions`数组中添加`tooltip`交互类型
3. 调整`tooltip`配置，确保正确显示平台名称和数值
4. 测试修复后的tooltip显示效果

## 预期效果

修复后，当鼠标悬停在饼图的各个平台段上时，tooltip将准确显示平台名称和对应的数值，提升用户体验。