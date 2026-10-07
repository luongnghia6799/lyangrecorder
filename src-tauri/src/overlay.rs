use std::sync::atomic::{AtomicBool, AtomicIsize, Ordering};
use std::time::Instant;

#[cfg(target_os = "windows")]
mod win32 {
    pub const WS_EX_LAYERED: u32 = 0x00080000;
    pub const WS_EX_TRANSPARENT: u32 = 0x00000020;
    pub const WS_EX_TOPMOST: u32 = 0x00000008;
    pub const WS_EX_TOOLWINDOW: u32 = 0x00000080;
    pub const WS_EX_NOACTIVATE: u32 = 0x08000000;
    pub const WS_POPUP: u32 = 0x80000000;
    pub const WS_VISIBLE: u32 = 0x10000000;

    pub const LWA_COLORKEY: u32 = 0x00000001;
    pub const WDA_EXCLUDEFROMCAPTURE: u32 = 0x00000011;

    pub const WM_PAINT: u32 = 0x000F;
    pub const WM_DESTROY: u32 = 0x0002;
    pub const WM_SETCURSOR: u32 = 0x0020;
    pub const WM_LBUTTONDOWN: u32 = 0x0201;
    pub const WM_TIMER: u32 = 0x0113;
    pub const SW_HIDE: i32 = 0;
    pub const SW_SHOWNOACTIVATE: i32 = 4;

    pub const DT_CENTER: u32 = 0x00000001;
    pub const DT_VCENTER: u32 = 0x00000004;
    pub const DT_SINGLELINE: u32 = 0x00000020;
    pub const TRANSPARENT: i32 = 1;
    pub const IDC_HAND: usize = 32649;

    #[repr(C)]
    #[derive(Clone, Copy, Debug, Default)]
    pub struct RECT {
        pub left: i32,
        pub top: i32,
        pub right: i32,
        pub bottom: i32,
    }

    #[repr(C)]
    #[derive(Clone, Copy, Debug, Default)]
    pub struct PAINTSTRUCT {
        pub hdc: isize,
        pub f_erase: i32,
        pub rc_paint: RECT,
        pub f_restore: i32,
        pub f_inc_update: i32,
        pub rgb_reserved: [u8; 32],
    }

    #[repr(C)]
    pub struct WNDCLASSEXW {
        pub cb_size: u32,
        pub style: u32,
        pub lpfn_wnd_proc: unsafe extern "system" fn(isize, u32, usize, isize) -> isize,
        pub cb_cls_extra: i32,
        pub cb_wnd_extra: i32,
        pub h_instance: isize,
        pub h_icon: isize,
        pub h_cursor: isize,
        pub hbr_background: isize,
        pub lpsz_menu_name: *const u16,
        pub lpsz_class_name: *const u16,
        pub h_icon_sm: isize,
    }

    pub type WNDENUMPROC = unsafe extern "system" fn(hwnd: isize, lparam: isize) -> i32;

