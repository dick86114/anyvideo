## 问题分析

仪表盘平台分布饼图在鼠标悬停时，tooltip显示为空白状态。通过代码分析发现：

1. 当前tooltip配置可能过于复杂，使用了自定义formatter函数
2. Ant Design Charts饼图组件默认会显示tooltip，但配置不当可能导致显示空白
3. 需要确保数据格式正确，且interactions中包含tooltip类型

## 解决方案

简化pieConfig配置，使用默认的tooltip功能，确保鼠标悬停时能正确显示平台名称和对应数量。

## 修复步骤

1. 修改`/frontend/src/pages/Dashboard.jsx`文件
2. 简化`pieConfig`中的`tooltip`配置，移除自定义formatter函数
3. 确保`interactions`数组中包含`tooltip`类型
4. 测试修复后的tooltip显示效果

## 预期效果

修复后，当鼠标悬停在饼图的各个平台段上时，tooltip将准确显示平台中文名称和对应的数量值，如"抖音: 65"，确保数据展示的一致性和准确性。