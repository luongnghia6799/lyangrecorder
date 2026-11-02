export const DEFAULT_LOCALE = "vi" as const;

export const SUPPORTED_LOCALES = [
	"vi",
	"en",
	"es",
	"fr",
	"de",
	"it",
	"nl",
	"ko",
	"pt-BR",
	"zh-CN",
	"zh-TW",
] as const;

export const I18N_NAMESPACES = [
	"common",
	"launch",
	"editor",
	"timeline",
	"settings",
	"dialogs",
	"shortcuts",
] as const;

export type AppLocale = (typeof SUPPORTED_LOCALES)[number];
export type I18nNamespace = (typeof I18N_NAMESPACES)[number];
