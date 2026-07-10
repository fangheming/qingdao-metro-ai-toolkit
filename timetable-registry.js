// ============================================================
// timetable-registry.js  —— 所有工具共用的时刻表注册表
// ============================================================
// 新增时刻表只需在此文件加一行配置，所有工具自动生效。
// 格式: { key: '表号', label: '显示名', dataVar: '数据变量名' }
//        jiaoluVar 可选，仅备车替换助手等需要交路数据的工具使用
// ============================================================

var TIMETABLE_REGISTRY = [
  { key: 'Z01152', label: 'Z01152 · 工作日', dataVar: 'Z01152_DATA', jiaoluVar: 'Z01152_JIAOLU' },
  { key: 'Z01647', label: 'Z01647 · 周末',   dataVar: 'Z01647_DATA', jiaoluVar: 'Z01647_JIAOLU' },
  // 新增时刻表示例（取消注释并替换）:
  // { key: 'T01060', label: 'T01060 · 7月11日', dataVar: 'T01060_DATA', jiaoluVar: 'T01060_JIAOLU' },
];

// --- 通用函数（所有工具直接用，不要再写三元判断） ---

// 获取指定表号的数据对象（可传入 key 直接获取，不传则读取当前选中）
function getTTData(key) {
  key = key || document.getElementById('ttSelect').value;
  for (var i = 0; i < TIMETABLE_REGISTRY.length; i++) {
    if (TIMETABLE_REGISTRY[i].key === key) {
      var v = window[TIMETABLE_REGISTRY[i].dataVar];
      if (!v || !v.trains) {
        console.error('数据加载失败:', key);
        return null;
      }
      return v;
    }
  }
  return null;
}

// 获取当前选中时刻表的交路数据
function getTTJiaolu(key) {
  key = key || document.getElementById('ttSelect').value;
  for (var i = 0; i < TIMETABLE_REGISTRY.length; i++) {
    if (TIMETABLE_REGISTRY[i].key === key) {
      var jv = TIMETABLE_REGISTRY[i].jiaoluVar;
      return jv ? (window[jv] || null) : null;
    }
  }
  return null;
}

// 自动填充 ttSelect 下拉框（替代手动写 <option> 标签）
function populateTTSelect(defaultKey) {
  var sel = document.getElementById('ttSelect');
  if (!sel) return;
  sel.innerHTML = '';
  for (var i = 0; i < TIMETABLE_REGISTRY.length; i++) {
    var tt = TIMETABLE_REGISTRY[i];
    var opt = document.createElement('option');
    opt.value = tt.key;
    opt.textContent = tt.label;
    if (tt.key === defaultKey) opt.selected = true;
    sel.appendChild(opt);
  }
}

// 获取当前表号
function getTTKey() {
  return document.getElementById('ttSelect').value;
}
