// グローバル変数
let stageCount = 0;
let timetableCount = 0;
let defaultStageId = '';
let defaultType = 'live';
let defaultDuration = 20; // デフォルトの時間間隔（分）

// 初期化
document.addEventListener('DOMContentLoaded', function() {
  // 初期ステージを追加
  addStage();
  addTimetableEntry();
  
  // 開催日の初期値は設定しない（ユーザが必ず選択する）
});

// 開場時間から開演時間を自動設定（フォーカスが外れた時のみ）
function updateStartTimeFromOpen() {
  const openTime = document.getElementById('openTime').value;
  const startTimeInput = document.getElementById('startTime');
  
  if (openTime) {
    // 開演時間の入力を有効化し、値を自動設定
    startTimeInput.disabled = false;
    
    if (!startTimeInput.value) {
      // 開場時間 + 30分 = 開演時間
      startTimeInput.value = addMinutes(openTime, 30);
      updateFirstTimetableFromStart();
    }
  } else {
    // 開場時間が空の場合は開演時間を無効化
    startTimeInput.disabled = true;
    startTimeInput.value = '';
  }
}

// 開演時間から1行目の開始時間を自動設定
function updateFirstTimetableFromStart() {
  const startTime = document.getElementById('startTime').value;
  if (!startTime) return;
  
  const firstEntry = document.querySelector('.timetable-entry');
  if (firstEntry) {
    const firstStartInput = firstEntry.querySelector('.tt-start');
    const firstEndInput = firstEntry.querySelector('.tt-end');
    
    // 1行目の開始時間が空の場合のみ設定
    if (!firstStartInput.value) {
      firstStartInput.value = startTime;
      firstEndInput.value = addMinutes(startTime, defaultDuration);
    }
  }
}

// ステージ追加
function addStage() {
  stageCount++;
  const container = document.getElementById('stagesContainer');
  const stageDiv = document.createElement('div');
  stageDiv.className = 'stage-entry';
  stageDiv.id = `stage-${stageCount}`;
  
  stageDiv.innerHTML = `
    <div class="stage-row">
      <span class="entry-num">1</span>
      <input type="hidden" class="stage-id" value="">
      <input type="text" class="stage-name" placeholder="ステージ名" required oninput="updateStageId(this)">
      <input type="text" class="stage-description" placeholder="説明（任意）">
      <button type="button" class="btn-remove-icon" onclick="removeStage(${stageCount})" title="削除">×</button>
    </div>
  `;
  
  container.appendChild(stageDiv);
  updateStageSelects();
  updateEntryNumbers();
}

// ステージ名からステージIDを自動生成
function updateStageId(nameInput) {
  const stageEntry = nameInput.closest('.stage-entry');
  const stageIdInput = stageEntry.querySelector('.stage-id');
  const stageName = nameInput.value.trim();
  
  if (stageName) {
    // 日本語を含む場合はローマ字変換せず、英数字のみを使用
    let stageId = stageName
      .toLowerCase()
      .replace(/[\s　]+/g, '_')
      .replace(/[^a-z0-9\-_]/g, '');
    
    // 英数字が残らない場合は番号で生成
    if (!stageId) {
      const stageEntries = document.querySelectorAll('.stage-entry');
      const index = Array.from(stageEntries).indexOf(stageEntry) + 1;
      stageId = `stage_${index}`;
    }
    
    stageIdInput.value = stageId.substring(0, 30) || 'stage';
    updateStageSelects();
  } else {
    stageIdInput.value = '';
  }
}

// ステージ削除
function removeStage(id) {
  const element = document.getElementById(`stage-${id}`);
  if (element) {
    element.remove();
    updateStageSelects();
    updateEntryNumbers();
  }
}

// ステージセレクトボックスを更新
function updateStageSelects() {
  const stages = getStages();
  const selects = [
    document.getElementById('defaultStage'),
    document.getElementById('bulkStageId')
  ];
  
  selects.forEach(select => {
    if (!select) return;
    const currentValue = select.value;
    select.innerHTML = '<option value="">-- 選択 --</option>';
    stages.forEach(stage => {
      const option = document.createElement('option');
      option.value = stage.stage_id;
      option.textContent = stage.stage_name;
      select.appendChild(option);
    });
    select.value = currentValue;
  });
  
  // 最初のステージをデフォルトに設定
  if (stages.length > 0) {
    const defaultSelect = document.getElementById('defaultStage');
    if (defaultSelect && !defaultSelect.value) {
      defaultStageId = stages[0].stage_id;
      defaultSelect.value = defaultStageId;
      
      // 既存のタイムテーブルエントリーのステージIDも更新
      document.querySelectorAll('.timetable-entry').forEach(entry => {
        const stageInput = entry.querySelector('.tt-stage');
        if (!stageInput.value) {
          stageInput.value = defaultStageId;
        }
      });
    }
  }
  // 行バッジを最新化
  refreshEntryBadges();
}

