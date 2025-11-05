// 施工进度管理系统
class ConstructionProgressManager {
    constructor() {
        this.data = this.loadData();
        this.currentArea = 'main';
        this.currentSubArea = null;
        this.init();
    }

    // 初始化
    init() {
        this.bindEvents();
        this.render();
        this.showNotification('系统初始化完成', 'success');
    }

    // 绑定事件
    bindEvents() {
        // 区域切换
        document.querySelectorAll('.area-item').forEach(item => {
            item.addEventListener('click', (e) => {
                const areaId = e.currentTarget.dataset.area;
                this.switchArea(areaId);
            });
        });

        // 添加分区
        document.getElementById('addArea').addEventListener('click', () => {
            this.showModal('添加分区', this.generateAddAreaForm());
        });

        // 添加小分区
        document.getElementById('addSubArea').addEventListener('click', () => {
            this.showModal('添加小分区', this.generateAddSubAreaForm());
        });

        // 导出Excel
        document.getElementById('exportExcel').addEventListener('click', () => {
            this.exportToExcel();
        });

        // 模态框事件
        document.getElementById('modalClose').addEventListener('click', () => {
            this.hideModal();
        });
        document.getElementById('modalCancel').addEventListener('click', () => {
            this.hideModal();
        });
        document.getElementById('modalConfirm').addEventListener('click', () => {
            this.handleModalConfirm();
        });

        // 面板关闭
        document.getElementById('panelClose').addEventListener('click', () => {
            this.hidePanel();
        });

        // 点击模态框外部关闭
        document.getElementById('modal').addEventListener('click', (e) => {
            if (e.target.id === 'modal') {
                this.hideModal();
            }
        });
    }

    // 数据管理
    loadData() {
        const saved = localStorage.getItem('constructionProgress');
        if (saved) {
            return JSON.parse(saved);
        }
        
        // 默认数据结构
        return {
            main: { name: '主楼', subareas: {} },
            areaA: { name: 'A区', subareas: {} },
            areaB: { name: 'B区', subareas: {} },
            areaC: { name: 'C区', subareas: {} },
            areaD: { name: 'D区', subareas: {} }
        };
    }

    saveData() {
        localStorage.setItem('constructionProgress', JSON.stringify(this.data));
    }

    // 区域管理
    switchArea(areaId) {
        this.currentArea = areaId;
        this.currentSubArea = null;
        
        // 更新UI
        document.querySelectorAll('.area-item').forEach(item => {
            item.classList.remove('active');
        });
        document.querySelector(`[data-area="${areaId}"]`).classList.add('active');
        
        // 更新标题
        document.getElementById('currentAreaTitle').textContent = this.data[areaId].name;
        
        this.render();
    }

    addArea(name) {
        const areaId = 'area_' + Date.now();
        this.data[areaId] = { name, subareas: {} };
        this.saveData();
        this.render();
        this.showNotification(`分区 "${name}" 添加成功`, 'success');
    }

    addSubArea(areaId, name) {
        const subAreaId = 'subarea_' + Date.now();
        this.data[areaId].subareas[subAreaId] = { name, processes: {} };
        this.saveData();
        this.render();
        this.showNotification(`小分区 "${name}" 添加成功`, 'success');
    }

    updateSubArea(areaId, subAreaId, name) {
        this.data[areaId].subareas[subAreaId].name = name;
        this.saveData();
        this.render();
        this.showNotification('小分区更新成功', 'success');
    }

    deleteSubArea(areaId, subAreaId) {
        delete this.data[areaId].subareas[subAreaId];
        this.saveData();
        this.render();
        this.showNotification('小分区删除成功', 'success');
    }

    // 工序管理
    addProcess(areaId, subAreaId, name, notes = '') {
        const processId = 'process_' + Date.now();
        this.data[areaId].subareas[subAreaId].processes[processId] = {
            name,
            status: 'not-started',
            notes,
            createdAt: new Date().toISOString()
        };
        this.saveData();
        this.render();
        this.showNotification(`工序 "${name}" 添加成功`, 'success');
    }

    updateProcess(areaId, subAreaId, processId, updates) {
        Object.assign(this.data[areaId].subareas[subAreaId].processes[processId], updates);
        this.saveData();
        this.render();
    }

    deleteProcess(areaId, subAreaId, processId) {
        delete this.data[areaId].subareas[subAreaId].processes[processId];
        this.saveData();
        this.render();
        this.showNotification('工序删除成功', 'success');
    }

    // 状态管理
    getStatusInfo(status) {
        const statusMap = {
            'not-started': { text: '未开始施工', class: 'status-not-started' },
            'in-progress': { text: '正在施工', class: 'status-in-progress' },
            'completed': { text: '已完成', class: 'status-completed' }
        };
        return statusMap[status];
    }

