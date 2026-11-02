import type { User } from "@supabase/supabase-js";

export function OnboardingController(_props: {
	requestNonce: number;
	ready: boolean;
	user: User | null;
	configured: boolean;
	callbackError?: string;
}) {
	return null;
}
