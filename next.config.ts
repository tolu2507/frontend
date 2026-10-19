import type { NextConfig } from "next";

import { PRIVATE_PATHS } from "./src/config/seo";

const nextConfig: NextConfig = {
  // Logins and dashboards stay out of search results even if someone links to them.
  async headers() {
    return PRIVATE_PATHS.map((path) => ({ source: `${path}/:rest*`, headers: [{ key: "X-Robots-Tag", value: "noindex, nofollow" }] }));
  },
};

export default nextConfig;
