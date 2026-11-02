/**
 * devMockBridge.ts
 * Provides mock implementations for window.electronAPI when running in browser mode (vite --mode ui)
 * so that all UI components, buttons, settings, and views work interactively.
 */

type AnyCallback = (...args: unknown[]) => unknown;

export function setupDevMockBridge() {
	if (typeof window === "undefined") return;

	// Only mock if electronAPI is not already provided by Electron preload
	if ("electronAPI" in window && (window as unknown as { electronAPI?: unknown }).electronAPI) {
		return;
	}

	const listeners = new Map<string, Set<AnyCallback>>();

	const emit = (event: string, data: unknown) => {
		listeners.get(event)?.forEach((fn) => {
			try {
				fn(data);
			} catch (e) {
				console.error(e);
			}
		});
	};

	const subscribe = (event: string) => (callback: AnyCallback) => {
		if (!listeners.has(event)) listeners.set(event, new Set());
		listeners.get(event)?.add(callback);
		return () => listeners.get(event)?.delete(callback);
	};

	const mockProjects = [
		{
			path: "/mock/projects/Screen_Studio_Style_Demo.recordly",
			name: "Screen Studio Style Demo",
			updatedAt: Date.now() - 1000 * 60 * 15,
			createdAt: Date.now() - 1000 * 60 * 60 * 24 * 2,
			duration: 48,
			thumbnailUrl:
				"https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=600&auto=format&fit=crop&q=80",
		},
		{
			path: "/mock/projects/Product_Walkthrough_v2.recordly",
			name: "Product Walkthrough v2.0",
			updatedAt: Date.now() - 1000 * 60 * 60 * 3,
			createdAt: Date.now() - 1000 * 60 * 60 * 24 * 5,
			duration: 75,
			thumbnailUrl:
				"https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=600&auto=format&fit=crop&q=80",
		},
		{
			path: "/mock/projects/Mobile_App_Feature_Showcase.recordly",
			name: "Mobile App Feature Showcase",
			updatedAt: Date.now() - 1000 * 60 * 60 * 24,
			createdAt: Date.now() - 1000 * 60 * 60 * 24 * 7,
			duration: 32,
			thumbnailUrl:
				"https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=600&auto=format&fit=crop&q=80",
		},
		{
			path: "/mock/projects/Quick_Bug_Reproduction.recordly",
			name: "Quick Bug Reproduction #402",
			updatedAt: Date.now() - 1000 * 60 * 60 * 48,
			createdAt: Date.now() - 1000 * 60 * 60 * 48,
			duration: 19,
			thumbnailUrl:
				"https://images.unsplash.com/photo-1507238691740-187a5b1d37b8?w=600&auto=format&fit=crop&q=80",
		},
	];

	let currentRecordingSession: unknown = null;
	const currentSettings: Record<string, unknown> = {
		"recordly.theme": localStorage.getItem("recordly.theme") || "dark",
		"recordly.onboarding.v1.seen": true,
	};

	const explicitBridge: Record<string, unknown> = {
		getPlatform: async () => "darwin",
		getAppVersion: async () => "1.4.0-pro",
		getWindowChrome: async () => ({ trafficLightsVisible: true }),
		onWindowChromeChanged: subscribe("windowChromeChanged"),

		getAppSetting: (key: string) => currentSettings[key] ?? null,
		setAppSetting: (key: string, value: unknown) => {
			currentSettings[key] = value;
			try {
				localStorage.setItem(key, JSON.stringify(value));
			} catch {
				/* ignore storage error */
			}
			return true;
		},

		getEditorStartupView: () => {
			const startup = new URLSearchParams(window.location.search).get("startupView");
			return startup || "home";
		},
		getLocalMediaUrl: async (path: string) => ({ success: true, url: path }),
		setHasUnsavedChanges: async () => ({ success: true }),
		finishRecordingStartup: async () => undefined,

		getRecordingsDirectory: async () => ({
			success: true,
			path: "C:\\Users\\Recordly\\Videos\\Recordings",
		}),
		chooseRecordingsDirectory: async () => ({
			success: true,
			path: "C:\\Users\\Recordly\\Videos\\Recordings",
			canceled: false,
		}),

		getRecordingPreferences: async () => ({
			success: true,
			microphoneEnabled: true,
			webcamEnabled: false,
			systemAudioEnabled: true,
		}),
		setRecordingPreferences: async () => ({ success: true }),

		getCountdownDelay: async () => ({ success: true, delay: 3 }),
		setCountdownDelay: async (delay: number) => ({ success: true, delay }),

		getSources: async () => [
			{
				id: "screen:0:0",
				name: "Built-in Retina Display (2560 × 1600)",
				thumbnail: "",
				display_id: "0",
			},
			{
				id: "screen:1:0",
				name: "External 4K Studio Display (3840 × 2160)",
				thumbnail: "",
				display_id: "1",
			},
			{
				id: "window:1234:0",
				name: "Google Chrome - Dashboard",
				thumbnail: "",
			},
			{
				id: "window:5678:0",
				name: "VS Code - Recordly Project",
				thumbnail: "",
			},
		],
		getSelectedSource: async () => ({
			id: "screen:0:0",
			name: "Built-in Retina Display (2560 × 1600)",
			thumbnail: "",
			display_id: "0",
		}),
		selectSource: async () => ({ success: true }),
		onSelectedSourceChanged: subscribe("selectedSourceChanged"),

		listProjectFiles: async () => ({
			success: true,
			projects: mockProjects,
			entries: mockProjects.map((p) => ({
				path: p.path,
				name: p.name,
				updatedAt: p.updatedAt,
				createdAt: p.createdAt,
				thumbnailPath: p.thumbnailUrl,
			})),
		}),

		getCurrentVideoPath: async () => {
			const startup = new URLSearchParams(window.location.search).get("startupView");
			if (startup === "editor") {
				return {
					success: true,
					path: "/tests/ui/fixtures/preview.mp4",
				};
			}
			return {
				success: false,
				path: null,
			};
		},
		setCurrentVideoPath: async () => ({ success: true }),

		createProjectFile: async () => ({
			success: true,
			path: "/mock/projects/New_Untitled_Project.recordly",
			projectId: `new-proj-${Date.now()}`,
		}),
		saveProjectFile: async (_data: unknown, _name: string, projectPath: string) => ({
			success: true,
			path: projectPath,
			projectId: "proj-1",
		}),
		loadCurrentProjectFile: async () => ({ success: false }),
		trashProjectFiles: async (paths: string[]) => ({
			success: true,
			deleted: paths,
			errors: [],
		}),
		renameProjectFile: async (oldPath: string, newName: string) => {
			const project = mockProjects.find((p) => p.path === oldPath);
			if (project) project.name = newName;
			return { success: true, newPath: oldPath.replace(/[^/]+$/, `${newName}.recordly`) };
		},

		getProjectPreview: async () => ({ success: false, error: "Dev mode mock preview" }),
		getAnnouncements: async () => ({ success: true, announcements: [] }),
		getCurrentRecordingSession: async () => ({
			success: true,
			session: currentRecordingSession,
		}),
		setCurrentRecordingSession: async (s: unknown) => {
			currentRecordingSession = s;
			emit("recordingSessionChanged", s);
			return { success: true };
		},

		getHudOverlayMousePassthroughSupported: async () => ({ success: true, supported: true }),
		getHudOverlayCaptureProtection: async () => ({
			success: true,
			enabled: false,
			supported: true,
		}),
		setHudOverlayCaptureProtection: async (enabled: boolean) => ({ success: true, enabled }),
		hudOverlaySetIgnoreMouse: async () => ({ success: true }),
		hudOverlayRendererReady: async () => ({ success: true }),
		hudOverlaySetWebcamPreviewVisible: async () => ({ success: true }),

		showRecordingHud: async () => {
			window.location.search = "?windowType=hud-overlay";
		},
		showProjectDashboard: async () => {
			window.location.search = "?windowType=editor&startupView=home";
		},

		onRecordingStateChanged: subscribe("recordingStateChanged"),
		onRecordingSessionChanged: subscribe("recordingSessionChanged"),
		onMenuSaveProject: subscribe("menuSaveProject"),
		onMenuSaveProjectAs: subscribe("menuSaveProjectAs"),
		onMenuLoadProject: subscribe("menuLoadProject"),
		onRequestSaveBeforeClose: subscribe("requestSaveBeforeClose"),
		onAuthCallbackUrl: subscribe("authCallbackUrl"),
		onWhisperSmallModelDownloadProgress: subscribe("whisperProgress"),
		onUpdateToastStateChanged: subscribe("updateToastStateChanged"),
		onStopRecordingFromTray: subscribe("stopRecordingTray"),

		getWhisperSmallModelStatus: async () => ({ success: true, exists: true }),
		getCursorTelemetry: async () => ({ success: true, samples: [] }),
		getVideoAudioFallbackPaths: async () => ({ success: true, paths: [] }),
		openExternalUrl: async (url: string) => {
			window.open(url, "_blank");
			return { success: true };
		},
	};

	// Wrap in a Proxy so any unexpected electronAPI call safely returns an async resolved object or subscription
	const safeProxyBridge = new Proxy(explicitBridge, {
		get(target, prop, receiver) {
			if (prop in target) {
				return Reflect.get(target, prop, receiver);
			}
			if (typeof prop === "string" && prop.startsWith("on")) {
				return () => () => undefined;
			}
			return async () => ({ success: true });
		},
	});

	Object.assign(window, { electronAPI: safeProxyBridge });
}
