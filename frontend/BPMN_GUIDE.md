# BPMN XML 填写指南

## 基本结构

BPMN XML 必须包含以下基本结构：

```xml
<?xml version="1.0" encoding="UTF-8"?>
<bpmn:definitions xmlns:bpmn="http://www.omg.org/spec/BPMN/20100524/MODEL" 
                  xmlns:camunda="http://camunda.org/schema/1.0/bpmn"
                  xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">
  <bpmn:process id="your_process_id" name="流程名称" isExecutable="true">
    <!-- 流程元素 -->
  </bpmn:process>
</bpmn:definitions>
```

## 最简单的流程模板

```xml
<?xml version="1.0" encoding="UTF-8"?>
<bpmn:definitions xmlns:bpmn="http://www.omg.org/spec/BPMN/20100524/MODEL" 
                  xmlns:camunda="http://camunda.org/schema/1.0/bpmn"
                  xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">
  <bpmn:process id="simple_process" name="简单流程" isExecutable="true">
    <bpmn:startEvent id="StartEvent_1">
      <bpmn:outgoing>Flow_1</bpmn:outgoing>
    </bpmn:startEvent>
    <bpmn:endEvent id="EndEvent_1">
      <bpmn:incoming>Flow_1</bpmn:incoming>
    </bpmn:endEvent>
    <bpmn:sequenceFlow id="Flow_1" sourceRef="StartEvent_1" targetRef="EndEvent_1" />
  </bpmn:process>
</bpmn:definitions>
```

## 常用元素

### 1. 开始事件 (Start Event)
```xml
<bpmn:startEvent id="StartEvent_1">
  <bpmn:outgoing>Flow_1</bpmn:outgoing>
</bpmn:startEvent>
```

### 2. 结束事件 (End Event)
```xml
<bpmn:endEvent id="EndEvent_1">
  <bpmn:incoming>Flow_1</bpmn:incoming>
</bpmn:endEvent>
```

### 3. 用户任务 (User Task) - 需要用户输入
```xml
<bpmn:userTask id="Task_1" name="填写表单">
  <bpmn:extensionElements>
    <camunda:formData>
      <camunda:formField id="field1" label="字段标签" type="string" />
      <camunda:formField id="field2" label="是否同意" type="boolean" />
      <camunda:formField id="field3" label="选择选项" type="enum">
        <camunda:value id="option1" name="选项1" />
        <camunda:value id="option2" name="选项2" />
      </camunda:formField>
    </camunda:formData>
  </bpmn:extensionElements>
  <bpmn:incoming>Flow_1</bpmn:incoming>
  <bpmn:outgoing>Flow_2</bpmn:outgoing>
</bpmn:userTask>
```

### 4. 脚本任务 (Script Task) - 自动执行
```xml
<bpmn:scriptTask id="ScriptTask_1" name="处理数据">
  <bpmn:incoming>Flow_1</bpmn:incoming>
  <bpmn:outgoing>Flow_2</bpmn:outgoing>
  <bpmn:script>
    # Python 脚本
    result = input_data * 2
  </bpmn:script>
</bpmn:scriptTask>
```

### 5. 排他网关 (Exclusive Gateway) - 条件分支
```xml
<bpmn:exclusiveGateway id="Gateway_1" name="判断条件">
  <bpmn:incoming>Flow_1</bpmn:incoming>
  <bpmn:outgoing>Flow_2</bpmn:outgoing>
  <bpmn:outgoing>Flow_3</bpmn:outgoing>
</bpmn:exclusiveGateway>

<!-- 条件分支 1 -->
<bpmn:sequenceFlow id="Flow_2" name="是" sourceRef="Gateway_1" targetRef="Task_1">
  <bpmn:conditionExpression xsi:type="bpmn:tFormalExpression">
    condition == True
  </bpmn:conditionExpression>
</bpmn:sequenceFlow>

<!-- 条件分支 2 -->
<bpmn:sequenceFlow id="Flow_3" name="否" sourceRef="Gateway_1" targetRef="Task_2">
  <bpmn:conditionExpression xsi:type="bpmn:tFormalExpression">
    condition == False
  </bpmn:conditionExpression>
</bpmn:sequenceFlow>
```

### 6. 顺序流 (Sequence Flow) - 连接元素
```xml
<bpmn:sequenceFlow id="Flow_1" sourceRef="StartEvent_1" targetRef="Task_1" />
```

## 完整示例：审批流程

