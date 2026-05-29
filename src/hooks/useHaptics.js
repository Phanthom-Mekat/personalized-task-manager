import { Haptics, ImpactStyle, NotificationType } from '@capacitor/haptics';

export function useHaptics() {
    const triggerSuccess = async () => {
        try {
            await Haptics.notification({ type: NotificationType.Success });
        } catch (e) {
            try {
                // Fallback to simple vibration for older web/hybrid containers
                await Haptics.vibrate({ duration: 40 });
            } catch (err) {
                // Silent fallback on standard desktop browsers
            }
        }
    };

    const triggerWarning = async () => {
        try {
            await Haptics.notification({ type: NotificationType.Warning });
        } catch (e) {
            try {
                await Haptics.vibrate({ duration: 150 });
            } catch (err) {
                // Silent fallback
            }
        }
    };

    const triggerSelection = async () => {
        try {
            await Haptics.impact({ style: ImpactStyle.Light });
        } catch (e) {
            // Silent fallback
        }
    };

    return { triggerSuccess, triggerWarning, triggerSelection };
}
