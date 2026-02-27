import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface UserRequest {
  name: string;
  email: string;
  password: string;
}

export interface UserResponse {
  id: string;
  name: string;
  email: string;
}

export interface TaskRequest {
  title: string;
  description: string;
  folderId?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface TaskResponse {
  id: string;
  title: string;
  description: string;
}

export interface TaskSummaryResponse {
  id: string;
  title: string;
  description: string;
  folderId?: string | null;
  updatedAt: string;
  blockCount: number;
}

export interface TaskDetailResponse {
  id: string;
  title: string;
  description: string;
  folderId?: string | null;
  createdAt: string;
  updatedAt: string;
  blocks: BlockResponse[];
}

export interface FolderResponse {
  id: string;
  name: string;
  parentId?: string | null;
}

export interface TaskTreeItemResponse {
  id: string;
  title: string;
  description: string;
  folderId?: string | null;
  updatedAt: string;
}

export interface TaskTreeResponse {
  folders: FolderResponse[];
  tasks: TaskTreeItemResponse[];
}

export interface TaskDocumentContent {
  text: string;
  drawing: {
    strokes: Array<{
      color: string;
      width: number;
      points: Array<[number, number]>;
    }>;
  };
}

export interface TaskDocumentResponse {
  taskId: string;
  content: TaskDocumentContent;
  version: number;
  updatedAt: string;
}

export interface BlockRequest {
  type: 'TEXT' | 'DRAW';
  orderIndex: number;
  textContent?: string;
  drawingData?: string;
  createdAt: string;
  updatedAt: string;
}

export interface BlockResponse {
  id: string;
  taskId: string;
  type: 'TEXT' | 'DRAW';
  orderIndex: number;
  textContent?: string;
  drawingData?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateFolderRequest {
  name: string;
  parentId?: string | null;
}

export interface MoveTaskRequest {
  folderId?: string | null;
}

export interface UpsertTaskDocumentRequest {
  content: TaskDocumentContent;
  version?: number | null;
}

@Injectable({ providedIn: 'root' })
export class ApiService {
  constructor(private readonly http: HttpClient) {}

  register(payload: UserRequest): Observable<UserResponse> {
    return this.http.post<UserResponse>('/api/users/create', payload);
  }

  login(payload: UserRequest): Observable<UserResponse> {
    return this.http.post<UserResponse>('/api/users/login', payload);
  }

  me(): Observable<UserResponse> {
    return this.http.get<UserResponse>('/api/users/me');
  }

  logout(): Observable<void> {
    return this.http.post<void>('/api/users/logout', {});
  }

  createTask(payload: TaskRequest): Observable<TaskResponse> {
    return this.http.post<TaskResponse>('/api/tasks/event/task', payload);
  }

  listTasks(): Observable<TaskSummaryResponse[]> {
    return this.http.get<TaskSummaryResponse[]>('/api/tasks/event/tasks');
  }

  getTask(taskId: string): Observable<TaskDetailResponse> {
    return this.http.get<TaskDetailResponse>(`/api/tasks/event/task/${taskId}`);
  }

  createBlock(taskId: string, payload: BlockRequest): Observable<BlockResponse> {
    return this.http.post<BlockResponse>(`/api/tasks/event/${taskId}/blocks`, payload);
  }

  getTree(): Observable<TaskTreeResponse> {
    return this.http.get<TaskTreeResponse>('/api/tasks/event/tree');
  }

  createFolder(payload: CreateFolderRequest): Observable<FolderResponse> {
    return this.http.post<FolderResponse>('/api/tasks/event/folders', payload);
  }

  moveTask(taskId: string, payload: MoveTaskRequest): Observable<TaskSummaryResponse> {
    return this.http.patch<TaskSummaryResponse>(`/api/tasks/event/tasks/${taskId}/move`, payload);
  }

  getTaskDocument(taskId: string): Observable<TaskDocumentResponse> {
    return this.http.get<TaskDocumentResponse>(`/api/tasks/event/tasks/${taskId}/document`);
  }

  upsertTaskDocument(taskId: string, payload: UpsertTaskDocumentRequest): Observable<TaskDocumentResponse> {
    return this.http.put<TaskDocumentResponse>(`/api/tasks/event/tasks/${taskId}/document`, payload);
  }
}
