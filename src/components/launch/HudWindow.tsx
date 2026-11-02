import { useEffect } from "react";
import { Toaster } from "../ui/toast";
import { LaunchWindow } from "./LaunchWindow";

export default function HudWindow() {
	useEffect(() => {
		window.electronAPI?.hudOverlayRendererReady?.();
	}, []);

	return (
		<>
			<LaunchWindow />
			<Toaster className="pointer-events-auto" />
		</>
	);
}
