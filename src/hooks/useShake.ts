import { useCallback, useEffect, useRef, useState } from 'react';

export type MotionPermission = 'granted' | 'denied' | 'prompt' | 'unsupported';

interface UseShakeOptions {
  enabled: boolean;
  onShake: () => void;
  /** 加速度变化阈值，越大越不敏感 */
  threshold?: number;
  /** 两次摇动之间的最短间隔（毫秒） */
  cooldownMs?: number;
}

function hasDeviceMotion(): boolean {
  return typeof window !== 'undefined' && 'DeviceMotionEvent' in window;
}

export function needsIosMotionPermission(): boolean {
  return (
    typeof DeviceMotionEvent !== 'undefined' &&
    typeof (DeviceMotionEvent as unknown as { requestPermission?: () => Promise<string> })
      .requestPermission === 'function'
  );
}

function needsIosOrientationPermission(): boolean {
  return (
    typeof DeviceOrientationEvent !== 'undefined' &&
    typeof (DeviceOrientationEvent as unknown as { requestPermission?: () => Promise<string> })
      .requestPermission === 'function'
  );
}

/**
 * 必须在用户点击事件的同步调用链里触发（如 Connect Dice 的 onClick）。
 * iOS 会弹出「“xxx”想要访问您的动作与方向」系统对话框。
 */
export async function requestDeviceMotionPermission(): Promise<MotionPermission> {
  if (!hasDeviceMotion()) return 'unsupported';

  if (!needsIosMotionPermission()) return 'granted';

  try {
    const motionResult = await (
      DeviceMotionEvent as unknown as {
        requestPermission: () => Promise<'granted' | 'denied'>;
      }
    ).requestPermission();

    if (needsIosOrientationPermission()) {
      try {
        await (
          DeviceOrientationEvent as unknown as {
            requestPermission: () => Promise<'granted' | 'denied'>;
          }
        ).requestPermission();
      } catch {
        // 方向权限失败时仍可能已拿到运动权限
      }
    }

    return motionResult === 'granted' ? 'granted' : 'denied';
  } catch {
    return 'denied';
  }
}

export function useShake({
  enabled,
  onShake,
  threshold = 15,
  cooldownMs = 1100,
}: UseShakeOptions) {
  const [permission, setPermission] = useState<MotionPermission>(() => {
    if (!hasDeviceMotion()) return 'unsupported';
    return needsIosMotionPermission() ? 'prompt' : 'granted';
  });

  const lastSample = useRef({ x: 0, y: 0, z: 0 });
  const lastShakeAt = useRef(0);
  const onShakeRef = useRef(onShake);
  onShakeRef.current = onShake;

  const requestPermission = useCallback(async (): Promise<boolean> => {
    const result = await requestDeviceMotionPermission();
    setPermission(result);
    return result === 'granted';
  }, []);

  useEffect(() => {
    if (!enabled || permission !== 'granted' || !hasDeviceMotion()) return;

    const handleMotion = (event: DeviceMotionEvent) => {
      const acc = event.acceleration ?? event.accelerationIncludingGravity;
      if (acc?.x == null || acc.y == null || acc.z == null) return;

      const { x, y, z } = acc;
      const prev = lastSample.current;
      const delta = Math.abs(x - prev.x) + Math.abs(y - prev.y) + Math.abs(z - prev.z);
      lastSample.current = { x, y, z };

      const now = Date.now();
      if (delta < threshold || now - lastShakeAt.current < cooldownMs) return;

      lastShakeAt.current = now;
      onShakeRef.current();
    };

    window.addEventListener('devicemotion', handleMotion);
    return () => window.removeEventListener('devicemotion', handleMotion);
  }, [enabled, permission, threshold, cooldownMs]);

  return {
    isSupported: hasDeviceMotion(),
    needsPermission: needsIosMotionPermission(),
    permission,
    requestPermission,
    isListening: enabled && permission === 'granted',
  };
}
