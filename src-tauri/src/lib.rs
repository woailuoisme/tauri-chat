use tauri::Manager;

/// 钥匙串服务名，前端与后端共用的唯一标识
const KEYRING_SERVICE: &str = "com.seaside.starter";

// Learn more about Tauri commands at https://tauri.app/develop/calling-rust/
/// 写入密钥到系统钥匙串。空值由前端转换为 `secret_delete`，此处不做空值处理。
#[tauri::command]
fn secret_set(provider: String, value: String) -> Result<(), String> {
    let entry = keyring::Entry::new(KEYRING_SERVICE, &provider).map_err(|e| e.to_string())?;
    entry.set_password(&value).map_err(|e| e.to_string())
}

/// 读取密钥；条目不存在时返回 `Ok(None)` 而不是错误，便于前端静默降级。
#[tauri::command]
fn secret_get(provider: String) -> Result<Option<String>, String> {
    let entry = keyring::Entry::new(KEYRING_SERVICE, &provider).map_err(|e| e.to_string())?;

    match entry.get_password() {
        Ok(value) => Ok(Some(value)),
        Err(keyring::Error::NoEntry) => Ok(None),
        Err(error) => Err(error.to_string()),
    }
}

/// 删除密钥；条目本就不存在视为成功，保证幂等。
#[tauri::command]
fn secret_delete(provider: String) -> Result<(), String> {
    let entry = keyring::Entry::new(KEYRING_SERVICE, &provider).map_err(|e| e.to_string())?;

    match entry.delete_credential() {
        Ok(()) | Err(keyring::Error::NoEntry) => Ok(()),
        Err(error) => Err(error.to_string()),
    }
}

/// 去掉文件名中的路径分隔符与上跳片段，避免目录穿越。
fn sanitize_filename(filename: &str) -> String {
    let cleaned: String = filename
        .chars()
        .map(|c| {
            if c == '/' || c == '\\' || c == ':' {
                '_'
            } else {
                c
            }
        })
        .collect();

    let trimmed = cleaned.trim().trim_matches('.').to_string();

    if trimmed.is_empty() {
        "artifact.txt".to_string()
    } else {
        trimmed
    }
}

/// 把文本写入用户指定目录（Artifacts / Code View 下载）。
///
/// 走自定义 command 而非 plugin-fs，是为了避免为「用户任意选择的下载目录」
/// 开放全局 fs scope；目录不存在时自动创建，支持 `~/` 前缀。
#[tauri::command]
fn save_text_file(
    app: tauri::AppHandle,
    dir: String,
    filename: String,
    contents: String,
) -> Result<String, String> {
    let home = app.path().home_dir().map_err(|e| e.to_string())?;

    let base = match dir.as_str() {
        "" | "~" => home,
        _ => match dir.strip_prefix("~/") {
            Some(rest) => home.join(rest),
            None => std::path::PathBuf::from(&dir),
        },
    };

    std::fs::create_dir_all(&base).map_err(|e| e.to_string())?;

    let target = base.join(sanitize_filename(&filename));
    std::fs::write(&target, contents).map_err(|e| e.to_string())?;

    Ok(target.to_string_lossy().to_string())
}

/// 处理运行期事件。
///
/// 「关闭窗口即隐藏到托盘」之后，用户点击 Dock 图标需要能重新唤回窗口，
/// 否则窗口将无法恢复（macOS 的 Reopen 事件）。
#[allow(unused_variables)]
fn handle_run_event(app_handle: &tauri::AppHandle, event: &tauri::RunEvent) {
    #[cfg(target_os = "macos")]
    if let tauri::RunEvent::Reopen { .. } = event
        && let Some(window) = app_handle.get_webview_window("main")
    {
        let _ = window.show();
        let _ = window.set_focus();
    }
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_os::init())
        .plugin(tauri_plugin_process::init())
        .plugin(tauri_plugin_notification::init())
        .plugin(tauri_plugin_clipboard_manager::init())
        .plugin(tauri_plugin_positioner::init())
        .plugin(tauri_plugin_deep_link::init())
        .plugin(tauri_plugin_global_shortcut::Builder::new().build())
        // .plugin(tauri_plugin_updater::Builder::new().build())
        .plugin(tauri_plugin_store::Builder::new().build())
        .plugin(tauri_plugin_log::Builder::new().build())
        .plugin(tauri_plugin_window_state::Builder::new().build())
        .plugin(tauri_plugin_autostart::init(
            tauri_plugin_autostart::MacosLauncher::LaunchAgent,
            None,
        ))
        .plugin(tauri_plugin_single_instance::init(|app, _args, _cwd| {
            if let Some(window) = app.get_webview_window("main") {
                let _ = window.set_focus();
            }
        }))
        .invoke_handler(tauri::generate_handler![
            secret_get,
            secret_set,
            secret_delete,
            save_text_file
        ])
        .build(tauri::generate_context!())
        .expect("error while building tauri application")
        .run(|app_handle, event| handle_run_event(app_handle, &event));
}
