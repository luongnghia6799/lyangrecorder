import type { User } from "@supabase/supabase-js";

export type SignInReason = "account" | "share";

type Props = {
	variant?: "compact" | "wide";
	onboarding?: boolean;
	startWithPermissions?: boolean;
	open: boolean;
	onOpenChange: (open: boolean) => void;
	reason?: SignInReason;
	user: User | null;
	configured: boolean;
	callbackError?: string;
	onAuthenticated: () => void;
};

export function RecordlySignInDialog(_props: Props) {
	return null;
}
