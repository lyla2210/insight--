import os from "node:os";

/** 本机局域网 IPv4，供手机在同一 Wi‑Fi 下访问 */
export function getLanIpv4Addresses(): string[] {
  const addresses = new Set<string>();
  const interfaces = os.networkInterfaces();

  for (const ifaces of Object.values(interfaces)) {
    if (!ifaces) continue;
    for (const iface of ifaces) {
      const isIpv4 = String(iface.family) === "IPv4";
      if (isIpv4 && !iface.internal) {
        addresses.add(iface.address);
      }
    }
  }

  return [...addresses];
}

export function printDevServerUrls(port: number) {
  const lan = getLanIpv4Addresses();

  console.log("");
  console.log(`  ➜  Local:   http://localhost:${port}/`);

  if (lan.length === 0) {
    console.log("  ➜  Network: (未检测到局域网 IPv4，请确认已连 Wi‑Fi 且与手机同网段)");
  } else {
    for (const ip of lan) {
      console.log(`  ➜  Network: http://${ip}:${port}/`);
    }
  }

  console.log("");
  console.log("  手机测试: 用浏览器打开上面的 Network 地址（不要用 localhost）");
  console.log("  iOS 摇动检测需通过 Network 地址访问（Safari 对 HTTP 有限制时可用电脑 IP）");
  console.log("");
}
