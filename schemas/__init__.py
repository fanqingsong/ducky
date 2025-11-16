from typing import Optional
from pydantic import BaseModel


class BpmnProcessSchema(BaseModel):
    id: int
    name: str
    xml_definition: str

    class Config:
        orm_mode = True


class BpmnProcessInstanceSchema(BaseModel):
    id: int
    bpmn_process_id: int
    current_task: str

    class Config:
        orm_mode = True
