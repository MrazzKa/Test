import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { CheckboxModule } from 'primeng/checkbox';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { ToolbarModule } from 'primeng/toolbar';
import { ToastModule } from 'primeng/toast';
import { TooltipModule } from 'primeng/tooltip';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { TagModule } from 'primeng/tag';
import { MessageService, ConfirmationService } from 'primeng/api';

import { TasksService } from './tasks.service';
import { Task } from './task.model';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    CommonModule, FormsModule,
    TableModule, ButtonModule, CheckboxModule,
    DialogModule, InputTextModule, ToolbarModule, ToastModule, TooltipModule,
    ConfirmDialogModule, TagModule
  ],
  providers: [MessageService, ConfirmationService],
  template: `
    <div class="app-container">
      <p-toast position="top-right" [life]="1800"></p-toast>
      <p-confirmDialog></p-confirmDialog>

      <!-- Toolbar -->
      <div class="card toolbar-card">
        <div class="toolbar-content">
          <div class="toolbar-left">
            <h1 class="app-title">Мини-Трекер Задач</h1>
            <span class="tasks-count">{{ tasks().length }} задач</span>
          </div>
          <div class="toolbar-right">
            <div class="search-container">
              <i class="pi pi-search search-icon"></i>
              <input 
                #searchInput
                type="text" 
                pInputText 
                placeholder="Поиск задач..."
                (input)="filterTasks($event)"
                class="search-input"
              />
            </div>
            <button 
              pButton 
              label="Добавить задачу" 
              icon="pi pi-plus" 
              class="btn btn-primary add-btn"
              (click)="openAdd()"
            ></button>
          </div>
        </div>
      </div>

      <!-- Table -->
      <div class="card table-card">
        <p-table
          #table
          [value]="filteredTasks()"
          [loading]="loading()"
          dataKey="id"
          responsiveLayout="scroll"
          [tableStyle]="{'min-width':'800px'}"
          [rowHover]="true"
          [paginator]="true"
          [rows]="10"
          [showCurrentPageReport]="true"
          currentPageReportTemplate="Показано {first} - {last} из {totalRecords} задач"
        >
          <ng-template pTemplate="header">
            <tr>
              <th style="width: 300px">ID Задачи</th>
              <th>Название</th>
              <th style="width: 150px; text-align:center;">Статус</th>
              <th style="width: 100px; text-align:center;">Действия</th>
            </tr>
          </ng-template>

          <ng-template pTemplate="body" let-task let-rowIndex="rowIndex">
            <tr [class.zebra-even]="rowIndex % 2 === 0" [class.zebra-odd]="rowIndex % 2 === 1">
              <td>
                <span class="task-id">{{ task.id }}</span>
              </td>
              <td>
                <span class="task-title" [class.completed]="task.completed">
                  {{ task.title }}
                </span>
              </td>
              <td class="text-center">
                <div class="status-badge" [class.completed]="task.completed" [class.active]="!task.completed">
                  <p-checkbox
                    [binary]="true"
                    [ngModel]="task.completed"
                    (onChange)="toggleCompleted(task, $event.checked)"
                    inputId="cb-{{task.id}}"
                    [aria-label]="'Отметить задачу как ' + (task.completed ? 'невыполненную' : 'выполненную')"
                  ></p-checkbox>
                  <p-tag 
                    [value]="task.completed ? 'Готово' : 'Активна'"
                    [severity]="task.completed ? 'success' : 'info'"
                    [style]="{'font-size': '12px', 'padding': '2px 8px'}"
                  ></p-tag>
                </div>
              </td>
              <td class="text-center">
                <button
                  pButton
                  icon="pi pi-trash"
                  class="p-button-rounded p-button-text delete-btn"
                  (click)="confirmDelete(task)"
                  [disabled]="busy()"
                  [pTooltip]="'Удалить задачу'"
                  tooltipPosition="top"
                  aria-label="Удалить задачу"
                ></button>
              </td>
            </tr>
          </ng-template>

          <ng-template pTemplate="emptymessage">
            <tr>
              <td colspan="4" class="empty-state">
                <div class="empty-icon">📝</div>
                <h3>Нет задач</h3>
                <p>Добавьте свою первую задачу</p>
              </td>
            </tr>
          </ng-template>
        </p-table>
      </div>

      <!-- Add Task Dialog -->
      <p-dialog
        header="Добавление задачи"
        [(visible)]="addVisible"
        [modal]="true"
        [draggable]="false"
        [style]="{width: '420px'}"
        (onShow)="newTitle=''"
        (onHide)="newTitle=''"
      >
        <div class="dialog-content">
          <div class="form-group">
            <label for="title" class="form-label">Название задачи</label>
            <input 
              id="title" 
              type="text" 
              pInputText 
              [(ngModel)]="newTitle" 
              placeholder="Введите название задачи..."
              (keyup.enter)="create()"
              (keyup.escape)="addVisible=false"
              class="input"
            />
          </div>
          <div class="dialog-actions">
            <button 
              pButton 
              label="Отмена" 
              class="btn btn-text"
              (click)="addVisible=false"
            ></button>
            <button 
              pButton 
              label="Создать" 
              icon="pi pi-check" 
              class="btn btn-primary"
              (click)="create()" 
              [disabled]="!newTitle.trim() || busy()"
            ></button>
          </div>
        </div>
      </p-dialog>
    </div>
  `,
  styles: [`
    :host { 
      display: block; 
      padding: 0;
      margin: 0;
    }
    
    .text-center { text-align: center; }
    
    /* Toolbar */
    .toolbar-card {
      margin-bottom: 20px;
    }
    
    .toolbar-content {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 16px 20px;
    }
    
    .toolbar-left {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }
    
    .app-title {
      font-size: 24px;
      font-weight: 600;
      margin: 0;
      color: var(--text);
      letter-spacing: -0.025em;
    }
    
    .tasks-count {
      font-size: 14px;
      color: var(--muted);
      font-weight: 500;
    }
    
    .toolbar-right {
      display: flex;
      align-items: center;
      gap: 16px;
    }
    
    .search-container {
      position: relative;
      width: 260px;
    }
    
    .search-icon {
      position: absolute;
      left: 12px;
      top: 50%;
      transform: translateY(-50%);
      color: var(--muted);
      font-size: 14px;
      pointer-events: none;
    }
    
    .search-input {
      width: 100%;
      padding: 8px 12px 8px 36px;
      background: var(--surface-2);
      border: 1px solid var(--border);
      border-radius: 10px;
      color: var(--text);
      font-size: 14px;
    }
    
    .search-input:focus {
      outline: none;
      border-color: var(--accent);
      box-shadow: 0 0 0 3px rgba(164, 60%, 45%, 0.1);
    }
    
    .add-btn {
      height: 36px;
      padding: 0 16px;
      font-size: 14px;
      font-weight: 500;
    }
    
    /* Table */
    .table-card {
      overflow: hidden;
    }
    
    .p-datatable {
      border: none;
    }
    
    .p-datatable .p-datatable-thead > tr > th {
      background: var(--surface);
      border: none;
      border-bottom: 1px solid var(--border);
      padding: 16px 20px;
      font-weight: 600;
      color: var(--text);
      font-size: 12px;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      position: sticky;
      top: 0;
      z-index: 1;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    }
    
    .p-datatable .p-datatable-tbody > tr {
      transition: background-color 0.15s ease;
    }
    
    .p-datatable .p-datatable-tbody > tr:hover {
      background: var(--surface-2);
    }
    
    .p-datatable .p-datatable-tbody > tr > td {
      border: none;
      padding: 16px 20px;
      border-bottom: 1px solid var(--border);
    }
    
    .zebra-even {
      background: var(--surface);
    }
    
    .zebra-odd {
      background: var(--surface-2);
    }
    
    .task-title {
      font-weight: 500;
      color: var(--text);
    }
    
    .task-title.completed {
      color: var(--muted);
      text-decoration: line-through;
    }
    
    .delete-btn {
      color: var(--danger);
      background: transparent;
      border: none;
      padding: 8px;
      border-radius: 6px;
      transition: all 0.15s ease;
    }
    
    .delete-btn:hover {
      background: rgba(4, 70%, 55%, 0.1);
      color: var(--danger);
    }
    
    /* Dialog */
    .dialog-content {
      padding: 20px;
    }
    
    .form-group {
      margin-bottom: 20px;
    }
    
    .form-label {
      display: block;
      font-weight: 500;
      color: var(--text);
      margin-bottom: 8px;
      font-size: 14px;
    }
    
    .dialog-actions {
      display: flex;
      gap: 12px;
      justify-content: flex-end;
    }
    
    /* Empty state */
    .empty-state {
      text-align: center;
      padding: 40px 20px;
      color: var(--muted);
    }
    
    .empty-icon {
      font-size: 48px;
      margin-bottom: 16px;
      opacity: 0.5;
    }
    
    .empty-state h3 {
      font-size: 18px;
      font-weight: 600;
      color: var(--text);
      margin: 0 0 8px 0;
    }
    
    .empty-state p {
      margin: 0;
      font-size: 14px;
    }
    
    /* Responsive */
    @media (max-width: 768px) {
      .toolbar-content {
        flex-direction: column;
        gap: 16px;
        align-items: stretch;
      }
      
      .toolbar-right {
        justify-content: space-between;
      }
      
      .search-container {
        width: 100%;
        max-width: 200px;
      }
      
      .p-datatable .p-datatable-thead > tr > th,
      .p-datatable .p-datatable-tbody > tr > td {
        padding: 12px 16px;
      }
    }
    
    @media (max-width: 480px) {
      .toolbar-content {
        padding: 16px;
      }
      
      .app-title {
        font-size: 20px;
      }
      
      .search-container {
        max-width: none;
      }
    }
  `]
})
export class AppComponent implements OnInit {
  tasks = signal<Task[]>([]);
  filteredTasks = signal<Task[]>([]);
  loading = signal<boolean>(false);
  busy = signal<boolean>(false);

