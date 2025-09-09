import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Task } from './task.model';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class TasksService {
  // если сервер на другом порту — измени URL
  private baseUrl = 'http://localhost:3000/api/tasks';

  constructor(private http: HttpClient) {}

  list(): Observable<Task[]> {
    return this.http.get<Task[]>(this.baseUrl);
  }

  create(title: string): Observable<Task> {
    return this.http.post<Task>(this.baseUrl, { title, completed: false });
  }

  patch(id: string, patch: Partial<Pick<Task, 'title' | 'completed'>>): Observable<Task> {
    return this.http.patch<Task>(`${this.baseUrl}/${id}`, patch);
  }

  delete(id: string): Observable<Task> {
    return this.http.delete<Task>(`${this.baseUrl}/${id}`);
  }
}
