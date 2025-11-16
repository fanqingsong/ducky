from tempfile import NamedTemporaryFile
from typing import Tuple, Optional

from SpiffWorkflow.bpmn.workflow import BpmnWorkflow
from SpiffWorkflow.camunda.parser.CamundaParser import CamundaParser
from SpiffWorkflow.camunda.specs.UserTask import UserTask
from SpiffWorkflow.bpmn.serializer.BpmnSerializer import BpmnSerializer
from SpiffWorkflow.exceptions import WorkflowTaskExecException
from loguru import logger

from db.models import BpmnProcess, BpmnProcessInstance


class StopWorkflow(Exception):
    """Signal to stop workflow execution"""


class BpmnRunner(object):
    """Manager for the creation and execution of a bpmn workflow"""

    def __init__(self, repo_manager):
        self.serializer = BpmnSerializer()
        self.repo_manager = repo_manager

    async def create_process_instance(self, process: BpmnProcess, data: Optional[dict] = None) -> BpmnProcessInstance:
        """Create a new process instance"""

        parser = CamundaParser()
        with NamedTemporaryFile(mode='w+t') as f:
            f.write(process.xml_definition)
            f.seek(0)
            parser.add_bpmn_file(f.name)
        
        # 从 XML 中提取 process id（不是 name）
        import xml.etree.ElementTree as ET
        root = ET.fromstring(process.xml_definition)
        # 查找 process 元素
        process_elem = root.find('.//{http://www.omg.org/spec/BPMN/20100524/MODEL}process')
        process_id = process_elem.get('id') if process_elem is not None else process.name
        
        wf_spec = parser.get_spec(process_id)
        workflow = BpmnWorkflow(wf_spec)
        
        # 在创建实例时，先尝试执行到第一个用户任务
        # 如果遇到脚本任务错误，尝试恢复并返回用户任务
        next_task = '等待输入'
        try:
            state, next_task = self._run_to_next_state(workflow, data)
        except WorkflowTaskExecException as e:
            # 捕获脚本任务执行错误，尝试恢复
            logger.warning(f"Script task failed during instance creation: {e}")
            try:
                # 尝试获取用户任务
                ready_tasks = workflow.get_ready_user_tasks()
                if len(ready_tasks) > 0:
                    task = ready_tasks[0]
                    state = self.serializer.serialize_workflow(workflow, include_spec=True)
                    next_task = task.get_description()
                    logger.info(f"Recovered: returning user task {next_task}")
                else:
                    # 如果无法获取用户任务，尝试从 BPMN XML 中查找第一个用户任务
                    logger.warning("No ready user tasks, trying to find first user task from BPMN")
                    # 从 XML 中查找第一个用户任务
                    user_tasks = root.findall('.//{http://www.omg.org/spec/BPMN/20100524/MODEL}userTask')
                    if user_tasks:
                        first_user_task = user_tasks[0]
                        next_task = first_user_task.get('name', '等待输入')
                        logger.info(f"Found first user task from BPMN: {next_task}")
                    # 序列化当前状态（即使有错误）
                    state = self.serializer.serialize_workflow(workflow, include_spec=True)
            except Exception as e2:
                # 如果无法恢复，尝试从 BPMN XML 中查找第一个用户任务
                logger.warning(f"Failed to recover from script error: {e2}, trying to find user task from BPMN")
                try:
                    user_tasks = root.findall('.//{http://www.omg.org/spec/BPMN/20100524/MODEL}userTask')
                    if user_tasks:
                        first_user_task = user_tasks[0]
                        next_task = first_user_task.get('name', '等待输入')
                        logger.info(f"Found first user task from BPMN: {next_task}")
                    # 序列化当前状态
                    state = self.serializer.serialize_workflow(workflow, include_spec=True)
                except Exception as e3:
                    # 如果完全无法恢复，重新抛出原始异常
                    logger.error(f"Completely failed to recover from script error: {e3}")
                    raise e
        except Exception as e:
            # 其他异常直接抛出
            raise
        
        repo = self.repo_manager.get_repo(BpmnProcessInstance)
        return await repo.create({'bpmn_process_id': process.id, 'state': state, 'current_task': next_task})

    async def run(self, process_instance: BpmnProcessInstance, data: Optional[dict] = None) -> BpmnProcessInstance:
        """Run workflow to the next ready state"""

        workflow = self.serializer.deserialize_workflow(process_instance.state)
        if workflow.is_completed():
            return process_instance
        state, next_task = self._run_to_next_state(workflow, data)
        repo = self.repo_manager.get_repo(BpmnProcessInstance)
        return await repo.update(process_instance.id, {'state': state, 'current_task': next_task})

    def _run_to_next_state(self, workflow: BpmnWorkflow, data: Optional[dict] = None) -> Tuple[str, str]:
        if data is None:
            data = {}
        
        # 先将数据更新到 workflow
        if data:
            for key, value in data.items():
                workflow.data[key] = value
        
        try:
            # 执行引擎步骤，但捕获脚本任务错误
            workflow.do_engine_steps()
            ready_tasks = workflow.get_ready_user_tasks()
            
            # while there's a ready user task, attempt to complete it
            while len(ready_tasks) > 0:
                for task in ready_tasks:
                    if isinstance(task.task_spec, UserTask):
                        # 检查所有必需字段是否都有数据
                        all_fields_have_data = True
                        for field in task.task_spec.form.fields:
                            if field.id not in data:
                                all_fields_have_data = False
                                break
                        
                        if not all_fields_have_data:
                            # 缺少数据，停止工作流，等待用户输入
                            logger.info(f"Waiting for user input for task: {task.get_description()}")
                            state = self.serializer.serialize_workflow(workflow, include_spec=True)
                            task_name = task.get_description()
                            return state, task_name
                        
                        # 所有字段都有数据，完成任务
                        for field in task.task_spec.form.fields:
                            value = data.get(field.id)
                            task.update_data_var(field.id, value)
                            # 同时更新到 workflow.data
                            workflow.data[field.id] = value
                        workflow.complete_task_from_id(task.id)
                        logger.info(
                            f'Completed Task: ({task.get_name()}) {task.get_description()}')
                    # run intermediate engine tasks
                    workflow.do_engine_steps()
                    # update remaining user tasks
                    ready_tasks = workflow.get_ready_user_tasks()
        except StopWorkflow:
            pass
        except WorkflowTaskExecException as e:
            # 捕获脚本任务执行错误（通常是缺少数据）
            logger.warning(f"Script task execution failed (likely missing data): {e}")
            # 检查是否有用户任务需要输入
            try:
                ready_tasks = workflow.get_ready_user_tasks()
                if len(ready_tasks) > 0:
                    task = ready_tasks[0]
                    state = self.serializer.serialize_workflow(workflow, include_spec=True)
                    task_name = task.get_description()
                    return state, task_name
            except Exception as e2:
                logger.error(f"Failed to get ready user tasks after script error: {e2}")
            # 如果无法获取用户任务，重新抛出异常
            raise
        except Exception as e:
            # 其他异常直接抛出
            raise
        
        # serialize the current state of the workflow
        state = self.serializer.serialize_workflow(workflow, include_spec=True)
        next_task = self._get_next_task(workflow)
        task_name = next_task.get_description() if next_task else 'END'
        return state, task_name

    def _get_next_task(self, workflow: BpmnWorkflow):
        """Get the next ready task"""

        if workflow.is_completed():
            return None
        return workflow.get_ready_user_tasks()[0]