// デフォルト値を更新
function updateDefaultValues() {
  defaultStageId = document.getElementById('defaultStage').value;
  defaultType = document.getElementById('defaultType').value;
  defaultDuration = parseInt(document.getElementById('defaultDuration').value, 10);
  // 新規行に適用されるため、既存行のバッジのみ更新
  refreshEntryBadges();
}

// タイムテーブルエントリー追加
function addTimetableEntry(data = {}) {
  timetableCount++;
  const container = document.getElementById('timetableContainer');
  const entryDiv = document.createElement('div');
  entryDiv.className = 'timetable-entry';
  entryDiv.id = `timetable-${timetableCount}`;
  
  // デフォルト値を使用（データがない場合）
  const stageId = data.stage_id || defaultStageId;
  const type = data.type || defaultType;
  
  // 最後の行の終了時間を取得
  let startTime = data.start || '';
  let endTime = data.end || '';
  
  if (!startTime) {
    const lastEntry = container.querySelector('.timetable-entry:last-child');
    if (lastEntry) {
      const lastEndTime = lastEntry.querySelector('.tt-end').value;
      if (lastEndTime) {
        startTime = lastEndTime;
        endTime = addMinutes(startTime, defaultDuration);
      }
    }
  }
  
  entryDiv.innerHTML = `
    <input type="hidden" class="tt-stage" value="${stageId}">
    <input type="hidden" class="tt-type" value="${type}">
    <div class="entry-row">
      <span class="entry-num">1</span>
      <input type="time" class="tt-start" value="${startTime}" required>
      <span class="time-separator">〜</span>
      <input type="time" class="tt-end" value="${endTime}" required>
      <input type="text" class="tt-act" value="${data.act || ''}" placeholder="出演者名" required>
      <input type="text" class="tt-description" value="${data.description || ''}" placeholder="説明">
      <input type="text" class="tt-emoji" value="${data.emoji || ''}" placeholder="🎤" maxlength="2">
      <button type="button" class="btn-insert-icon" onclick="insertTimetableAfter(${timetableCount})" title="この行の後に追加">+</button>
      <button type="button" class="btn-remove-icon" onclick="removeTimetable(${timetableCount})" title="削除">×</button>
      <span class="bdg bdg-combo" title="ステージ/タイプ"></span>
    </div>
  `;
  
  container.appendChild(entryDiv);
  
  // 開始時間の変更イベントを設定
  const startInput = entryDiv.querySelector('.tt-start');
  const endInput = entryDiv.querySelector('.tt-end');
  
  const updateEndTime = function() {
    if (this.value) {
      const currentEnd = endInput.value;
      const newEnd = addMinutes(this.value, defaultDuration);
      
      // 終了時間が空か、開始時間より前の場合は自動更新
      if (!currentEnd || currentEnd <= this.value) {
        endInput.value = newEnd;
      }
    }
  };
  
  // changeイベントのみ（フォーカスが外れた時）
  startInput.addEventListener('change', updateEndTime);
  
  // バッジ表示を設定
  setEntryBadges(entryDiv);

  updateEntryNumbers();
}

// タイムテーブル削除
function removeTimetable(id) {
  const element = document.getElementById(`timetable-${id}`);
  if (element) {
    element.remove();
    updateEntryNumbers();
  }
}