    #[link(name = "user32")]
    extern "system" {
        pub fn RegisterClassExW(lpwcx: *const WNDCLASSEXW) -> u16;
        pub fn CreateWindowExW(
            dwExStyle: u32,
            lpClassName: *const u16,
            lpWindowName: *const u16,
            dwStyle: u32,
            X: i32,
            Y: i32,
            nWidth: i32,
            nHeight: i32,
            hWndParent: isize,
            hMenu: isize,
            hInstance: isize,
            lpParam: isize,
        ) -> isize;
        pub fn DefWindowProcW(hWnd: isize, Msg: u32, wParam: usize, lParam: isize) -> isize;
        pub fn DestroyWindow(hWnd: isize) -> i32;
        pub fn ShowWindow(hWnd: isize, nCmdShow: i32) -> i32;
        pub fn SetLayeredWindowAttributes(hwnd: isize, crKey: u32, bAlpha: u8, dwFlags: u32) -> i32;
        pub fn SetWindowDisplayAffinity(hwnd: isize, dwAffinity: u32) -> i32;
        pub fn BeginPaint(hWnd: isize, lpPaint: *mut PAINTSTRUCT) -> isize;
        pub fn EndPaint(hWnd: isize, lpPaint: *const PAINTSTRUCT) -> i32;
        pub fn FrameRect(hDC: isize, lprc: *const RECT, hbr: isize) -> i32;
        pub fn FillRect(hDC: isize, lprc: *const RECT, hbr: isize) -> i32;
        pub fn GetWindowRect(hwnd: isize, lpRect: *mut RECT) -> i32;
        pub fn GetSystemMetrics(nIndex: i32) -> i32;
        pub fn EnumWindows(lpEnumFunc: WNDENUMPROC, lParam: isize) -> i32;
        pub fn GetWindowTextW(hwnd: isize, lpString: *mut u16, nMaxCount: i32) -> i32;
        pub fn GetClassNameW(hwnd: isize, lpClassName: *mut u16, nMaxCount: i32) -> i32;
        pub fn DrawTextW(
            hDC: isize,
            lpchText: *const u16,
            cchText: i32,
            lprc: *mut RECT,
            format: u32,
        ) -> i32;
        pub fn SetWindowRgn(hWnd: isize, hRgn: isize, bRedraw: i32) -> i32;
        pub fn LoadCursorW(hInstance: isize, lpCursorName: usize) -> isize;
        pub fn SetCursor(hCursor: isize) -> isize;
        pub fn SetTimer(hWnd: isize, nIDEvent: usize, uElapse: u32, lpTimerFunc: usize) -> usize;
        pub fn KillTimer(hWnd: isize, uIDEvent: usize) -> i32;
        pub fn InvalidateRect(hWnd: isize, lpRect: *const RECT, bErase: i32) -> i32;
        pub fn PostMessageW(hWnd: isize, Msg: u32, wParam: usize, lParam: isize) -> i32;
    }

    pub const WM_CLOSE: u32 = 0x0010;
    pub const PS_SOLID: i32 = 0;
    pub const PS_NULL: i32 = 5;

    #[link(name = "gdi32")]
    extern "system" {
        pub fn CreateSolidBrush(color: u32) -> isize;
        pub fn CreatePen(iStyle: i32, cWidth: i32, color: u32) -> isize;
        pub fn DeleteObject(ho: isize) -> i32;
        pub fn SetTextColor(hdc: isize, color: u32) -> u32;
        pub fn SetBkMode(hdc: isize, mode: i32) -> i32;
        pub fn CreateRoundRectRgn(x1: i32, y1: i32, x2: i32, y2: i32, w: i32, h: i32) -> isize;
        pub fn RoundRect(
            hdc: isize,
            left: i32,
            top: i32,
            right: i32,
            bottom: i32,
            width: i32,
            height: i32,
        ) -> i32;
        pub fn CreateFontW(
            cHeight: i32,
            cWidth: i32,
            cEscapement: i32,
            cOrientation: i32,
            cWeight: i32,
            bItalic: u32,
            bUnderline: u32,
            bStrikeOut: u32,
            iCharSet: u32,
            iOutPrecision: u32,
            iClipPrecision: u32,
            iQuality: u32,
            iPitchAndFamily: u32,
            pszFaceName: *const u16,
        ) -> isize;
        pub fn SelectObject(hdc: isize, h: isize) -> isize;
        pub fn AddFontMemResourceEx(
            pbFont: *const u8,
            cbFont: u32,
            pdv: *const std::ffi::c_void,
            pcFonts: *mut u32,
        ) -> isize;
    }

    #[link(name = "kernel32")]
    extern "system" {
        pub fn GetModuleHandleW(lpModuleName: *const u16) -> isize;
    }
}

static SPACE_GROTESK_BYTES: &[u8] = include_bytes!("../fonts/SpaceGrotesk.ttf");
static FONT_REGISTERED: AtomicBool = AtomicBool::new(false);

pub fn ensure_space_grotesk_font() {
    if !FONT_REGISTERED.swap(true, Ordering::SeqCst) {
        #[cfg(target_os = "windows")]
        unsafe {
            let mut count: u32 = 0;
            win32::AddFontMemResourceEx(
                SPACE_GROTESK_BYTES.as_ptr(),
                SPACE_GROTESK_BYTES.len() as u32,
                std::ptr::null(),
                &mut count,
            );
        }
    }
}

static BORDER_HWND: AtomicIsize = AtomicIsize::new(0);
static PILL_HWND: AtomicIsize = AtomicIsize::new(0);
pub static STOP_REQUESTED: AtomicBool = AtomicBool::new(false);
static mut RECORDING_START_TIME: Option<Instant> = None;