```xml
<?xml version="1.0" encoding="UTF-8"?>
<bpmn:definitions xmlns:bpmn="http://www.omg.org/spec/BPMN/20100524/MODEL" 
                  xmlns:camunda="http://camunda.org/schema/1.0/bpmn"
                  xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">
  <bpmn:process id="approval_process" name="审批流程" isExecutable="true">
    <!-- 开始事件 -->
    <bpmn:startEvent id="StartEvent_1">
      <bpmn:outgoing>Flow_1</bpmn:outgoing>
    </bpmn:startEvent>
    
    <!-- 用户任务：提交申请 -->
    <bpmn:userTask id="Task_Submit" name="提交申请">
      <bpmn:extensionElements>
        <camunda:formData>
          <camunda:formField id="applicant" label="申请人" type="string" />
          <camunda:formField id="amount" label="申请金额" type="string" />
        </camunda:formData>
      </bpmn:extensionElements>
      <bpmn:incoming>Flow_1</bpmn:incoming>
      <bpmn:outgoing>Flow_2</bpmn:outgoing>
    </bpmn:userTask>
    
    <!-- 脚本任务：计算 -->
    <bpmn:scriptTask id="Task_Calculate" name="计算处理">
      <bpmn:incoming>Flow_2</bpmn:incoming>
      <bpmn:outgoing>Flow_3</bpmn:outgoing>
      <bpmn:script>
        amount = float(amount)
        if amount > 10000:
            need_approval = True
        else:
            need_approval = False
      </bpmn:script>
    </bpmn:scriptTask>
    
    <!-- 排他网关：判断是否需要审批 -->
    <bpmn:exclusiveGateway id="Gateway_1" name="需要审批?">
      <bpmn:incoming>Flow_3</bpmn:incoming>
      <bpmn:outgoing>Flow_4</bpmn:outgoing>
      <bpmn:outgoing>Flow_5</bpmn:outgoing>
    </bpmn:exclusiveGateway>
    
    <!-- 用户任务：审批 -->
    <bpmn:userTask id="Task_Approve" name="审批">
      <bpmn:extensionElements>
        <camunda:formData>
          <camunda:formField id="approved" label="是否批准" type="boolean" />
        </camunda:formData>
      </bpmn:extensionElements>
      <bpmn:incoming>Flow_4</bpmn:incoming>
      <bpmn:outgoing>Flow_6</bpmn:outgoing>
    </bpmn:userTask>
    
    <!-- 脚本任务：直接通过 -->
    <bpmn:scriptTask id="Task_AutoApprove" name="自动通过">
      <bpmn:incoming>Flow_5</bpmn:incoming>
      <bpmn:outgoing>Flow_6</bpmn:outgoing>
      <bpmn:script>
        approved = True
        print('自动批准')
      </bpmn:script>
    </bpmn:scriptTask>
    
    <!-- 结束事件 -->
    <bpmn:endEvent id="EndEvent_1">
      <bpmn:incoming>Flow_6</bpmn:incoming>
    </bpmn:endEvent>
    
    <!-- 顺序流 -->
    <bpmn:sequenceFlow id="Flow_1" sourceRef="StartEvent_1" targetRef="Task_Submit" />
    <bpmn:sequenceFlow id="Flow_2" sourceRef="Task_Submit" targetRef="Task_Calculate" />
    <bpmn:sequenceFlow id="Flow_3" sourceRef="Task_Calculate" targetRef="Gateway_1" />
    <bpmn:sequenceFlow id="Flow_4" name="是" sourceRef="Gateway_1" targetRef="Task_Approve">
      <bpmn:conditionExpression xsi:type="bpmn:tFormalExpression">
        need_approval == True
      </bpmn:conditionExpression>
    </bpmn:sequenceFlow>
    <bpmn:sequenceFlow id="Flow_5" name="否" sourceRef="Gateway_1" targetRef="Task_AutoApprove">
      <bpmn:conditionExpression xsi:type="bpmn:tFormalExpression">
        need_approval == False
      </bpmn:conditionExpression>
    </bpmn:sequenceFlow>
    <bpmn:sequenceFlow id="Flow_6" sourceRef="Task_Approve" targetRef="EndEvent_1" />
    <bpmn:sequenceFlow id="Flow_6" sourceRef="Task_AutoApprove" targetRef="EndEvent_1" />
  </bpmn:process>
</bpmn:definitions>
```

## 表单字段类型

- `string`: 文本输入
- `boolean`: 布尔值（是/否）
- `enum`: 枚举选择（需要定义选项）
- `long`: 整数
- `double`: 浮点数

## 注意事项

1. **ID 必须唯一**：每个元素的 `id` 必须在整个流程中唯一
2. **连接必须完整**：每个元素必须有 `incoming` 和 `outgoing`（开始事件只有 outgoing，结束事件只有 incoming）
3. **顺序流必须匹配**：`sequenceFlow` 的 `sourceRef` 和 `targetRef` 必须对应实际存在的元素
4. **流程名称**：`process` 的 `name` 属性应该与你在前端填写的流程名称一致
5. **isExecutable**：必须设置为 `true` 才能执行

## 使用建议

1. **从简单开始**：先创建一个只有开始和结束事件的简单流程，确保可以保存
2. **逐步添加**：然后添加用户任务、脚本任务等
3. **测试执行**：每添加一个元素后，测试流程是否可以正常执行
4. **参考示例**：可以参考项目中的 `bpmn/ducky.bpmn` 文件作为模板