// 指定したタイムテーブルの後に新しい行を挿入
function insertTimetableAfter(id) {
  const currentEntry = document.getElementById(`timetable-${id}`);
  if (!currentEntry) return;
  
  // 現在の行の終了時間を取得して、次の行の開始時間に設定
  const currentEndTime = currentEntry.querySelector('.tt-end').value;
  const newStartTime = currentEndTime || '';
  const newEndTime = newStartTime ? addMinutes(newStartTime, defaultDuration) : '';
  
  timetableCount++;
  const entryDiv = document.createElement('div');
  entryDiv.className = 'timetable-entry';
  entryDiv.id = `timetable-${timetableCount}`;
  
  const stageId = defaultStageId;
  const type = defaultType;
  
  entryDiv.innerHTML = `
    <input type="hidden" class="tt-stage" value="${stageId}">
    <input type="hidden" class="tt-type" value="${type}">
    <div class="entry-row">
      <span class="entry-num">1</span>
      <input type="time" class="tt-start" value="${newStartTime}" required>
      <span class="time-separator">〜</span>
      <input type="time" class="tt-end" value="${newEndTime}" required>
      <input type="text" class="tt-act" value="" placeholder="出演者名" required>
      <input type="text" class="tt-description" value="" placeholder="説明">
      <input type="text" class="tt-emoji" value="" placeholder="🎤" maxlength="2">
      <button type="button" class="btn-insert-icon" onclick="insertTimetableAfter(${timetableCount})" title="この行の後に追加">+</button>
      <button type="button" class="btn-remove-icon" onclick="removeTimetable(${timetableCount})" title="削除">×</button>
      <span class="bdg bdg-combo" title="ステージ/タイプ"></span>
    </div>
  `;
  
  // 現在の要素の直後に挿入
  currentEntry.insertAdjacentElement('afterend', entryDiv);
  
  // イベントリスナー設定
  const startInput = entryDiv.querySelector('.tt-start');
  const endInput = entryDiv.querySelector('.tt-end');
  
  const updateEndTime = function() {
    if (this.value) {
      const currentEnd = endInput.value;
      const newEnd = addMinutes(this.value, defaultDuration);
      
      if (!currentEnd || currentEnd <= this.value) {
        endInput.value = newEnd;
      }
    }
  };
  
  // changeイベントのみ（フォーカスが外れた時）
  startInput.addEventListener('change', updateEndTime);
  
  // バッジ表示を設定
  setEntryBadges(entryDiv);

  updateEntryNumbers();
  
  // 新しく追加した行の出演者名にフォーカス
  entryDiv.querySelector('.tt-act').focus();
}

// ステージIDからステージ名を取得
function getStageNameById(id) {
  const stages = getStages();
  const found = stages.find(s => s.stage_id === id);
  return found ? found.stage_name : id || '';
}

// タイプ表示名
function getTypeLabel(type) {
  const map = { live: 'ライブ', tokuten: '特典会', goods: '物販', other: 'その他' };
  return map[type] || type || '';
}

// 行のバッジを設定
function setEntryBadges(entryDiv) {
  const stageId = entryDiv.querySelector('.tt-stage')?.value || '';
  const type = entryDiv.querySelector('.tt-type')?.value || '';
  const combo = entryDiv.querySelector('.bdg-combo');
  if (combo) combo.textContent = `${getStageNameById(stageId)}・${getTypeLabel(type)}`;
}

// すべての行のバッジを更新
function refreshEntryBadges() {
  document.querySelectorAll('.timetable-entry').forEach(entry => setEntryBadges(entry));
}

// エントリー番号を更新
function updateEntryNumbers() {
  const entries = document.querySelectorAll('.timetable-entry');
  entries.forEach((entry, index) => {
    const numSpan = entry.querySelector('.entry-num');
    if (numSpan) {
      numSpan.textContent = index + 1;
    }
  });
  
  // ステージ番号も更新
  const stages = document.querySelectorAll('.stage-entry');
  stages.forEach((stage, index) => {
    const numSpan = stage.querySelector('.entry-num');
    if (numSpan) {
      numSpan.textContent = index + 1;
    }
  });
}

// 時間に分を追加する関数
function addMinutes(timeString, minutes) {
  if (!timeString) return '';
  
  // HH:MM または HH:MM:SS 形式に対応
  const timeParts = timeString.split(':');
  const hours = parseInt(timeParts[0], 10);
  const mins = parseInt(timeParts[1], 10);
  
  let totalMinutes = hours * 60 + mins + minutes;
  
  // 24時間を超えた場合は翌日扱い
  if (totalMinutes >= 24 * 60) {
    totalMinutes = totalMinutes % (24 * 60);
  }
  
  const newHours = Math.floor(totalMinutes / 60);
  const newMins = totalMinutes % 60;
  
  return `${String(newHours).padStart(2, '0')}:${String(newMins).padStart(2, '0')}`;
}

// タブ切り替え
function switchTab(tab) {
  document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
  document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
  
  if (tab === 'manual') {
    document.querySelector('.tab-btn:nth-child(1)').classList.add('active');
    document.getElementById('manualTab').classList.add('active');
  } else {
    document.querySelector('.tab-btn:nth-child(2)').classList.add('active');
    document.getElementById('bulkTab').classList.add('active');
  }
}

// 一括入力をパース
function parseBulkInput() {
  const text = document.getElementById('bulkInput').value;
  const stageId = document.getElementById('bulkStageId').value;
  const type = document.getElementById('bulkType').value;
  
  if (!stageId) {
    alert('ステージを選択してください');
    return;
  }
  
  const lines = text.split(/\r?\n/).filter(l => l.trim());
  let addedCount = 0;
  
  lines.forEach(line => {
    // パターン: "10:10〜10:30　セレインノート"
    const match = line.match(/(\d{1,2}):(\d{2})[〜~-]+(\d{1,2}):(\d{2})[\s　]+(.+)/);
    if (match) {
      const start = `${match[1].padStart(2, '0')}:${match[2]}`;
      const end = `${match[3].padStart(2, '0')}:${match[4]}`;
      const act = match[5].trim();
      
      addTimetableEntry({
        start: start,
        end: end,
        act: act,
        stage_id: stageId,
        type: type
      });
      addedCount++;
    }
  });
  
  if (addedCount > 0) {
    alert(`${addedCount}件のエントリーを追加しました`);
    document.getElementById('bulkInput').value = '';
    switchTab('manual');
  } else {
    alert('解析できる行がありませんでした。\n形式: "10:10〜10:30　アーティスト名"');
  }
}