// Helper to construct BGR color for Win32 GDI
#[inline]
const fn rgb_bgr(r: u8, g: u8, b: u8) -> u32 {
    (r as u32) | ((g as u32) << 8) | ((b as u32) << 16)
}

// --- 1. Window Procedure for the Red Border (Click-through) ---
#[cfg(target_os = "windows")]
unsafe extern "system" fn border_wnd_proc(
    hwnd: isize,
    msg: u32,
    w_param: usize,
    l_param: isize,
) -> isize {
    if msg == win32::WM_PAINT {
        let mut ps = win32::PAINTSTRUCT::default();
        let hdc = win32::BeginPaint(hwnd, &mut ps);
        if hdc != 0 {
            let mut rect = win32::RECT::default();
            win32::GetWindowRect(hwnd, &mut rect);
            let w = rect.right - rect.left;
            let h = rect.bottom - rect.top;
            let local_rect = win32::RECT {
                left: 0,
                top: 0,
                right: w,
                bottom: h,
            };

            // Transparent background via COLORKEY (RGB 0,0,0)
            let black_brush = win32::CreateSolidBrush(0x00000000);
            win32::FillRect(hdc, &local_rect, black_brush);
            win32::DeleteObject(black_brush);

            // Glowing red border (RGB 244, 63, 94)
            let red_color = rgb_bgr(244, 63, 94);
            let red_brush = win32::CreateSolidBrush(red_color);
            for i in 0..4 {
                let b_rect = win32::RECT {
                    left: i,
                    top: i,
                    right: w - i,
                    bottom: h - i,
                };
                win32::FrameRect(hdc, &b_rect, red_brush);
            }
            win32::DeleteObject(red_brush);

            win32::EndPaint(hwnd, &ps);
        }
        return 0;
    }
    if msg == win32::WM_DESTROY {
        BORDER_HWND.store(0, Ordering::SeqCst);
        return 0;
    }
    win32::DefWindowProcW(hwnd, msg, w_param, l_param)
}

