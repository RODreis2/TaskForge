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
  createdAt: string;
  updatedAt: string;
}

export interface TaskResponse {
  id: string;
  title: string;
  description: string;
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
  type: string;
  orderIndex: number;
  textContent?: string;
  drawingData?: string;
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

  createBlock(taskId: string, payload: BlockRequest): Observable<BlockResponse> {
    return this.http.post<BlockResponse>(`/api/tasks/event/${taskId}/blocks`, payload);
  }
}
