// ===== 全局变量和配置 =====
class PassWorkshop {
    constructor() {
        this.currentLanguage = 'zh';
        this.passwordHistory = [];
        this.maxHistorySize = 10;
        
        // 字符集定义
        this.charSets = {
            uppercase: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
            lowercase: 'abcdefghijklmnopqrstuvwxyz',
            numbers: '0123456789',
            symbols: '!@#$%^&*()_+-=[]{}|;:,.<>?',
            similar: '0O1lI|',
            ambiguous: '{}[]()/\\\'"`~,;.<>'
        };
        
        // 多语言支持
        this.translations = {
            zh: {
                title: '专业密码生成器',
                subtitle: '创建安全、强壮的密码来保护您的账户',
                generated_password_placeholder: '点击生成按钮创建密码...',
                copy_password: '复制密码',
                regenerate: '重新生成',
                strength_weak: '强度：弱',
                strength_fair: '强度：一般', 
                strength_good: '强度：良好',
                strength_strong: '强度：强',
                generation_settings: '生成设置',
                password_length: '密码长度',
                character_sets: '字符集',
                uppercase: '大写字母 (A-Z)',
                lowercase: '小写字母 (a-z)',
                numbers: '数字 (0-9)',
                symbols: '特殊符号 (!@#$%^&*)',
                advanced_options: '高级选项',
                exclude_similar: '排除相似字符 (0,O,l,1)',
                no_repeats: '不重复字符',
                password_count: '生成数量',
                passwords: '个密码',
                generate_password: '生成密码',
                password_history: '密码历史',
                export: '导出',
                clear_history: '清空历史',
                no_history: '暂无生成记录',
                footer_security: '🔒 所有密码均在本地生成，不会存储或传输到服务器',
                footer_rights: '保留所有权利',
                copied: '已复制到剪贴板',
                export_success: '密码已导出',
                history_cleared: '历史记录已清空',
                no_passwords_generated: '暂无密码可导出',
                select_character_set: '请至少选择一种字符集',
                generated_at: '生成于',
                length: '长度'
            },
            en: {
                title: 'Professional Password Generator',
                subtitle: 'Create secure, strong passwords to protect your accounts',
                generated_password_placeholder: 'Click generate button to create password...',
                copy_password: 'Copy Password',
                regenerate: 'Regenerate',
                strength_weak: 'Strength: Weak',
                strength_fair: 'Strength: Fair',
                strength_good: 'Strength: Good', 
                strength_strong: 'Strength: Strong',
                generation_settings: 'Generation Settings',
                password_length: 'Password Length',
                character_sets: 'Character Sets',
                uppercase: 'Uppercase Letters (A-Z)',
                lowercase: 'Lowercase Letters (a-z)',
                numbers: 'Numbers (0-9)',
                symbols: 'Special Symbols (!@#$%^&*)',
                advanced_options: 'Advanced Options',
                exclude_similar: 'Exclude Similar Characters (0,O,l,1)',
                no_repeats: 'No Repeat Characters',
                password_count: 'Password Count',
                passwords: 'passwords',
                generate_password: 'Generate Password',
                password_history: 'Password History',
                export: 'Export',
                clear_history: 'Clear History',
                no_history: 'No generation records',
                footer_security: '🔒 All passwords are generated locally, not stored or transmitted to server',
                footer_rights: 'All rights reserved',
                copied: 'Copied to clipboard',
                export_success: 'Passwords exported',
                history_cleared: 'History cleared',
                no_passwords_generated: 'No passwords to export',
                select_character_set: 'Please select at least one character set',
                generated_at: 'Generated at',
                length: 'Length'
            }
        };
        
        this.init();
    }
    
    // ===== 初始化 =====
    init() {
        this.loadSettings();
        this.bindEvents();
        this.updateLanguage();
        this.loadTheme();
        this.loadHistory();
        this.updatePasswordStrength('');
    }
    