// --- 2. Window Procedure for the Floating Stop Pill (Interactive & Clickable) ---
#[cfg(target_os = "windows")]
unsafe extern "system" fn pill_wnd_proc(
    hwnd: isize,
    msg: u32,
    w_param: usize,
    l_param: isize,
) -> isize {
    match msg {
        win32::WM_SETCURSOR => {
            let h_cursor = win32::LoadCursorW(0, win32::IDC_HAND);
            if h_cursor != 0 {
                win32::SetCursor(h_cursor);
                return 1;
            }
        }
        win32::WM_LBUTTONDOWN => {
            // User clicked the pill to stop recording!
            STOP_REQUESTED.store(true, Ordering::SeqCst);
            return 0;
        }
        win32::WM_TIMER => {
            // Live timer update
            win32::InvalidateRect(hwnd, std::ptr::null(), 0);
            return 0;
        }
        win32::WM_PAINT => {
            let mut ps = win32::PAINTSTRUCT::default();
            let hdc = win32::BeginPaint(hwnd, &mut ps);
            if hdc != 0 {
                let mut rect = win32::RECT::default();
                win32::GetWindowRect(hwnd, &mut rect);
                let w = rect.right - rect.left;
                let h = rect.bottom - rect.top;

                // 1. Draw Pill Outer Capsule Background & Theme Border
                // Theme Card Background: #FAF6EE, Theme Border: #DDD4C5
                let bg_color = rgb_bgr(250, 246, 238);
                let border_color = rgb_bgr(221, 212, 197);
                let bg_brush = win32::CreateSolidBrush(bg_color);
                let border_pen = win32::CreatePen(win32::PS_SOLID, 1, border_color);

                let old_brush = win32::SelectObject(hdc, bg_brush);
                let old_pen = win32::SelectObject(hdc, border_pen);

                win32::RoundRect(hdc, 0, 0, w, h, h, h);

                win32::SelectObject(hdc, old_brush);
                win32::SelectObject(hdc, old_pen);
                win32::DeleteObject(bg_brush);
                win32::DeleteObject(border_pen);

                // 2. Draw Stop Button Capsule on Right (#0D6832 Forest Emerald)
                let btn_w = 124;
                let btn_margin = 5;
                let btn_left = w - btn_w - btn_margin;
                let btn_top = btn_margin;
                let btn_right = w - btn_margin;
                let btn_bottom = h - btn_margin;
                let btn_radius = btn_bottom - btn_top;

                let btn_color = rgb_bgr(13, 104, 50); // Forest Emerald Accent
                let btn_brush = win32::CreateSolidBrush(btn_color);
                let null_pen = win32::CreatePen(win32::PS_NULL, 0, 0);

                let old_b_brush = win32::SelectObject(hdc, btn_brush);
                let old_b_pen = win32::SelectObject(hdc, null_pen);

                win32::RoundRect(hdc, btn_left, btn_top, btn_right, btn_bottom, btn_radius, btn_radius);

                win32::SelectObject(hdc, old_b_brush);
                win32::SelectObject(hdc, old_b_pen);
                win32::DeleteObject(btn_brush);
                win32::DeleteObject(null_pen);

                // 3. Setup Space Grotesk Typography
                win32::SetBkMode(hdc, win32::TRANSPARENT);

                let font_name: Vec<u16> = "Space Grotesk\0".encode_utf16().collect();
                let h_font = win32::CreateFontW(
                    16, 0, 0, 0, 700, 0, 0, 0, 0, 0, 0, 5, 0, font_name.as_ptr()
                );
                let old_font = win32::SelectObject(hdc, h_font);

                // 4. Calculate elapsed time
                let elapsed_secs = if let Some(start) = RECORDING_START_TIME {
                    start.elapsed().as_secs()
                } else {
                    0
                };
                let mins = elapsed_secs / 60;
                let secs = elapsed_secs % 60;
                let timer_str = format!("● REC {:02}:{:02}", mins, secs);

                // Draw REC + Timer in Rose: #E11D48
                let rec_text_color = rgb_bgr(225, 29, 72);
                win32::SetTextColor(hdc, rec_text_color);
                let mut rec_rect = win32::RECT {
                    left: 14,
                    top: 0,
                    right: btn_left - 4,
                    bottom: h,
                };
                let rec_utf16: Vec<u16> = timer_str.encode_utf16().collect();
                win32::DrawTextW(
                    hdc,
                    rec_utf16.as_ptr(),
                    rec_utf16.len() as i32,
                    &mut rec_rect,
                    win32::DT_CENTER | win32::DT_VCENTER | win32::DT_SINGLELINE,
                );

                // Draw Stop Button text in Pure White
                win32::SetTextColor(hdc, rgb_bgr(255, 255, 255));
                let mut btn_text_rect = win32::RECT {
                    left: btn_left,
                    top: btn_top,
                    right: btn_right,
                    bottom: btn_bottom,
                };
                let stop_utf16: Vec<u16> = "⏹ Dừng (F9)\0".encode_utf16().collect();
                win32::DrawTextW(
                    hdc,
                    stop_utf16.as_ptr(),
                    stop_utf16.len() as i32 - 1,
                    &mut btn_text_rect,
                    win32::DT_CENTER | win32::DT_VCENTER | win32::DT_SINGLELINE,
                );

                win32::SelectObject(hdc, old_font);
                win32::DeleteObject(h_font);

                win32::EndPaint(hwnd, &ps);
            }
            return 0;
        }
        win32::WM_DESTROY => {
            win32::KillTimer(hwnd, 1);
            PILL_HWND.store(0, Ordering::SeqCst);
            return 0;
        }
        _ => {}
    }
    win32::DefWindowProcW(hwnd, msg, w_param, l_param)
}