    toggleProcessStatus(areaId, subAreaId, processId) {
        const process = this.data[areaId].subareas[subAreaId].processes[processId];
        let newStatus;
        
        switch (process.status) {
            case 'not-started':
                newStatus = 'in-progress';
                break;
            case 'in-progress':
                newStatus = 'completed';
                break;
            case 'completed':
                newStatus = 'not-started';
                break;
        }
        
        this.updateProcess(areaId, subAreaId, processId, { status: newStatus });
        this.showNotification(`工序状态已更新为: ${this.getStatusInfo(newStatus).text}`, 'success');
    }

    // 渲染
    render() {
        this.renderAreas();
        this.renderContent();
        this.updateCounts();
    }

    renderAreas() {
        // 渲染自定义区域
        const customAreasContainer = document.querySelector('.custom-areas');
        if (customAreasContainer) {
            customAreasContainer.innerHTML = '';
            
            Object.entries(this.data).forEach(([areaId, areaData]) => {
                if (!['main', 'areaA', 'areaB', 'areaC', 'areaD'].includes(areaId)) {
                    const areaItem = document.createElement('div');
                    areaItem.className = 'area-item';
                    areaItem.dataset.area = areaId;
                    areaItem.innerHTML = `
                        <span class="area-icon">🏗️</span>
                        <span class="area-name">${areaData.name}</span>
                        <span class="area-count" id="${areaId}-count">0</span>
                    `;
                    areaItem.addEventListener('click', (e) => {
                        this.switchArea(areaId);
                    });
                    customAreasContainer.appendChild(areaItem);
                }
            });
        }
    }