  addVisible = false;
  newTitle = '';
  searchQuery = '';

  constructor(
    private api: TasksService, 
    private msg: MessageService,
    private confirmationService: ConfirmationService
  ) {}

  ngOnInit() { this.reload(); }

  reload() {
    this.loading.set(true);
    this.api.list().subscribe({
      next: data => {
        this.tasks.set(data);
        this.applyFilter();
      },
      error: err => this.toast('error', 'Ошибка загрузки', err?.error?.message || String(err)),
      complete: () => this.loading.set(false)
    });
  }

  filterTasks(event: Event) {
    const target = event.target as HTMLInputElement;
    this.searchQuery = target.value.toLowerCase();
    this.applyFilter();
  }

  applyFilter() {
    if (!this.searchQuery.trim()) {
      this.filteredTasks.set(this.tasks());
      return;
    }
    
    const filtered = this.tasks().filter(task => 
      task.title.toLowerCase().includes(this.searchQuery) ||
      task.id.toLowerCase().includes(this.searchQuery)
    );
    this.filteredTasks.set(filtered);
  }

  openAdd() {
    this.addVisible = true;
    this.newTitle = '';
  }

  create() {
    const title = this.newTitle.trim();
    if (!title) return;

    this.busy.set(true);
    this.api.create(title).subscribe({
      next: t => {
        this.tasks.set([t, ...this.tasks()]);
        this.applyFilter();
        this.addVisible = false;
        this.toast('success', 'Создано', `Задача "${t.title}" добавлена`);
      },
      error: err => this.toast('error', 'Ошибка создания', err?.error?.message || String(err)),
      complete: () => this.busy.set(false)
    });
  }

