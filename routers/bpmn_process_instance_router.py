from typing import List, Optional
import json

from fastapi import APIRouter, Depends, Body, HTTPException
from loguru import logger

from db.models import BpmnProcessInstance, BpmnProcess
from db.repos import RepoManager, get_repo_manager
from schemas import BpmnProcessInstanceSchema
from bpmn import BpmnRunner, get_bpmn_runner
from SpiffWorkflow.bpmn.serializer.BpmnSerializer import BpmnSerializer

router = APIRouter(prefix='/bpmn_process_instances', tags=['BpmnProcessInstance'])


@router.get('', response_model=List[BpmnProcessInstanceSchema])
async def get_all(repo_manager: RepoManager = Depends(get_repo_manager)):
    logger.info("Fetching all processes...")
    repo = repo_manager.get_repo(BpmnProcessInstance)
    return await repo.all()


@router.get('/{id}', response_model=BpmnProcessInstanceSchema)
async def get_one(id: int, repo_manager: RepoManager = Depends(get_repo_manager)):
    repo = repo_manager.get_repo(BpmnProcessInstance)
    return await repo.get(id)


@router.get('/{id}/task_topology')
async def get_task_topology(
    id: int,
    repo_manager: RepoManager = Depends(get_repo_manager),
    bpmn_runner: BpmnRunner = Depends(get_bpmn_runner)
):
    """获取流程实例的任务拓扑图信息"""
    instance_repo = repo_manager.get_repo(BpmnProcessInstance)
    process_repo = repo_manager.get_repo(BpmnProcess)
    
    instance = await instance_repo.get(id)
    if instance is None:
        raise HTTPException(404, f'Process instance with id {id} not found')
    
    process = await process_repo.get(instance.bpmn_process_id)
    if process is None:
        raise HTTPException(404, f'Process with id {instance.bpmn_process_id} not found')
    
    serializer = BpmnSerializer()
    
    try:
        # 反序列化工作流
        workflow = serializer.deserialize_workflow(instance.state)
        
        # 获取所有任务节点
        completed_tasks = []
        current_tasks = []
        future_tasks = []
        
        # 从工作流中获取已完成的任务
        # 获取所有任务
        try:
            all_tasks = workflow.get_tasks()
            for task in all_tasks:
                try:
                    if hasattr(task, 'state'):
                        state = task.state
                        if state == 'COMPLETED':
                            # 获取任务名称
                            task_name = ''
                            if hasattr(task, 'get_description'):
                                try:
                                    task_name = task.get_description()
                                except:
                                    pass
                            
                            if not task_name and hasattr(task, 'task_spec'):
                                if hasattr(task.task_spec, 'name'):
                                    task_name = task.task_spec.name
                                elif hasattr(task.task_spec, 'description'):
                                    task_name = task.task_spec.description
                            
                            if task_name and task_name not in [t['name'] for t in completed_tasks]:
                                task_id = getattr(task, 'id', '')
                                completed_tasks.append({
                                    'name': task_name,
                                    'id': str(task_id),
                                    'state': 'completed'
                                })
                except Exception as e:
                    logger.debug(f"Error processing task: {e}")
                    continue
        except Exception as e:
            logger.warning(f"Error getting tasks from workflow: {e}")
        
        # 获取当前就绪的任务
        try:
            ready_tasks = workflow.get_ready_user_tasks()
            for task in ready_tasks:
                task_name = ''
                if hasattr(task, 'get_description'):
                    try:
                        task_name = task.get_description()
                    except:
                        pass
                
                if not task_name and hasattr(task, 'task_spec'):
                    if hasattr(task.task_spec, 'name'):
                        task_name = task.task_spec.name
                    elif hasattr(task.task_spec, 'description'):
                        task_name = task.task_spec.description
                
                if task_name and task_name not in [t['name'] for t in current_tasks]:
                    current_tasks.append({
                        'name': task_name,
                        'id': str(getattr(task, 'id', '')),
                        'state': 'current'
                    })
        except Exception as e:
            logger.warning(f"Error getting ready tasks: {e}")
        
        # 如果没有当前任务，检查是否有其他就绪任务
        if not current_tasks and not workflow.is_completed():
            # 尝试从工作流中获取下一个任务
            all_tasks = workflow.get_tasks()
            for task in all_tasks:
                if hasattr(task, 'state') and task.state == 'READY':
                    task_name = ''
                    if hasattr(task, 'get_description'):
                        task_name = task.get_description()
                    elif hasattr(task, 'task_spec') and hasattr(task.task_spec, 'name'):
                        task_name = task.task_spec.name
                    elif hasattr(task, 'task_spec') and hasattr(task.task_spec, 'description'):
                        task_name = task.task_spec.description
                    
                    if task_name and task_name not in [t['name'] for t in current_tasks]:
                        current_tasks.append({
                            'name': task_name,
                            'id': getattr(task, 'id', ''),
                            'state': 'current'
                        })
        
        # 解析 BPMN XML 获取所有任务节点
        import xml.etree.ElementTree as ET
        root = ET.fromstring(process.xml_definition)
        
        all_bpmn_tasks = []
        
        # 查找所有任务节点
        for task_type in ['userTask', 'scriptTask', 'serviceTask', 'task']:
            tasks = root.findall(f'.//{{http://www.omg.org/spec/BPMN/20100524/MODEL}}{task_type}')
            if tasks:
                for task in tasks:
                    task_name = task.get('name', '')
                    task_id = task.get('id', '')
                    if task_name:
                        all_bpmn_tasks.append({
                            'name': task_name,
                            'id': task_id,
                            'type': task_type
                        })
        
        # 找出未来任务（在 BPMN 中定义但未完成且不是当前任务）
        completed_task_names = [t['name'] for t in completed_tasks]
        current_task_names = [t['name'] for t in current_tasks]
        
        for bpmn_task in all_bpmn_tasks:
            if (bpmn_task['name'] not in completed_task_names and 
                bpmn_task['name'] not in current_task_names):
                future_tasks.append({
                    'name': bpmn_task['name'],
                    'id': bpmn_task['id'],
                    'state': 'future'
                })
        
        # 解析流程结构（节点和连接）
        nodes = []
        edges = []
        
        # 添加开始事件
        start_events = root.findall('.//{http://www.omg.org/spec/BPMN/20100524/MODEL}startEvent')
        for event in start_events:
            event_id = event.get('id', '')
            event_name = event.get('name', '开始')
            nodes.append({
                'id': event_id,
                'name': event_name,
                'type': 'startEvent',
                'state': 'completed' if completed_tasks else 'current'
            })
        
        # 添加所有任务节点
        for bpmn_task in all_bpmn_tasks:
            task_state = 'future'
            if bpmn_task['name'] in completed_task_names:
                task_state = 'completed'
            elif bpmn_task['name'] in current_task_names:
                task_state = 'current'
            
            nodes.append({
                'id': bpmn_task['id'],
                'name': bpmn_task['name'],
                'type': bpmn_task['type'],
                'state': task_state
            })
        
        # 添加结束事件
        end_events = root.findall('.//{http://www.omg.org/spec/BPMN/20100524/MODEL}endEvent')
        for event in end_events:
            event_id = event.get('id', '')
            event_name = event.get('name', '结束')
            task_state = 'current' if workflow.is_completed() else 'future'
            nodes.append({
                'id': event_id,
                'name': event_name,
                'type': 'endEvent',
                'state': task_state
            })
        
        # 解析顺序流（连接）
        sequence_flows = root.findall('.//{http://www.omg.org/spec/BPMN/20100524/MODEL}sequenceFlow')
        for flow in sequence_flows:
            source = flow.get('sourceRef', '')
            target = flow.get('targetRef', '')
            flow_id = flow.get('id', '')
            flow_name = flow.get('name', '')
            
            if source and target:
                edges.append({
                    'id': flow_id,
                    'source': source,
                    'target': target,
                    'name': flow_name
                })
        
        return {
            'instance_id': instance.id,
            'process_id': instance.bpmn_process_id,
            'current_task': instance.current_task,
            'is_completed': workflow.is_completed(),
            'completed_tasks': completed_tasks,
            'current_tasks': current_tasks,
            'future_tasks': future_tasks,
            'nodes': nodes,
            'edges': edges
        }
        
    except Exception as e:
        logger.error(f"Error parsing task topology: {e}")
        raise HTTPException(500, f"Failed to parse task topology: {str(e)}")
