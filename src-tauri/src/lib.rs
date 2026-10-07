mod mouse_tracker;
pub mod overlay;
pub mod native_recorder;

use mouse_tracker::{
    focus_window, force_focus_window_by_title, get_open_windows, get_screen_dimensions,
    is_tracking_active, start_tracking, stop_tracking, AppWindowInfo, ClickEvent, MousePoint,
    RecordingSessionData, TrackerState,
};
use native_recorder::{start_native_recording, stop_native_recording, NativeRecorderState};
use serde::Serialize;
use std::sync::Arc;
use tauri::{AppHandle, State, WebviewWindow};

struct AppState {
    tracker: Arc<TrackerState>,
    recorder: Arc<NativeRecorderState>,
}

#[derive(Serialize)]
pub struct NativeRecordingResult {
    pub video_path: String,
    pub duration_ms: u64,
    pub screen_width: i32,
    pub screen_height: i32,
    pub points: Vec<MousePoint>,
    pub clicks: Vec<ClickEvent>,
    pub key_events: Vec<mouse_tracker::KeyEvent>,
}

#[tauri::command]
fn start_native_capture(
    app: AppHandle,
    state: State<AppState>,
    hwnd: Option<usize>,
    screen_index: Option<usize>,
    title_hint: Option<String>,
    fps: Option<u32>,
) -> Result<bool, String> {
    // 1. Start native video capture
    let _ = start_native_recording(&state.recorder, hwnd, screen_index, fps)?;

    // 2. Start mouse tracker linked with recorder
    let _ = start_tracking(
        app,
        state.tracker.clone(),
        Some(state.recorder.clone()),
        hwnd,
        title_hint.clone(),
    );

    Ok(true)
}

#[tauri::command]
fn stop_native_capture(
    state: State<AppState>,
) -> Result<Option<NativeRecordingResult>, String> {
    // 0. Hide overlay & floating pill immediately
    crate::overlay::hide_screen_recording_border();

    // 1. Stop video recorder
    let video_path = stop_native_recording(&state.recorder);

    // 2. Stop mouse tracker
    let session = stop_tracking(&state.tracker);

    match (video_path, session) {
        (Some(path), Some(data)) => Ok(Some(NativeRecordingResult {
            video_path: path.to_string_lossy().to_string(),
            duration_ms: data.duration_ms,
            screen_width: data.screen_width,
            screen_height: data.screen_height,
            points: data.points,
            clicks: data.clicks,
            key_events: data.key_events,
        })),
        (Some(path), None) => {
            let (w, h) = get_screen_dimensions();
            Ok(Some(NativeRecordingResult {
                video_path: path.to_string_lossy().to_string(),
                duration_ms: 5000,
                screen_width: w,
                screen_height: h,
                points: vec![],
                clicks: vec![],
                key_events: vec![],
            }))
        }
        _ => Ok(None),
    }
}

#[tauri::command]
fn read_recorded_video_bytes(file_path: String) -> Result<tauri::ipc::Response, String> {
    // Retry reading file up to 30 times (3 seconds) to ensure Media Foundation has finished writing and released file lock
    for _ in 0..30 {
        if let Ok(bytes) = std::fs::read(&file_path) {
            if bytes.len() > 1024 {
                return Ok(tauri::ipc::Response::new(bytes));
            }
        }
        std::thread::sleep(std::time::Duration::from_millis(100));
    }
    // Final read attempt
    match std::fs::read(&file_path) {
        Ok(bytes) if !bytes.is_empty() => Ok(tauri::ipc::Response::new(bytes)),
        Ok(_) => Err("Recorded video file is empty (0 bytes).".to_string()),
        Err(e) => Err(format!("Failed to read recorded video {}: {}", file_path, e)),
    }
}

#[tauri::command]
fn start_mouse_recording(
    app: AppHandle,
    state: State<AppState>,
    target_title_hint: Option<String>,
) -> Result<bool, String> {
    let success = start_tracking(app, state.tracker.clone(), None, None, target_title_hint);
    Ok(success)
}

#[tauri::command]
fn is_mouse_recording_active(state: State<AppState>) -> bool {
    is_tracking_active(&state.tracker)
}

#[tauri::command]
fn stop_mouse_recording(state: State<AppState>) -> Result<Option<RecordingSessionData>, String> {
    let data = stop_tracking(&state.tracker);
    Ok(data)
}

#[tauri::command]
fn list_open_windows() -> Vec<AppWindowInfo> {
    get_open_windows()
}