    // ===== 事件绑定 =====
    bindEvents() {
        // 密码长度控制
        const lengthSlider = document.getElementById('lengthSlider');
        const lengthInput = document.getElementById('lengthInput');
        
        lengthSlider.addEventListener('input', (e) => {
            lengthInput.value = e.target.value;
            this.saveSettings();
        });
        
        lengthInput.addEventListener('input', (e) => {
            const value = Math.min(Math.max(parseInt(e.target.value) || 4, 4), 128);
            e.target.value = value;
            lengthSlider.value = value;
            this.saveSettings();
        });
        
        // 字符集选择
        ['uppercase', 'lowercase', 'numbers', 'symbols', 'excludeSimilar', 'noRepeats'].forEach(id => {
            const element = document.getElementById(id);
            if (element) {
                element.addEventListener('change', () => this.saveSettings());
            }
        });
        
        // 密码数量
        document.getElementById('countInput').addEventListener('input', (e) => {
            const value = Math.min(Math.max(parseInt(e.target.value) || 1, 1), 100);
            e.target.value = value;
            this.saveSettings();
        });
        
        // 按钮事件
        document.getElementById('generateBtn').addEventListener('click', () => this.generatePasswords());
        document.getElementById('copyBtn').addEventListener('click', () => this.copyMainPassword());
        document.getElementById('regenerateBtn').addEventListener('click', () => this.regenerateMainPassword());
        document.getElementById('exportBtn').addEventListener('click', () => this.exportPasswords());
        document.getElementById('clearHistoryBtn').addEventListener('click', () => this.clearHistory());
        document.getElementById('themeToggle').addEventListener('click', () => this.toggleTheme());
        document.getElementById('langToggle').addEventListener('click', () => this.toggleLanguage());
        
        // 实时密码强度检测
        document.getElementById('passwordOutput').addEventListener('input', (e) => {
            this.updatePasswordStrength(e.target.value);
        });
    }
    
    // ===== 密码生成核心算法 =====
    generatePassword(options = {}) {
        const settings = this.getSettings();
        const opts = { ...settings, ...options };
        
        // 构建字符集
        let charset = '';
        if (opts.uppercase) charset += this.charSets.uppercase;
        if (opts.lowercase) charset += this.charSets.lowercase;
        if (opts.numbers) charset += this.charSets.numbers;
        if (opts.symbols) charset += this.charSets.symbols;
        
        if (!charset) {
            this.showToast(this.t('select_character_set'));
            return '';
        }
        
        // 排除相似字符
        if (opts.excludeSimilar) {
            charset = charset.split('').filter(char => !this.charSets.similar.includes(char)).join('');
        }
        
        // 生成密码
        let password = '';
        const usedChars = new Set();
        
        for (let i = 0; i < opts.length; i++) {
            let char;
            let attempts = 0;
            
            do {
                char = charset[this.getSecureRandomInt(charset.length)];
                attempts++;
            } while (opts.noRepeats && usedChars.has(char) && attempts < 100);
            
            if (opts.noRepeats && usedChars.has(char)) {
                // 如果启用了不重复字符但字符集不够大，回退到允许重复
                char = charset[this.getSecureRandomInt(charset.length)];
            }
            
            password += char;
            if (opts.noRepeats) usedChars.add(char);
        }
        
        return password;
    }
    
    // ===== 安全随机数生成 =====
    getSecureRandomInt(max) {
        if (window.crypto && window.crypto.getRandomValues) {
            const array = new Uint32Array(1);
            window.crypto.getRandomValues(array);
            return array[0] % max;
        } else {
            // 回退到Math.random（不够安全，但总比没有好）
            return Math.floor(Math.random() * max);
        }
    }
    
