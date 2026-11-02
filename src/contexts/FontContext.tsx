import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

export type AppFont = "default" | "space-grotesk";

interface FontContextValue {
	font: AppFont;
	setFont: (font: AppFont) => void;
}

const FONT_STORAGE_KEY = "lyang.font";

const FontContext = createContext<FontContextValue>({
	font: "default",
	setFont: () => undefined,
});

export function loadFontPreference(): AppFont {
	try {
		const stored = localStorage.getItem(FONT_STORAGE_KEY);
		if (stored === "space-grotesk") return "space-grotesk";
	} catch {
		// Ignore storage errors
	}
	return "default";
}

export function FontProvider({ children }: { children: ReactNode }) {
	const [font, setFontState] = useState<AppFont>(loadFontPreference);

	const setFont = (newFont: AppFont) => {
		setFontState(newFont);
		try {
			localStorage.setItem(FONT_STORAGE_KEY, newFont);
		} catch {
			// Ignore storage errors
		}
		document.documentElement.dataset.font = newFont;
	};

	useEffect(() => {
		document.documentElement.dataset.font = font;
	}, [font]);

	return <FontContext.Provider value={{ font, setFont }}>{children}</FontContext.Provider>;
}

export function useAppFont() {
	return useContext(FontContext);
}