#[tauri::command]
fn focus_target_window(hwnd: usize) -> bool {
    focus_window(hwnd)
}

#[tauri::command]
fn force_focus_by_title(title_hint: String) -> bool {
    force_focus_window_by_title(&title_hint).is_some()
}

#[tauri::command]
fn hide_window(window: WebviewWindow) -> Result<(), String> {
    window.hide().map_err(|e| e.to_string())
}

#[tauri::command]
fn show_window(window: WebviewWindow) -> Result<(), String> {
    let _ = window.show();
    let _ = window.unminimize();
    let _ = window.set_focus();
    Ok(())
}

#[tauri::command]
fn minimize_window(window: WebviewWindow) -> Result<(), String> {
    window.minimize().map_err(|e| e.to_string())
}

#[tauri::command]
fn restore_window(window: WebviewWindow) -> Result<(), String> {
    let _ = window.unminimize();
    let _ = window.show();
    let _ = window.set_focus();
    Ok(())
}

#[derive(serde::Serialize)]
struct ScreenInfo {
    width: i32,
    height: i32,
}

#[tauri::command]
fn get_screen_info() -> ScreenInfo {
    let (w, h) = get_screen_dimensions();
    ScreenInfo {
        width: w,
        height: h,
    }
}

#[cfg(target_os = "windows")]
#[allow(non_snake_case)]
#[repr(C)]
struct OPENFILENAMEW {
    lStructSize: u32,
    hwndOwner: isize,
    hInstance: isize,
    lpstrFilter: *const u16,
    lpstrCustomFilter: *mut u16,
    nMaxCustFilter: u32,
    nFilterIndex: u32,
    lpstrFile: *mut u16,
    nMaxFile: u32,
    lpstrFileTitle: *mut u16,
    nMaxFileTitle: u32,
    lpstrInitialDir: *const u16,
    lpstrTitle: *const u16,
    Flags: u32,
    nFileOffset: u16,
    nFileExtension: u16,
    lpstrDefExt: *const u16,
    lCustData: isize,
    lpfnHook: isize,
    lpTemplateName: *const u16,
    pvReserved: *mut std::ffi::c_void,
    dwReserved: u32,
    FlagsEx: u32,
}

#[cfg(target_os = "windows")]
#[link(name = "comdlg32")]
extern "system" {
    fn GetSaveFileNameW(lpofn: *mut OPENFILENAMEW) -> i32;
}

#[tauri::command]
fn save_video_to_disk(
    default_name: String,
    bytes: Vec<u8>,
) -> Result<Option<String>, String> {
    #[cfg(target_os = "windows")]
    unsafe {
        let mut file_buf = [0u16; 1024];
        let default_utf16: Vec<u16> = default_name.encode_utf16().collect();
        for (i, &c) in default_utf16.iter().take(1023).enumerate() {
            file_buf[i] = c;
        }

        let filter: Vec<u16> = "MP4 Video (*.mp4)\0*.mp4\0WebM Video (*.webm)\0*.webm\0All Files (*.*)\0*.*\0\0"
            .encode_utf16()
            .collect();
        let title: Vec<u16> = "Lưu video ghi hình Studio\0".encode_utf16().collect();
        let def_ext: Vec<u16> = "mp4\0".encode_utf16().collect();

        let mut ofn = OPENFILENAMEW {
            lStructSize: std::mem::size_of::<OPENFILENAMEW>() as u32,
            hwndOwner: 0,
            hInstance: 0,
            lpstrFilter: filter.as_ptr(),
            lpstrCustomFilter: std::ptr::null_mut(),
            nMaxCustFilter: 0,
            nFilterIndex: 1,
            lpstrFile: file_buf.as_mut_ptr(),
            nMaxFile: file_buf.len() as u32,
            lpstrFileTitle: std::ptr::null_mut(),
            nMaxFileTitle: 0,
            lpstrInitialDir: std::ptr::null(),
            lpstrTitle: title.as_ptr(),
            Flags: 0x00000002 | 0x00000004 | 0x00080000,
            nFileOffset: 0,
            nFileExtension: 0,
            lpstrDefExt: def_ext.as_ptr(),
            lCustData: 0,
            lpfnHook: 0,
            lpTemplateName: std::ptr::null(),
            pvReserved: std::ptr::null_mut(),
            dwReserved: 0,
            FlagsEx: 0,
        };

        let result = GetSaveFileNameW(&mut ofn);
        if result != 0 {
            let len = file_buf.iter().position(|&c| c == 0).unwrap_or(file_buf.len());
            let path_str = String::from_utf16_lossy(&file_buf[..len]);
            std::fs::write(&path_str, &bytes).map_err(|e| e.to_string())?;
            return Ok(Some(path_str));
        }
        return Ok(None);
    }
    #[cfg(not(target_os = "windows"))]
    {
        Ok(None)
    }
}