  toggleCompleted(task: Task, checked: boolean) {
    const before = this.tasks();
    this.tasks.set(before.map(t => t.id === task.id ? { ...t, completed: checked } : t));
    this.applyFilter();

    this.api.patch(task.id, { completed: checked }).subscribe({
      next: () => this.toast('success', checked ? 'Готово' : 'Снят статус', 'Статус задачи обновлён'),
      error: err => {
        this.tasks.set(before);
        this.applyFilter();
        this.toast('error', 'Ошибка обновления', err?.error?.message || String(err));
      }
    });
  }

  confirmDelete(task: Task) {
    this.confirmationService.confirm({
      message: `Удалить задачу «${task.title}»?`,
      header: 'Подтверждение удаления',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Удалить',
      rejectLabel: 'Отмена',
      acceptButtonStyleClass: 'p-button-danger',
      rejectButtonStyleClass: 'p-button-text',
      accept: () => this.remove(task)
    });
  }

  remove(task: Task) {
    if (this.busy()) return;
    this.busy.set(true);
    this.api.delete(task.id).subscribe({
      next: () => {
        this.tasks.set(this.tasks().filter(t => t.id !== task.id));
        this.applyFilter();
        this.toast('success', 'Удалено', `Задача "${task.title}" удалена`);
      },
      error: err => this.toast('error', 'Ошибка удаления', err?.error?.message || String(err)),
      complete: () => this.busy.set(false)
    });
  }

  private toast(severity: 'success'|'info'|'warn'|'error', summary: string, detail?: string) {
    this.msg.add({ severity, summary, detail, life: 2000 });
  }
}
