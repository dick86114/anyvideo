## 问题分析

仪表盘平台分布饼图在鼠标悬停时，tooltip显示的是错误的"value22"文本，而不是预期的平台名称和对应数量值。通过代码分析发现：

1. 当前饼图配置中缺少明确的tooltip配置
2. 默认tooltip可能在渲染时出现格式错误
3. 需要自定义tooltip内容来确保正确显示平台名称和数量

## 解决方案

在Dashboard.jsx文件中为饼图添加明确的tooltip配置，自定义tooltip内容格式。

## 修复步骤

1. 修改`/frontend/src/pages/Dashboard.jsx`文件
2. 在`pieConfig`对象中添加`tooltip`配置
3. 自定义`tooltip.content`函数，确保正确显示平台名称和数量值
4. 测试修复后的tooltip显示效果

## 预期效果

修复后，当鼠标悬停在饼图的各个平台段上时，tooltip将准确显示平台中文名称和对应的数量值，如"抖音: 65"，确保数据展示的一致性和准确性。