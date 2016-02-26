/** if a string is returned that is used as a reason */
type AlertConfig = () => string;

let alerts: AlertConfig[] = [];
window.onbeforeunload = () => {
    const prevents = alerts.map((alert) => alert()).filter(c => !!c);
    if (prevents.length) return prevents[0];
    return undefined; // don't alert
}

/**
 * Adds an alert check
 */
export const addCheck = (config: AlertConfig) => {
    alerts.push(config);
    return () => alerts = alerts.filter(alert => alert !== config);
}