    renderContent() {
        const container = document.getElementById('subareasContainer');
        const areaData = this.data[this.currentArea];
        
        if (!areaData || Object.keys(areaData.subareas).length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <div class="empty-state-icon">🏗️</div>
                    <div class="empty-state-text">暂无小分区</div>
                    <div class="empty-state-description">点击"添加小分区"按钮开始添加施工区域</div>
                </div>
            `;
            return;
        }

        container.innerHTML = '';
        
        Object.entries(areaData.subareas).forEach(([subAreaId, subAreaData]) => {
            const subAreaCard = document.createElement('div');
            subAreaCard.className = 'subarea-card';
            
            const processes = Object.entries(subAreaData.processes);
            const processCount = processes.length;
            const completedCount = processes.filter(([_, process]) => process.status === 'completed').length;
            
            subAreaCard.innerHTML = `
                <div class="subarea-header">
                    <div class="subarea-title">${subAreaData.name}</div>
                    <div class="subarea-actions">
                        <span style="font-size: 12px; color: var(--text-secondary);">
                            ${completedCount}/${processCount} 完成
                        </span>
                        <button class="btn btn-secondary" onclick="app.editSubArea('${this.currentArea}', '${subAreaId}')" style="padding: 4px 8px; font-size: 12px;">
                            编辑
                        </button>
                        <button class="btn btn-danger" onclick="app.deleteSubArea('${this.currentArea}', '${subAreaId}')" style="padding: 4px 8px; font-size: 12px;">
                            删除
                        </button>
                        <button class="btn btn-primary" onclick="app.showAddProcess('${this.currentArea}', '${subAreaId}')" style="padding: 4px 8px; font-size: 12px;">
                            添加工序
                        </button>
                    </div>
                </div>
                <div class="processes-list">
                    ${this.renderProcesses(subAreaId, subAreaData.processes)}
                </div>
            `;
            
            container.appendChild(subAreaCard);
        });
    }

    renderProcesses(subAreaId, processes) {
        if (Object.keys(processes).length === 0) {
            return `
                <div class="empty-state" style="padding: var(--space-lg);">
                    <div class="empty-state-icon">🔨</div>
                    <div class="empty-state-text" style="font-size: 14px;">暂无工序</div>
                    <div class="empty-state-description" style="font-size: 12px;">点击"添加工序"开始添加施工任务</div>
                </div>
            `;
        }

        return Object.entries(processes).map(([processId, process]) => {
            const statusInfo = this.getStatusInfo(process.status);
            return `
                <div class="process-item" onclick="app.toggleProcessStatus('${this.currentArea}', '${subAreaId}', '${processId}')">
                    <div class="process-header">
                        <div class="process-name">${process.name}</div>
                        <div class="process-status ${statusInfo.class}">
                            <span class="status-dot"></span>
                            ${statusInfo.text}
                        </div>
                    </div>
                    ${process.notes ? `<div class="process-notes">${process.notes}</div>` : ''}
                    <div style="margin-top: 8px; display: flex; gap: 8px;">
                        <button class="btn btn-secondary" onclick="event.stopPropagation(); app.editProcess('${this.currentArea}', '${subAreaId}', '${processId}')" style="padding: 4px 8px; font-size: 12px;">
                            编辑
                        </button>
                        <button class="btn btn-danger" onclick="event.stopPropagation(); app.deleteProcess('${this.currentArea}', '${subAreaId}', '${processId}')" style="padding: 4px 8px; font-size: 12px;">
                            删除
                        </button>
                    </div>
                </div>
            `;
        }).join('');
    }

    updateCounts() {
        Object.entries(this.data).forEach(([areaId, areaData]) => {
            const countElement = document.getElementById(`${areaId}-count`);
            if (countElement) {
                let totalProcesses = 0;
                Object.values(areaData.subareas).forEach(subArea => {
                    totalProcesses += Object.keys(subArea.processes).length;
                });
                countElement.textContent = totalProcesses;
            }
        });
    }

    // 表单生成
    generateAddAreaForm() {
        return `
            <div class="form-group">
                <label class="form-label">分区名称</label>
                <input type="text" class="form-input" id="areaName" placeholder="请输入分区名称" maxlength="50">
            </div>
        `;
    }

    generateAddSubAreaForm() {
        return `
            <div class="form-group">
                <label class="form-label">小分区名称</label>
                <input type="text" class="form-input" id="subAreaName" placeholder="请输入小分区名称" maxlength="50">
            </div>
        `;
    }

    generateAddProcessForm(areaId, subAreaId) {
        return `
            <div class="form-group">
                <label class="form-label">工序名称</label>
                <input type="text" class="form-input" id="processName" placeholder="请输入工序名称" maxlength="100">
            </div>
            <div class="form-group">
                <label class="form-label">备注说明</label>
                <textarea class="form-textarea" id="processNotes" placeholder="请输入备注信息（可选）" maxlength="500"></textarea>
            </div>
        `;
    }

    generateEditForm(type, data) {
        if (type === 'subarea') {
            return `
                <div class="form-group">
                    <label class="form-label">小分区名称</label>
                    <input type="text" class="form-input" id="editName" value="${data.name}" maxlength="50">
                </div>
            `;
        } else if (type === 'process') {
            return `
                <div class="form-group">
                    <label class="form-label">工序名称</label>
                    <input type="text" class="form-input" id="editName" value="${data.name}" maxlength="100">
                </div>
                <div class="form-group">
                    <label class="form-label">备注说明</label>
                    <textarea class="form-textarea" id="editNotes" maxlength="500">${data.notes || ''}</textarea>
                </div>
                <div class="form-group">
                    <label class="form-label">状态</label>
                    <select class="form-input" id="editStatus">
                        <option value="not-started" ${data.status === 'not-started' ? 'selected' : ''}>未开始施工</option>
                        <option value="in-progress" ${data.status === 'in-progress' ? 'selected' : ''}>正在施工</option>
                        <option value="completed" ${data.status === 'completed' ? 'selected' : ''}>已完成</option>
                    </select>
                </div>
            `;
        }
    }

    // 模态框管理
    showModal(title, content) {
        document.getElementById('modalTitle').textContent = title;
        document.getElementById('modalBody').innerHTML = content;
        document.getElementById('modal').classList.add('show');
    }

    hideModal() {
        document.getElementById('modal').classList.remove('show');
    }

    // 面板管理
    showPanel(content) {
        document.getElementById('panelContent').innerHTML = content;
        document.getElementById('rightPanel').classList.add('open');
    }

    hidePanel() {
        document.getElementById('rightPanel').classList.remove('open');
    }

    // 通知管理
    showNotification(message, type = 'success') {
        const notification = document.getElementById('notification');
        const messageElement = document.getElementById('notificationMessage');
        
        messageElement.textContent = message;
        notification.className = `notification ${type}`;
        notification.classList.add('show');
        
        setTimeout(() => {
            notification.classList.remove('show');
        }, 3000);
    }

    // 动作处理
    handleModalConfirm() {
        const title = document.getElementById('modalTitle').textContent;
        
        if (title === '添加分区') {
            const name = document.getElementById('areaName').value.trim();
            if (!name) {
                this.showNotification('请输入分区名称', 'error');
                return;
            }
            this.addArea(name);
        } else if (title === '添加小分区') {
            const name = document.getElementById('subAreaName').value.trim();
            if (!name) {
                this.showNotification('请输入小分区名称', 'error');
                return;
            }
            this.addSubArea(this.currentArea, name);
        } else if (title === '编辑小分区') {
            const name = document.getElementById('editName').value.trim();
            if (!name) {
                this.showNotification('请输入小分区名称', 'error');
                return;
            }
            this.updateSubArea(this.currentArea, this.currentSubArea, name);
        } else if (title === '编辑工序') {
            const name = document.getElementById('editName').value.trim();
            const notes = document.getElementById('editNotes').value.trim();
            const status = document.getElementById('editStatus').value;
            
            if (!name) {
                this.showNotification('请输入工序名称', 'error');
                return;
            }
            
            this.updateProcess(this.currentArea, this.currentSubArea, this.currentProcess, {
                name,
                notes,
                status
            });
        } else if (title === '添加工序') {
            const name = document.getElementById('processName').value.trim();
            const notes = document.getElementById('processNotes').value.trim();
            
            if (!name) {
                this.showNotification('请输入工序名称', 'error');
                return;
            }
            
            this.addProcess(this.currentArea, this.currentSubArea, name, notes);
        }
        
        this.hideModal();
    }

    // 公开方法
    showAddProcess(areaId, subAreaId) {
        this.currentArea = areaId;
        this.currentSubArea = subAreaId;
        this.showModal('添加工序', this.generateAddProcessForm(areaId, subAreaId));
    }

    editSubArea(areaId, subAreaId) {
        this.currentArea = areaId;
        this.currentSubArea = subAreaId;
        const subAreaData = this.data[areaId].subareas[subAreaId];
        this.showModal('编辑小分区', this.generateEditForm('subarea', subAreaData));
    }

    editProcess(areaId, subAreaId, processId) {
        this.currentArea = areaId;
        this.currentSubArea = subAreaId;
        this.currentProcess = processId;
        const processData = this.data[areaId].subareas[subAreaId].processes[processId];
        this.showModal('编辑工序', this.generateEditForm('process', processData));
    }

    deleteSubArea(areaId, subAreaId) {
        if (confirm('确定要删除这个小分区吗？此操作不可恢复。')) {
            this.deleteSubArea(areaId, subAreaId);
        }
    }

    deleteProcess(areaId, subAreaId, processId) {
        if (confirm('确定要删除这个工序吗？此操作不可恢复。')) {
            this.deleteProcess(areaId, subAreaId, processId);
        }
    }

    toggleProcessStatus(areaId, subAreaId, processId) {
        this.toggleProcessStatus(areaId, subAreaId, processId);
    }

    // Excel导出
    exportToExcel() {
        try {
            const workbook = XLSX.utils.book_new();
            
            // 为每个区域创建工作表
            Object.entries(this.data).forEach(([areaId, areaData]) => {
                if (Object.keys(areaData.subareas).length === 0) return;
                
                const worksheetData = [
                    ['区域', '小分区', '工序', '状态', '备注']
                ];
                
                Object.entries(areaData.subareas).forEach(([subAreaId, subAreaData]) => {
                    Object.entries(subAreaData.processes).forEach(([processId, process]) => {
                        worksheetData.push([
                            areaData.name,
                            subAreaData.name,
                            process.name,
                            this.getStatusInfo(process.status).text,
                            process.notes || ''
                        ]);
                    });
                });
                
                const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);
                XLSX.utils.book_append_sheet(workbook, worksheet, areaData.name.substring(0, 31));
            });
            
            // 创建汇总工作表
            const summaryData = [['区域', '小分区', '工序', '状态', '备注']];
            
            Object.entries(this.data).forEach(([areaId, areaData]) => {
                Object.entries(areaData.subareas).forEach(([subAreaId, subAreaData]) => {
                    Object.entries(subAreaData.processes).forEach(([processId, process]) => {
                        summaryData.push([
                            areaData.name,
                            subAreaData.name,
                            process.name,
                            this.getStatusInfo(process.status).text,
                            process.notes || ''
                        ]);
                    });
                });
            });
            
            const summaryWorksheet = XLSX.utils.aoa_to_sheet(summaryData);
            XLSX.utils.book_append_sheet(workbook, summaryWorksheet, '汇总');
            
            // 下载文件
            const fileName = `施工进度_${new Date().toISOString().split('T')[0]}.xlsx`;
            XLSX.writeFile(workbook, fileName);
            
            this.showNotification('Excel文件导出成功', 'success');
        } catch (error) {
            console.error('导出失败:', error);
            this.showNotification('导出失败，请重试', 'error');
        }
    }
}

// 初始化应用
let app;
document.addEventListener('DOMContentLoaded', () => {
    app = new ConstructionProgressManager();
});

// 键盘快捷键
document.addEventListener('keydown', (e) => {
    // ESC 关闭模态框
    if (e.key === 'Escape') {
        const modal = document.getElementById('modal');
        const panel = document.getElementById('rightPanel');
        
        if (modal.classList.contains('show')) {
            app.hideModal();
        } else if (panel.classList.contains('open')) {
            app.hidePanel();
        }
    }
    
    // Ctrl+E 导出Excel
    if (e.ctrlKey && e.key === 'e') {
        e.preventDefault();
        app.exportToExcel();
    }
});

// 防止页面刷新时数据丢失
window.addEventListener('beforeunload', (e) => {
    // 数据已经自动保存到localStorage，这里可以添加额外的确认逻辑
});