pub fn show_screen_recording_border(target_hwnd: Option<usize>) {
    #[cfg(target_os = "windows")]
    unsafe {
        hide_screen_recording_border();
        ensure_space_grotesk_font();
        STOP_REQUESTED.store(false, Ordering::SeqCst);
        RECORDING_START_TIME = Some(Instant::now());

        let h_instance = win32::GetModuleHandleW(std::ptr::null());
        let sw = win32::GetSystemMetrics(0);

        // --- 1. Create Red Border Overlay Window ONLY if a specific window is captured ---
        if let Some(hwnd) = target_hwnd {
            if let Some((wx, wy, ww, wh)) = crate::mouse_tracker::get_accurate_window_rect(hwnd) {
                let border_class: Vec<u16> = "CaptistBorderOverlay\0".encode_utf16().collect();
                let mut wc_border = win32::WNDCLASSEXW {
                    cb_size: std::mem::size_of::<win32::WNDCLASSEXW>() as u32,
                    style: 0,
                    lpfn_wnd_proc: border_wnd_proc,
                    cb_cls_extra: 0,
                    cb_wnd_extra: 0,
                    h_instance,
                    h_icon: 0,
                    h_cursor: 0,
                    hbr_background: 0,
                    lpsz_menu_name: std::ptr::null(),
                    lpsz_class_name: border_class.as_ptr(),
                    h_icon_sm: 0,
                };
                win32::RegisterClassExW(&mut wc_border);

                let border_ex = win32::WS_EX_LAYERED
                    | win32::WS_EX_TRANSPARENT
                    | win32::WS_EX_TOPMOST
                    | win32::WS_EX_TOOLWINDOW
                    | win32::WS_EX_NOACTIVATE;
                let border_style = win32::WS_POPUP | win32::WS_VISIBLE;

                let b_hwnd = win32::CreateWindowExW(
                    border_ex,
                    border_class.as_ptr(),
                    std::ptr::null(),
                    border_style,
                    wx,
                    wy,
                    ww,
                    wh,
                    0,
                    0,
                    h_instance,
                    0,
                );

                if b_hwnd != 0 {
                    win32::SetLayeredWindowAttributes(b_hwnd, 0x00000000, 255, win32::LWA_COLORKEY);
                    win32::SetWindowDisplayAffinity(b_hwnd, win32::WDA_EXCLUDEFROMCAPTURE);
                    win32::ShowWindow(b_hwnd, win32::SW_SHOWNOACTIVATE);
                    BORDER_HWND.store(b_hwnd, Ordering::SeqCst);
                }
            }
        }

        // --- 2. Create Floating Stop Pill Window (Interactive & Excluded from Video Recording) ---
        let pill_class: Vec<u16> = "CaptistStopPill\0".encode_utf16().collect();
        let mut wc_pill = win32::WNDCLASSEXW {
            cb_size: std::mem::size_of::<win32::WNDCLASSEXW>() as u32,
            style: 0,
            lpfn_wnd_proc: pill_wnd_proc,
            cb_cls_extra: 0,
            cb_wnd_extra: 0,
            h_instance,
            h_icon: 0,
            h_cursor: win32::LoadCursorW(0, win32::IDC_HAND),
            hbr_background: 0,
            lpsz_menu_name: std::ptr::null(),
            lpsz_class_name: pill_class.as_ptr(),
            h_icon_sm: 0,
        };
        win32::RegisterClassExW(&mut wc_pill);

        let pill_w = 290;
        let pill_h = 44;
        let pill_x = (sw - pill_w) / 2;
        let pill_y = 16;

        let pill_ex = win32::WS_EX_TOPMOST | win32::WS_EX_TOOLWINDOW;
        let pill_style = win32::WS_POPUP | win32::WS_VISIBLE;

        let p_hwnd = win32::CreateWindowExW(
            pill_ex,
            pill_class.as_ptr(),
            std::ptr::null(),
            pill_style,
            pill_x,
            pill_y,
            pill_w,
            pill_h,
            0,
            0,
            h_instance,
            0,
        );

        if p_hwnd != 0 {
            let rgn = win32::CreateRoundRectRgn(0, 0, pill_w + 1, pill_h + 1, pill_h, pill_h);
            win32::SetWindowRgn(p_hwnd, rgn, 1);
            win32::SetWindowDisplayAffinity(p_hwnd, win32::WDA_EXCLUDEFROMCAPTURE);
            win32::SetTimer(p_hwnd, 1, 500, 0);
            win32::ShowWindow(p_hwnd, win32::SW_SHOWNOACTIVATE);
            PILL_HWND.store(p_hwnd, Ordering::SeqCst);
        }
    }
}

pub fn hide_sharing_infobar() {}

pub fn hide_screen_recording_border() {
    #[cfg(target_os = "windows")]
    unsafe {
        let b_hwnd = BORDER_HWND.swap(0, Ordering::SeqCst);
        if b_hwnd != 0 {
            win32::ShowWindow(b_hwnd, win32::SW_HIDE);
            win32::PostMessageW(b_hwnd, win32::WM_CLOSE, 0, 0);
        }
        let p_hwnd = PILL_HWND.swap(0, Ordering::SeqCst);
        if p_hwnd != 0 {
            win32::ShowWindow(p_hwnd, win32::SW_HIDE);
            win32::PostMessageW(p_hwnd, win32::WM_CLOSE, 0, 0);
        }
    }
}
