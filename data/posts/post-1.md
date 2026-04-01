---
title: 从零开始：在 STM32 上部署深度学习模型
date: 2026-03-20
readTime: 8 分钟阅读
tags: [嵌入式, 深度学习, 教程]
icon: 🔧
excerpt: 详细记录将 PyTorch 训练的 CNN 模型通过 ONNX → TFLite 转换、INT8 量化，最终部署到 STM32H743 微控制器的完整流程与踩坑经验。
---

# 从零开始：在 STM32 上部署深度学习模型

在嵌入式 AI 的实践中，将训练好的深度学习模型部署到微控制器上是最具挑战性的环节之一。本文将详细记录我在 STM32H743 上部署 CNN 模型的完整流程。

## 为什么选择 STM32H743？

STM32H743 是 ST 公司推出的高性能 MCU，具备以下优势：

- **主频**: 480 MHz ARM Cortex-M7
- **Flash**: 2MB
- **RAM**: 1MB（含 DTCM/ITCM 高速内存）
- 支持硬件浮点运算（FPU）

这使得它成为边缘 AI 推理的理想平台。

## 部署流程概览

整个部署流程可以分为以下几个步骤：

1. **模型训练** — 使用 PyTorch 训练和验证模型
2. **模型转换** — PyTorch → ONNX → TFLite
3. **量化压缩** — 全整型 INT8 量化
4. **代码生成** — 使用 STM32Cube.AI 或 TFLite Micro
5. **硬件验证** — 在实际 MCU 上运行推理

## 模型转换：PyTorch → ONNX

```python
import torch

# 加载训练好的模型
model = MyCNNModel()
model.load_state_dict(torch.load('model.pth'))
model.eval()

# 导出 ONNX
dummy_input = torch.randn(1, 1, 32, 32)
torch.onnx.export(
    model, dummy_input, 'model.onnx',
    opset_version=11,
    input_names=['input'],
    output_names=['output']
)
```

## INT8 量化

量化是部署到 MCU 的关键步骤。通过将 FP32 权重转换为 INT8，我们可以：

- 模型体积减小 **4 倍**
- 推理速度提升 **2-3 倍**
- 内存占用大幅降低

```python
import tensorflow as tf

def representative_dataset():
    for data in calibration_data:
        yield [data.numpy().astype('float32')]

converter = tf.lite.TFLiteConverter.from_saved_model('model')
converter.optimizations = [tf.lite.Optimize.DEFAULT]
converter.representative_dataset = representative_dataset
converter.target_spec.supported_ops = [
    tf.lite.OpsSet.TFLITE_BUILTINS_INT8
]
converter.inference_input_type = tf.int8
converter.inference_output_type = tf.int8

tflite_model = converter.convert()
```

## 踩坑经验

> 在实际部署过程中，遇到了不少问题。以下是一些关键经验：

1. **内存对齐**：STM32 的 DTCM 要求数据 4 字节对齐
2. **算子支持**：并非所有 ONNX 算子都有对应的 TFLite Micro 实现
3. **量化精度**：校准数据集的选择对量化后精度影响很大

## 总结

将深度学习模型部署到 MCU 是一个系统工程，需要在模型设计阶段就考虑硬件约束。通过本文的流程，你可以快速上手 STM32 上的 AI 部署实践。

如果你有任何问题，欢迎通过网站联系我交流！
