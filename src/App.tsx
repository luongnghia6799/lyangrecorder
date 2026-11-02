import { lazy, Suspense, useEffect, useState } from "react";
import HudWindow from "./components/launch/HudWindow";
import { getStartupView } from "./lib/startupView";
import { HomeLoadingSkeleton } from "./components/video-editor/dashboard/HomeLoadingSkeleton";
import { EditorLoadingSkeleton } from "./components/video-editor/layout/EditorLoadingSkeleton";

const SourceSelector = lazy(() =>
	import("./components/launch/SourceSelector").then((module) => ({
		default: module.SourceSelector,
	})),
);
const CountdownOverlay = lazy(() =>
	import("./components/countdown/CountdownOverlay").then((module) => ({
		default: module.CountdownOverlay,
	})),
);
const UpdateToastWindow = lazy(() =>
	import("./components/launch/UpdateToastWindow").then((module) => ({
		default: module.UpdateToastWindow,
	})),
);
const EditorWindow = lazy(() => import("./components/video-editor/EditorWindow"));
const CapturePicker = lazy(() => import("./components/capture-picker/CapturePicker"));

export default function App() {
	const [windowType] = useState(
		() => new URLSearchParams(window.location.search).get("windowType") || "editor",
	);

	useEffect(() => {
		document.documentElement.dataset.windowType = windowType;

		if (
			windowType === "hud-overlay" ||
			windowType === "source-selector" ||
			windowType === "countdown" ||
			windowType === "update-toast" ||
			windowType === "capture-picker"
		) {
			document.body.style.background = "transparent";
			document.documentElement.style.background = "transparent";
			document.getElementById("root")?.style.setProperty("background", "transparent");
		}

		if (windowType === "hud-overlay") {
			document.documentElement.classList.add("hud-overlay-window");
			document.body.classList.add("hud-overlay-window");
			document.getElementById("root")?.classList.add("hud-overlay-window");
			window.electronAPI?.hudOverlaySetIgnoreMouse?.(true);
		} else if (windowType === "update-toast") {
			document.documentElement.style.overflow = "visible";
			document.body.style.overflow = "visible";
			document.getElementById("root")?.style.setProperty("overflow", "visible");
		}
	}, [windowType]);

	useEffect(() => {
		document.title = "LyangRecorder";
	}, []);

	let content;
	switch (windowType) {
		case "hud-overlay":
			content = <HudWindow />;
			break;
		case "source-selector":
			content = <SourceSelector />;
			break;
		case "countdown":
			content = <CountdownOverlay />;
			break;
		case "update-toast":
			content = <UpdateToastWindow />;
			break;
		case "editor":
			content = <EditorWindow />;
			break;
		case "capture-picker":
			content = <CapturePicker />;
			break;
		default:
			content = <EditorWindow />;
	}

	return (
		<>
			<Suspense
				fallback={
					windowType === "editor" || !windowType ? (
						getStartupView() === "home" ? (
							<HomeLoadingSkeleton />
						) : (
							<EditorLoadingSkeleton />
						)
					) : null
				}
			>
				{content}
			</Suspense>
		</>
	);
}
