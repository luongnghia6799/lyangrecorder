#![allow(non_snake_case)]
#![allow(unused)]

use std::path::PathBuf;
use std::sync::atomic::{AtomicBool, Ordering};
use std::sync::{Arc, Mutex};
use std::thread;
use std::time::{Duration, Instant};
use windows_capture::{
    capture::{CaptureControl, Context, GraphicsCaptureApiHandler},
    encoder::{
        AudioSettingsBuilder, ContainerSettingsBuilder, VideoEncoder,
        VideoSettingsBuilder,
    },
    frame::Frame,
    graphics_capture_api::InternalCaptureControl,
    monitor::Monitor,
    settings::{
        ColorFormat, CursorCaptureSettings, DirtyRegionSettings, DrawBorderSettings,
        MinimumUpdateIntervalSettings, SecondaryWindowSettings, Settings,
    },
    window::Window,
};

pub struct CaptureHandler {
    output_path: PathBuf,
    is_stopping: Arc<AtomicBool>,
    encoder: Option<VideoEncoder>,
}

impl GraphicsCaptureApiHandler for CaptureHandler {
    type Flags = (PathBuf, Arc<AtomicBool>);
    type Error = Box<dyn std::error::Error + Send + Sync>;

    fn new(ctx: Context<Self::Flags>) -> Result<Self, Self::Error> {
        let (output_path, is_stopping) = ctx.flags;

        Ok(Self {
            output_path,
            is_stopping,
            encoder: None,
        })
    }

    fn on_frame_arrived(
        &mut self,
        frame: &mut Frame,
        capture_control: InternalCaptureControl,
    ) -> Result<(), Self::Error> {
        if self.is_stopping.load(Ordering::Relaxed) {
            if let Some(mut encoder) = self.encoder.take() {
                let _ = encoder.finish();
            }
            capture_control.stop();
            return Ok(());
        }

        if self.encoder.is_none() {
            let width = ((frame.width() / 2) * 2).max(2);
            let height = ((frame.height() / 2) * 2).max(2);
            match VideoEncoder::new(
                VideoSettingsBuilder::new(width, height),
                AudioSettingsBuilder::default().disabled(true),
                ContainerSettingsBuilder::default(),
                &self.output_path,
            ) {
                Ok(encoder) => {
                    self.encoder = Some(encoder);
                }
                Err(e) => {
                    eprintln!("Failed to initialize VideoEncoder: {:?}", e);
                    return Err(e.into());
                }
            }
        }

        if let Some(encoder) = &mut self.encoder {
            let _ = encoder.send_frame(frame);
        }

        Ok(())
    }

    fn on_closed(&mut self) -> Result<(), Self::Error> {
        if let Some(mut encoder) = self.encoder.take() {
            let _ = encoder.finish();
        }
        Ok(())
    }
}

pub struct NativeRecorderState {
    pub is_recording: Arc<AtomicBool>,
    pub is_stopping: Arc<AtomicBool>,
    pub output_path: Arc<Mutex<Option<PathBuf>>>,
    pub capture_control: Arc<Mutex<Option<CaptureControl<CaptureHandler, Box<dyn std::error::Error + Send + Sync>>>>>,
}

impl NativeRecorderState {
    pub fn new() -> Self {
        Self {
            is_recording: Arc::new(AtomicBool::new(false)),
            is_stopping: Arc::new(AtomicBool::new(false)),
            output_path: Arc::new(Mutex::new(None)),
            capture_control: Arc::new(Mutex::new(None)),
        }
    }
}

pub fn start_native_recording(
    state: &NativeRecorderState,
    target_hwnd: Option<usize>,
    monitor_index: Option<usize>,
    fps: Option<u32>,
) -> Result<PathBuf, String> {
    if state.is_recording.swap(true, Ordering::SeqCst) {
        return Err("Already recording".into());
    }

    let temp_dir = std::env::temp_dir();
    let file_name = format!(
        "captist_rec_{}.mp4",
        std::time::SystemTime::now()
            .duration_since(std::time::UNIX_EPOCH)
            .unwrap()
            .as_millis()
    );
    let output_file = temp_dir.join(file_name);

    {
        let mut path_lock = state.output_path.lock().unwrap();
        *path_lock = Some(output_file.clone());
    }

    state.is_stopping.store(false, Ordering::SeqCst);

    let is_stopping = state.is_stopping.clone();
    let output_clone = output_file.clone();

    let target_fps = fps.unwrap_or(60).clamp(15, 60);
    let interval_nanos = 1_000_000_000u64 / target_fps as u64;

    let control_res = if let Some(hwnd) = target_hwnd {
        let target_window = Window::from_raw_hwnd(hwnd as *mut std::ffi::c_void);
        let settings = Settings::new(
            target_window,
            CursorCaptureSettings::Default,
            DrawBorderSettings::Default,
            SecondaryWindowSettings::Default,
            MinimumUpdateIntervalSettings::Custom(Duration::from_nanos(interval_nanos)),
            DirtyRegionSettings::Default,
            ColorFormat::Bgra8,
            (output_clone.clone(), is_stopping.clone()),
        );
        CaptureHandler::start_free_threaded(settings)
    } else {
        let mon_idx = monitor_index.unwrap_or(0);
        let target_mon = if mon_idx == 0 {
            Monitor::primary().map_err(|e| format!("{:?}", e))?
        } else {
            let mons = Monitor::enumerate().map_err(|e| format!("{:?}", e))?;
            mons.into_iter()
                .nth(mon_idx)
                .ok_or_else(|| "Monitor index not found".to_string())?
        };

        let settings = Settings::new(
            target_mon,
            CursorCaptureSettings::Default,
            DrawBorderSettings::Default,
            SecondaryWindowSettings::Default,
            MinimumUpdateIntervalSettings::Custom(Duration::from_nanos(interval_nanos)),
            DirtyRegionSettings::Default,
            ColorFormat::Bgra8,
            (output_clone.clone(), is_stopping.clone()),
        );
        CaptureHandler::start_free_threaded(settings)
    };

    match control_res {
        Ok(ctrl) => {
            let mut ctrl_lock = state.capture_control.lock().unwrap();
            *ctrl_lock = Some(ctrl);
            Ok(output_file)
        }
        Err(e) => {
            state.is_recording.store(false, Ordering::SeqCst);
            Err(format!("Failed to start capture: {:?}", e))
        }
    }
}

pub fn stop_native_recording(state: &NativeRecorderState) -> Option<PathBuf> {
    state.is_stopping.store(true, Ordering::SeqCst);

    // Stop the background capture control thread immediately
    {
        let mut ctrl_lock = state.capture_control.lock().unwrap();
        if let Some(ctrl) = ctrl_lock.take() {
            let _ = ctrl.stop();
        }
    }

    thread::sleep(Duration::from_millis(350));
    state.is_recording.store(false, Ordering::SeqCst);

    let path_lock = state.output_path.lock().unwrap();
    path_lock.clone()
}