// ステージ情報取得
function getStages() {
  const stages = [];
  document.querySelectorAll('.stage-entry').forEach(entry => {
    const stageId = entry.querySelector('.stage-id').value.trim();
    const stageName = entry.querySelector('.stage-name').value.trim();
    const stageDescription = entry.querySelector('.stage-description').value.trim();
    
    if (stageId && stageName) {
      const stage = {
        stage_id: stageId,
        stage_name: stageName
      };
      if (stageDescription) {
        stage.stage_description = stageDescription;
      }
      stages.push(stage);
    }
  });
  return stages;
}

// タイムテーブル情報取得
function getTimetable() {
  const timetable = [];
  document.querySelectorAll('.timetable-entry').forEach(entry => {
    const start = entry.querySelector('.tt-start').value.trim();
    const end = entry.querySelector('.tt-end').value.trim();
    const act = entry.querySelector('.tt-act').value.trim();
    const stageId = entry.querySelector('.tt-stage').value;
    const type = entry.querySelector('.tt-type').value;
    const description = entry.querySelector('.tt-description').value.trim();
    const emoji = entry.querySelector('.tt-emoji').value.trim();
    
    if (start && end && act && stageId && type) {
      // HH:MM形式に正規化
      const normalizeTime = (time) => {
        const match = time.match(/^(\d{1,2}):(\d{2})$/);
        if (match) {
          return `${match[1].padStart(2, '0')}:${match[2]}`;
        }
        return time;
      };
      
      const item = {
        type: type,
        stage_id: stageId,
        start: normalizeTime(start),
        end: normalizeTime(end),
        act: act
      };
      if (description) item.description = description;
      if (emoji) item.emoji = emoji;
      timetable.push(item);
    }
  });
  return timetable;
}

// JSON生成
function generateJSON() {
  const eventName = document.getElementById('eventName').value.trim();
  const eventDate = document.getElementById('eventDate').value;
  const venue = document.getElementById('venue').value.trim();
  const openTime = document.getElementById('openTime').value;
  const startTime = document.getElementById('startTime').value;
  const officialUrl = document.getElementById('officialUrl').value.trim();
  const ticketUrl = document.getElementById('ticketUrl').value.trim();
  const description = document.getElementById('description').value.trim();
  
  // バリデーション
  if (!eventName || !eventDate || !venue) {
    alert('必須項目を入力してください（イベント名、開催日、会場名）');
    return;
  }
  
  const stages = getStages();
  if (stages.length === 0) {
    alert('少なくとも1つのステージを追加してください');
    return;
  }
  
  const timetable = getTimetable();
  if (timetable.length === 0) {
    alert('少なくとも1つのタイムテーブルエントリーを追加してください');
    return;
  }
  
  // event_id生成（カテゴリは"i"固定、スラッグは自動生成）
  const slug = eventName
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .substring(0, 50);
  const eventId = `${eventDate}_i_${slug}`;
  
  // JSONオブジェクト構築
  const eventData = {
    event_id: eventId,
    event_name: eventName,
    date: eventDate,
    venue: venue
  };
  
  if (openTime) eventData.open_time = openTime;
  if (startTime) eventData.start_time = startTime;
  if (ticketUrl) eventData.ticket_url = ticketUrl;
  
  eventData.stages = stages;
  eventData.timetable = timetable;
  
  if (description) eventData.description = description;
  if (officialUrl) eventData.official_url = officialUrl;
  
  // プレビュー表示
  const jsonString = JSON.stringify(eventData, null, 2);
  document.getElementById('jsonOutput').textContent = jsonString;
  document.getElementById('downloadBtn').style.display = 'inline-block';
  
  // プレビュー位置までスクロール
  document.getElementById('jsonOutput').scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

// JSONダウンロード
function downloadJSON() {
  const jsonText = document.getElementById('jsonOutput').textContent;
  if (!jsonText) {
    alert('先にJSONを生成してください');
    return;
  }
  
  const eventData = JSON.parse(jsonText);
  const filename = `${eventData.event_id}.json`;
  
  const blob = new Blob([jsonText], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
  
  alert(`${filename} をダウンロードしました`);
}