    // ===== 密码强度检测 =====
    calculatePasswordStrength(password) {
        if (!password) return { score: 0, level: 'weak' };
        
        let score = 0;
        const length = password.length;
        
        // 基础长度分数
        if (length >= 8) score += 1;
        if (length >= 12) score += 1;
        if (length >= 16) score += 1;
        if (length >= 20) score += 1;
        
        // 字符集多样性
        const hasLower = /[a-z]/.test(password);
        const hasUpper = /[A-Z]/.test(password);
        const hasNumber = /[0-9]/.test(password);
        const hasSymbol = /[^a-zA-Z0-9]/.test(password);
        
        const charsetVariety = [hasLower, hasUpper, hasNumber, hasSymbol].filter(Boolean).length;
        score += charsetVariety;
        
        // 重复字符检测
        const uniqueChars = new Set(password).size;
        const repetitionRatio = uniqueChars / length;
        if (repetitionRatio > 0.7) score += 1;
        
        // 常见模式检测（减分）
        if (/^(.)\1+$/.test(password)) score -= 2; // 全部相同字符
        if (/123|abc|qwe|asd|zxc/i.test(password)) score -= 1; // 常见序列
        if (/password|123456|qwerty|admin/i.test(password)) score -= 2; // 常见弱密码
        
        // 计算最终等级
        const normalizedScore = Math.max(0, Math.min(8, score));
        
        if (normalizedScore <= 2) return { score: normalizedScore, level: 'weak' };
        if (normalizedScore <= 4) return { score: normalizedScore, level: 'fair' };
        if (normalizedScore <= 6) return { score: normalizedScore, level: 'good' };
        return { score: normalizedScore, level: 'strong' };
    }
    
    // ===== 更新密码强度显示 =====
    updatePasswordStrength(password) {
        const strength = this.calculatePasswordStrength(password);
        const strengthBar = document.getElementById('strengthBar');
        const strengthText = document.getElementById('strengthText');
        
        strengthBar.className = `strength-bar ${strength.level}`;
        strengthText.textContent = this.t(`strength_${strength.level}`);
    }
    
    // ===== 生成多个密码 =====
    generatePasswords() {
        const settings = this.getSettings();
        const count = settings.count;
        const passwords = [];
        
        for (let i = 0; i < count; i++) {
            const password = this.generatePassword();
            if (password) {
                passwords.push(password);
            }
        }
        
        if (passwords.length > 0) {
            // 显示第一个密码在主输出框
            document.getElementById('passwordOutput').value = passwords[0];
            this.updatePasswordStrength(passwords[0]);
            
            // 添加所有密码到历史记录
            passwords.forEach(password => this.addToHistory(password));
            
            this.showToast(`生成了 ${passwords.length} 个密码`);
        }
    }
    
    // ===== 重新生成主密码 =====
    regenerateMainPassword() {
        const password = this.generatePassword();
        if (password) {
            document.getElementById('passwordOutput').value = password;
            this.updatePasswordStrength(password);
            this.addToHistory(password);
        }
    }
    
    // ===== 复制主密码 =====
    async copyMainPassword() {
        const password = document.getElementById('passwordOutput').value;
        if (password) {
            await this.copyToClipboard(password);
        }
    }
    
    // ===== 复制到剪贴板 =====
    async copyToClipboard(text) {
        try {
            if (navigator.clipboard && window.isSecureContext) {
                await navigator.clipboard.writeText(text);
            } else {
                // 回退方案
                const textArea = document.createElement('textarea');
                textArea.value = text;
                textArea.style.position = 'fixed';
                textArea.style.left = '-999999px';
                textArea.style.top = '-999999px';
                document.body.appendChild(textArea);
                textArea.focus();
                textArea.select();
                document.execCommand('copy');
                textArea.remove();
            }
            this.showToast(this.t('copied'));
        } catch (err) {
            console.error('复制失败:', err);
            this.showToast('复制失败');
        }
    }
    
    // ===== 历史记录管理 =====
    addToHistory(password) {
        const historyItem = {
            password: password,
            timestamp: new Date(),
            length: password.length,
            strength: this.calculatePasswordStrength(password)
        };
        
        // 避免重复
        const existingIndex = this.passwordHistory.findIndex(item => item.password === password);
        if (existingIndex !== -1) {
            this.passwordHistory.splice(existingIndex, 1);
        }
        
        this.passwordHistory.unshift(historyItem);
        
        // 限制历史记录数量
        if (this.passwordHistory.length > this.maxHistorySize) {
            this.passwordHistory = this.passwordHistory.slice(0, this.maxHistorySize);
        }
        
        this.saveHistory();
        this.renderHistory();
    }
    