#[cfg(target_os = "windows")]
#[allow(non_snake_case)]
#[repr(C)]
struct BROWSEINFOW {
    hwndOwner: isize,
    pidlRoot: *const std::ffi::c_void,
    pszDisplayName: *mut u16,
    lpszTitle: *const u16,
    ulFlags: u32,
    lpfn: *const std::ffi::c_void,
    lParam: isize,
    iImage: i32,
}

#[cfg(target_os = "windows")]
#[link(name = "shell32")]
extern "system" {
    fn SHBrowseForFolderW(lpbi: *mut BROWSEINFOW) -> *mut std::ffi::c_void;
    fn SHGetPathFromIDListW(pidl: *const std::ffi::c_void, pszPath: *mut u16) -> i32;
    fn CoTaskMemFree(pv: *mut std::ffi::c_void);
}

#[tauri::command]
fn pick_folder_dialog() -> Result<Option<String>, String> {
    #[cfg(target_os = "windows")]
    unsafe {
        let title: Vec<u16> = "Chọn thư mục mặc định lưu video Raw\0".encode_utf16().collect();
        let mut display_name = [0u16; 260];
        let mut bi = BROWSEINFOW {
            hwndOwner: 0,
            pidlRoot: std::ptr::null(),
            pszDisplayName: display_name.as_mut_ptr(),
            lpszTitle: title.as_ptr(),
            ulFlags: 0x00000001 | 0x00000040, // BIF_RETURNONLYFSDIRS | BIF_NEWDIALOGSTYLE
            lpfn: std::ptr::null(),
            lParam: 0,
            iImage: 0,
        };
        let pidl = SHBrowseForFolderW(&mut bi);
        if !pidl.is_null() {
            let mut path_buf = [0u16; 1024];
            let success = SHGetPathFromIDListW(pidl, path_buf.as_mut_ptr());
            CoTaskMemFree(pidl);
            if success != 0 {
                let len = path_buf.iter().position(|&c| c == 0).unwrap_or(path_buf.len());
                let folder_str = String::from_utf16_lossy(&path_buf[..len]);
                return Ok(Some(folder_str));
            }
        }
        Ok(None)
    }
    #[cfg(not(target_os = "windows"))]
    Ok(None)
}

#[tauri::command]
fn save_raw_video_to_disk(
    bytes: Vec<u8>,
    target_folder: Option<String>,
    default_name: String,
) -> Result<Option<String>, String> {
    if let Some(ref folder) = target_folder {
        let trimmed = folder.trim();
        if !trimmed.is_empty() {
            let folder_path = std::path::Path::new(trimmed);
            if folder_path.exists() {
                let file_path = folder_path.join(&default_name);
                std::fs::write(&file_path, &bytes).map_err(|e| e.to_string())?;
                return Ok(Some(file_path.to_string_lossy().to_string()));
            }
        }
    }
    // If no default folder is configured or doesn't exist, open Save Dialog
    save_video_to_disk(default_name, bytes)
}

#[tauri::command]
fn open_file_in_folder(file_path: String) -> Result<(), String> {
    #[cfg(target_os = "windows")]
    {
        let _ = std::process::Command::new("explorer.exe")
            .arg(format!("/select,{}", file_path))
            .spawn();
    }
    Ok(())
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let app_state = AppState {
        tracker: Arc::new(TrackerState::new()),
        recorder: Arc::new(NativeRecorderState::new()),
    };

    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .manage(app_state)
        .invoke_handler(tauri::generate_handler![
            start_native_capture,
            stop_native_capture,
            read_recorded_video_bytes,
            save_video_to_disk,
            save_raw_video_to_disk,
            pick_folder_dialog,
            open_file_in_folder,
            start_mouse_recording,
            is_mouse_recording_active,
            stop_mouse_recording,
            list_open_windows,
            focus_target_window,
            force_focus_by_title,
            hide_window,
            show_window,
            minimize_window,
            restore_window,
            get_screen_info
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
