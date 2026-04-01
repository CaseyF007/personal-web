---
title: Markdown 语法笔记
date: 2026-04-01
readTime: 10 分钟阅读
tags: [Markdown, 教程, 工具]
icon: 📖
excerpt: Markdown 常用语法速查笔记，涵盖标题、字体、引用、代码块、链接、图片、表格、列表、数学公式、流程图等全部常用写法。
---

# Markdown笔记

## 0、目录

```markdown
[TOC]
```
## 1、标题

```markdown
# 一级标题
## 二级标题
### 三级标题
#### 四级标题
##### 五级标题
###### 最小到六级标题
```
## 2、字体

```markdown
**粗体示例**
==高亮示例==
*斜体示例*
~~删除线示例~~
<u>下划线示例</u>
```
**粗体示例**
==高亮示例==
*斜体示例*
~~删除线示例~~
<u>下划线示例</u>

## 3、引用

### 3.1 >式

```markdown
> 1类引用
>> 嵌套引用
>>> 再次嵌套
```
> 1类引用
>
> > 嵌套引用
> >> 再次嵌套
### 3.2 ```式

````markdown
```python←语言
print('hello world')
```
````
```python
print('hello world')
```
### 3.3 `式

```markdown
`print('hello world')`
```
`print('hello world')`

### 3.4 可折叠代码块

```html
<details>
  <summary>外部显示内容</summary>
  <pre><code> 
     System.out.println("Hello");
  </code></pre>
</details>
```

<details>
  <summary>外部显示内容</summary>
  <pre><code> 
     System.out.println("Hello");
  </code></pre>
</details>
## 4、链接

### 4.1 显示链接

```markdown
<https://www.baidu.com>
```
<https://www.baidu.com>

### 4.2 显示描述

```markdown
[这是百度](https://www.baidu.com "百度")
```
[这是百度](https://www.baidu.com "百度")

### 4.3 链接加到某个词上

```markdown
点击跳转[百度](https://www.baidu.com).
```
点击跳转[百度](https://www.baidu.com).

## 5、图片

```markdown
![图片alt](图片链接 "图片title")
```
![图片alt](https://pikapics.oss-cn-chengdu.aliyuncs.com/img/202403021736233.jpeg "图片title")
```html
<img src="图片链接" width="xx%"> # 控制图片大小
```
<img src="https://pikapics.oss-cn-chengdu.aliyuncs.com/img/202403021736233.jpeg" width="30%">

```html
<img src = "图片链接" align="left">#靠左显示图片
```

<img src = "https://pikapics.oss-cn-chengdu.aliyuncs.com/img/202403021736233.jpeg" align="left" width="30%">

## 6、表格

```
|   标题1     |     标题2    |     标题3     |
| :---        |    :----:   |          ---: |
| 上面表示     |   不同的    |     对齐方式   |
|     值1     |    值2      |      值3      |
```
| 标题1    | 标题2  |    标题3 |
| :------- | :----: | -------: |
| 上面表示 | 不同的 | 对齐方式 |
| 值1      |  值2   |      值3 |
## 7、列表

### 7.1 无序列表

```
- one
- two
- three
```

- one
- two
- three

### 7.2 有序列表

```
1. one
2. two
3. three
```
1. one
2. two
3. three
### 7.3 任务列表

```
- [x] 任务1
- [ ] 任务2
- [ ] 任务3
```
- [x] 任务1
- [ ] 任务2
- [ ] 任务3

## 8、段落

### 8.1 换行

```
第一句话	[shift + enter]
第二句话	[enter]
第三句话
```

第一句话
第二句话

第三句话

### 8.2 分割线

```
---
```

---

## 9、数学公式

###  9.0 上下标

代码:
```text
>x^2^
>H~2~O
```
x^2^
H~2~O

### 9.1 内嵌公式

```
内嵌数学公式$\sum_{i=1}^{10}f(i)\,\,\text{thanks}$
```
内嵌数学公式$\sum_{i=1}^{10}f(i)\,\,\text{thanks}$

### 9.2 块状公式

```
$$\lim\limits_{x \rightarrow 0} \frac{sin x}{x} = 1$$
```
$$\lim\limits_{x \rightarrow 0} \frac{sin x}{x} = 1$$

### 9.3 数学符号

现用现查喵~

## 10、其他

### 10.1 脚注 

>说明:  对文本进行解释说明。

>代码: 
>
>```text
>[^文本]
>[^文本]:解释说明
>```

>效果:
>这是一个技术[^①]
>
>[^①]:这是一个非常好用的框架。

### 10.2 流程图

① 横向流程图

> ````text
> ```mermaid
> graph LR
> A[方形]==>B(圆角)
> B==>C{条件a}
> C-->|a=1|D[结果1]
> C-->|a=2|E[结果2]
> F[横向流程图]
> ```
> ````

>```mermaid
>graph LR
>A[方形]==>B(圆角)
>B==>C{条件a}
>C-->|a=1|D[结果1]
>C-->|a=2|E[结果2]
>F[横向流程图]
>```

②竖向流程图

> ````text
> ```mermaid
> graph TD
> A[方形]==>B(圆角)
> B==>C{条件a}
> C-->|a=1|D[结果1]
> C-->|a=2|E[结果2]
> F[竖向流程图]
> ```
> ````

>```mermaid
>graph TD
>A[方形]==>B(圆角)
>B==>C{条件a}
>C-->|a=1|D[结果1]
>C-->|a=2|E[结果2]
>F[竖向流程图]
>```

### 10.3、表情符号

>```text
>:happy:、:cry:、:man:
>```

>
>:happy:、 :cry:、 :man: