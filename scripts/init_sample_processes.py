#!/usr/bin/env python3
"""
初始化示例流程脚本
将预置的 BPMN 流程添加到数据库中
"""
import asyncio
import sys
import os

# 添加项目根目录到路径
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from db import AsyncSessionLocal
from db.models import BpmnProcess
from db.repos import RepoManager


# 示例流程 1: 简单流程（开始→结束）
SIMPLE_PROCESS = '''<?xml version="1.0" encoding="UTF-8"?>
<bpmn:definitions xmlns:bpmn="http://www.omg.org/spec/BPMN/20100524/MODEL" xmlns:camunda="http://camunda.org/schema/1.0/bpmn" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">
  <bpmn:process id="simple_process" name="简单流程" isExecutable="true">
    <bpmn:startEvent id="StartEvent_1">
      <bpmn:outgoing>Flow_1</bpmn:outgoing>
    </bpmn:startEvent>
    <bpmn:endEvent id="EndEvent_1">
      <bpmn:incoming>Flow_1</bpmn:incoming>
    </bpmn:endEvent>
    <bpmn:sequenceFlow id="Flow_1" sourceRef="StartEvent_1" targetRef="EndEvent_1" />
  </bpmn:process>
</bpmn:definitions>'''

# 示例流程 2: 用户任务流程（包含表单）
USER_TASK_PROCESS = '''<?xml version="1.0" encoding="UTF-8"?>
<bpmn:definitions xmlns:bpmn="http://www.omg.org/spec/BPMN/20100524/MODEL" xmlns:camunda="http://camunda.org/schema/1.0/bpmn" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">
  <bpmn:process id="user_task_process" name="用户任务流程" isExecutable="true">
    <bpmn:startEvent id="StartEvent_1">
      <bpmn:outgoing>Flow_1</bpmn:outgoing>
    </bpmn:startEvent>
    <bpmn:userTask id="Task_1" name="填写信息">
      <bpmn:extensionElements>
        <camunda:formData>
          <camunda:formField id="name" label="姓名" type="string" />
          <camunda:formField id="email" label="邮箱" type="string" />
          <camunda:formField id="agree" label="同意条款" type="boolean" />
        </camunda:formData>
      </bpmn:extensionElements>
      <bpmn:incoming>Flow_1</bpmn:incoming>
      <bpmn:outgoing>Flow_2</bpmn:outgoing>
    </bpmn:userTask>
    <bpmn:endEvent id="EndEvent_1">
      <bpmn:incoming>Flow_2</bpmn:incoming>
    </bpmn:endEvent>
    <bpmn:sequenceFlow id="Flow_1" sourceRef="StartEvent_1" targetRef="Task_1" />
    <bpmn:sequenceFlow id="Flow_2" sourceRef="Task_1" targetRef="EndEvent_1" />
  </bpmn:process>
</bpmn:definitions>'''

# 示例流程 3: 条件分支流程
CONDITIONAL_PROCESS = '''<?xml version="1.0" encoding="UTF-8"?>
<bpmn:definitions xmlns:bpmn="http://www.omg.org/spec/BPMN/20100524/MODEL" xmlns:camunda="http://camunda.org/schema/1.0/bpmn" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">
  <bpmn:process id="conditional_process" name="条件分支流程" isExecutable="true">
    <bpmn:startEvent id="StartEvent_1">
      <bpmn:outgoing>Flow_1</bpmn:outgoing>
    </bpmn:startEvent>
    <bpmn:userTask id="Task_Input" name="输入数字">
      <bpmn:extensionElements>
        <camunda:formData>
          <camunda:formField id="number" label="请输入一个数字" type="string" />
        </camunda:formData>
      </bpmn:extensionElements>
      <bpmn:incoming>Flow_1</bpmn:incoming>
      <bpmn:outgoing>Flow_2</bpmn:outgoing>
    </bpmn:userTask>
    <bpmn:scriptTask id="Task_Check" name="检查数字">
      <bpmn:incoming>Flow_2</bpmn:incoming>
      <bpmn:outgoing>Flow_3</bpmn:outgoing>
      <bpmn:script>num = int(number)
if num &gt; 10:
    is_large = True
else:
    is_large = False</bpmn:script>
    </bpmn:scriptTask>
    <bpmn:exclusiveGateway id="Gateway_1" name="判断大小">
      <bpmn:incoming>Flow_3</bpmn:incoming>
      <bpmn:outgoing>Flow_4</bpmn:outgoing>
      <bpmn:outgoing>Flow_5</bpmn:outgoing>
    </bpmn:exclusiveGateway>
    <bpmn:scriptTask id="Task_Large" name="处理大数字">
      <bpmn:incoming>Flow_4</bpmn:incoming>
      <bpmn:outgoing>Flow_6</bpmn:outgoing>
      <bpmn:script>print('数字大于10')</bpmn:script>
    </bpmn:scriptTask>
    <bpmn:scriptTask id="Task_Small" name="处理小数字">
      <bpmn:incoming>Flow_5</bpmn:incoming>
      <bpmn:outgoing>Flow_7</bpmn:outgoing>
      <bpmn:script>print('数字小于等于10')</bpmn:script>
    </bpmn:scriptTask>
    <bpmn:endEvent id="EndEvent_1">
      <bpmn:incoming>Flow_6</bpmn:incoming>
      <bpmn:incoming>Flow_7</bpmn:incoming>
    </bpmn:endEvent>
    <bpmn:sequenceFlow id="Flow_1" sourceRef="StartEvent_1" targetRef="Task_Input" />
    <bpmn:sequenceFlow id="Flow_2" sourceRef="Task_Input" targetRef="Task_Check" />
    <bpmn:sequenceFlow id="Flow_3" sourceRef="Task_Check" targetRef="Gateway_1" />
    <bpmn:sequenceFlow id="Flow_4" name="大于10" sourceRef="Gateway_1" targetRef="Task_Large">
      <bpmn:conditionExpression xsi:type="bpmn:tFormalExpression">is_large == True</bpmn:conditionExpression>
    </bpmn:sequenceFlow>
    <bpmn:sequenceFlow id="Flow_5" name="小于等于10" sourceRef="Gateway_1" targetRef="Task_Small">
      <bpmn:conditionExpression xsi:type="bpmn:tFormalExpression">is_large == False</bpmn:conditionExpression>
    </bpmn:sequenceFlow>
    <bpmn:sequenceFlow id="Flow_6" sourceRef="Task_Large" targetRef="EndEvent_1" />
    <bpmn:sequenceFlow id="Flow_7" sourceRef="Task_Small" targetRef="EndEvent_1" />
  </bpmn:process>
</bpmn:definitions>'''

# 示例流程 4: 审批流程
APPROVAL_PROCESS = '''<?xml version="1.0" encoding="UTF-8"?>
<bpmn:definitions xmlns:bpmn="http://www.omg.org/spec/BPMN/20100524/MODEL" xmlns:camunda="http://camunda.org/schema/1.0/bpmn" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">
  <bpmn:process id="approval_process" name="审批流程" isExecutable="true">
    <bpmn:startEvent id="StartEvent_1">
      <bpmn:outgoing>Flow_1</bpmn:outgoing>
    </bpmn:startEvent>
    <bpmn:userTask id="Task_Submit" name="提交申请">
      <bpmn:extensionElements>
        <camunda:formData>
          <camunda:formField id="applicant" label="申请人" type="string" />
          <camunda:formField id="amount" label="申请金额" type="string" />
          <camunda:formField id="reason" label="申请理由" type="string" />
        </camunda:formData>
      </bpmn:extensionElements>
      <bpmn:incoming>Flow_1</bpmn:incoming>
      <bpmn:outgoing>Flow_2</bpmn:outgoing>
    </bpmn:userTask>
    <bpmn:scriptTask id="Task_Calculate" name="计算处理">
      <bpmn:incoming>Flow_2</bpmn:incoming>
      <bpmn:outgoing>Flow_3</bpmn:outgoing>
      <bpmn:script>amount_value = float(amount)
if amount_value &gt; 10000:
    need_approval = True
else:
    need_approval = False</bpmn:script>
    </bpmn:scriptTask>
    <bpmn:exclusiveGateway id="Gateway_1" name="需要审批?">
      <bpmn:incoming>Flow_3</bpmn:incoming>
      <bpmn:outgoing>Flow_4</bpmn:outgoing>
      <bpmn:outgoing>Flow_5</bpmn:outgoing>
    </bpmn:exclusiveGateway>
    <bpmn:userTask id="Task_Approve" name="审批">
      <bpmn:extensionElements>
        <camunda:formData>
          <camunda:formField id="approved" label="是否批准" type="boolean" />
          <camunda:formField id="comment" label="审批意见" type="string" />
        </camunda:formData>
      </bpmn:extensionElements>
      <bpmn:incoming>Flow_4</bpmn:incoming>
      <bpmn:outgoing>Flow_6</bpmn:outgoing>
    </bpmn:userTask>
    <bpmn:scriptTask id="Task_AutoApprove" name="自动通过">
      <bpmn:incoming>Flow_5</bpmn:incoming>
      <bpmn:outgoing>Flow_6</bpmn:outgoing>
      <bpmn:script>approved = True
comment = '金额小于10000，自动批准'
print('自动批准')</bpmn:script>
    </bpmn:scriptTask>
    <bpmn:endEvent id="EndEvent_1">
      <bpmn:incoming>Flow_6</bpmn:incoming>
    </bpmn:endEvent>
    <bpmn:sequenceFlow id="Flow_1" sourceRef="StartEvent_1" targetRef="Task_Submit" />
    <bpmn:sequenceFlow id="Flow_2" sourceRef="Task_Submit" targetRef="Task_Calculate" />
    <bpmn:sequenceFlow id="Flow_3" sourceRef="Task_Calculate" targetRef="Gateway_1" />
    <bpmn:sequenceFlow id="Flow_4" name="是" sourceRef="Gateway_1" targetRef="Task_Approve">
      <bpmn:conditionExpression xsi:type="bpmn:tFormalExpression">need_approval == True</bpmn:conditionExpression>
    </bpmn:sequenceFlow>
    <bpmn:sequenceFlow id="Flow_5" name="否" sourceRef="Gateway_1" targetRef="Task_AutoApprove">
      <bpmn:conditionExpression xsi:type="bpmn:tFormalExpression">need_approval == False</bpmn:conditionExpression>
    </bpmn:sequenceFlow>
    <bpmn:sequenceFlow id="Flow_6" sourceRef="Task_Approve" targetRef="EndEvent_1" />
    <bpmn:sequenceFlow id="Flow_7" sourceRef="Task_AutoApprove" targetRef="EndEvent_1" />
  </bpmn:process>
</bpmn:definitions>'''

# 示例流程 5: 订单处理流程
ORDER_PROCESS = '''<?xml version="1.0" encoding="UTF-8"?>
<bpmn:definitions xmlns:bpmn="http://www.omg.org/spec/BPMN/20100524/MODEL" xmlns:camunda="http://camunda.org/schema/1.0/bpmn" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">
  <bpmn:process id="order_process" name="订单处理流程" isExecutable="true">
    <bpmn:startEvent id="StartEvent_1">
      <bpmn:outgoing>Flow_1</bpmn:outgoing>
    </bpmn:startEvent>
    <bpmn:userTask id="Task_CreateOrder" name="创建订单">
      <bpmn:extensionElements>
        <camunda:formData>
          <camunda:formField id="customer" label="客户姓名" type="string" />
          <camunda:formField id="product" label="产品名称" type="string" />
          <camunda:formField id="quantity" label="数量" type="string" />
          <camunda:formField id="price" label="单价" type="string" />
        </camunda:formData>
      </bpmn:extensionElements>
      <bpmn:incoming>Flow_1</bpmn:incoming>
      <bpmn:outgoing>Flow_2</bpmn:outgoing>
    </bpmn:userTask>
    <bpmn:scriptTask id="Task_Calculate" name="计算总价">
      <bpmn:incoming>Flow_2</bpmn:incoming>
      <bpmn:outgoing>Flow_3</bpmn:outgoing>
      <bpmn:script>total = float(price) * int(quantity)
print(f'订单总价: {total}')</bpmn:script>
    </bpmn:scriptTask>
    <bpmn:scriptTask id="Task_CheckStock" name="检查库存">
      <bpmn:incoming>Flow_3</bpmn:incoming>
      <bpmn:outgoing>Flow_4</bpmn:outgoing>
      <bpmn:script># 模拟库存检查
qty = int(quantity)
if qty &lt;= 100:
    in_stock = True
else:
    in_stock = False</bpmn:script>
    </bpmn:scriptTask>
    <bpmn:exclusiveGateway id="Gateway_1" name="库存检查">
      <bpmn:incoming>Flow_4</bpmn:incoming>
      <bpmn:outgoing>Flow_5</bpmn:outgoing>
      <bpmn:outgoing>Flow_8</bpmn:outgoing>
    </bpmn:exclusiveGateway>
    <bpmn:userTask id="Task_Confirm" name="确认订单">
      <bpmn:extensionElements>
        <camunda:formData>
          <camunda:formField id="confirm" label="确认订单" type="boolean" />
        </camunda:formData>
      </bpmn:extensionElements>
      <bpmn:incoming>Flow_5</bpmn:incoming>
      <bpmn:outgoing>Flow_6</bpmn:outgoing>
    </bpmn:userTask>
    <bpmn:scriptTask id="Task_Reject" name="拒绝订单">
      <bpmn:incoming>Flow_8</bpmn:incoming>
      <bpmn:outgoing>Flow_7</bpmn:outgoing>
      <bpmn:script>print('库存不足，订单被拒绝')</bpmn:script>
    </bpmn:scriptTask>
    <bpmn:endEvent id="EndEvent_Success">
      <bpmn:incoming>Flow_6</bpmn:incoming>
    </bpmn:endEvent>
    <bpmn:endEvent id="EndEvent_Fail">
      <bpmn:incoming>Flow_7</bpmn:incoming>
    </bpmn:endEvent>
    <bpmn:sequenceFlow id="Flow_1" sourceRef="StartEvent_1" targetRef="Task_CreateOrder" />
    <bpmn:sequenceFlow id="Flow_2" sourceRef="Task_CreateOrder" targetRef="Task_Calculate" />
    <bpmn:sequenceFlow id="Flow_3" sourceRef="Task_Calculate" targetRef="Task_CheckStock" />
    <bpmn:sequenceFlow id="Flow_4" sourceRef="Task_CheckStock" targetRef="Gateway_1" />
    <bpmn:sequenceFlow id="Flow_5" name="有库存" sourceRef="Gateway_1" targetRef="Task_Confirm">
      <bpmn:conditionExpression xsi:type="bpmn:tFormalExpression">in_stock == True</bpmn:conditionExpression>
    </bpmn:sequenceFlow>
    <bpmn:sequenceFlow id="Flow_8" name="无库存" sourceRef="Gateway_1" targetRef="Task_Reject">
      <bpmn:conditionExpression xsi:type="bpmn:tFormalExpression">in_stock == False</bpmn:conditionExpression>
    </bpmn:sequenceFlow>
    <bpmn:sequenceFlow id="Flow_6" sourceRef="Task_Confirm" targetRef="EndEvent_Success" />
    <bpmn:sequenceFlow id="Flow_7" sourceRef="Task_Reject" targetRef="EndEvent_Fail" />
  </bpmn:process>
</bpmn:definitions>'''

# 示例流程列表
SAMPLE_PROCESSES = [
    {
        'name': '01-简单流程',
        'xml': SIMPLE_PROCESS,
        'description': '最简单的流程，只有开始和结束事件，用于学习基本结构'
    },
    {
        'name': '02-用户任务流程',
        'xml': USER_TASK_PROCESS,
        'description': '包含用户任务的流程，需要填写表单（姓名、邮箱、同意条款）'
    },
    {
        'name': '03-条件分支流程',
        'xml': CONDITIONAL_PROCESS,
        'description': '包含条件分支的流程，根据输入数字的大小走不同路径'
    },
    {
        'name': '04-审批流程',
        'xml': APPROVAL_PROCESS,
        'description': '完整的审批流程，包含申请提交、金额判断、审批等步骤'
    },
    {
        'name': '05-订单处理流程',
        'xml': ORDER_PROCESS,
        'description': '订单处理流程，包含订单创建、库存检查、订单确认等'
    },
]


async def init_sample_processes():
    """初始化示例流程"""
    async with AsyncSessionLocal.begin() as session:
        repo_manager = RepoManager(session=session)
        repo = repo_manager.get_repo(BpmnProcess)
        
        # 检查是否已存在示例流程
        existing = await repo.all()
        existing_names = [p.name for p in existing]
        
        created_count = 0
        for process_data in SAMPLE_PROCESSES:
            if process_data['name'] in existing_names:
                print(f"流程 '{process_data['name']}' 已存在，跳过")
                continue
            
            try:
                process = await repo.create({
                    'name': process_data['name'],
                    'xml_definition': process_data['xml']
                })
                print(f"✓ 创建流程: {process_data['name']}")
                print(f"  描述: {process_data['description']}")
                created_count += 1
            except Exception as e:
                print(f"✗ 创建流程 '{process_data['name']}' 失败: {e}")
        
        print(f"\n完成！共创建 {created_count} 个示例流程")
        if created_count == 0:
            print("所有示例流程已存在，无需重复创建")


if __name__ == '__main__':
    asyncio.run(init_sample_processes())

