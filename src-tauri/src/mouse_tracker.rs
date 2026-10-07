use serde::{Deserialize, Serialize};
use std::sync::atomic::{AtomicBool, Ordering};
use std::sync::{Arc, Mutex};
use std::thread;
use std::time::{Duration, Instant};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct MousePoint {
    pub t: u64, // ms from start
    pub x: f64, // normalized 0.0 to 1.0
    pub y: f64, // normalized 0.0 to 1.0
    pub px: i32, // raw pixel x
    pub py: i32, // raw pixel y
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ClickEvent {
    pub id: String,
    pub t: u64, // ms from start
    pub x: f64, // normalized 0.0 to 1.0
    pub y: f64, // normalized 0.0 to 1.0
    pub px: i32,
    pub py: i32,
    pub button: String, // "left", "right", "middle"
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct KeyEvent {
    pub id: String,
    pub t: u64,
    pub key: String,
    pub is_shortcut: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize, Default)]
pub struct RecordingSessionData {
    pub start_timestamp_ms: u64,
    pub duration_ms: u64,
    pub screen_width: i32,
    pub screen_height: i32,
    pub points: Vec<MousePoint>,
    pub clicks: Vec<ClickEvent>,
    pub key_events: Vec<KeyEvent>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AppWindowInfo {
    pub hwnd: usize,
    pub title: String,
    pub x: i32,
    pub y: i32,
    pub width: i32,
    pub height: i32,
}

#[cfg(target_os = "windows")]
pub mod win32 {
    #[repr(C)]
    #[derive(Clone, Copy, Debug, Default)]
    pub struct POINT {
        pub x: i32,
        pub y: i32,
    }

    #[repr(C)]
    #[derive(Clone, Copy, Debug, Default)]
    pub struct RECT {
        pub left: i32,
        pub top: i32,
        pub right: i32,
        pub bottom: i32,
    }

    pub type WNDENUMPROC = unsafe extern "system" fn(hwnd: isize, lparam: isize) -> i32;
    pub type MONITORENUMPROC = unsafe extern "system" fn(hmon: isize, hdc: isize, lprect: *mut RECT, lparam: isize) -> i32;

    #[link(name = "user32")]
    extern "system" {
        pub fn GetCursorPos(lpPoint: *mut POINT) -> i32;
        pub fn GetAsyncKeyState(vKey: i32) -> i16;
        pub fn GetSystemMetrics(nIndex: i32) -> i32;
        pub fn EnumWindows(lpEnumFunc: WNDENUMPROC, lParam: isize) -> i32;
        pub fn EnumDisplayMonitors(
            hdc: isize,
            lprcClip: *const RECT,
            lpfnEnum: Option<MONITORENUMPROC>,
            dwData: isize,
        ) -> i32;
        pub fn IsWindowVisible(hwnd: isize) -> i32;
        pub fn GetWindowTextW(hwnd: isize, lpString: *mut u16, nMaxCount: i32) -> i32;
        pub fn GetWindowRect(hwnd: isize, lpRect: *mut RECT) -> i32;
        pub fn SetForegroundWindow(hwnd: isize) -> i32;
        pub fn ShowWindow(hwnd: isize, nCmdShow: i32) -> i32;
        pub fn BringWindowToTop(hwnd: isize) -> i32;
        pub fn GetForegroundWindow() -> isize;
        pub fn GetWindowThreadProcessId(hwnd: isize, lpdwProcessId: *mut u32) -> u32;
        pub fn AttachThreadInput(idAttach: u32, idAttachTo: u32, fAttach: i32) -> i32;
    }

    #[link(name = "dwmapi")]
    extern "system" {
        pub fn DwmGetWindowAttribute(
            hwnd: isize,
            dw_attribute: u32,
            pv_attribute: *mut std::ffi::c_void,
            cb_attribute: u32,
        ) -> i32;
    }

    #[link(name = "kernel32")]
    extern "system" {
        pub fn GetCurrentThreadId() -> u32;
    }

    pub const VK_LBUTTON: i32 = 0x01;
    pub const VK_RBUTTON: i32 = 0x02;
    pub const VK_F9: i32 = 0x78;
    pub const VK_ESCAPE: i32 = 0x1B;
    pub const SM_CXSCREEN: i32 = 0;
    pub const SM_CYSCREEN: i32 = 1;
    pub const SW_RESTORE: i32 = 9;
    pub const DWMWA_EXTENDED_FRAME_BOUNDS: u32 = 9;
}

pub struct TrackerState {
    pub is_recording: AtomicBool,
    pub session_data: Mutex<Option<RecordingSessionData>>,
    pub click_counter: Mutex<u64>,
}

impl TrackerState {
    pub fn new() -> Self {
        Self {
            is_recording: AtomicBool::new(false),
            session_data: Mutex::new(None),
            click_counter: Mutex::new(0),
        }
    }
}

pub fn get_accurate_window_rect(hwnd: usize) -> Option<(i32, i32, i32, i32)> {
    #[cfg(target_os = "windows")]
    unsafe {
        if hwnd == 0 {
            return None;
        }
        let h = hwnd as isize;
        let mut rect = win32::RECT::default();

        // 1. DWM Extended Frame Bounds (Exact visual window boundary without invisible shadow borders)
        let dwm_res = win32::DwmGetWindowAttribute(
            h,
            win32::DWMWA_EXTENDED_FRAME_BOUNDS,
            &mut rect as *mut _ as *mut std::ffi::c_void,
            std::mem::size_of::<win32::RECT>() as u32,
        );

        if dwm_res == 0 {
            let w = rect.right - rect.left;
            let h = rect.bottom - rect.top;
            if w > 0 && h > 0 {
                return Some((rect.left, rect.top, w, h));
            }
        }

        // 2. Fallback to standard GetWindowRect
        if win32::GetWindowRect(h, &mut rect) != 0 {
            let w = rect.right - rect.left;
            let h = rect.bottom - rect.top;
            if w > 0 && h > 0 {
                return Some((rect.left, rect.top, w, h));
            }
        }
    }
    None
}

#[cfg(target_os = "windows")]
unsafe extern "system" fn enum_monitors_proc(
    _hmon: isize,
    _hdc: isize,
    lprect: *mut win32::RECT,
    lparam: isize,
) -> i32 {
    let list = &mut *(lparam as *mut Vec<win32::RECT>);
    if !lprect.is_null() {
        list.push(*lprect);
    }
    1
}

pub fn get_all_monitors() -> Vec<win32::RECT> {
    let mut list = Vec::new();
    #[cfg(target_os = "windows")]
    unsafe {
        win32::EnumDisplayMonitors(
            0,
            std::ptr::null(),
            Some(enum_monitors_proc),
            &mut list as *mut Vec<win32::RECT> as isize,
        );
    }
    list
}

pub fn get_screen_dimensions() -> (i32, i32) {
    #[cfg(target_os = "windows")]
    unsafe {
        let w = win32::GetSystemMetrics(win32::SM_CXSCREEN);
        let h = win32::GetSystemMetrics(win32::SM_CYSCREEN);
        (if w > 0 { w } else { 1920 }, if h > 0 { h } else { 1080 })
    }
    #[cfg(not(target_os = "windows"))]
    {
        (1920, 1080)
    }
}

pub fn focus_window(hwnd: usize) -> bool {
    #[cfg(target_os = "windows")]
    unsafe {
        if hwnd != 0 {
            let h = hwnd as isize;
            win32::ShowWindow(h, win32::SW_RESTORE);

            let fg_hwnd = win32::GetForegroundWindow();
            let fg_thread = win32::GetWindowThreadProcessId(fg_hwnd, std::ptr::null_mut());
            let cur_thread = win32::GetCurrentThreadId();

            if fg_thread != cur_thread && fg_thread != 0 {
                win32::AttachThreadInput(cur_thread, fg_thread, 1);
                win32::BringWindowToTop(h);
                win32::SetForegroundWindow(h);
                win32::AttachThreadInput(cur_thread, fg_thread, 0);
            } else {
                win32::BringWindowToTop(h);
                win32::SetForegroundWindow(h);
            }
            return true;
        }
    }
    false
}

pub fn force_focus_window_by_title(title_hint: &str) -> Option<usize> {
    let clean = title_hint.trim();
    if clean.is_empty() || clean.starts_with("screen:") {
        return None;
    }

    if clean.starts_with("window:") {
        let parts: Vec<&str> = clean.split(':').collect();
        if parts.len() >= 2 {
            if let Ok(hwnd_num) = parts[1].parse::<usize>() {
                if focus_window(hwnd_num) {
                    return Some(hwnd_num);
                }
            }
            if let Ok(hwnd_num) = usize::from_str_radix(parts[1], 16) {
                if focus_window(hwnd_num) {
                    return Some(hwnd_num);
                }
            }
        }
    }

    let clean_hint = clean
        .replace("window:", "")
        .replace("screen:", "")
        .to_lowercase();

    let windows = get_open_windows();

    for win in &windows {
        let win_title = win.title.to_lowercase();
        if !clean_hint.is_empty() && (win_title.contains(&clean_hint) || clean_hint.contains(&win_title)) {
            focus_window(win.hwnd);
            return Some(win.hwnd);
        }
    }

    let words: Vec<&str> = clean_hint
        .split(|c: char| !c.is_alphanumeric())
        .filter(|w| w.len() >= 2)
        .collect();

    for win in &windows {
        let win_title = win.title.to_lowercase();
        if words.iter().any(|w| win_title.contains(w)) {
            focus_window(win.hwnd);
            return Some(win.hwnd);
        }
    }

    None
}

#[cfg(target_os = "windows")]
unsafe extern "system" fn enum_windows_callback(hwnd: isize, lparam: isize) -> i32 {
    let list = &mut *(lparam as *mut Vec<AppWindowInfo>);
    if win32::IsWindowVisible(hwnd) != 0 {
        let mut buffer = [0u16; 512];
        let len = win32::GetWindowTextW(hwnd, buffer.as_mut_ptr(), 512);
        if len > 0 {
            let title = String::from_utf16_lossy(&buffer[..len as usize]);
            if !title.is_empty() 
                && title != "Program Manager" 
                && title != "Settings" 
                && !title.starts_with("MSCTFIME") 
            {
                if let Some((x, y, w, h)) = get_accurate_window_rect(hwnd as usize) {
                    if w > 100 && h > 100 {
                        list.push(AppWindowInfo {
                            hwnd: hwnd as usize,
                            title,
                            x,
                            y,
                            width: w,
                            height: h,
                        });
                    }
                }
            }
        }
    }
    1
}

pub fn get_open_windows() -> Vec<AppWindowInfo> {
    let mut windows: Vec<AppWindowInfo> = Vec::new();
    #[cfg(target_os = "windows")]
    unsafe {
        win32::EnumWindows(
            enum_windows_callback,
            &mut windows as *mut Vec<AppWindowInfo> as isize,
        );
    }
    windows
}

pub fn is_tracking_active(state: &TrackerState) -> bool {
    state.is_recording.load(Ordering::Relaxed)
}

pub fn start_tracking(
    app_handle: tauri::AppHandle,
    state: Arc<TrackerState>,
    recorder: Option<Arc<crate::native_recorder::NativeRecorderState>>,
    explicit_hwnd: Option<usize>,
    target_title_hint: Option<String>,
) -> bool {
    if state.is_recording.swap(true, Ordering::SeqCst) {
        return false;
    }

    let (screen_w, screen_h) = get_screen_dimensions();
    let state_clone = state.clone();

    // 1. Identify target window if specific window was selected
    let target_hwnd = if let Some(h) = explicit_hwnd {
        if h != 0 {
            focus_window(h);
            Some(h)
        } else {
            None
        }
    } else if let Some(hint) = &target_title_hint {
        force_focus_window_by_title(hint)
    } else {
        None
    };

    // 2. Determine target monitor bounds if full screen was selected
    let target_monitor_rect = if target_hwnd.is_none() {
        let monitors = get_all_monitors();
        if let Some(hint) = &target_title_hint {
            if hint.contains("screen:1") && monitors.len() > 1 {
                Some(monitors[1])
            } else if !monitors.is_empty() {
                Some(monitors[0])
            } else {
                None
            }
        } else if !monitors.is_empty() {
            Some(monitors[0])
        } else {
            None
        }
    } else {
        None
    };

    crate::overlay::show_screen_recording_border(target_hwnd);

    thread::spawn(move || {
        use tauri::Emitter;
        let start_instant = Instant::now();
        let start_timestamp_ms = std::time::SystemTime::now()
            .duration_since(std::time::UNIX_EPOCH)
            .map(|d| d.as_millis() as u64)
            .unwrap_or(0);

        let mut points: Vec<MousePoint> = Vec::with_capacity(10000);
        let mut clicks: Vec<ClickEvent> = Vec::with_capacity(500);
        let mut key_events: Vec<KeyEvent> = Vec::with_capacity(500);

        let mut was_l_down = false;
        let mut was_r_down = false;
        let mut last_point_t = 0u64;
        let mut last_detected_key = String::new();
        let mut last_key_t = 0u64;
        let mut key_counter = 0u64;
        let mut recorded_w = screen_w;
        let mut recorded_h = screen_h;
        let mut cached_bounds = if let Some(hwnd) = target_hwnd {
            get_accurate_window_rect(hwnd).unwrap_or((0, 0, screen_w, screen_h))
        } else if let Some(m_rect) = target_monitor_rect {
            let mw = m_rect.right - m_rect.left;
            let mh = m_rect.bottom - m_rect.top;
            (m_rect.left, m_rect.top, if mw > 0 { mw } else { screen_w }, if mh > 0 { mh } else { screen_h })
        } else {
            (0, 0, screen_w, screen_h)
        };
        let mut last_rect_poll_t = 0u64;
        let mut last_key_poll_t = 0u64;

        while state_clone.is_recording.load(Ordering::Relaxed) {
            let elapsed_ms = start_instant.elapsed().as_millis() as u64;

            // 1. Check if user clicked the on-screen Stop Pill
            if crate::overlay::STOP_REQUESTED.swap(false, Ordering::SeqCst) {
                state_clone.is_recording.store(false, Ordering::SeqCst);
                let _ = app_handle.emit("stop_recording_signal", ());
                break;
            }

            // 2. Check if user pressed F9 or Escape anywhere to stop recording (with 800ms grace period so starting keystroke doesn't cancel instantly)
            if elapsed_ms > 800 {
                #[cfg(target_os = "windows")]
                unsafe {
                    let is_f9 = (win32::GetAsyncKeyState(win32::VK_F9) as u16 & 0x8000) != 0;
                    let is_esc = (win32::GetAsyncKeyState(win32::VK_ESCAPE) as u16 & 0x8000) != 0;
                    if is_f9 || is_esc {
                        state_clone.is_recording.store(false, Ordering::SeqCst);
                        break;
                    }
                }
            }

            // 3. Detect Keyboard Strokes & Shortcuts (Polled smoothly at ~30Hz to prevent DWM / IME typing lag)
            if elapsed_ms >= last_key_poll_t + 32 {
                last_key_poll_t = elapsed_ms;

                #[cfg(target_os = "windows")]
                unsafe {
                    let is_ctrl = (win32::GetAsyncKeyState(0x11) as u16 & 0x8000) != 0;
                    let is_alt = (win32::GetAsyncKeyState(0x12) as u16 & 0x8000) != 0;
                    let is_shift = (win32::GetAsyncKeyState(0x10) as u16 & 0x8000) != 0;
                    let is_win = (win32::GetAsyncKeyState(0x5B) as u16 & 0x8000) != 0 || (win32::GetAsyncKeyState(0x5C) as u16 & 0x8000) != 0;

                    let mut current_key = None;

                    // Check letters A-Z
                    for vk in 0x41..=0x5A {
                        if (win32::GetAsyncKeyState(vk) as u16 & 0x8000) != 0 {
                            let letter = ((vk as u8) as char).to_string();
                            let mut mods = Vec::new();
                            if is_ctrl { mods.push("Ctrl"); }
                            if is_alt { mods.push("Alt"); }
                            if is_shift { mods.push("Shift"); }
                            if is_win { mods.push("Win"); }

                            let is_shortcut = !mods.is_empty();
                            let combo = if mods.is_empty() {
                                letter
                            } else {
                                format!("{} + {}", mods.join(" + "), letter)
                            };
                            current_key = Some((combo, is_shortcut));
                            break;
                        }
                    }

                    // Check special keys if not letter
                    if current_key.is_none() {
                        let specials: [(i32, &str); 13] = [
                            (0x0D, "Enter"),
                            (0x20, "Space"),
                            (0x08, "Backspace"),
                            (0x09, "Tab"),
                            (0x2E, "Delete"),
                            (0x25, "← Left"),
                            (0x26, "↑ Up"),
                            (0x27, "→ Right"),
                            (0x28, "↓ Down"),
                            (0x70, "F1"),
                            (0x71, "F2"),
                            (0x74, "F5"),
                            (0x77, "F8"),
                        ];

                        for (vk, name) in specials {
                            if (win32::GetAsyncKeyState(vk) as u16 & 0x8000) != 0 {
                                let mut mods = Vec::new();
                                if is_ctrl { mods.push("Ctrl"); }
                                if is_alt { mods.push("Alt"); }
                                if is_shift { mods.push("Shift"); }
                                if is_win { mods.push("Win"); }

                                let is_shortcut = !mods.is_empty() || vk >= 0x70;
                                let combo = if mods.is_empty() {
                                    name.to_string()
                                } else {
                                    format!("{} + {}", mods.join(" + "), name)
                                };
                                current_key = Some((combo, is_shortcut));
                                break;
                            }
                        }
                    }

                    if let Some((k_str, is_shortcut)) = current_key {
                        if k_str != last_detected_key || elapsed_ms >= last_key_t + 350 {
                            key_counter += 1;
                            key_events.push(KeyEvent {
                                id: format!("key_{}", key_counter),
                                t: elapsed_ms,
                                key: k_str.clone(),
                                is_shortcut,
                            });
                            last_detected_key = k_str;
                            last_key_t = elapsed_ms;
                        }
                    } else if elapsed_ms >= last_key_t + 200 {
                        last_detected_key.clear();
                    }
                }
            }

            // Periodically refresh window bounds (every 250ms) to avoid DWM contention while typing
            if elapsed_ms >= last_rect_poll_t + 250 {
                if let Some(hwnd) = target_hwnd {
                    if let Some(rect) = get_accurate_window_rect(hwnd) {
                        cached_bounds = rect;
                    }
                }
                last_rect_poll_t = elapsed_ms;
            }

            let (base_x, base_y, base_w, base_h) = cached_bounds;
            recorded_w = base_w;
            recorded_h = base_h;

            #[cfg(target_os = "windows")]
            unsafe {
                let mut pt = win32::POINT::default();
                if win32::GetCursorPos(&mut pt) != 0 {
                    // Exact 0.0 - 1.0 normalization relative to the captured surface
                    let norm_x = ((pt.x - base_x) as f64 / base_w as f64).clamp(0.0, 1.0);
                    let norm_y = ((pt.y - base_y) as f64 / base_h as f64).clamp(0.0, 1.0);

                    // Record trajectory every ~16ms (60 fps)
                    if elapsed_ms >= last_point_t + 16 {
                        points.push(MousePoint {
                            t: elapsed_ms,
                            x: norm_x,
                            y: norm_y,
                            px: pt.x,
                            py: pt.y,
                        });
                        last_point_t = elapsed_ms;
                    }

                    // Check Left Click
                    let is_l_down = (win32::GetAsyncKeyState(win32::VK_LBUTTON) as u16 & 0x8000) != 0;
                    if is_l_down && !was_l_down {
                        let mut counter = state_clone.click_counter.lock().unwrap();
                        *counter += 1;
                        clicks.push(ClickEvent {
                            id: format!("click_{}", *counter),
                            t: elapsed_ms,
                            x: norm_x,
                            y: norm_y,
                            px: pt.x,
                            py: pt.y,
                            button: "left".to_string(),
                        });
                    }
                    was_l_down = is_l_down;

                    // Check Right Click
                    let is_r_down = (win32::GetAsyncKeyState(win32::VK_RBUTTON) as u16 & 0x8000) != 0;
                    if is_r_down && !was_r_down {
                        let mut counter = state_clone.click_counter.lock().unwrap();
                        *counter += 1;
                        clicks.push(ClickEvent {
                            id: format!("click_{}", *counter),
                            t: elapsed_ms,
                            x: norm_x,
                            y: norm_y,
                            px: pt.x,
                            py: pt.y,
                            button: "right".to_string(),
                        });
                    }
                    was_r_down = is_r_down;
                }
            }

            thread::sleep(Duration::from_millis(16));
        }

        let total_duration = start_instant.elapsed().as_millis() as u64;
        let mut session = state_clone.session_data.lock().unwrap();
        *session = Some(RecordingSessionData {
            start_timestamp_ms,
            duration_ms: total_duration,
            screen_width: recorded_w,
            screen_height: recorded_h,
            points,
            clicks,
            key_events,
        });

        // 1. Immediately stop native video encoder
        if let Some(rec) = &recorder {
            let _ = crate::native_recorder::stop_native_recording(rec);
        }

        // 2. Hide overlay and restore main Studio window in Rust
        crate::overlay::hide_screen_recording_border();
        use tauri::Manager;
        if let Some(win) = app_handle.get_webview_window("main") {
            let _ = win.unminimize();
            let _ = win.show();
            let _ = win.set_focus();
        }
        let _ = app_handle.emit("stop_recording_signal", ());
    });

    true
}

pub fn stop_tracking(state: &TrackerState) -> Option<RecordingSessionData> {
    state.is_recording.store(false, Ordering::SeqCst);
    crate::overlay::hide_screen_recording_border();
    thread::sleep(Duration::from_millis(50));
    let mut session = state.session_data.lock().unwrap();
    session.take()
}
