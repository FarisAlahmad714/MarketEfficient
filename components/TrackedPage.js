import { useEffect, useState } from "react";
import { useRouter } from "next/router"; // If using Next.js
import { app } from "../lib/firebase"; // Adjust path to your Firebase config file
import { getAnalytics, logEvent } from "firebase/analytics";

const TrackedPage = ({ children }) => {
  const router = useRouter(); // For Next.js; remove if not applicable
  const [analytics, setAnalytics] = useState(null);

  // Initialize Firebase Analytics
  useEffect(() => {
    if (typeof window !== "undefined") {
      try {
        const analyticsInstance = getAnalytics(app);
        setAnalytics(analyticsInstance);
        console.log("✅ Firebase Analytics initialized successfully");
      } catch (error) {
        console.error("❌ Failed to initialize Firebase Analytics:", error);
      }
    }
  }, []);

  // Log page_view event when the page loads
  useEffect(() => {
    if (analytics && router.isReady) { // router.isReady is Next.js-specific
      const pagePath = router.asPath; // Current URL path
      const pageTitle = document.title; // Current page title
      console.log(`📊 Attempting to log page_view for: ${pagePath}`);
      logEvent(analytics, "page_view", {
        page_path: pagePath,
        page_title: pageTitle,
      });
      console.log(`✅ page_view event logged for: ${pagePath}`);
    } else if (!analytics) {
      console.warn("⚠️ Analytics not initialized yet");
    }
  }, [analytics, router.isReady, router.asPath]); // Dependencies for Next.js

  return children; // Render the wrapped page content
};

export default TrackedPage;