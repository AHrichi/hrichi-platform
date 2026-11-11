/**
 * A name for this device to suggest when pairing ("Android phone",
 * "Windows PC"), so the owner can tell devices apart in Telegram and in
 * the devices list. The owner can change it.
 */
export function guessDeviceName(userAgent: string): string {
  const ua = userAgent.toLowerCase();
  if (ua.includes('android')) {
    return ua.includes('mobile') ? 'Android phone' : 'Android tablet';
  }
  if (ua.includes('iphone')) return 'iPhone';
  if (ua.includes('ipad')) return 'iPad';
  if (ua.includes('windows')) return 'Windows PC';
  if (ua.includes('mac os')) return 'Mac';
  if (ua.includes('cros')) return 'Chromebook';
  if (ua.includes('linux')) return 'Linux PC';
  return 'This device';
}