    renderHistory() {
        const historyList = document.getElementById('historyList');
        
        if (this.passwordHistory.length === 0) {
            historyList.innerHTML = `<div class="empty-state">${this.t('no_history')}</div>`;
            return;
        }
        
        historyList.innerHTML = this.passwordHistory.map(item => `
            <div class="history-item">
                <div class="history-password">${this.escapeHtml(item.password)}</div>
                <div class="history-meta">
                    <span>${this.t('length')}: ${item.length}</span>
                    <span>${this.formatDate(item.timestamp)}</span>
                    <button class="history-copy" onclick="passWorkshop.copyToClipboard('${this.escapeHtml(item.password)}')" title="${this.t('copy_password')}">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                            <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                        </svg>
                    </button>
                </div>
            </div>
        `).join('');
    }
    
    clearHistory() {
        this.passwordHistory = [];
        this.saveHistory();
        this.renderHistory();
        this.showToast(this.t('history_cleared'));
    }
    
    // ===== 导出功能 =====
    exportPasswords() {
        if (this.passwordHistory.length === 0) {
            this.showToast(this.t('no_passwords_generated'));
            return;
        }
        
        const exportData = this.passwordHistory.map(item => 
            `${item.password} (${this.t('length')}: ${item.length}, ${this.t('generated_at')}: ${this.formatDate(item.timestamp)})`
        ).join('\\n');
        
        const blob = new Blob([exportData], { type: 'text/plain;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `passwords_${new Date().toISOString().split('T')[0]}.txt`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        
        this.showToast(this.t('export_success'));
    }
    
    // ===== 主题切换 =====
    toggleTheme() {
        const currentTheme = document.documentElement.getAttribute('data-theme');
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
        
        document.documentElement.setAttribute('data-theme', newTheme);
        localStorage.setItem('theme', newTheme);
        
        // 更新图标
        this.updateThemeIcon(newTheme);
    }
    
    loadTheme() {
        const savedTheme = localStorage.getItem('theme') || 'light';
        document.documentElement.setAttribute('data-theme', savedTheme);
        this.updateThemeIcon(savedTheme);
    }
    
    updateThemeIcon(theme) {
        const themeIcon = document.querySelector('.theme-icon');
        themeIcon.innerHTML = theme === 'dark' 
            ? '<circle cx="12" cy="12" r="4"></circle><path d="m12 2 3 10L12 22l-3-10z"></path>'
            : '<path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>';
    }
    
    // ===== 语言切换 =====
    toggleLanguage() {
        this.currentLanguage = this.currentLanguage === 'zh' ? 'en' : 'zh';
        localStorage.setItem('language', this.currentLanguage);
        this.updateLanguage();
        this.renderHistory(); // 重新渲染历史记录以应用新语言
    }
    
    updateLanguage() {
        const langToggle = document.getElementById('langToggle');
        langToggle.textContent = this.currentLanguage === 'zh' ? '中' : 'EN';
        
        // 更新HTML lang属性
        document.documentElement.lang = this.currentLanguage === 'zh' ? 'zh-CN' : 'en';
        
        // 更新所有带有data-i18n属性的元素
        document.querySelectorAll('[data-i18n]').forEach(element => {
            const key = element.getAttribute('data-i18n');
            element.textContent = this.t(key);
        });
        
        // 更新placeholder属性
        document.querySelectorAll('[data-i18n-placeholder]').forEach(element => {
            const key = element.getAttribute('data-i18n-placeholder');
            element.placeholder = this.t(key);
        });
        
        // 更新title属性
        document.querySelectorAll('[data-i18n-title]').forEach(element => {
            const key = element.getAttribute('data-i18n-title');
            element.title = this.t(key);
        });
    }
    
    t(key) {
        return this.translations[this.currentLanguage][key] || key;
    }
    
    // ===== 设置管理 =====
    getSettings() {
        return {
            length: parseInt(document.getElementById('lengthSlider').value),
            uppercase: document.getElementById('uppercase').checked,
            lowercase: document.getElementById('lowercase').checked,
            numbers: document.getElementById('numbers').checked,
            symbols: document.getElementById('symbols').checked,
            excludeSimilar: document.getElementById('excludeSimilar').checked,
            noRepeats: document.getElementById('noRepeats').checked,
            count: parseInt(document.getElementById('countInput').value)
        };
    }
    
    saveSettings() {
        const settings = this.getSettings();
        localStorage.setItem('passwordSettings', JSON.stringify(settings));
    }
    
    loadSettings() {
        const saved = localStorage.getItem('passwordSettings');
        if (saved) {
            try {
                const settings = JSON.parse(saved);
                document.getElementById('lengthSlider').value = settings.length || 16;
                document.getElementById('lengthInput').value = settings.length || 16;
                document.getElementById('uppercase').checked = settings.uppercase !== false;
                document.getElementById('lowercase').checked = settings.lowercase !== false;
                document.getElementById('numbers').checked = settings.numbers !== false;
                document.getElementById('symbols').checked = settings.symbols !== false;
                document.getElementById('excludeSimilar').checked = settings.excludeSimilar || false;
                document.getElementById('noRepeats').checked = settings.noRepeats || false;
                document.getElementById('countInput').value = settings.count || 1;
            } catch (e) {
                console.error('加载设置失败:', e);
            }
        }
        
        // 加载语言设置
        const savedLang = localStorage.getItem('language');
        if (savedLang && this.translations[savedLang]) {
            this.currentLanguage = savedLang;
        }
    }
    
    // ===== 历史记录存储 =====
    saveHistory() {
        try {
            localStorage.setItem('passwordHistory', JSON.stringify(this.passwordHistory));
        } catch (e) {
            console.error('保存历史记录失败:', e);
        }
    }
    
    loadHistory() {
        try {
            const saved = localStorage.getItem('passwordHistory');
            if (saved) {
                this.passwordHistory = JSON.parse(saved).map(item => ({
                    ...item,
                    timestamp: new Date(item.timestamp)
                }));
            }
            this.renderHistory();
        } catch (e) {
            console.error('加载历史记录失败:', e);
            this.passwordHistory = [];
        }
    }
    
    // ===== 工具函数 =====
    showToast(message) {
        const toast = document.getElementById('toast');
        const toastMessage = document.getElementById('toastMessage');
        
        toastMessage.textContent = message;
        toast.classList.add('show');
        
        setTimeout(() => {
            toast.classList.remove('show');
        }, 3000);
    }
    
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
    
    formatDate(date) {
        return date.toLocaleString(this.currentLanguage === 'zh' ? 'zh-CN' : 'en-US', {
            month: 'short',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit'
        });
    }
}

// ===== 初始化应用 =====
let passWorkshop;

document.addEventListener('DOMContentLoaded', () => {
    passWorkshop = new PassWorkshop();
});

// ===== 键盘快捷键支持 =====
document.addEventListener('keydown', (e) => {
    // Ctrl/Cmd + Enter: 生成密码
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault();
        passWorkshop.generatePasswords();
    }
    
    // Ctrl/Cmd + C: 复制主密码（当焦点在密码输出框时）
    if ((e.ctrlKey || e.metaKey) && e.key === 'c' && document.activeElement.id === 'passwordOutput') {
        e.preventDefault();
        passWorkshop.copyMainPassword();
    }
    
    // Ctrl/Cmd + R: 重新生成（当焦点在密码输出框时）
    if ((e.ctrlKey || e.metaKey) && e.key === 'r' && document.activeElement.id === 'passwordOutput') {
        e.preventDefault();
        passWorkshop.regenerateMainPassword();
    }
});

// ===== 错误处理 =====
window.addEventListener('error', (e) => {
    console.error('应用错误:', e.error);
});

window.addEventListener('unhandledrejection', (e) => {
    console.error('未处理的Promise拒绝:', e.reason);
});

// ===== PWA支持（可选） =====
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        // 注释掉Service Worker注册，因为我们没有创建SW文件
        // navigator.serviceWorker.register('/sw.js');
    });
}