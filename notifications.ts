export async function scheduleLocalTripNotification(
  title: string,
  body: string,
  at: Date
) {
  if (typeof window === "undefined") return false;

  try {
    const { LocalNotifications } = await import("@capacitor/local-notifications");
    const permission = await LocalNotifications.requestPermissions();
    if (permission.display !== "granted") return false;

    await LocalNotifications.schedule({
      notifications: [{
        id: Math.floor(Date.now() % 2147483647),
        title,
        body,
        schedule: { at },
        extra: { type: "trip-reminder" }
      }]
    });
    return true;
  } catch {
    return false;
  }
}
